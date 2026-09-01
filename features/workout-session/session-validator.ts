/**
 * Session, Exercise, and Set Validator
 * Pure domain validation rules enforcing lifecycle constraints and data integrity.
 */

import {
  SessionStatus,
  SessionExerciseStatus,
  WorkoutSet,
  SetStatus,
} from '@/types/domain';
import {
  InvalidStateTransitionError,
  SetValidationError,
  DuplicateSetNumberError,
} from './session-commands.types';

export class SessionValidator {
  /**
   * Validates legal WorkoutSession status transitions
   */
  public static validateSessionTransition(
    currentStatus: SessionStatus,
    nextStatus: SessionStatus
  ): void {
    if (currentStatus === nextStatus) return;

    const allowedTransitions: Record<SessionStatus, SessionStatus[]> = {
      planned: ['active', 'abandoned'],
      active: ['completed', 'abandoned'],
      completed: [],
      abandoned: [],
    };

    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new InvalidStateTransitionError(
        'WorkoutSession',
        currentStatus,
        nextStatus,
        `Cannot transition session from '${currentStatus}' to '${nextStatus}'`
      );
    }
  }

  /**
   * Validates legal SessionExercise status transitions
   */
  public static validateExerciseTransition(
    currentStatus: SessionExerciseStatus,
    nextStatus: SessionExerciseStatus
  ): void {
    if (currentStatus === nextStatus) return;

    const allowedTransitions: Record<SessionExerciseStatus, SessionExerciseStatus[]> = {
      pending: ['active', 'completed', 'skipped', 'substituted'],
      active: ['completed', 'skipped', 'substituted'],
      completed: [],
      skipped: [],
      substituted: [],
    };

    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new InvalidStateTransitionError(
        'SessionExercise',
        currentStatus,
        nextStatus,
        `Cannot transition exercise from '${currentStatus}' to '${nextStatus}'`
      );
    }
  }

  /**
   * Validates a set's input values before local persistence
   */
  public static validateSetInput(
    setData: Partial<WorkoutSet>,
    existingSets: WorkoutSet[] = [],
    isUpdate: boolean = false,
    currentSetId?: string
  ): void {
    // 1. Validate setNumber
    if (setData.setNumber !== undefined) {
      if (
        typeof setData.setNumber !== 'number' ||
        !Number.isInteger(setData.setNumber) ||
        setData.setNumber <= 0
      ) {
        throw new SetValidationError(
          'Set number must be a positive integer greater than 0',
          'setNumber',
          setData.setNumber
        );
      }

      // Check uniqueness within the session exercise
      const duplicate = existingSets.find(
        (s) => s.setNumber === setData.setNumber && (!isUpdate || s.id !== currentSetId)
      );
      if (duplicate) {
        throw new DuplicateSetNumberError(duplicate.sessionExerciseId, setData.setNumber);
      }
    }

    // 2. Validate load / weight
    if (setData.loadValue !== undefined && setData.loadValue !== null) {
      if (typeof setData.loadValue !== 'number' || isNaN(setData.loadValue) || setData.loadValue < 0) {
        throw new SetValidationError('Load value must be a non-negative number', 'loadValue', setData.loadValue);
      }
    }
    if (setData.actualWeight !== undefined && setData.actualWeight !== null) {
      if (typeof setData.actualWeight !== 'number' || isNaN(setData.actualWeight) || setData.actualWeight < 0) {
        throw new SetValidationError('Actual weight must be a non-negative number', 'actualWeight', setData.actualWeight);
      }
    }
    if (setData.targetWeight !== undefined && setData.targetWeight !== null) {
      if (typeof setData.targetWeight !== 'number' || isNaN(setData.targetWeight) || setData.targetWeight < 0) {
        throw new SetValidationError('Target weight must be a non-negative number', 'targetWeight', setData.targetWeight);
      }
    }

    // 3. Validate reps
    if (setData.actualReps !== undefined && setData.actualReps !== null) {
      if (
        typeof setData.actualReps !== 'number' ||
        !Number.isInteger(setData.actualReps) ||
        setData.actualReps < 0
      ) {
        throw new SetValidationError('Actual reps must be a non-negative integer', 'actualReps', setData.actualReps);
      }
    }
    if (setData.targetReps !== undefined && setData.targetReps !== null) {
      if (
        typeof setData.targetReps !== 'number' ||
        !Number.isInteger(setData.targetReps) ||
        setData.targetReps < 0
      ) {
        throw new SetValidationError('Target reps must be a non-negative integer', 'targetReps', setData.targetReps);
      }
    }

    // 4. Validate duration & distance
    if (setData.durationSeconds !== undefined && setData.durationSeconds !== null) {
      if (
        typeof setData.durationSeconds !== 'number' ||
        !Number.isInteger(setData.durationSeconds) ||
        setData.durationSeconds < 0
      ) {
        throw new SetValidationError('Duration seconds must be a non-negative integer', 'durationSeconds', setData.durationSeconds);
      }
    }
    if (setData.distanceValue !== undefined && setData.distanceValue !== null) {
      if (typeof setData.distanceValue !== 'number' || isNaN(setData.distanceValue) || setData.distanceValue < 0) {
        throw new SetValidationError('Distance value must be a non-negative number', 'distanceValue', setData.distanceValue);
      }
    }

    // 5. Validate RPE & RIR
    if (setData.rpe !== undefined && setData.rpe !== null) {
      if (typeof setData.rpe !== 'number' || isNaN(setData.rpe) || setData.rpe < 1 || setData.rpe > 10) {
        throw new SetValidationError('RPE must be between 1 and 10', 'rpe', setData.rpe);
      }
    }
    if (setData.rir !== undefined && setData.rir !== null) {
      if (typeof setData.rir !== 'number' || isNaN(setData.rir) || setData.rir < 0) {
        throw new SetValidationError('RIR must be a non-negative number', 'rir', setData.rir);
      }
    }

    // 6. Validate restSeconds
    if (setData.restSeconds !== undefined && setData.restSeconds !== null) {
      if (
        typeof setData.restSeconds !== 'number' ||
        !Number.isInteger(setData.restSeconds) ||
        setData.restSeconds < 0
      ) {
        throw new SetValidationError('Rest seconds must be a non-negative integer', 'restSeconds', setData.restSeconds);
      }
    }

    // 7. Validate Status & Completed set measurability
    const status: SetStatus = setData.status || 'completed';
    const validStatuses: SetStatus[] = ['planned', 'completed', 'skipped'];
    if (!validStatuses.includes(status)) {
      throw new SetValidationError(`Invalid set status '${status}'`, 'status', status);
    }

    if (status === 'completed') {
      const hasReps = (setData.actualReps !== undefined && setData.actualReps > 0) ||
                      (setData.targetReps !== undefined && setData.targetReps > 0);
      const hasDuration = setData.durationSeconds !== undefined && setData.durationSeconds > 0;
      const hasDistance = setData.distanceValue !== undefined && setData.distanceValue > 0;
      const hasWeight = (setData.actualWeight !== undefined && setData.actualWeight > 0) ||
                        (setData.loadValue !== undefined && setData.loadValue > 0);

      if (!hasReps && !hasDuration && !hasDistance && !hasWeight) {
        throw new SetValidationError(
          'Completed set must contain at least one measurable performance value (reps > 0, duration > 0, distance > 0, or load > 0)',
          'actualReps',
          setData.actualReps
        );
      }
    }
  }
}
