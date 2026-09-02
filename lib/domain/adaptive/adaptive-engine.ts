/**
 * Pure Deterministic Adaptive Training Engine
 * 
 * Pipeline:
 * Canonical History -> Normalize Context -> Rule Evaluation -> Conflict Resolution ->
 * Prescription Validation -> Deterministic Decision Output.
 * 
 * Zero clock calls, zero network/browser I/O, zero random values.
 */

import {
  ADAPTIVE_ENGINE_VERSION,
  AdaptiveContext,
  ExercisePrescription,
  ExerciseAdaptationProposal,
  WorkoutAdaptationDecision,
} from './adaptive-types';
import { AdaptiveNormalization } from './adaptive-normalization';
import { AdaptiveRules } from './adaptive-rules';
import { AdaptiveValidation } from './adaptive-validation';
import { DifficultyService } from '@/lib/domain/difficulty-adjustment';

export class DeterministicAdaptiveEngine {
  /**
   * Generates a deterministic adaptation decision for a staged workout plan.
   */
  public static evaluateWorkout(context: AdaptiveContext): WorkoutAdaptationDecision {
    const rawExercises = context.workoutPlan.exercises || [];
    const normalizedSessions = AdaptiveNormalization.sortSessions(context.recentSessions);

    // 1. Evaluate workout-level difficulty calibration
    const overallDifficulty = this.evaluateOverallDifficulty(context, normalizedSessions);

    // 2. Check global fatigue / deload state
    const isFatigueActive = this.detectGlobalFatigue(context, normalizedSessions);

    const validProposals: ExerciseAdaptationProposal[] = [];

    // 3. Process each exercise in the staged workout
    for (let index = 0; index < rawExercises.length; index++) {
      const ex = rawExercises[index] as any;
      const exerciseId = ex.exerciseId || ex.id;
      const exerciseName = ex.name || 'Exercise';
      const equipment = ex.equipment || [];
      const isSecondary = index > 0; // First exercise is treated as primary compound

      const baselinePrescription = AdaptiveNormalization.extractPrescription(ex);
      const repBounds = AdaptiveNormalization.parseTargetReps(baselinePrescription.reps);

      const history = AdaptiveNormalization.buildExerciseHistory(
        exerciseId,
        normalizedSessions,
        repBounds.primary
      );

      // Collect raw candidate proposals for this exercise
      const candidates: ExerciseAdaptationProposal[] = [];

      // A. Load Progression & Reduction
      const loadProg = AdaptiveRules.evaluateLoadProgression(
        { id: exerciseId, name: exerciseName, equipment },
        baselinePrescription,
        context,
        history
      );
      if (loadProg) candidates.push(loadProg);

      const loadRed = AdaptiveRules.evaluateLoadReduction(
        { id: exerciseId, name: exerciseName, equipment },
        baselinePrescription,
        context,
        history
      );
      if (loadRed) candidates.push(loadRed);

      // B. Bodyweight Reps & Variations
      const bwReps = AdaptiveRules.evaluateBodyweightRepProgression(
        { id: exerciseId, name: exerciseName, equipment },
        baselinePrescription,
        context,
        history
      );
      if (bwReps) candidates.push(bwReps);

      const bwVar = AdaptiveRules.evaluateBodyweightVariationProgression(
        { id: exerciseId, name: exerciseName, equipment },
        baselinePrescription,
        context,
        history
      );
      if (bwVar) candidates.push(bwVar);

      // C. Unilateral Asymmetry
      const unilateral = AdaptiveRules.evaluateUnilateralBalance(
        { id: exerciseId, name: exerciseName, equipment },
        baselinePrescription,
        context,
        history
      );
      if (unilateral) candidates.push(unilateral);

      // D. Fatigue Volume Reduction
      const fatigueVol = AdaptiveRules.evaluateFatigueReduction(
        { id: exerciseId, name: exerciseName, equipment },
        baselinePrescription,
        context,
        isSecondary
      );
      if (fatigueVol) candidates.push(fatigueVol);

      // 4. Resolve conflicts & precedence for this exercise
      const resolvedProposal = this.resolveConflict(candidates, isFatigueActive);

      // 5. Validate proposed prescription
      if (resolvedProposal) {
        const validation = AdaptiveValidation.validateProposal(resolvedProposal, context);
        if (validation.isValid) {
          validProposals.push(resolvedProposal);
        }
      }
    }

    // 6. Compute deterministic hash fingerprint over normalized deterministic inputs
    const fingerprint = this.computeDeterministicFingerprint(
      context,
      normalizedSessions,
      validProposals
    );

    // 7. Generate concise factual summary text
    const summaryText = this.generateSummaryText(validProposals, overallDifficulty);

    return {
      id: fingerprint,
      fingerprint,
      engineVersion: ADAPTIVE_ENGINE_VERSION,
      workoutSource: context.workoutSource,
      sourceEntityId: context.sourceEntityId,
      overallDifficultyAdjustment: overallDifficulty,
      exerciseProposals: validProposals,
      hasAdaptations: validProposals.length > 0 || !!overallDifficulty,
      summaryText,
      evaluationTimestamp: context.evaluationDate,
    };
  }

