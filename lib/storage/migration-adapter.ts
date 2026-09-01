/**
 * LocalStorage to IndexedDB Migration Adapter
 * Safely ingests and normalizes legacy localStorage data into IndexedDB.
 * Fully idempotent, non-destructive (retains localStorage keys for rollback safety),
 * and resilient against corrupted/partial data structures.
 */

import { IndexedDBEngine } from './indexeddb-engine';
import { STORES, MetaRecord } from './indexeddb-schema';
import { LEGACY_STORAGE_KEYS } from './local-storage-compat';
import { LocalUserRepository, LocalWorkoutRepository, LocalCompletionRepository, LocalFavoritesRepository } from '@/lib/repositories/local';
import { UserProfile, WorkoutTemplate, WorkoutSession, SessionExercise, WorkoutSet } from '@/types/domain';
import { toStableId, generateId, isUuid } from '@/lib/utils/id';

export interface MigrationLogItem {
  key: string;
  status: 'migrated' | 'skipped' | 'partial' | 'error';
  itemCount: number;
  message?: string;
  errors?: string[];
}

export interface MigrationReport {
  success: boolean;
  migratedAt: string;
  alreadyMigrated: boolean;
  logs: MigrationLogItem[];
  totalRecordsProcessed: number;
}

export class LocalStorageMigrationAdapter {
  private engine: IndexedDBEngine;
  private userRepo: LocalUserRepository;
  private workoutRepo: LocalWorkoutRepository;
  private completionRepo: LocalCompletionRepository;
  private favoritesRepo: LocalFavoritesRepository;

  constructor(engine: IndexedDBEngine = IndexedDBEngine.getInstance()) {
    this.engine = engine;
    this.userRepo = new LocalUserRepository(engine);
    this.workoutRepo = new LocalWorkoutRepository(engine);
    this.completionRepo = new LocalCompletionRepository(engine);
    this.favoritesRepo = new LocalFavoritesRepository(engine);
  }

  /**
   * Checks if migration has already completed successfully
   */
  public async isMigrationCompleted(): Promise<boolean> {
    try {
      const meta = await this.engine.get<MetaRecord>(STORES.META, 'last_localstorage_migration_at');
      return Boolean(meta && meta.value);
    } catch {
      return false;
    }
  }

