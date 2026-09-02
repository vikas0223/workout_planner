import { describe, it, expect } from 'vitest';
import { DeterministicAdaptiveEngine } from '@/lib/domain/adaptive/adaptive-engine';
import { AdaptiveContext } from '@/lib/domain/adaptive/adaptive-types';
import { WorkoutTemplate, WorkoutSession, ProgramDay } from '@/types/domain';

describe('DeterministicAdaptiveEngine — Program Integration & Immutability (Phase 2L)', () => {
  const mockTemplate: WorkoutTemplate = {
    id: 'tpl_program_day_1',
    userId: 'user_1',
    name: 'Day 1: Upper Strength',
    goal: 'strength',
    difficulty: 'intermediate',
    duration: 50,
    targetMuscles: ['Chest', 'Back'],
    equipment: ['barbell'],
    isFavorite: false,
    isCustom: false,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
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

  const mockProgramDay: ProgramDay = {
    id: 'pday_1',
    programId: 'prog_1',
    programWeekId: 'pweek_1',
    dayNumber: 1,
    type: 'workout',
    label: 'Chest & Back',
    workoutTemplateId: 'tpl_program_day_1',
    status: 'planned',
    scheduledDate: '2026-09-02',
    effectiveDate: '2026-09-02',
  };

  const createCleanSession = (id: string, dateStr: string): WorkoutSession => ({
    id,
    userId: 'user_1',
    name: 'Day 1 Workout',
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
          { id: '1', sessionExerciseId: `se_${id}`, setNumber: 1, type: 'normal', targetReps: 8, actualReps: 8, actualWeight: 80, status: 'completed', rpe: 7.5 },
          { id: '2', sessionExerciseId: `se_${id}`, setNumber: 2, type: 'normal', targetReps: 8, actualReps: 8, actualWeight: 80, status: 'completed', rpe: 8 },
        ],
      },
    ],
  });

  it('evaluates program day template and yields adaptation proposal without mutating template or day', () => {
    const templateSnapshot = JSON.parse(JSON.stringify(mockTemplate));
    const daySnapshot = JSON.parse(JSON.stringify(mockProgramDay));

    const s1 = createCleanSession('s1', '2026-09-01T10:00:00Z');
    const s2 = createCleanSession('s2', '2026-08-28T10:00:00Z');

    const context: AdaptiveContext = {
      userId: 'user_1',
      evaluationDate: '2026-09-02T10:00:00Z',
      workoutPlan: mockTemplate,
      workoutSource: 'program_day',
      sourceEntityId: mockProgramDay.id,
      programContext: {
        programId: 'prog_1',
        programName: 'Linear Strength',
        weekNumber: 1,
        dayNumber: 1,
        programDayId: mockProgramDay.id,
      },
      recentSessions: [s1, s2],
      activeGoals: [],
    };

    const decision = DeterministicAdaptiveEngine.evaluateWorkout(context);

    expect(decision.hasAdaptations).toBe(true);
    expect(decision.exerciseProposals[0].adaptedPrescription.targetWeightKg).toBe(82.5);

    // Verify absolute immutability of underlying program structures
    expect(mockTemplate).toEqual(templateSnapshot);
    expect(mockProgramDay).toEqual(daySnapshot);
  });
});
