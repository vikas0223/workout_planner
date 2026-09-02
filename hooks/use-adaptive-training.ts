/**
 * React Hook for Deterministic Adaptive Training
 * 
 * Evaluates staged workouts, drafts, or program templates against canonical
 * local history and produces explainable adaptation decisions.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  WorkoutAdaptationDecision,
  AdaptiveContext,
  DeterministicAdaptiveEngine,
} from '@/lib/domain/adaptive';
import {
  LocalCompletionRepository,
  LocalGoalRepository,
  LocalUserRepository,
} from '@/lib/repositories/local';
import {
  GeneratedWorkout,
  WorkoutTemplate,
  WorkoutSession,
} from '@/types/domain';
import { WorkoutDraft } from '@/lib/domain/workout-draft';
import { ProgressInvalidationBus } from '@/lib/events/progress-invalidation-bus';

export interface UseAdaptiveTrainingOptions {
  workoutPlan: GeneratedWorkout | WorkoutTemplate | WorkoutDraft | null;
  workoutSource?: 'generated' | 'template' | 'program_day' | 'draft';
  sourceEntityId?: string;
  userId?: string;
  programContext?: AdaptiveContext['programContext'];
}

export function useAdaptiveTraining({
  workoutPlan,
  workoutSource = 'generated',
  sourceEntityId,
  userId = 'guest_user',
  programContext,
}: UseAdaptiveTrainingOptions) {
  const [decision, setDecision] = useState<WorkoutAdaptationDecision | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const completionRepo = useMemo(() => new LocalCompletionRepository(), []);
  const goalRepo = useMemo(() => new LocalGoalRepository(), []);
  const userRepo = useMemo(() => new LocalUserRepository(), []);

  const evaluateAdaptations = useCallback(async () => {
    if (!workoutPlan || !workoutPlan.exercises || workoutPlan.exercises.length === 0) {
      setDecision(null);
      return;
    }

    try {
      setIsLoading(true);
      const [sessions, goals, profile] = await Promise.all([
        completionRepo.listSessions(userId),
        goalRepo.listGoals(userId),
        userRepo.getProfile(userId).then((p) => p || userRepo.getCurrentGuestProfile()),
      ]);

      const nowIso = new Date().toISOString();
      const context: AdaptiveContext = {
        userId,
        evaluationDate: nowIso,
        workoutPlan,
        workoutSource,
        sourceEntityId,
        programContext,
        recentSessions: sessions || [],
        activeGoals: (goals || []).filter((g: any) => g.status === 'active'),
        preferences: profile
          ? {
              preferredEquipment: profile.preferredEquipment,
              avoidedMuscles: profile.avoidedMuscles,
              avoidedJoints: profile.avoidedJoints,
            }
          : undefined,
      };

      const result = DeterministicAdaptiveEngine.evaluateWorkout(context);
      setDecision(result);
    } catch (err) {
      console.warn('Adaptive evaluation encountered error:', err);
      setDecision(null);
    } finally {
      setIsLoading(false);
    }
  }, [workoutPlan, workoutSource, sourceEntityId, userId, programContext, completionRepo, goalRepo, userRepo]);

  useEffect(() => {
    evaluateAdaptations();
  }, [evaluateAdaptations]);

  // Subscribe to progress invalidation bus (e.g. if new sessions completed)
  useEffect(() => {
    const bus = ProgressInvalidationBus.getInstance();
    const unsubscribe = bus.subscribe(() => {
      evaluateAdaptations();
    });
    return () => unsubscribe();
  }, [evaluateAdaptations]);

  /**
   * Applies accepted adaptations to a workout or draft, returning an adapted clone.
   */
  const applyAdaptations = useCallback(
    <T extends GeneratedWorkout | WorkoutTemplate | WorkoutDraft>(original: T): T => {
      if (!decision || !decision.hasAdaptations || decision.exerciseProposals.length === 0) {
        return original;
      }

      const clone = JSON.parse(JSON.stringify(original)) as T;
      const proposalsMap = new Map(decision.exerciseProposals.map((p) => [p.exerciseId, p]));

      clone.exercises = (clone.exercises as any[]).map((ex: any) => {
        const exId = ex.exerciseId || ex.id;
        const proposal = proposalsMap.get(exId);
        if (!proposal) return ex;

        const adapted = proposal.adaptedPrescription;
        const noteTag = `[Adaptive: ${proposal.rationale}]`;

        return {
          ...ex,
          exerciseId: adapted.variationExerciseId || exId,
          name: adapted.variationName || ex.name,
          sets: adapted.sets,
          reps: String(adapted.reps),
          rest: adapted.restSeconds !== undefined ? String(adapted.restSeconds) : ex.rest,
          notes: ex.notes ? `${ex.notes} • ${noteTag}` : noteTag,
        };
      });

      return clone;
    },
    [decision]
  );

  return {
    decision,
    isLoading,
    applyAdaptations,
    reEvaluate: evaluateAdaptations,
  };
}
