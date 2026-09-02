/**
 * Phase 2L — Adaptive Training Pipeline Types & Contracts
 * 
 * NOTE: Canonical domain models (WorkoutSession, WorkoutSet, Program, Goal, etc.)
 * remain centralized in types/domain.ts. This file contains feature-internal
 * pipeline structures for deterministic adaptation evaluation.
 */

import {
  WorkoutSession,
  SessionExercise,
  WorkoutSet,
  WorkoutFeedback,
  WorkoutTemplate,
  GeneratedWorkout,
  GeneratedWorkoutExercise,
  Program,
  ProgramWeek,
  ProgramDay,
  FitnessGoalTarget,
  FitnessGoal,
  ExperienceLevel,
  Exercise,
  ExerciseVariation,
  MovementPattern,
  SetSide,
} from '@/types/domain';
import { WorkoutDraft, WorkoutDraftExercise } from '@/lib/domain/workout-draft';
import { ExercisePersonalRecords } from '@/lib/domain/personal-records';

export type TrainingConstraint = 'bodyweight_only' | 'home_only' | 'quiet' | 'no_jump';

export interface TrainingPreferences {
  constraints?: TrainingConstraint[];
  preferredEquipment?: string[];
  avoidedMuscles?: string[];
  avoidedJoints?: string[];
}

export const ADAPTIVE_ENGINE_VERSION = '1.0.0';

export type AdaptationDimension =
  | 'load'
  | 'reps'
  | 'sets'
  | 'tempo'
  | 'rest'
  | 'variation'
  | 'unilateral'
  | 'volume_fatigue';

export type AdaptationAction =
  | 'increase_load'
  | 'decrease_load'
  | 'increase_reps'
  | 'decrease_reps'
  | 'increase_sets'
  | 'decrease_sets'
  | 'progress_variation'
  | 'regress_variation'
  | 'adjust_rest'
  | 'anchor_weaker_side'
  | 'maintain';

export interface ExercisePrescription {
  sets: number;
  reps: string | number;
  targetWeightKg?: number;
  restSeconds?: number;
  tempo?: string;
  variationExerciseId?: string;
  variationName?: string;
  notes?: string;
}

export interface HistoricalEvidenceDetails {
  observedSessionsCount: number;
  consecutiveCleanSessions: number;
  consecutiveMissedSessions: number;
  lastLoggedWeightKg?: number;
  lastLoggedReps?: number[];
  averageRpe?: number;
  recentDifficultyRating?: string;
  unilateralAsymmetryDetected?: boolean;
  weakerSide?: SetSide;
  strongerSide?: SetSide;
}

export interface ExerciseAdaptationProposal {
  exerciseId: string;
  exerciseName: string;
  dimension: AdaptationDimension;
  action: AdaptationAction;
  originalPrescription: ExercisePrescription;
  adaptedPrescription: ExercisePrescription;
  ruleId: string;
  confidence: 'high' | 'medium' | 'low';
  rationale: string;
  historicalEvidence: HistoricalEvidenceDetails;
}

export interface WorkoutAdaptationDecision {
  id: string; // Stable hash fingerprint
  fingerprint: string;
  engineVersion: string;
  workoutSource: 'generated' | 'template' | 'program_day' | 'draft';
  sourceEntityId?: string;
  overallDifficultyAdjustment?: {
    originalDifficulty: string;
    suggestedDifficulty: string;
    reason: string;
  };
  exerciseProposals: ExerciseAdaptationProposal[];
  hasAdaptations: boolean;
  summaryText: string;
  evaluationTimestamp: string; // Provided explicitly by caller, never Date.now()
}

export interface AdaptiveContext {
  userId: string;
  evaluationDate: string; // Mandatory explicit ISO timestamp provided by caller
  workoutPlan: GeneratedWorkout | WorkoutTemplate | WorkoutDraft;
  workoutSource: 'generated' | 'template' | 'program_day' | 'draft';
  sourceEntityId?: string;
  programContext?: {
    programId: string;
    programName: string;
    weekNumber: number;
    dayNumber: number;
    programDayId: string;
  };
  recentSessions: WorkoutSession[];
  activeGoals: FitnessGoalTarget[];
  preferences?: TrainingPreferences;
  personalRecords?: Record<string, ExercisePersonalRecords>;
  catalogVersion?: string;
}

export interface ExercisePerformanceHistory {
  exerciseId: string;
  sessionsCount: number;
  recentSets: WorkoutSet[];
  lastCompletedSessionDate?: string;
  consecutiveCleanSessions: number;
  consecutiveMissedSessions: number;
  averageRpe?: number;
  lastWeightKg?: number;
  lastRepsAchieved?: number[];
  isUnilateral: boolean;
  unilateralAsymmetry?: {
    hasAsymmetry: boolean;
    weakerSide: SetSide;
    strongerSide: SetSide;
    repDifference: number;
    loadDifferenceKg: number;
  };
}

export interface PrescriptionValidationResult {
  isValid: boolean;
  errors: string[];
}
