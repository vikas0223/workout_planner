'use client';

/**
 * Workout Session React Hook
 * Connects UI components to SessionCommandService cleanly without direct storage/database manipulation.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  WorkoutSession,
  SessionExercise,
  WorkoutSet,
  PreviousPerformanceSummary,
} from '@/types/domain';
import { SessionCommandService } from './session-command-service';
import {
  StartSessionInput,
  LogSetInput,
  UpdateSetInput,
  SubstituteExerciseInput,
  CompleteSessionOptions,
} from './session-commands.types';

export interface UseWorkoutSessionResult {
  session: WorkoutSession | null;
  isLoading: boolean;
  error: Error | null;
  startSession: (input: StartSessionInput) => Promise<WorkoutSession>;
  logSet: (input: Omit<LogSetInput, 'sessionId'>) => Promise<WorkoutSet>;
  updateSet: (input: Omit<UpdateSetInput, 'sessionId'>) => Promise<WorkoutSet>;
  deleteSet: (sessionExerciseId: string, setId: string) => Promise<void>;
  completeExercise: (sessionExerciseId: string) => Promise<SessionExercise>;
  skipExercise: (sessionExerciseId: string) => Promise<SessionExercise>;
  substituteExercise: (input: Omit<SubstituteExerciseInput, 'sessionId'>) => Promise<SessionExercise>;
  completeSession: (options?: CompleteSessionOptions) => Promise<WorkoutSession>;
  abandonSession: () => Promise<WorkoutSession>;
  resumeSession: (sessionId: string) => Promise<WorkoutSession | null>;
  refreshSession: () => Promise<void>;
  getPreviousPerformance: (exerciseId: string) => Promise<PreviousPerformanceSummary | null>;
}

export function useWorkoutSession(
  initialSessionId?: string,
  userId?: string
): UseWorkoutSessionResult {
  const [service] = useState(() => new SessionCommandService());
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Resume or load active session on mount if ID or userId is provided
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setIsLoading(true);
        let loadedSession: WorkoutSession | null = null;

        if (initialSessionId) {
          loadedSession = await service.getSession(initialSessionId);
        } else if (userId) {
          loadedSession = await service.getActiveSession(userId);
        }

        if (mounted) {
          setSession(loadedSession);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [initialSessionId, userId, service]);

  const refreshSession = useCallback(async () => {
    if (!session?.id) return;
    try {
      const refreshed = await service.getSession(session.id);
      setSession(refreshed);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [session?.id, service]);

  const startSession = useCallback(
    async (input: StartSessionInput): Promise<WorkoutSession> => {
      setIsLoading(true);
      setError(null);
      try {
        const created = await service.startSession(input);
        setSession(created);
        return created;
      } catch (err: any) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [service]
  );

  const logSet = useCallback(
    async (input: Omit<LogSetInput, 'sessionId'>): Promise<WorkoutSet> => {
      if (!session?.id) {
        throw new Error('No active workout session found to log set');
      }
      try {
        const logged = await service.logSet({ ...input, sessionId: session.id });
        await refreshSession();
        return logged;
      } catch (err: any) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      }
    },
    [session?.id, service, refreshSession]
  );

  const updateSet = useCallback(
    async (input: Omit<UpdateSetInput, 'sessionId'>): Promise<WorkoutSet> => {
      if (!session?.id) {
        throw new Error('No active workout session found to update set');
      }
      try {
        const updated = await service.updateSet({ ...input, sessionId: session.id });
        await refreshSession();
        return updated;
      } catch (err: any) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      }
    },
    [session?.id, service, refreshSession]
  );

  const deleteSet = useCallback(
    async (sessionExerciseId: string, setId: string): Promise<void> => {
      if (!session?.id) {
        throw new Error('No active workout session found to delete set');
      }
      try {
        await service.deleteSet(session.id, sessionExerciseId, setId);
        await refreshSession();
      } catch (err: any) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      }
    },
    [session?.id, service, refreshSession]
  );

  const completeExercise = useCallback(
    async (sessionExerciseId: string): Promise<SessionExercise> => {
      if (!session?.id) {
        throw new Error('No active workout session found');
      }
      try {
        const completed = await service.completeExercise(session.id, sessionExerciseId);
        await refreshSession();
        return completed;
      } catch (err: any) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      }
    },
    [session?.id, service, refreshSession]
  );

  const skipExercise = useCallback(
    async (sessionExerciseId: string): Promise<SessionExercise> => {
      if (!session?.id) {
        throw new Error('No active workout session found');
      }
      try {
        const skipped = await service.skipExercise(session.id, sessionExerciseId);
        await refreshSession();
        return skipped;
      } catch (err: any) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      }
    },
    [session?.id, service, refreshSession]
  );

  const substituteExercise = useCallback(
    async (input: Omit<SubstituteExerciseInput, 'sessionId'>): Promise<SessionExercise> => {
      if (!session?.id) {
        throw new Error('No active workout session found');
      }
      try {
        const substituted = await service.substituteExercise({ ...input, sessionId: session.id });
        await refreshSession();
        return substituted;
      } catch (err: any) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      }
    },
    [session?.id, service, refreshSession]
  );

  const completeSession = useCallback(
    async (options?: CompleteSessionOptions): Promise<WorkoutSession> => {
      if (!session?.id) {
        throw new Error('No active workout session found to complete');
      }
      setIsLoading(true);
      try {
        const completed = await service.completeSession(session.id, options);
        setSession(completed);
        return completed;
      } catch (err: any) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [session?.id, service]
  );

  const abandonSession = useCallback(async (): Promise<WorkoutSession> => {
    if (!session?.id) {
      throw new Error('No active workout session found to abandon');
    }
    setIsLoading(true);
    try {
      const abandoned = await service.abandonSession(session.id);
      setSession(abandoned);
      return abandoned;
    } catch (err: any) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [session?.id, service]);

  const resumeSession = useCallback(
    async (sessionId: string): Promise<WorkoutSession | null> => {
      setIsLoading(true);
      try {
        const resumed = await service.resumeSession(sessionId);
        setSession(resumed);
        return resumed;
      } catch (err: any) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [service]
  );

  const getPreviousPerformance = useCallback(
    async (exerciseId: string): Promise<PreviousPerformanceSummary | null> => {
      return service.getPreviousPerformance(exerciseId, userId || session?.userId);
    },
    [service, userId, session?.userId]
  );

  return {
    session,
    isLoading,
    error,
    startSession,
    logSet,
    updateSet,
    deleteSet,
    completeExercise,
    skipExercise,
    substituteExercise,
    completeSession,
    abandonSession,
    resumeSession,
    refreshSession,
    getPreviousPerformance,
  };
}
