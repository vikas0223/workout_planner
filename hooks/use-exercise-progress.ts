/**
 * useExerciseProgress Hook
 *
 * Provides focused progression analytics for an individual exercise:
 * - Load / weight progression over time
 * - Estimated 1RM trend
 * - Volume progression
 * - Repetition trend
 * - Personal records for this exercise
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { LocalCompletionRepository } from '@/lib/repositories/local/local-completion-repository';
import {
  PersonalRecordService,
  PRProgressionPoint,
  ExercisePersonalRecords,
} from '@/lib/domain/personal-records';
import {
  ProgressInvalidationBus,
  ProgressInvalidationEvent,
} from '@/lib/events/progress-invalidation-bus';

export interface UseExerciseProgressResult {
  isLoading: boolean;
  error: Error | null;
  exerciseId: string;
  progressionPoints: PRProgressionPoint[];
  records: ExercisePersonalRecords | null;
  totalSets: number;
  totalVolumeKg: number;
  refresh: () => Promise<void>;
}

export function useExerciseProgress(exerciseId: string): UseExerciseProgressResult {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [progressionPoints, setProgressionPoints] = useState<PRProgressionPoint[]>([]);
  const [records, setRecords] = useState<ExercisePersonalRecords | null>(null);
  const [totalSets, setTotalSets] = useState<number>(0);
  const [totalVolumeKg, setTotalVolumeKg] = useState<number>(0);

  const completionRepoRef = useRef<LocalCompletionRepository | null>(null);
  if (!completionRepoRef.current) {
    completionRepoRef.current = new LocalCompletionRepository();
  }

  const loadProgress = useCallback(async () => {
    if (!exerciseId) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const repo = completionRepoRef.current;
      if (!repo) return;

      const sessions = await repo.listSessions();

      // Compute progression points
      const points = PersonalRecordService.getExerciseProgression(sessions, exerciseId);
      setProgressionPoints(points);

      // Compute PRs
      const allPRs = PersonalRecordService.computePersonalRecords(sessions);
      const exercisePRs = allPRs[exerciseId] || null;
      setRecords(exercisePRs);

      // Aggregate volume and sets
      let setsCount = 0;
      let volKg = 0;
      points.forEach((p) => {
        setsCount += 1;
        volKg += p.unit === 'lbs' ? p.volume * 0.45359237 : p.volume;
      });

      setTotalSets(setsCount);
      setTotalVolumeKg(Math.round(volKg));
    } catch (err: any) {
      console.error(`[useExerciseProgress] Error loading progress for exercise ${exerciseId}:`, err);
      setError(err instanceof Error ? err : new Error('Failed to load exercise progress'));
    } finally {
      setIsLoading(false);
    }
  }, [exerciseId]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // Reactive invalidation
  useEffect(() => {
    const bus = ProgressInvalidationBus.getInstance();
    const handleInvalidation = (event: ProgressInvalidationEvent) => {
      loadProgress();
    };

    const unsubscribe = bus.subscribe(handleInvalidation);
    return () => unsubscribe();
  }, [loadProgress]);

  return {
    isLoading,
    error,
    exerciseId,
    progressionPoints,
    records,
    totalSets,
    totalVolumeKg,
    refresh: loadProgress,
  };
}
