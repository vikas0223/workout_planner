/**
 * Repository Interfaces for Persistence Boundary
 * Prepares repository abstraction before IndexedDB & Supabase Sync in later phases.
 */

import {
  UserProfile,
  WorkoutTemplate,
  GeneratedWorkout,
  WorkoutSession,
  SessionExercise,
  WorkoutSet,
  WorkoutFeedback,
  PreviousPerformanceSummary,
} from '@/types/domain';

export interface UserRepository {
  getProfile(id: string): Promise<UserProfile | null>;
  saveProfile(profile: UserProfile): Promise<void>;
  listReturningUsers(): Promise<string[]>;
}

export interface WorkoutRepository {
  getTemplateById(id: string): Promise<WorkoutTemplate | null>;
  listTemplates(userId?: string): Promise<WorkoutTemplate[]>;
  saveTemplate(template: WorkoutTemplate): Promise<void>;
  deleteTemplate(id: string): Promise<void>;
  getGeneratedWorkoutById(id: string): Promise<GeneratedWorkout | null>;
  saveGeneratedWorkout(workout: GeneratedWorkout): Promise<void>;
}

export interface SessionFilterOptions {
  userId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface CompletionRepository {
  getSessionById(id: string): Promise<WorkoutSession | null>;
  getActiveSession(userId?: string): Promise<WorkoutSession | null>;
  listSessions(filterOrUserId?: SessionFilterOptions | string): Promise<WorkoutSession[]>;
  saveSession(session: WorkoutSession): Promise<void>;
  saveFeedback(feedback: WorkoutFeedback): Promise<void>;
  getSessionExercises?(sessionId: string): Promise<SessionExercise[]>;
  getSets?(sessionExerciseId: string): Promise<WorkoutSet[]>;
  getPreviousPerformance?(exerciseId: string, userId?: string): Promise<PreviousPerformanceSummary | null>;
}

export interface FavoritesRepository {
  listFavorites(userId?: string): Promise<string[]>;
  addFavorite(exerciseOrWorkoutId: string, userId?: string): Promise<void>;
  removeFavorite(exerciseOrWorkoutId: string, userId?: string): Promise<void>;
  isFavorite(exerciseOrWorkoutId: string, userId?: string): Promise<boolean>;
}
