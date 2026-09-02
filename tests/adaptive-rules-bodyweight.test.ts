import { describe, it, expect } from 'vitest';
import { AdaptiveRules } from '@/lib/domain/adaptive/adaptive-rules';
import { AdaptiveContext, ExercisePrescription } from '@/lib/domain/adaptive/adaptive-types';
import { AdaptiveNormalization } from '@/lib/domain/adaptive/adaptive-normalization';
import { WorkoutSession } from '@/types/domain';

describe('AdaptiveRules — Bodyweight Reps & Variations (Phase 2L)', () => {
  const createBwSession = (
    id: string,
    dateStr: string,
    exerciseId: string,
    reps: number[]
  ): WorkoutSession => ({
    id,
    userId: 'user_1',
    name: 'Calisthenics Workout',
    status: 'completed',
    startedAt: dateStr,
    completedAt: dateStr,
    exercises: [
      {
        id: `se_${id}`,
        sessionId: id,
        exerciseId,
        name: 'Pushups',
        order: 1,
        targetMuscles: ['Chest', 'Triceps'],
        equipment: ['bodyweight'],
        status: 'completed',
        sets: reps.map((r, i) => ({
          id: `${id}_set_${i + 1}`,
          sessionExerciseId: `se_${id}`,
          setNumber: i + 1,
          type: 'normal',
          targetReps: 10,
          actualReps: r,
          status: 'completed',
        })),
      },
    ],
  });

  it('proposes rep progression (+2 reps) for bodyweight exercises after clean sessions', () => {
    const s1 = createBwSession('s1', '2026-09-01T10:00:00Z', 'pushups', [10, 10, 10]);
    const s2 = createBwSession('s2', '2026-08-28T10:00:00Z', 'pushups', [10, 10, 10]);

    const history = AdaptiveNormalization.buildExerciseHistory('pushups', [s1, s2], 10);
    const prescription: ExercisePrescription = { sets: 3, reps: '10' };
    const context: AdaptiveContext = {
      userId: 'user_1',
      evaluationDate: '2026-09-02T10:00:00Z',
      workoutPlan: { id: 'p1', name: 'Test', goal: 'general_fitness', difficulty: 'beginner', duration: 30, targetMuscles: [], equipment: [], exercises: [], createdAt: '' },
      workoutSource: 'generated',
      recentSessions: [s1, s2],
      activeGoals: [],
    };

    const proposal = AdaptiveRules.evaluateBodyweightRepProgression(
      { id: 'pushups', name: 'Pushups', equipment: ['bodyweight'] },
      prescription,
      context,
      history
    );

    expect(proposal).not.toBeNull();
    expect(proposal?.action).toBe('increase_reps');
    expect(proposal?.adaptedPrescription.reps).toBe(12);
  });

  it('proposes progression to advanced variation when rep ceiling is reached', () => {
    // 3 clean sessions at 18 reps
    const s1 = createBwSession('s1', '2026-09-01T10:00:00Z', 'pushups', [18, 18, 18]);
    const s2 = createBwSession('s2', '2026-08-28T10:00:00Z', 'pushups', [18, 18, 18]);
    const s3 = createBwSession('s3', '2026-08-25T10:00:00Z', 'pushups', [18, 18, 18]);

    const history = AdaptiveNormalization.buildExerciseHistory('pushups', [s1, s2, s3], 18);
    const prescription: ExercisePrescription = { sets: 3, reps: '18' };
    const context: AdaptiveContext = {
      userId: 'user_1',
      evaluationDate: '2026-09-02T10:00:00Z',
      workoutPlan: { id: 'p1', name: 'Test', goal: 'hypertrophy', difficulty: 'intermediate', duration: 30, targetMuscles: [], equipment: [], exercises: [], createdAt: '' },
      workoutSource: 'generated',
      recentSessions: [s1, s2, s3],
      activeGoals: [],
    };

    const proposal = AdaptiveRules.evaluateBodyweightVariationProgression(
      { id: 'pushups', name: 'Pushups', equipment: ['bodyweight'] },
      prescription,
      context,
      history
    );

    expect(proposal).not.toBeNull();
    expect(proposal?.action).toBe('progress_variation');
    expect(proposal?.adaptedPrescription.variationExerciseId).toBe('diamond_pushups');
    expect(proposal?.adaptedPrescription.reps).toBe(8); // reset rep scheme on advanced variation
  });
});
