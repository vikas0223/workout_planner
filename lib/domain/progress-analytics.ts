/**
 * Pure Progress Analytics Domain Service
 *
 * Rules:
 * - Pure domain computation derived dynamically from canonical WorkoutSession / WorkoutSet data.
 * - Zero separate persistent counters.
 * - Completion Semantics: WorkoutSession.status === 'completed' counts toward completed totals, frequency, streaks.
 * - Abandoned sessions are excluded from completed counts and streaks, but included in raw history.
 * - Deleted sets (deletedAt != null) and skipped exercises are excluded from performed metrics.
 * - Strict Volume Unit Rule: Internal volume normalized to KG (1 lb = 0.45359237 kg).
 * - Bodyweight Rule: Sets with 0 load are tracked via bodyweightSets / bodyweightReps without skewing volume to zero.
 * - Muscle Distribution: Joined via ExerciseCatalog with primary (1.0) and secondary (0.5) weights.
 */

import { WorkoutSession, SessionExercise, WorkoutSet } from '@/types/domain';
import { ExerciseCatalog } from '@/lib/data/exercise-catalog';
import {
  ProgressPeriod,
  ProgressPeriodService,
  DateRange,
  DAYS_OF_WEEK,
  DayOfWeek,
} from './progress-period';

export interface VolumeDataPoint {
  dateStr: string; // YYYY-MM-DD
  displayDate: string; // "Aug 26"
  volumeKg: number;
  volumeLbs: number;
  setsCount: number;
  repsCount: number;
}

export interface WeeklyFrequencyPoint {
  weekKey: string; // e.g. "2026-W35"
  weekLabel: string; // "Week 35"
  count: number;
  volumeKg: number;
  durationMinutes: number;
}

export interface DayOfWeekPoint {
  day: DayOfWeek;
  count: number;
  percentage: number;
}

export interface MuscleDistributionItem {
  muscleId: string;
  muscleName: string;
  weightedSets: number;
  totalSets: number;
  percentage: number;
  isPrimaryCount: number;
  isSecondaryCount: number;
}

export interface RecentWorkoutSummary {
  id: string;
  name: string;
  dateStr: string;
  startedAt: string;
  completedAt?: string;
  durationMinutes: number;
  status: 'completed' | 'active' | 'in_progress' | 'abandoned';
  exercisesCount: number;
  performedSetsCount: number;
  totalVolumeKg: number;
  rating?: number;
  difficulty?: string;
}

export interface AggregatedProgressMetrics {
  // Period definition
  period: ProgressPeriod;
  dateRange: DateRange;

  // Primary KPIs
  completedWorkoutsCount: number;
  startedWorkoutsCount: number;
  abandonedWorkoutsCount: number;
  totalDurationMinutes: number;
  averageDurationMinutes: number;
  totalPerformedSets: number;
  totalReps: number;

  // Volume
  totalVolumeKg: number;
  totalVolumeLbs: number;
  bodyweightOnlySets: number;
  bodyweightOnlyReps: number;

  // Streaks & Consistency
  currentStreakDays: number;
  longestStreakDays: number;
  weeklyTarget: number;
  weeklyCompletedCount: number;
  weeklyTargetProgressPercentage: number;

  // Chart series
  volumeOverTime: VolumeDataPoint[];
  weeklyFrequency: WeeklyFrequencyPoint[];
  dayOfWeekDistribution: DayOfWeekPoint[];
  muscleDistribution: MuscleDistributionItem[];
  recentWorkouts: RecentWorkoutSummary[];
}

const LBS_TO_KG = 0.45359237;
const KG_TO_LBS = 2.20462262;

