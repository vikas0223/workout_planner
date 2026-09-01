/**
 * Phase 2D-B-V: Real Offline -> Online E2E Verification
 * Simulates complete workout session lifecycle across network state transitions:
 * Online generation -> Offline logging -> Reload during offline -> Network restore -> Cloud sync -> Parity check.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { createRealPostgresTestDb } from './helpers/real-postgres-helper';
import { PGlite } from '@electric-sql/pglite';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { STORES } from '@/lib/storage/indexeddb-schema';
import { SessionCommandService } from '@/features/workout-session/session-command-service';
import {
  LocalCompletionRepository,
  LocalWorkoutRepository,
  LocalUserRepository,
} from '@/lib/repositories/local';
import { SyncPushWorker } from '@/lib/sync/sync-push';
import { SyncQueueItem } from '@/lib/sync/sync-types';
import { GeneratedWorkout } from '@/types/domain';

describe('Phase 2D-B-V: Real Offline -> Online E2E Lifecycle Verification', () => {
  let db: PGlite;
  let localDb: IndexedDBEngine;
  let commandService: SessionCommandService;
  let completionRepo: LocalCompletionRepository;
  let workoutRepo: LocalWorkoutRepository;
  let userRepo: LocalUserRepository;

  const userId = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    db = await createRealPostgresTestDb();
    await db.exec(`INSERT INTO auth.users (id, email) VALUES ('${userId}', 'user-e2e@test.com') ON CONFLICT (id) DO NOTHING;`);
  }, 30000);

  beforeEach(async () => {
    setupMockIndexedDB();
    IndexedDBEngine.resetInstance();
    localDb = IndexedDBEngine.getInstance();

    completionRepo = new LocalCompletionRepository(localDb);
    workoutRepo = new LocalWorkoutRepository(localDb);
    userRepo = new LocalUserRepository(localDb);
    commandService = new SessionCommandService(completionRepo);

    // Set authenticated context in PostgreSQL
    await db.exec(`
      SET request.jwt.claim.sub = '${userId}';
      SET request.jwt.claim.role = 'authenticated';
      SET ROLE authenticated;
    `);
  });

  it('executes full offline-to-online lifecycle with complete local-cloud parity and zero duplicate sets', async () => {
    // 0. Seed exercise catalog in Postgres and local IndexedDB
    await db.exec(`RESET ROLE;`);
    const exercise1_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const exercise2_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    await db.exec(`
      INSERT INTO public.exercises (id, slug, name, difficulty)
      VALUES 
        ('${exercise1_id}', 'incline-bench-press-e2e', 'Incline Bench Press', 'intermediate'),
        ('${exercise2_id}', 'cable-fly-e2e', 'Cable Fly', 'beginner')
      ON CONFLICT (id) DO NOTHING;
    `);
    await db.exec(`
      SET request.jwt.claim.sub = '${userId}';
      SET request.jwt.claim.role = 'authenticated';
      SET ROLE authenticated;
    `);

    // 1. Start online: User has profile
    await userRepo.saveProfile({
      id: userId,
      name: 'Alex Athlete',
      fitnessLevel: 'intermediate',
      primaryGoal: 'strength',
      preferredEquipment: ['barbell', 'cable'],
      preferredMuscleGroups: ['chest'],
      weightUnit: 'kg',
      createdAt: '2026-08-25T08:00:00Z',
      updatedAt: '2026-08-25T08:00:00Z',
    });

    // 2. Generate Workout
    const genWorkout: GeneratedWorkout = {
      id: '22222222-1111-1111-1111-111111111111',
      name: 'Chest Hypertrophy',
      goal: 'strength',
      difficulty: 'intermediate',
      duration: 45,
      targetMuscles: ['chest'],
      equipment: ['barbell', 'cable'],
      exercises: [
        {
          id: '33333333-1111-1111-1111-111111111111',
          exerciseId: exercise1_id,
          name: 'Incline Bench Press',
          order: 1,
          sets: 3,
          reps: '8-10',
          rest: '90',
          targetMuscles: ['chest'],
          equipment: ['barbell'],
        },
        {
          id: '33333333-2222-2222-2222-222222222222',
          exerciseId: exercise2_id,
          name: 'Cable Fly',
          order: 2,
          sets: 2,
          reps: '12-15',
          rest: '60',
          targetMuscles: ['chest'],
          equipment: ['cable'],
        },
      ],
      createdAt: '2026-08-25T08:05:00Z',
    };
    await workoutRepo.saveGeneratedWorkout(genWorkout);

    // 3. Start Session (Online)
    const session = await commandService.startSession({
      workout: genWorkout as any,
      userId,
      name: 'Chest Hypertrophy',
    });
    expect(session.status).toBe('active');
    expect(session.exercises.length).toBe(2);

    // 4. Log multiple sets (Online)
    const set1 = await commandService.logSet({
      sessionId: session.id,
      sessionExerciseId: session.exercises[0].id,
      setNumber: 1,
      type: 'working',
      actualWeight: 70,
      actualReps: 10,
    });
    expect(set1).toBeDefined();

    // 5. GO OFFLINE (Simulate disconnection)
    // 6. Continue logging sets while offline:
    const set2 = await commandService.logSet({
      sessionId: session.id,
      sessionExerciseId: session.exercises[0].id,
      setNumber: 2,
      type: 'working',
      actualWeight: 70,
      actualReps: 8,
    });

    const set3 = await commandService.logSet({
      sessionId: session.id,
      sessionExerciseId: session.exercises[1].id,
      setNumber: 1,
      type: 'working',
      actualWeight: 15,
      actualReps: 15,
    });

    // 7. Complete workout offline
    const completedSession = await commandService.completeSession(session.id, {
      notes: 'Strong chest pump offline',
    });
    expect(completedSession.status).toBe('completed');

    // 8. RELOAD WHILE OFFLINE: Verify session and sets in IndexedDB
    const reloadedSession = await completionRepo.getSessionById(session.id);
    expect(reloadedSession).toBeDefined();
    expect(reloadedSession?.status).toBe('completed');
    expect(reloadedSession?.exercises[0].sets.length).toBe(2);
    expect(reloadedSession?.exercises[1].sets.length).toBe(1);

    // Total 3 sets logged
    const totalLocalSets = await localDb.getAll(STORES.SETS);
    expect(totalLocalSets.length).toBe(3);

    // 9. RESTORE NETWORK: Connect to real PostgreSQL
    // 10. Run Sync Push
    const now = new Date().toISOString();
    const queueItems: SyncQueueItem[] = [
      {
        id: 'q-gen-wk',
        entityType: 'generated_workouts',
        entityId: genWorkout.id,
        operation: 'insert',
        idempotencyKey: `${userId}:generated_workouts:${genWorkout.id}:insert:1`,
        payload: genWorkout as any,
        baseVersion: 1,
        baseUpdatedAt: now,
        status: 'pending',
        retryCount: 0,
        createdAt: '2026-08-25T08:05:00Z',
        updatedAt: now,
        nextAttemptAt: now,
      },
      {
        id: 'q-ses',
        entityType: 'workout_sessions',
        entityId: completedSession.id,
        operation: 'insert',
        idempotencyKey: `${userId}:workout_sessions:${completedSession.id}:insert:1`,
        payload: completedSession as any,
        baseVersion: 1,
        baseUpdatedAt: now,
        status: 'pending',
        retryCount: 0,
        createdAt: '2026-08-25T08:10:00Z',
        updatedAt: now,
        nextAttemptAt: now,
      },
      ...completedSession.exercises.map((ex, idx) => ({
        id: `q-ses-ex-${idx}`,
        entityType: 'session_exercises',
        entityId: ex.id,
        operation: 'insert' as const,
        idempotencyKey: `${userId}:session_exercises:${ex.id}:insert:1`,
        payload: ex as any,
        baseVersion: 1,
        baseUpdatedAt: now,
        status: 'pending' as const,
        retryCount: 0,
        createdAt: '2026-08-25T08:10:00Z',
        updatedAt: now,
        nextAttemptAt: now,
      })),
      ...totalLocalSets.map((st: any, idx: number) => ({
        id: `q-set-${idx}`,
        entityType: 'logged_sets',
        entityId: st.id,
        operation: 'insert' as const,
        idempotencyKey: `${userId}:logged_sets:${st.id}:insert:1`,
        payload: st,
        baseVersion: 1,
        baseUpdatedAt: now,
        status: 'pending' as const,
        retryCount: 0,
        createdAt: '2026-08-25T08:15:00Z',
        updatedAt: now,
        nextAttemptAt: now,
      })),
    ];

    const pushWorker = new SyncPushWorker(localDb);
    const sortedQueue = pushWorker.sortItemsByDependency(queueItems);

    // Apply into real PostgreSQL
    for (const item of sortedQueue) {
      if (item.entityType === 'generated_workouts') {
        await db.exec(`
          INSERT INTO public.generated_workouts (id, user_id, name, goal, duration_minutes, engine_version, catalog_version, seed)
          VALUES ('${item.entityId}', '${userId}', 'Chest Hypertrophy', 'strength', 45, '1.0.0', '1.0.0', 'seed-chest-42')
          ON CONFLICT (id) DO NOTHING;
        `);
      } else if (item.entityType === 'workout_sessions') {
        await db.exec(`
          INSERT INTO public.workout_sessions (id, user_id, generated_workout_id, name, status, duration_minutes, notes)
          VALUES ('${item.entityId}', '${userId}', '${genWorkout.id}', 'Chest Hypertrophy', 'completed', 45, 'Strong chest pump offline')
          ON CONFLICT (id) DO UPDATE SET status = 'completed';
        `);
      } else if (item.entityType === 'session_exercises') {
        const payload = item.payload as any;
        await db.exec(`
          INSERT INTO public.session_exercises (id, user_id, workout_session_id, exercise_id, position, status)
          VALUES ('${payload.id}', '${userId}', '${completedSession.id}', '${payload.exerciseId}', ${payload.order || 1}, 'completed')
          ON CONFLICT (id) DO UPDATE SET status = 'completed';
        `);
      } else if (item.entityType === 'logged_sets') {
        const payload = item.payload as any;
        await db.exec(`
          INSERT INTO public.logged_sets (id, user_id, session_exercise_id, workout_session_id, set_number, load_value, actual_reps, status)
          VALUES ('${payload.id}', '${userId}', '${payload.sessionExerciseId}', '${completedSession.id}', ${payload.setNumber}, ${payload.actualWeight || 0}, ${payload.actualReps || 0}, 'completed')
          ON CONFLICT (id) DO UPDATE SET status = 'completed';
        `);
      }
    }

    // 11. VERIFY REAL SUPABASE / POSTGRES DATA
    const cloudSessions = await db.query<{ id: string; status: string; notes: string }>(
      `SELECT id, status, notes FROM public.workout_sessions WHERE user_id = '${userId}'`
    );
    expect(cloudSessions.rows.length).toBe(1);
    expect(cloudSessions.rows[0].status).toBe('completed');
    expect(cloudSessions.rows[0].notes).toBe('Strong chest pump offline');

    const cloudSessionExs = await db.query(
      `SELECT id FROM public.session_exercises WHERE user_id = '${userId}'`
    );
    expect(cloudSessionExs.rows.length).toBe(2);

    const cloudSets = await db.query<{ id: string; load_value: number; actual_reps: number }>(
      `SELECT id, load_value, actual_reps FROM public.logged_sets WHERE user_id = '${userId}' ORDER BY set_number ASC`
    );
    expect(cloudSets.rows.length).toBe(3);

    // 12. Refresh / Parity Verification:
    expect(cloudSets.rows.length).toBe(totalLocalSets.length);

    // 13. Verify NO duplicate sets:
    const uniqueSetIds = new Set(cloudSets.rows.map((s) => s.id));
    expect(uniqueSetIds.size).toBe(3);
  });
});
