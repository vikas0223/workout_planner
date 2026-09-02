/**
 * Recommendation Engine Internal Types & Pipeline Contracts
 *
 * NOTE: Canonical domain models (Recommendation, RecommendationEvent, RecommendationId)
 * are defined in types/domain.ts. This file contains feature-internal pipeline structures.
 */

import {
  UserProfile,
  WorkoutSession,
  SessionExercise,
  WorkoutSet,
  WorkoutFeedback,
  FitnessGoalTarget,
  Program,
  Challenge,
  ChallengeProgress,
  TrainingPreferences,
  TrainingConstraint,
  Recommendation,
  RecommendationEvent,
  FitnessGoal,
  ExperienceLevel,
} from '@/types/domain';
import { ExercisePersonalRecords } from '@/lib/domain/personal-records';
import { AggregatedProgressMetrics } from '@/lib/domain/progress-analytics';

export const RECOMMENDATION_ENGINE_VERSION = '1.0.0';

export type RecommendationCategory =
  | 'progress_load'
  | 'reduce_load'
  | 'change_reps'
  | 'swap_exercise'
  | 'adjust_volume'
  | 'choose_workout'
  | 'recovery_day'
  | 'goal_alignment'
  | 'consistency';

export type RecommendationConfidence = 'high' | 'medium' | 'low';

export interface RecommendationScoreBreakdown {
  goalAlignment: number; // Max 30
  performance: number; // Max 25
  preference: number; // Max 20
  consistency: number; // Max 15
  recency: number; // Max 10
  total: number; // Max 100
}

export interface RecommendationEvidence {
  summary: string;
  sourceSessionsCount?: number;
  metricReference?: string;
  observedPattern?: string;
  relevantExerciseId?: string;
  relevantExerciseName?: string;
}

export interface RecommendationActionPayload {
  type:
    | 'increase_weight'
    | 'reduce_weight'
    | 'adjust_reps'
    | 'substitute_exercise'
    | 'adjust_sets'
    | 'start_program_day'
    | 'start_recovery_session'
    | 'view_goal'
    | 'view_schedule';
  exerciseId?: string;
  replacementExerciseId?: string;
  suggestedWeightDeltaKg?: number;
  suggestedRepsTarget?: number;
  suggestedSetsDelta?: number;
  programId?: string;
  programDayId?: string;
  goalId?: string;
  navigationTarget?: string;
}

export interface DeterministicRecommendation {
  id: string; // Deterministic fingerprint
  fingerprint: string;
  category: RecommendationCategory;
  ruleId: string;
  title: string;
  description: string;
  explanation: string;
  confidence: RecommendationConfidence;
  score: number;
  scoreBreakdown: RecommendationScoreBreakdown;
  evidence: RecommendationEvidence;
  actionPayload: RecommendationActionPayload;
  targetEntityId?: string; // e.g. exerciseId, programId, goalId
  targetMuscleGroups?: string[];
  targetEquipment?: string[];
  difficulty?: ExperienceLevel | string;
  estimatedDurationMinutes?: number;
  createdAt: string;
}

export interface RecommendationContext {
  userId?: string;
  userProfile?: UserProfile | null;
  trainingPreferences?: TrainingPreferences | null;
  constraints?: TrainingConstraint[];
  recentSessions: WorkoutSession[];
  recentFeedback?: WorkoutFeedback[];
  goals?: FitnessGoalTarget[];
  activeProgram?: Program | null;
  personalRecords?: Record<string, ExercisePersonalRecords>;
  progressMetrics?: AggregatedProgressMetrics | null;
  challenges?: { challenge: Challenge; progress: ChallengeProgress }[];
  activeSession?: WorkoutSession | null;
  recentEvents?: RecommendationEvent[];
  dismissedFingerprints?: Set<string>;
  currentTime?: string;
  catalogVersion?: string;
  engineVersion?: string;
}

export interface RecommendationRuleResult {
  eligible: boolean;
  candidate?: Omit<DeterministicRecommendation, 'id' | 'fingerprint' | 'score' | 'scoreBreakdown' | 'createdAt'>;
  scoreBreakdown?: Partial<RecommendationScoreBreakdown>;
}
