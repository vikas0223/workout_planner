/**
 * Workout Session Command Types & Structured Errors
 * Domain command contracts for Phase 2C
 */

import {
  WorkoutSession,
  SessionExercise,
  WorkoutSet,
  WorkoutFeedback,
  GeneratedWorkout,
  WorkoutTemplate,
  SetType,
  SetSide,
  SetStatus,
  SessionStatus,
  SessionExerciseStatus,
  ExerciseGroupType,
} from '@/types/domain';

export interface StartSessionInput {
  userId?: string;
  workout: GeneratedWorkout | WorkoutTemplate;
  templateId?: string;
  name?: string;
}

export interface CreateSessionExerciseInput {
  sessionId?: string;
  exerciseId: string;
  name: string;
  targetMuscles?: string[];
  equipment?: string[];
  order?: number;
  plannedSets?: number;
  plannedReps?: string | number;
  plannedRestSeconds?: number;
  notes?: string;
  /** Phase 2H.5: exercise grouping */
  groupId?: string;
  groupType?: ExerciseGroupType;
  groupPosition?: number;
}

export interface LogSetInput {
  sessionId: string;
  sessionExerciseId: string;
  id?: string;
  setNumber?: number;
  type?: SetType;
  /** Phase 2H.5: unilateral vs bilateral. Default: 'bilateral'. */
  side?: SetSide;
  targetReps?: number;
  actualReps?: number;
  loadValue?: number;
  loadUnit?: string;
  targetWeight?: number;
  actualWeight?: number;
  weightUnit?: 'kg' | 'lbs';
  durationSeconds?: number;
  distanceValue?: number;
  distanceUnit?: string;
  rpe?: number;
  rir?: number;
  restSeconds?: number;
  tempo?: string;
  status?: SetStatus;
  notes?: string;
  completedAt?: string;
}

export interface UpdateSetInput {
  sessionId: string;
  sessionExerciseId: string;
  setId: string;
  patch: Partial<Omit<WorkoutSet, 'id' | 'sessionExerciseId'>>;
}

export interface SubstituteExerciseInput {
  sessionId: string;
  sessionExerciseId: string;
  replacementExerciseId: string;
  replacementName: string;
  targetMuscles?: string[];
  equipment?: string[];
  substitutionReason?: string;
}

export interface CompleteSessionOptions {
  notes?: string;
  feedback?: WorkoutFeedback;
}

// ==========================================
// Structured Domain Errors
// ==========================================

export class WorkoutDomainError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code: string = 'DOMAIN_ERROR', details?: Record<string, unknown>) {
    super(message);
    this.name = 'WorkoutDomainError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class SessionNotFoundError extends WorkoutDomainError {
  constructor(sessionId: string) {
    super(`Workout session not found id=${sessionId}`, 'SESSION_NOT_FOUND', { sessionId });
    this.name = 'SessionNotFoundError';
  }
}

export class SessionExerciseNotFoundError extends WorkoutDomainError {
  constructor(sessionExerciseId: string, sessionId?: string) {
    super(
      `Session exercise not found id=${sessionExerciseId}`,
      'SESSION_EXERCISE_NOT_FOUND',
      { sessionExerciseId, sessionId }
    );
    this.name = 'SessionExerciseNotFoundError';
  }
}

export class SetNotFoundError extends WorkoutDomainError {
  constructor(setId: string, sessionExerciseId?: string) {
    super(`Set not found id=${setId}`, 'SET_NOT_FOUND', { setId, sessionExerciseId });
    this.name = 'SetNotFoundError';
  }
}

export class InvalidStateTransitionError extends WorkoutDomainError {
  constructor(entity: string, from: string, to: string, reason?: string) {
    super(
      `Invalid ${entity} state transition from '${from}' to '${to}'${reason ? `: ${reason}` : ''}`,
      'INVALID_STATE_TRANSITION',
      { entity, from, to, reason }
    );
    this.name = 'InvalidStateTransitionError';
  }
}

export class SetValidationError extends WorkoutDomainError {
  constructor(message: string, field?: string, value?: unknown) {
    super(`Set validation failed: ${message}`, 'SET_VALIDATION_ERROR', { field, value });
    this.name = 'SetValidationError';
  }
}

export class DuplicateSetNumberError extends WorkoutDomainError {
  constructor(sessionExerciseId: string, setNumber: number) {
    super(
      `Set number ${setNumber} already exists for session exercise ${sessionExerciseId}`,
      'DUPLICATE_SET_NUMBER',
      { sessionExerciseId, setNumber }
    );
    this.name = 'DuplicateSetNumberError';
  }
}

export class InvalidSessionInputError extends WorkoutDomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(`Invalid session input: ${message}`, 'INVALID_SESSION_INPUT', details);
    this.name = 'InvalidSessionInputError';
  }
}