export class ProgressAnalyticsService {
  /**
   * Computes full dashboard metrics from canonical sessions for a given period.
   */
  public static computeMetrics(
    allSessions: WorkoutSession[],
    period: ProgressPeriod = '30d',
    customRange?: { startDate?: string | Date; endDate?: string | Date },
    weeklyTarget: number = 4,
    referenceDate: Date = new Date()
  ): AggregatedProgressMetrics {
    const dateRange = ProgressPeriodService.getDateRange(period, customRange, referenceDate);

    // 1. Filter sessions within date range
    const filteredSessions = allSessions.filter((s) => {
      const sessionDate = s.completedAt || s.startedAt;
      return ProgressPeriodService.isDateInRange(sessionDate, dateRange);
    });

    // 2. Separate completed vs abandoned
    const completedSessions = filteredSessions.filter((s) => s.status === 'completed');
    const startedSessions = filteredSessions.filter((s) => s.status !== 'abandoned');
    const abandonedSessions = filteredSessions.filter((s) => s.status === 'abandoned');

    // 3. Durations
    let totalDurationSeconds = 0;
    completedSessions.forEach((s) => {
      if (s.duration) {
        totalDurationSeconds += s.duration;
      } else if (s.startedAt && s.completedAt) {
        const start = new Date(s.startedAt).getTime();
        const end = new Date(s.completedAt).getTime();
        if (end > start) {
          totalDurationSeconds += Math.round((end - start) / 1000);
        }
      }
    });
    const totalDurationMinutes = Math.round(totalDurationSeconds / 60);
    const averageDurationMinutes =
      completedSessions.length > 0 ? Math.round(totalDurationMinutes / completedSessions.length) : 0;

    // 4. Sets, Reps, and Volume Calculation
    let totalPerformedSets = 0;
    let totalReps = 0;
    let totalVolumeKg = 0;
    let bodyweightOnlySets = 0;
    let bodyweightOnlyReps = 0;

    // Volume grouping by date for chart
    const dailyVolumeMap: Record<
      string,
      { volumeKg: number; setsCount: number; repsCount: number }
    > = {};

    // Muscle accumulation map
    const muscleWeightedMap: Record<
      string,
      { weightedSets: number; totalSets: number; primaryCount: number; secondaryCount: number }
    > = {};

    completedSessions.forEach((session) => {
      const sessionDateStr = ProgressPeriodService.toLocalDateString(
        session.completedAt || session.startedAt
      );

      (session.exercises || []).forEach((exercise) => {
        if (exercise.status === 'skipped') return; // Skip skipped exercises

        const validSets = (exercise.sets || []).filter(
          (set) => !set.deletedAt && (set.status === 'completed' || !set.status)
        );

        if (validSets.length === 0) return;

        // Fetch exercise metadata from ExerciseCatalog
        const catalogExercise = ExerciseCatalog.getExerciseById(exercise.exerciseId || exercise.id);
        const primaryMuscles = catalogExercise?.primaryMuscles || exercise.targetMuscles || [];
        const secondaryMuscles = catalogExercise?.secondaryMuscles || [];

        validSets.forEach((set) => {
          totalPerformedSets += 1;
          const reps = set.actualReps !== undefined ? set.actualReps : set.targetReps || 0;
          totalReps += reps;

          let rawWeight = set.actualWeight !== undefined ? set.actualWeight : (set.loadValue || 0);
          const unit = set.weightUnit || 'kg';

          if (rawWeight > 0 && reps > 0) {
            const weightInKg = unit === 'lbs' ? rawWeight * LBS_TO_KG : rawWeight;
            const setVolumeKg = weightInKg * reps;
            totalVolumeKg += setVolumeKg;

            if (sessionDateStr) {
              if (!dailyVolumeMap[sessionDateStr]) {
                dailyVolumeMap[sessionDateStr] = { volumeKg: 0, setsCount: 0, repsCount: 0 };
              }
              dailyVolumeMap[sessionDateStr].volumeKg += setVolumeKg;
              dailyVolumeMap[sessionDateStr].setsCount += 1;
              dailyVolumeMap[sessionDateStr].repsCount += reps;
            }
          } else {
            // Bodyweight or zero-load movement
            bodyweightOnlySets += 1;
            bodyweightOnlyReps += reps;

            if (sessionDateStr) {
              if (!dailyVolumeMap[sessionDateStr]) {
                dailyVolumeMap[sessionDateStr] = { volumeKg: 0, setsCount: 0, repsCount: 0 };
              }
              dailyVolumeMap[sessionDateStr].setsCount += 1;
              dailyVolumeMap[sessionDateStr].repsCount += reps;
            }
          }

          // Muscle distribution: primary weight = 1.0, secondary weight = 0.5
          primaryMuscles.forEach((muscle) => {
            const norm = muscle.toLowerCase().trim();
            if (!muscleWeightedMap[norm]) {
              muscleWeightedMap[norm] = { weightedSets: 0, totalSets: 0, primaryCount: 0, secondaryCount: 0 };
            }
            muscleWeightedMap[norm].weightedSets += 1.0;
            muscleWeightedMap[norm].totalSets += 1;
            muscleWeightedMap[norm].primaryCount += 1;
          });

          secondaryMuscles.forEach((muscle) => {
            const norm = muscle.toLowerCase().trim();
            if (!muscleWeightedMap[norm]) {
              muscleWeightedMap[norm] = { weightedSets: 0, totalSets: 0, primaryCount: 0, secondaryCount: 0 };
            }
            muscleWeightedMap[norm].weightedSets += 0.5;
            muscleWeightedMap[norm].totalSets += 1;
            muscleWeightedMap[norm].secondaryCount += 1;
          });
        });
      });
    });

    totalVolumeKg = Math.round(totalVolumeKg);
    const totalVolumeLbs = Math.round(totalVolumeKg * KG_TO_LBS);

    // 5. Build Volume Over Time series
    const volumeOverTime: VolumeDataPoint[] = Object.entries(dailyVolumeMap)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([dateStr, data]) => {
        const d = new Date(dateStr + 'T00:00:00');
        const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return {
          dateStr,
          displayDate,
          volumeKg: Math.round(data.volumeKg),
          volumeLbs: Math.round(data.volumeKg * KG_TO_LBS),
          setsCount: data.setsCount,
          repsCount: data.repsCount,
        };
      });

