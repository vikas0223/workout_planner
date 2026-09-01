/**
 * Workout Draft Domain Utilities & Validation
 * 
 * Manages in-memory draft workout state for WorkoutBuilder without creating
 * competing persistent database entities.
 */

import {
  WorkoutTemplate,
  GeneratedWorkout,
  GeneratedWorkoutExercise,
  FitnessGoal,
  ExperienceLevel,
  ExerciseGroupType,
  WorkoutPresentationMode,
  QuickWorkoutProfile,
} from '@/types/domain';
import { generateId } from '@/lib/utils/id';

export interface WorkoutDraftExercise {
  id: string;
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  targetMuscles: string[];
  secondaryMuscles?: string[];
  equipment: string[];
  notes?: string;
  difficulty?: ExperienceLevel;
  order: number;
  /** Phase 2H.5: exercise grouping */
  groupId?: string;
  groupType?: ExerciseGroupType;
  groupPosition?: number;
}

export interface WorkoutDraft {
  id?: string; // Existing template ID if editing, or undefined if new
  name: string;
  description?: string;
  goal: FitnessGoal | string;
  difficulty: ExperienceLevel;
  duration: number; // in minutes
  targetMuscles: string[];
  equipment: string[];
  exercises: WorkoutDraftExercise[];
  isDirty?: boolean;
  sourceGeneratedId?: string; // Tracks original generation if created from a generated plan
  /** Phase 2H.5: self-logged vs guided presentation. Default: 'self_logged'. */
  presentationMode?: WorkoutPresentationMode;
  /** Phase 2H.5: duration profile classification. */
  quickProfile?: QuickWorkoutProfile;
}

export interface DraftValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const CANONICAL_GOALS: { value: FitnessGoal; label: string; description: string }[] = [
  {
    value: 'hypertrophy',
    label: 'Muscle Growth (Hypertrophy)',
    description: 'Focus on muscular development, moderate rep ranges, and progressive overload.',
  },
  {
    value: 'strength',
    label: 'Pure Strength',
    description: 'Heavy compound lifting with lower rep ranges and extended rest periods.',
  },
  {
    value: 'fat_loss',
    label: 'Fat Loss & Conditioning',
    description: 'High-density circuits, compound movements, and elevated caloric expenditure.',
  },
  {
    value: 'endurance',
    label: 'Muscular Endurance',
    description: 'High repetition capacity, shorter rest intervals, and stamina training.',
  },
  {
    value: 'general_fitness',
    label: 'General Health & Fitness',
    description: 'Balanced full-body conditioning for overall mobility, strength, and vitality.',
  },
  {
    value: 'mobility',
    label: 'Mobility & Flexibility',
    description: 'Movement quality, joint health, stretching, and postural stability.',
  },
];

export const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner (0 - 1 year)' },
  { value: 'intermediate', label: 'Intermediate (1 - 3 years)' },
  { value: 'advanced', label: 'Advanced (3+ years)' },
];

/**
 * Pure validation boundary for WorkoutDraft
 */
