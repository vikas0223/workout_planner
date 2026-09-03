import { describe, it, expect } from 'vitest';
import {
  DeterministicRecommendationEngine,
  RECOMMENDATION_ENGINE_VERSION,
  RecommendationContext,
} from '@/lib/domain/recommendations';
import { WorkoutSession } from '@/types/domain';

describe('DeterministicRecommendationEngine (Phase 2K)', () => {
  const createMockSession = (id: string, dateStr: string, exerciseId: string): WorkoutSession => ({
    id,
    userId: 'user_test_1',
    name: 'Upper Body Workout',
    status: 'completed',
    startedAt: dateStr,
    completedAt: dateStr,
    exercises: [
      {
        id: `se_${id}_1`,
        sessionId: id,
        exerciseId,
        name: 'Barbell Bench Press',
        order: 1,
        targetMuscles: ['Chest', 'Triceps'],
        equipment: ['barbell', 'bench'],
        status: 'completed',
        plannedSets: 3,
        plannedReps: 8,
        sets: [
          { id: `s_${id}_1`, sessionExerciseId: `se_${id}_1`, setNumber: 1, type: 'normal', targetReps: 8, actualReps: 8, actualWeight: 80, status: 'completed', rpe: 7 },
          { id: `s_${id}_2`, sessionExerciseId: `se_${id}_1`, setNumber: 2, type: 'normal', targetReps: 8, actualReps: 8, actualWeight: 80, status: 'completed', rpe: 7.5 },
          { id: `s_${id}_3`, sessionExerciseId: `se_${id}_1`, setNumber: 3, type: 'normal', targetReps: 8, actualReps: 8, actualWeight: 80, status: 'completed', rpe: 8 },
        ],
      },
    ],
  });

  it('generates completely deterministic recommendations given identical contexts', () => {
    const sessions = [
      createMockSession('sess_1', '2026-09-01T10:00:00Z', 'ex_bench_press'),
      createMockSession('sess_2', '2026-08-29T10:00:00Z', 'ex_bench_press'),
    ];

    const context: RecommendationContext = {
      userId: 'user_test_1',
      recentSessions: sessions,
      userProfile: {
        id: 'user_test_1',
        name: 'Test Athlete',
        fitnessLevel: 'intermediate',
        primaryGoal: 'strength',
        preferredEquipment: ['barbell'],
        preferredMuscleGroups: ['Chest'],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      currentTime: '2026-09-02T12:00:00Z',
    };

    const runA = DeterministicRecommendationEngine.generateRecommendations(context);
    const runB = DeterministicRecommendationEngine.generateRecommendations(context);

    expect(runA).toEqual(runB);
    expect(runA.length).toBeGreaterThan(0);
    expect(runA[0].id).toBe(runB[0].id);
    expect(runA[0].score).toBe(runB[0].score);
    expect(runA[0].fingerprint).toBe(runB[0].fingerprint);
  });

  it('includes RECOMMENDATION_ENGINE_VERSION and stable fingerprint', () => {
    const fingerprintA = DeterministicRecommendationEngine.generateFingerprint(
      RECOMMENDATION_ENGINE_VERSION,
      'progress_load',
      'rule_load_progression',
      'ex_bench_press',
      JSON.stringify({ type: 'increase_weight' })
    );

    expect(fingerprintA).toMatch(/^rec_prog_[0-9a-f]{8}$/);

    const fingerprintB = DeterministicRecommendationEngine.generateFingerprint(
      '2.0.0',
      'progress_load',
      'rule_load_progression',
      'ex_bench_press',
      JSON.stringify({ type: 'increase_weight' })
    );

    expect(fingerprintB).toMatch(/^rec_prog_[0-9a-f]{8}$/);
    expect(fingerprintA).not.toBe(fingerprintB);
  });

  it('strictly filters candidates violating hard constraints before scoring', () => {
    const sessions = [
      createMockSession('sess_1', '2026-09-01T10:00:00Z', 'ex_bench_press'),
      createMockSession('sess_2', '2026-08-29T10:00:00Z', 'ex_bench_press'),
    ];

    // User is constrained to bodyweight only
    const contextWithBodyweightConstraint: RecommendationContext = {
      userId: 'user_test_1',
      recentSessions: sessions,
      constraints: ['bodyweight_only'],
      currentTime: '2026-09-02T12:00:00Z',
    };

    const recs = DeterministicRecommendationEngine.generateRecommendations(
      contextWithBodyweightConstraint
    );

    // Barbell bench press progression candidate MUST be eliminated
    const barbellRec = recs.find((r) => r.targetEntityId === 'ex_bench_press');
    expect(barbellRec).toBeUndefined();
  });
});