  /**
   * Runs the idempotent migration
   */
  public async runMigration(force: boolean = false): Promise<MigrationReport> {
    const logs: MigrationLogItem[] = [];
    let totalRecords = 0;

    if (!force && (await this.isMigrationCompleted())) {
      return {
        success: true,
        migratedAt: new Date().toISOString(),
        alreadyMigrated: true,
        logs: [{ key: 'all', status: 'skipped', itemCount: 0, message: 'Migration already ran previously' }],
        totalRecordsProcessed: 0,
      };
    }

    const storage = typeof window !== 'undefined' ? window.localStorage : (globalThis as any).localStorage;
    if (!storage) {
      return {
        success: true,
        migratedAt: new Date().toISOString(),
        alreadyMigrated: false,
        logs: [{ key: 'storage', status: 'skipped', itemCount: 0, message: 'No localStorage environment present' }],
        totalRecordsProcessed: 0,
      };
    }

    // 1. Migrate userProfile & workoutAppUserId
    try {
      const profileLog = await this.migrateUserProfile(storage);
      logs.push(profileLog);
      totalRecords += profileLog.itemCount;
    } catch (err: any) {
      logs.push({ key: LEGACY_STORAGE_KEYS.USER_PROFILE, status: 'error', itemCount: 0, message: err?.message });
    }

    // 2. Migrate returningUsers
    try {
      const returningLog = await this.migrateReturningUsers(storage);
      logs.push(returningLog);
      totalRecords += returningLog.itemCount;
    } catch (err: any) {
      logs.push({ key: LEGACY_STORAGE_KEYS.RETURNING_USERS, status: 'error', itemCount: 0, message: err?.message });
    }

    // 3. Migrate savedWorkoutPlans & savedWorkouts
    try {
      const workoutsLog = await this.migrateWorkouts(storage);
      logs.push(workoutsLog);
      totalRecords += workoutsLog.itemCount;
    } catch (err: any) {
      logs.push({ key: LEGACY_STORAGE_KEYS.SAVED_WORKOUT_PLANS, status: 'error', itemCount: 0, message: err?.message });
    }

    // 4. Migrate completedExercises
    try {
      const completionLog = await this.migrateCompletedExercises(storage);
      logs.push(completionLog);
      totalRecords += completionLog.itemCount;
    } catch (err: any) {
      logs.push({ key: LEGACY_STORAGE_KEYS.COMPLETED_EXERCISES, status: 'error', itemCount: 0, message: err?.message });
    }

    // 5. Migrate favoriteExercises & favoriteWorkouts
    try {
      const favoritesLog = await this.migrateFavorites(storage);
      logs.push(favoritesLog);
      totalRecords += favoritesLog.itemCount;
    } catch (err: any) {
      logs.push({ key: LEGACY_STORAGE_KEYS.FAVORITE_EXERCISES, status: 'error', itemCount: 0, message: err?.message });
    }

    // Record migration success in meta store
    const now = new Date().toISOString();
    try {
      await this.engine.put(STORES.META, {
        key: 'last_localstorage_migration_at',
        value: now,
        updatedAt: now,
      } as MetaRecord);
    } catch (err) {
      console.warn('[LocalStorageMigrationAdapter] Failed to record migration timestamp in meta', err);
    }

    const hasFatalErrors = logs.some((l) => l.status === 'error');

    return {
      success: !hasFatalErrors,
      migratedAt: now,
      alreadyMigrated: false,
      logs,
      totalRecordsProcessed: totalRecords,
    };
  }

  private async migrateUserProfile(storage: Storage): Promise<MigrationLogItem> {
    const raw = storage.getItem(LEGACY_STORAGE_KEYS.USER_PROFILE);
    if (!raw) {
      return { key: LEGACY_STORAGE_KEYS.USER_PROFILE, status: 'skipped', itemCount: 0, message: 'Key not found' };
    }

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return { key: LEGACY_STORAGE_KEYS.USER_PROFILE, status: 'error', itemCount: 0, message: 'Invalid JSON shape' };
      }

      const explicitUserId = storage.getItem(LEGACY_STORAGE_KEYS.WORKOUT_APP_USER_ID);
      const profileId = explicitUserId || parsed.id || toStableId('usr', parsed.name || 'guest_user');

      const profile: UserProfile = {
        id: profileId,
        name: parsed.name || 'Guest',
        age: typeof parsed.age === 'number' ? parsed.age : parseInt(parsed.age, 10) || undefined,
        gender: parsed.gender || undefined,
        weight: typeof parsed.weight === 'number' ? parsed.weight : parseFloat(parsed.weight) || undefined,
        fitnessLevel: (parsed.fitnessLevel || 'intermediate').toLowerCase(),
        primaryGoal: parsed.primaryGoal || parsed.goal || 'general_fitness',
        preferredEquipment: Array.isArray(parsed.preferredEquipment) ? parsed.preferredEquipment : ['bodyweight'],
        preferredMuscleGroups: Array.isArray(parsed.preferredMuscleGroups) ? parsed.preferredMuscleGroups : ['Full Body'],
        completedWorkouts: parsed.completedWorkouts || 0,
        ratings: Array.isArray(parsed.ratings) ? parsed.ratings : [],
      };

      await this.userRepo.saveProfile(profile);

