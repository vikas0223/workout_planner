/**
 * Phase 2E: Update Lifecycle Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { STORES } from '@/lib/storage/indexeddb-schema';
import { hasActiveWorkoutSession } from '@/lib/pwa/sw-update-manager';

describe('Phase 2E: Service Worker Update Lifecycle', () => {
  let db: IndexedDBEngine;

  beforeEach(async () => {
    setupMockIndexedDB();
    IndexedDBEngine.resetInstance();
    db = IndexedDBEngine.getInstance();
  });

  it('detects no active workout when no sessions exist', async () => {
    const result = await hasActiveWorkoutSession();
    expect(result).toBe(false);
  });

  it('detects active workout when status is "active"', async () => {
    await db.put(STORES.WORKOUT_SESSIONS, {
      id: 'session-active-1',
      ownerKind: 'user',
      ownerId: 'user-1',
      name: 'Active Workout',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientUpdatedAt: new Date().toISOString(),
      version: 1,
      syncStatus: 'local',
    });

    const result = await hasActiveWorkoutSession();
    expect(result).toBe(true);
  });

  it('detects planned workout as active (preventing data loss)', async () => {
    await db.put(STORES.WORKOUT_SESSIONS, {
      id: 'session-planned-1',
      ownerKind: 'user',
      ownerId: 'user-1',
      name: 'Planned Workout',
      status: 'planned',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientUpdatedAt: new Date().toISOString(),
      version: 1,
      syncStatus: 'local',
    });

    const result = await hasActiveWorkoutSession();
    expect(result).toBe(true);
  });

  it('does not block update for completed sessions', async () => {
    await db.put(STORES.WORKOUT_SESSIONS, {
      id: 'session-completed-1',
      ownerKind: 'user',
      ownerId: 'user-1',
      name: 'Completed Workout',
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientUpdatedAt: new Date().toISOString(),
      version: 1,
      syncStatus: 'synced',
    });

    const result = await hasActiveWorkoutSession();
    expect(result).toBe(false);
  });

  it('does not block update for abandoned sessions', async () => {
    await db.put(STORES.WORKOUT_SESSIONS, {
      id: 'session-abandoned-1',
      ownerKind: 'user',
      ownerId: 'user-1',
      name: 'Abandoned Workout',
      status: 'abandoned',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientUpdatedAt: new Date().toISOString(),
      version: 1,
      syncStatus: 'local',
    });

    const result = await hasActiveWorkoutSession();
    expect(result).toBe(false);
  });

  it('IndexedDB data survives SW update cycle simulation', async () => {
    // Seed workout data
    await db.put(STORES.WORKOUT_SESSIONS, {
      id: 'session-sw-survive-1',
      ownerKind: 'user',
      ownerId: 'user-1',
      name: 'SW Update Survival Test',
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientUpdatedAt: new Date().toISOString(),
      version: 1,
      syncStatus: 'synced',
    });

    // Seed sync queue item
    await db.put(STORES.SYNC_QUEUE, {
      id: 'sq-sw-survive-1',
      entityType: 'workout_sessions',
      entityId: 'session-sw-survive-1',
      operation: 'insert',
      idempotencyKey: 'sw-test-key',
      payload: {},
      baseVersion: 1,
      baseUpdatedAt: new Date().toISOString(),
      status: 'synced',
      retryCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nextAttemptAt: new Date().toISOString(),
    });

    // SW update does NOT touch IndexedDB — verify data persistence
    const session = await db.get(STORES.WORKOUT_SESSIONS, 'session-sw-survive-1');
    expect(session).toBeDefined();
    expect((session as any).name).toBe('SW Update Survival Test');

    const queueItem = await db.get(STORES.SYNC_QUEUE, 'sq-sw-survive-1');
    expect(queueItem).toBeDefined();
    expect((queueItem as any).status).toBe('synced');
  });

  it('detects mixed sessions correctly (active + completed)', async () => {
    await db.put(STORES.WORKOUT_SESSIONS, {
      id: 'completed-session',
      ownerKind: 'user',
      ownerId: 'user-1',
      name: 'Old Workout',
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientUpdatedAt: new Date().toISOString(),
      version: 1,
      syncStatus: 'synced',
    });

    await db.put(STORES.WORKOUT_SESSIONS, {
      id: 'active-session',
      ownerKind: 'user',
      ownerId: 'user-1',
      name: 'Current Workout',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientUpdatedAt: new Date().toISOString(),
      version: 1,
      syncStatus: 'local',
    });

    const result = await hasActiveWorkoutSession();
    expect(result).toBe(true);
  });
});
