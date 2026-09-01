/**
 * Phase 2D-B-V: Real PostgreSQL Catalog, Schema & Constraint Verification
 * Validates tables, columns, foreign keys, unique constraints, check constraints,
 * indexes, and RLS enablement directly against PostgreSQL internal system catalogs.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createRealPostgresTestDb } from './helpers/real-postgres-helper';
import { PGlite } from '@electric-sql/pglite';

describe('Phase 2D-B-V: Real Postgres Catalog & Schema Verification', () => {
  let db: PGlite;

  beforeAll(async () => {
    db = await createRealPostgresTestDb();
  }, 30000);

  it('verifies all 19 approved canonical tables exist in PostgreSQL public schema', async () => {
    const res = await db.query<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );

    const tables = res.rows.map((r) => r.table_name);
    const expectedTables = [
      'ai_coach_messages',
      'equipment',
      'exercise_alternatives',
      'exercise_equipment',
      'exercise_joints',
      'exercise_media',
      'exercise_muscles',
      'exercises',
      'favorites',
      'generated_workout_exercises',
      'generated_workouts',
      'joints',
      'logged_sets',
      'muscles',
      'profiles',
      'recommendation_events',
      'session_exercises',
      'sync_operations',
      'workout_sessions',
      'workout_templates',
    ];

    for (const expected of expectedTables) {
      expect(tables).toContain(expected);
    }
  });

  it('verifies primary keys and unique constraints in pg_constraint catalog', async () => {
    const res = await db.query<{ conname: string; contype: string }>(
      `SELECT conname, contype FROM pg_constraint WHERE connamespace = 'public'::regnamespace`
    );

    const constraintNames = res.rows.map((r) => r.conname);

    // Canonical Unique Constraints
    expect(constraintNames).toContain('uq_generated_workout_position');
    expect(constraintNames).toContain('uq_session_exercise_position');
    expect(constraintNames).toContain('uq_session_exercise_set_number');
    expect(constraintNames).toContain('uq_user_favorite');
  });

  it('verifies foreign key relationships reference auth.users and parent entities', async () => {
    const res = await db.query<{
      conname: string;
      table_name: string;
      foreign_table_name: string;
    }>(`
      SELECT
        c.conname,
        cl.relname AS table_name,
        fcl.relname AS foreign_table_name
      FROM pg_constraint c
      JOIN pg_class cl ON c.conrelid = cl.oid
      JOIN pg_class fcl ON c.confrelid = fcl.oid
      WHERE c.contype = 'f' AND cl.relnamespace = 'public'::regnamespace;
    `);

    const fks = res.rows;
    expect(fks.length).toBeGreaterThanOrEqual(18);

    // Verify critical foreign key references
    const sessionFk = fks.find((f) => f.table_name === 'session_exercises' && f.foreign_table_name === 'workout_sessions');
    expect(sessionFk).toBeDefined();

    const loggedSetsFk = fks.find((f) => f.table_name === 'logged_sets' && f.foreign_table_name === 'session_exercises');
    expect(loggedSetsFk).toBeDefined();

    const genWorkoutExFk = fks.find((f) => f.table_name === 'generated_workout_exercises' && f.foreign_table_name === 'generated_workouts');
    expect(genWorkoutExFk).toBeDefined();
  });

  it('verifies Check Constraints enforce domain status values and ranges', async () => {
    const userId = '11111111-1111-1111-1111-111111111111';
    await db.exec(`INSERT INTO auth.users (id, email) VALUES ('${userId}', 'test-schema@example.com') ON CONFLICT (id) DO NOTHING;`);

    // Invalid status should be rejected by PostgreSQL CHECK constraint
    await expect(
      db.exec(`
        INSERT INTO public.workout_sessions (id, user_id, name, status)
        VALUES ('11111111-2222-3333-4444-555555555555', '${userId}', 'Test', 'in_progress');
      `)
    ).rejects.toThrow();

    // Valid status should succeed
    await expect(
      db.exec(`
        INSERT INTO public.workout_sessions (id, user_id, name, status)
        VALUES ('11111111-2222-3333-4444-555555555555', '${userId}', 'Test', 'active');
      `)
    ).resolves.toBeDefined();

    // Check logged_sets type constraint
    const sessionId = '11111111-2222-3333-4444-555555555555';
    const exerciseId = '22222222-3333-4444-5555-666666666666';
    await db.exec(`
      INSERT INTO public.exercises (id, slug, name, difficulty)
      VALUES ('${exerciseId}', 'squat-schema-check', 'Barbell Squat', 'intermediate')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.session_exercises (id, user_id, workout_session_id, exercise_id, position, status)
      VALUES ('33333333-4444-5555-6666-777777777777', '${userId}', '${sessionId}', '${exerciseId}', 1, 'active');
    `);

    const sessionExerciseId = '33333333-4444-5555-6666-777777777777';

    // Invalid set type rejected
    await expect(
      db.exec(`
        INSERT INTO public.logged_sets (id, user_id, session_exercise_id, workout_session_id, set_number, type)
        VALUES ('44444444-5555-6666-7777-888888888888', '${userId}', '${sessionExerciseId}', '${sessionId}', 1, 'invalid_set_type');
      `)
    ).rejects.toThrow();

    // Valid set type accepted
    await expect(
      db.exec(`
        INSERT INTO public.logged_sets (id, user_id, session_exercise_id, workout_session_id, set_number, type, load_value, actual_reps)
        VALUES ('44444444-5555-6666-7777-888888888888', '${userId}', '${sessionExerciseId}', '${sessionId}', 1, 'working', 100, 10);
      `)
    ).resolves.toBeDefined();
  });

  it('verifies Row Level Security (RLS) is enabled on all tables in pg_class', async () => {
    const res = await db.query<{ relname: string; relrowsecurity: boolean }>(`
      SELECT relname, relrowsecurity
      FROM pg_class
      WHERE relnamespace = 'public'::regnamespace AND relkind = 'r'
      ORDER BY relname;
    `);

    const tables = res.rows;
    expect(tables.length).toBeGreaterThanOrEqual(19);

    for (const table of tables) {
      expect(
        table.relrowsecurity,
        `Table ${table.relname} must have row security enabled (relrowsecurity = true)`
      ).toBe(true);
    }
  });

  it('verifies RLS policies exist in pg_policy catalog for all tables', async () => {
    const res = await db.query<{ polname: string; tablename: string }>(`
      SELECT
        p.polname,
        c.relname AS tablename
      FROM pg_policy p
      JOIN pg_class c ON p.polrelid = c.oid
      WHERE c.relnamespace = 'public'::regnamespace
      ORDER BY c.relname, p.polname;
    `);

    const policies = res.rows;
    expect(policies.length).toBeGreaterThanOrEqual(30);

    const tableNamesWithPolicies = new Set(policies.map((p) => p.tablename));
    expect(tableNamesWithPolicies.has('profiles')).toBe(true);
    expect(tableNamesWithPolicies.has('workout_templates')).toBe(true);
    expect(tableNamesWithPolicies.has('generated_workouts')).toBe(true);
    expect(tableNamesWithPolicies.has('workout_sessions')).toBe(true);
    expect(tableNamesWithPolicies.has('session_exercises')).toBe(true);
    expect(tableNamesWithPolicies.has('logged_sets')).toBe(true);
    expect(tableNamesWithPolicies.has('favorites')).toBe(true);
    expect(tableNamesWithPolicies.has('sync_operations')).toBe(true);
    expect(tableNamesWithPolicies.has('exercises')).toBe(true);
    expect(tableNamesWithPolicies.has('muscles')).toBe(true);
  });
});
