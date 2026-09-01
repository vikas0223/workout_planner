/**
 * Supabase Cloud Workout Repository
 * Implements WorkoutRepository using Supabase PostgreSQL cloud replica.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { WorkoutRepository } from '../interfaces';
import { WorkoutTemplate, GeneratedWorkout, GeneratedWorkoutExercise } from '@/types/domain';
import { SupabaseDomainMappers } from './database.types';
import { getBrowserSupabaseClient } from '@/lib/supabase/browser-client';

export class SupabaseWorkoutRepository implements WorkoutRepository {
  private client: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.client = client || getBrowserSupabaseClient();
  }

  private async getCurrentUserId(): Promise<string> {
    const { data } = await this.client.auth.getSession();
    const userId = data?.session?.user?.id;
    if (!userId) {
      throw new Error('[SupabaseWorkoutRepository] Authenticated user required for cloud operations');
    }
    return userId;
  }

  public async getTemplateById(id: string): Promise<WorkoutTemplate | null> {
    const { data, error } = await this.client
      .from('workout_templates')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      console.error('[SupabaseWorkoutRepository] getTemplateById error:', error);
      return null;
    }

    if (!data) return null;
    return SupabaseDomainMappers.templateToDomain(data as any, []);
  }

  public async listTemplates(userId?: string): Promise<WorkoutTemplate[]> {
    let query = this.client
      .from('workout_templates')
      .select('*')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[SupabaseWorkoutRepository] listTemplates error:', error);
      return [];
    }

    return (data || []).map((row: any) => SupabaseDomainMappers.templateToDomain(row, []));
  }

  public async saveTemplate(template: WorkoutTemplate): Promise<void> {
    const userId = template.userId || (await this.getCurrentUserId());
    const row = SupabaseDomainMappers.templateToRow(template, userId);

    const { error } = await this.client
      .from('workout_templates')
      .upsert(row as any, { onConflict: 'id' });

    if (error) {
      console.error('[SupabaseWorkoutRepository] saveTemplate error:', error);
      throw error;
    }
  }

  public async deleteTemplate(id: string): Promise<void> {
    const now = new Date().toISOString();
    const { error } = await this.client
      .from('workout_templates')
      .update({ deleted_at: now, updated_at: now } as any)
      .eq('id', id);

    if (error) {
      console.error('[SupabaseWorkoutRepository] deleteTemplate error:', error);
      throw error;
    }
  }

  public async getGeneratedWorkoutById(id: string): Promise<GeneratedWorkout | null> {
    const { data: workoutRow, error: workoutError } = await this.client
      .from('generated_workouts')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (workoutError || !workoutRow) {
      if (workoutError) console.error('[SupabaseWorkoutRepository] getGeneratedWorkoutById error:', workoutError);
      return null;
    }

    const { data: exerciseRows, error: exerciseError } = await this.client
      .from('generated_workout_exercises')
      .select('*')
      .eq('generated_workout_id', id)
      .order('position', { ascending: true });

    if (exerciseError) {
      console.error('[SupabaseWorkoutRepository] getGeneratedWorkoutById exercises error:', exerciseError);
    }

    const exercises: GeneratedWorkoutExercise[] = (exerciseRows || []).map((row: any) => ({
      id: row.id,
      exerciseId: row.exercise_id,
      name: '',
      sets: row.planned_sets,
      reps: row.planned_reps_max ? `${row.planned_reps_min || 8}-${row.planned_reps_max}` : String(row.planned_reps_min || 10),
      rest: `${row.planned_rest_seconds || 60}s`,
      targetMuscles: [],
      equipment: [],
      notes: row.notes || undefined,
      order: row.position,
    }));

    return SupabaseDomainMappers.generatedWorkoutToDomain(workoutRow as any, exercises);
  }

  public async saveGeneratedWorkout(workout: GeneratedWorkout, templateId?: string | null): Promise<void> {
    const userId = await this.getCurrentUserId();
    const workoutRow = SupabaseDomainMappers.generatedWorkoutToRow(workout, userId, templateId);

    const { error: workoutError } = await this.client
      .from('generated_workouts')
      .upsert(workoutRow as any, { onConflict: 'id' });

    if (workoutError) {
      console.error('[SupabaseWorkoutRepository] saveGeneratedWorkout error:', workoutError);
      throw workoutError;
    }

    if (workout.exercises && workout.exercises.length > 0) {
      const exerciseRows = workout.exercises.map((ex, index) => {
        const plannedRepsNum = typeof ex.reps === 'number' ? ex.reps : parseInt(String(ex.reps), 10) || 10;
        const restNum = typeof ex.rest === 'string' ? parseInt(ex.rest.replace(/\D/g, ''), 10) || 60 : 60;
        return {
          id: ex.id || `${workout.id}-ex-${index + 1}`,
          user_id: userId,
          generated_workout_id: workout.id,
          exercise_id: ex.exerciseId,
          position: ex.order || index + 1,
          planned_sets: ex.sets || 3,
          planned_reps_min: plannedRepsNum,
          planned_reps_max: plannedRepsNum,
          planned_duration_seconds: null,
          planned_rest_seconds: restNum,
          planned_load: null,
          intensity_target: null,
          notes: ex.notes || null,
        };
      });

      const { error: exError } = await this.client
        .from('generated_workout_exercises')
        .upsert(exerciseRows as any, { onConflict: 'id' });

      if (exError) {
        console.error('[SupabaseWorkoutRepository] saveGeneratedWorkout exercises error:', exError);
        throw exError;
      }
    }
  }
}
