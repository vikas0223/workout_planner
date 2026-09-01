/**
 * Supabase Cloud Completion Repository
 * Implements CompletionRepository using Supabase PostgreSQL cloud replica.
 * Canonical sets table: logged_sets.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { CompletionRepository } from '../interfaces';
import {
  WorkoutSession,
  SessionExercise,
  WorkoutSet,
  WorkoutFeedback,
  PreviousPerformanceSummary,
  PreviousPerformanceRecord,
} from '@/types/domain';
import { SupabaseDomainMappers } from './database.types';
import { getBrowserSupabaseClient } from '@/lib/supabase/browser-client';

export class SupabaseCompletionRepository implements CompletionRepository {
  private client: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.client = client || getBrowserSupabaseClient();
  }

  private async getCurrentUserId(): Promise<string> {
    const { data } = await this.client.auth.getSession();
    const userId = data?.session?.user?.id;
    if (!userId) {
      throw new Error('[SupabaseCompletionRepository] Authenticated user required for cloud operations');
    }
    return userId;
  }

  public async getSessionById(id: string): Promise<WorkoutSession | null> {
    const { data: sessionRow, error: sessionError } = await this.client
      .from('workout_sessions')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (sessionError || !sessionRow) {
      if (sessionError) console.error('[SupabaseCompletionRepository] getSessionById error:', sessionError);
      return null;
    }

    const exercises = await this.getSessionExercises(id);
    return SupabaseDomainMappers.sessionToDomain(sessionRow as any, exercises);
  }

  public async getActiveSession(userId?: string): Promise<WorkoutSession | null> {
    const resolvedUserId = userId || (await this.getCurrentUserId());
    const { data: sessionRow, error: sessionError } = await this.client
      .from('workout_sessions')
      .select('*')
      .eq('user_id', resolvedUserId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('started_at', { ascending: false })
      .maybeSingle();

    if (sessionError || !sessionRow) {
      if (sessionError) console.error('[SupabaseCompletionRepository] getActiveSession error:', sessionError);
      return null;
    }

    const exercises = await this.getSessionExercises((sessionRow as any).id);
    return SupabaseDomainMappers.sessionToDomain(sessionRow as any, exercises);
  }

  public async listSessions(userId?: string): Promise<WorkoutSession[]> {
    let query = this.client
      .from('workout_sessions')
      .select('*')
      .is('deleted_at', null)
      .order('started_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: sessionRows, error } = await query;
    if (error) {
      console.error('[SupabaseCompletionRepository] listSessions error:', error);
      return [];
    }

    const sessions: WorkoutSession[] = [];
    for (const row of (sessionRows || []) as any[]) {
      const exercises = await this.getSessionExercises(row.id);
      sessions.push(SupabaseDomainMappers.sessionToDomain(row, exercises));
    }
    return sessions;
  }

  public async saveSession(session: WorkoutSession): Promise<void> {
    const userId = session.userId || (await this.getCurrentUserId());
    const sessionRow = SupabaseDomainMappers.sessionToRow(session, userId);

    const { error: sessionError } = await this.client
      .from('workout_sessions')
      .upsert(sessionRow as any, { onConflict: 'id' });

    if (sessionError) {
      console.error('[SupabaseCompletionRepository] saveSession error:', sessionError);
      throw sessionError;
    }

    if (session.exercises && session.exercises.length > 0) {
      for (const ex of session.exercises) {
        const exRow = SupabaseDomainMappers.sessionExerciseToRow(ex, userId);
        const { error: exError } = await this.client
          .from('session_exercises')
          .upsert(exRow as any, { onConflict: 'id' });

        if (exError) {
          console.error('[SupabaseCompletionRepository] saveSession exercise error:', exError);
          throw exError;
        }

        if (ex.sets && ex.sets.length > 0) {
          const setRows = ex.sets.map((s) =>
            SupabaseDomainMappers.loggedSetToRow(s, userId, session.id)
          );
          const { error: setError } = await this.client
            .from('logged_sets')
            .upsert(setRows as any, { onConflict: 'id' });

          if (setError) {
            console.error('[SupabaseCompletionRepository] saveSession sets error:', setError);
            throw setError;
          }
        }
      }
    }
  }

  public async saveFeedback(feedback: WorkoutFeedback): Promise<void> {
    const now = new Date().toISOString();
    const targetSessionId = feedback.sessionId || feedback.workoutPlanId;
    if (!targetSessionId) {
      throw new Error('[SupabaseCompletionRepository] saveFeedback requires sessionId or workoutPlanId');
    }

    const { error } = await this.client
      .from('workout_sessions')
      .update({
        feedback: feedback as any,
        satisfaction_rating: feedback.rating || null,
        updated_at: now,
        client_updated_at: now,
      } as any)
      .eq('id', targetSessionId);

    if (error) {
      console.error('[SupabaseCompletionRepository] saveFeedback error:', error);
      throw error;
    }
  }

  public async getSessionExercises(sessionId: string): Promise<SessionExercise[]> {
    const { data: exRows, error: exError } = await this.client
      .from('session_exercises')
      .select('*')
      .eq('workout_session_id', sessionId)
      .is('deleted_at', null)
      .order('position', { ascending: true });

    if (exError) {
      console.error('[SupabaseCompletionRepository] getSessionExercises error:', exError);
      return [];
    }

    const result: SessionExercise[] = [];
    for (const row of (exRows || []) as any[]) {
      const sets = await this.getSets(row.id);
      result.push(SupabaseDomainMappers.sessionExerciseToDomain(row, sets));
    }
    return result;
  }

  public async getSets(sessionExerciseId: string): Promise<WorkoutSet[]> {
    const { data: setRows, error: setError } = await this.client
      .from('logged_sets')
      .select('*')
      .eq('session_exercise_id', sessionExerciseId)
      .is('deleted_at', null)
      .order('set_number', { ascending: true });

    if (setError) {
      console.error('[SupabaseCompletionRepository] getSets error:', setError);
      return [];
    }

    return (setRows || []).map((row: any) => SupabaseDomainMappers.loggedSetToDomain(row));
  }

  public async getPreviousPerformance(
    exerciseId: string,
    userId?: string
  ): Promise<PreviousPerformanceSummary | null> {
    const resolvedUserId = userId || (await this.getCurrentUserId());

    const { data: exRows, error: exError } = await this.client
      .from('session_exercises')
      .select('id, workout_session_id, completed_at, status')
      .eq('user_id', resolvedUserId)
      .eq('exercise_id', exerciseId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (exError || !exRows || exRows.length === 0) {
      return null;
    }

    const exList = exRows as any[];
    const exIds = exList.map((r) => r.id);
    const { data: setRows, error: setError } = await this.client
      .from('logged_sets')
      .select('*')
      .in('session_exercise_id', exIds)
      .eq('status', 'completed')
      .is('deleted_at', null)
      .order('completed_at', { ascending: false });

    if (setError || !setRows || setRows.length === 0) {
      return null;
    }

    const sets = (setRows as any[]).map(SupabaseDomainMappers.loggedSetToDomain);
    let maxWeight = 0;
    let maxReps = 0;

    const recentSets: PreviousPerformanceRecord[] = [];
    for (const set of sets) {
      if (set.actualWeight && set.actualWeight > maxWeight) maxWeight = set.actualWeight;
      if (set.actualReps && set.actualReps > maxReps) maxReps = set.actualReps;

      const parentEx = exList.find((e) => e.id === set.sessionExerciseId);
      recentSets.push({
        sessionId: parentEx?.workout_session_id || '',
        completedAt: set.completedAt || parentEx?.completed_at || new Date().toISOString(),
        setNumber: set.setNumber,
        reps: set.actualReps,
        weight: set.actualWeight ?? set.loadValue,
        weightUnit: set.weightUnit ?? set.loadUnit,
        rpe: set.rpe,
        notes: set.notes,
      });
    }

    return {
      exerciseId,
      lastPerformedAt: exList[0]?.completed_at || undefined,
      maxWeight: maxWeight > 0 ? maxWeight : undefined,
      maxReps: maxReps > 0 ? maxReps : undefined,
      totalSetsCompleted: sets.length,
      recentSets,
    };
  }
}
