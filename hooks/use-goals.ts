'use client';

/**
 * useGoals Hook
 * Reactive state and dynamic progress evaluation for FitnessGoalTargets.
 */

import { useState, useEffect, useCallback } from 'react';
import { FitnessGoalTarget } from '@/types/domain';
import { GoalService, EvaluatedGoalProgress } from '@/lib/domain/goal-service';
import { LocalGoalRepository, LocalCompletionRepository } from '@/lib/repositories/local';
import { ProgressInvalidationBus } from '@/lib/events/progress-invalidation-bus';

export function useGoals(userId?: string) {
  const [goals, setGoals] = useState<FitnessGoalTarget[]>([]);
  const [evaluatedGoals, setEvaluatedGoals] = useState<EvaluatedGoalProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const goalRepo = new LocalGoalRepository();
  const completionRepo = new LocalCompletionRepository();

  const loadData = useCallback(async () => {
    try {
      const [list, sessions] = await Promise.all([
        goalRepo.listGoals(userId),
        completionRepo.listSessions(userId),
      ]);
      setGoals(list);

      const evaluated = GoalService.evaluateAllGoals(list, sessions);
      setEvaluatedGoals(evaluated);
    } catch (err) {
      console.error('[useGoals] Error loading goals:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();

    const bus = ProgressInvalidationBus.getInstance();
    const unsubscribe = bus.subscribe((event) => {
      if (
        event.type === 'goal_changed' ||
        event.type === 'session_changed' ||
        event.type === 'set_changed' ||
        event.type === 'sync_applied'
      ) {
        loadData();
      }
    });

    return () => unsubscribe();
  }, [loadData]);

  const saveGoal = async (goal: FitnessGoalTarget) => {
    await goalRepo.saveGoal(goal);
    await loadData();
  };

  const deleteGoal = async (id: string) => {
    await goalRepo.deleteGoal(id);
    await loadData();
  };

  return {
    goals,
    evaluatedGoals,
    loading,
    saveGoal,
    deleteGoal,
    refresh: loadData,
  };
}
