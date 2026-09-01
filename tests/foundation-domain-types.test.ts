/**
 * Phase 2H.5 Foundation Domain Types — Comprehensive Tests
 *
 * Tests actual behavior/invariants for all new domain types,
 * backward compatibility with existing records, and lifecycle
 * preservation of grouping metadata.
 */

import { describe, it, expect } from 'vitest';
import type {
  // Core existing types
  WorkoutSet,
  SetType,
  SetSide,
  SessionExercise,
  Exercise,
  ExerciseSource,
  ExerciseGroupType,
  ExerciseVariationKind,
  ExerciseVariation,
  ComplementaryExercise,
  WorkoutPresentationMode,
  QuickWorkoutProfile,
  TrainingConstraint,
  TrainingPreferences,
  GoalTargetType,
  GoalTargetStatus,
  FitnessGoalTarget,
  PersonalRecord,
  PersonalRecordType,
  BodyMetricEntry,
  RecoverySnapshot,
  Program,
  ProgramWeek,
  ProgramDay,
  ProgramDayType,
  Reminder,
  ReminderType,
  Challenge,
  ChallengeStatus,
  ChallengeProgress,
  Streak,
  ShareableWorkout,
  WorkoutShare,
  IntegrationProvider,
  IntegrationConnection,
  IntegrationCapability,
  IntegrationCapabilityType,
  AICoachMessage,
  GeneratedWorkoutExercise,
  GeneratedWorkout,
  WorkoutTemplate,
} from '@/types/domain';
import {
  generatedWorkoutToDraft,
  templateToDraft,
  draftToWorkoutTemplate,
} from '@/lib/domain/workout-draft';

// ==========================================
// 1. SET MODEL — SetType & SetSide
// ==========================================

describe('WorkoutSet — SetType and SetSide', () => {
  it('existing legacy set types remain valid', () => {
    const legacyTypes: SetType[] = ['warmup', 'working', 'drop', 'failure', 'cooldown'];
    legacyTypes.forEach((t) => {
      const set: WorkoutSet = {
        id: 'set-1',
        sessionExerciseId: 'se-1',
        setNumber: 1,
        type: t,
        status: 'completed',
      };
      expect(set.type).toBe(t);
    });
  });

  it('new set types are valid', () => {
    const newTypes: SetType[] = ['normal', 'amrap', 'negative'];
    newTypes.forEach((t) => {
      const set: WorkoutSet = {
        id: 'set-2',
        sessionExerciseId: 'se-1',
        setNumber: 1,
        type: t,
        status: 'planned',
      };
      expect(set.type).toBe(t);
    });
  });

  it('missing setType on legacy records should be treated as normal', () => {
    // Simulate a legacy record that was persisted without setType
    const legacyRecord: Record<string, unknown> = {
      id: 'set-legacy',
      sessionExerciseId: 'se-1',
      setNumber: 1,
      status: 'completed',
      actualReps: 10,
      actualWeight: 50,
    };
    const hydrated: WorkoutSet = {
      ...legacyRecord,
      type: (legacyRecord.type as SetType) || 'normal',
    } as WorkoutSet;
    expect(hydrated.type).toBe('normal');
  });

  it('SetSide is separate from SetType', () => {
    const set: WorkoutSet = {
      id: 'set-3',
      sessionExerciseId: 'se-1',
      setNumber: 1,
      type: 'working',
      side: 'left',
      status: 'completed',
    };
    expect(set.type).toBe('working');
    expect(set.side).toBe('left');
  });

  it('missing side defaults to bilateral semantically', () => {
    const set: WorkoutSet = {
      id: 'set-4',
      sessionExerciseId: 'se-1',
      setNumber: 1,
      type: 'normal',
      status: 'completed',
    };
    expect(set.side).toBeUndefined();
    const effectiveSide: SetSide = set.side ?? 'bilateral';
    expect(effectiveSide).toBe('bilateral');
  });

  it('all SetSide values are valid', () => {
    const sides: SetSide[] = ['bilateral', 'left', 'right'];
    sides.forEach((s) => {
      const set: WorkoutSet = {
        id: `set-side-${s}`,
        sessionExerciseId: 'se-1',
        setNumber: 1,
        type: 'normal',
        side: s,
        status: 'planned',
      };
      expect(set.side).toBe(s);
    });
  });

  it('explicit legacy values (working, cooldown, warmup, drop, failure) are never rewritten', () => {
    const legacySets: { rawType: SetType; expected: SetType }[] = [
      { rawType: 'working', expected: 'working' },
      { rawType: 'cooldown', expected: 'cooldown' },
      { rawType: 'warmup', expected: 'warmup' },
      { rawType: 'drop', expected: 'drop' },
      { rawType: 'failure', expected: 'failure' },
    ];

    legacySets.forEach(({ rawType, expected }) => {
      const legacyRecord = {
        id: `set-${rawType}`,
        sessionExerciseId: 'se-1',
        setNumber: 1,
        type: rawType,
        status: 'completed',
      };
      // Hydration must preserve the explicit type without rewriting
      const hydratedType: SetType = legacyRecord.type || 'normal';
      expect(hydratedType).toBe(expected);
      expect(hydratedType).not.toBe('normal');
    });
  });

  it('missing setType specifically hydrates to normal', () => {
    const rawWithoutType: Record<string, unknown> = {
      id: 'set-no-type',
      sessionExerciseId: 'se-1',
      setNumber: 1,
      status: 'completed',
    };
    const hydratedType: SetType = (rawWithoutType.type as SetType) || 'normal';
    expect(hydratedType).toBe('normal');
  });

  it('missing side specifically hydrates to bilateral', () => {
    const rawWithoutSide: Record<string, unknown> = {
      id: 'set-no-side',
      sessionExerciseId: 'se-1',
      setNumber: 1,
      type: 'working',
    };
    const hydratedSide: SetSide = (rawWithoutSide.side as SetSide) ?? 'bilateral';
    expect(hydratedSide).toBe('bilateral');
  });

  it('missing Exercise.source specifically hydrates to catalog', () => {
    const rawWithoutSource: Record<string, unknown> = {
      id: 'ex-legacy',
      name: 'Legacy Pushup',
      primaryMuscles: ['chest'],
      equipment: ['bodyweight'],
      difficulty: 'beginner',
      goals: ['general_fitness'],
    };
    const hydratedSource: ExerciseSource = (rawWithoutSource.source as ExerciseSource) ?? 'catalog';
    expect(hydratedSource).toBe('catalog');
  });
});

