/**
 * Goal Domain Service
 * Dynamically evaluates user fitness goals against Phase 2I ProgressAnalytics and PersonalRecord data.
 * Zero duplicate metric counters.
 */

import { FitnessGoalTarget, WorkoutSession, BodyMetricEntry } from '@/types/domain';
import { ProgressAnalyticsService } from './progress-analytics';
import { PersonalRecordService } from './personal-records';

export interface EvaluatedGoalProgress {
  goal: FitnessGoalTarget;
  currentValue: number | null;
  percentComplete: number;
  remaining: number;
  isAchieved: boolean;
  trendText: string;
  requiresMetricLog?: boolean;
}

export class GoalService {
  /**
   * Evaluates dynamic goal progress for a given goal target, session history, and body metrics.
   */
  public static evaluateGoal(
    goal: FitnessGoalTarget,
    allSessions: WorkoutSession[],
    bodyMetrics?: BodyMetricEntry[]
  ): EvaluatedGoalProgress {
    let currentValue: number | null = 0;
    let requiresMetricLog = false;
    const completedSessions = allSessions.filter((s) => s.status === 'completed');

    // Filter sessions relevant to goal start date if set
    const goalSessions = goal.startDate
      ? completedSessions.filter((s) => {
          const sDate = s.completedAt || s.startedAt;
          return sDate && new Date(sDate).getTime() >= new Date(goal.startDate).getTime();
        })
      : completedSessions;

    switch (goal.type) {
      case 'workouts_completed': {
        currentValue = goalSessions.length;
        break;
      }
      case 'volume': {
        const metrics = ProgressAnalyticsService.computeMetrics(goalSessions, 'all');
        currentValue = Math.round(metrics.totalVolumeKg);
        break;
      }
      case 'frequency': {
        // Average weekly workouts since goal start
        const metrics = ProgressAnalyticsService.computeMetrics(allSessions, '30d');
        currentValue = metrics.weeklyCompletedCount;
        break;
      }
      case 'strength':
      case 'personal_record': {
        if (goal.exerciseId) {
          const prMap = PersonalRecordService.computePersonalRecords(allSessions);
          const prs = prMap[goal.exerciseId];
          currentValue = prs?.maxWeight?.value || prs?.estimated1RM?.value || 0;
        }
        break;
      }
      case 'weight':
      case 'body_metric': {
        if (bodyMetrics && bodyMetrics.length > 0) {
          // Sort by date desc to find newest entry with a usable recorded weight
          const sorted = [...bodyMetrics].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          const validEntry = sorted.find(
            (entry) => entry.weight !== null && entry.weight !== undefined && !isNaN(entry.weight)
          );
          if (validEntry && validEntry.weight !== undefined) {
            currentValue = validEntry.weight;
          } else if (goal.startValue !== undefined) {
            currentValue = goal.startValue;
          } else {
            currentValue = null;
            requiresMetricLog = true;
          }
        } else if (goal.startValue !== undefined) {
          // If startValue provided but no new log entries, prompt user to add current weight
          currentValue = goal.startValue;
        } else {
          currentValue = null;
          requiresMetricLog = true;
        }
        break;
      }
      default: {
        currentValue = goalSessions.length;
        break;
      }
    }

    const start = goal.startValue !== undefined ? goal.startValue : 0;
    const target = goal.targetValue;
    const direction = goal.direction || 'increase';

    if (currentValue === null || requiresMetricLog) {
      return {
        goal,
        currentValue: null,
        percentComplete: 0,
        remaining: target,
        isAchieved: false,
        trendText: 'Add your current weight',
        requiresMetricLog: true,
      };
    }

    let percentComplete = 0;
    let remaining = 0;
    let isAchieved = false;

    if (direction === 'increase') {
      const delta = target - start;
      const progress = currentValue - start;
      percentComplete = delta > 0 ? Math.min(100, Math.max(0, Math.round((progress / delta) * 100))) : 0;
      remaining = Math.max(0, target - currentValue);
      isAchieved = currentValue >= target;
    } else if (direction === 'decrease') {
      const delta = start - target;
      const progress = start - currentValue;
      percentComplete = delta > 0 ? Math.min(100, Math.max(0, Math.round((progress / delta) * 100))) : 0;
      remaining = Math.max(0, currentValue - target);
      isAchieved = currentValue <= target;
    } else {
      // maintain
      const diff = Math.abs(currentValue - target);
      const tolerance = target * 0.05; // 5% tolerance
      isAchieved = diff <= tolerance;
      percentComplete = isAchieved ? 100 : Math.max(0, Math.round((1 - diff / target) * 100));
      remaining = diff;
    }

    let trendText = `${currentValue} / ${target} ${goal.unit}`;
    if (isAchieved) {
      trendText = `Goal Achieved! (${currentValue} ${goal.unit})`;
    } else if (remaining > 0) {
      trendText = `${remaining} ${goal.unit} remaining`;
    }

    return {
      goal,
      currentValue,
      percentComplete,
      remaining,
      isAchieved,
      trendText,
    };
  }

  /**
   * Batch evaluates multiple goals.
   */
  public static evaluateAllGoals(
    goals: FitnessGoalTarget[],
    allSessions: WorkoutSession[],
    bodyMetrics?: BodyMetricEntry[]
  ): EvaluatedGoalProgress[] {
    return goals.map((g) => this.evaluateGoal(g, allSessions, bodyMetrics));
  }
}
