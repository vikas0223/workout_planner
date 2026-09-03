import { describe, it, expect } from 'vitest';
import { RecommendationRules } from '@/lib/domain/recommendations/recommendation-rules';
import { RecommendationContext } from '@/lib/domain/recommendations/recommendation-types';
import { WorkoutSession, Program } from '@/types/domain';

describe('RecommendationRules (Phase 2K)', () => {
  it('evaluates load progression when target reps achieved cleanly across 2+ sessions', () => {
    const sessions: WorkoutSession[] = [
      {
        id: 's1',
        userId: 'user_1',
        name: 'Squat Day A',
        status: 'completed',
        startedAt: '2026-09-01T10:00:00Z',
        completedAt: '2026-09-01T11:00:00Z',
        exercises: [
          {
            id: 'se1',
            sessionId: 's1',
            exerciseId: 'barbell_squat',
            name: 'Barbell Back Squat',
            order: 1,
            targetMuscles: ['Quadriceps', 'Glutes'],
            equipment: ['barbell'],
            status: 'completed',
            sets: [
              { id: 'set1', sessionExerciseId: 'se1', setNumber: 1, type: 'normal', targetReps: 5, actualReps: 5, actualWeight: 100, status: 'completed', rpe: 7 },
              { id: 'set2', sessionExerciseId: 'se1', setNumber: 2, type: 'normal', targetReps: 5, actualReps: 5, actualWeight: 100, status: 'completed', rpe: 7.5 },
            ],
          },
        ],
      },
      {
        id: 's2',
        userId: 'user_1',
        name: 'Squat Day B',
        status: 'completed',
        startedAt: '2026-08-28T10:00:00Z',
        completedAt: '2026-08-28T11:00:00Z',
        exercises: [
          {
            id: 'se2',
            sessionId: 's2',
            exerciseId: 'barbell_squat',
            name: 'Barbell Back Squat',
            order: 1,
            targetMuscles: ['Quadriceps', 'Glutes'],
            equipment: ['barbell'],
            status: 'completed',
            sets: [
              { id: 'set3', sessionExerciseId: 'se2', setNumber: 1, type: 'normal', targetReps: 5, actualReps: 5, actualWeight: 100, status: 'completed', rpe: 7 },
              { id: 'set4', sessionExerciseId: 'se2', setNumber: 2, type: 'normal', targetReps: 5, actualReps: 5, actualWeight: 100, status: 'completed', rpe: 7 },
            ],
          },
        ],
      },
    ];

    const context: RecommendationContext = {
      recentSessions: sessions,
    };

    const results = RecommendationRules.evaluateLoadProgression(context);
    expect(results.length).toBeGreaterThan(0);
    const result = results[0];
    expect(result.eligible).toBe(true);
    expect(result.candidate?.category).toBe('progress_load');
    expect(result.candidate?.actionPayload.suggestedWeightDeltaKg).toBe(2.5);
  });

  it('evaluates load reduction with non-medical language when reps missed repeatedly', () => {
    const sessions: WorkoutSession[] = [
      {
        id: 's1',
        userId: 'user_1',
        name: 'OHP Session',
        status: 'completed',
        startedAt: '2026-09-01T10:00:00Z',
        completedAt: '2026-09-01T11:00:00Z',
        exercises: [
          {
            id: 'se1',
            sessionId: 's1',
            exerciseId: 'overhead_press',
            name: 'Overhead Press',
            order: 1,
            targetMuscles: ['Shoulders', 'Triceps'],
            equipment: ['barbell'],
            status: 'completed',
            sets: [
              { id: 'set1', sessionExerciseId: 'se1', setNumber: 1, type: 'normal', targetReps: 8, actualReps: 5, actualWeight: 50, status: 'completed', rpe: 9.5 },
              { id: 'set2', sessionExerciseId: 'se1', setNumber: 2, type: 'normal', targetReps: 8, actualReps: 4, actualWeight: 50, status: 'completed', rpe: 10 },
            ],
          },
        ],
      },
    ];

    const context: RecommendationContext = {
      recentSessions: sessions,
    };

    const results = RecommendationRules.evaluateLoadReduction(context);
    expect(results.length).toBeGreaterThan(0);
    const candidate = results[0].candidate!;
    expect(candidate.category).toBe('reduce_load');
    expect(candidate.title).toContain('Optimize Form');
    expect(candidate.description).toContain('reducing the load');
    expect(candidate.explanation).toContain('below target reps');
  });

  it('derives substitution preference directly from canonical SessionExercise substitutedFromExerciseId', () => {
    const sessions: WorkoutSession[] = [
      {
        id: 's1',
        userId: 'user_1',
        name: 'Upper Session A',
        status: 'completed',
        startedAt: '2026-09-01T10:00:00Z',
        exercises: [
          {
            id: 'se1',
            sessionId: 's1',
            exerciseId: 'dumbbell_incline_bench',
            substitutedFromExerciseId: 'barbell_bench_press',
            name: 'Dumbbell Incline Bench',
            order: 1,
            targetMuscles: ['Chest', 'Triceps'],
            equipment: ['dumbbell'],
            status: 'completed',
            sets: [{ id: 'set1', sessionExerciseId: 'se1', setNumber: 1, type: 'normal', actualReps: 10, actualWeight: 24, status: 'completed' }],
          },
        ],
      },
      {
        id: 's2',
        userId: 'user_1',
        name: 'Upper Session B',
        status: 'completed',
        startedAt: '2026-08-28T10:00:00Z',
        exercises: [
          {
            id: 'se2',
            sessionId: 's2',
            exerciseId: 'dumbbell_incline_bench',
            substitutedFromExerciseId: 'barbell_bench_press',
            name: 'Dumbbell Incline Bench',
            order: 1,
            targetMuscles: ['Chest', 'Triceps'],
            equipment: ['dumbbell'],
            status: 'completed',
            sets: [{ id: 'set2', sessionExerciseId: 'se2', setNumber: 1, type: 'normal', actualReps: 10, actualWeight: 24, status: 'completed' }],
          },
        ],
      },
    ];

    const context: RecommendationContext = {
      recentSessions: sessions,
    };

    const results = RecommendationRules.evaluateSubstitutionPreference(context);
    expect(results.length).toBe(1);
    expect(results[0].candidate?.category).toBe('swap_exercise');
    expect(results[0].candidate?.actionPayload.exerciseId).toBe('barbell_bench_press');
    expect(results[0].candidate?.actionPayload.replacementExerciseId).toBe('dumbbell_incline_bench');
  });

  it('evaluates active program progression for next pending day', () => {
    const program: Program = {
      id: 'prog_1',
      userId: 'user_1',
      name: 'Push Pull Legs Blueprint',
      status: 'active',
      weeks: [
        {
          id: 'w1',
          programId: 'prog_1',
          weekNumber: 1,
          days: [
            { id: 'd1', programId: 'prog_1', programWeekId: 'w1', dayNumber: 1, type: 'workout', label: 'Push A', status: 'completed' },
            { id: 'd2', programId: 'prog_1', programWeekId: 'w1', dayNumber: 2, type: 'workout', label: 'Pull A', status: 'planned' },
          ],
        },
      ],
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z',
    };

    const context: RecommendationContext = {
      activeProgram: program,
      recentSessions: [],
    };

    const results = RecommendationRules.evaluateProgramProgression(context);
    expect(results.length).toBe(1);
    expect(results[0].candidate?.category).toBe('choose_workout');
    expect(results[0].candidate?.title).toContain('Pull A');
    expect(results[0].candidate?.actionPayload.programDayId).toBe('d2');
  });

  it('evaluates active recovery when user worked out across 3 consecutive days even with multiple sessions on the same day', () => {
    // Session 1: Day 3 morning (2026-09-03T09:00:00Z)
    // Session 2: Day 3 afternoon (2026-09-03T15:00:00Z) - same calendar day
    // Session 3: Day 2 (2026-09-02T10:00:00Z)
    // Session 4: Day 1 (2026-09-01T10:00:00Z)
    const sessions: WorkoutSession[] = [
      { id: 's_d3_pm', userId: 'user_1', name: 'Legs', status: 'completed', startedAt: '2026-09-03T15:00:00Z', completedAt: '2026-09-03T16:00:00Z', exercises: [] },
      { id: 's_d3_am', userId: 'user_1', name: 'Cardio', status: 'completed', startedAt: '2026-09-03T09:00:00Z', completedAt: '2026-09-03T09:45:00Z', exercises: [] },
      { id: 's_d2', userId: 'user_1', name: 'Pull', status: 'completed', startedAt: '2026-09-02T10:00:00Z', completedAt: '2026-09-02T11:00:00Z', exercises: [] },
      { id: 's_d1', userId: 'user_1', name: 'Push', status: 'completed', startedAt: '2026-09-01T10:00:00Z', completedAt: '2026-09-01T11:00:00Z', exercises: [] },
    ];

    const context: RecommendationContext = {
      recentSessions: sessions,
      recentFeedback: [],
    };

    const results = RecommendationRules.evaluateRecovery(context);
    expect(results.length).toBeGreaterThan(0);
    const recoveryRec = results.find((r: { candidate?: { category: string } }) => r.candidate?.category === 'recovery_day');
    expect(recoveryRec).toBeDefined();
    expect(recoveryRec?.eligible).toBe(true);
    expect(recoveryRec?.candidate?.evidence.summary).toBe('3 consecutive workout days');
  });
});

