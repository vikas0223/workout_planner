import { describe, it, expect, beforeEach } from 'vitest';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { STORES, DB_VERSION } from '@/lib/storage/indexeddb-schema';
import { LocalUserRepository, LocalCompletionRepository, LocalProgramRepository, LocalGoalRepository, LocalChallengeRepository } from '@/lib/repositories/local';
import { WorkoutSession } from '@/types/domain';

describe('Phase 2J: Strict DB v1 -> v2 Migration Chain', () => {
  beforeEach(() => {
    IndexedDBEngine.resetInstance();
    setupMockIndexedDB();
  });

  it('preserves all existing v1 guest and authenticated workout session/set data through v2 upgrade without corruption', async () => {
    // 1. Seed raw v1 schema directly at version 1
    const rawDB = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('workout_planner_db', 1);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('local_profiles')) {
          const s = db.createObjectStore('local_profiles', { keyPath: 'id' });
          s.createIndex('ownerKind', 'ownerKind');
          s.createIndex('ownerId', 'ownerId');
          s.createIndex('ownerId_updatedAt', ['ownerId', 'updatedAt']);
        }
        if (!db.objectStoreNames.contains('workout_templates')) {
          const s = db.createObjectStore('workout_templates', { keyPath: 'id' });
          s.createIndex('ownerId', 'ownerId');
        }
        if (!db.objectStoreNames.contains('workout_sessions')) {
          const s = db.createObjectStore('workout_sessions', { keyPath: 'id' });
          s.createIndex('ownerId', 'ownerId');
          s.createIndex('status', 'status');
          s.createIndex('startedAt', 'startedAt');
          s.createIndex('ownerId_status', ['ownerId', 'status']);
          s.createIndex('ownerId_startedAt', ['ownerId', 'startedAt']);
        }
        if (!db.objectStoreNames.contains('session_exercises')) {
          const s = db.createObjectStore('session_exercises', { keyPath: 'id' });
          s.createIndex('workoutSessionId', 'workoutSessionId');
          s.createIndex('exerciseId', 'exerciseId');
          s.createIndex('ownerId', 'ownerId');
        }
        if (!db.objectStoreNames.contains('sets')) {
          const s = db.createObjectStore('sets', { keyPath: 'id' });
          s.createIndex('workoutSessionId', 'workoutSessionId');
          s.createIndex('sessionExerciseId', 'sessionExerciseId');
          s.createIndex('sessionExerciseId_setNumber', ['sessionExerciseId', 'setNumber']);
          s.createIndex('ownerId', 'ownerId');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    // 2. Seed v1 data using raw transaction
    await new Promise<void>((resolve, reject) => {
      const tx = rawDB.transaction(
        ['local_profiles', 'workout_sessions', 'session_exercises', 'sets'],
        'readwrite'
      );
      const profileStore = tx.objectStore('local_profiles');
      const sessionStore = tx.objectStore('workout_sessions');
      const exerciseStore = tx.objectStore('session_exercises');
      const setStore = tx.objectStore('sets');

      profileStore.put({
        id: 'guest_user',
        ownerKind: 'guest',
        ownerId: 'guest_user',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
        clientUpdatedAt: '2026-08-01T00:00:00.000Z',
        version: 1,
        syncStatus: 'local',
        isCurrentGuest: true,
        profile: {
          id: 'guest_user',
          name: 'Guest Lifter',
          fitnessLevel: 'intermediate',
          primaryGoal: 'hypertrophy',
          preferredEquipment: ['barbell', 'dumbbell'],
          preferredMuscleGroups: ['Chest', 'Back'],
          createdAt: '2026-08-01T00:00:00.000Z',
          updatedAt: '2026-08-01T00:00:00.000Z',
        },
      });

      sessionStore.put({
        id: 'sess_v1_legacy',
        ownerKind: 'user',
        ownerId: 'auth_user_456',
        createdAt: '2026-08-10T10:00:00.000Z',
        updatedAt: '2026-08-10T11:00:00.000Z',
        clientUpdatedAt: '2026-08-10T11:00:00.000Z',
        version: 1,
        syncStatus: 'synced',
        status: 'completed',
        startedAt: '2026-08-10T10:00:00.000Z',
        completedAt: '2026-08-10T11:00:00.000Z',
        session: {
          id: 'sess_v1_legacy',
          userId: 'auth_user_456',
          name: 'Heavy Bench & Rows',
          status: 'completed',
          startedAt: '2026-08-10T10:00:00.000Z',
          completedAt: '2026-08-10T11:00:00.000Z',
          durationMinutes: 60,
          totalVolume: 4800,
          exercises: [],
        },
      });

      exerciseStore.put({
        id: 'se_v1_1',
        ownerKind: 'user',
        ownerId: 'auth_user_456',
        workoutSessionId: 'sess_v1_legacy',
        exerciseId: 'ex_bench_press',
        order: 1,
        createdAt: '2026-08-10T10:00:00.000Z',
        updatedAt: '2026-08-10T11:00:00.000Z',
        clientUpdatedAt: '2026-08-10T11:00:00.000Z',
        version: 1,
        syncStatus: 'synced',
        sessionExercise: {
          id: 'se_v1_1',
          sessionId: 'sess_v1_legacy',
          exerciseId: 'ex_bench_press',
          name: 'Barbell Bench Press',
          order: 1,
          targetMuscles: ['Chest'],
          equipment: ['barbell'],
          status: 'completed',
          sets: [],
        },
      });

      setStore.put({
        id: 'set_v1_1',
        ownerKind: 'user',
        ownerId: 'auth_user_456',
        workoutSessionId: 'sess_v1_legacy',
        sessionExerciseId: 'se_v1_1',
        setNumber: 1,
        createdAt: '2026-08-10T10:15:00.000Z',
        updatedAt: '2026-08-10T10:15:00.000Z',
        clientUpdatedAt: '2026-08-10T10:15:00.000Z',
        version: 1,
        syncStatus: 'synced',
        set: {
          id: 'set_v1_1',
          sessionExerciseId: 'se_v1_1',
          setNumber: 1,
          type: 'normal',
          actualReps: 8,
          actualWeight: 80,
          status: 'completed',
          completedAt: '2026-08-10T10:15:00.000Z',
        },
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // Close raw v1 DB before opening via IndexedDBEngine v2
    rawDB.close();

    const userRepo = new LocalUserRepository();
    const completionRepo = new LocalCompletionRepository();

    // 3. Verify DB upgraded to v2
    const engine = IndexedDBEngine.getInstance();
    await engine.getDB();
    expect(DB_VERSION).toBe(2);

    // 4. Verify existing v1 data is completely intact
    const preservedProfile = await userRepo.getProfile('guest_user');
    expect(preservedProfile).toBeDefined();
    expect(preservedProfile?.name).toBe('Guest Lifter');
    expect(preservedProfile?.fitnessLevel).toBe('intermediate');

    const preservedSession = await completionRepo.getSessionById('sess_v1_legacy');
    expect(preservedSession).toBeDefined();
    expect(preservedSession?.name).toBe('Heavy Bench & Rows');
    expect(preservedSession?.totalVolume).toBe(4800);
    expect(preservedSession?.exercises[0].sets[0].actualWeight).toBe(80);

    // 5. Verify all 6 new v2 stores are available and queryable without error
    const programRepo = new LocalProgramRepository();
    const goalRepo = new LocalGoalRepository();
    const challengeRepo = new LocalChallengeRepository();

    const programs = await programRepo.listPrograms('auth_user_456');
    expect(programs).toEqual([]);

    const goals = await goalRepo.listGoals('auth_user_456');
    expect(goals).toEqual([]);

    const challenges = await challengeRepo.listChallenges();
    expect(challenges.length).toBeGreaterThan(0); // Platform catalog challenges present
  });
});
