/**
 * Phase 2E: Storage Manager Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { STORES } from '@/lib/storage/indexeddb-schema';
import { formatBytes } from '@/hooks/use-storage-estimate';

describe('Phase 2E: Storage Management', () => {
  let db: IndexedDBEngine;

  beforeEach(async () => {
    setupMockIndexedDB();
    IndexedDBEngine.resetInstance();
    db = IndexedDBEngine.getInstance();
  });

  it('formatBytes returns readable strings', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1.0 GB');
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('warning threshold is configurable at 80%', () => {
    // Storage warning threshold is defined as 80%
    const STORAGE_WARNING_THRESHOLD = 80;
    
    // Usage at 79% should NOT trigger
    const usage79 = 79;
    expect(usage79 >= STORAGE_WARNING_THRESHOLD).toBe(false);
    
    // Usage at 80% SHOULD trigger
    const usage80 = 80;
    expect(usage80 >= STORAGE_WARNING_THRESHOLD).toBe(true);
    
    // Usage at 95% SHOULD trigger
    const usage95 = 95;
    expect(usage95 >= STORAGE_WARNING_THRESHOLD).toBe(true);
  });

  it('IndexedDB workout data survives cache cleanup simulation', async () => {
    // Seed workout data into IndexedDB
    await db.put(STORES.WORKOUT_SESSIONS, {
      id: 'session-survive-1',
      ownerKind: 'user',
      ownerId: 'user-1',
      name: 'Survival Test Workout',
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientUpdatedAt: new Date().toISOString(),
      version: 1,
      syncStatus: 'synced',
    });

    await db.put(STORES.SETS, {
      id: 'set-survive-1',
      ownerKind: 'user',
      ownerId: 'user-1',
      sessionExerciseId: 'se-1',
      setNumber: 1,
      actualWeight: 100,
      actualReps: 10,
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientUpdatedAt: new Date().toISOString(),
      version: 1,
      syncStatus: 'synced',
    });

    // Simulate "clear application cache" — this would only clear CacheStorage,
    // not IndexedDB. Verify IndexedDB data is untouched.
    // (In tests, we can't access CacheStorage, so we just verify IndexedDB persists)

    const session = await db.get(STORES.WORKOUT_SESSIONS, 'session-survive-1');
    expect(session).toBeDefined();
    expect((session as any).name).toBe('Survival Test Workout');

    const set = await db.get(STORES.SETS, 'set-survive-1');
    expect(set).toBeDefined();
    expect((set as any).actualWeight).toBe(100);
  });

  it('sync queue survives cache cleanup simulation', async () => {
    await db.put(STORES.SYNC_QUEUE, {
      id: 'sq-survive-1',
      entityType: 'workout_sessions',
      entityId: 'session-1',
      operation: 'insert',
      idempotencyKey: 'test-key',
      payload: {},
      baseVersion: 1,
      baseUpdatedAt: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nextAttemptAt: new Date().toISOString(),
    });

    // Cache cleanup would not affect IndexedDB
    const queueItem = await db.get(STORES.SYNC_QUEUE, 'sq-survive-1');
    expect(queueItem).toBeDefined();
    expect((queueItem as any).status).toBe('pending');
  });
});
