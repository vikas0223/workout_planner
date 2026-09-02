import { describe, it, expect } from 'vitest';
import { AdaptiveRules } from '@/lib/domain/adaptive/adaptive-rules';
import { AdaptiveContext, ExercisePrescription } from '@/lib/domain/adaptive/adaptive-types';
import { AdaptiveNormalization } from '@/lib/domain/adaptive/adaptive-normalization';
import { WorkoutSession } from '@/types/domain';

describe('AdaptiveRules — Load Progression & Reduction (Phase 2L)', () => {
  const createWeightedSession = (
    id: string,
    dateStr: string,
    exerciseId: string,
    reps: number[],
    weight: number,
    rpe: number
  ): WorkoutSession => ({
    id,
    userId: 'user_1',
    name: 'Bench Workout',
    status: 'completed',
    startedAt: dateStr,
    completedAt: dateStr,
    exercises: [
      {
        id: `se_${id}`,
        sessionId: id,
        exerciseId,
        name: 'Barbell Bench Press',
        order: 1,
        targetMuscles: ['Chest'],
        equipment: ['barbell'],
        status: 'completed',
        sets: reps.map((r, i) => ({
          id: `${id}_set_${i + 1}`,
          sessionExerciseId: `se_${id}`,
          setNumber: i + 1,
          type: 'normal',
          targetReps: 8,
          actualReps: r,
          actualWeight: weight,
          status: 'completed',
          rpe,
        })),
      },
    ],
  });

  it('proposes +2.5 kg barbell progression when target reps achieved cleanly across 2+ sessions', () => {
    const s1 = createWeightedSession('s1', '2026-09-01T10:00:00Z', 'barbell_bench_press', [8, 8, 8], 80, 7.5);
    const s2 = createWeightedSession('s2', '2026-08-28T10:00:00Z', 'barbell_bench_press', [8, 8, 8], 80, 8.0);

    const history = AdaptiveNormalization.buildExerciseHistory('barbell_bench_press', [s1, s2], 8);
    const prescription: ExercisePrescription = { sets: 3, reps: '8', targetWeightKg: 80 };
    const context: AdaptiveContext = {
      userId: 'user_1',
      evaluationDate: '2026-09-02T10:00:00Z',
      workoutPlan: { id: 'p1', name: 'Test', goal: 'strength', difficulty: 'intermediate', duration: 30, targetMuscles: [], equipment: [], exercises: [], createdAt: '' },
      workoutSource: 'generated',
      recentSessions: [s1, s2],
      activeGoals: [],
    };

    const proposal = AdaptiveRules.evaluateLoadProgression(
      { id: 'barbell_bench_press', name: 'Barbell Bench Press', equipment: ['barbell'] },
      prescription,
      context,
      history
    );

    expect(proposal).not.toBeNull();
    expect(proposal?.action).toBe('increase_load');
    expect(proposal?.adaptedPrescription.targetWeightKg).toBe(82.5);
    expect(proposal?.rationale).toContain('80 kg to 82.5 kg (+2.5 kg)');
  });

  it('proposes +2.0 kg progression on dumbbell movements', () => {
    const s1 = createWeightedSession('s1', '2026-09-01T10:00:00Z', 'db_shoulder_press', [10, 10, 10], 20, 7.5);
    const s2 = createWeightedSession('s2', '2026-08-28T10:00:00Z', 'db_shoulder_press', [10, 10, 10], 20, 7.5);

    const history = AdaptiveNormalization.buildExerciseHistory('db_shoulder_press', [s1, s2], 10);
    const prescription: ExercisePrescription = { sets: 3, reps: '10', targetWeightKg: 20 };
    const context: AdaptiveContext = {
      userId: 'user_1',
      evaluationDate: '2026-09-02T10:00:00Z',
      workoutPlan: { id: 'p1', name: 'Test', goal: 'hypertrophy', difficulty: 'intermediate', duration: 30, targetMuscles: [], equipment: [], exercises: [], createdAt: '' },
      workoutSource: 'generated',
      recentSessions: [s1, s2],
      activeGoals: [],
    };

    const proposal = AdaptiveRules.evaluateLoadProgression(
      { id: 'db_shoulder_press', name: 'Dumbbell Shoulder Press', equipment: ['dumbbell'] },
      prescription,
      context,
      history
    );

    expect(proposal).not.toBeNull();
    expect(proposal?.action).toBe('increase_load');
    expect(proposal?.adaptedPrescription.targetWeightKg).toBe(22);
    expect(proposal?.rationale).toContain('+2 kg');
  });

  it('proposes conservative load reduction with non-medical language after repeated missed reps', () => {
    // 2 consecutive sessions missing reps by >= 20%
    const s1 = createWeightedSession('s1', '2026-09-01T10:00:00Z', 'barbell_bench_press', [8, 5, 4], 90, 9.5);
    const s2 = createWeightedSession('s2', '2026-08-28T10:00:00Z', 'barbell_bench_press', [8, 6, 5], 90, 10);

    const history = AdaptiveNormalization.buildExerciseHistory('barbell_bench_press', [s1, s2], 8);
    const prescription: ExercisePrescription = { sets: 3, reps: '8', targetWeightKg: 90 };
    const context: AdaptiveContext = {
      userId: 'user_1',
      evaluationDate: '2026-09-02T10:00:00Z',
      workoutPlan: { id: 'p1', name: 'Test', goal: 'strength', difficulty: 'intermediate', duration: 30, targetMuscles: [], equipment: [], exercises: [], createdAt: '' },
      workoutSource: 'generated',
      recentSessions: [s1, s2],
      activeGoals: [],
    };

    const proposal = AdaptiveRules.evaluateLoadReduction(
      { id: 'barbell_bench_press', name: 'Barbell Bench Press', equipment: ['barbell'] },
      prescription,
      context,
      history
    );

    expect(proposal).not.toBeNull();
    expect(proposal?.action).toBe('decrease_load');
    expect(proposal?.adaptedPrescription.targetWeightKg).toBeLessThan(90);
    expect(proposal?.rationale).toContain('reinforce clean movement mechanics');
  });
});
