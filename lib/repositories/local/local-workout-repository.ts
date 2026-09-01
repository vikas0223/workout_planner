/**
 * Local Workout Repository (IndexedDB backed)
 * Implements WorkoutRepository for WorkoutTemplate & GeneratedWorkout entities.
 */

import { WorkoutRepository } from '@/lib/repositories/interfaces';
import { WorkoutTemplate, GeneratedWorkout } from '@/types/domain';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import {
  STORES,
  WorkoutTemplateRecord,
  GeneratedWorkoutRecord,
  GeneratedWorkoutExerciseRecord,
} from '@/lib/storage/indexeddb-schema';

export class LocalWorkoutRepository implements WorkoutRepository {
  constructor(private engine: IndexedDBEngine = IndexedDBEngine.getInstance()) {}

  public async getTemplateById(id: string): Promise<WorkoutTemplate | null> {
    try {
      const record = await this.engine.get<WorkoutTemplateRecord>(STORES.WORKOUT_TEMPLATES, id);
      return record && !record.deletedAt ? record.template : null;
    } catch (err) {
      console.warn(`[LocalWorkoutRepository] Failed to getTemplateById id=${id}`, err);
      return null;
    }
  }

  public async listTemplates(userId?: string): Promise<WorkoutTemplate[]> {
    try {
      let records: WorkoutTemplateRecord[];
      if (userId) {
        records = await this.engine.getByIndex<WorkoutTemplateRecord>(
          STORES.WORKOUT_TEMPLATES,
          'ownerId',
          userId
        );
      } else {
        records = await this.engine.getAll<WorkoutTemplateRecord>(STORES.WORKOUT_TEMPLATES);
      }

      return records
        .filter((r) => !r.deletedAt)
        .map((r) => r.template);
    } catch (err) {
      console.warn('[LocalWorkoutRepository] Failed to listTemplates', err);
      return [];
    }
  }

  public async saveTemplate(template: WorkoutTemplate): Promise<void> {
    const now = new Date().toISOString();
    const existing = await this.engine.get<WorkoutTemplateRecord>(
      STORES.WORKOUT_TEMPLATES,
      template.id
    );

    const ownerId = template.userId || 'guest_user';
    const record: WorkoutTemplateRecord = {
      id: template.id,
      ownerKind: template.userId ? 'user' : 'guest',
      ownerId,
      createdAt: existing?.createdAt || template.createdAt || now,
      updatedAt: now,
      clientUpdatedAt: now,
      version: (existing?.version || 0) + 1,
      syncStatus: 'local',
      template: {
        ...template,
        updatedAt: now,
      },
    };

    await this.engine.put(STORES.WORKOUT_TEMPLATES, record);
  }

  public async deleteTemplate(id: string): Promise<void> {
    const existing = await this.engine.get<WorkoutTemplateRecord>(STORES.WORKOUT_TEMPLATES, id);
    if (!existing) return;

    const now = new Date().toISOString();
    const softDeleted: WorkoutTemplateRecord = {
      ...existing,
      deletedAt: now,
      updatedAt: now,
      clientUpdatedAt: now,
      version: existing.version + 1,
      syncStatus: 'local',
    };

    await this.engine.put(STORES.WORKOUT_TEMPLATES, softDeleted);
  }

  public async getGeneratedWorkoutById(id: string): Promise<GeneratedWorkout | null> {
    try {
      const record = await this.engine.get<GeneratedWorkoutRecord>(STORES.GENERATED_WORKOUTS, id);
      if (!record || record.deletedAt) return null;

      // Load associated exercises
      const exRecords = await this.engine.getByIndex<GeneratedWorkoutExerciseRecord>(
        STORES.GENERATED_WORKOUT_EXERCISES,
        'generatedWorkoutId',
        id
      );

      const exercises = exRecords
        .map((r) => r.exercise)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      return {
        ...record.workout,
        exercises: exercises.length > 0 ? exercises : record.workout.exercises,
      };
    } catch (err) {
      console.warn(`[LocalWorkoutRepository] Failed to getGeneratedWorkoutById id=${id}`, err);
      return null;
    }
  }

  public async saveGeneratedWorkout(
    workout: GeneratedWorkout,
    workoutTemplateId?: string
  ): Promise<void> {
    const now = new Date().toISOString();
    const ownerId = 'guest_user';

    await this.engine.transaction(
      [STORES.GENERATED_WORKOUTS, STORES.GENERATED_WORKOUT_EXERCISES],
      'readwrite',
      async (stores) => {
        const workoutStore = stores[STORES.GENERATED_WORKOUTS];
        const exerciseStore = stores[STORES.GENERATED_WORKOUT_EXERCISES];

        const workoutRecord: GeneratedWorkoutRecord = {
          id: workout.id,
          ownerKind: 'guest',
          ownerId,
          createdAt: workout.createdAt || now,
          updatedAt: now,
          clientUpdatedAt: now,
          version: 1,
          syncStatus: 'local',
          workoutTemplateId: workoutTemplateId || null,
          workout,
        };

        workoutStore.put(workoutRecord);

        // Store individual generated workout exercises
        if (workout.exercises && workout.exercises.length > 0) {
          workout.exercises.forEach((exercise, index) => {
            const exRecord: GeneratedWorkoutExerciseRecord = {
              id: exercise.id,
              ownerKind: 'guest',
              ownerId,
              createdAt: now,
              updatedAt: now,
              clientUpdatedAt: now,
              version: 1,
              syncStatus: 'local',
              generatedWorkoutId: workout.id,
              exercise: {
                ...exercise,
                order: exercise.order !== undefined ? exercise.order : index + 1,
              },
            };
            exerciseStore.put(exRecord);
          });
        }
      }
    );
  }
}
