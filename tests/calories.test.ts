import { describe, it, expect } from 'vitest';
import { CalorieService } from '@/lib/domain/calories';

describe('CalorieService', () => {
  it('estimates exercise calories with rep parsing', () => {
    const ex = {
      name: 'Bicep Curls',
      sets: 3,
      reps: '12 reps',
      targetMuscles: ['Arms'],
    };

    const calories = CalorieService.estimateExerciseCalories(ex);
    // 3 * 12 * 0.15 = 5.4 -> 5 kcal
    expect(calories).toBe(5);
  });

  it('applies multiplier for large muscle groups', () => {
    const armEx = {
      name: 'Tricep Extension',
      sets: 4,
      reps: 10,
      targetMuscles: ['Arms'],
    };
    const legEx = {
      name: 'Barbell Squat',
      sets: 4,
      reps: 10,
      targetMuscles: ['Legs', 'Quads'],
    };

    const armCals = CalorieService.estimateExerciseCalories(armEx);
    const legCals = CalorieService.estimateExerciseCalories(legEx);

    expect(legCals).toBeGreaterThan(armCals);
  });

  it('calculates total calories for workout list', () => {
    const exercises = [
      { name: 'Pushups', sets: 3, reps: '10', targetMuscles: ['Chest'] },
      { name: 'Squats', sets: 3, reps: '10', targetMuscles: ['Legs'] },
    ];

    const total = CalorieService.calculateTotalWorkoutCalories(exercises);
    expect(total).toBeGreaterThan(0);
  });
});
