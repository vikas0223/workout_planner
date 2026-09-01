import { describe, it, expect } from 'vitest';
import { WorkoutEngine } from '@/features/workout-engine';
import { isUuid } from '@/lib/utils/id';

describe('WorkoutEngine (Deterministic V1)', () => {
  const baseInput = {
    name: 'Alex',
    fitnessLevel: 'intermediate',
    primaryGoal: 'muscle_gain',
    targetMuscles: ['Chest', 'Triceps'],
    equipment: ['Dumbbells', 'Bench'],
    durationMinutes: 45,
    seed: 42,
  };

  it('generates reproducible workouts with same input + same seed', () => {
    const workout1 = WorkoutEngine.generateWorkoutPlan(baseInput);
    const workout2 = WorkoutEngine.generateWorkoutPlan(baseInput);

    expect(workout1.name).toBe(workout2.name);
    expect(workout1.goal).toBe(workout2.goal);
    expect(workout1.difficulty).toBe(workout2.difficulty);
    expect(workout1.duration).toBe(workout2.duration);
    expect(workout1.exercises.length).toBe(workout2.exercises.length);
    expect(workout1.exercises.map((e) => e.name)).toEqual(workout2.exercises.map((e) => e.name));
  });

  it('assigns valid UUIDs to generated workouts and exercises', () => {
    const workout = WorkoutEngine.generateWorkoutPlan(baseInput);

    expect(isUuid(workout.id)).toBe(true);
    workout.exercises.forEach((ex) => {
      expect(isUuid(ex.id)).toBe(true);
      expect(ex.order).toBeGreaterThan(0);
    });
  });

  it('prevents duplicate exercises within a generated routine', () => {
    const workout = WorkoutEngine.generateWorkoutPlan({
      ...baseInput,
      durationMinutes: 60,
    });

    const names = workout.exercises.map((e) => e.name.toLowerCase());
    const uniqueNames = new Set(names);
    expect(names.length).toBe(uniqueNames.size);
  });

  it('respects duration constraints when scaling exercise counts', () => {
    const shortWorkout = WorkoutEngine.generateWorkoutPlan({ ...baseInput, durationMinutes: 20 });
    const longWorkout = WorkoutEngine.generateWorkoutPlan({ ...baseInput, durationMinutes: 60 });

    expect(shortWorkout.exercises.length).toBeLessThanOrEqual(4);
    expect(longWorkout.exercises.length).toBeGreaterThanOrEqual(5);
  });

  it('adjusts sets and reps according to strength goal', () => {
    const strengthWorkout = WorkoutEngine.generateWorkoutPlan({
      ...baseInput,
      primaryGoal: 'strength',
      fitnessLevel: 'advanced',
    });

    expect(strengthWorkout.exercises.length).toBeGreaterThan(0);
    expect(strengthWorkout.exercises[0].sets).toBe(5);
    expect(strengthWorkout.exercises[0].reps).toBe('4-6 reps');
  });

  it('adjusts parameters correctly from user feedback', () => {
    const adjustedHard = WorkoutEngine.adjustParametersFromFeedback(baseInput, 'It was too difficult');
    expect(adjustedHard.fitnessLevel).toBe('beginner');
    expect(adjustedHard.durationMinutes).toBe(35);

    const adjustedShort = WorkoutEngine.adjustParametersFromFeedback(baseInput, 'Need to shorten the time');
    expect(adjustedShort.durationMinutes).toBe(30);
  });
});
