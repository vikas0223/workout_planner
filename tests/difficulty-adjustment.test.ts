import { describe, it, expect } from 'vitest';
import { DifficultyService } from '@/lib/domain/difficulty-adjustment';

describe('DifficultyService', () => {
  it('defaults to intermediate with empty workout history', () => {
    const result = DifficultyService.analyzeDifficultyAdjustment([], []);
    expect(result.difficulty).toBe('intermediate');
    expect(result.reason).toContain('No workout history');
  });

  it('suggests beginner when user gives low rating or too hard feedback', () => {
    const workouts = [
      { workoutPlanId: 'w1', date: new Date().toISOString(), difficulty: 'intermediate' },
    ];
    const ratings = [
      { workoutPlanId: 'w1', rating: 2, feedback: 'too difficult to complete', timestamp: Date.now() },
    ];

    const result = DifficultyService.analyzeDifficultyAdjustment(workouts, ratings);
    expect(result.difficulty).toBe('beginner');
    expect(result.reason).toContain('too challenging');
  });

  it('calculates workouts per week correctly', () => {
    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const workouts = [
      { workoutPlanId: 'w4', date: now.toISOString() },
      { workoutPlanId: 'w3', date: new Date(now.getTime() - 4 * 86400000).toISOString() },
      { workoutPlanId: 'w2', date: new Date(now.getTime() - 8 * 86400000).toISOString() },
      { workoutPlanId: 'w1', date: twoWeeksAgo.toISOString() },
    ];

    const rate = DifficultyService.calculateWorkoutsPerWeek(workouts);
    expect(rate).toBe(2);
  });
});
