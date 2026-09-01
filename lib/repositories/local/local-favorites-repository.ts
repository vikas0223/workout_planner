/**
 * Local Favorites Repository (IndexedDB backed)
 * Implements FavoritesRepository for workouts and exercises.
 */

import { FavoritesRepository } from '@/lib/repositories/interfaces';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { STORES, FavoriteRecord } from '@/lib/storage/indexeddb-schema';

export class LocalFavoritesRepository implements FavoritesRepository {
  constructor(private engine: IndexedDBEngine = IndexedDBEngine.getInstance()) {}

  public async listFavorites(userId: string = 'guest_user'): Promise<string[]> {
    try {
      const records = await this.engine.getByIndex<FavoriteRecord>(
        STORES.FAVORITES,
        'ownerId',
        userId
      );
      return records.filter((r) => !r.deletedAt).map((r) => r.entityId);
    } catch (err) {
      console.warn('[LocalFavoritesRepository] Failed to listFavorites', err);
      return [];
    }
  }

  public async addFavorite(
    exerciseOrWorkoutId: string,
    userId: string = 'guest_user'
  ): Promise<void> {
    const recordId = `${userId}_${exerciseOrWorkoutId}`;
    const now = new Date().toISOString();

    const record: FavoriteRecord = {
      id: recordId,
      ownerKind: 'guest',
      ownerId: userId,
      createdAt: now,
      updatedAt: now,
      clientUpdatedAt: now,
      version: 1,
      syncStatus: 'local',
      entityId: exerciseOrWorkoutId,
      entityType: exerciseOrWorkoutId.startsWith('ex') ? 'exercise' : 'workout',
    };

    await this.engine.put(STORES.FAVORITES, record);
  }

  public async removeFavorite(
    exerciseOrWorkoutId: string,
    userId: string = 'guest_user'
  ): Promise<void> {
    const recordId = `${userId}_${exerciseOrWorkoutId}`;
    await this.engine.delete(STORES.FAVORITES, recordId);
  }

  public async isFavorite(
    exerciseOrWorkoutId: string,
    userId: string = 'guest_user'
  ): Promise<boolean> {
    const recordId = `${userId}_${exerciseOrWorkoutId}`;
    const record = await this.engine.get<FavoriteRecord>(STORES.FAVORITES, recordId);
    return Boolean(record && !record.deletedAt);
  }
}
