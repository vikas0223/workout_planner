/**
 * Supabase Cloud Database Type Contracts & Domain Mappers
 * Defines typed schema definitions matching supabase/migrations/20260825000000_initial_schema.sql.
 * Maps between snake_case database records and canonical camelCase domain entities.
 */

import {
  UserProfile,
  WorkoutTemplate,
  GeneratedWorkout,
  GeneratedWorkoutExercise,
  WorkoutSession,
  SessionExercise,
  WorkoutSet,
  WorkoutFeedback,
  SetType,
  SetStatus,
  SessionStatus,
  SessionExerciseStatus,
  ExperienceLevel,
  FitnessGoal,
} from '@/types/domain';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          display_name: string | null;
          units: string | null;
          experience_level: string | null;
          default_session_minutes: number | null;
          created_at: string;
          updated_at: string;
          client_updated_at: string | null;
          deleted_at: string | null;
          version: number;
        };
        Insert: {
          user_id: string;
          display_name?: string | null;
          units?: string | null;
          experience_level?: string | null;
          default_session_minutes?: number | null;
          created_at?: string;
          updated_at?: string;
          client_updated_at?: string | null;
          deleted_at?: string | null;
          version?: number;
        };
        Update: {
          user_id?: string;
          display_name?: string | null;
          units?: string | null;
          experience_level?: string | null;
          default_session_minutes?: number | null;
          created_at?: string;
          updated_at?: string;
          client_updated_at?: string | null;
          deleted_at?: string | null;
          version?: number;
        };
      };
      workout_templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          goal: string | null;
          duration_minutes: number;
          experience_level: string;
          target_muscle_ids: string[] | null;
          avoid_muscle_ids: string[] | null;
          avoid_joint_ids: string[] | null;
          equipment_ids: string[] | null;
          constraints: Json | null;
          is_favorite: boolean;
          created_at: string;
          updated_at: string;
          client_updated_at: string | null;
          deleted_at: string | null;
          version: number;
        };
        Insert: {
          id: string;
          user_id: string;
          name: string;
          goal?: string | null;
          duration_minutes: number;
          experience_level: string;
          target_muscle_ids?: string[] | null;
          avoid_muscle_ids?: string[] | null;
          avoid_joint_ids?: string[] | null;
          equipment_ids?: string[] | null;
          constraints?: Json | null;
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
          client_updated_at?: string | null;
          deleted_at?: string | null;
          version?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          goal?: string | null;
          duration_minutes?: number;
          experience_level?: string;
          target_muscle_ids?: string[] | null;
          avoid_muscle_ids?: string[] | null;
          avoid_joint_ids?: string[] | null;
          equipment_ids?: string[] | null;
          constraints?: Json | null;
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
          client_updated_at?: string | null;
          deleted_at?: string | null;
          version?: number;
        };
      };
      generated_workouts: {
        Row: {
          id: string;
          user_id: string;
          workout_template_id: string | null;
          name: string;
          goal: string;
          duration_minutes: number;
          engine_version: string;
          catalog_version: string;
          seed: string;
          generation_input: Json | null;
          generation_trace: Json | null;
          created_at: string;
          updated_at: string;
          client_updated_at: string | null;
          deleted_at: string | null;
          version: number;
        };
        Insert: {
          id: string;
          user_id: string;
          workout_template_id?: string | null;
          name: string;
          goal: string;
          duration_minutes: number;
          engine_version: string;
          catalog_version: string;
          seed: string;
          generation_input?: Json | null;
          generation_trace?: Json | null;
          created_at?: string;
          updated_at?: string;
          client_updated_at?: string | null;
          deleted_at?: string | null;
          version?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          workout_template_id?: string | null;
          name?: string;
          goal?: string;
          duration_minutes?: number;
          engine_version?: string;
          catalog_version?: string;
          seed?: string;
          generation_input?: Json | null;
          generation_trace?: Json | null;
          created_at?: string;
          updated_at?: string;
          client_updated_at?: string | null;
          deleted_at?: string | null;
          version?: number;
        };
      };
      generated_workout_exercises: {
        Row: {
          id: string;
          user_id: string;
          generated_workout_id: string;
          exercise_id: string;
          position: number;
          planned_sets: number;
          planned_reps_min: number | null;
          planned_reps_max: number | null;
          planned_duration_seconds: number | null;
          planned_rest_seconds: number | null;
          planned_load: number | null;
          intensity_target: Json | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          generated_workout_id: string;
          exercise_id: string;
          position: number;
          planned_sets: number;
          planned_reps_min?: number | null;
          planned_reps_max?: number | null;
          planned_duration_seconds?: number | null;
          planned_rest_seconds?: number | null;
          planned_load?: number | null;
          intensity_target?: Json | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          generated_workout_id?: string;
          exercise_id?: string;
          position?: number;
          planned_sets?: number;
          planned_reps_min?: number | null;
          planned_reps_max?: number | null;
          planned_duration_seconds?: number | null;
          planned_rest_seconds?: number | null;
          planned_load?: number | null;
          intensity_target?: Json | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          generated_workout_id: string | null;
          workout_template_id: string | null;
          name: string;
          started_at: string;
          completed_at: string | null;
          status: string;
          duration_seconds: number | null;
          duration_minutes: number | null;
          total_calories_burned: number | null;
          total_volume: number | null;
          perceived_exertion: number | null;
          satisfaction_rating: number | null;
          notes: string | null;
          feedback: Json | null;
          created_at: string;
          updated_at: string;
          client_updated_at: string | null;
          deleted_at: string | null;
          version: number;
        };
        Insert: {
          id: string;
          user_id: string;
          generated_workout_id?: string | null;
          workout_template_id?: string | null;
          name: string;
          started_at?: string;
          completed_at?: string | null;
          status: string;
          duration_seconds?: number | null;
          duration_minutes?: number | null;
          total_calories_burned?: number | null;
          total_volume?: number | null;
          perceived_exertion?: number | null;
          satisfaction_rating?: number | null;
          notes?: string | null;
          feedback?: Json | null;
          created_at?: string;
          updated_at?: string;
          client_updated_at?: string | null;
          deleted_at?: string | null;
          version?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          generated_workout_id?: string | null;
          workout_template_id?: string | null;
          name?: string;
          started_at?: string;
          completed_at?: string | null;
          status?: string;
          duration_seconds?: number | null;
          duration_minutes?: number | null;
          total_calories_burned?: number | null;
          total_volume?: number | null;
          perceived_exertion?: number | null;
          satisfaction_rating?: number | null;
          notes?: string | null;
          feedback?: Json | null;
          created_at?: string;
          updated_at?: string;
          client_updated_at?: string | null;
          deleted_at?: string | null;
          version?: number;
        };
      };
      session_exercises: {
        Row: {
          id: string;
          user_id: string;
          workout_session_id: string;
          exercise_id: string;
          generated_workout_exercise_id: string | null;
          position: number;
          status: string;
          planned_sets: number | null;
          planned_reps: string | null;
          planned_rest_seconds: number | null;
          substituted_from_exercise_id: string | null;
          substitution_reason: string | null;
          notes: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
          client_updated_at: string | null;
          deleted_at: string | null;
          version: number;
        };
        Insert: {
          id: string;
          user_id: string;
          workout_session_id: string;
          exercise_id: string;
          generated_workout_exercise_id?: string | null;
          position: number;
          status: string;
          planned_sets?: number | null;
          planned_reps?: string | null;
          planned_rest_seconds?: number | null;
          substituted_from_exercise_id?: string | null;
          substitution_reason?: string | null;
          notes?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          client_updated_at?: string | null;
          deleted_at?: string | null;
          version?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          workout_session_id?: string;
          exercise_id?: string;
          generated_workout_exercise_id?: string | null;
          position?: number;
          status?: string;
          planned_sets?: number | null;
          planned_reps?: string | null;
          planned_rest_seconds?: number | null;
          substituted_from_exercise_id?: string | null;
          substitution_reason?: string | null;
          notes?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          client_updated_at?: string | null;
          deleted_at?: string | null;
          version?: number;
        };
      };
      logged_sets: {
        Row: {
          id: string;
          user_id: string;
          session_exercise_id: string;
          workout_session_id: string | null;
          set_number: number;
          type: string;
          target_reps: number | null;
          actual_reps: number | null;
          load_value: number | null;
          load_unit: string | null;
          duration_seconds: number | null;
          distance_value: number | null;
          distance_unit: string | null;
          rpe: number | null;
          rir: number | null;
          rest_seconds: number | null;
          tempo: string | null;
          completed_at: string | null;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
          client_updated_at: string | null;
          deleted_at: string | null;
          version: number;
        };
        Insert: {
          id: string;
          user_id: string;
          session_exercise_id: string;
          workout_session_id?: string | null;
          set_number: number;
          type?: string;
          target_reps?: number | null;
          actual_reps?: number | null;
          load_value?: number | null;
          load_unit?: string | null;
          duration_seconds?: number | null;
          distance_value?: number | null;
          distance_unit?: string | null;
          rpe?: number | null;
          rir?: number | null;
          rest_seconds?: number | null;
          tempo?: string | null;
          completed_at?: string | null;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          client_updated_at?: string | null;
          deleted_at?: string | null;
          version?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_exercise_id?: string;
          workout_session_id?: string | null;
          set_number?: number;
          type?: string;
          target_reps?: number | null;
          actual_reps?: number | null;
          load_value?: number | null;
          load_unit?: string | null;
          duration_seconds?: number | null;
          distance_value?: number | null;
          distance_unit?: string | null;
          rpe?: number | null;
          rir?: number | null;
          rest_seconds?: number | null;
          tempo?: string | null;
          completed_at?: string | null;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          client_updated_at?: string | null;
          deleted_at?: string | null;
          version?: number;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          entity_type: string;
          entity_id: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          version: number;
        };
        Insert: {
          id: string;
          user_id: string;
          entity_type: string;
          entity_id: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          version?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          entity_type?: string;
          entity_id?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          version?: number;
        };
      };
      recommendation_events: {
        Row: {
          id: string;
          user_id: string;
          recommendation_type: string;
          entity_id: string;
          action: string;
          score: number | null;
          context: Json | null;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          recommendation_type: string;
          entity_id: string;
          action: string;
          score?: number | null;
          context?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          recommendation_type?: string;
          entity_id?: string;
          action?: string;
          score?: number | null;
          context?: Json | null;
          created_at?: string;
        };
      };
      ai_coach_messages: {
        Row: {
          id: string;
          user_id: string;
          session_id: string | null;
          role: string;
          content: string;
          context: Json | null;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          session_id?: string | null;
          role: string;
          content: string;
          context?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string | null;
          role?: string;
          content?: string;
          context?: Json | null;
          created_at?: string;
        };
      };
      sync_operations: {
        Row: {
          id: string;
          user_id: string;
          idempotency_key: string;
          operation: string;
          entity_type: string;
          entity_id: string;
          status: string;
          request_hash: string | null;
          error_data: Json | null;
          created_at: string;
          processed_at: string | null;
        };
        Insert: {
          id: string;
          user_id: string;
          idempotency_key: string;
          operation: string;
          entity_type: string;
          entity_id: string;
          status?: string;
          request_hash?: string | null;
          error_data?: Json | null;
          created_at?: string;
          processed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          idempotency_key?: string;
          operation?: string;
          entity_type?: string;
          entity_id?: string;
          status?: string;
          request_hash?: string | null;
          error_data?: Json | null;
          created_at?: string;
          processed_at?: string | null;
        };
      };
      exercises: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          movement_pattern: string | null;
          difficulty: string;
          mechanics: string | null;
          force: string | null;
          instructions: string[] | null;
          contraindications: Json | null;
          default_prescription: Json | null;
          catalog_version: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          name: string;
          description?: string | null;
          movement_pattern?: string | null;
          difficulty: string;
          mechanics?: string | null;
          force?: string | null;
          instructions?: string[] | null;
          contraindications?: Json | null;
          default_prescription?: Json | null;
          catalog_version?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          movement_pattern?: string | null;
          difficulty?: string;
          mechanics?: string | null;
          force?: string | null;
          instructions?: string[] | null;
          contraindications?: Json | null;
          default_prescription?: Json | null;
          catalog_version?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
    };
  };
}

