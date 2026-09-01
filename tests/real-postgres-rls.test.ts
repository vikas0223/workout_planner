/**
 * Phase 2D-B-V: Real PostgreSQL Row Level Security (RLS) Verification
 * Validates cross-tenant boundary isolation, anonymous restrictions, and public catalog policies.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createRealPostgresTestDb } from './helpers/real-postgres-helper';
import { PGlite } from '@electric-sql/pglite';

describe('Phase 2D-B-V: Real PostgreSQL RLS Verification', () => {
  let db: PGlite;

  const userA_id = '11111111-1111-1111-1111-111111111111';
  const userB_id = '22222222-2222-2222-2222-222222222222';

  beforeAll(async () => {
    db = await createRealPostgresTestDb();

    // Insert auth.users for User A and User B
    await db.exec(`
      INSERT INTO auth.users (id, email) VALUES 
        ('${userA_id}', 'usera@example.com'),
        ('${userB_id}', 'userb@example.com')
      ON CONFLICT (id) DO NOTHING;
    `);
  }, 30000);

  async function setUserContext(userId: string | null, role: 'authenticated' | 'anon') {
    if (userId) {
      await db.exec(`
        SET request.jwt.claim.sub = '${userId}';
        SET request.jwt.claim.role = '${role}';
        SET ROLE ${role};
      `);
    } else {
      await db.exec(`
        SET request.jwt.claim.sub = '';
        SET request.jwt.claim.role = 'anon';
        SET ROLE anon;
      `);
    }
  }

  async function setSuperuserContext() {
    await db.exec(`RESET ROLE;`);
  }

  it('RLS: User A can CRUD own profiles, but cannot access User B profiles', async () => {
    // 1. User A creates own profile
    await setUserContext(userA_id, 'authenticated');
    await db.exec(`
      INSERT INTO public.profiles (user_id, display_name, units, experience_level)
      VALUES ('${userA_id}', 'User A', 'metric', 'intermediate')
      ON CONFLICT (user_id) DO UPDATE SET display_name = 'User A';
    `);

    // User A reads own profile
    const resA = await db.query<{ display_name: string }>(
      `SELECT display_name FROM public.profiles WHERE user_id = '${userA_id}'`
    );
    expect(resA.rows.length).toBe(1);
    expect(resA.rows[0].display_name).toBe('User A');

    // 2. User B creates own profile
    await setUserContext(userB_id, 'authenticated');
    await db.exec(`
      INSERT INTO public.profiles (user_id, display_name, units, experience_level)
      VALUES ('${userB_id}', 'User B', 'imperial', 'advanced')
      ON CONFLICT (user_id) DO UPDATE SET display_name = 'User B';
    `);

    // User B CANNOT read User A profile (0 rows returned)
    const resB_reading_A = await db.query(
      `SELECT * FROM public.profiles WHERE user_id = '${userA_id}'`
    );
    expect(resB_reading_A.rows.length).toBe(0);

    // User B CANNOT update User A profile
    const updateRes = await db.query(
      `UPDATE public.profiles SET display_name = 'Compromised' WHERE user_id = '${userA_id}'`
    );
    expect(updateRes.affectedRows ?? 0).toBe(0);

    // User B CANNOT delete User A profile
    const deleteRes = await db.query(
      `DELETE FROM public.profiles WHERE user_id = '${userA_id}'`
    );
    expect(deleteRes.affectedRows ?? 0).toBe(0);
  });

  it('RLS: User A cannot access User B workout_sessions, session_exercises, or logged_sets', async () => {
    // Setup exercise catalog as superuser
    await setSuperuserContext();
    const exerciseId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    await db.exec(`
      INSERT INTO public.exercises (id, slug, name, difficulty)
      VALUES ('${exerciseId}', 'bench-press-rls', 'Bench Press', 'intermediate')
      ON CONFLICT (id) DO NOTHING;
    `);

    // User A creates a session, exercise, and set
    await setUserContext(userA_id, 'authenticated');
    const sessionA_id = 'aaaaaaaa-1111-1111-1111-111111111111';
    const sessionExA_id = 'bbbbbbbb-1111-1111-1111-111111111111';
    const setA_id = 'cccccccc-1111-1111-1111-111111111111';

    await db.exec(`
      INSERT INTO public.workout_sessions (id, user_id, name, status)
      VALUES ('${sessionA_id}', '${userA_id}', 'Session A', 'active')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.session_exercises (id, user_id, workout_session_id, exercise_id, position, status)
      VALUES ('${sessionExA_id}', '${userA_id}', '${sessionA_id}', '${exerciseId}', 1, 'active')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.logged_sets (id, user_id, session_exercise_id, workout_session_id, set_number, load_value, actual_reps)
      VALUES ('${setA_id}', '${userA_id}', '${sessionExA_id}', '${sessionA_id}', 1, 80, 10)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Switch to User B
    await setUserContext(userB_id, 'authenticated');

    // User B cannot read User A's session
    const sessionRes = await db.query(`SELECT * FROM public.workout_sessions WHERE id = '${sessionA_id}'`);
    expect(sessionRes.rows.length).toBe(0);

    // User B cannot read User A's session exercise
    const sessionExRes = await db.query(`SELECT * FROM public.session_exercises WHERE id = '${sessionExA_id}'`);
    expect(sessionExRes.rows.length).toBe(0);

    // User B cannot read User A's logged set
    const setRes = await db.query(`SELECT * FROM public.logged_sets WHERE id = '${setA_id}'`);
    expect(setRes.rows.length).toBe(0);

    // User B cannot mutate User A's logged set
    const updateSet = await db.query(`UPDATE public.logged_sets SET load_value = 200 WHERE id = '${setA_id}'`);
    expect(updateSet.affectedRows ?? 0).toBe(0);
  });

  it('RLS: User A cannot access User B favorites or sync_operations', async () => {
    // User A creates a favorite and a sync_operation
    await setUserContext(userA_id, 'authenticated');
    const favA_id = 'aaaaaaaa-ffff-1111-1111-111111111111';
    const entityId = 'eeeeeeee-1111-1111-1111-111111111111';
    const syncOpA_id = 'aaaaaaaa-9999-1111-1111-111111111111';

    await db.exec(`
      INSERT INTO public.favorites (id, user_id, entity_type, entity_id)
      VALUES ('${favA_id}', '${userA_id}', 'exercise', '${entityId}')
      ON CONFLICT (user_id, entity_type, entity_id) DO NOTHING;

      INSERT INTO public.sync_operations (id, user_id, idempotency_key, operation, entity_type, entity_id, status)
      VALUES ('${syncOpA_id}', '${userA_id}', 'userA:test:key:rls', 'insert', 'workout_sessions', '${entityId}', 'succeeded')
      ON CONFLICT (idempotency_key) DO NOTHING;
    `);

    // Switch to User B
    await setUserContext(userB_id, 'authenticated');

    // User B reading favorites returns 0 rows
    const favRes = await db.query(`SELECT * FROM public.favorites WHERE id = '${favA_id}'`);
    expect(favRes.rows.length).toBe(0);

    // User B reading sync_operations returns 0 rows
    const syncRes = await db.query(`SELECT * FROM public.sync_operations WHERE id = '${syncOpA_id}'`);
    expect(syncRes.rows.length).toBe(0);
  });

  it('RLS: Anonymous users cannot write user tables, but can read active catalog', async () => {
    // Populate an exercise catalog row as superuser
    await setSuperuserContext();
    const exId = '33333333-3333-3333-3333-333333333333';
    await db.exec(`
      INSERT INTO public.exercises (id, slug, name, difficulty, is_active)
      VALUES ('${exId}', 'barbell-bench-press-anon', 'Barbell Bench Press', 'intermediate', true)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Switch to anonymous role
    await setUserContext(null, 'anon');

    // Anon CAN read active catalog exercise
    const catalogRes = await db.query<{ name: string }>(
      `SELECT name FROM public.exercises WHERE id = '${exId}'`
    );
    expect(catalogRes.rows.length).toBe(1);
    expect(catalogRes.rows[0].name).toBe('Barbell Bench Press');

    // Anon CANNOT insert into exercises (RLS violation or no policy)
    await expect(
      db.exec(`
        INSERT INTO public.exercises (id, slug, name, difficulty)
        VALUES ('44444444-4444-4444-4444-444444444444', 'illegal-exercise-anon', 'Illegal', 'beginner')
      `)
    ).rejects.toThrow();

    // Anon CANNOT insert into workout_sessions
    await expect(
      db.exec(`
        INSERT INTO public.workout_sessions (id, user_id, name, status)
        VALUES ('55555555-5555-5555-5555-555555555555', '${userA_id}', 'Anon session', 'active')
      `)
    ).rejects.toThrow();
  });
});
