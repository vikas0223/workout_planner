/**
 * Deterministic Recommendation Engine (Pure Domain Service)
 *
 * Requirements:
 * - 100% pure function receiving RecommendationContext.
 * - Zero direct I/O, IndexedDB, Supabase, React, HTTP, or browser APIs.
 * - Hard constraints applied BEFORE scoring (violating candidates eliminated).
 * - Preferences act as positive ranking weights, never overriding constraints.
 * - Deterministic fingerprint generation for deduplication and cooldown.
 * - Versioned with RECOMMENDATION_ENGINE_VERSION.
 */

import {
  DeterministicRecommendation,
  RecommendationContext,
  RecommendationCategory,
  RecommendationRuleResult,
  RecommendationScoreBreakdown,
  RECOMMENDATION_ENGINE_VERSION,
} from './recommendation-types';
import { RecommendationRules } from './recommendation-rules';
import { TrainingConstraint, RecommendationEvent } from '@/types/domain';

// Named Scoring Weights
export const WEIGHT_GOAL_ALIGNMENT = 30;
export const WEIGHT_PERFORMANCE = 25;
export const WEIGHT_PREFERENCE = 20;
export const WEIGHT_CONSISTENCY = 15;
export const WEIGHT_RECENCY = 10;

// Cooldown Constants
export const DEFAULT_GENERAL_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
export const WORKOUT_SESSION_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours

export class DeterministicRecommendationEngine {
  /**
   * Generates a ranked, deduplicated, constraint-filtered list of deterministic recommendations.
   */
  public static generateRecommendations(
    context: RecommendationContext,
    options?: { limit?: number; categoryFilter?: RecommendationCategory }
  ): DeterministicRecommendation[] {
    const limit = options?.limit ?? 5;
    const engineVersion = context.engineVersion || RECOMMENDATION_ENGINE_VERSION;
    const now = context.currentTime || new Date().toISOString();

    // 1. Gather raw candidates from all rule evaluators
    const rawResults: RecommendationRuleResult[] = [
      ...RecommendationRules.evaluateProgramProgression(context),
      ...RecommendationRules.evaluateLoadProgression(context),
      ...RecommendationRules.evaluateLoadReduction(context),
      ...RecommendationRules.evaluateSubstitutionPreference(context),
      ...RecommendationRules.evaluateMuscleBalance(context),
      ...RecommendationRules.evaluateConsistency(context),
      ...RecommendationRules.evaluateRecovery(context),
      ...RecommendationRules.evaluateGoalAlignment(context),
    ];

    const eligibleResults = rawResults.filter((r) => r.eligible && r.candidate);

    // 2. HARD CONSTRAINTS FILTERING (Applied strictly before scoring)
    const constraints = context.constraints || context.trainingPreferences?.constraints || [];
    const constraintFiltered = eligibleResults.filter((r) => {
      if (!r.candidate) return false;
      return this.satisfiesHardConstraints(r.candidate, constraints);
    });

    // 3. Score candidates with explicit weights and preference signals
    const scoredCandidates: DeterministicRecommendation[] = constraintFiltered.map((r) => {
      const candidate = r.candidate!;
      const scoreBreakdown = this.calculateScoreBreakdown(candidate, r.scoreBreakdown, context);
      const { suggestedWeightDeltaKg, suggestedRepsTarget, ...stablePayload } = (candidate.actionPayload || {}) as any;
      const fingerprint = this.generateFingerprint(
        engineVersion,
        candidate.category,
        candidate.ruleId,
        candidate.targetEntityId || 'global',
        JSON.stringify(stablePayload)
      );

      return {
        ...candidate,
        id: fingerprint,
        fingerprint,
        score: scoreBreakdown.total,
        scoreBreakdown,
        createdAt: now,
      };
    });

    // 4. Filter by category if requested
    let filtered = scoredCandidates;
    if (options?.categoryFilter) {
      filtered = filtered.filter((c) => c.category === options.categoryFilter);
    }

    // 5. Cooldown & Dismissal Suppression
    const dismissedSet = context.dismissedFingerprints || new Set<string>();
    const activeEvents = context.recentEvents || [];
    const cooldownFiltered = filtered.filter((candidate) => {
      // Check if dismissed
      if (dismissedSet.has(candidate.fingerprint)) {
        return false;
      }

      // Select the newest matching shown or dismissed event for this candidate
      let recentShown: RecommendationEvent | null = null;
      for (const e of activeEvents) {
        if (e.entityId === candidate.fingerprint && (e.action === 'shown' || e.action === 'dismissed')) {
          if (!recentShown || new Date(e.createdAt).getTime() > new Date(recentShown.createdAt).getTime()) {
            recentShown = e;
          }
        }
      }

      if (recentShown) {
        const eventTime = new Date(recentShown.createdAt).getTime();
        const currentTime = new Date(now).getTime();
        const cooldown =
          candidate.category === 'progress_load' || candidate.category === 'reduce_load'
            ? WORKOUT_SESSION_COOLDOWN_MS
            : DEFAULT_GENERAL_COOLDOWN_MS;

        if (currentTime - eventTime < cooldown) {
          return false;
        }
      }

      return true;
    });

    // 6. Deduplicate by fingerprint
    const seenFingerprints = new Set<string>();
    const deduplicated: DeterministicRecommendation[] = [];

    for (const item of cooldownFiltered) {
      if (!seenFingerprints.has(item.fingerprint)) {
        seenFingerprints.add(item.fingerprint);
        deduplicated.push(item);
      }
    }

    // 7. Rank descending by total score
    deduplicated.sort((a, b) => b.score - a.score);

    return deduplicated.slice(0, limit);
  }

