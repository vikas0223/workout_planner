import { describe, it, expect } from 'vitest';
import { DeterministicAdaptiveEngine } from '@/lib/domain/adaptive/adaptive-engine';
import { AdaptiveContext } from '@/lib/domain/adaptive/adaptive-types';
import { WorkoutSession, GeneratedWorkout } from '@/types/domain';

describe('DeterministicAdaptiveEngine — Conflict Resolution & Precedence (Phase 2L)', () => {
  const mockPlan: GeneratedWorkout = {
    id: 'gw_1',
    name: 'Upper Body Workout',
    goal: 'strength',
    difficulty: 'intermediate',
    duration: 45,
    targetMuscles: ['Chest', 'Triceps'],
    equipment: ['barbell', 'dumbbell'],
    createdAt: '2026-09-01T00:00:00Z',
    exercises: [
      {
        id: 'ex_1',
        exerciseId: 'barbell_bench_press',
        name: 'Barbell Bench Press',
        sets: 4,
        reps: '8',
        rest: '90',
        order: 1,
        targetMuscles: ['Chest'],
        equipment: ['barbell'],
      },
      {
        id: 'ex_2',
        exerciseId: 'tricep_pushdown',
        name: 'Tricep Pushdown',
        sets: 4,
        reps: '12',
        rest: '60',
        order: 2,
        targetMuscles: ['Triceps'],
        equipment: ['cable'],
      },
    ],
  };

  it('fatigue state suppresses load increases across all exercises', () => {
    // 3 workouts in last 3 days -> high density fatigue
    const denseSessions: WorkoutSession[] = [
      {
        id: 's1',
        userId: 'user_1',
        name: 'Workout 1',
        status: 'completed',
        startedAt: '2026-09-02T10:00:00Z',
        exercises: [
          {
            id: 'se1',
            sessionId: 's1',
            exerciseId: 'barbell_bench_press',
            name: 'Barbell Bench Press',
            order: 1,
            targetMuscles: ['Chest'],
            equipment: ['barbell'],
            status: 'completed',
            sets: [
              { id: '1', sessionExerciseId: 'se1', setNumber: 1, type: 'normal', targetReps: 8, actualReps: 8, actualWeight: 80, status: 'completed', rpe: 8 },
              { id: '2', sessionExerciseId: 'se1', setNumber: 2, type: 'normal', targetReps: 8, actualReps: 8, actualWeight: 80, status: 'completed', rpe: 8 },
            ],
          },
        ],
      },
      {
        id: 's2',
        userId: 'user_1',
        name: 'Workout 2',
        status: 'completed',
        startedAt: '2026-09-01T10:00:00Z',
        exercises: [
          {
            id: 'se2',
            sessionId: 's2',
            exerciseId: 'barbell_bench_press',
            name: 'Barbell Bench Press',
            order: 1,
            targetMuscles: ['Chest'],
            equipment: ['barbell'],
            status: 'completed',
            sets: [
              { id: '3', sessionExerciseId: 'se2', setNumber: 1, type: 'normal', targetReps: 8, actualReps: 8, actualWeight: 80, status: 'completed', rpe: 8 },
              { id: '4', sessionExerciseId: 'se2', setNumber: 2, type: 'normal', targetReps: 8, actualReps: 8, actualWeight: 80, status: 'completed', rpe: 8 },
            ],
          },
        ],
      },
      {
        id: 's3',
        userId: 'user_1',
        name: 'Workout 3',
        status: 'completed',
        startedAt: '2026-08-31T10:00:00Z',
        exercises: [],
      },
    ];

    const context: AdaptiveContext = {
      userId: 'user_1',
      evaluationDate: '2026-09-02T12:00:00Z',
      workoutPlan: mockPlan,
      workoutSource: 'generated',
      recentSessions: denseSessions,
      activeGoals: [],
    };

    const decision = DeterministicAdaptiveEngine.evaluateWorkout(context);

    // Bench press should NOT increase load despite clean sets because of high training density
    const benchProposal = decision.exerciseProposals.find((p) => p.exerciseId === 'barbell_bench_press');
    expect(benchProposal?.action).not.toBe('increase_load');

    // Secondary exercise (tricep pushdown) gets set volume reduced from 4 to 3
    const tricepProposal = decision.exerciseProposals.find((p) => p.exerciseId === 'tricep_pushdown');
    expect(tricepProposal?.action).toBe('decrease_sets');
    expect(tricepProposal?.adaptedPrescription.sets).toBe(3);
  });
});
