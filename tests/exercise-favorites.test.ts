/**
 * Phase 2F: Exercise Favorites Integration Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { LocalFavoritesRepository } from '@/lib/repositories/local/local-favorites-repository';
import { ExerciseCatalog } from '@/lib/data/exercise-catalog';

describe('Phase 2F: Exercise Favorites Integration', () => {
  let repo: LocalFavoritesRepository;
  const userId = 'guest_user';

  beforeEach(() => {
    setupMockIndexedDB();
    IndexedDBEngine.resetInstance();
    repo = new LocalFavoritesRepository();
  });

  it('adds and retrieves favorite exercises in IndexedDB', async () => {
    const exercise = ExerciseCatalog.listExercises()[0];
    expect(await repo.isFavorite(exercise.id, userId)).toBe(false);

    await repo.addFavorite(exercise.id, userId);
    expect(await repo.isFavorite(exercise.id, userId)).toBe(true);

    const favs = await repo.listFavorites(userId);
    expect(favs).toContain(exercise.id);
  });

  it('removes favorite exercise correctly', async () => {
    const exercise = ExerciseCatalog.listExercises()[1];
    await repo.addFavorite(exercise.id, userId);
    expect(await repo.isFavorite(exercise.id, userId)).toBe(true);

    await repo.removeFavorite(exercise.id, userId);
    expect(await repo.isFavorite(exercise.id, userId)).toBe(false);

    const favs = await repo.listFavorites(userId);
    expect(favs).not.toContain(exercise.id);
  });

  it('handles multiple favorites without duplicates', async () => {
    const [ex1, ex2] = ExerciseCatalog.listExercises().slice(0, 2);
    await repo.addFavorite(ex1.id, userId);
    await repo.addFavorite(ex2.id, userId);
    // Re-add should be idempotent
    await repo.addFavorite(ex1.id, userId);

    const favs = await repo.listFavorites(userId);
    expect(favs.length).toBe(2);
    expect(favs).toContain(ex1.id);
    expect(favs).toContain(ex2.id);
  });
});