// =============================================================================
// DOMAIN MAPPERS (snake_case DB rows <-> camelCase domain models)
// =============================================================================

export class SupabaseDomainMappers {
  public static profileToDomain(row: Database['public']['Tables']['profiles']['Row']): UserProfile {
    return {
      id: row.user_id,
      name: row.display_name || 'Anonymous User',
      fitnessLevel: (row.experience_level as ExperienceLevel) || 'beginner',
      primaryGoal: 'general_fitness' as FitnessGoal,
      preferredEquipment: [],
      preferredMuscleGroups: [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  public static profileToRow(profile: UserProfile, userId: string): Database['public']['Tables']['profiles']['Insert'] {
    const now = new Date().toISOString();
    return {
      user_id: userId,
      display_name: profile.name,
      units: profile.weightUnit === 'lbs' ? 'imperial' : 'metric',
      experience_level: profile.fitnessLevel,
      default_session_minutes: null,
      created_at: profile.createdAt || now,
      updated_at: now,
      client_updated_at: now,
      version: 1,
    };
  }

  public static templateToDomain(
    row: Database['public']['Tables']['workout_templates']['Row'],
    exercises: GeneratedWorkoutExercise[] = []
  ): WorkoutTemplate {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: undefined,
      goal: (row.goal as FitnessGoal) || 'general_fitness',
      difficulty: (row.experience_level as ExperienceLevel) || 'intermediate',
      duration: row.duration_minutes,
      targetMuscles: [],
      equipment: [],
      exercises,
      isFavorite: row.is_favorite,
      isCustom: true,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  public static templateToRow(
    template: WorkoutTemplate,
    userId: string
  ): Database['public']['Tables']['workout_templates']['Insert'] {
    const now = new Date().toISOString();
    return {
      id: template.id,
      user_id: userId,
      name: template.name,
      goal: String(template.goal),
      duration_minutes: template.duration,
      experience_level: template.difficulty,
      target_muscle_ids: null,
      avoid_muscle_ids: null,
      avoid_joint_ids: null,
      equipment_ids: null,
      constraints: null,
      is_favorite: template.isFavorite ?? false,
      created_at: template.createdAt || now,
      updated_at: now,
      client_updated_at: now,
      version: 1,
    };
  }

  public static generatedWorkoutToDomain(
    row: Database['public']['Tables']['generated_workouts']['Row'],
    exercises: GeneratedWorkoutExercise[] = []
  ): GeneratedWorkout {
    return {
      id: row.id,
      name: row.name,
      goal: row.goal as FitnessGoal,
      difficulty: 'intermediate',
      duration: row.duration_minutes,
      targetMuscles: [],
      equipment: [],
      exercises,
      trace: (row.generation_trace as any) || undefined,
      createdAt: row.created_at,
    };
  }

  public static generatedWorkoutToRow(
    workout: GeneratedWorkout,
    userId: string,
    templateId?: string | null
  ): Database['public']['Tables']['generated_workouts']['Insert'] {
    const now = new Date().toISOString();
    return {
      id: workout.id,
      user_id: userId,
      workout_template_id: templateId || null,
      name: workout.name,
      goal: String(workout.goal),
      duration_minutes: workout.duration,
      engine_version: workout.trace?.engineVersion || '1.0.0',
      catalog_version: workout.trace?.catalogVersion || '1.0.0',
      seed: workout.trace?.seed ? String(workout.trace.seed) : '0',
      generation_input: null,
      generation_trace: workout.trace ? (workout.trace as unknown as Json) : null,
      created_at: workout.createdAt || now,
      updated_at: now,
      client_updated_at: now,
      version: 1,
    };
  }

  public static sessionToDomain(
    row: Database['public']['Tables']['workout_sessions']['Row'],
    exercises: SessionExercise[] = []
  ): WorkoutSession {
    return {
      id: row.id,
      userId: row.user_id,
      workoutPlanId: row.generated_workout_id || undefined,
      name: row.name,
      status: (row.status as SessionStatus) || 'active',
      startedAt: row.started_at,
      completedAt: row.completed_at || undefined,
      durationMinutes: row.duration_minutes || undefined,
      totalCaloriesBurned: row.total_calories_burned || undefined,
      totalVolume: row.total_volume || undefined,
      exercises,
      notes: row.notes || undefined,
      feedback: (row.feedback as unknown as WorkoutFeedback) || undefined,
    };
  }

  public static sessionToRow(
    session: WorkoutSession,
    userId: string
  ): Database['public']['Tables']['workout_sessions']['Insert'] {
    const now = new Date().toISOString();
    return {
      id: session.id,
      user_id: userId,
      generated_workout_id: session.workoutPlanId || null,
      workout_template_id: null,
      name: session.name,
      started_at: session.startedAt || now,
      completed_at: session.completedAt || null,
      status: session.status,
      duration_seconds: session.durationMinutes ? session.durationMinutes * 60 : null,
      duration_minutes: session.durationMinutes || null,
      total_calories_burned: session.totalCaloriesBurned || null,
      total_volume: session.totalVolume || null,
      perceived_exertion: null,
      satisfaction_rating: session.feedback?.rating || null,
      notes: session.notes || null,
      feedback: session.feedback ? (session.feedback as unknown as Json) : null,
      created_at: session.startedAt || now,
      updated_at: now,
      client_updated_at: now,
      version: 1,
    };
  }

  public static sessionExerciseToDomain(
    row: Database['public']['Tables']['session_exercises']['Row'],
    sets: WorkoutSet[] = []
  ): SessionExercise {
    return {
      id: row.id,
      sessionId: row.workout_session_id,
      exerciseId: row.exercise_id,
      name: '',
      order: row.position,
      status: (row.status as SessionExerciseStatus) || 'pending',
      targetMuscles: [],
      equipment: [],
      sets,
      plannedSets: row.planned_sets || undefined,
      plannedReps: row.planned_reps || undefined,
      plannedRestSeconds: row.planned_rest_seconds || undefined,
      substitutedFromExerciseId: row.substituted_from_exercise_id || undefined,
      substitutionReason: row.substitution_reason || undefined,
      notes: row.notes || undefined,
      completedAt: row.completed_at || undefined,
    };
  }

  public static sessionExerciseToRow(
    ex: SessionExercise,
    userId: string
  ): Database['public']['Tables']['session_exercises']['Insert'] {
    const now = new Date().toISOString();
    return {
      id: ex.id,
      user_id: userId,
      workout_session_id: ex.sessionId,
      exercise_id: ex.exerciseId,
      generated_workout_exercise_id: null,
      position: ex.order,
      status: ex.status,
      planned_sets: ex.plannedSets || null,
      planned_reps: ex.plannedReps !== undefined ? String(ex.plannedReps) : null,
      planned_rest_seconds: ex.plannedRestSeconds || null,
      substituted_from_exercise_id: ex.substitutedFromExerciseId || null,
      substitution_reason: ex.substitutionReason || null,
      notes: ex.notes || null,
      completed_at: ex.completedAt || null,
      created_at: now,
      updated_at: now,
      client_updated_at: now,
      version: 1,
    };
  }

  public static loggedSetToDomain(row: Database['public']['Tables']['logged_sets']['Row']): WorkoutSet {
    return {
      id: row.id,
      sessionExerciseId: row.session_exercise_id,
      setNumber: row.set_number,
      type: (row.type as SetType) || 'working',
      targetReps: row.target_reps || undefined,
      actualReps: row.actual_reps || undefined,
      loadValue: row.load_value || undefined,
      loadUnit: row.load_unit || undefined,
      targetWeight: undefined,
      actualWeight: row.load_value || undefined,
      weightUnit: (row.load_unit as 'kg' | 'lbs') || undefined,
      durationSeconds: row.duration_seconds || undefined,
      distanceValue: row.distance_value || undefined,
      distanceUnit: row.distance_unit || undefined,
      rpe: row.rpe || undefined,
      rir: row.rir || undefined,
      restSeconds: row.rest_seconds || undefined,
      tempo: row.tempo || undefined,
      status: (row.status as SetStatus) || 'completed',
      notes: row.notes || undefined,
      completedAt: row.completed_at || undefined,
    };
  }

  public static loggedSetToRow(
    set: WorkoutSet,
    userId: string,
    sessionId?: string
  ): Database['public']['Tables']['logged_sets']['Insert'] {
    const now = new Date().toISOString();
    return {
      id: set.id,
      user_id: userId,
      session_exercise_id: set.sessionExerciseId,
      workout_session_id: sessionId || null,
      set_number: set.setNumber,
      type: set.type || 'working',
      target_reps: set.targetReps || null,
      actual_reps: set.actualReps || null,
      load_value: set.loadValue ?? set.actualWeight ?? null,
      load_unit: set.loadUnit ?? set.weightUnit ?? null,
      duration_seconds: set.durationSeconds || null,
      distance_value: set.distanceValue || null,
      distance_unit: set.distanceUnit || null,
      rpe: set.rpe || null,
      rir: set.rir || null,
      rest_seconds: set.restSeconds || null,
      tempo: set.tempo || null,
      completed_at: set.completedAt || null,
      status: set.status || 'completed',
      notes: set.notes || null,
      created_at: set.completedAt || now,
      updated_at: now,
      client_updated_at: now,
      version: 1,
    };
  }
}
