/**
 * IndexedDB Schema & Entity Types for Workout Planner
 * Canonical storage contracts matching docs/offline-sync-design.md
 */

import {
  UserProfile,
  Exercise,
  Muscle,
  Equipment,
  Joint,
  WorkoutTemplate,
  GeneratedWorkout,
  GeneratedWorkoutExercise,
  WorkoutSession,
  SessionExercise,
  WorkoutSet,
  WorkoutFeedback,
  RecommendationEvent,
  Program,
  ProgramWeek,
  ProgramDay,
  ProgramDayStatus,
  FitnessGoalTarget,
  Challenge,
  ChallengeProgress,
} from '@/types/domain';

export type OwnerKind = 'guest' | 'user';
export type SyncStatus = 'local' | 'queued' | 'syncing' | 'synced' | 'conflict' | 'error';

export interface LocalRecordMeta {
  id: string;
  ownerKind: OwnerKind;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  clientUpdatedAt: string;
  deletedAt?: string | null;
  version: number;
  syncStatus: SyncStatus;
  lastSyncedAt?: string | null;
}

export interface MetaRecord {
  key: string;
  value: string | number | boolean | null | Record<string, unknown>;
  updatedAt: string;
}

export interface LocalProfileRecord extends LocalRecordMeta {
  profile: UserProfile;
  isCurrentGuest: boolean;
}

export interface WorkoutTemplateRecord extends LocalRecordMeta {
  template: WorkoutTemplate;
}

export interface GeneratedWorkoutRecord extends LocalRecordMeta {
  workout: GeneratedWorkout;
  workoutTemplateId?: string | null;
}

export interface GeneratedWorkoutExerciseRecord extends LocalRecordMeta {
  exercise: GeneratedWorkoutExercise;
  generatedWorkoutId: string;
}

export interface WorkoutSessionRecord extends LocalRecordMeta {
  session: WorkoutSession;
  generatedWorkoutId?: string | null;
  workoutTemplateId?: string | null;
}

export interface SessionExerciseRecord extends LocalRecordMeta {
  sessionExercise: SessionExercise;
  workoutSessionId: string;
  exerciseId: string;
}

export interface SetRecord extends LocalRecordMeta {
  set: WorkoutSet;
  workoutSessionId: string;
  sessionExerciseId: string;
  setNumber: number;
}

export interface LocalProgramRecord extends LocalRecordMeta {
  program: Program;
}

export interface LocalProgramWeekRecord extends LocalRecordMeta {
  programWeek: ProgramWeek;
  programId: string;
  weekNumber: number;
}

export interface LocalProgramDayRecord extends LocalRecordMeta {
  programDay: ProgramDay;
  programId: string;
  programWeekId: string;
  dayNumber: number;
  workoutTemplateId?: string | null;
  status: ProgramDayStatus;
}

export interface LocalFitnessGoalRecord extends LocalRecordMeta {
  goal: FitnessGoalTarget;
}

export interface LocalChallengeRecord extends LocalRecordMeta {
  challenge: Challenge;
}

export interface LocalChallengeProgressRecord extends LocalRecordMeta {
  progress: ChallengeProgress;
  challengeId: string;
}

export interface FavoriteRecord extends LocalRecordMeta {
  entityId: string;
  entityType: 'exercise' | 'workout';
}

export interface RecommendationEventRecord extends LocalRecordMeta {
  event: RecommendationEvent;
}

export interface AICoachCacheRecord {
  id: string;
  promptHash: string;
  response: string;
  createdAt: string;
  expiresAt: string;
}

export interface SyncQueueRecord {
  id: string;
  operation: 'insert' | 'update' | 'delete' | 'upsert';
  entityType: string;
  entityId: string;
  idempotencyKey: string;
  payload: Record<string, unknown>;
  baseVersion: number;
  baseUpdatedAt: string;
  retryCount: number;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'conflict' | 'dead';
  createdAt: string;
  updatedAt: string;
  nextAttemptAt: string;
  lastAttemptAt?: string | null;
  processedAt?: string | null;
  errorData?: Record<string, unknown> | null;
}

export interface SyncConflictRecord {
  id: string;
  entityType: string;
  entityId: string;
  localPayload: Record<string, unknown>;
  remotePayload: Record<string, unknown>;
  resolved: boolean;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface SyncCursorRecord {
  storeName: string;
  lastRemoteCursor?: string | null;
  lastLocalCursor?: string | null;
  updatedAt: string;
}

export interface OutboxLockRecord {
  lockKey: string;
  lockedAt: string;
  expiresAt: string;
}

export const DB_NAME = 'workout_planner';
export const DB_VERSION = 2;

export const STORES = {
  META: 'meta',
  LOCAL_PROFILES: 'local_profiles',
  EXERCISE_CATALOG: 'exercise_catalog',
  MUSCLE_CATALOG: 'muscle_catalog',
  EQUIPMENT_CATALOG: 'equipment_catalog',
  JOINT_CATALOG: 'joint_catalog',
  EXERCISE_MUSCLES: 'exercise_muscles',
  EXERCISE_EQUIPMENT: 'exercise_equipment',
  EXERCISE_JOINTS: 'exercise_joints',
  EXERCISE_MEDIA: 'exercise_media',
  EXERCISE_ALTERNATIVES: 'exercise_alternatives',
  WORKOUT_TEMPLATES: 'workout_templates',
  GENERATED_WORKOUTS: 'generated_workouts',
  GENERATED_WORKOUT_EXERCISES: 'generated_workout_exercises',
  WORKOUT_SESSIONS: 'workout_sessions',
  SESSION_EXERCISES: 'session_exercises',
  SETS: 'sets',
  PROGRAMS: 'programs',
  PROGRAM_WEEKS: 'program_weeks',
  PROGRAM_DAYS: 'program_days',
  FITNESS_GOALS: 'fitness_goals',
  CHALLENGES: 'challenges',
  CHALLENGE_PROGRESS: 'challenge_progress',
  FAVORITES: 'favorites',
  RECOMMENDATION_EVENTS: 'recommendation_events',
  AI_COACH_CACHE: 'ai_coach_cache',
  SYNC_QUEUE: 'sync_queue',
  SYNC_CONFLICTS: 'sync_conflicts',
  SYNC_CURSORS: 'sync_cursors',
  OUTBOX_LOCKS: 'outbox_locks',
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];
