/**
 * Adaptive Training Rule Evaluators
 * 
 * Pure deterministic functions evaluating normalized performance history
 * against individual exercise prescriptions. Zero clock calls, zero side effects.
 */

import {
  AdaptiveContext,
  ExercisePrescription,
  ExercisePerformanceHistory,
  ExerciseAdaptationProposal,
} from './adaptive-types';
import { AdaptiveNormalization } from './adaptive-normalization';

// Known canonical progression variations for calisthenics
const CALISTHENICS_VARIATIONS: Record<string, { variationId: string; name: string; baseReps: number }> = {
  pushups: { variationId: 'diamond_pushups', name: 'Diamond Pushups', baseReps: 8 },
  standard_pushup: { variationId: 'diamond_pushup', name: 'Diamond Pushup', baseReps: 8 },
  pullups: { variationId: 'l_sit_pullups', name: 'L-Sit Pullups', baseReps: 6 },
  pull_ups: { variationId: 'l_sit_pullups', name: 'L-Sit Pullups', baseReps: 6 },
  bodyweight_squat: { variationId: 'bulgarian_split_squat', name: 'Bulgarian Split Squat', baseReps: 8 },
  air_squats: { variationId: 'pistol_squat_progression', name: 'Pistol Squat Progression', baseReps: 6 },
  dips: { variationId: 'weighted_dips', name: 'Tempo Controlled Dips', baseReps: 8 },
};

