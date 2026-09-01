import { describe, it, expect, beforeEach } from 'vitest';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { SyncPushWorker } from '@/lib/sync/sync-push';
import { SyncConflictResolver } from '@/lib/sync/sync-conflict';
import { SyncQueueItem } from '@/lib/sync/sync-types';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';

describe('Phase 2J: Program, Goal & Challenge Sync Pipeline', () => {
  let pushWorker: SyncPushWorker;
  let conflictResolver: SyncConflictResolver;
  let engine: IndexedDBEngine;

  beforeEach(() => {
    IndexedDBEngine.resetInstance();
    setupMockIndexedDB();
    engine = IndexedDBEngine.getInstance();
    pushWorker = new SyncPushWorker(engine);
    conflictResolver = new SyncConflictResolver(engine);
  });

  it('enforces dependency ordering: programs -> program_weeks -> templates -> program_days -> sessions -> goals -> challenges', () => {
    const unorderedItems: SyncQueueItem[] = [
      { id: '1', operation: 'upsert', entityType: 'challenge_progress', entityId: 'cp1', idempotencyKey: 'k1', payload: {}, baseVersion: 1, baseUpdatedAt: '2026-09-01T00:00:00Z', retryCount: 0, status: 'pending', createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z', nextAttemptAt: '2026-09-01T00:00:00Z' },
      { id: '2', operation: 'upsert', entityType: 'programs', entityId: 'p1', idempotencyKey: 'k2', payload: {}, baseVersion: 1, baseUpdatedAt: '2026-09-01T00:00:00Z', retryCount: 0, status: 'pending', createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z', nextAttemptAt: '2026-09-01T00:00:00Z' },
      { id: '3', operation: 'upsert', entityType: 'fitness_goals', entityId: 'g1', idempotencyKey: 'k3', payload: {}, baseVersion: 1, baseUpdatedAt: '2026-09-01T00:00:00Z', retryCount: 0, status: 'pending', createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z', nextAttemptAt: '2026-09-01T00:00:00Z' },
      { id: '4', operation: 'upsert', entityType: 'program_days', entityId: 'pd1', idempotencyKey: 'k4', payload: {}, baseVersion: 1, baseUpdatedAt: '2026-09-01T00:00:00Z', retryCount: 0, status: 'pending', createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z', nextAttemptAt: '2026-09-01T00:00:00Z' },
      { id: '5', operation: 'upsert', entityType: 'workout_sessions', entityId: 's1', idempotencyKey: 'k5', payload: {}, baseVersion: 1, baseUpdatedAt: '2026-09-01T00:00:00Z', retryCount: 0, status: 'pending', createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z', nextAttemptAt: '2026-09-01T00:00:00Z' },
      { id: '6', operation: 'upsert', entityType: 'program_weeks', entityId: 'pw1', idempotencyKey: 'k6', payload: {}, baseVersion: 1, baseUpdatedAt: '2026-09-01T00:00:00Z', retryCount: 0, status: 'pending', createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z', nextAttemptAt: '2026-09-01T00:00:00Z' },
    ];

    const sorted = pushWorker.sortItemsByDependency(unorderedItems);
    const sortedTypes = sorted.map((i) => i.entityType);

    expect(sortedTypes).toEqual([
      'programs',
      'program_weeks',
      'program_days',
      'workout_sessions',
      'fitness_goals',
      'challenge_progress',
    ]);
  });

  it('resolves program conflicts with completed status precedence', async () => {
    const local = {
      id: 'p_1',
      status: 'completed',
      updatedAt: '2026-09-01T10:00:00.000Z',
    };
    const remote = {
      id: 'p_1',
      status: 'active',
      updatedAt: '2026-09-01T11:00:00.000Z', // Later remote timestamp
    };

    const result = await conflictResolver.resolveConflict('programs', 'p_1', local, remote);
    expect(result.resolved).toBe(true);
    expect(result.mergedPayload.status).toBe('completed'); // completed wins over active
  });

  it('resolves program day conflicts preserving completedSessionId and completed status', async () => {
    const local = {
      id: 'pd_1',
      status: 'completed',
      completedSessionId: 'sess_123',
      updatedAt: '2026-09-01T10:00:00.000Z',
    };
    const remote = {
      id: 'pd_1',
      status: 'rescheduled',
      effectiveDate: '2026-09-03',
      updatedAt: '2026-09-01T11:00:00.000Z',
    };

    const result = await conflictResolver.resolveConflict('program_days', 'pd_1', local, remote);
    expect(result.resolved).toBe(true);
    expect(result.mergedPayload.status).toBe('completed');
    expect(result.mergedPayload.completedSessionId).toBe('sess_123');
  });
});
