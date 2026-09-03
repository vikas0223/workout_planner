/**
 * useDashboard Hook
 *
 * Rules:
 * - Local-first authority: queries IndexedDB directly via LocalCompletionRepository.
 * - Reactive: subscribes to ProgressInvalidationBus (local events + cross-tab BroadcastChannel).
 * - Coalesces / debounces rapid invalidation events before running analytics computations.
 * - Offline resilient: works 100% without network connection and tracks network status.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { WorkoutSession } from '@/types/domain';
import { LocalCompletionRepository } from '@/lib/repositories/local/local-completion-repository';
import {
  ProgressPeriod,
  DateRange,
  ProgressPeriodService,
} from '@/lib/domain/progress-period';
import {
  ProgressAnalyticsService,
  AggregatedProgressMetrics,
} from '@/lib/domain/progress-analytics';
import {
  PersonalRecordService,
  ExercisePersonalRecords,
} from '@/lib/domain/personal-records';
import {
  ProgressInvalidationBus,
  ProgressInvalidationEvent,
} from '@/lib/events/progress-invalidation-bus';

export interface UseDashboardResult {
  isLoading: boolean;
  isOffline: boolean;
  error: Error | null;
  period: ProgressPeriod;
  setPeriod: (period: ProgressPeriod) => void;
  customRange?: { startDate?: string; endDate?: string };
  setCustomRange: (range?: { startDate?: string; endDate?: string }) => void;
  weeklyTarget: number;
  setWeeklyTarget: (target: number) => void;
  metrics: AggregatedProgressMetrics | null;
  personalRecords: Record<string, ExercisePersonalRecords>;
  rawSessions: WorkoutSession[];
  refresh: () => Promise<void>;
}

export function useDashboard(
  initialPeriod: ProgressPeriod = '30d',
  initialWeeklyTarget: number = 4
): UseDashboardResult {
  const [period, setPeriod] = useState<ProgressPeriod>(initialPeriod);
  const [customRange, setCustomRange] = useState<{ startDate?: string; endDate?: string } | undefined>(undefined);
  const [weeklyTarget, setWeeklyTarget] = useState<number>(initialWeeklyTarget);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [rawSessions, setRawSessions] = useState<WorkoutSession[]>([]);
  const [metrics, setMetrics] = useState<AggregatedProgressMetrics | null>(null);
  const [personalRecords, setPersonalRecords] = useState<Record<string, ExercisePersonalRecords>>({});
  const [isOffline, setIsOffline] = useState<boolean>(false);

  const completionRepoRef = useRef<LocalCompletionRepository | null>(null);
  if (!completionRepoRef.current) {
    completionRepoRef.current = new LocalCompletionRepository();
  }

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch & Compute Data
  const loadData = useCallback(async () => {
    try {
      setError(null);
      const repo = completionRepoRef.current;
      if (!repo) return;

      // Query sessions from local IndexedDB authority
      const sessions = await repo.listSessions();
      setRawSessions(sessions);

      // Derive metrics dynamically
      const computedMetrics = ProgressAnalyticsService.computeMetrics(
        sessions,
        period,
        customRange,
        weeklyTarget,
        new Date()
      );
      setMetrics(computedMetrics);

      // Derive personal records dynamically
      const computedPRs = PersonalRecordService.computePersonalRecords(sessions);
      setPersonalRecords(computedPRs);
    } catch (err: any) {
      console.error('[useDashboard] Failed to load dashboard data:', err);
      setError(err instanceof Error ? err : new Error('Failed to load dashboard metrics'));
    } finally {
      setIsLoading(false);
    }
  }, [period, customRange, weeklyTarget]);

  // 2. Initial load and period changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 3. Reactive invalidation subscription (local + cross-tab)
  useEffect(() => {
    const bus = ProgressInvalidationBus.getInstance();

    const handleInvalidation = (event: ProgressInvalidationEvent) => {
      // Coalesce / debounce rapid invalidations within 120ms
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        loadData();
      }, 120);
    };

    const unsubscribe = bus.subscribe(handleInvalidation);

    return () => {
      unsubscribe();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [loadData]);

  // 4. Online/Offline Network Status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      setIsOffline(!navigator.onLine);
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isLoading,
    isOffline,
    error,
    period,
    setPeriod,
    customRange,
    setCustomRange,
    weeklyTarget,
    setWeeklyTarget,
    metrics,
    personalRecords,
    rawSessions,
    refresh: loadData,
  };
}
