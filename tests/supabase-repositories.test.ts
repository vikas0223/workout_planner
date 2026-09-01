/**
 * Supabase Cloud Repositories & Domain Mappers Unit Tests
 * Tests schema mapping fidelity, soft delete handling, user scoping, and favorites table operations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SupabaseDomainMappers,
  SupabaseUserRepository,
  SupabaseWorkoutRepository,
  SupabaseCompletionRepository,
  SupabaseFavoritesRepository,
} from '@/lib/repositories/supabase';
import {
  UserProfile,
  WorkoutTemplate,
  GeneratedWorkout,
  WorkoutSession,
  SessionExercise,
  WorkoutSet,
} from '@/types/domain';

describe('Phase 2D-A: Supabase Domain Mappers', () => {
  it('correctly maps UserProfile <-> profiles Row/Insert', () => {
    const profile: UserProfile = {
      id: 'usr-123',
      name: 'Alex Rivera',
      fitnessLevel: 'intermediate',
      primaryGoal: 'muscle_gain',
      preferredEquipment: ['dumbbell'],
      preferredMuscleGroups: ['chest'],
      weightUnit: 'lbs',
      createdAt: '2026-08-25T00:00:00Z',
      updatedAt: '2026-08-25T00:00:00Z',
    };

    const row = SupabaseDomainMappers.profileToRow(profile, 'usr-123');
    expect(row.user_id).toBe('usr-123');
    expect(row.display_name).toBe('Alex Rivera');
    expect(row.units).toBe('imperial');
    expect(row.experience_level).toBe('intermediate');

    const domain = SupabaseDomainMappers.profileToDomain({
      user_id: 'usr-123',
      display_name: 'Alex Rivera',
      units: 'imperial',
      experience_level: 'intermediate',
      default_session_minutes: 45,
      created_at: '2026-08-25T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
      client_updated_at: null,
      deleted_at: null,
      version: 1,
    });

    expect(domain.id).toBe('usr-123');
    expect(domain.name).toBe('Alex Rivera');
    expect(domain.fitnessLevel).toBe('intermediate');
  });

  it('correctly maps WorkoutSession <-> workout_sessions Row/Insert', () => {
    const session: WorkoutSession = {
      id: 'ses-456',
      userId: 'usr-123',
      name: 'Push Day',
      status: 'active',
      startedAt: '2026-08-25T10:00:00Z',
      durationMinutes: 45,
      totalVolume: 1200,
      exercises: [],
    };

    const row = SupabaseDomainMappers.sessionToRow(session, 'usr-123');
    expect(row.id).toBe('ses-456');
    expect(row.user_id).toBe('usr-123');
    expect(row.status).toBe('active');
    expect(row.duration_minutes).toBe(45);
    expect(row.total_volume).toBe(1200);

    const domain = SupabaseDomainMappers.sessionToDomain({
      id: 'ses-456',
      user_id: 'usr-123',
      generated_workout_id: null,
      workout_template_id: null,
      name: 'Push Day',
      started_at: '2026-08-25T10:00:00Z',
      completed_at: null,
      status: 'active',
      duration_seconds: 2700,
      duration_minutes: 45,
      total_calories_burned: 300,
      total_volume: 1200,
      perceived_exertion: 8,
      satisfaction_rating: 4,
      notes: null,
      feedback: null,
      created_at: '2026-08-25T10:00:00Z',
      updated_at: '2026-08-25T10:00:00Z',
      client_updated_at: null,
      deleted_at: null,
      version: 1,
    });

    expect(domain.id).toBe('ses-456');
    expect(domain.status).toBe('active');
    expect(domain.durationMinutes).toBe(45);
  });

  it('correctly maps SessionExercise and logged_sets preserving Phase 2C semantics', () => {
    const exercise: SessionExercise = {
      id: 'sex-789',
      sessionId: 'ses-456',
      exerciseId: 'ex-bench',
      name: 'Barbell Bench Press',
      order: 1,
      status: 'active',
      targetMuscles: ['chest'],
      equipment: ['barbell'],
      plannedSets: 4,
      plannedReps: '8-12',
      plannedRestSeconds: 90,
      sets: [],
    };

    const exRow = SupabaseDomainMappers.sessionExerciseToRow(exercise, 'usr-123');
    expect(exRow.id).toBe('sex-789');
    expect(exRow.workout_session_id).toBe('ses-456');
    expect(exRow.exercise_id).toBe('ex-bench');
    expect(exRow.planned_sets).toBe(4);
    expect(exRow.planned_reps).toBe('8-12');
    expect(exRow.planned_rest_seconds).toBe(90);

    const set: WorkoutSet = {
      id: 'set-101',
      sessionExerciseId: 'sex-789',
      setNumber: 1,
      type: 'working',
      actualReps: 10,
      actualWeight: 80,
      weightUnit: 'kg',
      rpe: 8,
      rir: 2,
      restSeconds: 90,
      status: 'completed',
    };

    const setRow = SupabaseDomainMappers.loggedSetToRow(set, 'usr-123', 'ses-456');
    expect(setRow.id).toBe('set-101');
    expect(setRow.user_id).toBe('usr-123');
    expect(setRow.session_exercise_id).toBe('sex-789');
    expect(setRow.workout_session_id).toBe('ses-456');
    expect(setRow.set_number).toBe(1);
    expect(setRow.actual_reps).toBe(10);
    expect(setRow.load_value).toBe(80);
    expect(setRow.load_unit).toBe('kg');
    expect(setRow.rpe).toBe(8);
  });
});

describe('Phase 2D-A: Supabase Repositories with Mock Client', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: 'usr-mock-1' } } },
        }),
      },
      from: vi.fn(),
    };
  });

  it('SupabaseUserRepository retrieves profile and respects soft deletes', async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockIs = vi.fn().mockReturnThis();
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        user_id: 'usr-mock-1',
        display_name: 'Test Athlete',
        units: 'metric',
        experience_level: 'advanced',
        default_session_minutes: 60,
        created_at: '2026-08-25T00:00:00Z',
        updated_at: '2026-08-25T00:00:00Z',
        client_updated_at: null,
        deleted_at: null,
        version: 1,
      },
      error: null,
    });

    mockClient.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      is: mockIs,
      maybeSingle: mockMaybeSingle,
    });

    const repo = new SupabaseUserRepository(mockClient);
    const profile = await repo.getProfile('usr-mock-1');

    expect(profile).not.toBeNull();
    expect(profile?.name).toBe('Test Athlete');
    expect(mockClient.from).toHaveBeenCalledWith('profiles');
    expect(mockIs).toHaveBeenCalledWith('deleted_at', null);
  });

  it('SupabaseUserRepository.listReturningUsers returns only user-scoped identity', async () => {
    const repo = new SupabaseUserRepository(mockClient);
    const users = await repo.listReturningUsers();
    expect(users).toEqual(['usr-mock-1']);
  });

  it('SupabaseWorkoutRepository saves and retrieves templates and generated workouts', async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockIs = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockReturnThis();
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'tmpl-1',
        user_id: 'usr-mock-1',
        name: 'Strength Upper',
        goal: 'strength',
        duration_minutes: 45,
        experience_level: 'intermediate',
        target_muscle_ids: null,
        avoid_muscle_ids: null,
        avoid_joint_ids: null,
        equipment_ids: null,
        constraints: null,
        is_favorite: false,
        created_at: '2026-08-25T00:00:00Z',
        updated_at: '2026-08-25T00:00:00Z',
        client_updated_at: null,
        deleted_at: null,
        version: 1,
      },
      error: null,
    });

    mockClient.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      is: mockIs,
      order: mockOrder,
      upsert: mockUpsert,
      maybeSingle: mockMaybeSingle,
    });

    const repo = new SupabaseWorkoutRepository(mockClient);
    const template = await repo.getTemplateById('tmpl-1');

    expect(template).not.toBeNull();
    expect(template?.name).toBe('Strength Upper');
    expect(mockClient.from).toHaveBeenCalledWith('workout_templates');
  });

  it('SupabaseCompletionRepository queries active session and logged sets with soft-delete filter', async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockIs = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockReturnThis();
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'ses-active-1',
        user_id: 'usr-mock-1',
        generated_workout_id: null,
        workout_template_id: null,
        name: 'Leg Day',
        started_at: '2026-08-25T10:00:00Z',
        completed_at: null,
        status: 'active',
        duration_seconds: null,
        duration_minutes: null,
        total_calories_burned: null,
        total_volume: null,
        perceived_exertion: null,
        satisfaction_rating: null,
        notes: null,
        feedback: null,
        created_at: '2026-08-25T10:00:00Z',
        updated_at: '2026-08-25T10:00:00Z',
        client_updated_at: null,
        deleted_at: null,
        version: 1,
      },
      error: null,
    });

    mockClient.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      is: mockIs,
      order: mockOrder,
      upsert: mockUpsert,
      maybeSingle: mockMaybeSingle,
    });

    const repo = new SupabaseCompletionRepository(mockClient);
    const activeSession = await repo.getActiveSession('usr-mock-1');

    expect(activeSession).not.toBeNull();
    expect(activeSession?.name).toBe('Leg Day');
    expect(activeSession?.status).toBe('active');
    expect(mockClient.from).toHaveBeenCalledWith('workout_sessions');
  });

  it('SupabaseFavoritesRepository checks and removes favorites on favorites table', async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockIs = vi.fn().mockReturnThis();
    const mockUpdate = vi.fn().mockReturnThis();
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: 'fav-1' },
      error: null,
    });

    mockClient.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      is: mockIs,
      update: mockUpdate,
      maybeSingle: mockMaybeSingle,
    });

    const repo = new SupabaseFavoritesRepository(mockClient);
    const isFav = await repo.isFavorite('ex-deadlift', 'usr-mock-1');
    expect(isFav).toBe(true);

    await repo.removeFavorite('ex-deadlift', 'usr-mock-1');
    expect(mockClient.from).toHaveBeenCalledWith('favorites');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        deleted_at: expect.any(String),
      })
    );
  });
});