    // 6. Muscle Distribution Ranking
    let totalWeightedSetsSum = 0;
    Object.values(muscleWeightedMap).forEach((m) => {
      totalWeightedSetsSum += m.weightedSets;
    });

    const muscleDistribution: MuscleDistributionItem[] = Object.entries(muscleWeightedMap)
      .map(([muscleId, data]) => {
        const formattedName = muscleId
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        const percentage =
          totalWeightedSetsSum > 0 ? Math.round((data.weightedSets / totalWeightedSetsSum) * 100) : 0;
        return {
          muscleId,
          muscleName: formattedName,
          weightedSets: Math.round(data.weightedSets * 10) / 10,
          totalSets: data.totalSets,
          percentage,
          isPrimaryCount: data.primaryCount,
          isSecondaryCount: data.secondaryCount,
        };
      })
      .sort((a, b) => b.weightedSets - a.weightedSets);

    // 7. Streaks (Computed across ALL completed sessions for accurate continuity)
    const { currentStreakDays, longestStreakDays } = this.calculateStreaks(allSessions, referenceDate);

    // 8. Weekly Target Progress
    const startOfCurrentWeek = ProgressPeriodService.getStartOfCurrentWeek(referenceDate);
    const endOfCurrentWeek = ProgressPeriodService.getEndOfCurrentWeek(referenceDate);

    const weeklyCompletedCount = allSessions.filter((s) => {
      if (s.status !== 'completed') return false;
      const completedAt = s.completedAt || s.startedAt;
      if (!completedAt) return false;
      const d = new Date(completedAt);
      return d >= startOfCurrentWeek && d <= endOfCurrentWeek;
    }).length;

