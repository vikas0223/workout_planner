/**
 * Adaptive Prescription Validation Pipeline
 * 
 * Enforces safety invariants, boundary limits, and constraint compliance
 * on all proposed adaptations before emitting decisions.
 */

import {
  AdaptiveContext,
  ExerciseAdaptationProposal,
  PrescriptionValidationResult,
} from './adaptive-types';
import { AdaptiveNormalization } from './adaptive-normalization';

export class AdaptiveValidation {
  /**
   * Validates an adaptation proposal against modality, constraints, and numerical bounds.
   */
  public static validateProposal(
    proposal: ExerciseAdaptationProposal,
    context: AdaptiveContext
  ): PrescriptionValidationResult {
    const errors: string[] = [];
    const adapted = proposal.adaptedPrescription;

    // 1. Set bounds
    if (adapted.sets < 1 || adapted.sets > 6) {
      errors.push(`Invalid adapted sets count: ${adapted.sets}. Must be between 1 and 6.`);
    }

    // 2. Rep bounds
    const repBounds = AdaptiveNormalization.parseTargetReps(adapted.reps);
    if (repBounds.min < 1 || repBounds.max > 30) {
      errors.push(`Invalid adapted reps range: ${adapted.reps}. Must be between 1 and 30.`);
    }

    // 3. Weight bounds
    if (adapted.targetWeightKg !== undefined) {
      if (isNaN(adapted.targetWeightKg) || adapted.targetWeightKg < 0) {
        errors.push(`Invalid target weight: ${adapted.targetWeightKg} kg.`);
      }
      if (adapted.targetWeightKg > 500) {
        errors.push(`Target weight exceeds safety threshold: ${adapted.targetWeightKg} kg.`);
      }
    }

    // 4. Variation check
    if (proposal.action === 'progress_variation' && !adapted.variationExerciseId) {
      errors.push(`Variation progression specified without target variationExerciseId.`);
    }

    // 5. Constraints compliance
    if (context.preferences?.constraints && context.preferences.constraints.length > 0) {
      const exerciseTargetName = (adapted.variationName || proposal.exerciseName || '').toLowerCase();
      for (const constraint of context.preferences.constraints) {
        if (constraint === 'bodyweight_only' && adapted.targetWeightKg && adapted.targetWeightKg > 0) {
          errors.push(`Constraint violation: user has active 'bodyweight_only' constraint.`);
        }
        if (
          constraint === 'no_jump' &&
          (exerciseTargetName.includes('jump') || exerciseTargetName.includes('plyo') || exerciseTargetName.includes('hop'))
        ) {
          errors.push(`Constraint violation: user has active 'no_jump' constraint.`);
        }
        if (
          constraint === 'quiet' &&
          (exerciseTargetName.includes('jump') || exerciseTargetName.includes('slam') || exerciseTargetName.includes('drop'))
        ) {
          errors.push(`Constraint violation: user has active 'quiet' constraint.`);
        }
        if (constraint === 'home_only' && adapted.targetWeightKg && adapted.targetWeightKg > 150) {
          errors.push(`Constraint violation: user has active 'home_only' constraint (load exceeds home training threshold).`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
