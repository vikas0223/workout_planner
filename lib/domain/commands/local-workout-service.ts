/**
 * Local Workout Service (Compatibility Adapter)
 * Delegates session execution mutations directly to authoritative SessionCommandService
 * and handles template, workout, and favorites repository operations.
 */

import {
  WorkoutTemplate,
  GeneratedWorkout,
  WorkoutSession,
  SessionExercise,
  WorkoutSet,
  WorkoutFeedback,
} from '@/types/domain';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import {
  LocalUserRepository,
  LocalWorkoutRepository,
  LocalCompletionRepository,
  LocalFavoritesRepository,
} from '@/lib/repositories/local';
import { SessionCommandService } from '@/features/workout-session/session-command-service';
import { generateId } from '@/lib/utils/id';

export class LocalWorkoutService {
  private userRepo: LocalUserRepository;
  private workoutRepo: LocalWorkoutRepository;
  private completionRepo: LocalCompletionRepository;
  private favoritesRepo: LocalFavoritesRepository;
  private sessionCommandService: SessionCommandService;

  constructor(engine: IndexedDBEngine = IndexedDBEngine.getInstance()) {
    this.userRepo = new LocalUserRepository(engine);
    this.workoutRepo = new LocalWorkoutRepository(engine);
    this.completionRepo = new LocalCompletionRepository(engine);
    this.favoritesRepo = new LocalFavoritesRepository(engine);
    this.sessionCommandService = new SessionCommandService(this.completionRepo);
  }

  /**
   * Creates and persists a reusable workout template
   */
  public async createWorkoutTemplate(
    template: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<WorkoutTemplate> {
    const id = template.id || generateId();
    const now = new Date().toISOString();

    const fullTemplate: WorkoutTemplate = {
      ...template,
      id,
      isFavorite: template.isFavorite ?? false,
      isCustom: template.isCustom ?? true,
      createdAt: now,
      updatedAt: now,
    };

    await this.workoutRepo.saveTemplate(fullTemplate);
    return fullTemplate;
  }

  /**
   * Persists a generated deterministic workout
   */
  public async saveGeneratedWorkout(
    workout: GeneratedWorkout,
    templateId?: string
  ): Promise<GeneratedWorkout> {
    if (!workout.id) {
      throw new Error('[LocalWorkoutService] GeneratedWorkout requires a valid ID');
    }
    await this.workoutRepo.saveGeneratedWorkout(workout, templateId);
    return workout;
  }

  /**
   * Starts a new workout session (delegates to authoritative SessionCommandService)
   */
  public async startWorkoutSession(params: {
    userId?: string;
    workout: GeneratedWorkout;
    templateId?: string;
  }): Promise<WorkoutSession> {
    return this.sessionCommandService.startSession({
      userId: params.userId,
      workout: params.workout,
      templateId: params.templateId,
    });
  }

  /**
   * Adds an ad-hoc exercise to an active session
   */
  public async createSessionExercise(
    sessionId: string,
    exerciseData: Omit<SessionExercise, 'id' | 'sessionId'>
  ): Promise<SessionExercise> {
    return this.sessionCommandService.addSessionExercise(sessionId, exerciseData);
  }

  /**
   * Logs or updates a specific set
   */
  public async logSet(
    sessionId: string,
    sessionExerciseId: string,
    set: Omit<WorkoutSet, 'id' | 'sessionExerciseId'> & { id?: string }
  ): Promise<WorkoutSet> {
    return this.sessionCommandService.logSet({
      sessionId,
      sessionExerciseId,
      ...set,
    });
  }

  /**
   * Updates an existing set in a session
   */
  public async updateSet(
    sessionId: string,
    sessionExerciseId: string,
    setId: string,
    patch: Partial<WorkoutSet>
  ): Promise<WorkoutSet> {
    return this.sessionCommandService.updateSet({
      sessionId,
      sessionExerciseId,
      setId,
      patch,
    });
  }

  /**
   * Marks an entire exercise as completed in a session
   */
  public async completeExercise(
    sessionId: string,
    sessionExerciseId: string
  ): Promise<SessionExercise> {
    return this.sessionCommandService.completeExercise(sessionId, sessionExerciseId);
  }

  /**
   * Skips an exercise
   */
  public async skipExercise(
    sessionId: string,
    sessionExerciseId: string
  ): Promise<SessionExercise> {
    return this.sessionCommandService.skipExercise(sessionId, sessionExerciseId);
  }

  /**
   * Completes a workout session and calculates duration/volume
   */
  public async completeWorkoutSession(
    sessionId: string,
    options?: { notes?: string; feedback?: WorkoutFeedback }
  ): Promise<WorkoutSession> {
    return this.sessionCommandService.completeSession(sessionId, options);
  }

  /**
   * Saves or removes a favorite
   */
  public async setFavorite(
    entityId: string,
    isFav: boolean,
    userId: string = 'guest_user'
  ): Promise<void> {
    if (isFav) {
      await this.favoritesRepo.addFavorite(entityId, userId);
    } else {
      await this.favoritesRepo.removeFavorite(entityId, userId);
    }
  }

  /**
   * Saves feedback for a workout session
   */
  public async saveFeedback(feedback: WorkoutFeedback): Promise<void> {
    await this.completionRepo.saveFeedback(feedback);
  }
}