export class AdaptiveRules {
  /**
   * Evaluates equipment-aware load progression for weighted exercises.
   */
  public static evaluateLoadProgression(
    exercise: { id: string; name: string; equipment: string[] },
    prescription: ExercisePrescription,
    context: AdaptiveContext,
    history: ExercisePerformanceHistory
  ): ExerciseAdaptationProposal | null {
    const isWeighted = exercise.equipment.some((eq) =>
      ['barbell', 'dumbbell', 'cable', 'machine', 'kettlebell', 'plates'].includes(eq.toLowerCase())
    );
    if (!isWeighted) return null;

    if (history.sessionsCount < 2 || history.consecutiveCleanSessions < 2) {
      return null;
    }

    const lastWeight = history.lastWeightKg || prescription.targetWeightKg;
    if (!lastWeight || lastWeight <= 0) return null;

    // Equipment-specific increment derivation
    let increment = 2.5;
    const isDumbbell = exercise.equipment.some((eq) => eq.toLowerCase().includes('dumbbell'));
    const isBarbell = exercise.equipment.some((eq) => eq.toLowerCase().includes('barbell'));
    const isMachine = exercise.equipment.some((eq) => eq.toLowerCase().includes('machine') || eq.toLowerCase().includes('cable'));

    if (isBarbell) {
      increment = 2.5;
    } else if (isDumbbell) {
      increment = 2.0; // 1.0kg per dumbbell
    } else if (isMachine) {
      increment = Math.max(2.5, Math.round((lastWeight * 0.05) * 2) / 2);
    }

    const adaptedWeight = Math.round((lastWeight + increment) * 10) / 10;
    const repBounds = AdaptiveNormalization.parseTargetReps(prescription.reps);

    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      dimension: 'load',
      action: 'increase_load',
      originalPrescription: {
        ...prescription,
        targetWeightKg: lastWeight,
      },
      adaptedPrescription: {
        ...prescription,
        targetWeightKg: adaptedWeight,
      },
      ruleId: 'rule_load_progression',
      confidence: history.consecutiveCleanSessions >= 3 ? 'high' : 'medium',
      rationale: `Suggested load progression from ${lastWeight} kg to ${adaptedWeight} kg (+${increment} kg). Completed all ${repBounds.primary} target reps cleanly across ${history.consecutiveCleanSessions} consecutive sessions.`,
      historicalEvidence: {
        observedSessionsCount: history.sessionsCount,
        consecutiveCleanSessions: history.consecutiveCleanSessions,
        consecutiveMissedSessions: 0,
        lastLoggedWeightKg: lastWeight,
        lastLoggedReps: history.lastRepsAchieved,
        averageRpe: history.averageRpe,
      },
    };
  }

  /**
   * Evaluates conservative load reduction for form optimization after repeated missed reps.
   */
  public static evaluateLoadReduction(
    exercise: { id: string; name: string; equipment: string[] },
    prescription: ExercisePrescription,
    context: AdaptiveContext,
    history: ExercisePerformanceHistory
  ): ExerciseAdaptationProposal | null {
    const isWeighted = exercise.equipment.some((eq) =>
      ['barbell', 'dumbbell', 'cable', 'machine', 'kettlebell', 'plates'].includes(eq.toLowerCase())
    );
    if (!isWeighted) return null;

    const hasRepeatedMisses = history.consecutiveMissedSessions >= 2;
    const hasHighRpe = history.averageRpe !== undefined && history.averageRpe >= 9.5;

    if (!hasRepeatedMisses && !hasHighRpe) {
      return null;
    }

    const currentWeight = history.lastWeightKg || prescription.targetWeightKg;
    if (!currentWeight || currentWeight <= 0) return null;

    // 5%–10% conservative reduction
    const reductionAmount = Math.max(2.5, Math.round((currentWeight * 0.075) * 2) / 2);
    const adaptedWeight = Math.max(5, Math.round((currentWeight - reductionAmount) * 10) / 10);

    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      dimension: 'load',
      action: 'decrease_load',
      originalPrescription: {
        ...prescription,
        targetWeightKg: currentWeight,
      },
      adaptedPrescription: {
        ...prescription,
        targetWeightKg: adaptedWeight,
      },
      ruleId: 'rule_load_reduction',
      confidence: 'high',
      rationale: `Load calibrated from ${currentWeight} kg to ${adaptedWeight} kg (-${reductionAmount} kg) to reinforce clean movement mechanics and full range of motion.`,
      historicalEvidence: {
        observedSessionsCount: history.sessionsCount,
        consecutiveCleanSessions: 0,
        consecutiveMissedSessions: history.consecutiveMissedSessions,
        lastLoggedWeightKg: currentWeight,
        lastLoggedReps: history.lastRepsAchieved,
        averageRpe: history.averageRpe,
      },
    };
  }

  /**
   * Evaluates bodyweight rep progression up to 20 reps ceiling.
   */
  public static evaluateBodyweightRepProgression(
    exercise: { id: string; name: string; equipment: string[] },
    prescription: ExercisePrescription,
    context: AdaptiveContext,
    history: ExercisePerformanceHistory
  ): ExerciseAdaptationProposal | null {
    const isBodyweight = exercise.equipment.every((eq) =>
      ['bodyweight', 'pull-up bar', 'pullup bar', 'dip station', 'mat'].includes(eq.toLowerCase())
    );
    if (!isBodyweight) return null;

    if (history.sessionsCount < 2 || history.consecutiveCleanSessions < 2) {
      return null;
    }

    const repBounds = AdaptiveNormalization.parseTargetReps(prescription.reps);
    if (repBounds.max >= 20) {
      // Rep ceiling reached, defer to variation progression
      return null;
    }

    const repDelta = repBounds.max < 10 ? 1 : 2;
    const adaptedReps = Math.min(20, repBounds.max + repDelta);

    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      dimension: 'reps',
      action: 'increase_reps',
      originalPrescription: {
        ...prescription,
        reps: repBounds.max,
      },
      adaptedPrescription: {
        ...prescription,
        reps: adaptedReps,
      },
      ruleId: 'rule_bodyweight_rep_progression',
      confidence: 'high',
      rationale: `Target volume increased from ${repBounds.max} to ${adaptedReps} reps (+${repDelta} reps). Consistently completed target volume with ease over ${history.consecutiveCleanSessions} sessions.`,
      historicalEvidence: {
        observedSessionsCount: history.sessionsCount,
        consecutiveCleanSessions: history.consecutiveCleanSessions,
        consecutiveMissedSessions: 0,
        lastLoggedReps: history.lastRepsAchieved,
        averageRpe: history.averageRpe,
      },
    };
  }

  /**
   * Evaluates bodyweight variation progression when rep ceiling is reached.
   */
  public static evaluateBodyweightVariationProgression(
    exercise: { id: string; name: string; equipment: string[] },
    prescription: ExercisePrescription,
    context: AdaptiveContext,
    history: ExercisePerformanceHistory
  ): ExerciseAdaptationProposal | null {
    const isBodyweight = exercise.equipment.every((eq) =>
      ['bodyweight', 'pull-up bar', 'pullup bar', 'dip station', 'mat'].includes(eq.toLowerCase())
    );
    if (!isBodyweight) return null;

    const repBounds = AdaptiveNormalization.parseTargetReps(prescription.reps);
    if (repBounds.max < 15 || history.consecutiveCleanSessions < 3) {
      return null;
    }

    const normalizedKey = exercise.id.toLowerCase().replace(/[- ]/g, '_');
    const variationMatch = CALISTHENICS_VARIATIONS[normalizedKey];
    if (!variationMatch) return null;

    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      dimension: 'variation',
      action: 'progress_variation',
      originalPrescription: prescription,
      adaptedPrescription: {
        ...prescription,
        reps: variationMatch.baseReps,
        variationExerciseId: variationMatch.variationId,
        variationName: variationMatch.name,
        notes: `Advanced progression from ${exercise.name}`,
      },
      ruleId: 'rule_bodyweight_variation_progression',
      confidence: 'high',
      rationale: `Rep capacity reached on ${exercise.name} (${repBounds.max} reps). Progress to advanced variation: ${variationMatch.name} at ${variationMatch.baseReps} target reps.`,
      historicalEvidence: {
        observedSessionsCount: history.sessionsCount,
        consecutiveCleanSessions: history.consecutiveCleanSessions,
        consecutiveMissedSessions: 0,
        lastLoggedReps: history.lastRepsAchieved,
        averageRpe: history.averageRpe,
      },
    };
  }

  /**
   * Evaluates unilateral balance and anchors prescription to weaker side.
   */
  public static evaluateUnilateralBalance(
    exercise: { id: string; name: string; equipment: string[] },
    prescription: ExercisePrescription,
    context: AdaptiveContext,
    history: ExercisePerformanceHistory
  ): ExerciseAdaptationProposal | null {
    if (!history.isUnilateral || !history.unilateralAsymmetry?.hasAsymmetry) {
      return null;
    }

    const asym = history.unilateralAsymmetry;
    const repBounds = AdaptiveNormalization.parseTargetReps(prescription.reps);

    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      dimension: 'unilateral',
      action: 'anchor_weaker_side',
      originalPrescription: prescription,
      adaptedPrescription: {
        ...prescription,
        reps: Math.max(6, repBounds.primary - Math.round(asym.repDifference)),
        notes: `Anchored to ${asym.weakerSide} side capability to support bilateral balance`,
      },
      ruleId: 'rule_unilateral_balance',
      confidence: 'medium',
      rationale: `Observed ${asym.repDifference} rep difference favoring ${asym.strongerSide} side. Anchoring prescription to ${asym.weakerSide} side to reinforce symmetrical development.`,
      historicalEvidence: {
        observedSessionsCount: history.sessionsCount,
        consecutiveCleanSessions: history.consecutiveCleanSessions,
        consecutiveMissedSessions: 0,
        unilateralAsymmetryDetected: true,
        weakerSide: asym.weakerSide,
        strongerSide: asym.strongerSide,
      },
    };
  }

  /**
   * Evaluates workout fatigue reduction when rolling volume density is high.
   */
  public static evaluateFatigueReduction(
    exercise: { id: string; name: string; equipment: string[] },
    prescription: ExercisePrescription,
    context: AdaptiveContext,
    isSecondary: boolean
  ): ExerciseAdaptationProposal | null {
    if (!isSecondary || prescription.sets <= 2) {
      return null;
    }

    const recentSessions = AdaptiveNormalization.sortSessions(context.recentSessions);
    // Count completed workouts in the last 4 days relative to evaluationDate
    const evalTime = new Date(context.evaluationDate).getTime();
    const fourDaysMs = 4 * 24 * 60 * 60 * 1000;
    const recentDenseWorkouts = recentSessions.filter((s) => {
      if (s.status !== 'completed') return false;
      const sTime = new Date(s.startedAt).getTime();
      return evalTime - sTime <= fourDaysMs && evalTime >= sTime;
    });

    const hasDensityFatigue = recentDenseWorkouts.length >= 3;
    const lastSession = recentSessions[0];
    const hasDifficultyFatigue = lastSession?.feedback?.difficulty === 'too_hard' || (lastSession?.feedback?.rating !== undefined && lastSession.feedback.rating <= 2);

    if (!hasDensityFatigue && !hasDifficultyFatigue) {
      return null;
    }

    const adaptedSets = prescription.sets - 1;

    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      dimension: 'volume_fatigue',
      action: 'decrease_sets',
      originalPrescription: prescription,
      adaptedPrescription: {
        ...prescription,
        sets: adaptedSets,
      },
      ruleId: 'rule_fatigue_volume_reduction',
      confidence: 'high',
      rationale: `Reduced set volume from ${prescription.sets} to ${adaptedSets} sets on ${exercise.name}. High training density detected over recent sessions; calibrated to maintain consistent energy.`,
      historicalEvidence: {
        observedSessionsCount: recentDenseWorkouts.length,
        consecutiveCleanSessions: 0,
        consecutiveMissedSessions: 0,
        recentDifficultyRating: lastSession?.feedback?.difficulty,
      },
    };
  }
}