    const weeklyTargetProgressPercentage =
      weeklyTarget > 0 ? Math.min(100, Math.round((weeklyCompletedCount / weeklyTarget) * 100)) : 0;

    // 9. Weekly Frequency Over Time
    const weeklyFrequency = this.computeWeeklyFrequency(completedSessions);

    // 10. Day-of-Week Distribution (Mon-Sun)
    const dayOfWeekDistribution = this.computeDayOfWeekDistribution(completedSessions);

    // 11. Recent Workouts (Up to 10 latest)
    const recentWorkouts: RecentWorkoutSummary[] = filteredSessions
      .sort(
        (a, b) =>
          new Date(b.startedAt || b.completedAt || 0).getTime() -
          new Date(a.startedAt || a.completedAt || 0).getTime()
      )
      .slice(0, 10)
      .map((s) => {
        const dateStr = ProgressPeriodService.toLocalDateString(s.completedAt || s.startedAt);
        let sSets = 0;
        let sVolKg = 0;
        (s.exercises || []).forEach((e) => {
          if (e.status === 'skipped') return;
          (e.sets || []).forEach((set) => {
            if (!set.deletedAt && (set.status === 'completed' || !set.status)) {
              sSets += 1;
              const w = set.actualWeight !== undefined ? set.actualWeight : (set.loadValue || 0);
              const r = set.actualReps !== undefined ? set.actualReps : set.targetReps || 0;
              const u = set.weightUnit || 'kg';
              if (w > 0 && r > 0) {
                sVolKg += (u === 'lbs' ? w * LBS_TO_KG : w) * r;
              }
            }
          });
        });

        const durationMinutes = s.duration ? Math.round(s.duration / 60) : 0;

        return {
          id: s.id,
          name: s.name || 'Workout Session',
          dateStr,
          startedAt: s.startedAt,
          completedAt: s.completedAt,
          durationMinutes,
          status: s.status as any,
          exercisesCount: (s.exercises || []).length,
          performedSetsCount: sSets,
          totalVolumeKg: Math.round(sVolKg),
          rating: s.feedback?.rating,
          difficulty: s.feedback?.difficulty,
        };
      });

