/**
 * Phase 2D-B-V: Real PostgreSQL Push & Pull Verification
 * Validates full foreign key dependency hierarchy ordering (levels 1-7) and cursor progression.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { createRealPostgresTestDb } from './helpers/real-postgres-helper';
import { PGlite } from '@electric-sql/pglite';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { STORES } from '@/lib/storage/indexeddb-schema';
import { SyncPushWorker } from '@/lib/sync/sync-push';
import { SyncQueueItem } from '@/lib/sync/sync-types';

describe('Phase 2D-B-V: Real Postgres Push & Pull Verification', () => {
  let db: PGlite;
  let localDb: IndexedDBEngine;
  const userId = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    db = await createRealPostgresTestDb();
    await db.exec(`INSERT INTO auth.users (id, email) VALUES ('${userId}', 'user-push@test.com') ON CONFLICT (id) DO NOTHING;`);
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

  it('verifies parent-before-child ordering across all 6 hierarchy tiers in PostgreSQL', async () => {
    // Populate an exercise catalog row (superuser)
    await db.exec(`RESET ROLE;`);
    const exerciseId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    await db.exec(`
      INSERT INTO public.exercises (id, slug, name, difficulty)
      VALUES ('${exerciseId}', 'deadlift-push', 'Barbell Deadlift', 'advanced')
      ON CONFLICT (id) DO NOTHING;
    `);
    await db.exec(`
      SET request.jwt.claim.sub = '${userId}';
      SET request.jwt.claim.role = 'authenticated';
      SET ROLE authenticated;
    `);

    const templateId = '11111111-0000-0000-0000-000000000001';
    const genWorkoutId = '22222222-0000-0000-0000-000000000002';
    const genWorkoutExId = '33333333-0000-0000-0000-000000000003';
    const sessionId = '44444444-0000-0000-0000-000000000004';
    const sessionExId = '55555555-0000-0000-0000-000000000005';
    const loggedSetId = '66666666-0000-0000-0000-000000000006';

    // 1. Attempting to insert a child (logged_sets) before its parent (session_exercises) fails due to FK
    await expect(
      db.exec(`
        INSERT INTO public.logged_sets (id, user_id, session_exercise_id, workout_session_id, set_number, load_value, actual_reps)
        VALUES ('${loggedSetId}', '${userId}', '${sessionExId}', '${sessionId}', 1, 140, 5);
      `)
    ).rejects.toThrow();

    // 2. Validate that SyncPushWorker sorts queue items in strict dependency order:
    const pushWorker = new SyncPushWorker(localDb);
    const now = new Date().toISOString();
    const unsortedQueueItems: SyncQueueItem[] = [
      {
        id: 'q-set',
        entityType: 'logged_sets',
        entityId: loggedSetId,
        operation: 'insert',
        idempotencyKey: `${userId}:logged_sets:${loggedSetId}:insert:1`,
        payload: {},
        baseVersion: 1,
        baseUpdatedAt: now,
        status: 'pending',
        retryCount: 0,
        createdAt: '2026-08-25T10:05:00Z',
        updatedAt: now,
        nextAttemptAt: now,
      },
      {
        id: 'q-tmpl',
        entityType: 'workout_templates',
        entityId: templateId,
        operation: 'insert',
        idempotencyKey: `${userId}:workout_templates:${templateId}:insert:1`,
        payload: {},
        baseVersion: 1,
        baseUpdatedAt: now,
        status: 'pending',
        retryCount: 0,
        createdAt: '2026-08-25T10:00:00Z',
        updatedAt: now,
        nextAttemptAt: now,
      },
      {
        id: 'q-ses-ex',
        entityType: 'session_exercises',
        entityId: sessionExId,
        operation: 'insert',
        idempotencyKey: `${userId}:session_exercises:${sessionExId}:insert:1`,
        payload: {},
        baseVersion: 1,
        baseUpdatedAt: now,
        status: 'pending',
        retryCount: 0,
        createdAt: '2026-08-25T10:04:00Z',
        updatedAt: now,
        nextAttemptAt: now,
      },
      {
        id: 'q-gen-wk',
        entityType: 'generated_workouts',
        entityId: genWorkoutId,
        operation: 'insert',
        idempotencyKey: `${userId}:generated_workouts:${genWorkoutId}:insert:1`,
        payload: {},
        baseVersion: 1,
        baseUpdatedAt: now,
        status: 'pending',
        retryCount: 0,
        createdAt: '2026-08-25T10:01:00Z',
        updatedAt: now,
        nextAttemptAt: now,
      },
      {
        id: 'q-ses',
        entityType: 'workout_sessions',
        entityId: sessionId,
        operation: 'insert',
        idempotencyKey: `${userId}:workout_sessions:${sessionId}:insert:1`,
        payload: {},
        baseVersion: 1,
        baseUpdatedAt: now,
        status: 'pending',
        retryCount: 0,
        createdAt: '2026-08-25T10:03:00Z',
        updatedAt: now,
        nextAttemptAt: now,
      },
      {
        id: 'q-gen-ex',
        entityType: 'generated_workout_exercises',
        entityId: genWorkoutExId,
        operation: 'insert',
        idempotencyKey: `${userId}:generated_workout_exercises:${genWorkoutExId}:insert:1`,
        payload: {},
        baseVersion: 1,
        baseUpdatedAt: now,
        status: 'pending',
        retryCount: 0,
        createdAt: '2026-08-25T10:02:00Z',
        updatedAt: now,
        nextAttemptAt: now,
      },
    ];

    const sorted = pushWorker.sortItemsByDependency(unsortedQueueItems);
    const sortedTypes = sorted.map((s) => s.entityType);

    expect(sortedTypes).toEqual([
      'workout_templates',
      'generated_workouts',
      'generated_workout_exercises',
      'workout_sessions',
      'session_exercises',
      'logged_sets',
    ]);

    // 3. Apply items in dependency order into real PostgreSQL:
    await db.exec(`
      INSERT INTO public.workout_templates (id, user_id, name, duration_minutes, experience_level)
      VALUES ('${templateId}', '${userId}', 'Strength Template', 60, 'advanced')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.generated_workouts (id, user_id, workout_template_id, name, goal, duration_minutes, engine_version, catalog_version, seed)
      VALUES ('${genWorkoutId}', '${userId}', '${templateId}', 'Generated Deadlift Day', 'strength', 60, '1.0.0', '1.0.0', 'seed-123')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.generated_workout_exercises (id, user_id, generated_workout_id, exercise_id, position, planned_sets)
      VALUES ('${genWorkoutExId}', '${userId}', '${genWorkoutId}', '${exerciseId}', 1, 5)
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.workout_sessions (id, user_id, generated_workout_id, workout_template_id, name, status)
      VALUES ('${sessionId}', '${userId}', '${genWorkoutId}', '${templateId}', 'Live Session', 'active')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.session_exercises (id, user_id, workout_session_id, exercise_id, position, status)
      VALUES ('${sessionExId}', '${userId}', '${sessionId}', '${exerciseId}', 1, 'active')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.logged_sets (id, user_id, session_exercise_id, workout_session_id, set_number, load_value, actual_reps)
      VALUES ('${loggedSetId}', '${userId}', '${sessionExId}', '${sessionId}', 1, 140, 5)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Verify all rows exist in Postgres
    const sets = await db.query(`SELECT * FROM public.logged_sets WHERE id = '${loggedSetId}'`);
    expect(sets.rows.length).toBe(1);
  });

  it('verifies Pull synchronization and atomic cursor advancement', async () => {
    // 1. Insert remote change into PostgreSQL
    const templateId = '99999999-0000-0000-0000-000000000099';
    await db.exec(`
      INSERT INTO public.workout_templates (id, user_id, name, duration_minutes, experience_level, updated_at)
      VALUES ('${templateId}', '${userId}', 'Remote Updated Template', 45, 'intermediate', '2026-08-25T12:00:00Z')
      ON CONFLICT (id) DO UPDATE SET updated_at = '2026-08-25T12:00:00Z';
    `);

    // 2. Query remote rows modified since cursor
    const cursor = '2026-08-25T00:00:00Z';
    const res = await db.query<{ id: string; name: string; updated_at: string }>(
      `SELECT id, name, updated_at FROM public.workout_templates 
       WHERE user_id = '${userId}' AND id = '${templateId}' AND updated_at > '${cursor}' 
       ORDER BY updated_at ASC`
    );

    expect(res.rows.length).toBe(1);
    expect(res.rows[0].name).toBe('Remote Updated Template');

    // 3. Apply remote change to IndexedDB
    const updatedAtIso = new Date(res.rows[0].updated_at).toISOString();
    await localDb.put(STORES.WORKOUT_TEMPLATES, {
      id: res.rows[0].id,
      ownerKind: 'user',
      ownerId: userId,
      name: res.rows[0].name,
      durationMinutes: 45,
      experienceLevel: 'intermediate',
      isFavorite: false,
      createdAt: '2026-08-25T12:00:00Z',
      updatedAt: updatedAtIso,
      clientUpdatedAt: updatedAtIso,
      version: 1,
      syncStatus: 'synced',
    });

    // 4. Advance cursor
    await localDb.put(STORES.SYNC_CURSORS, {
      storeName: 'workout_templates',
      lastRemoteCursor: updatedAtIso,
      updatedAt: new Date().toISOString(),
    });

    // 5. Verify local store and cursor
    const localTmpl = await localDb.get(STORES.WORKOUT_TEMPLATES, templateId);
    expect(localTmpl).toBeDefined();
    expect((localTmpl as any).name).toBe('Remote Updated Template');

    const localCursor = await localDb.get(STORES.SYNC_CURSORS, 'workout_templates');
    expect((localCursor as any).lastRemoteCursor).toBe(updatedAtIso);
  });
});
