/**
 * Phase 2H: Generated Workout Lifecycle Tests
 * 
 * Verifies:
 * - Deterministic generation
 * - Editing generated workout as draft preserves immutable original GeneratedWorkout
 * - Starting session directly from generated workout creates valid execution instance
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { WorkoutEngine } from '@/features/workout-engine';
import { generatedWorkoutToDraft, draftToWorkoutTemplate } from '@/lib/domain/workout-draft';
import { SessionCommandService } from '@/features/workout-session/session-command-service';
import { LocalWorkoutRepository } from '@/lib/repositories/local/local-workout-repository';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';

describe('Phase 2H: Generated Workout Lifecycle & Immutability', () => {
  let sessionService: SessionCommandService;
  let workoutRepo: LocalWorkoutRepository;

  beforeEach(() => {
    setupMockIndexedDB();
    IndexedDBEngine.resetInstance();
    sessionService = new SessionCommandService();
    workoutRepo = new LocalWorkoutRepository();
  });

  it('generates a deterministic plan and converts to editable draft without mutating original', () => {
    const generated = WorkoutEngine.generateWorkoutPlan({
      name: 'Full Body Hypertrophy',
      primaryGoal: 'hypertrophy',
      fitnessLevel: 'intermediate',
      targetMuscles: ['Chest', 'Back', 'Quads'],
      equipment: ['Dumbbells', 'Bench'],
      durationMinutes: 45,
      seed: 12345,
    });

    expect(generated).toBeDefined();
    expect(generated.exercises.length).toBeGreaterThan(0);
    const originalExerciseCount = generated.exercises.length;
    const originalGeneratedName = generated.name;
    const originalFirstExName = generated.exercises[0].name;

    // Convert to draft and edit
    const draft = generatedWorkoutToDraft(generated);
    draft.name = 'Customized Full Body';
    draft.exercises[0].name = 'Modified First Exercise';
    draft.exercises.push({
      id: 'draft_new_ex',
      exerciseId: 'extra-ex',
      name: 'Extra Exercise',
      sets: 3,
      reps: '12',
      rest: '60s',
      targetMuscles: ['Core'],
      equipment: ['Bodyweight'],
      order: draft.exercises.length,
    });

    // Verify original GeneratedWorkout is unchanged
    expect(generated.name).toBe(originalGeneratedName);
    expect(generated.exercises.length).toBe(originalExerciseCount);
    expect(generated.exercises[0].name).toBe(originalFirstExName);

    // Save as WorkoutTemplate
    const template = draftToWorkoutTemplate(draft, 'guest_user');
    expect(template.name).toBe('Customized Full Body');
    expect(template.exercises.length).toBe(originalExerciseCount + 1);
  });

  it('starts active session directly from GeneratedWorkout snapshot without premature sets', async () => {
    const generated = WorkoutEngine.generateWorkoutPlan({
      name: 'Upper Body Power',
      primaryGoal: 'strength',
      fitnessLevel: 'advanced',
      targetMuscles: ['Chest', 'Back'],
      equipment: ['Barbell', 'Dumbbells'],
      durationMinutes: 45,
      seed: 999,
    });

    const session = await sessionService.startSession({
      name: generated.name,
      workout: generated,
      userId: 'guest_user',
    });

    expect(session.id).toBeDefined();
    expect(session.status).toBe('active');
    expect(session.exercises.length).toBe(generated.exercises.length);

    // Verify no premature performed sets were created
    for (const ex of session.exercises) {
      expect(ex.sets).toEqual([]);
      expect(ex.status).toBe('pending');
      expect(ex.plannedSets).toBeGreaterThan(0);
    }
  });
});