  /**
   * Evaluates whether a candidate satisfies all active hard constraints.
   * If a candidate violates even one constraint, it returns false.
   */
  private static satisfiesHardConstraints(
    candidate: Omit<DeterministicRecommendation, 'id' | 'fingerprint' | 'score' | 'scoreBreakdown' | 'createdAt'>,
    constraints: TrainingConstraint[]
  ): boolean {
    if (!constraints || constraints.length === 0) return true;

    const equipment = candidate.targetEquipment || [];

    for (const constraint of constraints) {
      switch (constraint) {
        case 'bodyweight_only': {
          const requiresNonBodyweight = equipment.some(
            (eq) => !eq.toLowerCase().includes('bodyweight') && eq.toLowerCase() !== 'none'
          );
          if (requiresNonBodyweight) {
            return false;
          }
          break;
        }
        case 'home_only': {
          const requiresCommercialGym = equipment.some(
            (eq) =>
              eq.toLowerCase().includes('barbell') ||
              eq.toLowerCase().includes('cable') ||
              eq.toLowerCase().includes('machine') ||
              eq.toLowerCase().includes('smith')
          );
          if (requiresCommercialGym) {
            return false;
          }
          break;
        }
        case 'quiet':
        case 'no_jump': {
          const name = candidate.title.toLowerCase() + ' ' + candidate.description.toLowerCase();
          if (name.includes('jump') || name.includes('burpee') || name.includes('plyometric')) {
            return false;
          }
          break;
        }
        case 'limited_space': {
          const name = candidate.title.toLowerCase() + ' ' + candidate.description.toLowerCase();
          if (name.includes('lunge walk') || name.includes('shuttle') || name.includes('sprint')) {
            return false;
          }
          break;
        }
      }
    }

    return true;
  }

  /**
   * Calculates the scoring breakdown for a candidate based on named weights and user preferences.
   */
  private static calculateScoreBreakdown(
    candidate: Omit<DeterministicRecommendation, 'id' | 'fingerprint' | 'score' | 'scoreBreakdown' | 'createdAt'>,
    baseBreakdown: Partial<RecommendationScoreBreakdown> | undefined,
    context: RecommendationContext
  ): RecommendationScoreBreakdown {
    const goalScore = Math.min(WEIGHT_GOAL_ALIGNMENT, baseBreakdown?.goalAlignment ?? 20);
    const perfScore = Math.min(WEIGHT_PERFORMANCE, baseBreakdown?.performance ?? 20);
    let prefScore = Math.min(WEIGHT_PREFERENCE, baseBreakdown?.preference ?? 15);
    const consistencyScore = Math.min(WEIGHT_CONSISTENCY, baseBreakdown?.consistency ?? 15);
    const recencyScore = Math.min(WEIGHT_RECENCY, baseBreakdown?.recency ?? 10);

    // Apply preference boosts (e.g. preferred equipment or muscle groups)
    const userEquipment = context.userProfile?.preferredEquipment || context.trainingPreferences?.preferredEquipment || [];
    if (candidate.targetEquipment && candidate.targetEquipment.some((eq) => userEquipment.includes(eq))) {
      prefScore = Math.min(WEIGHT_PREFERENCE, prefScore + 5);
    }

    const userMuscles = context.userProfile?.preferredMuscleGroups || [];
    if (candidate.targetMuscleGroups && candidate.targetMuscleGroups.some((m) => userMuscles.includes(m))) {
      prefScore = Math.min(WEIGHT_PREFERENCE, prefScore + 5);
    }

    const total = goalScore + perfScore + prefScore + consistencyScore + recencyScore;

    return {
      goalAlignment: goalScore,
      performance: perfScore,
      preference: prefScore,
      consistency: consistencyScore,
      recency: recencyScore,
      total: Math.min(100, Math.max(0, total)),
    };
  }

  /**
   * Generates a deterministic hash fingerprint for identical candidate grouping and cooldown tracking.
   */
  public static generateFingerprint(
    version: string,
    category: string,
    ruleId: string,
    entityId: string,
    actionPayloadStr: string
  ): string {
    const raw = `${version}:${category}:${ruleId}:${entityId}:${actionPayloadStr}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `rec_${category.slice(0, 4)}_${hex}`;
  }
}
