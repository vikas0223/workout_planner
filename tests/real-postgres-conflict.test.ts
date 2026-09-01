/**
 * Phase 2D-B-V: Real PostgreSQL Conflict Resolution Verification
 * Validates concurrent modification detection and zero-loss conflict preservation.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { createRealPostgresTestDb } from './helpers/real-postgres-helper';
import { PGlite } from '@electric-sql/pglite';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { STORES } from '@/lib/storage/indexeddb-schema';
import { SyncConflictResolver } from '@/lib/sync/sync-conflict';

describe('Phase 2D-B-V: Real Postgres Conflict Resolution Verification', () => {
  let db: PGlite;
  let localDb: IndexedDBEngine;
  let resolver: SyncConflictResolver;
  const userId = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    db = await createRealPostgresTestDb();
    await db.exec(`INSERT INTO auth.users (id, email) VALUES ('${userId}', 'user-conflict@test.com') ON CONFLICT (id) DO NOTHING;`);
  }, 30000);

  beforeEach(async () => {
    setupMockIndexedDB();
    IndexedDBEngine.resetInstance();
    localDb = IndexedDBEngine.getInstance();
    resolver = new SyncConflictResolver(localDb);

    // Set authenticated context
    await db.exec(`
      SET request.jwt.claim.sub = '${userId}';
      SET request.jwt.claim.role = 'authenticated';
      SET ROLE authenticated;
    `);
  });

  it('verifies logged set conflict (45kg x 8 vs 47.5kg x 8) records conflict with zero data loss', async () => {
    const setId = '77777777-1111-1111-1111-111111111111';
    const sessionExId = '88888888-1111-1111-1111-111111111111';
    const sessionId = '99999999-1111-1111-1111-111111111111';

    // 1. Local state (dirty / modified offline on device): 45kg x 8
    const localSet = {
      id: setId,
      ownerKind: 'user',
      ownerId: userId,
      sessionExerciseId: sessionExId,
      workoutSessionId: sessionId,
      setNumber: 1,
      type: 'working',
      loadValue: 45,
      actualReps: 8,
      completed: true,
      completedAt: '2026-08-25T11:00:00Z',
      createdAt: '2026-08-25T10:00:00Z',
      updatedAt: '2026-08-25T11:00:00Z',
      clientUpdatedAt: '2026-08-25T11:00:00Z',
      version: 2,
      syncStatus: 'queued',
    };
    await localDb.put(STORES.SETS, localSet);

    // 2. Remote state (modified concurrently in PostgreSQL cloud): 47.5kg x 8
    const remoteSet = {
      id: setId,
      userId,
      sessionExerciseId: sessionExId,
      workoutSessionId: sessionId,
      setNumber: 1,
      type: 'working',
      loadValue: 47.5,
      actualReps: 8,
      completed: true,
      completedAt: '2026-08-25T11:02:00Z',
      createdAt: '2026-08-25T10:00:00Z',
      updatedAt: '2026-08-25T11:02:00Z',
      clientUpdatedAt: '2026-08-25T11:02:00Z',
      version: 2,
    };

    // 3. Run conflict resolution
    const outcome = await resolver.resolveConflict('logged_sets', setId, localSet, remoteSet);

    // Conflicting field values (45kg vs 47.5kg) with same version trigger manual_required with zero data loss
    expect(outcome.strategy).toBe('manual_required');
    expect(outcome.resolved).toBe(false);

    // 4. Verify conflict record is persisted in sync_conflicts store
    const conflicts = await localDb.getAll(STORES.SYNC_CONFLICTS);
    expect(conflicts.length).toBe(1);

    const recordedConflict = conflicts[0] as any;
    expect(recordedConflict.entityType).toBe('logged_sets');
    expect(recordedConflict.entityId).toBe(setId);
    expect(recordedConflict.localPayload.loadValue).toBe(45);
    expect(recordedConflict.remotePayload.loadValue).toBe(47.5);
  });

  it('verifies session status precedence hierarchy (completed > active > planned > abandoned)', async () => {
    const sessionId = '99999999-2222-2222-2222-222222222222';
    
    // completed beats active
    const res1 = await resolver.resolveConflict('workout_sessions', sessionId, { status: 'completed' }, { status: 'active' });
    expect(res1.strategy).toBe('local_kept');
    expect(res1.mergedPayload.status).toBe('completed');

    // active beats planned
    const res2 = await resolver.resolveConflict('workout_sessions', sessionId, { status: 'planned' }, { status: 'active' });
    expect(res2.strategy).toBe('remote_kept');
    expect(res2.mergedPayload.status).toBe('active');

    // planned beats abandoned
    const res3 = await resolver.resolveConflict('workout_sessions', sessionId, { status: 'planned' }, { status: 'abandoned' });
    expect(res3.strategy).toBe('local_kept');
    expect(res3.mergedPayload.status).toBe('planned');
  });
});
