import { describe, it, expect } from 'vitest';
import {
  DeterministicRecommendationEngine,
  RecommendationContext,
  WEIGHT_GOAL_ALIGNMENT,
  WEIGHT_PERFORMANCE,
  WEIGHT_PREFERENCE,
  WEIGHT_CONSISTENCY,
  WEIGHT_RECENCY,
} from '@/lib/domain/recommendations';

describe('Recommendation Ranking & Scoring Weights (Phase 2K)', () => {
  it('correctly bounds and sums named scoring weights to a maximum of 100', () => {
    expect(
      WEIGHT_GOAL_ALIGNMENT +
      WEIGHT_PERFORMANCE +
      WEIGHT_PREFERENCE +
      WEIGHT_CONSISTENCY +
      WEIGHT_RECENCY
    ).toBe(100);
  });

  it('ranks higher scored recommendations above lower scored recommendations', () => {
    const context: RecommendationContext = {
      userId: 'user_1',
      recentSessions: [],
      activeProgram: {
        id: 'prog_p1',
        name: 'Hypertrophy Block',
        status: 'active',
        weeks: [
          {
            id: 'w1',
            programId: 'prog_p1',
            weekNumber: 1,
            days: [{ id: 'd1', programId: 'prog_p1', programWeekId: 'w1', dayNumber: 1, type: 'workout', label: 'Leg Day', status: 'planned' }],
          },
        ],
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
      },
      goals: [
        {
          id: 'goal_1',
          userId: 'user_1',
          type: 'workouts_completed',
          direction: 'increase',
          targetValue: 20,
          unit: 'sessions',
          status: 'active',
          startDate: '2026-09-01T00:00:00Z',
          createdAt: '2026-09-01T00:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z',
        },
      ],
    };

    const recs = DeterministicRecommendationEngine.generateRecommendations(context);
    expect(recs.length).toBeGreaterThan(1);
    // Verifies strict descending order
    for (let i = 0; i < recs.length - 1; i++) {
      expect(recs[i].score).toBeGreaterThanOrEqual(recs[i + 1].score);
    }
  });

  it('applies preference score boosts when matching preferred equipment', () => {
    const contextWithoutPref: RecommendationContext = {
      recentSessions: [
        {
          id: 's1',
          userId: 'u1',
          name: 'Dumbbell Session A',
          status: 'completed',
          startedAt: '2026-09-01T10:00:00Z',
          exercises: [
            {
              id: 'se1',
              sessionId: 's1',
              exerciseId: 'dumbbell_bench',
              name: 'Dumbbell Bench Press',
              order: 1,
              targetMuscles: ['Chest', 'Triceps'],
              equipment: ['dumbbell'],
              status: 'completed',
              sets: [
                { id: '1', sessionExerciseId: 'se1', setNumber: 1, type: 'normal', targetReps: 10, actualReps: 10, actualWeight: 20, status: 'completed' },
                { id: '2', sessionExerciseId: 'se1', setNumber: 2, type: 'normal', targetReps: 10, actualReps: 10, actualWeight: 20, status: 'completed' },
              ],
            },
          ],
        },
        {
          id: 's2',
          userId: 'u1',
          name: 'Dumbbell Session B',
          status: 'completed',
          startedAt: '2026-08-28T10:00:00Z',
          exercises: [
            {
              id: 'se2',
              sessionId: 's2',
              exerciseId: 'dumbbell_bench',
              name: 'Dumbbell Bench Press',
              order: 1,
              targetMuscles: ['Chest', 'Triceps'],
              equipment: ['dumbbell'],
              status: 'completed',
              sets: [
                { id: '3', sessionExerciseId: 'se2', setNumber: 1, type: 'normal', targetReps: 10, actualReps: 10, actualWeight: 20, status: 'completed' },
                { id: '4', sessionExerciseId: 'se2', setNumber: 2, type: 'normal', targetReps: 10, actualReps: 10, actualWeight: 20, status: 'completed' },
              ],
            },
          ],
        },
      ],
    };

    const contextWithPref: RecommendationContext = {
      ...contextWithoutPref,
      userProfile: {
        id: 'u1',
        name: 'User',
        fitnessLevel: 'intermediate',
        primaryGoal: 'hypertrophy',
        preferredMuscleGroups: ['Chest'],
        preferredEquipment: ['dumbbell'],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    };

    const recWithout = DeterministicRecommendationEngine.generateRecommendations(contextWithoutPref)[0];
    const recWith = DeterministicRecommendationEngine.generateRecommendations(contextWithPref)[0];

    expect(recWith.scoreBreakdown.preference).toBeGreaterThan(recWithout.scoreBreakdown.preference);
  });
});
