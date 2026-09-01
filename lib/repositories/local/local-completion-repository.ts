/**
 * Local Completion Repository (IndexedDB backed)
 * Implements CompletionRepository for WorkoutSession, SessionExercise, and WorkoutSet entities.
 * Supports active workout session recovery, soft deletion, and previous performance tracking.
 */

import { CompletionRepository } from '@/lib/repositories/interfaces';
import {
  WorkoutSession,
  WorkoutFeedback,
  SessionExercise,
  WorkoutSet,
  PreviousPerformanceSummary,
  PreviousPerformanceRecord,
} from '@/types/domain';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import {
  STORES,
  WorkoutSessionRecord,
  SessionExerciseRecord,
  SetRecord,
} from '@/lib/storage/indexeddb-schema';

export class LocalCompletionRepository implements CompletionRepository {
  constructor(private engine: IndexedDBEngine = IndexedDBEngine.getInstance()) {}

  public async getSessionById(id: string): Promise<WorkoutSession | null> {
    try {
      const record = await this.engine.get<WorkoutSessionRecord>(STORES.WORKOUT_SESSIONS, id);
      if (!record || record.deletedAt) return null;

      // Load non-deleted session exercises
      const exRecords = await this.engine.getByIndex<SessionExerciseRecord>(
        STORES.SESSION_EXERCISES,
        'workoutSessionId',
        id
      );

      const validExRecords = exRecords.filter((r) => !r.deletedAt);

      // Load non-deleted sets for the entire session
      const setRecords = await this.engine.getByIndex<SetRecord>(
        STORES.SETS,
        'workoutSessionId',
        id
      );

      const validSetRecords = setRecords.filter((r) => !r.deletedAt);

      const exercises: SessionExercise[] = validExRecords
        .sort((a, b) => a.sessionExercise.order - b.sessionExercise.order)
        .map((exRec) => {
          const matchingSets = validSetRecords
            .filter((s) => s.sessionExerciseId === exRec.id)
            .sort((a, b) => a.setNumber - b.setNumber)
            .map((s) => s.set);

          return {
            ...exRec.sessionExercise,
            sets: matchingSets,
          };
        });

      return {
        ...record.session,
        exercises,
      };
    } catch (err) {
      console.warn(`[LocalCompletionRepository] Failed to getSessionById id=${id}`, err);
      return null;
    }
  }

  public async getActiveSession(userId?: string): Promise<WorkoutSession | null> {
    try {
      let userSessions: WorkoutSessionRecord[];
      if (userId) {
        userSessions = await this.engine.getByIndex<WorkoutSessionRecord>(
          STORES.WORKOUT_SESSIONS,
          'ownerId',
          userId
        );
      } else {
        userSessions = await this.engine.getAll<WorkoutSessionRecord>(STORES.WORKOUT_SESSIONS);
      }

      const active = userSessions.find(
        (s) =>
          !s.deletedAt &&
          (s.session.status === 'active' || (s.session.status as string) === 'in_progress')
      );

      if (active) {
        return this.getSessionById(active.id);
      }
      return null;
    } catch (err) {
      console.warn(`[LocalCompletionRepository] Failed to getActiveSession userId=${userId}`, err);
      return null;
    }
  }

