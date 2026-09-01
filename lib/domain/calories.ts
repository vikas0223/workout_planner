/**
 * Pure Calorie Estimation Service
 * Extracted from workout-plan-with-tracking.tsx
 */

export interface ExerciseCalorieInput {
  name: string;
  sets?: number;
  reps?: string | number;
  targetMuscles?: string[];
  durationMinutes?: number;
}

export class CalorieService {
  /**
   * Estimates calories burned for a single exercise
   */
  public static estimateExerciseCalories(exercise: ExerciseCalorieInput): number {
    const sets = exercise.sets || 3;
    let reps = 10;

    if (typeof exercise.reps === 'number') {
      reps = exercise.reps;
    } else if (typeof exercise.reps === 'string') {
      const repMatch = exercise.reps.match(/\d+/);
      reps = repMatch ? Number.parseInt(repMatch[0], 10) : 10;
    }

    // Base calorie estimation: ~0.15 kcal per rep
    let baseCalories = sets * reps * 0.15;

    // Adjust based on muscle group recruitment (larger muscles burn more)
    const muscles = (exercise.targetMuscles || []).map((m) => m.toLowerCase());
    const isLargeMuscle = muscles.some(
      (m) =>
        m.includes('leg') ||
        m.includes('quad') ||
        m.includes('glute') ||
        m.includes('back') ||
        m.includes('chest') ||
        m.includes('full body')
    );

    if (isLargeMuscle) {
      baseCalories *= 1.35;
    }

    return Math.round(baseCalories);
  }

  /**
   * Calculates total estimated calories for a workout
   */
  public static calculateTotalWorkoutCalories(exercises: ExerciseCalorieInput[]): number {
    if (!exercises || exercises.length === 0) return 0;
    return exercises.reduce((sum, ex) => sum + this.estimateExerciseCalories(ex), 0);
  }
}
