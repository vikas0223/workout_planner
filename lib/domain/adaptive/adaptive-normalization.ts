/**
 * Adaptive Context Normalization Pipeline
 * 
 * Ensures all inputs are deterministically ordered, cleaned, and summarized
 * before pure rule evaluation. Zero system clock calls.
 */

import { WorkoutSession, SessionExercise, WorkoutSet, SetSide } from '@/types/domain';
import {
  AdaptiveContext,
  ExercisePrescription,
  ExercisePerformanceHistory,
} from './adaptive-types';

export class AdaptiveNormalization {
  /**
   * Sorts recent sessions deterministically descending by startedAt, tie-broken by id.
   */
  public static sortSessions(sessions: WorkoutSession[]): WorkoutSession[] {
    return [...sessions].sort((a, b) => {
      const timeDiff = new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.id.localeCompare(b.id);
    });
  }

  /**
   * Extracts clean baseline ExercisePrescription from a staged workout exercise.
   */
  public static extractPrescription(ex: {
    sets?: number;
    reps?: string | number;
    rest?: string | number;
    notes?: string;
  }): ExercisePrescription {
    const rawSets = ex.sets;
    const sets = typeof rawSets === 'number' && rawSets > 0 ? rawSets : 3;

    let reps: string | number = '10';
    if (typeof ex.reps === 'number' && ex.reps > 0) {
      reps = ex.reps;
    } else if (typeof ex.reps === 'string' && ex.reps.trim().length > 0) {
      reps = ex.reps.trim();
    }

    let restSeconds = 60;
    if (typeof ex.rest === 'number' && ex.rest > 0) {
      restSeconds = ex.rest;
    } else if (typeof ex.rest === 'string') {
      const parsed = parseInt(ex.rest, 10);
      if (!isNaN(parsed) && parsed > 0) restSeconds = parsed;
    }

    return {
      sets,
      reps,
      restSeconds,
      notes: ex.notes,
    };
  }

