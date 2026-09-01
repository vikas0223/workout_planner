/**
 * Pure Deterministic Workout Generation Engine
 * Extracted from UI components into a pure domain service.
 * No React, Supabase, IndexedDB, or UI dependencies.
 */

import { Exercise, GeneratedWorkout, GeneratedWorkoutExercise, FitnessGoal, ExperienceLevel } from '@/types/domain';
import { ExerciseCatalog } from '@/lib/data/exercise-catalog';
import { SeededRandom } from './seeded-random';
import { generateId } from '@/lib/utils/id';

export interface WorkoutEngineInput {
  name?: string;
  age?: number;
  gender?: string;
  fitnessLevel: ExperienceLevel | string;
  primaryGoal: FitnessGoal | string;
  targetMuscles: string[];
  equipment: string[];
  durationMinutes: number;
  daysPerWeek?: number;
  experience?: string;
  seed?: number | string;
  notes?: string;
}

export class WorkoutEngine {
  public static readonly VERSION = '1.0.0';

  /**
   * Generates a deterministic workout plan based on user inputs.
   */
  public static generateWorkoutPlan(input: WorkoutEngineInput): GeneratedWorkout {
    const seedValue = input.seed !== undefined ? input.seed : 42;
    const rng = new SeededRandom(seedValue);
    const catalog = ExerciseCatalog.listExercises();
    const appliedRules: string[] = [];

    // Normalize inputs
    const duration = input.durationMinutes || 45;
    const goal = input.primaryGoal || 'general_fitness';
    const fitnessLevel = (input.fitnessLevel || 'intermediate').toLowerCase() as ExperienceLevel;
    const userEquipment = (input.equipment && input.equipment.length > 0)
      ? input.equipment
      : ['bodyweight'];
    const targetMuscles = (input.targetMuscles && input.targetMuscles.length > 0)
      ? input.targetMuscles
      : ['Full Body'];

    appliedRules.push(`goal_filter:${goal}`);
    appliedRules.push(`muscles_filter:${targetMuscles.join(',')}`);
    appliedRules.push(`equipment_filter:${userEquipment.join(',')}`);
    appliedRules.push(`duration_rule:${duration}m`);

    const equipmentSet = new Set(userEquipment.map((e) => e.toLowerCase()));
    // Always permit bodyweight
    equipmentSet.add('bodyweight');
    equipmentSet.add('none');

    // 1. Filter exercises by Goal & Equipment
    const goalFiltered = catalog.filter((exercise) => {
      // Check equipment
      const hasEquipment = exercise.equipment?.every(
        (eq) => equipmentSet.has(eq.toLowerCase()) || eq.toLowerCase() === 'bodyweight'
      ) ?? true;
      if (!hasEquipment) return false;

      // Check goal
      const matchesGoal = exercise.goals?.some(
        (g) => g.toLowerCase() === goal.toLowerCase() || g.toLowerCase().includes(goal.toLowerCase())
      ) ?? true;

      return matchesGoal;
    });

    // 2. Filter or prioritize by Target Muscles
    const isFullBody = targetMuscles.some((m) => m.toLowerCase() === 'full body');
    let muscleMatching: Exercise[] = [];

    if (isFullBody) {
      muscleMatching = goalFiltered;
    } else {
      const musclesLower = targetMuscles.map((m) => m.toLowerCase());
      muscleMatching = goalFiltered.filter((exercise) =>
        exercise.primaryMuscles?.some((pm) =>
          musclesLower.some((m) => pm.toLowerCase().includes(m) || m.includes(pm.toLowerCase()))
        )
      );
    }

    // Fallback if no exact muscle match found with strict goal
    if (muscleMatching.length === 0) {
      appliedRules.push('fallback_equipment_matching');
      muscleMatching = catalog.filter((exercise) =>
        exercise.equipment?.every(
          (eq) => equipmentSet.has(eq.toLowerCase()) || eq.toLowerCase() === 'bodyweight'
        )
      );
    }

    // 3. Determine exercise count based on duration
    // Standard: ~6-8 mins per exercise including rest and sets
    let targetExerciseCount = Math.max(3, Math.min(8, Math.round(duration / 7)));
    if (duration <= 20) targetExerciseCount = 3;
    else if (duration <= 30) targetExerciseCount = 4;
    else if (duration <= 45) targetExerciseCount = 5;
    else if (duration <= 60) targetExerciseCount = 6;
    else targetExerciseCount = 7;

    // 4. Group by muscle group to ensure balanced distribution
    const shuffledPool = rng.shuffle(muscleMatching);
    const selectedExercises: Exercise[] = [];
    const usedNames = new Set<string>();

    for (const ex of shuffledPool) {
      if (selectedExercises.length >= targetExerciseCount) break;
      if (!usedNames.has(ex.name.toLowerCase())) {
        selectedExercises.push(ex);
        usedNames.add(ex.name.toLowerCase());
      }
    }

    // If still under target count, pull from general catalog with valid equipment
    if (selectedExercises.length < targetExerciseCount) {
      const remainingPool = rng.shuffle(
        catalog.filter(
          (ex) =>
            !usedNames.has(ex.name.toLowerCase()) &&
            ex.equipment?.every((eq) => equipmentSet.has(eq.toLowerCase()) || eq.toLowerCase() === 'bodyweight')
        )
      );

      for (const ex of remainingPool) {
        if (selectedExercises.length >= targetExerciseCount) break;
        selectedExercises.push(ex);
        usedNames.add(ex.name.toLowerCase());
      }
    }

    // 5. Prescribe sets, reps, and rest based on goal and fitness level
    const workoutExercises: GeneratedWorkoutExercise[] = selectedExercises.map((ex, index) => {
      let sets = ex.defaultSets || 3;
      let reps = typeof ex.defaultReps === 'number' ? `${ex.defaultReps} reps` : (ex.defaultReps || '10-12 reps');
      let rest = ex.defaultRestSeconds ? `${ex.defaultRestSeconds}s` : '60s';

      if (goal === 'strength') {
        sets = fitnessLevel === 'advanced' ? 5 : 4;
        reps = '4-6 reps';
        rest = '120-180s';
      } else if (goal === 'muscle_gain') {
        sets = fitnessLevel === 'beginner' ? 3 : 4;
        reps = '8-12 reps';
        rest = '60-90s';
      } else if (goal === 'endurance' || goal === 'fat_loss') {
        sets = 3;
        reps = '15-20 reps';
        rest = '30-45s';
      } else if (goal === 'mobility') {
        sets = 2;
        reps = '10-12 reps (controlled)';
        rest = '30s';
      }

      // Adjust for fitness level
      if (fitnessLevel === 'beginner' && sets > 3) sets = 3;
      if (fitnessLevel === 'advanced' && sets < 4 && goal !== 'mobility') sets = 4;

      return {
        id: generateId(),
        exerciseId: ex.id,
        name: ex.name,
        sets,
        reps: String(reps),
        rest: String(rest),
        targetMuscles: ex.primaryMuscles || targetMuscles,
        secondaryMuscles: ex.secondaryMuscles,
        equipment: ex.equipment || ['Bodyweight'],
        notes: ex.tips ? ex.tips[0] : undefined,
        difficulty: ex.difficulty || fitnessLevel,
        order: index + 1,
      };
    });

    const workoutName = input.name
      ? `${input.name}'s ${formatGoal(goal)} Workout`
      : `${formatGoal(goal)} Routine`;

    return {
      id: generateId(),
      name: workoutName,
      goal,
      difficulty: fitnessLevel,
      duration,
      targetMuscles,
      equipment: userEquipment,
      exercises: workoutExercises,
      trace: {
        appliedRules,
        excludedExercisesCount: catalog.length - selectedExercises.length,
        seed: typeof seedValue === 'number' ? seedValue : 42,
        engineVersion: WorkoutEngine.VERSION,
        catalogVersion: ExerciseCatalog.getCatalogVersion(),
        timestamp: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Adjusts workout generation parameters from user feedback
   */
  public static adjustParametersFromFeedback(
    currentInput: WorkoutEngineInput,
    feedback: string
  ): WorkoutEngineInput {
    const text = feedback.toLowerCase();
    const updated = { ...currentInput };

    if (text.includes('too hard') || text.includes('too difficult') || text.includes('exhausted')) {
      if (updated.fitnessLevel === 'advanced') updated.fitnessLevel = 'intermediate';
      else if (updated.fitnessLevel === 'intermediate') updated.fitnessLevel = 'beginner';
      updated.durationMinutes = Math.max(20, (updated.durationMinutes || 45) - 10);
    } else if (text.includes('too easy') || text.includes('not challenging')) {
      if (updated.fitnessLevel === 'beginner') updated.fitnessLevel = 'intermediate';
      else if (updated.fitnessLevel === 'intermediate') updated.fitnessLevel = 'advanced';
      updated.durationMinutes = Math.min(90, (updated.durationMinutes || 45) + 10);
    }

    if (text.includes('too long') || text.includes('shorten')) {
      updated.durationMinutes = Math.max(20, (updated.durationMinutes || 45) - 15);
    } else if (text.includes('too short') || text.includes('longer')) {
      updated.durationMinutes = Math.min(90, (updated.durationMinutes || 45) + 15);
    }

    return updated;
  }
}

function formatGoal(goal: string): string {
  return goal
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
