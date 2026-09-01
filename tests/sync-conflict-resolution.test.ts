/**
 * Sync Conflict Detection and Resolution Tests
 * Validates entity-specific merge rules, status precedence, and set safety.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { getIndexedDBEngine, IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { STORES } from '@/lib/storage/indexeddb-schema';
import { SyncConflictResolver, SyncConflictItem } from '@/lib/sync';

describe('Phase 2D-B: Conflict Resolution Rules', () => {
  let db: ReturnType<typeof getIndexedDBEngine>;
  let resolver: SyncConflictResolver;

  beforeEach(async () => {
    IndexedDBEngine.resetInstance();
    setupMockIndexedDB();
    db = getIndexedDBEngine();
    await db.clear(STORES.SYNC_CONFLICTS);
    resolver = new SyncConflictResolver(db);
  });

  it('Template conflict: merges last-writer metadata and performs OR-merge on isFavorite', async () => {
    const local = {
      id: 'tmpl-1',
      name: 'Local Name',
      isFavorite: true,
      updatedAt: '2026-08-25T10:00:00Z',
    };
    const remote = {
      id: 'tmpl-1',
      name: 'Remote Name',
      isFavorite: false,
      updatedAt: '2026-08-25T10:05:00Z',
    };

    const res = await resolver.resolveConflict('workout_templates', 'tmpl-1', local, remote);

    expect(res.resolved).toBe(true);
    expect(res.mergedPayload.name).toBe('Remote Name'); // latest updatedAt
    expect(res.mergedPayload.isFavorite).toBe(true); // OR-merged favorite
  });

  it('WorkoutSession conflict: enforces status precedence completed > active > planned > abandoned', async () => {
    const localActive = {
      id: 'ses-1',
      status: 'active',
      startedAt: '2026-08-25T10:00:00Z',
    };
    const remoteCompleted = {
      id: 'ses-1',
      status: 'completed',
      startedAt: '2026-08-25T10:00:00Z',
      completedAt: '2026-08-25T10:45:00Z',
    };

    const res1 = await resolver.resolveConflict('workout_sessions', 'ses-1', localActive, remoteCompleted);
    expect(res1.resolved).toBe(true);
    expect(res1.mergedPayload.status).toBe('completed');
    expect(res1.strategy).toBe('remote_kept');

    const localCompleted = { id: 'ses-2', status: 'completed' };
    const remotePlanned = { id: 'ses-2', status: 'planned' };
    const res2 = await resolver.resolveConflict('workout_sessions', 'ses-2', localCompleted, remotePlanned);
    expect(res2.mergedPayload.status).toBe('completed');
    expect(res2.strategy).toBe('local_kept');
  });

  it('SessionExercise conflict: completed beats pending', async () => {
    const localCompleted = { id: 'sex-1', status: 'completed' };
    const remotePending = { id: 'sex-1', status: 'pending' };

    const res = await resolver.resolveConflict('session_exercises', 'sex-1', localCompleted, remotePending);
    expect(res.resolved).toBe(true);
    expect(res.mergedPayload.status).toBe('completed');
    expect(res.strategy).toBe('local_kept');
  });

  it('LoggedSet conflict: auto-merges disjoint field changes', async () => {
    const local = {
      id: 'set-1',
      actualReps: 12,
      actualWeight: 50,
      rpe: 8,
      notes: undefined,
    };
    const remote = {
      id: 'set-1',
      actualReps: 12,
      actualWeight: 50,
      rpe: 8,
      notes: 'Felt light on last rep',
    };

    const res = await resolver.resolveConflict('logged_sets', 'set-1', local, remote);
    expect(res.resolved).toBe(true);
    expect(res.mergedPayload.actualReps).toBe(12);
    expect(res.mergedPayload.notes).toBe('Felt light on last rep');
  });

  it('LoggedSet conflict: preserves conflict record in sync_conflicts when numeric values clash', async () => {
    const local = {
      id: 'set-1',
      actualReps: 8,
      actualWeight: 45,
      version: 1,
      clientUpdatedAt: '2026-08-25T10:00:00Z',
    };
    const remote = {
      id: 'set-1',
      actualReps: 8,
      actualWeight: 47.5,
      version: 1,
      clientUpdatedAt: '2026-08-25T10:05:00Z',
    };

    const res = await resolver.resolveConflict('logged_sets', 'set-1', local, remote);
    expect(res.strategy).toBe('manual_required');

    const conflicts = await db.getAll<SyncConflictItem>(STORES.SYNC_CONFLICTS);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].entityType).toBe('logged_sets');
    expect((conflicts[0].localPayload as any).actualWeight).toBe(45);
    expect((conflicts[0].remotePayload as any).actualWeight).toBe(47.5);
  });
});
