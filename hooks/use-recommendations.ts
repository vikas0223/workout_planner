/**
 * React Hook for Deterministic Recommendations
 *
 * Features:
 * - Hydrates RecommendationContext purely from local canonical repositories.
 * - Generates deterministic recommendations via DeterministicRecommendationEngine.
 * - Reactive invalidation listening to ProgressInvalidationBus.
 * - Dispatches RecommendationEvent tracking (shown, accepted, dismissed, completed).
 * - Implements instant UI dismissal with local cooldown persistence.
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  DeterministicRecommendation,
  RecommendationCategory,
  RecommendationContext,
  DeterministicRecommendationEngine,
} from '@/lib/domain/recommendations';
import {
  LocalUserRepository,
  LocalCompletionRepository,
  LocalProgramRepository,
  LocalGoalRepository,
  LocalChallengeRepository,
  LocalRecommendationRepository,
} from '@/lib/repositories/local';
import { ProgressAnalyticsService } from '@/lib/domain/progress-analytics';
import { ProgressInvalidationBus } from '@/lib/events/progress-invalidation-bus';
import { RecommendationEvent } from '@/types/domain';

export interface UseRecommendationsOptions {
  userId?: string;
  limit?: number;
  categoryFilter?: RecommendationCategory;
  autoRecordShown?: boolean;
}

export function useRecommendations({
  userId = 'guest_user',
  limit = 5,
  categoryFilter,
  autoRecordShown = true,
}: UseRecommendationsOptions = {}) {
  const [recommendations, setRecommendations] = useState<DeterministicRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const recordedShownFingerprintsRef = useRef<Set<string>>(new Set());

  const userRepo = useMemo(() => new LocalUserRepository(), []);
  const completionRepo = useMemo(() => new LocalCompletionRepository(), []);
  const programRepo = useMemo(() => new LocalProgramRepository(), []);
  const goalRepo = useMemo(() => new LocalGoalRepository(), []);
  const challengeRepo = useMemo(() => new LocalChallengeRepository(), []);
  const recRepo = useMemo(() => new LocalRecommendationRepository(), []);

  const loadRecommendations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Hydrate canonical records in parallel
      const [
        profile,
        sessions,
        activeProgram,
        goals,
        challenges,
        participations,
        recentEvents,
        dismissedFingerprints,
      ] = await Promise.all([
        userRepo.getProfile(userId),
        completionRepo.listSessions(userId),
        programRepo.getActiveProgram(userId),
        goalRepo.listGoals(userId),
        challengeRepo.listChallenges(),
        challengeRepo.listUserParticipations(userId),
        recRepo.listEvents(userId, 50),
        recRepo.getDismissedFingerprints(userId),
      ]);

      // Derive analytics from canonical sessions
      const progressMetrics = ProgressAnalyticsService.computeMetrics(
        sessions,
        '30d',
        undefined,
        3,
        new Date()
      );

      // Construct pure RecommendationContext
      const context: RecommendationContext = {
        userId,
        userProfile: profile,
        trainingPreferences: profile ? { preferredEquipment: profile.preferredEquipment } : null,
        constraints: profile?.avoidedJoints?.length ? ['low_impact'] : [],
        recentSessions: sessions,
        goals: goals.filter((g) => g.status === 'active'),
        activeProgram,
        progressMetrics,
        challenges: challenges.map((c) => ({
          challenge: c,
          progress: participations.find((p) => p.challengeId === c.id) || {
            id: `prog_${c.id}`,
            challengeId: c.id,
            userId,
            status: 'active',
            joinedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        })),
        recentEvents,
        dismissedFingerprints,
        currentTime: new Date().toISOString(),
      };

      const generated = DeterministicRecommendationEngine.generateRecommendations(context, {
        limit,
        categoryFilter,
      });

      setRecommendations(generated);

      // Optionally record 'shown' events for telemetry (deduplicated by fingerprint)
      if (autoRecordShown && generated.length > 0) {
        for (const rec of generated) {
          if (recordedShownFingerprintsRef.current.has(rec.fingerprint)) {
            continue;
          }
          recordedShownFingerprintsRef.current.add(rec.fingerprint);
          const event: RecommendationEvent = {
            id: `recevt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            userId,
            recommendationType: rec.category,
            entityId: rec.fingerprint,
            action: 'shown',
            score: rec.score,
            createdAt: new Date().toISOString(),
          };
          // Fire-and-forget local event write
          recRepo.saveEvent(event, userId === 'guest_user' ? 'guest' : 'user', userId).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('[useRecommendations] Error loading recommendations:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [
    userId,
    limit,
    categoryFilter,
    autoRecordShown,
    userRepo,
    completionRepo,
    programRepo,
    goalRepo,
    challengeRepo,
    recRepo,
  ]);

  // Initial load & reactive subscription
  useEffect(() => {
    loadRecommendations();

    const bus = ProgressInvalidationBus.getInstance();
    const unsub = bus.subscribe((evt) => {
      if (['session_changed', 'feedback_changed', 'sync_applied'].includes(evt.type)) {
        loadRecommendations();
      }
    });

    return () => {
      unsub();
    };
  }, [loadRecommendations]);

  /**
   * Records an interaction action (accepted, dismissed, rated, shown).
   */
  const recordAction = useCallback(
    async (
      recommendation: DeterministicRecommendation,
      action: 'accepted' | 'dismissed' | 'rated' | 'shown'
    ) => {
      const event: RecommendationEvent = {
        id: `recevt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId,
        recommendationType: recommendation.category,
        entityId: recommendation.fingerprint,
        action,
        score: recommendation.score,
        createdAt: new Date().toISOString(),
      };

      await recRepo.saveEvent(event, userId === 'guest_user' ? 'guest' : 'user', userId);
    },
    [userId, recRepo]
  );

  /**
   * Dismisses a recommendation immediately from state and records the cooldown event.
   */
  const dismissRecommendation = useCallback(
    async (recommendation: DeterministicRecommendation) => {
      setRecommendations((prev) => prev.filter((r) => r.fingerprint !== recommendation.fingerprint));
      await recordAction(recommendation, 'dismissed');
    },
    [recordAction]
  );

  /**
   * Accepts a recommendation and records acceptance.
   */
  const acceptRecommendation = useCallback(
    async (recommendation: DeterministicRecommendation) => {
      await recordAction(recommendation, 'accepted');
    },
    [recordAction]
  );

  return {
    recommendations,
    primaryRecommendation: recommendations[0] || null,
    isLoading,
    error,
    refresh: loadRecommendations,
    dismissRecommendation,
    acceptRecommendation,
  };
}
