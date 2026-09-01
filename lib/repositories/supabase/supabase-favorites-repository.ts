/**
 * Supabase Cloud Favorites Repository
 * Implements FavoritesRepository using Supabase PostgreSQL cloud replica.
 * Canonical table: favorites.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { FavoritesRepository } from '../interfaces';
import { getBrowserSupabaseClient } from '@/lib/supabase/browser-client';

export class SupabaseFavoritesRepository implements FavoritesRepository {
  private client: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.client = client || getBrowserSupabaseClient();
  }

  private async getCurrentUserId(): Promise<string> {
    const { data } = await this.client.auth.getSession();
    const userId = data?.session?.user?.id;
    if (!userId) {
      throw new Error('[SupabaseFavoritesRepository] Authenticated user required for cloud operations');
    }
    return userId;
  }

  public async listFavorites(userId?: string): Promise<string[]> {
    const resolvedUserId = userId || (await this.getCurrentUserId());
    const { data, error } = await this.client
      .from('favorites')
      .select('entity_id')
      .eq('user_id', resolvedUserId)
      .is('deleted_at', null);

    if (error) {
      console.error('[SupabaseFavoritesRepository] listFavorites error:', error);
      return [];
    }

    return ((data || []) as any[]).map((row) => row.entity_id);
  }

  public async addFavorite(exerciseOrWorkoutId: string, userId?: string): Promise<void> {
    const resolvedUserId = userId || (await this.getCurrentUserId());
    const now = new Date().toISOString();

    const { error } = await this.client
      .from('favorites')
      .upsert(
        {
          id: `${resolvedUserId}-${exerciseOrWorkoutId}`,
          user_id: resolvedUserId,
          entity_type: 'exercise',
          entity_id: exerciseOrWorkoutId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
          version: 1,
        } as any,
        { onConflict: 'user_id,entity_type,entity_id' }
      );

    if (error) {
      console.error('[SupabaseFavoritesRepository] addFavorite error:', error);
      throw error;
    }
  }

  public async removeFavorite(exerciseOrWorkoutId: string, userId?: string): Promise<void> {
    const resolvedUserId = userId || (await this.getCurrentUserId());
    const now = new Date().toISOString();

    const { error } = await this.client
      .from('favorites')
      .update({ deleted_at: now, updated_at: now } as any)
      .eq('user_id', resolvedUserId)
      .eq('entity_id', exerciseOrWorkoutId);

    if (error) {
      console.error('[SupabaseFavoritesRepository] removeFavorite error:', error);
      throw error;
    }
  }

  public async isFavorite(exerciseOrWorkoutId: string, userId?: string): Promise<boolean> {
    const resolvedUserId = userId || (await this.getCurrentUserId());
    const { data, error } = await this.client
      .from('favorites')
      .select('id')
      .eq('user_id', resolvedUserId)
      .eq('entity_id', exerciseOrWorkoutId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      console.error('[SupabaseFavoritesRepository] isFavorite error:', error);
      return false;
    }

    return !!data;
  }
}
