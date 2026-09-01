/**
 * Goal Domain Service
 * Dynamically evaluates user fitness goals against Phase 2I ProgressAnalytics and PersonalRecord data.
 * Zero duplicate metric counters.
 */

import { FitnessGoalTarget, WorkoutSession } from '@/types/domain';
import { ProgressAnalyticsService } from './progress-analytics';
import { PersonalRecordService } from './personal-records';

export interface EvaluatedGoalProgress {
  goal: FitnessGoalTarget;
  currentValue: number;
  percentComplete: number;
  remaining: number;
  isAchieved: boolean;
  trendText: string;
}

export class GoalService {
  /**
   * Evaluates dynamic goal progress for a given goal target and session history.
   */
  public static evaluateGoal(
    goal: FitnessGoalTarget,
    allSessions: WorkoutSession[]
  ): EvaluatedGoalProgress {
    let currentValue = 0;
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
        // Uses startValue or targetValue reference
        currentValue = goal.startValue || 0;
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

    let percentComplete = 0;
    let remaining = 0;
    let isAchieved = false;

    if (direction === 'increase') {
      const totalDelta = target - start;
      const progressDelta = currentValue - start;
      if (totalDelta <= 0) {
        percentComplete = currentValue >= target ? 100 : 0;
      } else {
        percentComplete = Math.min(100, Math.max(0, Math.round((progressDelta / totalDelta) * 100)));
      }
      remaining = Math.max(0, target - currentValue);
      isAchieved = currentValue >= target;
    } else if (direction === 'decrease') {
      const totalDelta = start - target;
      const progressDelta = start - currentValue;
      if (totalDelta <= 0) {
        percentComplete = currentValue <= target ? 100 : 0;
      } else {
        percentComplete = Math.min(100, Math.max(0, Math.round((progressDelta / totalDelta) * 100)));
      }
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
    allSessions: WorkoutSession[]
  ): EvaluatedGoalProgress[] {
    return goals.map((g) => this.evaluateGoal(g, allSessions));
  }
}
