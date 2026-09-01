/**
 * Local Persistence & IndexedDB Test Suite
 * Covers all 18 required persistence validation gates for Phase 2B.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { STORES, DB_VERSION, MetaRecord } from '@/lib/storage/indexeddb-schema';
import {
  LocalUserRepository,
  LocalWorkoutRepository,
  LocalCompletionRepository,
  LocalFavoritesRepository,
} from '@/lib/repositories/local';
import { LocalWorkoutService } from '@/lib/domain/commands/local-workout-service';
import { LocalStorageMigrationAdapter } from '@/lib/storage/migration-adapter';
import { LEGACY_STORAGE_KEYS } from '@/lib/storage/local-storage-compat';
import { isUuid } from '@/lib/utils/id';
import { WorkoutEngine } from '@/features/workout-engine';

describe('Phase 2B: Local-First Persistence & Repositories', () => {
  beforeEach(() => {
    IndexedDBEngine.resetInstance();
    setupMockIndexedDB();
  });

  it('1. database initializes successfully', async () => {
    const engine = IndexedDBEngine.getInstance();
    const db = await engine.getDB();
    expect(db).toBeDefined();
    expect(db.objectStoreNames.contains(STORES.META)).toBe(true);
    expect(db.objectStoreNames.contains(STORES.WORKOUT_SESSIONS)).toBe(true);
  });

  it('2. schema version is recorded in meta store', async () => {
    const engine = IndexedDBEngine.getInstance();
    await engine.getDB();
    const schemaMeta = await engine.get<MetaRecord>(STORES.META, 'schema_version');
    expect(schemaMeta).toBeDefined();
    expect(schemaMeta?.value).toBe(DB_VERSION);
  });

  it('3. profile can be written and read through LocalUserRepository', async () => {
    const userRepo = new LocalUserRepository();
    const profile = {
      id: 'usr-alex-123',
      name: 'Alex Rivera',
      fitnessLevel: 'intermediate' as const,
      primaryGoal: 'muscle_gain' as const,
      preferredEquipment: ['Dumbbells'],
      preferredMuscleGroups: ['Chest', 'Arms'],
    };

    await userRepo.saveProfile(profile);
    const read = await userRepo.getProfile('usr-alex-123');

    expect(read).toBeDefined();
    expect(read?.name).toBe('Alex Rivera');
    expect(read?.primaryGoal).toBe('muscle_gain');
  });

  it('4. exercise catalog can be read from local storage', async () => {
    const engine = IndexedDBEngine.getInstance();
    await engine.getDB();
    const exercises = await engine.getAll(STORES.EXERCISE_CATALOG);
    expect(exercises.length).toBeGreaterThan(0);
  });

  it('5. workout template can be created and queried', async () => {
    const workoutRepo = new LocalWorkoutRepository();
    const template = {
      id: 'tpl-100',
      userId: 'usr-alex-123',
      name: 'Full Body Blast',
      goal: 'general_fitness',
      difficulty: 'intermediate' as const,
      duration: 45,
      targetMuscles: ['Full Body'],
      equipment: ['bodyweight'],
      exercises: [],
      isFavorite: true,
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await workoutRepo.saveTemplate(template);
    const retrieved = await workoutRepo.getTemplateById('tpl-100');
    expect(retrieved?.name).toBe('Full Body Blast');
    expect(retrieved?.isFavorite).toBe(true);
  });

  it('6. generated workout can be stored and reconstructed with exercises', async () => {
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'intermediate',
      primaryGoal: 'strength',
      targetMuscles: ['Chest'],
      equipment: ['Dumbbells'],
      durationMinutes: 45,
    });

    const workoutRepo = new LocalWorkoutRepository();
    await workoutRepo.saveGeneratedWorkout(workout);

    const retrieved = await workoutRepo.getGeneratedWorkoutById(workout.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(workout.id);
    expect(retrieved?.exercises.length).toBe(workout.exercises.length);
  });

  it('7. session can be started using LocalWorkoutService', async () => {
    const service = new LocalWorkoutService();
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'beginner',
      primaryGoal: 'general_fitness',
      targetMuscles: ['Legs'],
      equipment: ['bodyweight'],
      durationMinutes: 30,
    });

    const session = await service.startWorkoutSession({ workout });
    expect(session).toBeDefined();
    expect(session.status).toBe('active');
    expect(session.exercises.length).toBe(workout.exercises.length);
    expect(session.exercises[0].plannedSets).toBeGreaterThan(0);
  });

  it('8. session exercises can be stored with ordering', async () => {
    const service = new LocalWorkoutService();
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'beginner',
      primaryGoal: 'general_fitness',
      targetMuscles: ['Core'],
      equipment: ['bodyweight'],
      durationMinutes: 30,
    });

    const session = await service.startWorkoutSession({ workout });
    const completionRepo = new LocalCompletionRepository();
    const retrieved = await completionRepo.getSessionById(session.id);

    expect(retrieved?.exercises.length).toBe(workout.exercises.length);
    expect(retrieved?.exercises[0].order).toBe(1);
  });

  it('9. set can be written and logged', async () => {
    const service = new LocalWorkoutService();
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'beginner',
      primaryGoal: 'strength',
      targetMuscles: ['Back'],
      equipment: ['bodyweight'],
      durationMinutes: 30,
    });

    const session = await service.startWorkoutSession({ workout });
    const targetEx = session.exercises[0];

    const logged = await service.logSet(session.id, targetEx.id, {
      setNumber: 1,
      type: 'working',
      status: 'completed',
      actualReps: 12,
      actualWeight: 50,
    });

    expect(logged.status).toBe('completed');
    expect(logged.actualReps).toBe(12);
  });

  it('10. set can be updated in an active session', async () => {
    const service = new LocalWorkoutService();
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'intermediate',
      primaryGoal: 'strength',
      targetMuscles: ['Chest'],
      equipment: ['bodyweight'],
      durationMinutes: 30,
    });

    const session = await service.startWorkoutSession({ workout });
    const targetEx = session.exercises[0];
    const targetSet = await service.logSet(session.id, targetEx.id, {
      setNumber: 1,
      type: 'working',
      status: 'completed',
      actualReps: 10,
    });

    const updated = await service.updateSet(session.id, targetEx.id, targetSet.id, {
      actualReps: 15,
      rpe: 8,
    });

    expect(updated.actualReps).toBe(15);
    expect(updated.rpe).toBe(8);
  });

  it('11. completed set remains persisted after session query', async () => {
    const service = new LocalWorkoutService();
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'intermediate',
      primaryGoal: 'muscle_gain',
      targetMuscles: ['Shoulders'],
      equipment: ['bodyweight'],
      durationMinutes: 30,
    });

    const session = await service.startWorkoutSession({ workout });
    const targetEx = session.exercises[0];
    const logged = await service.logSet(session.id, targetEx.id, {
      setNumber: 1,
      type: 'working',
      status: 'completed',
      actualReps: 10,
    });

    const completionRepo = new LocalCompletionRepository();
    const freshSession = await completionRepo.getSessionById(session.id);
    const set = freshSession?.exercises[0].sets.find((s) => s.id === logged.id);

    expect(set?.status).toBe('completed');
    expect(set?.actualReps).toBe(10);
  });

  it('12. active session survives repository reinitialization', async () => {
    const service = new LocalWorkoutService();
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'intermediate',
      primaryGoal: 'general_fitness',
      targetMuscles: ['Legs'],
      equipment: ['bodyweight'],
      durationMinutes: 30,
    });

    const session = await service.startWorkoutSession({
      userId: 'active_guest_1',
      workout,
    });

    // Fresh repository instance
    const freshRepo = new LocalCompletionRepository();
    const active = await freshRepo.getActiveSession('active_guest_1');

    expect(active).toBeDefined();
    expect(active?.id).toBe(session.id);
    expect(active?.status).toBe('active');
  });

  it('13. localStorage migration correctly imports legacy items', async () => {
    const mockStorage = {
      data: new Map<string, string>(),
      getItem(k: string) {
        return this.data.get(k) || null;
      },
      setItem(k: string, v: string) {
        this.data.set(k, v);
      },
    };
    (globalThis as any).localStorage = mockStorage;

    // Seed legacy data
    mockStorage.setItem(
      LEGACY_STORAGE_KEYS.USER_PROFILE,
      JSON.stringify({ name: 'Jordan', fitnessLevel: 'advanced', goal: 'strength' })
    );
    mockStorage.setItem(
      LEGACY_STORAGE_KEYS.SAVED_WORKOUT_PLANS,
      JSON.stringify([{ id: 'legacy-p1', name: 'Legacy Upper', duration: 40, exercises: [] }])
    );
    mockStorage.setItem(
      LEGACY_STORAGE_KEYS.COMPLETED_EXERCISES,
      JSON.stringify([{ id: 'legacy-c1', name: 'Completed Leg Day', duration: 45, exercises: [] }])
    );
    mockStorage.setItem(LEGACY_STORAGE_KEYS.FAVORITE_EXERCISES, JSON.stringify(['Bench Press', 'Squat']));

    const adapter = new LocalStorageMigrationAdapter();
    const report = await adapter.runMigration(true);

    expect(report.success).toBe(true);
    expect(report.totalRecordsProcessed).toBeGreaterThanOrEqual(4);

    // Verify imported profile
    const userRepo = new LocalUserRepository();
    const users = await userRepo.listReturningUsers();
    expect(users).toContain('Jordan');

    // Verify favorites imported
    const favRepo = new LocalFavoritesRepository();
    const isFav = await favRepo.isFavorite('Bench Press');
    expect(isFav).toBe(true);
  });

  it('14. repeated migration is idempotent and does not duplicate records', async () => {
    const adapter = new LocalStorageMigrationAdapter();
    const firstRun = await adapter.runMigration();
    expect(firstRun.alreadyMigrated).toBe(false);

    // Second run
    const secondRun = await adapter.runMigration();
    expect(secondRun.alreadyMigrated).toBe(true);
    expect(secondRun.totalRecordsProcessed).toBe(0);
  });

  it('15. malformed localStorage does not crash migration', async () => {
    const mockStorage = {
      data: new Map<string, string>(),
      getItem(k: string) {
        return this.data.get(k) || null;
      },
      setItem(k: string, v: string) {
        this.data.set(k, v);
      },
    };
    (globalThis as any).localStorage = mockStorage;

    mockStorage.setItem(LEGACY_STORAGE_KEYS.USER_PROFILE, 'CORRUPTED_{NOT_VALID_JSON}');
    mockStorage.setItem(LEGACY_STORAGE_KEYS.SAVED_WORKOUT_PLANS, '["valid-string-not-object"]');

    const adapter = new LocalStorageMigrationAdapter();
    const report = await adapter.runMigration(true);

    expect(report).toBeDefined();
    // Non-fatal: handled gracefully without unhandled exception
    expect(report.logs.some((l) => l.status === 'error' || l.status === 'partial' || l.status === 'migrated')).toBe(
      true
    );
  });

  it('16. IDs remain stable and valid UUIDs', async () => {
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'intermediate',
      primaryGoal: 'fat_loss',
      targetMuscles: ['Full Body'],
      equipment: ['bodyweight'],
      durationMinutes: 30,
    });

    expect(isUuid(workout.id)).toBe(true);

    const service = new LocalWorkoutService();
    const session = await service.startWorkoutSession({ workout });

    expect(isUuid(session.id)).toBe(true);
    session.exercises.forEach((ex) => {
      expect(isUuid(ex.id)).toBe(true);
      ex.sets.forEach((set) => {
        expect(isUuid(set.id)).toBe(true);
      });
    });
  });

  it('17. owner isolation works locally', async () => {
    const templateRepo = new LocalWorkoutRepository();
    await templateRepo.saveTemplate({
      id: 'tpl-u1',
      userId: 'user_1',
      name: 'User 1 Template',
      goal: 'strength',
      difficulty: 'advanced',
      duration: 50,
      targetMuscles: ['Chest'],
      equipment: ['Dumbbells'],
      exercises: [],
      isFavorite: false,
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await templateRepo.saveTemplate({
      id: 'tpl-u2',
      userId: 'user_2',
      name: 'User 2 Template',
      goal: 'mobility',
      difficulty: 'beginner',
      duration: 30,
      targetMuscles: ['Legs'],
      equipment: ['bodyweight'],
      exercises: [],
      isFavorite: false,
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const u1Templates = await templateRepo.listTemplates('user_1');
    const u2Templates = await templateRepo.listTemplates('user_2');

    expect(u1Templates.length).toBe(1);
    expect(u1Templates[0].name).toBe('User 1 Template');
    expect(u2Templates.length).toBe(1);
    expect(u2Templates[0].name).toBe('User 2 Template');
  });

  it('18. indexes return expected records across stores', async () => {
    const service = new LocalWorkoutService();
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'intermediate',
      primaryGoal: 'muscle_gain',
      targetMuscles: ['Arms'],
      equipment: ['bodyweight'],
      durationMinutes: 30,
    });

    const session = await service.startWorkoutSession({
      userId: 'indexed_user_99',
      workout,
    });

    const completionRepo = new LocalCompletionRepository();
    const sessions = await completionRepo.listSessions('indexed_user_99');

    expect(sessions.length).toBe(1);
    expect(sessions[0].id).toBe(session.id);
  });
});
