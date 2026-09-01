/**
 * Migration Fixture Edge-Case Test Suite
 * Tests normal, empty, malformed, and duplicate/missing ID fixtures against LocalStorageMigrationAdapter.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { LocalStorageMigrationAdapter } from '@/lib/storage/migration-adapter';
import { LEGACY_STORAGE_FIXTURES } from './fixtures/legacy-storage-fixtures';
import { LEGACY_STORAGE_KEYS } from '@/lib/storage/local-storage-compat';
import { LocalUserRepository, LocalWorkoutRepository, LocalFavoritesRepository } from '@/lib/repositories/local';

describe('LocalStorage Migration Fixture Scenarios', () => {
  beforeEach(() => {
    IndexedDBEngine.resetInstance();
    setupMockIndexedDB();
  });

  function createMockStorage(fixture: Record<string, any>) {
    const store = new Map<string, string>();
    if (fixture.userProfile !== undefined && fixture.userProfile !== null) {
      store.set(
        LEGACY_STORAGE_KEYS.USER_PROFILE,
        typeof fixture.userProfile === 'string' ? fixture.userProfile : JSON.stringify(fixture.userProfile)
      );
    }
    if (fixture.returningUsers !== undefined) {
      store.set(
        LEGACY_STORAGE_KEYS.RETURNING_USERS,
        typeof fixture.returningUsers === 'string' ? fixture.returningUsers : JSON.stringify(fixture.returningUsers)
      );
    }
    if (fixture.savedWorkoutPlans !== undefined) {
      store.set(
        LEGACY_STORAGE_KEYS.SAVED_WORKOUT_PLANS,
        typeof fixture.savedWorkoutPlans === 'string'
          ? fixture.savedWorkoutPlans
          : JSON.stringify(fixture.savedWorkoutPlans)
      );
    }
    if (fixture.completedExercises !== undefined) {
      store.set(
        LEGACY_STORAGE_KEYS.COMPLETED_EXERCISES,
        typeof fixture.completedExercises === 'string'
          ? fixture.completedExercises
          : JSON.stringify(fixture.completedExercises)
      );
    }
    if (fixture.favoriteExercises !== undefined) {
      store.set(
        LEGACY_STORAGE_KEYS.FAVORITE_EXERCISES,
        typeof fixture.favoriteExercises === 'string'
          ? fixture.favoriteExercises
          : JSON.stringify(fixture.favoriteExercises)
      );
    }

    const mockStorage = {
      getItem(k: string) {
        return store.get(k) || null;
      },
      setItem(k: string, v: string) {
        store.set(k, v);
      },
    };
    (globalThis as any).localStorage = mockStorage;
    return mockStorage;
  }

  it('correctly migrates NORMAL legacy dataset', async () => {
    createMockStorage(LEGACY_STORAGE_FIXTURES.NORMAL);
    const adapter = new LocalStorageMigrationAdapter();
    const report = await adapter.runMigration(true);

    expect(report.success).toBe(true);
    expect(report.totalRecordsProcessed).toBeGreaterThan(0);

    const userRepo = new LocalUserRepository();
    const profile = await userRepo.getCurrentGuestProfile();
    expect(profile?.name).toBe('Jordan Rivera');

    const favRepo = new LocalFavoritesRepository();
    const favs = await favRepo.listFavorites('guest_user');
    expect(favs.length).toBe(3);
  });

  it('gracefully handles EMPTY legacy storage without errors', async () => {
    createMockStorage(LEGACY_STORAGE_FIXTURES.EMPTY);
    const adapter = new LocalStorageMigrationAdapter();
    const report = await adapter.runMigration(true);

    expect(report.success).toBe(true);
    expect(report.totalRecordsProcessed).toBe(0);
  });

  it('resiliently handles MALFORMED corrupted JSON strings', async () => {
    createMockStorage(LEGACY_STORAGE_FIXTURES.MALFORMED);
    const adapter = new LocalStorageMigrationAdapter();
    const report = await adapter.runMigration(true);

    expect(report).toBeDefined();
    // Adapter reports errors safely in logs without throwing fatal crashes
    const errorLogs = report.logs.filter((l) => l.status === 'error');
    expect(errorLogs.length).toBeGreaterThanOrEqual(1);
  });

  it('deduplicates duplicate records and generates stable IDs for missing-ID fixtures', async () => {
    createMockStorage(LEGACY_STORAGE_FIXTURES.DUPLICATE_AND_MISSING_IDS);
    const adapter = new LocalStorageMigrationAdapter();
    const report = await adapter.runMigration(true);

    expect(report).toBeDefined();

    const userRepo = new LocalUserRepository();
    const users = await userRepo.listReturningUsers();
    // Returning users should have only one entry for Duplicate Tester
    const duplicateCount = users.filter((u) => u === 'Duplicate Tester').length;
    expect(duplicateCount).toBe(1);

    const workoutRepo = new LocalWorkoutRepository();
    const templates = await workoutRepo.listTemplates();
    expect(templates.length).toBeGreaterThan(0);
    templates.forEach((t) => {
      expect(t.id).toBeDefined();
      expect(t.id.length).toBeGreaterThan(0);
    });
  });
});
