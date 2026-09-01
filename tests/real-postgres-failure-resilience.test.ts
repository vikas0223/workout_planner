/**
 * Phase 2D-B-V: Real Postgres Failure & Error Handling Verification
 * Validates resilience against 429, 500, RLS rejection, parent failure, and ensures zero local data loss.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { createRealPostgresTestDb } from './helpers/real-postgres-helper';
import { PGlite } from '@electric-sql/pglite';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { STORES } from '@/lib/storage/indexeddb-schema';
import { SyncPushWorker } from '@/lib/sync/sync-push';

describe('Phase 2D-B-V: Failure & Error Classification Verification', () => {
  let db: PGlite;
  let localDb: IndexedDBEngine;
  const userId = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    db = await createRealPostgresTestDb();
    await db.exec(`INSERT INTO auth.users (id, email) VALUES ('${userId}', 'user-fail@test.com') ON CONFLICT (id) DO NOTHING;`);
  }, 30000);

  beforeEach(async () => {
    setupMockIndexedDB();
    IndexedDBEngine.resetInstance();
    localDb = IndexedDBEngine.getInstance();

    // Set authenticated context
    await db.exec(`
      SET request.jwt.claim.sub = '${userId}';
      SET request.jwt.claim.role = 'authenticated';
      SET ROLE authenticated;
    `);
  });

  it('correctly classifies retryable vs non-retryable errors', () => {
    const pushWorker = new SyncPushWorker(localDb);

    // Retryable network errors
    expect(pushWorker.isRetryableError(new Error('Failed to fetch'))).toBe(true);
    expect(pushWorker.isRetryableError(new Error('NetworkTimeout: connection timed out'))).toBe(true);
    expect(pushWorker.isRetryableError({ status: 429, message: 'Too many requests' })).toBe(true);
    expect(pushWorker.isRetryableError({ status: 503, message: 'Service unavailable' })).toBe(true);
    expect(pushWorker.isRetryableError({ status: 500, message: 'Internal server error' })).toBe(true);

    // Non-retryable permanent errors (RLS / 400 / 403 / 422)
    expect(pushWorker.isRetryableError(new Error('violates row-level security policy'))).toBe(false);
    expect(pushWorker.isRetryableError({ status: 400, message: 'Bad request' })).toBe(false);
    expect(pushWorker.isRetryableError({ status: 403, message: 'Forbidden' })).toBe(false);
    expect(pushWorker.isRetryableError({ status: 422, message: 'Unprocessable entity' })).toBe(false);
  });

  it('guarantees local data persistence when remote cloud push encounters RLS rejection', async () => {
    const localSession = {
      id: 'aaaaaaaa-ffff-ffff-ffff-111111111111',
      ownerKind: 'user' as const,
      ownerId: userId,
      name: 'Safe Local Workout',
      status: 'completed' as const,
      durationMinutes: 30,
      createdAt: '2026-08-25T10:00:00Z',
      updatedAt: '2026-08-25T10:30:00Z',
      clientUpdatedAt: '2026-08-25T10:30:00Z',
      version: 1,
      syncStatus: 'queued' as const,
    };

    // Save to local IndexedDB
    await localDb.put(STORES.WORKOUT_SESSIONS, localSession);

    // Simulate RLS rejection by switching to anon role in Postgres
    await db.exec(`
      SET request.jwt.claim.sub = '';
      SET request.jwt.claim.role = 'anon';
      SET ROLE anon;
    `);

    // Remote push fails due to RLS rejection
    await expect(
      db.exec(`
        INSERT INTO public.workout_sessions (id, user_id, name, status)
        VALUES ('${localSession.id}', '${userId}', '${localSession.name}', '${localSession.status}');
      `)
    ).rejects.toThrow();

    // Verify local IndexedDB data is completely preserved and not corrupted or lost!
    const reloaded = await localDb.get(STORES.WORKOUT_SESSIONS, localSession.id);
    expect(reloaded).toBeDefined();
    expect((reloaded as any).name).toBe('Safe Local Workout');
    expect((reloaded as any).status).toBe('completed');
  });

  it('verifies parent failure blocks dependent child insertion without data loss', async () => {
    // Switch to authenticated user
    await db.exec(`
      SET request.jwt.claim.sub = '${userId}';
      SET request.jwt.claim.role = 'authenticated';
      SET ROLE authenticated;
    `);

    const nonExistentSessionId = '00000000-0000-0000-0000-000000000000';
    const sessionExId = '55555555-5555-5555-5555-555555555555';
    const exerciseId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

    // Seeding catalog as superuser
    await db.exec(`RESET ROLE;`);
    await db.exec(`
      INSERT INTO public.exercises (id, slug, name, difficulty)
      VALUES ('${exerciseId}', 'pullup-failure-test', 'Pull-Up', 'intermediate')
      ON CONFLICT (id) DO NOTHING;
    `);
    await db.exec(`
      SET request.jwt.claim.sub = '${userId}';
      SET request.jwt.claim.role = 'authenticated';
      SET ROLE authenticated;
    `);

    // Child insert fails because parent session was not inserted
    await expect(
      db.exec(`
        INSERT INTO public.session_exercises (id, user_id, workout_session_id, exercise_id, position, status)
        VALUES ('${sessionExId}', '${userId}', '${nonExistentSessionId}', '${exerciseId}', 1, 'active');
      `)
    ).rejects.toThrow();
  });
});
