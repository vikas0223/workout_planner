'use client';

/**
 * useChallenges Hook
 * Reactive state and dynamic progress evaluation for Platform Challenges and Participation.
 */

import { useState, useEffect, useCallback } from 'react';
import { Challenge, ChallengeProgress } from '@/types/domain';
import { ChallengeService, EvaluatedChallengeProgress } from '@/lib/domain/challenge-service';
import { LocalChallengeRepository, LocalCompletionRepository } from '@/lib/repositories/local';
import { ProgressInvalidationBus } from '@/lib/events/progress-invalidation-bus';

export function useChallenges(userId?: string) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [participations, setParticipations] = useState<ChallengeProgress[]>([]);
  const [evaluatedChallenges, setEvaluatedChallenges] = useState<EvaluatedChallengeProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const challengeRepo = new LocalChallengeRepository();
  const completionRepo = new LocalCompletionRepository();

  const loadData = useCallback(async () => {
    try {
      const [chalList, partList, sessions] = await Promise.all([
        challengeRepo.listChallenges(),
        challengeRepo.listUserParticipations(userId),
        completionRepo.listSessions(userId),
      ]);

      setChallenges(chalList);
      setParticipations(partList);

      const evaluated = ChallengeService.evaluateAllChallenges(chalList, partList, sessions);
      setEvaluatedChallenges(evaluated);
    } catch (err) {
      console.error('[useChallenges] Error loading challenges:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();

    const bus = ProgressInvalidationBus.getInstance();
    const unsubscribe = bus.subscribe((event) => {
      if (
        event.type === 'challenge_changed' ||
        event.type === 'session_changed' ||
        event.type === 'set_changed' ||
        event.type === 'sync_applied'
      ) {
        loadData();
      }
    });

    return () => unsubscribe();
  }, [loadData]);

  const joinChallenge = async (challengeId: string) => {
    const existing = participations.find((p) => p.challengeId === challengeId);
    const now = new Date().toISOString();

    const progress: ChallengeProgress = {
      id: existing?.id || `cp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      challengeId,
      userId,
      status: 'active',
      joinedAt: existing?.joinedAt || now,
      updatedAt: now,
    };

    await challengeRepo.saveChallengeProgress(progress);
    await loadData();
  };

  const leaveChallenge = async (challengeId: string) => {
    const existing = participations.find((p) => p.challengeId === challengeId);
    if (existing) {
      const now = new Date().toISOString();
      const updated: ChallengeProgress = {
        ...existing,
        status: 'abandoned',
        updatedAt: now,
      };
      await challengeRepo.saveChallengeProgress(updated);
      await loadData();
    }
  };

  return {
    challenges,
    participations,
    evaluatedChallenges,
    loading,
    joinChallenge,
    leaveChallenge,
    refresh: loadData,
  };
}
