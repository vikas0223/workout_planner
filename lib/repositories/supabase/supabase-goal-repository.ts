/**
 * Supabase Cloud Goal Repository
 * Implements GoalRepository using Supabase PostgreSQL with RLS.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { GoalRepository } from '../interfaces';
import { FitnessGoalTarget } from '@/types/domain';
import { getBrowserSupabaseClient } from '@/lib/supabase/browser-client';

export class SupabaseGoalRepository implements GoalRepository {
  private client: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.client = client || getBrowserSupabaseClient();
  }

  public async getGoalById(id: string): Promise<FitnessGoalTarget | null> {
    const { data: row, error } = await this.client
      .from('fitness_goals')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error || !row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      direction: row.direction,
      label: row.label || undefined,
      targetValue: Number(row.target_value),
      unit: row.unit,
      startValue:
        row.start_value !== null && row.start_value !== undefined
          ? Number(row.start_value)
          : undefined,
      startDate: row.start_date,
      targetDate: row.target_date || undefined,
      exerciseId: row.exercise_id || undefined,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  public async listGoals(userId?: string, status?: string): Promise<FitnessGoalTarget[]> {
    let query = this.client
      .from('fitness_goals')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: rows, error } = await query;
    if (error || !rows) return [];

    return rows.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      type: r.type,
      direction: r.direction,
      label: r.label || undefined,
      targetValue: Number(r.target_value),
      unit: r.unit,
      startValue:
        r.start_value !== null && r.start_value !== undefined
          ? Number(r.start_value)
          : undefined,
      startDate: r.start_date,
      targetDate: r.target_date || undefined,
      exerciseId: r.exercise_id || undefined,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  public async saveGoal(goal: FitnessGoalTarget): Promise<void> {
    const now = new Date().toISOString();
    await this.client.from('fitness_goals').upsert({
      id: goal.id,
      user_id: goal.userId,
      type: goal.type,
      direction: goal.direction,
      label: goal.label,
      target_value: goal.targetValue,
      unit: goal.unit,
      start_value: goal.startValue,
      start_date: goal.startDate,
      target_date: goal.targetDate,
      exercise_id: goal.exerciseId || null,
      status: goal.status,
      updated_at: now,
      client_updated_at: goal.updatedAt || now,
      deleted_at: null,
    });
  }

  public async deleteGoal(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.client.from('fitness_goals').update({ deleted_at: now, updated_at: now }).eq('id', id);
  }
}
