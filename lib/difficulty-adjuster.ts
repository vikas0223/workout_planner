import { DifficultyService, type CompletedWorkoutRef, type WorkoutRatingRef, type DifficultyAdjustmentResult } from './domain/difficulty-adjustment';

export type CompletedWorkout = CompletedWorkoutRef;
export type WorkoutRating = WorkoutRatingRef;

export function analyzeDifficultyAdjustment(
  completedWorkouts: CompletedWorkoutRef[] = [],
  workoutRatings: WorkoutRatingRef[] = []
): DifficultyAdjustmentResult {
  return DifficultyService.analyzeDifficultyAdjustment(completedWorkouts, workoutRatings);
}

export { DifficultyService };
