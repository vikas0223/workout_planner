/**
 * Platform Program & Challenge Catalogs
 * Statically defined catalog blueprints.
 * Separates platform catalog definitions from user-owned IndexedDB records.
 * When a user adopts a program or joins a challenge, a user-owned entity is created.
 */

import { Program, Challenge, ExperienceLevel } from '@/types/domain';

export interface CatalogProgramTemplateRef {
  name: string;
  targetMuscles: string[];
  equipment: string[];
  durationMinutes: number;
  exercises: {
    exerciseId: string;
    name: string;
    targetMuscles: string[];
    equipment: string[];
    plannedSets: number;
    plannedReps: string;
    plannedRestSeconds: number;
  }[];
}

export interface CatalogProgramDefinition extends Omit<Program, 'userId' | 'startDate' | 'completedAt' | 'createdAt' | 'updatedAt'> {
  weeksCount: number;
  daysPerWeek: number;
  templateBlueprints: Record<string, CatalogProgramTemplateRef>;
}

export const PLATFORM_PROGRAM_CATALOG: CatalogProgramDefinition[] = [
  {
    id: 'prog_cat_4w_upper_lower',
    name: '4-Week Upper / Lower Strength Split',
    description: 'A classic 4-day undulating periodization program focusing on multi-joint compound strength and progressive overload.',
    goal: 'strength',
    difficulty: 'intermediate' as ExperienceLevel,
    status: 'draft',
    weeksCount: 4,
    daysPerWeek: 4,
    templateBlueprints: {
      'tpl_upper_a': {
        name: 'Upper Body Power (A)',
        targetMuscles: ['Chest', 'Lats', 'Shoulders', 'Triceps'],
        equipment: ['barbell', 'dumbbell'],
        durationMinutes: 45,
        exercises: [
          { exerciseId: 'ex_bench_press', name: 'Barbell Bench Press', targetMuscles: ['Chest', 'Triceps'], equipment: ['barbell'], plannedSets: 4, plannedReps: '5', plannedRestSeconds: 120 },
          { exerciseId: 'ex_barbell_row', name: 'Barbell Bent Over Row', targetMuscles: ['Lats', 'Upper Back', 'Biceps'], equipment: ['barbell'], plannedSets: 4, plannedReps: '6', plannedRestSeconds: 90 },
          { exerciseId: 'ex_overhead_press', name: 'Overhead Shoulder Press', targetMuscles: ['Shoulders', 'Triceps'], equipment: ['barbell'], plannedSets: 3, plannedReps: '8', plannedRestSeconds: 90 },
          { exerciseId: 'ex_pullups', name: 'Pull-Ups', targetMuscles: ['Lats', 'Biceps'], equipment: ['bodyweight'], plannedSets: 3, plannedReps: '8-10', plannedRestSeconds: 90 },
        ],
      },
      'tpl_lower_a': {
        name: 'Lower Body Strength (A)',
        targetMuscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
        equipment: ['barbell'],
        durationMinutes: 45,
        exercises: [
          { exerciseId: 'ex_barbell_squat', name: 'Barbell Back Squat', targetMuscles: ['Quads', 'Glutes'], equipment: ['barbell'], plannedSets: 4, plannedReps: '5', plannedRestSeconds: 120 },
          { exerciseId: 'ex_romanian_deadlift', name: 'Romanian Deadlift', targetMuscles: ['Hamstrings', 'Glutes', 'Lower Back'], equipment: ['barbell'], plannedSets: 3, plannedReps: '8', plannedRestSeconds: 90 },
          { exerciseId: 'ex_walking_lunges', name: 'Walking Dumbbell Lunges', targetMuscles: ['Quads', 'Glutes'], equipment: ['dumbbell'], plannedSets: 3, plannedReps: '10', plannedRestSeconds: 60 },
          { exerciseId: 'ex_calf_raises', name: 'Standing Calf Raises', targetMuscles: ['Calves'], equipment: ['bodyweight'], plannedSets: 3, plannedReps: '15', plannedRestSeconds: 45 },
        ],
      },
      'tpl_upper_b': {
        name: 'Upper Body Hypertrophy (B)',
        targetMuscles: ['Chest', 'Shoulders', 'Arms', 'Back'],
        equipment: ['dumbbell', 'bodyweight'],
        durationMinutes: 40,
        exercises: [
          { exerciseId: 'ex_incline_dumbbell_press', name: 'Incline Dumbbell Press', targetMuscles: ['Chest', 'Shoulders'], equipment: ['dumbbell'], plannedSets: 3, plannedReps: '10', plannedRestSeconds: 75 },
          { exerciseId: 'ex_dumbbell_row', name: 'Single-Arm Dumbbell Row', targetMuscles: ['Lats', 'Upper Back'], equipment: ['dumbbell'], plannedSets: 3, plannedReps: '10', plannedRestSeconds: 75 },
          { exerciseId: 'ex_dips', name: 'Chest Dips', targetMuscles: ['Chest', 'Triceps'], equipment: ['bodyweight'], plannedSets: 3, plannedReps: '10-12', plannedRestSeconds: 60 },
          { exerciseId: 'ex_bicep_curls', name: 'Dumbbell Bicep Curls', targetMuscles: ['Biceps'], equipment: ['dumbbell'], plannedSets: 3, plannedReps: '12', plannedRestSeconds: 60 },
        ],
      },
      'tpl_lower_b': {
        name: 'Lower Body Hypertrophy (B)',
        targetMuscles: ['Hamstrings', 'Glutes', 'Quads', 'Core'],
        equipment: ['barbell', 'dumbbell'],
        durationMinutes: 40,
        exercises: [
          { exerciseId: 'ex_deadlift', name: 'Conventional Deadlift', targetMuscles: ['Hamstrings', 'Glutes', 'Lower Back'], equipment: ['barbell'], plannedSets: 3, plannedReps: '5', plannedRestSeconds: 120 },
          { exerciseId: 'ex_goblet_squat', name: 'Goblet Squat', targetMuscles: ['Quads', 'Glutes'], equipment: ['dumbbell'], plannedSets: 3, plannedReps: '12', plannedRestSeconds: 60 },
          { exerciseId: 'ex_hip_thrust', name: 'Barbell Hip Thrust', targetMuscles: ['Glutes'], equipment: ['barbell'], plannedSets: 3, plannedReps: '10', plannedRestSeconds: 90 },
          { exerciseId: 'ex_plank', name: 'Standard Plank', targetMuscles: ['Core'], equipment: ['bodyweight'], plannedSets: 3, plannedReps: '60s', plannedRestSeconds: 45 },
        ],
      },
    },
    weeks: Array.from({ length: 4 }, (_, wIdx) => ({
      id: `pw_4w_${wIdx + 1}`,
      programId: 'prog_cat_4w_upper_lower',
      weekNumber: wIdx + 1,
      label: `Week ${wIdx + 1}`,
      days: [
        { id: `pd_4w_${wIdx + 1}_1`, programId: 'prog_cat_4w_upper_lower', programWeekId: `pw_4w_${wIdx + 1}`, dayNumber: 1, type: 'workout', label: 'Upper Power', workoutTemplateId: 'tpl_upper_a', status: 'planned' },
        { id: `pd_4w_${wIdx + 1}_2`, programId: 'prog_cat_4w_upper_lower', programWeekId: `pw_4w_${wIdx + 1}`, dayNumber: 2, type: 'workout', label: 'Lower Strength', workoutTemplateId: 'tpl_lower_a', status: 'planned' },
        { id: `pd_4w_${wIdx + 1}_3`, programId: 'prog_cat_4w_upper_lower', programWeekId: `pw_4w_${wIdx + 1}`, dayNumber: 3, type: 'rest', label: 'Rest Day', status: 'planned' },
        { id: `pd_4w_${wIdx + 1}_4`, programId: 'prog_cat_4w_upper_lower', programWeekId: `pw_4w_${wIdx + 1}`, dayNumber: 4, type: 'workout', label: 'Upper Hypertrophy', workoutTemplateId: 'tpl_upper_b', status: 'planned' },
        { id: `pd_4w_${wIdx + 1}_5`, programId: 'prog_cat_4w_upper_lower', programWeekId: `pw_4w_${wIdx + 1}`, dayNumber: 5, type: 'workout', label: 'Lower Hypertrophy', workoutTemplateId: 'tpl_lower_b', status: 'planned' },
        { id: `pd_4w_${wIdx + 1}_6`, programId: 'prog_cat_4w_upper_lower', programWeekId: `pw_4w_${wIdx + 1}`, dayNumber: 6, type: 'mobility', label: 'Mobility & Stretch', status: 'planned' },
        { id: `pd_4w_${wIdx + 1}_7`, programId: 'prog_cat_4w_upper_lower', programWeekId: `pw_4w_${wIdx + 1}`, dayNumber: 7, type: 'recovery', label: 'Active Recovery', status: 'planned' },
      ],
    })),
  },
  {
    id: 'prog_cat_6w_full_body',
    name: '6-Week Full Body Hypertrophy',
    description: 'High frequency 3-day full body training stimulating major muscle groups every 48 hours for optimal muscle growth.',
    goal: 'hypertrophy',
    difficulty: 'beginner' as ExperienceLevel,
    status: 'draft',
    weeksCount: 6,
    daysPerWeek: 3,
    templateBlueprints: {
      'tpl_full_a': {
        name: 'Full Body Foundations (A)',
        targetMuscles: ['Chest', 'Quads', 'Lats', 'Core'],
        equipment: ['barbell', 'dumbbell'],
        durationMinutes: 40,
        exercises: [
          { exerciseId: 'ex_barbell_squat', name: 'Barbell Back Squat', targetMuscles: ['Quads', 'Glutes'], equipment: ['barbell'], plannedSets: 3, plannedReps: '8', plannedRestSeconds: 90 },
          { exerciseId: 'ex_bench_press', name: 'Barbell Bench Press', targetMuscles: ['Chest', 'Triceps'], equipment: ['barbell'], plannedSets: 3, plannedReps: '8', plannedRestSeconds: 90 },
          { exerciseId: 'ex_barbell_row', name: 'Barbell Bent Over Row', targetMuscles: ['Lats', 'Upper Back'], equipment: ['barbell'], plannedSets: 3, plannedReps: '10', plannedRestSeconds: 75 },
          { exerciseId: 'ex_plank', name: 'Standard Plank', targetMuscles: ['Core'], equipment: ['bodyweight'], plannedSets: 3, plannedReps: '45s', plannedRestSeconds: 45 },
        ],
      },
      'tpl_full_b': {
        name: 'Full Body Density (B)',
        targetMuscles: ['Hamstrings', 'Shoulders', 'Arms'],
        equipment: ['barbell', 'dumbbell'],
        durationMinutes: 40,
        exercises: [
          { exerciseId: 'ex_deadlift', name: 'Conventional Deadlift', targetMuscles: ['Hamstrings', 'Lower Back'], equipment: ['barbell'], plannedSets: 3, plannedReps: '6', plannedRestSeconds: 120 },
          { exerciseId: 'ex_overhead_press', name: 'Overhead Shoulder Press', targetMuscles: ['Shoulders', 'Triceps'], equipment: ['barbell'], plannedSets: 3, plannedReps: '8', plannedRestSeconds: 90 },
          { exerciseId: 'ex_pullups', name: 'Pull-Ups', targetMuscles: ['Lats', 'Biceps'], equipment: ['bodyweight'], plannedSets: 3, plannedReps: '8-10', plannedRestSeconds: 90 },
          { exerciseId: 'ex_bicep_curls', name: 'Dumbbell Bicep Curls', targetMuscles: ['Biceps'], equipment: ['dumbbell'], plannedSets: 3, plannedReps: '12', plannedRestSeconds: 60 },
        ],
      },
      'tpl_full_c': {
        name: 'Full Body Pump (C)',
        targetMuscles: ['Chest', 'Back', 'Glutes', 'Calves'],
        equipment: ['dumbbell', 'bodyweight'],
        durationMinutes: 35,
        exercises: [
          { exerciseId: 'ex_goblet_squat', name: 'Goblet Squat', targetMuscles: ['Quads', 'Glutes'], equipment: ['dumbbell'], plannedSets: 3, plannedReps: '12', plannedRestSeconds: 60 },
          { exerciseId: 'ex_incline_dumbbell_press', name: 'Incline Dumbbell Press', targetMuscles: ['Chest', 'Shoulders'], equipment: ['dumbbell'], plannedSets: 3, plannedReps: '10', plannedRestSeconds: 60 },
          { exerciseId: 'ex_dumbbell_row', name: 'Single-Arm Dumbbell Row', targetMuscles: ['Lats'], equipment: ['dumbbell'], plannedSets: 3, plannedReps: '12', plannedRestSeconds: 60 },
          { exerciseId: 'ex_calf_raises', name: 'Standing Calf Raises', targetMuscles: ['Calves'], equipment: ['bodyweight'], plannedSets: 3, plannedReps: '15', plannedRestSeconds: 45 },
        ],
      },
    },
    weeks: Array.from({ length: 6 }, (_, wIdx) => ({
      id: `pw_6w_${wIdx + 1}`,
      programId: 'prog_cat_6w_full_body',
      weekNumber: wIdx + 1,
      label: `Week ${wIdx + 1}`,
      days: [
        { id: `pd_6w_${wIdx + 1}_1`, programId: 'prog_cat_6w_full_body', programWeekId: `pw_6w_${wIdx + 1}`, dayNumber: 1, type: 'workout', label: 'Full Body A', workoutTemplateId: 'tpl_full_a', status: 'planned' },
        { id: `pd_6w_${wIdx + 1}_2`, programId: 'prog_cat_6w_full_body', programWeekId: `pw_6w_${wIdx + 1}`, dayNumber: 2, type: 'rest', label: 'Rest Day', status: 'planned' },
        { id: `pd_6w_${wIdx + 1}_3`, programId: 'prog_cat_6w_full_body', programWeekId: `pw_6w_${wIdx + 1}`, dayNumber: 3, type: 'workout', label: 'Full Body B', workoutTemplateId: 'tpl_full_b', status: 'planned' },
        { id: `pd_6w_${wIdx + 1}_4`, programId: 'prog_cat_6w_full_body', programWeekId: `pw_6w_${wIdx + 1}`, dayNumber: 4, type: 'rest', label: 'Rest Day', status: 'planned' },
        { id: `pd_6w_${wIdx + 1}_5`, programId: 'prog_cat_6w_full_body', programWeekId: `pw_6w_${wIdx + 1}`, dayNumber: 5, type: 'workout', label: 'Full Body C', workoutTemplateId: 'tpl_full_c', status: 'planned' },
        { id: `pd_6w_${wIdx + 1}_6`, programId: 'prog_cat_6w_full_body', programWeekId: `pw_6w_${wIdx + 1}`, dayNumber: 6, type: 'recovery', label: 'Active Recovery', status: 'planned' },
        { id: `pd_6w_${wIdx + 1}_7`, programId: 'prog_cat_6w_full_body', programWeekId: `pw_6w_${wIdx + 1}`, dayNumber: 7, type: 'rest', label: 'Rest Day', status: 'planned' },
      ],
    })),
  },
  {
    id: 'prog_cat_3w_home_core',
    name: '3-Week Home Mobility & Core Foundation',
    description: 'No equipment needed. Strengthen core stability, improve hip and thoracic mobility, and establish daily movement habits.',
    goal: 'endurance',
    difficulty: 'beginner' as ExperienceLevel,
    status: 'draft',
    weeksCount: 3,
    daysPerWeek: 3,
    templateBlueprints: {
      'tpl_home_core': {
        name: 'Core Stability Matrix',
        targetMuscles: ['Core', 'Abs', 'Glutes'],
        equipment: ['bodyweight'],
        durationMinutes: 25,
        exercises: [
          { exerciseId: 'ex_plank', name: 'Standard Plank', targetMuscles: ['Core'], equipment: ['bodyweight'], plannedSets: 3, plannedReps: '45s', plannedRestSeconds: 45 },
          { exerciseId: 'ex_pushups', name: 'Push-Ups', targetMuscles: ['Chest', 'Triceps', 'Core'], equipment: ['bodyweight'], plannedSets: 3, plannedReps: '12', plannedRestSeconds: 60 },
          { exerciseId: 'ex_walking_lunges', name: 'Bodyweight Walking Lunges', targetMuscles: ['Quads', 'Glutes'], equipment: ['bodyweight'], plannedSets: 3, plannedReps: '12', plannedRestSeconds: 45 },
        ],
      },
      'tpl_home_mobility': {
        name: 'Mobility & Movement Reset',
        targetMuscles: ['Hamstrings', 'Hips', 'Shoulders'],
        equipment: ['bodyweight'],
        durationMinutes: 20,
        exercises: [
          { exerciseId: 'ex_pullups', name: 'Dead Hang / Assisted Pull-Up', targetMuscles: ['Lats', 'Shoulders'], equipment: ['bodyweight'], plannedSets: 3, plannedReps: '30s', plannedRestSeconds: 45 },
          { exerciseId: 'ex_calf_raises', name: 'Standing Calf Raises', targetMuscles: ['Calves'], equipment: ['bodyweight'], plannedSets: 3, plannedReps: '20', plannedRestSeconds: 30 },
        ],
      },
    },
    weeks: Array.from({ length: 3 }, (_, wIdx) => ({
      id: `pw_3w_${wIdx + 1}`,
      programId: 'prog_cat_3w_home_core',
      weekNumber: wIdx + 1,
      label: `Week ${wIdx + 1}`,
      days: [
        { id: `pd_3w_${wIdx + 1}_1`, programId: 'prog_cat_3w_home_core', programWeekId: `pw_3w_${wIdx + 1}`, dayNumber: 1, type: 'workout', label: 'Core Stability', workoutTemplateId: 'tpl_home_core', status: 'planned' },
        { id: `pd_3w_${wIdx + 1}_2`, programId: 'prog_cat_3w_home_core', programWeekId: `pw_3w_${wIdx + 1}`, dayNumber: 2, type: 'mobility', label: 'Mobility Reset', workoutTemplateId: 'tpl_home_mobility', status: 'planned' },
        { id: `pd_3w_${wIdx + 1}_3`, programId: 'prog_cat_3w_home_core', programWeekId: `pw_3w_${wIdx + 1}`, dayNumber: 3, type: 'rest', label: 'Rest Day', status: 'planned' },
        { id: `pd_3w_${wIdx + 1}_4`, programId: 'prog_cat_3w_home_core', programWeekId: `pw_3w_${wIdx + 1}`, dayNumber: 4, type: 'workout', label: 'Core Power', workoutTemplateId: 'tpl_home_core', status: 'planned' },
        { id: `pd_3w_${wIdx + 1}_5`, programId: 'prog_cat_3w_home_core', programWeekId: `pw_3w_${wIdx + 1}`, dayNumber: 5, type: 'rest', label: 'Rest Day', status: 'planned' },
        { id: `pd_3w_${wIdx + 1}_6`, programId: 'prog_cat_3w_home_core', programWeekId: `pw_3w_${wIdx + 1}`, dayNumber: 6, type: 'recovery', label: 'Active Recovery', status: 'planned' },
        { id: `pd_3w_${wIdx + 1}_7`, programId: 'prog_cat_3w_home_core', programWeekId: `pw_3w_${wIdx + 1}`, dayNumber: 7, type: 'rest', label: 'Rest Day', status: 'planned' },
      ],
    })),
  },
];

