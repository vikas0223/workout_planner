/**
 * Sync Queue, Dependency Ordering, Multi-Tab Locking & Retry Tests
 * Phase 2D-B Validation Suite
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { getIndexedDBEngine, IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { STORES } from '@/lib/storage/indexeddb-schema';
import {
  SyncLock,
  SyncOutbox,
  SyncPushWorker,
  SyncIdempotency,
  SyncQueueItem,
} from '@/lib/sync';

describe('Phase 2D-B: Sync Idempotency & Queue Rules', () => {
  let db: ReturnType<typeof getIndexedDBEngine>;
  let outbox: SyncOutbox;

  beforeEach(async () => {
    IndexedDBEngine.resetInstance();
    setupMockIndexedDB();
    db = getIndexedDBEngine();
    await db.clear(STORES.SYNC_QUEUE);
    await db.clear(STORES.OUTBOX_LOCKS);
    outbox = new SyncOutbox(db);
  });

  it('generates consistent canonical idempotency keys on retries', () => {
    const key1 = SyncIdempotency.generateKey('usr-1', 'workout_sessions', 'ses-1', 'insert', 1);
    const key2 = SyncIdempotency.generateKey('usr-1', 'workout_sessions', 'ses-1', 'insert', 1);
    expect(key1).toBe('usr-1:workout_sessions:ses-1:insert:1');
    expect(key1).toBe(key2);

    const parsed = SyncIdempotency.parseKey(key1);
    expect(parsed?.ownerId).toBe('usr-1');
    expect(parsed?.entityType).toBe('workout_sessions');
    expect(parsed?.entityId).toBe('ses-1');
    expect(parsed?.operation).toBe('insert');
    expect(parsed?.version).toBe(1);
  });

  it('refuses to enqueue guest mutations to the cloud sync queue', async () => {
    const result = await outbox.enqueue({
      ownerKind: 'guest',
      ownerId: 'guest-temp-id',
      entityType: 'workout_sessions',
      entityId: 'ses-guest-1',
      operation: 'insert',
      version: 1,
      payload: { name: 'Guest Workout' },
    });

    expect(result).toBeNull();
    const queue = await db.getAll(STORES.SYNC_QUEUE);
    expect(queue.length).toBe(0);
  });

  it('successfully enqueues authenticated user mutations', async () => {
    const result = await outbox.enqueue({
      ownerKind: 'user',
      ownerId: 'usr-auth-1',
      entityType: 'workout_sessions',
      entityId: 'ses-auth-1',
      operation: 'insert',
      version: 1,
      payload: { name: 'Auth Workout' },
    });

    expect(result).not.toBeNull();
    expect(result?.status).toBe('pending');
    expect(result?.idempotencyKey).toBe('usr-auth-1:workout_sessions:ses-auth-1:insert:1');

    const queue = await db.getAll(STORES.SYNC_QUEUE);
    expect(queue.length).toBe(1);
  });

  it('deduplicates uncompleted queue entries with the same idempotency key', async () => {
    const item1 = await outbox.enqueue({
      ownerKind: 'user',
      ownerId: 'usr-auth-1',
      entityType: 'logged_sets',
      entityId: 'set-1',
      operation: 'insert',
      version: 1,
      payload: { actualReps: 10 },
    });

    const item2 = await outbox.enqueue({
      ownerKind: 'user',
      ownerId: 'usr-auth-1',
      entityType: 'logged_sets',
      entityId: 'set-1',
      operation: 'insert',
      version: 1,
      payload: { actualReps: 10 },
    });

    expect(item1?.id).toBe(item2?.id);
    const queue = await db.getAll(STORES.SYNC_QUEUE);
    expect(queue.length).toBe(1);
  });
});

describe('Phase 2D-B: Dependency-Aware Ordering', () => {
  it('sorts queue items in strict parent-before-child hierarchy', () => {
    const pushWorker = new SyncPushWorker();
    const now = new Date().toISOString();

    const rawItems: SyncQueueItem[] = [
      { id: '1', operation: 'insert', entityType: 'logged_sets', entityId: 's1', idempotencyKey: 'k1', payload: {}, baseVersion: 1, baseUpdatedAt: now, retryCount: 0, status: 'pending', createdAt: '2026-08-25T10:05:00Z', updatedAt: now, nextAttemptAt: now },
      { id: '2', operation: 'insert', entityType: 'workout_sessions', entityId: 'w1', idempotencyKey: 'k2', payload: {}, baseVersion: 1, baseUpdatedAt: now, retryCount: 0, status: 'pending', createdAt: '2026-08-25T10:01:00Z', updatedAt: now, nextAttemptAt: now },
      { id: '3', operation: 'insert', entityType: 'workout_templates', entityId: 't1', idempotencyKey: 'k3', payload: {}, baseVersion: 1, baseUpdatedAt: now, retryCount: 0, status: 'pending', createdAt: '2026-08-25T10:00:00Z', updatedAt: now, nextAttemptAt: now },
      { id: '4', operation: 'insert', entityType: 'session_exercises', entityId: 'e1', idempotencyKey: 'k4', payload: {}, baseVersion: 1, baseUpdatedAt: now, retryCount: 0, status: 'pending', createdAt: '2026-08-25T10:03:00Z', updatedAt: now, nextAttemptAt: now },
      { id: '5', operation: 'insert', entityType: 'generated_workouts', entityId: 'g1', idempotencyKey: 'k5', payload: {}, baseVersion: 1, baseUpdatedAt: now, retryCount: 0, status: 'pending', createdAt: '2026-08-25T10:02:00Z', updatedAt: now, nextAttemptAt: now },
    ];

    const sorted = pushWorker.sortItemsByDependency(rawItems);
    const sortedTypes = sorted.map((i) => i.entityType);

    expect(sortedTypes).toEqual([
      'workout_templates',
      'generated_workouts',
      'workout_sessions',
      'session_exercises',
      'logged_sets',
    ]);
  });
});

describe('Phase 2D-B: Multi-Tab Locking', () => {
  let db: ReturnType<typeof getIndexedDBEngine>;

  beforeEach(async () => {
    IndexedDBEngine.resetInstance();
    setupMockIndexedDB();
    db = getIndexedDBEngine();
    await db.clear(STORES.OUTBOX_LOCKS);
  });

  it('allows primary tab to acquire lock and rejects secondary tab', async () => {
    const tabA = new SyncLock(db, 'tab-A', 30000);
    const tabB = new SyncLock(db, 'tab-B', 30000);

    const acquiredA = await tabA.acquire();
    expect(acquiredA).toBe(true);

    const acquiredB = await tabB.acquire();
    expect(acquiredB).toBe(false);
  });

  it('allows owner tab to renew and release lock', async () => {
    const tabA = new SyncLock(db, 'tab-A', 30000);
    await tabA.acquire();

    const renewed = await tabA.renew();
    expect(renewed).toBe(true);

    const released = await tabA.release();
    expect(released).toBe(true);

    const tabB = new SyncLock(db, 'tab-B', 30000);
    const acquiredB = await tabB.acquire();
    expect(acquiredB).toBe(true);
  });

  it('prevents a secondary tab from releasing another tab\'s lock', async () => {
    const tabA = new SyncLock(db, 'tab-A', 30000);
    const tabB = new SyncLock(db, 'tab-B', 30000);

    await tabA.acquire();
    const releaseByB = await tabB.release();
    expect(releaseByB).toBe(false);

    expect(await tabA.isHeldByMe()).toBe(true);
  });

  it('reclaims expired locks automatically', async () => {
    const tabA = new SyncLock(db, 'tab-A', -1000); // already expired
    await tabA.acquire();

    const tabB = new SyncLock(db, 'tab-B', 30000);
    const acquiredB = await tabB.acquire();
    expect(acquiredB).toBe(true);
    expect(await tabB.isHeldByMe()).toBe(true);
  });
});

describe('Phase 2D-B: Retry Progression & Non-Retryable Errors', () => {
  const pushWorker = new SyncPushWorker();

  it('calculates exponential backoff progression within expected boundaries', () => {
    expect(pushWorker.calculateBackoffDelay(0)).toBeLessThan(1000);
    expect(pushWorker.calculateBackoffDelay(1)).toBeGreaterThanOrEqual(5000);
    expect(pushWorker.calculateBackoffDelay(2)).toBeGreaterThanOrEqual(30000);
    expect(pushWorker.calculateBackoffDelay(3)).toBeGreaterThanOrEqual(120000);
    expect(pushWorker.calculateBackoffDelay(4)).toBeGreaterThanOrEqual(600000);
    expect(pushWorker.calculateBackoffDelay(5)).toBeGreaterThanOrEqual(1800000);
  });

  it('correctly identifies retryable vs non-retryable errors', () => {
    // Retryable
    expect(pushWorker.isRetryableError(new Error('Failed to fetch'))).toBe(true);
    expect(pushWorker.isRetryableError({ status: 429 })).toBe(true);
    expect(pushWorker.isRetryableError({ status: 503 })).toBe(true);
    expect(pushWorker.isRetryableError(new Error('Network timeout'))).toBe(true);

    // Non-retryable
    expect(pushWorker.isRetryableError(new Error('violates row-level security policy'))).toBe(false);
    expect(pushWorker.isRetryableError(new Error('permission denied for table profiles'))).toBe(false);
    expect(pushWorker.isRetryableError({ status: 400 })).toBe(false);
    expect(pushWorker.isRetryableError({ status: 422 })).toBe(false);
  });
});
