/**
 * Challenge Domain Service
 * Dynamically evaluates community/platform challenge progress against canonical sessions.
 * ChallengeProgress stores user participation state; actual metrics are derived on-the-fly.
 */

import { Challenge, ChallengeProgress, WorkoutSession } from '@/types/domain';
import { ProgressAnalyticsService } from './progress-analytics';
import { PersonalRecordService } from './personal-records';

export interface EvaluatedChallengeProgress {
  challenge: Challenge;
  participation?: ChallengeProgress;
  isJoined: boolean;
  currentValue: number;
  targetValue: number;
  percentComplete: number;
  remaining: number;
  isCompleted: boolean;
  daysRemaining: number;
  statusLabel: string;
  progressText?: string;
}

export class ChallengeService {
  /**
   * Evaluates dynamic progress for a specific challenge and user participation state.
   * Challenge periods are evaluated using the user's current local calendar timezone (Phase 2I convention).
   * For participants, the effective window derives from joinedAt + durationDays when configured.
   */
  public static evaluateChallenge(
    challenge: Challenge,
    participation: ChallengeProgress | undefined,
    allSessions: WorkoutSession[]
  ): EvaluatedChallengeProgress {
    const isJoined = Boolean(participation && participation.status === 'active');
    const joinedAtStr = participation?.joinedAt || challenge.startDate;

    // Convert start to beginning of local day (00:00:00.000)
    const startDateObj = new Date(joinedAtStr);
    const windowStartMs = new Date(
      startDateObj.getFullYear(),
      startDateObj.getMonth(),
      startDateObj.getDate(),
      0, 0, 0, 0
    ).getTime();

    // Derive end date: if participant has joined and challenge has durationDays, use joinedAt + durationDays (calendar-day arithmetic)
    let endDateObj: Date;
    if (participation?.joinedAt && challenge.durationDays) {
      const jDate = new Date(participation.joinedAt);
      endDateObj = new Date(jDate);
      endDateObj.setDate(jDate.getDate() + challenge.durationDays);
    } else {
      endDateObj = new Date(challenge.endDate);
    }

    const windowEndMs = new Date(
      endDateObj.getFullYear(),
      endDateObj.getMonth(),
      endDateObj.getDate(),
      23, 59, 59, 999
    ).getTime();

    // Filter completed sessions during challenge window starting from user join date
    const relevantSessions = allSessions.filter((s) => {
      if (s.status !== 'completed') return false;
      const sDate = s.completedAt || s.startedAt;
      if (!sDate) return false;
      const t = new Date(sDate).getTime();
      return t >= windowStartMs && t <= windowEndMs;
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
        const prMap = PersonalRecordService.computePersonalRecords(relevantSessions);
        currentValue = Object.keys(prMap).length;
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
    const remaining = Math.max(0, target - currentValue);

    const now = new Date().getTime();
    const end = windowEndMs;
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
      targetValue: target,
      percentComplete,
      remaining,
      isCompleted,
      daysRemaining,
      statusLabel,
      progressText: statusLabel,
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
