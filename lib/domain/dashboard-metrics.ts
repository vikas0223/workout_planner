/**
 * Pure Dashboard Metrics Aggregation Service
 * Consolidates metric computations across dashboards.
 */

import { DashboardMetrics } from '@/types/domain';

export interface RawCompletedWorkout {
  id?: string;
  workoutPlanId?: string;
  name?: string;
  date: string | number | Date;
  duration?: number;
  caloriesBurned?: number;
  difficulty?: string;
  exercises?: { id?: string; name: string }[];
  targetMuscles?: string[];
}

export class DashboardMetricsService {
  public static buildMetrics(
    completedWorkouts: RawCompletedWorkout[] = [],
    weeklyTarget: number = 4
  ): DashboardMetrics {
    if (!completedWorkouts || completedWorkouts.length === 0) {
      return this.getEmptyMetrics(weeklyTarget);
    }

    let totalDuration = 0;
    let totalCalories = 0;
    const categoryCounts: Record<string, number> = {};

    completedWorkouts.forEach((w) => {
      totalDuration += w.duration || 0;
      totalCalories += w.caloriesBurned || 0;

      const category = w.difficulty || 'General';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    const categoryDistribution = Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / completedWorkouts.length) * 100),
    }));

    const weeklyWorkouts = this.getWeeklyWorkoutsCount(completedWorkouts);
    const { currentStreak, longestStreak } = this.calculateStreaks(completedWorkouts);
    const workoutsByDayOfWeek = this.getWorkoutsByDayOfWeek(completedWorkouts);

    const recentWorkouts = completedWorkouts.slice(0, 5).map((w, idx) => ({
      id: w.id || `workout-${idx}`,
      name: w.name || 'Workout Session',
      date: new Date(w.date).toISOString().split('T')[0],
      duration: w.duration || 0,
      exercisesCount: w.exercises?.length || 0,
      difficulty: w.difficulty,
    }));

    return {
      totalWorkoutsCompleted: completedWorkouts.length,
      totalDurationMinutes: totalDuration,
      totalCaloriesBurned: totalCalories,
      totalVolumeMoved: 0,
      currentStreakDays: currentStreak,
      longestStreakDays: longestStreak,
      weeklyWorkoutsCount: weeklyWorkouts,
      weeklyWorkoutsTarget: weeklyTarget,
      workoutsByDayOfWeek,
      categoryDistribution,
      recentWorkouts,
    };
  }

  private static getEmptyMetrics(weeklyTarget: number): DashboardMetrics {
    return {
      totalWorkoutsCompleted: 0,
      totalDurationMinutes: 0,
      totalCaloriesBurned: 0,
      totalVolumeMoved: 0,
      currentStreakDays: 0,
      longestStreakDays: 0,
      weeklyWorkoutsCount: 0,
      weeklyWorkoutsTarget: weeklyTarget,
      workoutsByDayOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
        day,
        count: 0,
        date: '',
      })),
      categoryDistribution: [],
      recentWorkouts: [],
    };
  }

  private static getWeeklyWorkoutsCount(workouts: RawCompletedWorkout[]): number {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return workouts.filter((w) => new Date(w.date) >= oneWeekAgo).length;
  }

  private static calculateStreaks(workouts: RawCompletedWorkout[]): { currentStreak: number; longestStreak: number } {
    if (workouts.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const dates = workouts
      .map((w) => new Date(w.date).toISOString().split('T')[0])
      .sort()
      .reverse();

    const uniqueDates = Array.from(new Set(dates));
    if (uniqueDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const hasToday = uniqueDates.includes(todayStr);
    const hasYesterday = uniqueDates.includes(yesterdayStr);

    if (hasToday || hasYesterday) {
      currentStreak = 1;
      let checkDate = new Date(hasToday ? todayStr : yesterdayStr);

      for (let i = 1; i < uniqueDates.length; i++) {
        checkDate.setDate(checkDate.getDate() - 1);
        const expected = checkDate.toISOString().split('T')[0];
        if (uniqueDates.includes(expected)) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const current = new Date(uniqueDates[i]);
      const prev = new Date(uniqueDates[i + 1]);
      const diffDays = (current.getTime() - prev.getTime()) / (1000 * 3600 * 24);

      if (Math.round(diffDays) === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    return { currentStreak, longestStreak };
  }

  private static getWorkoutsByDayOfWeek(
    workouts: RawCompletedWorkout[]
  ): { day: string; count: number; date: string }[] {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts: Record<string, number> = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };

    workouts.forEach((w) => {
      const d = new Date(w.date);
      const dayName = days[d.getDay()];
      counts[dayName] = (counts[dayName] || 0) + 1;
    });

    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
      day,
      count: counts[day] || 0,
      date: '',
    }));
  }
}
