/**
 * Supabase Cloud Challenge Repository
 * Implements ChallengeRepository using Supabase PostgreSQL with RLS.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ChallengeRepository } from '../interfaces';
import { Challenge, ChallengeProgress } from '@/types/domain';
import { PLATFORM_CHALLENGE_CATALOG } from '@/lib/domain/platform-catalogs';
import { getBrowserSupabaseClient } from '@/lib/supabase/browser-client';

export class SupabaseChallengeRepository implements ChallengeRepository {
  private client: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.client = client || getBrowserSupabaseClient();
  }

  public async listChallenges(): Promise<Challenge[]> {
    const { data: rows, error } = await this.client
      .from('challenges')
      .select('*')
      .eq('status', 'active');

    if (error || !rows || rows.length === 0) {
      return PLATFORM_CHALLENGE_CATALOG;
    }

    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description || undefined,
      type: r.type,
      targetValue: Number(r.target_value),
      unit: r.unit,
      startDate: r.start_date,
      endDate: r.end_date,
      status: r.status,
      createdAt: r.created_at,
    }));
  }

  public async getChallengeById(id: string): Promise<Challenge | null> {
    const all = await this.listChallenges();
    return all.find((c) => c.id === id) || null;
  }

  public async getUserChallengeProgress(
    challengeId: string,
    userId?: string
  ): Promise<ChallengeProgress | null> {
    if (!userId) return null;

    const { data: row, error } = await this.client
      .from('challenge_progress')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error || !row) return null;

    return {
      id: row.id,
      challengeId: row.challenge_id,
      userId: row.user_id,
      status: row.status,
      joinedAt: row.joined_at,
      completedAt: row.completed_at || undefined,
      updatedAt: row.updated_at,
    };
  }

  public async listUserParticipations(userId?: string): Promise<ChallengeProgress[]> {
    if (!userId) return [];

    const { data: rows, error } = await this.client
      .from('challenge_progress')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (error || !rows) return [];

    return rows.map((r: any) => ({
      id: r.id,
      challengeId: r.challenge_id,
      userId: r.user_id,
      status: r.status,
      joinedAt: r.joined_at,
      completedAt: r.completed_at || undefined,
      updatedAt: r.updated_at,
    }));
  }

  public async saveChallengeProgress(progress: ChallengeProgress): Promise<void> {
    const now = new Date().toISOString();
    await this.client.from('challenge_progress').upsert({
      id: progress.id,
      challenge_id: progress.challengeId,
      user_id: progress.userId,
      status: progress.status,
      joined_at: progress.joinedAt,
      completed_at: progress.completedAt || null,
      updated_at: now,
      client_updated_at: progress.updatedAt || now,
      deleted_at: null,
    });
  }
}