    return {
      period,
      dateRange,
      completedWorkoutsCount: completedSessions.length,
      startedWorkoutsCount: startedSessions.length,
      abandonedWorkoutsCount: abandonedSessions.length,
      totalDurationMinutes,
      averageDurationMinutes,
      totalPerformedSets,
      totalReps,
      totalVolumeKg,
      totalVolumeLbs,
      bodyweightOnlySets,
      bodyweightOnlyReps,
      currentStreakDays,
      longestStreakDays,
      weeklyTarget,
      weeklyCompletedCount,
      weeklyTargetProgressPercentage,
      volumeOverTime,
      weeklyFrequency,
      dayOfWeekDistribution,
      muscleDistribution,
      recentWorkouts,
    };
  }

  /**
   * Calculates current and longest consecutive daily workout streak.
   */
  public static calculateStreaks(
    sessions: WorkoutSession[],
    referenceDate: Date = new Date()
  ): { currentStreakDays: number; longestStreakDays: number } {
    const completed = sessions.filter((s) => s.status === 'completed');
    if (completed.length === 0) {
      return { currentStreakDays: 0, longestStreakDays: 0 };
    }

    const uniqueDates = Array.from(
      new Set(
        completed
          .map((s) => ProgressPeriodService.toLocalDateString(s.completedAt || s.startedAt))
          .filter(Boolean)
      )
    ).sort().reverse(); // Descending (latest first)

    if (uniqueDates.length === 0) {
      return { currentStreakDays: 0, longestStreakDays: 0 };
    }

    const todayStr = ProgressPeriodService.toLocalDateString(referenceDate);
    const yesterday = new Date(referenceDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = ProgressPeriodService.toLocalDateString(yesterday);

    let currentStreakDays = 0;
    const hasToday = uniqueDates.includes(todayStr);
    const hasYesterday = uniqueDates.includes(yesterdayStr);

    if (hasToday || hasYesterday) {
      currentStreakDays = 1;
      let checkDate = new Date(hasToday ? todayStr : yesterdayStr);

      for (let i = 1; i < uniqueDates.length; i++) {
        checkDate.setDate(checkDate.getDate() - 1);
        const expected = ProgressPeriodService.toLocalDateString(checkDate);
        if (uniqueDates.includes(expected)) {
          currentStreakDays++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak across sorted ascending dates
    const ascendingDates = [...uniqueDates].reverse();
    let longestStreakDays = 1;
    let tempStreak = 1;

    for (let i = 0; i < ascendingDates.length - 1; i++) {
      const d1 = new Date(ascendingDates[i] + 'T00:00:00');
      const d2 = new Date(ascendingDates[i + 1] + 'T00:00:00');
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        longestStreakDays = Math.max(longestStreakDays, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreakDays = Math.max(longestStreakDays, tempStreak, currentStreakDays);

    return {
      currentStreakDays,
      longestStreakDays,
    };
  }

  /**
   * Groups completed sessions into weekly buckets for Frequency Over Time.
   */
  private static computeWeeklyFrequency(sessions: WorkoutSession[]): WeeklyFrequencyPoint[] {
    const weekMap: Record<
      string,
      { count: number; volumeKg: number; durationSeconds: number }
    > = {};

    sessions.forEach((s) => {
      const dateStr = s.completedAt || s.startedAt;
      if (!dateStr) return;
      const weekKey = ProgressPeriodService.getIsoWeekKey(dateStr);

      if (!weekMap[weekKey]) {
        weekMap[weekKey] = { count: 0, volumeKg: 0, durationSeconds: 0 };
      }
      weekMap[weekKey].count += 1;
      weekMap[weekKey].durationSeconds += s.duration || 0;

      (s.exercises || []).forEach((e) => {
        if (e.status === 'skipped') return;
        (e.sets || []).forEach((set) => {
          if (!set.deletedAt && (set.status === 'completed' || !set.status)) {
            const w = set.actualWeight !== undefined ? set.actualWeight : (set.loadValue || 0);
            const r = set.actualReps !== undefined ? set.actualReps : set.targetReps || 0;
            const u = set.weightUnit || 'kg';
            if (w > 0 && r > 0) {
              weekMap[weekKey].volumeKg += (u === 'lbs' ? w * LBS_TO_KG : w) * r;
            }
          }
        });
      });
    });

    return Object.entries(weekMap)
      .sort(([weekA], [weekB]) => weekA.localeCompare(weekB))
      .map(([weekKey, data]) => {
        const parts = weekKey.split('-W');
        const weekNum = parts[1] || '';
        return {
          weekKey,
          weekLabel: `W${weekNum}`,
          count: data.count,
          volumeKg: Math.round(data.volumeKg),
          durationMinutes: Math.round(data.durationSeconds / 60),
        };
      });
  }

  /**
   * Groups completed workouts into day-of-week buckets (Mon through Sun).
   */
  private static computeDayOfWeekDistribution(sessions: WorkoutSession[]): DayOfWeekPoint[] {
    const counts: Record<DayOfWeek, number> = {
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
      Sun: 0,
    };

    sessions.forEach((s) => {
      const dateStr = s.completedAt || s.startedAt;
      if (!dateStr) return;
      const d = new Date(dateStr);
      const dayIndex = (d.getDay() + 6) % 7; // Monday = 0, Sunday = 6
      const dayName = DAYS_OF_WEEK[dayIndex];
      counts[dayName] = (counts[dayName] || 0) + 1;
    });

    const total = sessions.length;
    return DAYS_OF_WEEK.map((day) => ({
      day,
      count: counts[day],
      percentage: total > 0 ? Math.round((counts[day] / total) * 100) : 0,
    }));
  }
}
