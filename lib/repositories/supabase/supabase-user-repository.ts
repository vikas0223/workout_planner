/**
 * Supabase Cloud User Repository
 * Implements UserRepository using Supabase PostgreSQL cloud replica.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { UserRepository } from '../interfaces';
import { UserProfile } from '@/types/domain';
import { SupabaseDomainMappers } from './database.types';
import { getBrowserSupabaseClient } from '@/lib/supabase/browser-client';

export class SupabaseUserRepository implements UserRepository {
  private client: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.client = client || getBrowserSupabaseClient();
  }

  public async getProfile(id: string): Promise<UserProfile | null> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('user_id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      console.error('[SupabaseUserRepository] getProfile error:', error);
      return null;
    }

    if (!data) return null;
    return SupabaseDomainMappers.profileToDomain(data as any);
  }

  public async saveProfile(profile: UserProfile): Promise<void> {
    const row = SupabaseDomainMappers.profileToRow(profile, profile.id);
    const { error } = await this.client
      .from('profiles')
      .upsert(row as any, { onConflict: 'user_id' });

    if (error) {
      console.error('[SupabaseUserRepository] saveProfile error:', error);
      throw error;
    }
  }

  /**
   * @deprecated Legacy localStorage compatibility method.
   * Supabase cloud does not enumerate all users for privacy and RLS constraints.
   * Returns only the current user's profile ID if authenticated.
   */
  public async listReturningUsers(): Promise<string[]> {
    const { data: sessionData } = await this.client.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    return userId ? [userId] : [];
  }
}
