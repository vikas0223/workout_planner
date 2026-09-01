/**
 * Phase 2H: Workout Builder & Draft Domain Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import {
  WorkoutDraft,
  validateWorkoutDraft,
  createEmptyWorkoutDraft,
  draftToWorkoutTemplate,
} from '@/lib/domain/workout-draft';
import { LocalWorkoutRepository } from '@/lib/repositories/local/local-workout-repository';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { generateId } from '@/lib/utils/id';

describe('Phase 2H: Workout Builder & Draft State', () => {
  let repository: LocalWorkoutRepository;

  beforeEach(() => {
    setupMockIndexedDB();
    IndexedDBEngine.resetInstance();
    repository = new LocalWorkoutRepository();
  });

  it('validates empty draft and detects missing name and exercises', () => {
    const emptyDraft: WorkoutDraft = {
      name: '',
      goal: 'hypertrophy',
      difficulty: 'intermediate',
      duration: 45,
      targetMuscles: ['Full Body'],
      equipment: ['Dumbbells'],
      exercises: [],
    };

    const validation = validateWorkoutDraft(emptyDraft);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.name).toBeDefined();
    expect(validation.errors.exercises).toBeDefined();
  });

  it('validates a complete draft successfully', () => {
    const draft: WorkoutDraft = {
      name: 'Push Day Hypertrophy',
      goal: 'hypertrophy',
      difficulty: 'intermediate',
      duration: 45,
      targetMuscles: ['Chest', 'Shoulders', 'Triceps'],
      equipment: ['Dumbbells', 'Bench'],
      exercises: [
        {
          id: 'ex_1',
          exerciseId: 'db-bench-press',
          name: 'Dumbbell Bench Press',
          sets: 4,
          reps: '8-12',
          rest: '90s',
          targetMuscles: ['Chest'],
          equipment: ['Dumbbells', 'Bench'],
          order: 0,
        },
        {
          id: 'ex_2',
          exerciseId: 'db-shoulder-press',
          name: 'Dumbbell Shoulder Press',
          sets: 3,
          reps: '10-12',
          rest: '60s',
          targetMuscles: ['Shoulders'],
          equipment: ['Dumbbells'],
          order: 1,
        },
      ],
    };

    const validation = validateWorkoutDraft(draft);
    expect(validation.isValid).toBe(true);
    expect(Object.keys(validation.errors).length).toBe(0);
  });

  it('saves draft to LocalWorkoutRepository (IndexedDB) and reloads template', async () => {
    const draft: WorkoutDraft = {
      name: 'Legs & Core Strength',
      goal: 'strength',
      difficulty: 'advanced',
      duration: 60,
      targetMuscles: ['Quads', 'Hamstrings', 'Glutes', 'Core'],
      equipment: ['Barbell', 'Dumbbells'],
      exercises: [
        {
          id: 'ex_1',
          exerciseId: 'bb-squat',
          name: 'Barbell Back Squat',
          sets: 5,
          reps: '5',
          rest: '180s',
          targetMuscles: ['Quads', 'Glutes'],
          equipment: ['Barbell'],
          order: 0,
        },
      ],
    };

    const template = draftToWorkoutTemplate(draft, 'user_123');
    await repository.saveTemplate(template);

    const loaded = await repository.getTemplateById(template.id);
    expect(loaded).toBeDefined();
    expect(loaded?.name).toBe('Legs & Core Strength');
    expect(loaded?.goal).toBe('strength');
    expect(loaded?.exercises.length).toBe(1);
    expect(loaded?.exercises[0].name).toBe('Barbell Back Squat');
  });

  it('duplicates a template with a new distinct ID', async () => {
    const draft = createEmptyWorkoutDraft();
    draft.name = 'Original Routine';
    draft.exercises = [
      {
        id: 'ex_1',
        exerciseId: 'pushup',
        name: 'Push-up',
        sets: 3,
        reps: '15',
        rest: '60s',
        targetMuscles: ['Chest'],
        equipment: ['Bodyweight'],
        order: 0,
      },
    ];

    const original = draftToWorkoutTemplate(draft, 'guest_user');
    await repository.saveTemplate(original);

    // Duplicate
    const now = new Date().toISOString();
    const duplicated = {
      ...original,
      id: generateId(),
      name: `${original.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };
    await repository.saveTemplate(duplicated);

    expect(duplicated.id).not.toBe(original.id);
    const templates = await repository.listTemplates('guest_user');
    expect(templates.length).toBe(2);
    expect(templates.some((t) => t.id === original.id)).toBe(true);
    expect(templates.some((t) => t.id === duplicated.id && t.name.includes('(Copy)'))).toBe(true);
  });

  it('deletes a template from LocalWorkoutRepository', async () => {
    const draft = createEmptyWorkoutDraft();
    draft.name = 'To Be Deleted';
    draft.exercises = [
      {
        id: 'ex_1',
        exerciseId: 'lunge',
        name: 'Bodyweight Lunge',
        sets: 3,
        reps: '12',
        rest: '60s',
        targetMuscles: ['Quads'],
        equipment: ['Bodyweight'],
        order: 0,
      },
    ];

    const tpl = draftToWorkoutTemplate(draft, 'guest_user');
    await repository.saveTemplate(tpl);

    let list = await repository.listTemplates('guest_user');
    expect(list.some((t) => t.id === tpl.id)).toBe(true);

    await repository.deleteTemplate(tpl.id);
    list = await repository.listTemplates('guest_user');
    expect(list.some((t) => t.id === tpl.id)).toBe(false);
  });
});
