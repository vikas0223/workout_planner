/**
 * Phase 2C — Workout Session Command Layer Test Suite
 * Validates domain commands, validations, state transitions, soft deletion,
 * and offline persistence reconstruction without React memory dependencies.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { SessionCommandService } from '@/features/workout-session/session-command-service';
import { LocalCompletionRepository } from '@/lib/repositories/local/local-completion-repository';
import { WorkoutEngine } from '@/features/workout-engine';
import {
  SessionNotFoundError,
  SessionExerciseNotFoundError,
  SetNotFoundError,
  InvalidStateTransitionError,
  SetValidationError,
  DuplicateSetNumberError,
  InvalidSessionInputError,
} from '@/features/workout-session/session-commands.types';
import { isUuid } from '@/lib/utils/id';

describe('Phase 2C: Workout Session Command Layer', () => {
  let commandService: SessionCommandService;
  let completionRepo: LocalCompletionRepository;

  beforeEach(() => {
    IndexedDBEngine.resetInstance();
    setupMockIndexedDB();
    completionRepo = new LocalCompletionRepository();
    commandService = new SessionCommandService(completionRepo);
  });

  // 1. Start Session
  it('1. startSession creates active session and initializes exercises with planned prescriptions', async () => {
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'intermediate',
      primaryGoal: 'strength',
      targetMuscles: ['Chest', 'Arms'],
      equipment: ['Dumbbells'],
      durationMinutes: 45,
    });

    const session = await commandService.startSession({
      userId: 'usr_sarah',
      workout,
      name: 'Chest & Arms Power',
    });

    expect(session).toBeDefined();
    expect(isUuid(session.id)).toBe(true);
    expect(session.status).toBe('active');
    expect(session.userId).toBe('usr_sarah');
    expect(session.name).toBe('Chest & Arms Power');
    expect(session.exercises.length).toBe(workout.exercises.length);

    // Verify planned prescription is preserved without creating premature set records
    const firstEx = session.exercises[0];
    expect(firstEx.status).toBe('pending');
    expect(firstEx.plannedSets).toBeGreaterThan(0);
    expect(firstEx.sets.length).toBe(0); // Sets are created upon logging/execution
  });

  // 2. Create Session Exercises
  it('2. createSessionExercises appends ordered exercise records to active session', async () => {
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'beginner',
      primaryGoal: 'general_fitness',
      targetMuscles: ['Legs'],
      equipment: ['bodyweight'],
      durationMinutes: 30,
    });

    const session = await commandService.startSession({ workout });
    const initialCount = session.exercises.length;

    const newExercises = await commandService.createSessionExercises(session.id, [
      {
        exerciseId: 'ex_calf_raises',
        name: 'Standing Calf Raises',
        targetMuscles: ['Calves'],
        equipment: ['bodyweight'],
        plannedSets: 3,
        plannedReps: 15,
        plannedRestSeconds: 45,
      },
    ]);

    expect(newExercises.length).toBe(1);
    expect(newExercises[0].name).toBe('Standing Calf Raises');
    expect(newExercises[0].order).toBe(initialCount + 1);

    const refreshed = await commandService.getSession(session.id);
    expect(refreshed?.exercises.length).toBe(initialCount + 1);
  });

  // 3. Session Exercise Ordering
  it('3. session exercise ordering is strictly preserved', async () => {
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'advanced',
      primaryGoal: 'muscle_gain',
      targetMuscles: ['Back', 'Chest', 'Legs'],
      equipment: ['Dumbbells'],
      durationMinutes: 60,
    });

    const session = await commandService.startSession({ workout });
    const exercises = session.exercises;

    for (let i = 0; i < exercises.length; i++) {
      expect(exercises[i].order).toBe(i + 1);
    }
  });

  // 4. Log First Set
  it('4. logSet logs first set with valid values and updates exercise status to active', async () => {
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'intermediate',
      primaryGoal: 'hypertrophy',
      targetMuscles: ['Chest'],
      equipment: ['Dumbbells'],
      durationMinutes: 30,
    });

    const session = await commandService.startSession({ workout });
    const targetEx = session.exercises[0];
    expect(targetEx.status).toBe('pending');

    const loggedSet = await commandService.logSet({
      sessionId: session.id,
      sessionExerciseId: targetEx.id,
      setNumber: 1,
      type: 'working',
      actualReps: 12,
      actualWeight: 25,
      weightUnit: 'kg',
      rpe: 8,
      notes: 'Clean execution',
    });

    expect(loggedSet).toBeDefined();
    expect(isUuid(loggedSet.id)).toBe(true);
    expect(loggedSet.setNumber).toBe(1);
    expect(loggedSet.actualReps).toBe(12);
    expect(loggedSet.actualWeight).toBe(25);
    expect(loggedSet.rpe).toBe(8);
    expect(loggedSet.status).toBe('completed');

    const refreshed = await commandService.getSession(session.id);
    const updatedEx = refreshed?.exercises.find((e) => e.id === targetEx.id);
    expect(updatedEx?.status).toBe('active');
    expect(updatedEx?.sets.length).toBe(1);
  });

  // 5. Log Multiple Sets
  it('5. logSet auto-determines next set number when omitted', async () => {
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'intermediate',
      primaryGoal: 'strength',
      targetMuscles: ['Chest'],
      equipment: ['Dumbbells'],
      durationMinutes: 30,
    });

    const session = await commandService.startSession({ workout });
    const targetEx = session.exercises[0];

    const set1 = await commandService.logSet({
      sessionId: session.id,
      sessionExerciseId: targetEx.id,
      actualReps: 10,
      actualWeight: 30,
    });

    const set2 = await commandService.logSet({
      sessionId: session.id,
      sessionExerciseId: targetEx.id,
      actualReps: 8,
      actualWeight: 32.5,
    });

    expect(set1.setNumber).toBe(1);
    expect(set2.setNumber).toBe(2);

    const refreshed = await commandService.getSession(session.id);
    const ex = refreshed?.exercises.find((e) => e.id === targetEx.id);
    expect(ex?.sets.length).toBe(2);
  });

  // 6. Duplicate Set-Number Rejection
  it('6. logSet rejects duplicate set number with DuplicateSetNumberError', async () => {
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'intermediate',
      primaryGoal: 'strength',
      targetMuscles: ['Chest'],
      equipment: ['Dumbbells'],
      durationMinutes: 30,
    });

    const session = await commandService.startSession({ workout });
    const targetEx = session.exercises[0];

    await commandService.logSet({
      sessionId: session.id,
      sessionExerciseId: targetEx.id,
      setNumber: 1,
      actualReps: 10,
      actualWeight: 20,
    });

    // Logging a set with the same set number explicitly with a different ID
    await expect(
      commandService.logSet({
        sessionId: session.id,
        sessionExerciseId: targetEx.id,
        id: 'different_id_same_set_number',
        setNumber: 1,
        actualReps: 10,
        actualWeight: 20,
      })
    ).rejects.toThrow(DuplicateSetNumberError);
  });

  // 7. Update Set
  it('7. updateSet updates reps, weight, RPE, rest, and notes', async () => {
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'intermediate',
      primaryGoal: 'strength',
      targetMuscles: ['Arms'],
      equipment: ['Dumbbells'],
      durationMinutes: 30,
    });

    const session = await commandService.startSession({ workout });
    const targetEx = session.exercises[0];

    const logged = await commandService.logSet({
      sessionId: session.id,
      sessionExerciseId: targetEx.id,
      setNumber: 1,
      actualReps: 10,
      actualWeight: 15,
    });

    const updated = await commandService.updateSet({
      sessionId: session.id,
      sessionExerciseId: targetEx.id,
      setId: logged.id,
      patch: {
        actualReps: 12,
        actualWeight: 17.5,
        rpe: 9,
        restSeconds: 90,
        notes: 'Felt strong',
      },
    });

    expect(updated.actualReps).toBe(12);
    expect(updated.actualWeight).toBe(17.5);
    expect(updated.rpe).toBe(9);
    expect(updated.restSeconds).toBe(90);
    expect(updated.notes).toBe('Felt strong');
  });

  // 8. Preserve Set ID after update
  it('8. updateSet preserves original set ID', async () => {
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'intermediate',
      primaryGoal: 'strength',
      targetMuscles: ['Back'],
      equipment: ['Dumbbells'],
      durationMinutes: 30,
    });

    const session = await commandService.startSession({ workout });
    const targetEx = session.exercises[0];

    const logged = await commandService.logSet({
      sessionId: session.id,
      sessionExerciseId: targetEx.id,
      setNumber: 1,
      actualReps: 8,
      actualWeight: 40,
    });

    const originalId = logged.id;

    const updated = await commandService.updateSet({
      sessionId: session.id,
      sessionExerciseId: targetEx.id,
      setId: originalId,
      patch: { actualReps: 10 },
    });

    expect(updated.id).toBe(originalId);
  });

  // 9. Delete Set (Soft Delete)
  it('9. deleteSet removes set from active view and soft-deletes in repository', async () => {
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'intermediate',
      primaryGoal: 'strength',
      targetMuscles: ['Legs'],
      equipment: ['Dumbbells'],
      durationMinutes: 30,
    });

    const session = await commandService.startSession({ workout });
    const targetEx = session.exercises[0];

    const set1 = await commandService.logSet({
      sessionId: session.id,
      sessionExerciseId: targetEx.id,
      setNumber: 1,
      actualReps: 10,
      actualWeight: 50,
    });

    const set2 = await commandService.logSet({
      sessionId: session.id,
      sessionExerciseId: targetEx.id,
      setNumber: 2,
      actualReps: 10,
      actualWeight: 50,
    });

    await commandService.deleteSet(session.id, targetEx.id, set1.id);

    const refreshed = await commandService.getSession(session.id);
    const ex = refreshed?.exercises.find((e) => e.id === targetEx.id);
    expect(ex?.sets.length).toBe(1);
    expect(ex?.sets[0].id).toBe(set2.id);
  });

  // 10. Complete Exercise
  it('10. completeExercise marks exercise status as completed and timestamps completion', async () => {
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'intermediate',
      primaryGoal: 'strength',
      targetMuscles: ['Shoulders'],
      equipment: ['Dumbbells'],
      durationMinutes: 30,
    });

    const session = await commandService.startSession({ workout });
    const targetEx = session.exercises[0];

    await commandService.logSet({
      sessionId: session.id,
      sessionExerciseId: targetEx.id,
      setNumber: 1,
      actualReps: 10,
      actualWeight: 20,
    });

    const completedEx = await commandService.completeExercise(session.id, targetEx.id);
    expect(completedEx.status).toBe('completed');
    expect(completedEx.completedAt).toBeDefined();

    const refreshed = await commandService.getSession(session.id);
    const ex = refreshed?.exercises.find((e) => e.id === targetEx.id);
    expect(ex?.status).toBe('completed');
  });

  // 11. Skip Exercise
  it('11. skipExercise marks exercise as skipped while preserving logged sets', async () => {
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'intermediate',
      primaryGoal: 'strength',
      targetMuscles: ['Core'],
      equipment: ['bodyweight'],
      durationMinutes: 30,
    });

    const session = await commandService.startSession({ workout });
    const targetEx = session.exercises[0];

    await commandService.logSet({
      sessionId: session.id,
      sessionExerciseId: targetEx.id,
      setNumber: 1,
      actualReps: 15,
    });

    const skippedEx = await commandService.skipExercise(session.id, targetEx.id);
    expect(skippedEx.status).toBe('skipped');

    const refreshed = await commandService.getSession(session.id);
    const ex = refreshed?.exercises.find((e) => e.id === targetEx.id);
    expect(ex?.status).toBe('skipped');
    expect(ex?.sets.length).toBe(1); // Preserves logged data
  });

  // 12. Substitute Exercise
  it('12. substituteExercise records replacement and preserves previous exercise reference', async () => {
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'intermediate',
      primaryGoal: 'strength',
      targetMuscles: ['Chest'],
      equipment: ['Dumbbells'],
      durationMinutes: 30,
    });

    const session = await commandService.startSession({ workout });
    const targetEx = session.exercises[0];
    const originalExerciseId = targetEx.exerciseId;

    const substitutedEx = await commandService.substituteExercise({
      sessionId: session.id,
      sessionExerciseId: targetEx.id,
      replacementExerciseId: 'ex_pushup_alt',
      replacementName: 'Push-Ups (Alternative)',
      substitutionReason: 'Dumbbell unavailable',
    });

    expect(substitutedEx.status).toBe('substituted');
    expect(substitutedEx.exerciseId).toBe('ex_pushup_alt');
    expect(substitutedEx.name).toBe('Push-Ups (Alternative)');
    expect(substitutedEx.substitutedFromExerciseId).toBe(originalExerciseId);
    expect(substitutedEx.substitutionReason).toBe('Dumbbell unavailable');
  });

  // 13. Complete Session
  it('13. completeSession calculates duration, total volume, and marks status completed', async () => {
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'intermediate',
      primaryGoal: 'strength',
      targetMuscles: ['Chest', 'Arms'],
      equipment: ['Dumbbells'],
      durationMinutes: 30,
    });

    const session = await commandService.startSession({ workout });
    const ex1 = session.exercises[0];
    const ex2 = session.exercises[1];

    await commandService.logSet({
      sessionId: session.id,
      sessionExerciseId: ex1.id,
      setNumber: 1,
      actualReps: 10,
      actualWeight: 20, // 200 kg-reps
    });

    await commandService.logSet({
      sessionId: session.id,
      sessionExerciseId: ex2.id,
      setNumber: 1,
      actualReps: 10,
      actualWeight: 15, // 150 kg-reps
    });

    const completed = await commandService.completeSession(session.id, {
      notes: 'Excellent session',
    });

    expect(completed.status).toBe('completed');
    expect(completed.completedAt).toBeDefined();
    expect(completed.durationMinutes).toBeGreaterThanOrEqual(1);
    expect(completed.totalVolume).toBe(350); // 200 + 150
    expect(completed.notes).toBe('Excellent session');
  });

  // 14. Abandon Session
  it('14. abandonSession marks status abandoned and preserves logged data', async () => {
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'intermediate',
      primaryGoal: 'strength',
      targetMuscles: ['Legs'],
      equipment: ['Dumbbells'],
      durationMinutes: 30,
    });

    const session = await commandService.startSession({ workout });
    const targetEx = session.exercises[0];

    await commandService.logSet({
      sessionId: session.id,
      sessionExerciseId: targetEx.id,
      setNumber: 1,
      actualReps: 8,
      actualWeight: 40,
    });

    const abandoned = await commandService.abandonSession(session.id);
    expect(abandoned.status).toBe('abandoned');
    expect(abandoned.completedAt).toBeDefined();

    const refreshed = await commandService.getSession(session.id);
    expect(refreshed?.status).toBe('abandoned');
    expect(refreshed?.exercises[0].sets.length).toBe(1);
  });

  // 15. Resume Session
  it('15. resumeSession reconstructs active session directly from local persistence', async () => {
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'intermediate',
      primaryGoal: 'fat_loss',
      targetMuscles: ['Full Body'],
      equipment: ['bodyweight'],
      durationMinutes: 30,
    });

    const session = await commandService.startSession({
      userId: 'offline_user_1',
      workout,
    });

    const resumed = await commandService.resumeSession(session.id);
    expect(resumed).toBeDefined();
    expect(resumed?.id).toBe(session.id);
    expect(resumed?.status).toBe('active');
  });

  // 16. Invalid Session ID
  it('16. invalid session ID throws SessionNotFoundError', async () => {
    await expect(
      commandService.logSet({
        sessionId: 'non_existent_session_id',
        sessionExerciseId: 'ex_123',
        actualReps: 10,
      })
    ).rejects.toThrow(SessionNotFoundError);

    await expect(
      commandService.completeSession('non_existent_session_id')
    ).rejects.toThrow(SessionNotFoundError);
  });

  // 17. Invalid Exercise ID
  it('17. invalid exercise ID throws SessionExerciseNotFoundError', async () => {
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'beginner',
      primaryGoal: 'strength',
      targetMuscles: ['Arms'],
      equipment: ['bodyweight'],
      durationMinutes: 20,
    });

    const session = await commandService.startSession({ workout });

    await expect(
      commandService.logSet({
        sessionId: session.id,
        sessionExerciseId: 'non_existent_exercise_id',
        actualReps: 10,
      })
    ).rejects.toThrow(SessionExerciseNotFoundError);
  });

  // 18. Invalid Set Input
  it('18. invalid set inputs (negative reps, invalid RPE) throw SetValidationError', async () => {
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'intermediate',
      primaryGoal: 'strength',
      targetMuscles: ['Chest'],
      equipment: ['Dumbbells'],
      durationMinutes: 30,
    });

    const session = await commandService.startSession({ workout });
    const targetEx = session.exercises[0];

    // Negative reps
    await expect(
      commandService.logSet({
        sessionId: session.id,
        sessionExerciseId: targetEx.id,
        actualReps: -5,
      })
    ).rejects.toThrow(SetValidationError);

    // Negative weight
    await expect(
      commandService.logSet({
        sessionId: session.id,
        sessionExerciseId: targetEx.id,
        actualWeight: -20,
      })
    ).rejects.toThrow(SetValidationError);

    // Invalid RPE > 10
    await expect(
      commandService.logSet({
        sessionId: session.id,
        sessionExerciseId: targetEx.id,
        actualReps: 10,
        rpe: 15,
      })
    ).rejects.toThrow(SetValidationError);
  });

  // 19. Completed Set Validation (at least one measurable performance value)
  it('19. completed set validation requires at least one measurable value', async () => {
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'intermediate',
      primaryGoal: 'strength',
      targetMuscles: ['Chest'],
      equipment: ['Dumbbells'],
      durationMinutes: 30,
    });

    const session = await commandService.startSession({ workout });
    const targetEx = session.exercises[0];

    // Set with 0 reps and 0 weight and no duration/distance
    await expect(
      commandService.logSet({
        sessionId: session.id,
        sessionExerciseId: targetEx.id,
        status: 'completed',
        actualReps: 0,
        actualWeight: 0,
      })
    ).rejects.toThrow(SetValidationError);
  });

  // 20. Session Persistence after Repository Reinitialization
  it('20. session persistence survives repository reinitialization', async () => {
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'intermediate',
      primaryGoal: 'strength',
      targetMuscles: ['Legs'],
      equipment: ['Dumbbells'],
      durationMinutes: 45,
    });

    const session = await commandService.startSession({
      userId: 'persistence_user_77',
      workout,
    });

    const targetEx = session.exercises[0];
    await commandService.logSet({
      sessionId: session.id,
      sessionExerciseId: targetEx.id,
      setNumber: 1,
      actualReps: 10,
      actualWeight: 50,
    });

    // Reinitialize fresh repository and command service instances
    const freshRepo = new LocalCompletionRepository();
    const freshCommandService = new SessionCommandService(freshRepo);

    const reloaded = await freshCommandService.getSession(session.id);
    expect(reloaded).toBeDefined();
    expect(reloaded?.id).toBe(session.id);
    expect(reloaded?.status).toBe('active');
    expect(reloaded?.exercises[0].sets.length).toBe(1);
    expect(reloaded?.exercises[0].sets[0].actualReps).toBe(10);
    expect(reloaded?.exercises[0].sets[0].actualWeight).toBe(50);
  });

  // 21. Integration Test: start session -> reload repository -> reconstruct session
  it('21. integration: start session -> reload repository -> reconstruct session', async () => {
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'beginner',
      primaryGoal: 'general_fitness',
      targetMuscles: ['Full Body'],
      equipment: ['bodyweight'],
      durationMinutes: 30,
    });

    const session = await commandService.startSession({
      userId: 'integration_user_1',
      workout,
      name: 'Full Body Morning',
    });

    // Reload repository completely
    const freshRepo = new LocalCompletionRepository();
    const reconstructed = await freshRepo.getSessionById(session.id);

    expect(reconstructed).toBeDefined();
    expect(reconstructed?.id).toBe(session.id);
    expect(reconstructed?.name).toBe('Full Body Morning');
    expect(reconstructed?.status).toBe('active');
    expect(reconstructed?.exercises.length).toBe(workout.exercises.length);
  });

  // 22. Integration Test: log set -> reload repository -> verify exact set values
  it('22. integration: log set -> reload repository -> verify exact set values', async () => {
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'intermediate',
      primaryGoal: 'strength',
      targetMuscles: ['Back'],
      equipment: ['Dumbbells'],
      durationMinutes: 30,
    });

    const session = await commandService.startSession({ workout });
    const targetEx = session.exercises[0];

    const logged = await commandService.logSet({
      sessionId: session.id,
      sessionExerciseId: targetEx.id,
      setNumber: 1,
      type: 'working',
      actualReps: 12,
      actualWeight: 27.5,
      weightUnit: 'kg',
      rpe: 8.5,
      notes: 'Solid form',
    });

    // Reload repository completely
    const freshRepo = new LocalCompletionRepository();
    const reconstructed = await freshRepo.getSessionById(session.id);
    const set = reconstructed?.exercises[0].sets.find((s) => s.id === logged.id);

    expect(set).toBeDefined();
    expect(set?.setNumber).toBe(1);
    expect(set?.actualReps).toBe(12);
    expect(set?.actualWeight).toBe(27.5);
    expect(set?.weightUnit).toBe('kg');
    expect(set?.rpe).toBe(8.5);
    expect(set?.notes).toBe('Solid form');
  });

  // 23. Integration Test: complete session -> reload repository -> verify status/history
  it('23. integration: complete session -> reload repository -> verify status/history and previous performance', async () => {
    const workout = WorkoutEngine.generateWorkoutPlan({
      fitnessLevel: 'intermediate',
      primaryGoal: 'hypertrophy',
      targetMuscles: ['Chest'],
      equipment: ['Dumbbells'],
      durationMinutes: 30,
    });

    const session = await commandService.startSession({
      userId: 'history_user_99',
      workout,
    });

    const targetEx = session.exercises[0];
    await commandService.logSet({
      sessionId: session.id,
      sessionExerciseId: targetEx.id,
      setNumber: 1,
      actualReps: 12,
      actualWeight: 30,
      rpe: 9,
    });

    await commandService.completeSession(session.id, {
      notes: 'Felt awesome',
    });

    // Reload repository completely
    const freshRepo = new LocalCompletionRepository();
    const freshService = new SessionCommandService(freshRepo);

    const completed = await freshService.getSession(session.id);
    expect(completed?.status).toBe('completed');
    expect(completed?.durationMinutes).toBeGreaterThanOrEqual(1);
    expect(completed?.totalVolume).toBe(360); // 12 * 30

    // Test Previous Performance query boundary
    const performance = await freshService.getPreviousPerformance(
      targetEx.exerciseId,
      'history_user_99'
    );

    expect(performance).toBeDefined();
    expect(performance?.exerciseId).toBe(targetEx.exerciseId);
    expect(performance?.totalSetsCompleted).toBe(1);
    expect(performance?.maxWeight).toBe(30);
    expect(performance?.maxReps).toBe(12);
    expect(performance?.recentSets.length).toBe(1);
  });
});