      return { key: LEGACY_STORAGE_KEYS.USER_PROFILE, status: 'migrated', itemCount: 1 };
    } catch (err: any) {
      return { key: LEGACY_STORAGE_KEYS.USER_PROFILE, status: 'error', itemCount: 0, message: err?.message };
    }
  }

  private async migrateReturningUsers(storage: Storage): Promise<MigrationLogItem> {
    const raw = storage.getItem(LEGACY_STORAGE_KEYS.RETURNING_USERS);
    if (!raw) {
      return { key: LEGACY_STORAGE_KEYS.RETURNING_USERS, status: 'skipped', itemCount: 0 };
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return { key: LEGACY_STORAGE_KEYS.RETURNING_USERS, status: 'skipped', itemCount: 0 };
      }

      let count = 0;
      for (const name of parsed) {
        if (typeof name === 'string' && name.trim()) {
          const id = toStableId('usr', name.trim());
          const existing = await this.userRepo.getProfile(id);
          if (!existing) {
            await this.userRepo.saveProfile({
              id,
              name: name.trim(),
              fitnessLevel: 'intermediate',
              primaryGoal: 'general_fitness',
              preferredEquipment: ['bodyweight'],
              preferredMuscleGroups: ['Full Body'],
            });
            count++;
          }
        }
      }

      return { key: LEGACY_STORAGE_KEYS.RETURNING_USERS, status: 'migrated', itemCount: count };
    } catch (err: any) {
      return { key: LEGACY_STORAGE_KEYS.RETURNING_USERS, status: 'error', itemCount: 0, message: err?.message };
    }
  }

  private async migrateWorkouts(storage: Storage): Promise<MigrationLogItem> {
    const rawPlans = storage.getItem(LEGACY_STORAGE_KEYS.SAVED_WORKOUT_PLANS);
    const rawSaved = storage.getItem(LEGACY_STORAGE_KEYS.SAVED_WORKOUTS);

    let items: any[] = [];
    if (rawPlans) {
      try {
        const p = JSON.parse(rawPlans);
        if (Array.isArray(p)) items.push(...p);
      } catch {
        // partial parse error ignored defensively
      }
    }
    if (rawSaved) {
      try {
        const s = JSON.parse(rawSaved);
        if (Array.isArray(s)) items.push(...s);
      } catch {
        // partial parse error ignored defensively
      }
    }

    if (items.length === 0) {
      return { key: LEGACY_STORAGE_KEYS.SAVED_WORKOUT_PLANS, status: 'skipped', itemCount: 0 };
    }

    let migratedCount = 0;
    const errors: string[] = [];

    for (const item of items) {
      if (!item || typeof item !== 'object') continue;

      try {
        const id = item.id ? (isUuid(item.id) ? item.id : toStableId('tpl', String(item.id))) : generateId();
        const template: WorkoutTemplate = {
          id,
          name: item.name || 'Saved Workout',
          description: item.description || '',
          goal: item.goal || 'general_fitness',
          difficulty: (item.difficulty || 'intermediate').toLowerCase(),
          duration: item.duration || 45,
          targetMuscles: Array.isArray(item.targetMuscles) ? item.targetMuscles : ['Full Body'],
          equipment: Array.isArray(item.equipment) ? item.equipment : ['bodyweight'],
          exercises: Array.isArray(item.exercises)
            ? item.exercises.map((ex: any, idx: number) => ({
                id: ex.id ? (isUuid(ex.id) ? ex.id : toStableId('ex', `${id}-${ex.name}-${idx}`)) : generateId(),
                exerciseId: ex.exerciseId || toStableId('ex', ex.name || `ex-${idx}`),
                name: ex.name || 'Exercise',
                sets: ex.sets || 3,
                reps: String(ex.reps || '10-12'),
                rest: String(ex.rest || '60s'),
                targetMuscles: Array.isArray(ex.targetMuscles) ? ex.targetMuscles : [],
                equipment: Array.isArray(ex.equipment) ? ex.equipment : [],
                order: idx + 1,
              }))
            : [],
          isFavorite: Boolean(item.isFavorite),
          isCustom: true,
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await this.workoutRepo.saveTemplate(template);
        migratedCount++;
      } catch (err: any) {
        errors.push(err?.message || 'Error converting workout');
      }
    }

    return {
      key: LEGACY_STORAGE_KEYS.SAVED_WORKOUT_PLANS,
      status: errors.length > 0 ? 'partial' : 'migrated',
      itemCount: migratedCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private async migrateCompletedExercises(storage: Storage): Promise<MigrationLogItem> {
    const raw = storage.getItem(LEGACY_STORAGE_KEYS.COMPLETED_EXERCISES);
    if (!raw) {
      return { key: LEGACY_STORAGE_KEYS.COMPLETED_EXERCISES, status: 'skipped', itemCount: 0 };
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return { key: LEGACY_STORAGE_KEYS.COMPLETED_EXERCISES, status: 'skipped', itemCount: 0 };
      }

      let count = 0;
      for (const item of parsed) {
        if (!item || typeof item !== 'object') continue;

        const sessionId = item.id ? (isUuid(item.id) ? item.id : toStableId('ses', String(item.id))) : generateId();
        const dateStr = item.date || new Date().toISOString();

        const exercises: SessionExercise[] = (item.exercises || []).map((ex: any, idx: number) => {
          const sessionExId = generateId();
          const setsCount = ex.sets || 3;
          const sets: WorkoutSet[] = [];

          for (let s = 1; s <= setsCount; s++) {
            sets.push({
              id: generateId(),
              sessionExerciseId: sessionExId,
              setNumber: s,
              type: 'working',
              status: 'completed',
              completedAt: dateStr,
            });
          }

          return {
            id: sessionExId,
            sessionId,
            exerciseId: toStableId('ex', ex.name || `ex-${idx}`),
            name: ex.name || 'Completed Exercise',
            order: idx + 1,
            targetMuscles: ex.targetMuscles || [],
            equipment: ex.equipment || [],
            sets,
            completedAt: dateStr,
          };
        });

        const session: WorkoutSession = {
          id: sessionId,
          userId: item.userId || 'guest_user',
          workoutPlanId: item.workoutPlanId || undefined,
          name: item.name || 'Completed Workout Session',
          status: 'completed',
          startedAt: dateStr,
          completedAt: dateStr,
          durationMinutes: item.duration || 45,
          totalCaloriesBurned: item.caloriesBurned || 0,
          exercises,
        };

        await this.completionRepo.saveSession(session);
        count++;
      }

      return { key: LEGACY_STORAGE_KEYS.COMPLETED_EXERCISES, status: 'migrated', itemCount: count };
    } catch (err: any) {
      return { key: LEGACY_STORAGE_KEYS.COMPLETED_EXERCISES, status: 'error', itemCount: 0, message: err?.message };
    }
  }

  private async migrateFavorites(storage: Storage): Promise<MigrationLogItem> {
    const rawFavEx = storage.getItem(LEGACY_STORAGE_KEYS.FAVORITE_EXERCISES);
    const rawFavWorkouts = storage.getItem(LEGACY_STORAGE_KEYS.FAVORITE_WORKOUTS);

    let count = 0;
    if (rawFavEx) {
      try {
        const parsed = JSON.parse(rawFavEx);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const id = typeof item === 'string' ? item : item?.id || item?.name;
            if (id) {
              await this.favoritesRepo.addFavorite(id);
              count++;
            }
          }
        }
      } catch {
        // ignore partial parse error
      }
    }

    if (rawFavWorkouts) {
      try {
        const parsed = JSON.parse(rawFavWorkouts);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const id = typeof item === 'string' ? item : item?.id || item?.name;
            if (id) {
              await this.favoritesRepo.addFavorite(id);
              count++;
            }
          }
        }
      } catch {
        // ignore partial parse error
      }
    }

    return { key: LEGACY_STORAGE_KEYS.FAVORITE_EXERCISES, status: 'migrated', itemCount: count };
  }
}