  public async listSessions(filterOrUserId?: import('@/lib/repositories/interfaces').SessionFilterOptions | string): Promise<WorkoutSession[]> {
    try {
      const filter = typeof filterOrUserId === 'string' ? { userId: filterOrUserId } : filterOrUserId || {};
      let records: WorkoutSessionRecord[];
      if (filter.userId) {
        records = await this.engine.getByIndex<WorkoutSessionRecord>(
          STORES.WORKOUT_SESSIONS,
          'ownerId',
          filter.userId
        );
      } else {
        records = await this.engine.getAll<WorkoutSessionRecord>(STORES.WORKOUT_SESSIONS);
      }

      let nonDeleted = records.filter((r) => !r.deletedAt);

      if (filter.status) {
        nonDeleted = nonDeleted.filter((r) => r.session.status === filter.status);
      }

      if (filter.startDate) {
        const start = new Date(filter.startDate).getTime();
        nonDeleted = nonDeleted.filter((r) => {
          const d = new Date(r.session.completedAt || r.session.startedAt || 0).getTime();
          return d >= start;
        });
      }

      if (filter.endDate) {
        const end = new Date(filter.endDate).getTime();
        nonDeleted = nonDeleted.filter((r) => {
          const d = new Date(r.session.completedAt || r.session.startedAt || 0).getTime();
          return d <= end;
        });
      }

      const fullSessions = await Promise.all(
        nonDeleted.map((r) => this.getSessionById(r.id))
      );

      return fullSessions.filter((s): s is WorkoutSession => s !== null);
    } catch (err) {
      console.warn('[LocalCompletionRepository] Failed to listSessions', err);
      return [];
    }
  }

  public async getSessionExercises(sessionId: string): Promise<SessionExercise[]> {
    try {
      const session = await this.getSessionById(sessionId);
      return session ? session.exercises : [];
    } catch (err) {
      console.warn(`[LocalCompletionRepository] Failed to getSessionExercises sessionId=${sessionId}`, err);
      return [];
    }
  }

  public async getSets(sessionExerciseId: string): Promise<WorkoutSet[]> {
    try {
      const setRecords = await this.engine.getByIndex<SetRecord>(
        STORES.SETS,
        'sessionExerciseId',
        sessionExerciseId
      );
      return setRecords
        .filter((r) => !r.deletedAt)
        .sort((a, b) => a.setNumber - b.setNumber)
        .map((r) => r.set);
    } catch (err) {
      console.warn(`[LocalCompletionRepository] Failed to getSets sessionExerciseId=${sessionExerciseId}`, err);
      return [];
    }
  }

  public async saveSession(session: WorkoutSession): Promise<void> {
    const now = new Date().toISOString();
    const ownerId = session.userId || 'guest_user';

    // Fetch existing session record before transaction to preserve version & sync status reliably
    const existingSessionRecord = await this.engine.get<WorkoutSessionRecord>(
      STORES.WORKOUT_SESSIONS,
      session.id
    );

    await this.engine.transaction(
      [STORES.WORKOUT_SESSIONS, STORES.SESSION_EXERCISES, STORES.SETS],
      'readwrite',
      async (stores) => {
        const sessionStore = stores[STORES.WORKOUT_SESSIONS];
        const exerciseStore = stores[STORES.SESSION_EXERCISES];
        const setStore = stores[STORES.SETS];

        const sessionRecord: WorkoutSessionRecord = {
          id: session.id,
          ownerKind: existingSessionRecord?.ownerKind || 'guest',
          ownerId: existingSessionRecord?.ownerId || ownerId,
          createdAt: existingSessionRecord?.createdAt || session.startedAt || now,
          updatedAt: now,
          clientUpdatedAt: now,
          version: (existingSessionRecord?.version || 0) + 1,
          syncStatus: existingSessionRecord?.syncStatus || 'local',
          generatedWorkoutId: session.workoutPlanId || null,
          session,
        };

        sessionStore.put(sessionRecord);

        // Store session exercises atomically
        if (session.exercises && session.exercises.length > 0) {
          session.exercises.forEach((ex, exIndex) => {
            const exRecord: SessionExerciseRecord = {
              id: ex.id,
              ownerKind: 'guest',
              ownerId,
              createdAt: now,
              updatedAt: now,
              clientUpdatedAt: now,
              version: 1,
              syncStatus: 'local',
              workoutSessionId: session.id,
              exerciseId: ex.exerciseId,
              sessionExercise: {
                ...ex,
                order: ex.order !== undefined ? ex.order : exIndex + 1,
              },
            };
            exerciseStore.put(exRecord);

            // Store sets if any exist
            if (ex.sets && ex.sets.length > 0) {
              ex.sets.forEach((set, setIndex) => {
                const setRecord: SetRecord = {
                  id: set.id,
                  ownerKind: 'guest',
                  ownerId,
                  createdAt: set.completedAt || now,
                  updatedAt: now,
                  clientUpdatedAt: now,
                  version: 1,
                  syncStatus: 'local',
                  workoutSessionId: session.id,
                  sessionExerciseId: ex.id,
                  setNumber: set.setNumber !== undefined ? set.setNumber : setIndex + 1,
                  set,
                };
                setStore.put(setRecord);
              });
            }
          });
        }
      }
    );
  }

