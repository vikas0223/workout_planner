/**
 * Personal Records Domain Service
 *
 * Rules:
 * - Pure domain computation derived dynamically from canonical WorkoutSession / WorkoutSet data.
 * - Zero persistent PR stores in Phase 2I.
 * - Estimated 1RM calculation uses the validated Epley formula: weight * (1 + reps / 30) for reps 1-12.
 * - Estimated 1RM is strictly labeled as estimated.
 * - Excludes deleted sets and abandoned sessions.
 */

import { WorkoutSession, WorkoutSet } from '@/types/domain';

export interface ExercisePersonalRecords {
  exerciseId: string;
  exerciseName: string;
  maxWeight?: {
    value: number;
    unit: 'kg' | 'lbs';
    reps: number;
    achievedAt: string;
    sessionId: string;
  };
  maxReps?: {
    reps: number;
    weight: number;
    unit: 'kg' | 'lbs';
    achievedAt: string;
    sessionId: string;
  };
  estimated1RM?: {
    value: number; // in kg or unit
    unit: 'kg' | 'lbs';
    basedOnWeight: number;
    basedOnReps: number;
    achievedAt: string;
    sessionId: string;
    formulaLabel: 'Epley (Estimated)';
  };
  maxSetVolume?: {
    value: number;
    unit: 'kg' | 'lbs';
    weight: number;
    reps: number;
    achievedAt: string;
    sessionId: string;
  };
  totalSetsLogged: number;
  totalRepsLogged: number;
  lastTrainedAt?: string;
}

export interface PRProgressionPoint {
  date: string; // YYYY-MM-DD
  weight: number;
  reps: number;
  estimated1RM: number;
  volume: number;
  unit: 'kg' | 'lbs';
  sessionId: string;
}

export class PersonalRecordService {
  /**
   * Calculates the estimated 1RM using the Epley formula:
   * 1RM = weight * (1 + reps / 30)
   * Only applicable for reps between 1 and 12.
   * For 1 rep, 1RM = weight.
   */
  public static calculateEstimated1RM(weight: number, reps: number): number | null {
    if (weight <= 0 || reps <= 0) return null;
    if (reps === 1) return weight;
    if (reps > 12) {
      // High rep ranges (>12) are unreliable for 1RM estimation
      return null;
    }
    const epley = weight * (1 + reps / 30);
    return Math.round(epley * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Extracts all personal records grouped by exercise across completed sessions.
   */
  public static computePersonalRecords(sessions: WorkoutSession[]): Record<string, ExercisePersonalRecords> {
    const prMap: Record<string, ExercisePersonalRecords> = {};

    // Filter to valid sessions (completed or non-abandoned with completed sets)
    const validSessions = sessions
      .filter((s) => s.status !== 'abandoned')
      .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

    validSessions.forEach((session) => {
      const sessionDate = session.completedAt || session.startedAt || new Date().toISOString();

      (session.exercises || []).forEach((ex) => {
        const exerciseId = ex.exerciseId || ex.id;
        const exerciseName = ex.name || 'Unknown Exercise';

        if (!prMap[exerciseId]) {
          prMap[exerciseId] = {
            exerciseId,
            exerciseName,
            totalSetsLogged: 0,
            totalRepsLogged: 0,
          };
        }

        const currentPR = prMap[exerciseId];
        currentPR.lastTrainedAt = sessionDate;

        const validSets = (ex.sets || []).filter(
          (set) => !set.deletedAt && (set.status === 'completed' || !set.status)
        );

        validSets.forEach((set) => {
          const reps = set.actualReps !== undefined ? set.actualReps : set.targetReps || 0;
          const weight = set.actualWeight !== undefined ? set.actualWeight : (set.loadValue || 0);
          const unit = (set.weightUnit as 'kg' | 'lbs') || 'kg';

          if (reps > 0) {
            currentPR.totalSetsLogged += 1;
            currentPR.totalRepsLogged += reps;
          }

          // 1. Max Weight Record
          if (weight > 0 && reps > 0) {
            if (!currentPR.maxWeight || weight > currentPR.maxWeight.value) {
              currentPR.maxWeight = {
                value: weight,
                unit,
                reps,
                achievedAt: set.completedAt || sessionDate,
                sessionId: session.id,
              };
            }
          }

          // 2. Max Reps Record
          if (reps > 0) {
            if (!currentPR.maxReps || reps > currentPR.maxReps.reps) {
              currentPR.maxReps = {
                reps,
                weight,
                unit,
                achievedAt: set.completedAt || sessionDate,
                sessionId: session.id,
              };
            }
          }

          // 3. Estimated 1RM Record
          if (weight > 0 && reps >= 1 && reps <= 12) {
            const e1rm = this.calculateEstimated1RM(weight, reps);
            if (e1rm !== null) {
              if (!currentPR.estimated1RM || e1rm > currentPR.estimated1RM.value) {
                currentPR.estimated1RM = {
                  value: e1rm,
                  unit,
                  basedOnWeight: weight,
                  basedOnReps: reps,
                  achievedAt: set.completedAt || sessionDate,
                  sessionId: session.id,
                  formulaLabel: 'Epley (Estimated)',
                };
              }
            }
          }

          // 4. Max Set Volume Record
          if (weight > 0 && reps > 0) {
            const setVolume = weight * reps;
            if (!currentPR.maxSetVolume || setVolume > currentPR.maxSetVolume.value) {
              currentPR.maxSetVolume = {
                value: setVolume,
                unit,
                weight,
                reps,
                achievedAt: set.completedAt || sessionDate,
                sessionId: session.id,
              };
            }
          }
        });
      });
    });

    return prMap;
  }

  /**
   * Retrieves chronological progression history for a specific exercise.
   */
  public static getExerciseProgression(
    sessions: WorkoutSession[],
    exerciseId: string
  ): PRProgressionPoint[] {
    const points: PRProgressionPoint[] = [];

    const validSessions = sessions
      .filter((s) => s.status !== 'abandoned')
      .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

    validSessions.forEach((session) => {
      const sessionDate = session.completedAt || session.startedAt;
      const ex = (session.exercises || []).find((e) => e.exerciseId === exerciseId || e.id === exerciseId);
      if (!ex) return;

      const validSets = (ex.sets || []).filter(
        (set) => !set.deletedAt && (set.status === 'completed' || !set.status)
      );

      validSets.forEach((set) => {
        const reps = set.actualReps !== undefined ? set.actualReps : set.targetReps || 0;
        const weight = set.actualWeight !== undefined ? set.actualWeight : (set.loadValue || 0);
        const unit = (set.weightUnit as 'kg' | 'lbs') || 'kg';
        const e1rm = this.calculateEstimated1RM(weight, reps) || weight;

        if (reps > 0) {
          points.push({
            date: new Date(sessionDate).toISOString().split('T')[0],
            weight,
            reps,
            estimated1RM: e1rm,
            volume: weight * reps,
            unit,
            sessionId: session.id,
          });
        }
      });
    });

    return points;
  }
}
