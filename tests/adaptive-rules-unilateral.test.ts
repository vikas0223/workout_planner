import { describe, it, expect } from 'vitest';
import { AdaptiveRules } from '@/lib/domain/adaptive/adaptive-rules';
import { AdaptiveContext, ExercisePrescription } from '@/lib/domain/adaptive/adaptive-types';
import { AdaptiveNormalization } from '@/lib/domain/adaptive/adaptive-normalization';
import { WorkoutSession } from '@/types/domain';

describe('AdaptiveRules — Unilateral Balance (Phase 2L)', () => {
  const createUnilateralSession = (
    id: string,
    dateStr: string,
    exerciseId: string,
    leftReps: number[],
    rightReps: number[]
  ): WorkoutSession => ({
    id,
    userId: 'user_1',
    name: 'Unilateral Workout',
    status: 'completed',
    startedAt: dateStr,
    completedAt: dateStr,
    exercises: [
      {
        id: `se_${id}`,
        sessionId: id,
        exerciseId,
        name: 'Single Leg Bulgarian Split Squat',
        order: 1,
        targetMuscles: ['Quadriceps', 'Glutes'],
        equipment: ['dumbbell'],
        status: 'completed',
        sets: [
          ...leftReps.map((r, i) => ({
            id: `${id}_L_${i + 1}`,
            sessionExerciseId: `se_${id}`,
            setNumber: i + 1,
            type: 'normal' as const,
            side: 'left' as const,
            targetReps: 10,
            actualReps: r,
            status: 'completed' as const,
          })),
          ...rightReps.map((r, i) => ({
            id: `${id}_R_${i + 1}`,
            sessionExerciseId: `se_${id}`,
            setNumber: leftReps.length + i + 1,
            type: 'normal' as const,
            side: 'right' as const,
            targetReps: 10,
            actualReps: r,
            status: 'completed' as const,
          })),
        ],
      },
    ],
  });

  it('detects unilateral asymmetry and anchors prescription to the weaker side', () => {
    // Left: 7, 7 vs Right: 10, 10
    const s1 = createUnilateralSession('s1', '2026-09-01T10:00:00Z', 'bulgarian_split_squat', [7, 7], [10, 10]);

    const history = AdaptiveNormalization.buildExerciseHistory('bulgarian_split_squat', [s1], 10);
    expect(history.isUnilateral).toBe(true);
    expect(history.unilateralAsymmetry?.hasAsymmetry).toBe(true);
    expect(history.unilateralAsymmetry?.weakerSide).toBe('left');

    const prescription: ExercisePrescription = { sets: 3, reps: '10' };
    const context: AdaptiveContext = {
      userId: 'user_1',
      evaluationDate: '2026-09-02T10:00:00Z',
      workoutPlan: { id: 'p1', name: 'Test', goal: 'hypertrophy', difficulty: 'intermediate', duration: 30, targetMuscles: [], equipment: [], exercises: [], createdAt: '' },
      workoutSource: 'generated',
      recentSessions: [s1],
      activeGoals: [],
    };

    const proposal = AdaptiveRules.evaluateUnilateralBalance(
      { id: 'bulgarian_split_squat', name: 'Bulgarian Split Squat', equipment: ['dumbbell'] },
      prescription,
      context,
      history
    );

    expect(proposal).not.toBeNull();
    expect(proposal?.action).toBe('anchor_weaker_side');
    expect(proposal?.rationale).toContain('Anchoring prescription to left side');
  });

  it('ignores single anomalous set when average side difference is below threshold', () => {
    // Left: 9, 10 vs Right: 10, 10 (diff = 0.5 rep, below 2-rep threshold)
    const s1 = createUnilateralSession('s1', '2026-09-01T10:00:00Z', 'bulgarian_split_squat', [9, 10], [10, 10]);

    const history = AdaptiveNormalization.buildExerciseHistory('bulgarian_split_squat', [s1], 10);
    expect(history.unilateralAsymmetry?.hasAsymmetry).toBeFalsy();
  });
});