export const PLATFORM_CHALLENGE_CATALOG: Challenge[] = [
  {
    id: 'chal_cat_7d_consistency',
    name: '7-Day Consistency Kickoff',
    description: 'Complete 4 workouts over a 7-day period to build immediate training momentum.',
    type: 'workout_count',
    targetValue: 4,
    unit: 'workouts',
    durationDays: 7,
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-12-31T23:59:59.999Z',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'chal_cat_100_sets',
    name: 'Century Club: 100 Performed Sets',
    description: 'Log 100 working sets across any completed workout sessions.',
    type: 'set_count',
    targetValue: 100,
    unit: 'sets',
    durationDays: 30,
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-12-31T23:59:59.999Z',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'chal_cat_10_workouts',
    name: 'Iron Milestone: 10 Workouts',
    description: 'Complete 10 total workout sessions across any routines or programs.',
    type: 'workout_count',
    targetValue: 10,
    unit: 'workouts',
    durationDays: 30,
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-12-31T23:59:59.999Z',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'chal_cat_5d_streak',
    name: 'Streak Starter: 5-Day Workout Streak',
    description: 'Build a continuous 5-day active workout streak.',
    type: 'streak',
    targetValue: 5,
    unit: 'days',
    durationDays: 14,
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-12-31T23:59:59.999Z',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'chal_cat_10t_volume',
    name: 'Titan Volume: 10,000 kg Moved',
    description: 'Accumulate 10,000 kg in total load volume across your workouts.',
    type: 'volume',
    targetValue: 10000,
    unit: 'kg',
    durationDays: 30,
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-12-31T23:59:59.999Z',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];