  /**
   * Builds normalized exercise performance history across completed canonical sessions.
   */
  public static buildExerciseHistory(
    exerciseId: string,
    sessions: WorkoutSession[],
    targetRepsNum: number
  ): ExercisePerformanceHistory {
    const sorted = this.sortSessions(sessions);
    const relevantSessions = sorted.filter(
      (s) => s.status === 'completed' && s.exercises.some((e) => e.exerciseId === exerciseId)
    );

    if (relevantSessions.length === 0) {
      return {
        exerciseId,
        sessionsCount: 0,
        recentSets: [],
        consecutiveCleanSessions: 0,
        consecutiveMissedSessions: 0,
        isUnilateral: false,
      };
    }

    let consecutiveCleanSessions = 0;
    let consecutiveMissedSessions = 0;
    let cleanCounting = true;
    let missedCounting = true;

    let totalRpe = 0;
    let rpeCount = 0;

    const allRecentSets: WorkoutSet[] = [];
    let lastWeightKg: number | undefined;
    let lastRepsAchieved: number[] | undefined;

    // Track unilateral sets
    let hasLeftSets = false;
    let hasRightSets = false;
    const leftReps: number[] = [];
    const rightReps: number[] = [];
    const leftWeights: number[] = [];
    const rightWeights: number[] = [];

    for (let i = 0; i < relevantSessions.length; i++) {
      const session = relevantSessions[i];
      const sessionEx = session.exercises.find((e) => e.exerciseId === exerciseId);
      if (!sessionEx) continue;

      const sets = [...sessionEx.sets].sort((a, b) => a.setNumber - b.setNumber);
      if (sets.length === 0) continue;

      if (i === 0) {
        // Last session metrics
        lastRepsAchieved = sets.map((s) => s.actualReps ?? 0);
        const maxW = Math.max(...sets.map((s) => s.actualWeight ?? s.loadValue ?? 0));
        if (maxW > 0) lastWeightKg = maxW;
      }

      let sessionAllClean = true;
      let sessionMissed = false;

      for (const set of sets) {
        allRecentSets.push(set);
        if (set.rpe !== undefined) {
          totalRpe += set.rpe;
          rpeCount++;
        }

        const reps = set.actualReps ?? 0;
        if (reps < targetRepsNum) {
          sessionAllClean = false;
          if (reps <= targetRepsNum * 0.8) {
            sessionMissed = true;
          }
        }
        if (set.rpe !== undefined && set.rpe >= 9.5) {
          sessionMissed = true;
        }

        // Unilateral checks
        if (set.side === 'left') {
          hasLeftSets = true;
          leftReps.push(reps);
          if (set.actualWeight) leftWeights.push(set.actualWeight);
        } else if (set.side === 'right') {
          hasRightSets = true;
          rightReps.push(reps);
          if (set.actualWeight) rightWeights.push(set.actualWeight);
        }
      }

      if (cleanCounting) {
        if (sessionAllClean) {
          consecutiveCleanSessions++;
        } else {
          cleanCounting = false;
        }
      }

      if (missedCounting) {
        if (sessionMissed) {
          consecutiveMissedSessions++;
        } else {
          missedCounting = false;
        }
      }
    }

    const isUnilateral = hasLeftSets && hasRightSets;
    let unilateralAsymmetry: ExercisePerformanceHistory['unilateralAsymmetry'];

    if (isUnilateral && leftReps.length >= 2 && rightReps.length >= 2) {
      const avgLeftReps = leftReps.reduce((a, b) => a + b, 0) / leftReps.length;
      const avgRightReps = rightReps.reduce((a, b) => a + b, 0) / rightReps.length;
      const repDiff = Math.abs(avgLeftReps - avgRightReps);

      const avgLeftW = leftWeights.length > 0 ? leftWeights.reduce((a, b) => a + b, 0) / leftWeights.length : 0;
      const avgRightW = rightWeights.length > 0 ? rightWeights.reduce((a, b) => a + b, 0) / rightWeights.length : 0;
      const loadDiff = Math.abs(avgLeftW - avgRightW);

      if (repDiff >= 2 || (avgLeftW > 0 && avgRightW > 0 && loadDiff / Math.max(avgLeftW, avgRightW) > 0.1)) {
        const weakerSide: SetSide = avgLeftReps < avgRightReps || (avgLeftW > 0 && avgLeftW < avgRightW) ? 'left' : 'right';
        const strongerSide: SetSide = weakerSide === 'left' ? 'right' : 'left';
        unilateralAsymmetry = {
          hasAsymmetry: true,
          weakerSide,
          strongerSide,
          repDifference: Math.round(repDiff * 10) / 10,
          loadDifferenceKg: Math.round(loadDiff * 10) / 10,
        };
      }
    }

    return {
      exerciseId,
      sessionsCount: relevantSessions.length,
      recentSets: allRecentSets,
      lastCompletedSessionDate: relevantSessions[0]?.startedAt,
      consecutiveCleanSessions,
      consecutiveMissedSessions,
      averageRpe: rpeCount > 0 ? Math.round((totalRpe / rpeCount) * 10) / 10 : undefined,
      lastWeightKg,
      lastRepsAchieved,
      isUnilateral,
      unilateralAsymmetry,
    };
  }

  /**
   * Parses rep bounds from a rep string (e.g. "8-12", "10", "5x5").
   */
  public static parseTargetReps(repStr: string | number): { min: number; max: number; primary: number } {
    if (typeof repStr === 'number') {
      return { min: repStr, max: repStr, primary: repStr };
    }
    const str = String(repStr).trim();
    if (str.includes('-')) {
      const parts = str.split('-').map((p) => parseInt(p.trim(), 10)).filter((n) => !isNaN(n));
      if (parts.length >= 2) {
        return { min: parts[0], max: parts[1], primary: parts[1] };
      }
    }
    const parsed = parseInt(str, 10);
    const val = !isNaN(parsed) && parsed > 0 ? parsed : 10;
    return { min: val, max: val, primary: val };
  }
}
