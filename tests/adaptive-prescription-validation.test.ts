import { describe, it, expect } from 'vitest';
import { AdaptiveValidation } from '@/lib/domain/adaptive/adaptive-validation';
import { ExerciseAdaptationProposal, AdaptiveContext } from '@/lib/domain/adaptive/adaptive-types';

describe('AdaptiveValidation — Safety & Boundary Invariants (Phase 2L)', () => {
  const mockContext: AdaptiveContext = {
    userId: 'user_1',
    evaluationDate: '2026-09-02T10:00:00Z',
    workoutPlan: { id: 'p1', name: 'Test', goal: 'strength', difficulty: 'intermediate', duration: 30, targetMuscles: [], equipment: [], exercises: [], createdAt: '' },
    workoutSource: 'generated',
    recentSessions: [],
    activeGoals: [],
  };

  const createProposal = (adaptedSets: number, adaptedReps: string | number, adaptedWeight?: number): ExerciseAdaptationProposal => ({
    exerciseId: 'barbell_bench_press',
    exerciseName: 'Barbell Bench Press',
    dimension: 'load',
    action: 'increase_load',
    originalPrescription: { sets: 3, reps: '8', targetWeightKg: 80 },
    adaptedPrescription: { sets: adaptedSets, reps: adaptedReps, targetWeightKg: adaptedWeight },
    ruleId: 'rule_load_progression',
    confidence: 'high',
    rationale: 'Test rationale',
    historicalEvidence: {
      observedSessionsCount: 2,
      consecutiveCleanSessions: 2,
      consecutiveMissedSessions: 0,
    },
  });

  it('validates normal prescription within bounds', () => {
    const proposal = createProposal(3, 8, 82.5);
    const result = AdaptiveValidation.validateProposal(proposal, mockContext);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects invalid set counts outside 1-6 range', () => {
    const proposalZeroSets = createProposal(0, 8, 80);
    const resultZero = AdaptiveValidation.validateProposal(proposalZeroSets, mockContext);
    expect(resultZero.isValid).toBe(false);
    expect(resultZero.errors[0]).toContain('Must be between 1 and 6');

    const proposalSevenSets = createProposal(7, 8, 80);
    const resultSeven = AdaptiveValidation.validateProposal(proposalSevenSets, mockContext);
    expect(resultSeven.isValid).toBe(false);
  });

  it('rejects invalid rep ranges outside 1-30', () => {
    const proposalZeroReps = createProposal(3, 0, 80);
    const resultZero = AdaptiveValidation.validateProposal(proposalZeroReps, mockContext);
    expect(resultZero.isValid).toBe(false);

    const proposalExcessiveReps = createProposal(3, 35, 80);
    const resultExcessive = AdaptiveValidation.validateProposal(proposalExcessiveReps, mockContext);
    expect(resultExcessive.isValid).toBe(false);
  });

  it('rejects weighted load proposal if user has active bodyweight_only constraint', () => {
    const constrainedContext: AdaptiveContext = {
      ...mockContext,
      preferences: {
        constraints: ['bodyweight_only'],
      },
    };

    const weightedProposal = createProposal(3, 10, 20);
    const result = AdaptiveValidation.validateProposal(weightedProposal, constrainedContext);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("user has active 'bodyweight_only' constraint");
  });
});
