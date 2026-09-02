import { describe, it, expect } from 'vitest';
import { DeterministicAdaptiveEngine } from '@/lib/domain/adaptive/adaptive-engine';
import { AdaptiveContext } from '@/lib/domain/adaptive/adaptive-types';
import { GeneratedWorkout } from '@/types/domain';

describe('DeterministicAdaptiveEngine — Insufficient Data & Cold Start (Phase 2L)', () => {
  const mockPlan: GeneratedWorkout = {
    id: 'gw_1',
    name: 'Foundation Routine',
    goal: 'general_fitness',
    difficulty: 'beginner',
    duration: 30,
    targetMuscles: ['Full Body'],
    equipment: ['bodyweight'],
    createdAt: '2026-09-01T00:00:00Z',
    exercises: [
      {
        id: 'gwe_1',
        exerciseId: 'bodyweight_squat',
        name: 'Bodyweight Squat',
        sets: 3,
        reps: '10',
        rest: '60',
        order: 1,
        targetMuscles: ['Quadriceps'],
        equipment: ['bodyweight'],
      },
    ],
  };

  it('emits zero adaptations when history is completely empty', () => {
    const context: AdaptiveContext = {
      userId: 'guest_new_user',
      evaluationDate: '2026-09-02T10:00:00Z',
      workoutPlan: mockPlan,
      workoutSource: 'generated',
      recentSessions: [],
      activeGoals: [],
    };

    const decision = DeterministicAdaptiveEngine.evaluateWorkout(context);
    expect(decision.hasAdaptations).toBe(false);
    expect(decision.exerciseProposals).toHaveLength(0);
    expect(decision.summaryText).toContain('No adaptations required');
  });

  it('does not propose premature progression when only 1 prior session exists', () => {
    const context: AdaptiveContext = {
      userId: 'guest_user',
      evaluationDate: '2026-09-02T10:00:00Z',
      workoutPlan: mockPlan,
      workoutSource: 'generated',
      recentSessions: [
        {
          id: 's1',
          userId: 'guest_user',
          name: 'First Workout',
          status: 'completed',
          startedAt: '2026-09-01T10:00:00Z',
          completedAt: '2026-09-01T10:30:00Z',
          exercises: [
            {
              id: 'se_1',
              sessionId: 's1',
              exerciseId: 'bodyweight_squat',
              name: 'Bodyweight Squat',
              order: 1,
              targetMuscles: ['Quadriceps'],
              equipment: ['bodyweight'],
              status: 'completed',
              sets: [
                { id: '1', sessionExerciseId: 'se_1', setNumber: 1, type: 'normal', targetReps: 10, actualReps: 10, status: 'completed' },
              ],
            },
          ],
        },
      ],
      activeGoals: [],
    };

    const decision = DeterministicAdaptiveEngine.evaluateWorkout(context);
    expect(decision.hasAdaptations).toBe(false);
    expect(decision.exerciseProposals).toHaveLength(0);
  });
});
