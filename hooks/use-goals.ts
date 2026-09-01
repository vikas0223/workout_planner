'use client';

/**
 * useGoals Hook
 * Reactive state and dynamic progress evaluation for FitnessGoalTargets.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { FitnessGoalTarget, BodyMetricEntry } from '@/types/domain';
import { GoalService, EvaluatedGoalProgress } from '@/lib/domain/goal-service';
import { LocalGoalRepository, LocalCompletionRepository, LocalUserRepository } from '@/lib/repositories/local';
import { ProgressInvalidationBus } from '@/lib/events/progress-invalidation-bus';

export function useGoals(userId?: string) {
  const [goals, setGoals] = useState<FitnessGoalTarget[]>([]);
  const [evaluatedGoals, setEvaluatedGoals] = useState<EvaluatedGoalProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const goalRepo = useMemo(() => new LocalGoalRepository(), []);
  const completionRepo = useMemo(() => new LocalCompletionRepository(), []);
  const userRepo = useMemo(() => new LocalUserRepository(), []);
  const currentReqRef = useRef(0);

  const loadData = useCallback(async () => {
    const reqId = ++currentReqRef.current;
    try {
      const [list, sessions, profile] = await Promise.all([
        goalRepo.listGoals(userId),
        completionRepo.listSessions(userId),
        userId ? userRepo.getProfile(userId) : userRepo.getCurrentGuestProfile(),
      ]);
      if (reqId !== currentReqRef.current) return;
      setGoals(list);

      const bodyMetrics: BodyMetricEntry[] = profile?.weight
        ? [
            {
              id: `bm_profile_${profile.id}`,
              userId: profile.id,
              date: profile.updatedAt || new Date().toISOString(),
              weight: profile.weight,
              weightUnit: profile.weightUnit || 'kg',
              createdAt: profile.createdAt || new Date().toISOString(),
            },
          ]
        : [];

      const evaluated = GoalService.evaluateAllGoals(list, sessions, bodyMetrics);
      if (reqId !== currentReqRef.current) return;
      setEvaluatedGoals(evaluated);
    } catch (err) {
      if (reqId === currentReqRef.current) {
        console.error('[useGoals] Error loading goals:', err);
      }
    } finally {
      if (reqId === currentReqRef.current) {
        setLoading(false);
      }
    }
  }, [userId, goalRepo, completionRepo, userRepo]);

  useEffect(() => {
    setLoading(true);
    setGoals([]);
    setEvaluatedGoals([]);
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

    return () => {
      unsubscribe();
    };
  }, [userId, loadData]);

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
