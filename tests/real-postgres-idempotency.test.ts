/**
 * Phase 2D-B-V: Real PostgreSQL Idempotency & Deduplication Verification
 * Validates deterministic idempotency handling against the remote sync_operations ledger.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createRealPostgresTestDb } from './helpers/real-postgres-helper';
import { PGlite } from '@electric-sql/pglite';
import { SyncIdempotency } from '@/lib/sync/sync-idempotency';

describe('Phase 2D-B-V: Real Postgres Idempotency Verification', () => {
  let db: PGlite;
  const userId = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    db = await createRealPostgresTestDb();
    await db.exec(`INSERT INTO auth.users (id, email) VALUES ('${userId}', 'user-idemp@test.com') ON CONFLICT (id) DO NOTHING;`);

    // Set authenticated context
    await db.exec(`
      SET request.jwt.claim.sub = '${userId}';
      SET request.jwt.claim.role = 'authenticated';
      SET ROLE authenticated;
    `);
  }, 30000);

  it('verifies deterministic idempotency key format and unique ledger enforcement', async () => {
    const sessionId = 'aaaaaaaa-1111-1111-1111-111111111111';
    const key = SyncIdempotency.generateKey(userId, 'workout_sessions', sessionId, 'insert', 1);
    expect(key).toBe(`${userId}:workout_sessions:${sessionId}:insert:1`);

    // First mutation submission: record in sync_operations and insert session
    await db.exec(`
      INSERT INTO public.sync_operations (id, user_id, idempotency_key, operation, entity_type, entity_id, status)
      VALUES ('99999999-1111-1111-1111-111111111111', '${userId}', '${key}', 'insert', 'workout_sessions', '${sessionId}', 'succeeded')
      ON CONFLICT (idempotency_key) DO NOTHING;

      INSERT INTO public.workout_sessions (id, user_id, name, status, duration_minutes, total_volume)
      VALUES ('${sessionId}', '${userId}', 'Morning Push', 'completed', 45, 1200)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Verify session row exists
    const initialSession = await db.query<{ id: string; name: string }>(
      `SELECT id, name FROM public.workout_sessions WHERE id = '${sessionId}'`
    );
    expect(initialSession.rows.length).toBe(1);
    expect(initialSession.rows[0].name).toBe('Morning Push');

    // Check sync_operations has exactly 1 entry
    const initialOps = await db.query(
      `SELECT * FROM public.sync_operations WHERE idempotency_key = '${key}'`
    );
    expect(initialOps.rows.length).toBe(1);

    // Simulate lost ACK / client retry with the same idempotency key:
    const checkOp = await db.query<{ status: string }>(
      `SELECT status FROM public.sync_operations WHERE idempotency_key = '${key}'`
    );

    expect(checkOp.rows.length).toBe(1);
    expect(checkOp.rows[0].status).toBe('succeeded');

    // Attempting duplicate insert into sync_operations throws unique constraint error:
    await expect(
      db.exec(`
        INSERT INTO public.sync_operations (id, user_id, idempotency_key, operation, entity_type, entity_id, status)
        VALUES ('88888888-2222-2222-2222-222222222222', '${userId}', '${key}', 'insert', 'workout_sessions', '${sessionId}', 'succeeded');
      `)
    ).rejects.toThrow();

    // Verify final cloud state: exactly one session row and exactly one processed operation
    const finalSessions = await db.query(
      `SELECT * FROM public.workout_sessions WHERE user_id = '${userId}'`
    );
    expect(finalSessions.rows.length).toBe(1);

    const finalOps = await db.query(
      `SELECT * FROM public.sync_operations WHERE user_id = '${userId}'`
    );
    expect(finalOps.rows.length).toBe(1);
  });
});