  /**
   * Resolves conflicts among multiple candidate proposals for an exercise based on strict precedence hierarchy:
   * Tier 1: Hard constraints (handled in validation)
   * Tier 2: Fatigue / Deload guard (fatigue suppresses load increases; fatigue reduction wins)
   * Tier 3: Performance Regression guard (repeated missed reps / load reduction wins)
   * Tier 4: Variation progression (takes precedence over rep progression)
   * Tier 5: Modality load / rep progression
   * Tier 6: Unilateral balance
   */
  private static resolveConflict(
    candidates: ExerciseAdaptationProposal[],
    isFatigueActive: boolean
  ): ExerciseAdaptationProposal | null {
    if (candidates.length === 0) return null;
    if (candidates.length === 1) {
      if (isFatigueActive && candidates[0].action === 'increase_load') {
        return null; // Suppressed by fatigue
      }
      return candidates[0];
    }

    // 1. If fatigue volume reduction exists, it suppresses load increases
    const fatigueProp = candidates.find((c) => c.action === 'decrease_sets');
    if (fatigueProp) {
      return fatigueProp;
    }

    // 2. Load reduction (form optimization) overrides progression
    const loadRed = candidates.find((c) => c.action === 'decrease_load');
    if (loadRed) {
      return loadRed;
    }

    // 3. If global fatigue is active, reject load increases
    if (isFatigueActive) {
      const nonLoadIncrease = candidates.filter((c) => c.action !== 'increase_load');
      if (nonLoadIncrease.length > 0) return nonLoadIncrease[0];
      return null;
    }

    // 4. Variation progression overrides standard rep progression
    const varProg = candidates.find((c) => c.action === 'progress_variation');
    if (varProg) {
      return varProg;
    }

    // 5. Unilateral balance overrides standard progression
    const unilateral = candidates.find((c) => c.action === 'anchor_weaker_side');
    if (unilateral) {
      return unilateral;
    }

    // 6. Default to first valid progression
    return candidates[0];
  }

  /**
   * Detects if global fatigue or consecutive training density is elevated.
   */
  private static detectGlobalFatigue(
    context: AdaptiveContext,
    sortedSessions: AdaptiveContext['recentSessions']
  ): boolean {
    const evalTime = new Date(context.evaluationDate).getTime();
    const fourDaysMs = 4 * 24 * 60 * 60 * 1000;
    const denseCount = sortedSessions.filter((s) => {
      if (s.status !== 'completed') return false;
      const sTime = new Date(s.startedAt).getTime();
      return evalTime - sTime <= fourDaysMs && evalTime >= sTime;
    }).length;

    if (denseCount >= 3) return true;

    const lastSession = sortedSessions[0];
    if (lastSession?.feedback?.difficulty === 'too_hard') return true;
    if (lastSession?.feedback?.rating !== undefined && lastSession.feedback.rating <= 2) return true;

    return false;
  }

  /**
   * Evaluates session-level difficulty adjustment using DifficultyService.
   */
  private static evaluateOverallDifficulty(
    context: AdaptiveContext,
    sortedSessions: AdaptiveContext['recentSessions']
  ): WorkoutAdaptationDecision['overallDifficultyAdjustment'] {
    if (sortedSessions.length < 3) return undefined;

    const completedRefs = sortedSessions.map((s) => ({
      workoutPlanId: s.workoutPlanId || s.id,
      name: s.name,
      date: s.startedAt,
      difficulty: 'intermediate',
    }));

    const ratingRefs = sortedSessions
      .filter((s) => s.feedback)
      .map((s) => ({
        workoutPlanId: s.workoutPlanId || s.id,
        rating: s.feedback!.rating,
        feedback: s.feedback!.perceivedDifficulty || s.feedback!.difficulty || '',
        timestamp: new Date(s.startedAt).getTime(),
      }));

    const diffResult = DifficultyService.analyzeDifficultyAdjustment(completedRefs, ratingRefs);
    const originalDiff = ('difficulty' in context.workoutPlan ? context.workoutPlan.difficulty : 'intermediate') || 'intermediate';

    if (diffResult.difficulty !== originalDiff) {
      return {
        originalDifficulty: String(originalDiff),
        suggestedDifficulty: diffResult.difficulty,
        reason: diffResult.reason,
      };
    }

    return undefined;
  }

  /**
   * Computes deterministic FNV-1a 32-bit hex hash.
   * EXCLUDES evaluationTimestamp and UI state.
   */
  private static computeDeterministicFingerprint(
    context: AdaptiveContext,
    sortedSessions: AdaptiveContext['recentSessions'],
    proposals: ExerciseAdaptationProposal[]
  ): string {
    const sessionIds = sortedSessions.slice(0, 5).map((s) => s.id).join(',');
    const proposalSignatures = proposals
      .map((p) => `${p.exerciseId}:${p.dimension}:${p.action}:${JSON.stringify(p.adaptedPrescription)}`)
      .sort()
      .join('|');

    const raw = `${ADAPTIVE_ENGINE_VERSION}:${context.workoutSource}:${context.sourceEntityId || 'none'}:${sessionIds}:${proposalSignatures}`;

    // FNV-1a 32-bit hash
    let hash = 0x811c9dc5;
    for (let i = 0; i < raw.length; i++) {
      hash ^= raw.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    const hex = (hash >>> 0).toString(16).padStart(8, '0');
    return `adapt_${hex}`;
  }

  /**
   * Formulates factual summary.
   */
  private static generateSummaryText(
    proposals: ExerciseAdaptationProposal[],
    difficultyAdj?: WorkoutAdaptationDecision['overallDifficultyAdjustment']
  ): string {
    if (proposals.length === 0 && !difficultyAdj) {
      return 'Workout verified with current training history. No adaptations required.';
    }

    const parts: string[] = [];
    if (proposals.length > 0) {
      parts.push(`${proposals.length} exercise prescription${proposals.length > 1 ? 's' : ''} calibrated`);
    }
    if (difficultyAdj) {
      parts.push(`overall difficulty adjusted to ${difficultyAdj.suggestedDifficulty}`);
    }

    return `Adaptive calibrations suggested: ${parts.join(', ')}.`;
  }
}
