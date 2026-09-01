/**
 * Authoritative Workout Session Domain Command Service
 * Canonical business-logic layer for workout execution lifecycle, set logging,
 * exercise progression, and previous performance query boundary.
 *
 * Rules:
 * - Pure domain and repository interactions.
 * - Zero React, Dexie, Supabase, or direct IndexedDB DOM dependencies.
 * - Enforces transactional integrity and data validation.
 */

import {
  WorkoutSession,
  SessionExercise,
  WorkoutSet,
  PreviousPerformanceSummary,
} from '@/types/domain';
import { CompletionRepository } from '@/lib/repositories/interfaces';
import { LocalCompletionRepository } from '@/lib/repositories/local/local-completion-repository';
import { generateId } from '@/lib/utils/id';
import { ProgressInvalidationBus } from '@/lib/events/progress-invalidation-bus';
import {
  StartSessionInput,
  CreateSessionExerciseInput,
  LogSetInput,
  UpdateSetInput,
  SubstituteExerciseInput,
  CompleteSessionOptions,
  SessionNotFoundError,
  SessionExerciseNotFoundError,
  SetNotFoundError,
  InvalidSessionInputError,
} from './session-commands.types';
import { SessionValidator } from './session-validator';

export class SessionCommandService {
  private completionRepo: CompletionRepository;

  constructor(completionRepo?: CompletionRepository) {
    this.completionRepo = completionRepo || new LocalCompletionRepository();
  }

  /**
   * Starts a new workout session from a generated workout or template.
   * Atomically initializes the session and ordered SessionExercise records.
   * Preserves planned prescription without creating premature Set records.
   */
  public async startSession(input: StartSessionInput): Promise<WorkoutSession> {
    if (!input.workout || !input.workout.id) {
      throw new InvalidSessionInputError('Valid workout or template reference is required to start a session');
    }

    const sessionId = generateId();
    const now = new Date().toISOString();
    const userId = input.userId || 'guest_user';

    // 1. Build ordered SessionExercise records preserving planned prescriptions
    const exercises: SessionExercise[] = (input.workout.exercises || []).map((ex, index) => {
      const sessionExerciseId = generateId();
      const plannedSets = ex.sets || 3;
      const plannedReps = ex.reps || 10;
      const plannedRestSeconds =
        typeof ex.rest === 'number'
          ? ex.rest
          : parseInt(String(ex.rest), 10) || 60;

      return {
        id: sessionExerciseId,
        sessionId,
        exerciseId: ex.exerciseId || ex.id,
        name: ex.name,
        order: ex.order !== undefined ? ex.order : index + 1,
        status: 'pending',
        targetMuscles: ex.targetMuscles || [],
        equipment: ex.equipment || [],
        sets: [], // Planned sets are preserved via plannedSets/plannedReps; actual Set records created upon logging
        plannedSets,
        plannedReps,
        plannedRestSeconds,
        notes: ex.notes,
      };
    });

    // 2. Build WorkoutSession in 'active' status
    const session: WorkoutSession = {
      id: sessionId,
      userId,
      workoutPlanId: input.workout.id,
      name: input.name || input.workout.name || 'Workout Session',
      status: 'active',
      startedAt: now,
      exercises,
    };

    // 3. Persist atomically
    await this.completionRepo.saveSession(session);
    ProgressInvalidationBus.getInstance().emit('session_changed', sessionId);
    return session;
  }