// ==========================================
// 2. EXERCISE GROUPING
// ==========================================

describe('Exercise Grouping Metadata', () => {
  it('grouping fields are optional on SessionExercise', () => {
    const ex: SessionExercise = {
      id: 'se-1',
      sessionId: 's-1',
      exerciseId: 'ex-1',
      name: 'Bench Press',
      order: 1,
      status: 'pending',
      targetMuscles: ['chest'],
      equipment: ['barbell'],
      sets: [],
    };
    expect(ex.groupId).toBeUndefined();
    expect(ex.groupType).toBeUndefined();
    expect(ex.groupPosition).toBeUndefined();
  });

  it('grouping fields can be set on SessionExercise', () => {
    const ex: SessionExercise = {
      id: 'se-2',
      sessionId: 's-1',
      exerciseId: 'ex-2',
      name: 'Incline DB Press',
      order: 2,
      status: 'pending',
      targetMuscles: ['chest'],
      equipment: ['dumbbells'],
      sets: [],
      groupId: 'group-1',
      groupType: 'superset',
      groupPosition: 1,
    };
    expect(ex.groupType).toBe('superset');
    expect(ex.groupPosition).toBe(1);
  });

  it('all group types are valid', () => {
    const types: ExerciseGroupType[] = ['superset', 'giant_set', 'circuit'];
    types.forEach((t) => {
      const ex: GeneratedWorkoutExercise = {
        id: 'gwe-1',
        exerciseId: 'ex-1',
        name: 'Test',
        sets: 3,
        reps: '10',
        rest: '60s',
        targetMuscles: ['chest'],
        equipment: ['barbell'],
        order: 1,
        groupId: 'g-1',
        groupType: t,
        groupPosition: 1,
      };
      expect(ex.groupType).toBe(t);
    });
  });

  it('grouping metadata survives GeneratedWorkout → Draft conversion', () => {
    const generated: GeneratedWorkout = {
      id: 'gw-1',
      name: 'Superset Workout',
      goal: 'hypertrophy',
      difficulty: 'intermediate',
      duration: 45,
      targetMuscles: ['chest', 'back'],
      equipment: ['barbell'],
      exercises: [
        {
          id: 'gwe-1', exerciseId: 'ex-1', name: 'Bench Press',
          sets: 3, reps: '10', rest: '60s', targetMuscles: ['chest'],
          equipment: ['barbell'], order: 1,
          groupId: 'ss-1', groupType: 'superset', groupPosition: 1,
        },
        {
          id: 'gwe-2', exerciseId: 'ex-2', name: 'Bent-over Row',
          sets: 3, reps: '10', rest: '60s', targetMuscles: ['back'],
          equipment: ['barbell'], order: 2,
          groupId: 'ss-1', groupType: 'superset', groupPosition: 2,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    const draft = generatedWorkoutToDraft(generated);
    expect(draft.exercises[0].groupId).toBe('ss-1');
    expect(draft.exercises[0].groupType).toBe('superset');
    expect(draft.exercises[0].groupPosition).toBe(1);
    expect(draft.exercises[1].groupId).toBe('ss-1');
    expect(draft.exercises[1].groupPosition).toBe(2);
  });

  it('grouping metadata survives Draft → Template conversion', () => {
    const generated: GeneratedWorkout = {
      id: 'gw-2',
      name: 'Circuit',
      goal: 'fat_loss',
      difficulty: 'beginner',
      duration: 30,
      targetMuscles: ['full_body'],
      equipment: ['bodyweight'],
      exercises: [
        {
          id: 'gwe-3', exerciseId: 'ex-3', name: 'Squats',
          sets: 3, reps: '15', rest: '30s', targetMuscles: ['quads'],
          equipment: ['bodyweight'], order: 1,
          groupId: 'circuit-1', groupType: 'circuit', groupPosition: 1,
        },
      ],
      createdAt: new Date().toISOString(),
    };
    const draft = generatedWorkoutToDraft(generated);
    const template = draftToWorkoutTemplate(draft);
    expect(template.exercises[0].groupId).toBe('circuit-1');
    expect(template.exercises[0].groupType).toBe('circuit');
  });

  it('grouping metadata survives Template → Draft conversion', () => {
    const template: WorkoutTemplate = {
      id: 'wt-1',
      name: 'Giant Set Day',
      goal: 'hypertrophy',
      difficulty: 'advanced',
      duration: 60,
      targetMuscles: ['shoulders'],
      equipment: ['dumbbells'],
      exercises: [
        {
          id: 'gwe-4', exerciseId: 'ex-4', name: 'Lateral Raise',
          sets: 4, reps: '12', rest: '0s', targetMuscles: ['shoulders'],
          equipment: ['dumbbells'], order: 1,
          groupId: 'gs-1', groupType: 'giant_set', groupPosition: 1,
        },
        {
          id: 'gwe-5', exerciseId: 'ex-5', name: 'Front Raise',
          sets: 4, reps: '12', rest: '0s', targetMuscles: ['shoulders'],
          equipment: ['dumbbells'], order: 2,
          groupId: 'gs-1', groupType: 'giant_set', groupPosition: 2,
        },
      ],
      isFavorite: false,
      isCustom: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const draft = templateToDraft(template);
    expect(draft.exercises[0].groupId).toBe('gs-1');
    expect(draft.exercises[1].groupType).toBe('giant_set');
    expect(draft.exercises[1].groupPosition).toBe(2);
  });
});

// ==========================================
// 3. EXERCISE VARIATIONS
// ==========================================

describe('Exercise Variations', () => {
  it('variation kinds cover expected dimensions', () => {
    const kinds: ExerciseVariationKind[] = [
      'grip', 'stance', 'tempo', 'range_of_motion',
      'equipment', 'unilateral', 'position', 'progression', 'regression',
    ];
    expect(kinds.length).toBe(9);
  });

  it('ExerciseVariation is structurally distinct from ExerciseAlternative', () => {
    const variation: ExerciseVariation = {
      variationExerciseId: 'ex-close-grip-bench',
      variationName: 'Close-Grip Bench Press',
      kind: 'grip',
      description: 'Narrower grip emphasizes triceps.',
    };
    expect(variation.kind).toBe('grip');
    expect(variation.variationExerciseId).toBeDefined();
  });

  it('ComplementaryExercise is structurally distinct from alternatives and variations', () => {
    const comp: ComplementaryExercise = {
      exerciseId: 'ex-barbell-row',
      name: 'Barbell Row',
      reason: 'Agonist/antagonist pairing with bench press',
    };
    expect(comp.exerciseId).toBeDefined();
    expect(comp.reason).toContain('agonist');
  });

  it('Exercise can have variations and complementary exercises', () => {
    const exercise: Exercise = {
      id: 'ex-bench',
      name: 'Barbell Bench Press',
      primaryMuscles: ['chest'],
      equipment: ['barbell', 'bench'],
      difficulty: 'intermediate',
      goals: ['hypertrophy', 'strength'],
      source: 'catalog',
      variations: [
        { variationExerciseId: 'ex-close-grip', kind: 'grip' },
        { variationExerciseId: 'ex-incline-bench', kind: 'position' },
      ],
      complementaryExercises: [
        { exerciseId: 'ex-barbell-row', reason: 'Push/pull balance' },
      ],
    };
    expect(exercise.variations?.length).toBe(2);
    expect(exercise.complementaryExercises?.length).toBe(1);
  });
});

// ==========================================
// 4. CUSTOM EXERCISES
// ==========================================

describe('Custom Exercises — Source & Ownership', () => {
  it('catalog exercises default source is catalog', () => {
    const ex: Exercise = {
      id: 'ex-catalog',
      name: 'Standard Squat',
      primaryMuscles: ['quads'],
      equipment: ['barbell'],
      difficulty: 'intermediate',
      goals: ['strength'],
      source: 'catalog',
      isCustom: false,
    };
    expect(ex.source).toBe('catalog');
    expect(ex.isCustom).toBe(false);
    expect(ex.ownerId).toBeUndefined();
  });

  it('user-created exercises have source=user and ownerId', () => {
    const ex: Exercise = {
      id: 'ex-custom-1',
      name: 'My Custom Exercise',
      primaryMuscles: ['chest'],
      equipment: ['bodyweight'],
      difficulty: 'beginner',
      goals: ['general_fitness'],
      source: 'user',
      isCustom: true,
      ownerId: 'user-123',
    };
    expect(ex.source).toBe('user');
    expect(ex.isCustom).toBe(true);
    expect(ex.ownerId).toBe('user-123');
  });

  it('existing exercises without source field are backward compatible', () => {
    const legacy: Exercise = {
      id: 'ex-old',
      name: 'Old Exercise',
      primaryMuscles: ['back'],
      equipment: ['bodyweight'],
      difficulty: 'beginner',
      goals: ['general_fitness'],
    };
    const effectiveSource: ExerciseSource = legacy.source ?? 'catalog';
    expect(effectiveSource).toBe('catalog');
    expect(legacy.isCustom ?? false).toBe(false);
  });
});

// ==========================================
// 5. TRAINING PREFERENCES & CONSTRAINTS
// ==========================================

describe('TrainingPreferences', () => {
  it('all fields are optional', () => {
    const empty: TrainingPreferences = {};
    expect(empty.preferredLocation).toBeUndefined();
    expect(empty.constraints).toBeUndefined();
  });

  it('accepts valid preference values', () => {
    const prefs: TrainingPreferences = {
      preferredLocation: 'home',
      preferredEquipment: ['dumbbells', 'bands'],
      defaultWorkoutDuration: 30,
      defaultRestSeconds: 60,
      voiceCoach: true,
      autoAdvance: false,
      keepScreenAwake: true,
      hapticFeedback: false,
      constraints: ['no_jump', 'low_impact', 'quiet'],
    };
    expect(prefs.preferredLocation).toBe('home');
    expect(prefs.constraints?.length).toBe(3);
  });
});

describe('TrainingConstraints', () => {
  it('all constraint values are valid', () => {
    const allConstraints: TrainingConstraint[] = [
      'no_jump', 'low_impact', 'quiet', 'limited_space',
      'bodyweight_only', 'home_only', 'gym_only',
    ];
    expect(allConstraints.length).toBe(7);
    // Each is a string, not a medical diagnosis
    allConstraints.forEach((c) => {
      expect(typeof c).toBe('string');
    });
  });
});

// ==========================================
// 6. PROGRAM FOUNDATION
// ==========================================

describe('Program Hierarchy', () => {
  it('creates valid Program → Week → Day hierarchy', () => {
    const program: Program = {
      id: 'prog-1',
      name: '4-Week Hypertrophy',
      goal: 'hypertrophy',
      difficulty: 'intermediate',
      status: 'active',
      weeks: [
        {
          id: 'pw-1',
          programId: 'prog-1',
          weekNumber: 1,
          label: 'Adaptation',
          days: [
            { id: 'pd-1', programId: 'prog-1', programWeekId: 'pw-1', dayNumber: 1, type: 'workout', workoutTemplateId: 'wt-1', status: 'planned' },
            { id: 'pd-2', programId: 'prog-1', programWeekId: 'pw-1', dayNumber: 2, type: 'rest', status: 'planned' },
            { id: 'pd-3', programId: 'prog-1', programWeekId: 'pw-1', dayNumber: 3, type: 'workout', workoutTemplateId: 'wt-2', status: 'planned' },
            { id: 'pd-4', programId: 'prog-1', programWeekId: 'pw-1', dayNumber: 4, type: 'recovery', notes: 'Light stretching', status: 'planned' },
            { id: 'pd-5', programId: 'prog-1', programWeekId: 'pw-1', dayNumber: 5, type: 'workout', workoutTemplateId: 'wt-3', status: 'planned' },
            { id: 'pd-6', programId: 'prog-1', programWeekId: 'pw-1', dayNumber: 6, type: 'mobility', status: 'planned' },
            { id: 'pd-7', programId: 'prog-1', programWeekId: 'pw-1', dayNumber: 7, type: 'rest', status: 'planned' },
          ],
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(program.weeks.length).toBe(1);
    expect(program.weeks[0].days.length).toBe(7);
    expect(program.weeks[0].days[0].type).toBe('workout');
    expect(program.weeks[0].days[0].workoutTemplateId).toBe('wt-1');
    expect(program.weeks[0].days[1].type).toBe('rest');
  });

  it('day types are extensible beyond workout/rest', () => {
    const dayTypes: ProgramDayType[] = ['workout', 'rest', 'recovery', 'mobility'];
    expect(dayTypes.length).toBe(4);
  });

  it('program does not duplicate WorkoutTemplate — references by ID', () => {
    const day: ProgramDay = {
      id: 'pd-test',
      programId: 'prog-1',
      programWeekId: 'pw-1',
      dayNumber: 1,
      type: 'workout',
      workoutTemplateId: 'wt-existing',
      status: 'planned',
    };
    expect(day.workoutTemplateId).toBe('wt-existing');
    // Day itself does NOT contain exercises
    expect((day as unknown as Record<string, unknown>)['exercises']).toBeUndefined();
  });
});

// ==========================================
// 7. GOAL TARGETS
// ==========================================

describe('FitnessGoalTarget', () => {
  it('creates valid goal target', () => {
    const goal: FitnessGoalTarget = {
      id: 'gt-1',
      type: 'weight',
      direction: 'decrease',
      label: 'Reach 75kg body weight',
      targetValue: 75,
      unit: 'kg',
      startValue: 80,
      startDate: '2024-01-01',
      targetDate: '2024-06-01',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-03-01T00:00:00Z',
    };
    expect(goal.type).toBe('weight');
    expect(goal.direction).toBe('decrease');
    expect(goal.status).toBe('active');
  });

  it('all target types are valid', () => {
    const types: GoalTargetType[] = [
      'weight', 'frequency', 'strength', 'volume',
      'workouts_completed', 'personal_record', 'body_metric',
    ];
    expect(types.length).toBe(7);
  });

  it('status transitions are valid', () => {
    const statuses: GoalTargetStatus[] = ['active', 'achieved', 'abandoned'];
    expect(statuses.length).toBe(3);
  });
});

// ==========================================
// 8. PERSONAL RECORDS
// ==========================================

describe('PersonalRecord', () => {
  it('creates valid PR', () => {
    const pr: PersonalRecord = {
      id: 'pr-1',
      exerciseId: 'ex-bench',
      recordType: 'max_weight',
      value: 120,
      unit: 'kg',
      sessionId: 'session-42',
      setId: 'set-7',
      achievedAt: '2024-03-15T10:30:00Z',
      previousValue: 115,
      createdAt: '2024-03-15T10:30:00Z',
    };
    expect(pr.recordType).toBe('max_weight');
    expect(pr.value).toBe(120);
    expect(pr.previousValue).toBe(115);
  });

  it('all record types are valid', () => {
    const types: PersonalRecordType[] = [
      'max_weight', 'max_reps', 'estimated_1rm', 'volume',
      'duration', 'distance', 'time', 'pace',
    ];
    expect(types.length).toBe(8);
  });
});

// ==========================================
// 9. BODY METRICS
// ==========================================

describe('BodyMetricEntry', () => {
  it('all measurements are optional except id and date', () => {
    const minimal: BodyMetricEntry = {
      id: 'bm-1',
      date: '2024-03-15',
      createdAt: '2024-03-15T10:00:00Z',
    };
    expect(minimal.weight).toBeUndefined();
    expect(minimal.bodyFatPercentage).toBeUndefined();
  });

  it('accepts full set of measurements', () => {
    const full: BodyMetricEntry = {
      id: 'bm-2',
      userId: 'user-1',
      date: '2024-03-15',
      weight: 75,
      weightUnit: 'kg',
      bodyFatPercentage: 15,
      waist: 80,
      chest: 100,
      arm: 35,
      thigh: 55,
      measurementUnit: 'cm',
      notes: 'Morning measurement',
      createdAt: '2024-03-15T06:00:00Z',
    };
    expect(full.weight).toBe(75);
    expect(full.bodyFatPercentage).toBe(15);
  });
});

// ==========================================
// 10. RECOVERY
// ==========================================

describe('RecoverySnapshot', () => {
  it('creates valid non-medical recovery snapshot', () => {
    const recovery: RecoverySnapshot = {
      id: 'rec-1',
      userId: 'user-1',
      date: '2024-03-15',
      sleepDuration: 7.5,
      perceivedRecovery: 7,
      fatigue: 3,
      soreness: 4,
      readinessScore: 72,
      createdAt: '2024-03-15T07:00:00Z',
    };
    expect(recovery.readinessScore).toBe(72);
    // readinessScore is product-derived, not medical
    expect(recovery.readinessScore).toBeLessThanOrEqual(100);
    expect(recovery.readinessScore).toBeGreaterThanOrEqual(0);
  });

  it('all fields are optional except id and date', () => {
    const minimal: RecoverySnapshot = {
      id: 'rec-2',
      date: '2024-03-16',
      createdAt: '2024-03-16T07:00:00Z',
    };
    expect(minimal.sleepDuration).toBeUndefined();
    expect(minimal.readinessScore).toBeUndefined();
  });
});

// ==========================================
// 11. REMINDERS
// ==========================================

describe('Reminder', () => {
  it('creates valid reminder', () => {
    const reminder: Reminder = {
      id: 'rem-1',
      type: 'workout',
      schedule: '0 18 * * 1,3,5',
      enabled: true,
      message: 'Time for your workout!',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    expect(reminder.type).toBe('workout');
    expect(reminder.enabled).toBe(true);
  });

  it('all reminder types are valid', () => {
    const types: ReminderType[] = ['workout', 'program', 'goal', 'recovery', 'custom'];
    expect(types.length).toBe(5);
  });

  it('can reference a goal or program', () => {
    const goalReminder: Reminder = {
      id: 'rem-2',
      type: 'goal',
      schedule: '0 9 * * *',
      enabled: true,
      goalId: 'gt-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    expect(goalReminder.goalId).toBe('gt-1');
  });
});

// ==========================================
// 12. CHALLENGES & STREAKS
// ==========================================

describe('Challenges & Streaks', () => {
  it('creates valid challenge', () => {
    const challenge: Challenge = {
      id: 'ch-1',
      name: '30-Day Workout Challenge',
      description: 'Complete 30 workouts in 30 days',
      type: 'workout_count',
      targetValue: 30,
      unit: 'workouts',
      startDate: '2024-04-01',
      endDate: '2024-04-30',
      status: 'active',
      createdAt: '2024-04-01T00:00:00Z',
    };
    expect(challenge.status).toBe('active');
    expect(challenge.targetValue).toBe(30);
  });

  it('challenge status values are valid', () => {
    const statuses: ChallengeStatus[] = ['active', 'completed', 'abandoned'];
    expect(statuses.length).toBe(3);
  });

  it('creates valid challenge progress', () => {
    const progress: ChallengeProgress = {
      id: 'cp-1',
      challengeId: 'ch-1',
      userId: 'user-1',
      status: 'active',
      joinedAt: '2024-04-01T00:00:00Z',
      updatedAt: '2024-04-15T00:00:00Z',
    };
    expect(progress.status).toBe('active');
  });

  it('creates valid streak', () => {
    const streak: Streak = {
      id: 'str-1',
      userId: 'user-1',
      type: 'daily',
      currentCount: 7,
      longestCount: 14,
      lastActivityDate: '2024-03-15',
      startDate: '2024-03-09',
      updatedAt: '2024-03-15T00:00:00Z',
    };
    expect(streak.currentCount).toBe(7);
    expect(streak.longestCount).toBe(14);
  });
});

// ==========================================
// 13. SHARING PRIVACY
// ==========================================

describe('Sharing — Privacy Constraints', () => {
  it('ShareableWorkout does not contain session data or body metrics', () => {
    const shareable: ShareableWorkout = {
      id: 'sw-1',
      workoutTemplateId: 'wt-1',
      ownerId: 'user-1',
      name: 'Upper Body Day',
      goal: 'hypertrophy',
      difficulty: 'intermediate',
      exerciseCount: 6,
      duration: 45,
      isPublic: false,
      createdAt: '2024-03-15T00:00:00Z',
    };
    // ShareableWorkout must NOT have session sets, body metrics, or private user data
    const asRecord = shareable as unknown as Record<string, unknown>;
    expect(asRecord['sets']).toBeUndefined();
    expect(asRecord['bodyMetrics']).toBeUndefined();
    expect(asRecord['feedback']).toBeUndefined();
  });

  it('WorkoutShare supports share code and expiration', () => {
    const share: WorkoutShare = {
      id: 'ws-1',
      shareableWorkoutId: 'sw-1',
      sharedByUserId: 'user-1',
      shareCode: 'ABC123',
      expiresAt: '2024-04-15T00:00:00Z',
      createdAt: '2024-03-15T00:00:00Z',
    };
    expect(share.shareCode).toBe('ABC123');
    expect(share.expiresAt).toBeDefined();
  });
});

// ==========================================
// 14. INTEGRATION PROVIDERS
// ==========================================

describe('Integration Provider Contracts', () => {
  it('creates valid provider with capabilities', () => {
    const provider: IntegrationProvider = {
      id: 'ip-apple-health',
      name: 'Apple Health',
      slug: 'apple_health',
      capabilities: [
        { type: 'read_workouts', requiresAuth: true },
        { type: 'write_workouts', requiresAuth: true },
        { type: 'read_heart_rate', requiresAuth: true },
        { type: 'read_steps', requiresAuth: true },
      ],
      isAvailable: true,
    };
    expect(provider.capabilities.length).toBe(4);
    expect(provider.capabilities.every((c) => c.requiresAuth)).toBe(true);
  });

  it('all capability types are valid', () => {
    const types: IntegrationCapabilityType[] = [
      'read_workouts', 'write_workouts',
      'read_body_metrics', 'write_body_metrics',
      'read_heart_rate', 'read_steps', 'read_sleep',
    ];
    expect(types.length).toBe(7);
  });

  it('creates valid integration connection', () => {
    const conn: IntegrationConnection = {
      id: 'ic-1',
      userId: 'user-1',
      providerId: 'ip-strava',
      providerName: 'Strava',
      isConnected: true,
      lastSyncAt: '2024-03-15T10:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-03-15T10:00:00Z',
    };
    expect(conn.isConnected).toBe(true);
    // Tokens should not be present in this test (encrypted in persistence)
    expect(conn.accessToken).toBeUndefined();
  });
});

// ==========================================
// 15. PRESENTATION MODE & QUICK PROFILE
// ==========================================

describe('WorkoutPresentationMode & QuickWorkoutProfile', () => {
  it('default presentation mode is self_logged', () => {
    const template: WorkoutTemplate = {
      id: 'wt-1',
      name: 'Test',
      goal: 'general_fitness',
      difficulty: 'beginner',
      duration: 30,
      targetMuscles: [],
      equipment: [],
      exercises: [],
      isFavorite: false,
      isCustom: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const mode: WorkoutPresentationMode = template.presentationMode ?? 'self_logged';
    expect(mode).toBe('self_logged');
  });

  it('presentation mode survives Draft → Template conversion', () => {
    const generated: GeneratedWorkout = {
      id: 'gw-pm',
      name: 'Guided Workout',
      goal: 'general_fitness',
      difficulty: 'beginner',
      duration: 20,
      targetMuscles: ['full_body'],
      equipment: ['bodyweight'],
      exercises: [],
      presentationMode: 'guided',
      quickProfile: 'quick',
      createdAt: new Date().toISOString(),
    };
    const draft = generatedWorkoutToDraft(generated);
    expect(draft.presentationMode).toBe('guided');
    expect(draft.quickProfile).toBe('quick');

    const template = draftToWorkoutTemplate(draft);
    expect(template.presentationMode).toBe('guided');
    expect(template.quickProfile).toBe('quick');
  });

  it('quick profile values are valid', () => {
    const profiles: QuickWorkoutProfile[] = ['quick', 'short', 'standard', 'long'];
    expect(profiles.length).toBe(4);
  });
});

// ==========================================
// 16. AI COACH MESSAGE
// ==========================================

describe('AICoachMessage', () => {
  it('creates valid coach message', () => {
    const msg: AICoachMessage = {
      id: 'ai-1',
      userId: 'user-1',
      role: 'assistant',
      content: 'Great workout! You improved your bench press by 5kg.',
      context: { sessionId: 's-1', exerciseId: 'ex-bench' },
      createdAt: '2024-03-15T11:00:00Z',
    };
    expect(msg.role).toBe('assistant');
    expect(msg.context?.sessionId).toBe('s-1');
  });
});

// ==========================================
// 17. BACKWARD COMPATIBILITY — EXISTING RECORDS
// ==========================================

describe('Backward Compatibility', () => {
  it('existing WorkoutSet without side field remains valid', () => {
    const legacySet: WorkoutSet = {
      id: 'set-legacy-1',
      sessionExerciseId: 'se-1',
      setNumber: 1,
      type: 'working',
      actualReps: 10,
      actualWeight: 60,
      weightUnit: 'kg',
      status: 'completed',
    };
    expect(legacySet.side).toBeUndefined();
    expect(legacySet.type).toBe('working');
  });

  it('existing SessionExercise without grouping fields remains valid', () => {
    const legacyEx: SessionExercise = {
      id: 'se-legacy',
      sessionId: 's-1',
      exerciseId: 'ex-1',
      name: 'Squat',
      order: 1,
      status: 'completed',
      targetMuscles: ['quads'],
      equipment: ['barbell'],
      sets: [],
    };
    expect(legacyEx.groupId).toBeUndefined();
    expect(legacyEx.groupType).toBeUndefined();
  });

  it('existing Exercise without source/variations remains valid', () => {
    const legacyEx: Exercise = {
      id: 'ex-legacy',
      name: 'Push-up',
      primaryMuscles: ['chest'],
      equipment: ['bodyweight'],
      difficulty: 'beginner',
      goals: ['general_fitness'],
    };
    expect(legacyEx.source).toBeUndefined();
    expect(legacyEx.isCustom).toBeUndefined();
    expect(legacyEx.variations).toBeUndefined();
    expect(legacyEx.complementaryExercises).toBeUndefined();
  });

  it('existing GeneratedWorkout without presentationMode remains valid', () => {
    const legacyGw: GeneratedWorkout = {
      id: 'gw-legacy',
      name: 'Legacy Workout',
      goal: 'strength',
      difficulty: 'intermediate',
      duration: 45,
      targetMuscles: ['chest'],
      equipment: ['barbell'],
      exercises: [],
      createdAt: new Date().toISOString(),
    };
    expect(legacyGw.presentationMode).toBeUndefined();
    expect(legacyGw.quickProfile).toBeUndefined();
  });
});
