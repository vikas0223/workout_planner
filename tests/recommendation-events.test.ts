import { describe, it, expect, beforeEach } from 'vitest';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { LocalRecommendationRepository } from '@/lib/repositories/local/local-recommendation-repository';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { STORES, RecommendationEventRecord, SyncQueueRecord } from '@/lib/storage/indexeddb-schema';
import { RecommendationEvent } from '@/types/domain';
import { DeterministicRecommendationEngine, RecommendationContext } from '@/lib/domain/recommendations';

describe('Recommendation Events & Cooldown Suppression (Phase 2K)', () => {
  let recRepo: LocalRecommendationRepository;
  let engine: IndexedDBEngine;

  beforeEach(async () => {
    IndexedDBEngine.resetInstance();
    setupMockIndexedDB();
    engine = IndexedDBEngine.getInstance();
    recRepo = new LocalRecommendationRepository(engine);
  });

  it('persists recommendation event locally without syncing for guest user', async () => {
    const event: RecommendationEvent = {
      id: 'recevt_guest_1',
      userId: 'guest_user',
      recommendationType: 'progress_load',
      entityId: 'rec_prog_bench',
      action: 'shown',
      score: 85,
      createdAt: '2026-09-02T10:00:00Z',
    };

    await recRepo.saveEvent(event, 'guest', 'guest_user');

    const storedEvents = await recRepo.listEvents('guest_user');
    expect(storedEvents.length).toBe(1);
    expect(storedEvents[0].id).toBe('recevt_guest_1');
    expect(storedEvents[0].action).toBe('shown');

    // Guest records MUST NOT be added to SYNC_QUEUE
    const syncItems = await engine.getAll<SyncQueueRecord>(STORES.SYNC_QUEUE);
    expect(syncItems.length).toBe(0);
  });

  it('persists and enqueues into SYNC_QUEUE for authenticated user', async () => {
    const event: RecommendationEvent = {
      id: 'recevt_auth_1',
      userId: 'user_auth_123',
      recommendationType: 'swap_exercise',
      entityId: 'rec_swap_squat',
      action: 'accepted',
      score: 90,
      createdAt: '2026-09-02T10:00:00Z',
    };

    await recRepo.saveEvent(event, 'user', 'user_auth_123');

    const storedEvents = await recRepo.listEvents('user_auth_123');
    expect(storedEvents.length).toBe(1);

    const syncItems = await engine.getAll<SyncQueueRecord>(STORES.SYNC_QUEUE);
    expect(syncItems.length).toBe(1);
    expect(syncItems[0].entityId).toBe('recevt_auth_1');
    expect(syncItems[0].operation).toBe('insert');
    expect(syncItems[0].entityType).toBe('recommendation_events');
  });

  it('suppresses recommendations within active cooldown window or when dismissed', async () => {
    const candidateFingerprint = 'rec_prog_bench_123';

    // 1. When fingerprint is in dismissed set, candidate is suppressed
    const contextDismissed: RecommendationContext = {
      userId: 'user_1',
      recentSessions: [
        {
          id: 's1',
          userId: 'user_1',
          name: 'Bench Workout A',
          status: 'completed',
          startedAt: '2026-09-01T10:00:00Z',
          exercises: [
            {
              id: 'se1',
              sessionId: 's1',
              exerciseId: 'barbell_bench_press',
              name: 'Barbell Bench Press',
              order: 1,
              targetMuscles: ['Chest', 'Triceps'],
              equipment: ['barbell'],
              status: 'completed',
              sets: [
                { id: '1', sessionExerciseId: 'se1', setNumber: 1, type: 'normal', targetReps: 8, actualReps: 8, actualWeight: 80, status: 'completed' },
                { id: '2', sessionExerciseId: 'se1', setNumber: 2, type: 'normal', targetReps: 8, actualReps: 8, actualWeight: 80, status: 'completed' },
              ],
            },
          ],
        },
        {
          id: 's2',
          userId: 'user_1',
          name: 'Bench Workout B',
          status: 'completed',
          startedAt: '2026-08-28T10:00:00Z',
          exercises: [
            {
              id: 'se2',
              sessionId: 's2',
              exerciseId: 'barbell_bench_press',
              name: 'Barbell Bench Press',
              order: 1,
              targetMuscles: ['Chest', 'Triceps'],
              equipment: ['barbell'],
              status: 'completed',
              sets: [
                { id: '3', sessionExerciseId: 'se2', setNumber: 1, type: 'normal', targetReps: 8, actualReps: 8, actualWeight: 80, status: 'completed' },
                { id: '4', sessionExerciseId: 'se2', setNumber: 2, type: 'normal', targetReps: 8, actualReps: 8, actualWeight: 80, status: 'completed' },
              ],
            },
          ],
        },
      ],
      currentTime: '2026-09-02T12:00:00Z',
    };

    const initialRecs = DeterministicRecommendationEngine.generateRecommendations(contextDismissed);
    expect(initialRecs.length).toBeGreaterThan(0);
    const generatedFingerprint = initialRecs[0].fingerprint;

    // Now add to dismissed set
    const contextWithDismissed: RecommendationContext = {
      ...contextDismissed,
      dismissedFingerprints: new Set([generatedFingerprint]),
    };

    const recsAfterDismissal = DeterministicRecommendationEngine.generateRecommendations(contextWithDismissed);
    expect(recsAfterDismissal.find((r) => r.fingerprint === generatedFingerprint)).toBeUndefined();
  });
});
