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
  Program,
  ProgramDay,
  FitnessGoalTarget,
  Challenge,
  ChallengeProgress,
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

export interface ProgramRepository {
  getProgramById(id: string): Promise<Program | null>;
  getActiveProgram(userId?: string): Promise<Program | null>;
  listPrograms(userId?: string): Promise<Program[]>;
  saveProgram(program: Program): Promise<void>;
  deleteProgram(id: string): Promise<void>;
  saveProgramDay(day: ProgramDay): Promise<void>;
  getProgramDayById(id: string): Promise<ProgramDay | null>;
}

export interface GoalRepository {
  getGoalById(id: string): Promise<FitnessGoalTarget | null>;
  listGoals(userId?: string, status?: string): Promise<FitnessGoalTarget[]>;
  saveGoal(goal: FitnessGoalTarget): Promise<void>;
  deleteGoal(id: string): Promise<void>;
}

export interface ChallengeRepository {
  listChallenges(): Promise<Challenge[]>;
  getChallengeById(id: string): Promise<Challenge | null>;
  getUserChallengeProgress(challengeId: string, userId?: string): Promise<ChallengeProgress | null>;
  listUserParticipations(userId?: string): Promise<ChallengeProgress[]>;
  saveChallengeProgress(progress: ChallengeProgress): Promise<void>;
}
