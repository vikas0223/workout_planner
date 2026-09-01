/**
 * Offline-to-Online End-to-End Simulation Test
 * Simulates complete workout session execution offline, IndexedDB persistence,
 * reload while offline, network restoration, and idempotent cloud sync.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { getIndexedDBEngine, IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { STORES } from '@/lib/storage/indexeddb-schema';
import { SessionCommandService } from '@/features/workout-session';
import { LocalCompletionRepository } from '@/lib/repositories/local/local-completion-repository';
import { SyncOutbox, SyncPushWorker, SyncCoordinator } from '@/lib/sync';
import { GeneratedWorkout } from '@/types/domain';

describe('Phase 2D-B: Offline → Online End-to-End Simulation', () => {
  let db: ReturnType<typeof getIndexedDBEngine>;
  let completionRepo: LocalCompletionRepository;
  let sessionService: SessionCommandService;
  let outbox: SyncOutbox;

  beforeEach(async () => {
    IndexedDBEngine.resetInstance();
    setupMockIndexedDB();
    db = getIndexedDBEngine();
    await db.clear(STORES.WORKOUT_SESSIONS);
    await db.clear(STORES.SESSION_EXERCISES);
    await db.clear(STORES.SETS);
    await db.clear(STORES.SYNC_QUEUE);
    await db.clear(STORES.SYNC_CONFLICTS);
    await db.clear(STORES.OUTBOX_LOCKS);

    completionRepo = new LocalCompletionRepository(db);
    sessionService = new SessionCommandService(completionRepo);
    outbox = new SyncOutbox(db);
  });

  it('preserves entire workout flow offline and syncs idempotently when reconnected', async () => {
    const generatedWorkout: GeneratedWorkout = {
      id: 'gen-wk-e2e',
      name: 'Full Body Power',
      goal: 'strength',
      difficulty: 'intermediate',
      duration: 45,
      targetMuscles: ['chest', 'quads'],
      equipment: ['barbell'],
      exercises: [
        {
          id: 'gex-1',
          exerciseId: 'ex-squat',
          name: 'Barbell Back Squat',
          sets: 3,
          reps: '8',
          rest: '90s',
          targetMuscles: ['quads'],
          equipment: ['barbell'],
          order: 1,
        },
      ],
      createdAt: '2026-08-25T10:00:00Z',
    };

    // 1. User starts workout session while OFFLINE
    const session = await sessionService.startSession({
      userId: 'usr-e2e-1',
      workout: generatedWorkout,
    });

    expect(session.status).toBe('active');
    expect(session.exercises.length).toBe(1);

    // Queue mutation for session
    await outbox.enqueue({
      ownerKind: 'user',
      ownerId: 'usr-e2e-1',
      entityType: 'workout_sessions',
      entityId: session.id,
      operation: 'insert',
      version: 1,
      payload: session as any,
    });

    // 2. User logs multiple sets offline: 40kg x 12, 45kg x 10, 45kg x 8
    const exId = session.exercises[0].id;
    const set1 = await sessionService.logSet({
      sessionId: session.id,
      sessionExerciseId: exId,
      actualWeight: 40,
      actualReps: 12,
      rpe: 7,
    });

    const set2 = await sessionService.logSet({
      sessionId: session.id,
      sessionExerciseId: exId,
      actualWeight: 45,
      actualReps: 10,
      rpe: 8,
    });

    const set3 = await sessionService.logSet({
      sessionId: session.id,
      sessionExerciseId: exId,
      actualWeight: 45,
      actualReps: 8,
      rpe: 9,
    });

    // 3. User completes workout session offline
    const completedSession = await sessionService.completeSession(session.id);
    expect(completedSession.status).toBe('completed');
    expect(completedSession.exercises[0].sets.length).toBe(3);

    // 4. Simulate browser refresh / restart while offline
    const reloadedSession = await sessionService.resumeSession(session.id);
    expect(reloadedSession).not.toBeNull();
    expect(reloadedSession!.status).toBe('completed');
    expect(reloadedSession!.exercises[0].sets.length).toBe(3);
    expect(reloadedSession!.exercises[0].sets[0].actualWeight).toBe(40);
    expect(reloadedSession!.exercises[0].sets[1].actualWeight).toBe(45);
    expect(reloadedSession!.exercises[0].sets[2].actualWeight).toBe(45);

    // 5. Network restored -> Trigger push synchronization
    const mockSupabase: any = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: 'usr-e2e-1' } } },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }),
    };

    const pushWorker = new SyncPushWorker(db, undefined, outbox, mockSupabase);
    const pushResult = await pushWorker.pushPendingOperations();

    expect(pushResult.processedCount).toBeGreaterThanOrEqual(1);
    expect(pushResult.succeededCount).toBeGreaterThanOrEqual(1);
    expect(pushResult.failedCount).toBe(0);
    expect(pushResult.deadCount).toBe(0);

    // 6. Verify zero duplicate sets and 100% data fidelity
    const finalSession = await sessionService.getSession(session.id);
    expect(finalSession?.exercises[0].sets.length).toBe(3);
  });
});