  public async softDeleteSet(setId: string): Promise<void> {
    const now = new Date().toISOString();
    const record = await this.engine.get<SetRecord>(STORES.SETS, setId);
    if (record) {
      const updatedRecord: SetRecord = {
        ...record,
        deletedAt: now,
        updatedAt: now,
        clientUpdatedAt: now,
        version: record.version + 1,
      };
      await this.engine.put(STORES.SETS, updatedRecord);
    }
  }

  public async getPreviousPerformance(
    exerciseId: string,
    userId: string = 'guest_user'
  ): Promise<PreviousPerformanceSummary | null> {
    try {
      const allSessions = await this.listSessions(userId);
      const completedSessions = allSessions.filter((s) => s.status === 'completed');

      const matchingSets: PreviousPerformanceRecord[] = [];
      let maxWeight = 0;
      let maxReps = 0;
      let lastPerformedAt: string | undefined;

      // Sort completed sessions descending by completedAt or startedAt
      completedSessions.sort((a, b) => {
        const timeA = new Date(a.completedAt || a.startedAt).getTime();
        const timeB = new Date(b.completedAt || b.startedAt).getTime();
        return timeB - timeA;
      });

      for (const session of completedSessions) {
        for (const ex of session.exercises) {
          if (ex.exerciseId === exerciseId) {
            if (!lastPerformedAt) {
              lastPerformedAt = session.completedAt || session.startedAt;
            }

            for (const s of ex.sets) {
              if (s.status === 'completed') {
                const reps = s.actualReps ?? s.targetReps ?? 0;
                const weight = s.actualWeight ?? s.loadValue ?? 0;

                if (weight > maxWeight) maxWeight = weight;
                if (reps > maxReps) maxReps = reps;

                matchingSets.push({
                  sessionId: session.id,
                  completedAt: s.completedAt || session.completedAt || session.startedAt,
                  setNumber: s.setNumber,
                  reps: s.actualReps,
                  weight: s.actualWeight ?? s.loadValue,
                  weightUnit: s.weightUnit ?? (s.loadUnit as string) ?? 'kg',
                  rpe: s.rpe,
                  notes: s.notes,
                });
              }
            }
          }
        }
      }

      if (matchingSets.length === 0) {
        return {
          exerciseId,
          totalSetsCompleted: 0,
          recentSets: [],
        };
      }

      return {
        exerciseId,
        lastPerformedAt,
        maxWeight: maxWeight > 0 ? maxWeight : undefined,
        maxReps: maxReps > 0 ? maxReps : undefined,
        totalSetsCompleted: matchingSets.length,
        recentSets: matchingSets.slice(0, 10),
      };
    } catch (err) {
      console.warn(`[LocalCompletionRepository] getPreviousPerformance error exerciseId=${exerciseId}`, err);
      return {
        exerciseId,
        totalSetsCompleted: 0,
        recentSets: [],
      };
    }
  }

  public async saveFeedback(feedback: WorkoutFeedback): Promise<void> {
    if (!feedback.sessionId) return;
    const session = await this.getSessionById(feedback.sessionId);
    if (!session) return;

    const updatedSession: WorkoutSession = {
      ...session,
      feedback,
    };
    await this.saveSession(updatedSession);
  }
}
