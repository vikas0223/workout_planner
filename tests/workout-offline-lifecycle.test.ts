/**
 * Phase 2H: Offline Workout Creation & Execution Lifecycle Tests
 * 
 * Verifies full offline operation:
 * Create template offline -> start offline -> log sets offline -> complete offline
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { LocalWorkoutRepository } from '@/lib/repositories/local/local-workout-repository';
import { SessionCommandService } from '@/features/workout-session/session-command-service';
import { LocalCompletionRepository } from '@/lib/repositories/local/local-completion-repository';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { draftToWorkoutTemplate, createEmptyWorkoutDraft } from '@/lib/domain/workout-draft';

describe('Phase 2H: Offline Workout Creation & Session Lifecycle', () => {
  let workoutRepo: LocalWorkoutRepository;
  let sessionService: SessionCommandService;
  let completionRepo: LocalCompletionRepository;

  beforeEach(() => {
    setupMockIndexedDB();
    IndexedDBEngine.resetInstance();
    workoutRepo = new LocalWorkoutRepository();
    sessionService = new SessionCommandService();
    completionRepo = new LocalCompletionRepository();
  });

  it('runs complete workout creation, execution, and completion offline with full data persistence', async () => {
    // 1. Create template offline
    const draft = createEmptyWorkoutDraft();
    draft.name = 'Offline Push Day';
    draft.goal = 'hypertrophy';
    draft.duration = 40;
    draft.exercises = [
      {
        id: 'ex_offline_1',
        exerciseId: 'pushup',
        name: 'Push-up',
        sets: 3,
        reps: '15',
        rest: '60s',
        targetMuscles: ['Chest'],
        equipment: ['Bodyweight'],
        order: 0,
      },
      {
        id: 'ex_offline_2',
        exerciseId: 'dips',
        name: 'Tricep Dips',
        sets: 3,
        reps: '12',
        rest: '60s',
        targetMuscles: ['Triceps'],
        equipment: ['Bodyweight'],
        order: 1,
      },
    ];

    const template = draftToWorkoutTemplate(draft, 'user_offline_123');
    await workoutRepo.saveTemplate(template);

    // 2. Reload saved template
    const reloaded = await workoutRepo.getTemplateById(template.id);
    expect(reloaded).toBeDefined();
    expect(reloaded?.name).toBe('Offline Push Day');

    // 3. Start session from template
    const session = await sessionService.startSession({
      name: reloaded!.name,
      workout: reloaded!,
      templateId: reloaded!.id,
      userId: 'user_offline_123',
    });

    expect(session.status).toBe('active');
    const pushupSessionExId = session.exercises[0].id;
    const dipsSessionExId = session.exercises[1].id;

    // 4. Log sets offline
    await sessionService.logSet({
      sessionId: session.id,
      sessionExerciseId: pushupSessionExId,
      setNumber: 1,
      actualReps: 15,
    });
    await sessionService.logSet({
      sessionId: session.id,
      sessionExerciseId: pushupSessionExId,
      setNumber: 2,
      actualReps: 15,
    });
    await sessionService.completeExercise(session.id, pushupSessionExId);

    await sessionService.logSet({
      sessionId: session.id,
      sessionExerciseId: dipsSessionExId,
      setNumber: 1,
      actualReps: 12,
    });
    await sessionService.completeExercise(session.id, dipsSessionExId);

    // 5. Complete session offline
    const completed = await sessionService.completeSession(session.id);
    expect(completed.status).toBe('completed');

    // 6. Verify local persistence
    const persistedSession = await completionRepo.getSessionById(session.id);
    expect(persistedSession).toBeDefined();
    expect(persistedSession?.status).toBe('completed');
    expect(persistedSession?.exercises[0].sets?.length).toBe(2);
    expect(persistedSession?.exercises[1].sets?.length).toBe(1);
  });
});
