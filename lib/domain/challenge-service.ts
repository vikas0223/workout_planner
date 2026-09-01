/**
 * Challenge Domain Service
 * Dynamically evaluates community/platform challenge progress against canonical sessions.
 * ChallengeProgress stores user participation state; actual metrics are derived on-the-fly.
 */

import { Challenge, ChallengeProgress, WorkoutSession } from '@/types/domain';
import { ProgressAnalyticsService } from './progress-analytics';

export interface EvaluatedChallengeProgress {
  challenge: Challenge;
  participation?: ChallengeProgress;
  isJoined: boolean;
  currentValue: number;
  percentComplete: number;
  isCompleted: boolean;
  daysRemaining: number;
  statusLabel: string;
}

export class ChallengeService {
  /**
   * Evaluates dynamic progress for a specific challenge and user participation state.
   */
  public static evaluateChallenge(
    challenge: Challenge,
    participation: ChallengeProgress | undefined,
    allSessions: WorkoutSession[]
  ): EvaluatedChallengeProgress {
    const isJoined = Boolean(participation && participation.status === 'active');
    const joinedAt = participation?.joinedAt || challenge.startDate;

    // Filter completed sessions during challenge window starting from user join date
    const relevantSessions = allSessions.filter((s) => {
      if (s.status !== 'completed') return false;
      const sDate = s.completedAt || s.startedAt;
      if (!sDate) return false;
      const t = new Date(sDate).getTime();
      return (
        t >= new Date(joinedAt).getTime() &&
        t <= new Date(challenge.endDate).getTime()
      );
    });

    let currentValue = 0;

    switch (challenge.type) {
      case 'workout_count': {
        currentValue = relevantSessions.length;
        break;
      }
      case 'set_count': {
        const metrics = ProgressAnalyticsService.computeMetrics(relevantSessions, 'all');
        currentValue = metrics.totalPerformedSets;
        break;
      }
      case 'volume': {
        const metrics = ProgressAnalyticsService.computeMetrics(relevantSessions, 'all');
        currentValue = Math.round(metrics.totalVolumeKg);
        break;
      }
      case 'streak': {
        const metrics = ProgressAnalyticsService.computeMetrics(relevantSessions, 'all');
        currentValue = metrics.longestStreakDays;
        break;
      }
      case 'frequency': {
        const metrics = ProgressAnalyticsService.computeMetrics(relevantSessions, '30d');
        currentValue = metrics.weeklyCompletedCount;
        break;
      }
      case 'personal_record': {
        currentValue = relevantSessions.length > 0 ? 1 : 0;
        break;
      }
      default: {
        currentValue = relevantSessions.length;
        break;
      }
    }

    const target = challenge.targetValue;
    const isCompleted = currentValue >= target;
    const percentComplete =
      target > 0 ? Math.min(100, Math.round((currentValue / target) * 100)) : 0;

    const now = new Date().getTime();
    const end = new Date(challenge.endDate).getTime();
    const msRemaining = Math.max(0, end - now);
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

    let statusLabel = isJoined ? `${currentValue} / ${target} ${challenge.unit}` : 'Not Joined';
    if (isCompleted) {
      statusLabel = `Completed! (${currentValue} ${challenge.unit})`;
    }

    return {
      challenge,
      participation,
      isJoined,
      currentValue,
      percentComplete,
      isCompleted,
      daysRemaining,
      statusLabel,
    };
  }

  /**
   * Batch evaluates challenges against user participations.
   */
  public static evaluateAllChallenges(
    challenges: Challenge[],
    participations: ChallengeProgress[],
    allSessions: WorkoutSession[]
  ): EvaluatedChallengeProgress[] {
    const partMap = new Map<string, ChallengeProgress>();
    for (const p of participations) {
      partMap.set(p.challengeId, p);
    }

    return challenges.map((c) => this.evaluateChallenge(c, partMap.get(c.id), allSessions));
  }
}