export function validateWorkoutDraft(draft: WorkoutDraft): DraftValidationResult {
  const errors: Record<string, string> = {};

  if (!draft.name || draft.name.trim().length === 0) {
    errors.name = 'Workout name is required.';
  } else if (draft.name.trim().length < 2) {
    errors.name = 'Workout name must be at least 2 characters.';
  }

  if (!draft.goal) {
    errors.goal = 'Fitness goal is required.';
  }

  if (!draft.duration || draft.duration <= 0) {
    errors.duration = 'Estimated duration must be greater than 0 minutes.';
  }

  if (!draft.exercises || draft.exercises.length === 0) {
    errors.exercises = 'Workout must contain at least one exercise.';
  } else {
    draft.exercises.forEach((ex, idx) => {
      if (!ex.name || ex.name.trim().length === 0) {
        errors[`exercise_${idx}_name`] = `Exercise #${idx + 1} name is required.`;
      }
      if (!ex.sets || ex.sets < 1) {
        errors[`exercise_${idx}_sets`] = `Exercise #${idx + 1} must have at least 1 set.`;
      }
      if (!ex.reps || String(ex.reps).trim().length === 0) {
        errors[`exercise_${idx}_reps`] = `Exercise #${idx + 1} reps are required.`;
      }
    });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Converts a GeneratedWorkout into an editable WorkoutDraft
 * Leaves the original GeneratedWorkout immutable.
 */
export function generatedWorkoutToDraft(generated: GeneratedWorkout): WorkoutDraft {
  return {
    name: generated.name,
    goal: generated.goal,
    difficulty: generated.difficulty,
    duration: generated.duration,
    targetMuscles: [...generated.targetMuscles],
    equipment: [...generated.equipment],
    exercises: generated.exercises.map((ex, idx) => ({
      id: generateId(),
      exerciseId: ex.exerciseId,
      name: ex.name,
      sets: ex.sets,
      reps: String(ex.reps),
      rest: String(ex.rest),
      targetMuscles: [...ex.targetMuscles],
      secondaryMuscles: ex.secondaryMuscles ? [...ex.secondaryMuscles] : undefined,
      equipment: [...ex.equipment],
      notes: ex.notes,
      difficulty: ex.difficulty,
      order: idx,
      groupId: ex.groupId,
      groupType: ex.groupType,
      groupPosition: ex.groupPosition,
    })),
    sourceGeneratedId: generated.id,
    presentationMode: generated.presentationMode,
    quickProfile: generated.quickProfile,
    isDirty: false,
  };
}

/**
 * Converts an existing WorkoutTemplate into an editable WorkoutDraft
 */
export function templateToDraft(template: WorkoutTemplate): WorkoutDraft {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    goal: template.goal,
    difficulty: template.difficulty,
    duration: template.duration,
    targetMuscles: [...template.targetMuscles],
    equipment: [...template.equipment],
    exercises: template.exercises.map((ex, idx) => ({
      id: ex.id || generateId(),
      exerciseId: ex.exerciseId,
      name: ex.name,
      sets: ex.sets,
      reps: String(ex.reps),
      rest: String(ex.rest),
      targetMuscles: [...ex.targetMuscles],
      secondaryMuscles: ex.secondaryMuscles ? [...ex.secondaryMuscles] : undefined,
      equipment: [...ex.equipment],
      notes: ex.notes,
      difficulty: ex.difficulty,
      order: idx,
      groupId: ex.groupId,
      groupType: ex.groupType,
      groupPosition: ex.groupPosition,
    })),
    presentationMode: template.presentationMode,
    quickProfile: template.quickProfile,
    isDirty: false,
  };
}

/**
 * Creates an empty initial manual WorkoutDraft
 */
export function createEmptyWorkoutDraft(): WorkoutDraft {
  return {
    name: 'Custom Workout Plan',
    goal: 'hypertrophy',
    difficulty: 'intermediate',
    duration: 45,
    targetMuscles: ['Full Body'],
    equipment: ['Dumbbells', 'Bodyweight'],
    exercises: [],
    isDirty: false,
  };
}

/**
 * Converts a validated WorkoutDraft into a persistent canonical WorkoutTemplate
 */
export function draftToWorkoutTemplate(draft: WorkoutDraft, userId?: string): WorkoutTemplate {
  const now = new Date().toISOString();
  return {
    id: draft.id || generateId(),
    userId,
    name: draft.name.trim(),
    description: draft.description?.trim(),
    goal: draft.goal,
    difficulty: draft.difficulty,
    duration: draft.duration,
    targetMuscles: [...draft.targetMuscles],
    equipment: [...draft.equipment],
    exercises: draft.exercises.map((ex, idx) => ({
      id: ex.id || generateId(),
      exerciseId: ex.exerciseId,
      name: ex.name,
      sets: ex.sets,
      reps: String(ex.reps),
      rest: String(ex.rest),
      targetMuscles: [...ex.targetMuscles],
      secondaryMuscles: ex.secondaryMuscles ? [...ex.secondaryMuscles] : undefined,
      equipment: [...ex.equipment],
      notes: ex.notes,
      difficulty: ex.difficulty,
      order: idx,
      groupId: ex.groupId,
      groupType: ex.groupType,
      groupPosition: ex.groupPosition,
    })),
    isFavorite: false,
    isCustom: true,
    presentationMode: draft.presentationMode,
    quickProfile: draft.quickProfile,
    createdAt: now,
    updatedAt: now,
  };
}