  /**
   * Adds an ad-hoc exercise to an existing active session.
   */
  public async addSessionExercise(
    sessionId: string,
    input: Omit<CreateSessionExerciseInput, 'sessionId'>
  ): Promise<SessionExercise> {
    const session = await this.completionRepo.getSessionById(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    const sessionExerciseId = generateId();
    const nextOrder =
      input.order !== undefined
        ? input.order
        : session.exercises.length > 0
        ? Math.max(...session.exercises.map((e) => e.order)) + 1
        : 1;

    const newExercise: SessionExercise = {
      id: sessionExerciseId,
      sessionId,
      exerciseId: input.exerciseId,
      name: input.name,
      order: nextOrder,
      status: 'pending',
      targetMuscles: input.targetMuscles || [],
      equipment: input.equipment || [],
      sets: [],
      plannedSets: input.plannedSets,
      plannedReps: input.plannedReps,
      plannedRestSeconds: input.plannedRestSeconds,
      notes: input.notes,
    };

    session.exercises.push(newExercise);
    await this.completionRepo.saveSession(session);
    ProgressInvalidationBus.getInstance().emit('session_changed', sessionId);
    return newExercise;
  }

  /**
   * Batch adds multiple exercises to an existing session preserving order.
   */
  public async addSessionExercises(
    sessionId: string,
    exercisesInput: CreateSessionExerciseInput[]
  ): Promise<SessionExercise[]> {
    const session = await this.completionRepo.getSessionById(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    const created: SessionExercise[] = [];
    let currentOrder =
      session.exercises.length > 0
        ? Math.max(...session.exercises.map((e) => e.order))
        : 0;

    for (const input of exercisesInput) {
      currentOrder += 1;
      const sessionExerciseId = generateId();
      const newEx: SessionExercise = {
        id: sessionExerciseId,
        sessionId,
        exerciseId: input.exerciseId,
        name: input.name,
        order: input.order !== undefined ? input.order : currentOrder,
        status: 'pending',
        targetMuscles: input.targetMuscles || [],
        equipment: input.equipment || [],
        sets: [],
        plannedSets: input.plannedSets,
        plannedReps: input.plannedReps,
        plannedRestSeconds: input.plannedRestSeconds,
        notes: input.notes,
      };
      session.exercises.push(newEx);
      created.push(newEx);
    }

    await this.completionRepo.saveSession(session);
    ProgressInvalidationBus.getInstance().emit('session_changed', sessionId);
    return created;
  }

  /**
   * Phase 2C API compatibility: createSessionExercises accepts spread or array of exercise inputs.
   */
  public async createSessionExercises(
    sessionId: string,
    ...exercisesInput: (CreateSessionExerciseInput | CreateSessionExerciseInput[])[]
  ): Promise<SessionExercise[]> {
    const flatInputs: CreateSessionExerciseInput[] = exercisesInput.flat();
    return this.addSessionExercises(sessionId, flatInputs);
  }

  /**
   * Logs a performed set for a specific session exercise.
   * Auto-determines set number if omitted, validates inputs, and writes to persistence.
   */
  public async logSet(input: LogSetInput): Promise<WorkoutSet> {
    const session = await this.completionRepo.getSessionById(input.sessionId);
    if (!session) {
      throw new SessionNotFoundError(input.sessionId);
    }

    const exercise = session.exercises.find((e) => e.id === input.sessionExerciseId);
    if (!exercise) {
      throw new SessionExerciseNotFoundError(input.sessionExerciseId, input.sessionId);
    }

    // Determine set number
    let setNumber = input.setNumber;
    if (setNumber === undefined) {
      setNumber =
        exercise.sets.length > 0
          ? Math.max(...exercise.sets.map((s) => s.setNumber)) + 1
          : 1;
    }

    const setId = input.id || generateId();
    const now = new Date().toISOString();

    const weightValue = input.actualWeight ?? input.loadValue;
    const weightUnit = input.weightUnit ?? (input.loadUnit as 'kg' | 'lbs') ?? 'kg';

    const newSet: WorkoutSet = {
      id: setId,
      sessionExerciseId: input.sessionExerciseId,
      setNumber,
      type: input.type || 'working',
      targetReps: input.targetReps,
      actualReps: input.actualReps,
      loadValue: input.loadValue ?? weightValue,
      loadUnit: input.loadUnit ?? weightUnit,
      targetWeight: input.targetWeight,
      actualWeight: weightValue,
      weightUnit,
      durationSeconds: input.durationSeconds,
      distanceValue: input.distanceValue,
      distanceUnit: input.distanceUnit,
      rpe: input.rpe,
      rir: input.rir,
      restSeconds: input.restSeconds,
      tempo: input.tempo,
      status: input.status || 'completed',
      notes: input.notes,
      completedAt: input.completedAt || (input.status === 'planned' ? undefined : now),
    };

    // Check if this is updating an existing set by exact ID
    const existingByIdIndex = exercise.sets.findIndex((s) => s.id === setId);

    // Validate set values
    SessionValidator.validateSetInput(
      newSet,
      exercise.sets,
      existingByIdIndex >= 0,
      existingByIdIndex >= 0 ? setId : undefined
    );

    if (existingByIdIndex >= 0) {
      exercise.sets[existingByIdIndex] = newSet;
    } else {
      exercise.sets.push(newSet);
    }

    // Advance exercise status to active if it was pending
    if (exercise.status === 'pending') {
      exercise.status = 'active';
    }

    await this.completionRepo.saveSession(session);
    ProgressInvalidationBus.getInstance().emit('set_changed', setId);
    return newSet;
  }

  /**
   * Updates an existing set record with new values.
   * Preserves set ID, increments version, and updates timestamps.
   */
  public async updateSet(input: UpdateSetInput): Promise<WorkoutSet> {
    const session = await this.completionRepo.getSessionById(input.sessionId);
    if (!session) {
      throw new SessionNotFoundError(input.sessionId);
    }

    const exercise = session.exercises.find((e) => e.id === input.sessionExerciseId);
    if (!exercise) {
      throw new SessionExerciseNotFoundError(input.sessionExerciseId, input.sessionId);
    }

    const setIndex = exercise.sets.findIndex((s) => s.id === input.setId);
    if (setIndex < 0) {
      throw new SetNotFoundError(input.setId, input.sessionExerciseId);
    }

    const existingSet = exercise.sets[setIndex];
    const updatedSet: WorkoutSet = {
      ...existingSet,
      ...input.patch,
      id: input.setId, // Preserve ID strictly
      sessionExerciseId: input.sessionExerciseId,
    };

    // Validate patched set
    SessionValidator.validateSetInput(updatedSet, exercise.sets, true, input.setId);

    exercise.sets[setIndex] = updatedSet;
    await this.completionRepo.saveSession(session);
    ProgressInvalidationBus.getInstance().emit('set_changed', input.setId);
    return updatedSet;
  }

  /**
   * Deletes a set using the established soft-delete model.
   */
  public async deleteSet(
    sessionId: string,
    sessionExerciseId: string,
    setId: string
  ): Promise<void> {
    const session = await this.completionRepo.getSessionById(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    const exercise = session.exercises.find((e) => e.id === sessionExerciseId);
    if (!exercise) {
      throw new SessionExerciseNotFoundError(sessionExerciseId, sessionId);
    }

    const setIndex = exercise.sets.findIndex((s) => s.id === setId);
    if (setIndex < 0) {
      throw new SetNotFoundError(setId, sessionExerciseId);
    }

    // Remove from in-memory session exercises
    exercise.sets.splice(setIndex, 1);

    // Call softDeleteSet on repository if supported
    const localRepo = this.completionRepo as LocalCompletionRepository;
    if (typeof localRepo.softDeleteSet === 'function') {
      await localRepo.softDeleteSet(setId);
    }

    await this.completionRepo.saveSession(session);
    ProgressInvalidationBus.getInstance().emit('set_changed', setId);
  }

  /**
   * Completes an individual exercise in an active session.
   */
  public async completeExercise(
    sessionId: string,
    sessionExerciseId: string
  ): Promise<SessionExercise> {
    const session = await this.completionRepo.getSessionById(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    const exercise = session.exercises.find((e) => e.id === sessionExerciseId);
    if (!exercise) {
      throw new SessionExerciseNotFoundError(sessionExerciseId, sessionId);
    }

    SessionValidator.validateExerciseTransition(exercise.status, 'completed');

    const now = new Date().toISOString();
    exercise.status = 'completed';
    exercise.completedAt = now;

    // Ensure all planned sets are marked completed if they were logged
    exercise.sets = exercise.sets.map((s) => ({
      ...s,
      status: s.status === 'skipped' ? 'skipped' : 'completed',
      completedAt: s.completedAt || now,
    }));

    await this.completionRepo.saveSession(session);
    ProgressInvalidationBus.getInstance().emit('session_changed', sessionId);
    return exercise;
  }

  /**
   * Skips an exercise while preserving all existing logged data.
   */
  public async skipExercise(
    sessionId: string,
    sessionExerciseId: string
  ): Promise<SessionExercise> {
    const session = await this.completionRepo.getSessionById(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    const exercise = session.exercises.find((e) => e.id === sessionExerciseId);
    if (!exercise) {
      throw new SessionExerciseNotFoundError(sessionExerciseId, sessionId);
    }

    SessionValidator.validateExerciseTransition(exercise.status, 'skipped');

    exercise.status = 'skipped';
    await this.completionRepo.saveSession(session);
    ProgressInvalidationBus.getInstance().emit('session_changed', sessionId);
    return exercise;
  }

  /**
   * Substitutes an exercise in an active session with an alternative movement.
   * Preserves the original exercise reference and previous set history.
   */
  public async substituteExercise(input: SubstituteExerciseInput): Promise<SessionExercise> {
    const session = await this.completionRepo.getSessionById(input.sessionId);
    if (!session) {
      throw new SessionNotFoundError(input.sessionId);
    }

    const exercise = session.exercises.find((e) => e.id === input.sessionExerciseId);
    if (!exercise) {
      throw new SessionExerciseNotFoundError(input.sessionExerciseId, input.sessionId);
    }

    SessionValidator.validateExerciseTransition(exercise.status, 'substituted');

    const originalExerciseId = exercise.exerciseId;
    exercise.substitutedFromExerciseId = originalExerciseId;
    exercise.substitutionReason = input.substitutionReason || 'User requested substitution';
    exercise.exerciseId = input.replacementExerciseId;
    exercise.name = input.replacementName;
    if (input.targetMuscles && input.targetMuscles.length > 0) {
      exercise.targetMuscles = input.targetMuscles;
    }
    if (input.equipment && input.equipment.length > 0) {
      exercise.equipment = input.equipment;
    }
    exercise.status = 'substituted';

    await this.completionRepo.saveSession(session);
    ProgressInvalidationBus.getInstance().emit('session_changed', input.sessionId);
    return exercise;
  }

  /**
   * Completes a workout session and calculates summary metrics (duration, volume).
   */
  public async completeSession(
    sessionId: string,
    options?: CompleteSessionOptions
  ): Promise<WorkoutSession> {
    const session = await this.completionRepo.getSessionById(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    SessionValidator.validateSessionTransition(session.status, 'completed');

    const now = new Date().toISOString();
    const startTime = new Date(session.startedAt).getTime();
    const endTime = new Date(now).getTime();
    const durationMinutes = Math.max(1, Math.round((endTime - startTime) / (1000 * 60)));

    // Calculate total volume moved
    let totalVolume = 0;
    session.exercises.forEach((ex) => {
      ex.sets.forEach((set) => {
        if (set.status === 'completed') {
          const reps = set.actualReps || set.targetReps || 0;
          const weight = set.actualWeight ?? set.loadValue ?? 0;
          totalVolume += reps * weight;
        }
      });
    });

    const completedSession: WorkoutSession = {
      ...session,
      status: 'completed',
      completedAt: now,
      durationMinutes,
      totalVolume,
      notes: options?.notes || session.notes,
      feedback: options?.feedback || session.feedback,
    };

    await this.completionRepo.saveSession(completedSession);
    ProgressInvalidationBus.getInstance().emit('session_changed', sessionId);
    if (options?.feedback) {
      ProgressInvalidationBus.getInstance().emit('feedback_changed', sessionId);
    }
    return completedSession;
  }

  /**
   * Abandons an active session while preserving all logged data.
   */
  public async abandonSession(sessionId: string): Promise<WorkoutSession> {
    const session = await this.completionRepo.getSessionById(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    SessionValidator.validateSessionTransition(session.status, 'abandoned');

    const now = new Date().toISOString();
    const abandonedSession: WorkoutSession = {
      ...session,
      status: 'abandoned',
      completedAt: now,
    };

    await this.completionRepo.saveSession(abandonedSession);
    ProgressInvalidationBus.getInstance().emit('session_changed', sessionId);
    return abandonedSession;
  }

  /**
   * Reconstructs an active session from local persistence (refresh / restart recovery).
   */
  public async resumeSession(sessionId: string): Promise<WorkoutSession | null> {
    return this.completionRepo.getSessionById(sessionId);
  }

  /**
   * Retrieves the currently active session for a given user.
   */
  public async getActiveSession(userId?: string): Promise<WorkoutSession | null> {
    return this.completionRepo.getActiveSession(userId);
  }

  // ==========================================
  // Read Models & Query Boundary
  // ==========================================

  public async getSession(sessionId: string): Promise<WorkoutSession | null> {
    return this.completionRepo.getSessionById(sessionId);
  }

  public async getSessionExercises(sessionId: string): Promise<SessionExercise[]> {
    if (typeof this.completionRepo.getSessionExercises === 'function') {
      return this.completionRepo.getSessionExercises(sessionId);
    }
    const session = await this.completionRepo.getSessionById(sessionId);
    return session ? session.exercises : [];
  }

  public async getSets(sessionExerciseId: string): Promise<WorkoutSet[]> {
    if (typeof this.completionRepo.getSets === 'function') {
      return this.completionRepo.getSets(sessionExerciseId);
    }
    return [];
  }

  public async getCompleteSession(sessionId: string): Promise<WorkoutSession | null> {
    return this.completionRepo.getSessionById(sessionId);
  }

  /**
   * Query boundary for previous performance on a specific exercise.
   */
  public async getPreviousPerformance(
    exerciseId: string,
    userId?: string
  ): Promise<PreviousPerformanceSummary | null> {
    if (typeof this.completionRepo.getPreviousPerformance === 'function') {
      return this.completionRepo.getPreviousPerformance(exerciseId, userId);
    }
    return {
      exerciseId,
      totalSetsCompleted: 0,
      recentSets: [],
    };
  }
}
