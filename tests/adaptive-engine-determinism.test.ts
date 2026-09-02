import { describe, it, expect } from 'vitest';
import { DeterministicAdaptiveEngine } from '@/lib/domain/adaptive/adaptive-engine';
import { AdaptiveContext } from '@/lib/domain/adaptive/adaptive-types';
import { WorkoutSession, GeneratedWorkout } from '@/types/domain';

describe('DeterministicAdaptiveEngine — Determinism & Invariants (Phase 2L)', () => {
  const mockPlan: GeneratedWorkout = {
    id: 'gw_1',
    name: 'Upper Body Power',
    goal: 'strength',
    difficulty: 'intermediate',
    duration: 45,
    targetMuscles: ['Chest', 'Back'],
    equipment: ['barbell', 'dumbbell'],
    createdAt: '2026-09-01T00:00:00Z',
    exercises: [
      {
        id: 'gwe_1',
        exerciseId: 'barbell_bench_press',
        name: 'Barbell Bench Press',
        sets: 3,
        reps: '8',
        rest: '90',
        order: 1,
        targetMuscles: ['Chest'],
        equipment: ['barbell'],
      },
    ],
  };

  const createMockSession = (id: string, dateStr: string, weight: number): WorkoutSession => ({
    id,
    userId: 'user_test',
    name: 'Upper Body Workout',
    status: 'completed',
    startedAt: dateStr,
    completedAt: dateStr,
    exercises: [
      {
        id: `se_${id}`,
        sessionId: id,
        exerciseId: 'barbell_bench_press',
        name: 'Barbell Bench Press',
        order: 1,
        targetMuscles: ['Chest'],
        equipment: ['barbell'],
        status: 'completed',
        sets: [
          { id: '1', sessionExerciseId: `se_${id}`, setNumber: 1, type: 'normal', targetReps: 8, actualReps: 8, actualWeight: weight, status: 'completed', rpe: 7.5 },
          { id: '2', sessionExerciseId: `se_${id}`, setNumber: 2, type: 'normal', targetReps: 8, actualReps: 8, actualWeight: weight, status: 'completed', rpe: 8 },
          { id: '3', sessionExerciseId: `se_${id}`, setNumber: 3, type: 'normal', targetReps: 8, actualReps: 8, actualWeight: weight, status: 'completed', rpe: 8 },
        ],
      },
    ],
  });

  const session1 = createMockSession('s1', '2026-09-01T10:00:00Z', 80);
  const session2 = createMockSession('s2', '2026-08-28T10:00:00Z', 80);

  it('produces identical decision and fingerprint given identical context and history', () => {
    const context: AdaptiveContext = {
      userId: 'user_test',
      evaluationDate: '2026-09-02T12:00:00Z',
      workoutPlan: mockPlan,
      workoutSource: 'generated',
      sourceEntityId: 'gw_1',
      recentSessions: [session1, session2],
      activeGoals: [],
    };

    const decision1 = DeterministicAdaptiveEngine.evaluateWorkout(context);
    const decision2 = DeterministicAdaptiveEngine.evaluateWorkout(context);

    expect(decision1.fingerprint).toBe(decision2.fingerprint);
    expect(decision1.exerciseProposals).toEqual(decision2.exerciseProposals);
    expect(decision1.hasAdaptations).toBe(true);
    expect(decision1.exerciseProposals[0].adaptedPrescription.targetWeightKg).toBe(82.5);
  });

  it('produces identical fingerprint regardless of caller evaluationDate difference', () => {
    const contextA: AdaptiveContext = {
      userId: 'user_test',
      evaluationDate: '2026-09-02T12:00:00Z',
      workoutPlan: mockPlan,
      workoutSource: 'generated',
      sourceEntityId: 'gw_1',
      recentSessions: [session1, session2],
      activeGoals: [],
    };

    const contextB: AdaptiveContext = {
      userId: 'user_test',
      evaluationDate: '2026-09-05T18:30:00Z', // Different caller evaluation time
      workoutPlan: mockPlan,
      workoutSource: 'generated',
      sourceEntityId: 'gw_1',
      recentSessions: [session1, session2],
      activeGoals: [],
    };

    const decisionA = DeterministicAdaptiveEngine.evaluateWorkout(contextA);
    const decisionB = DeterministicAdaptiveEngine.evaluateWorkout(contextB);

    expect(decisionA.fingerprint).toBe(decisionB.fingerprint);
    expect(decisionA.exerciseProposals).toEqual(decisionB.exerciseProposals);
  });

  it('normalizes session array ordering so session permutations yield identical decision', () => {
    const contextNormal: AdaptiveContext = {
      userId: 'user_test',
      evaluationDate: '2026-09-02T12:00:00Z',
      workoutPlan: mockPlan,
      workoutSource: 'generated',
      sourceEntityId: 'gw_1',
      recentSessions: [session1, session2],
      activeGoals: [],
    };

    const contextPermuted: AdaptiveContext = {
      userId: 'user_test',
      evaluationDate: '2026-09-02T12:00:00Z',
      workoutPlan: mockPlan,
      workoutSource: 'generated',
      sourceEntityId: 'gw_1',
      recentSessions: [session2, session1], // Permuted order
      activeGoals: [],
    };

    const decisionNormal = DeterministicAdaptiveEngine.evaluateWorkout(contextNormal);
    const decisionPermuted = DeterministicAdaptiveEngine.evaluateWorkout(contextPermuted);

    expect(decisionNormal.fingerprint).toBe(decisionPermuted.fingerprint);
    expect(decisionNormal.exerciseProposals).toEqual(decisionPermuted.exerciseProposals);
  });

  it('preserves input workout plan immutability with zero side effects', () => {
    const planCopy = JSON.parse(JSON.stringify(mockPlan));
    const context: AdaptiveContext = {
      userId: 'user_test',
      evaluationDate: '2026-09-02T12:00:00Z',
      workoutPlan: mockPlan,
      workoutSource: 'generated',
      sourceEntityId: 'gw_1',
      recentSessions: [session1, session2],
      activeGoals: [],
    };

    DeterministicAdaptiveEngine.evaluateWorkout(context);
    expect(mockPlan).toEqual(planCopy);
  });
});
