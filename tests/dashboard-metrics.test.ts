import { describe, it, expect } from 'vitest';
import { DashboardMetricsService } from '@/lib/domain/dashboard-metrics';

describe('DashboardMetricsService', () => {
  it('returns empty defaults for empty workout list', () => {
    const metrics = DashboardMetricsService.buildMetrics([], 4);
    expect(metrics.totalWorkoutsCompleted).toBe(0);
    expect(metrics.totalDurationMinutes).toBe(0);
    expect(metrics.currentStreakDays).toBe(0);
    expect(metrics.weeklyWorkoutsTarget).toBe(4);
  });

  it('aggregates total duration, calories, and categories', () => {
    const workouts = [
      {
        id: 'w1',
        date: new Date().toISOString(),
        duration: 45,
        caloriesBurned: 300,
        difficulty: 'intermediate',
        exercises: [{ name: 'Squat' }, { name: 'Bench' }],
      },
      {
        id: 'w2',
        date: new Date(Date.now() - 86400000).toISOString(),
        duration: 30,
        caloriesBurned: 200,
        difficulty: 'beginner',
        exercises: [{ name: 'Pushup' }],
      },
    ];

    const metrics = DashboardMetricsService.buildMetrics(workouts, 3);
    expect(metrics.totalWorkoutsCompleted).toBe(2);
    expect(metrics.totalDurationMinutes).toBe(75);
    expect(metrics.totalCaloriesBurned).toBe(500);
    expect(metrics.categoryDistribution.length).toBe(2);
    expect(metrics.currentStreakDays).toBeGreaterThanOrEqual(1);
  });
});
