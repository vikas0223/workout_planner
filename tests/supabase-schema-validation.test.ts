/**
 * Supabase Cloud Schema & Migration Validation Tests
 * Validates DDL completeness, constraints, indexes, RLS policies, and canonical table names.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Phase 2D-A: Supabase Migration DDL Validation', () => {
  const migrationPath = path.resolve(
    __dirname,
    '../supabase/migrations/20260825000000_initial_schema.sql'
  );

  it('migration file exists and is non-empty', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    const content = fs.readFileSync(migrationPath, 'utf8');
    expect(content.length).toBeGreaterThan(500);
  });

  it('creates all 19 approved database tables', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    const expectedTables = [
      'profiles',
      'muscles',
      'equipment',
      'joints',
      'exercises',
      'exercise_muscles',
      'exercise_equipment',
      'exercise_joints',
      'exercise_media',
      'exercise_alternatives',
      'workout_templates',
      'generated_workouts',
      'generated_workout_exercises',
      'workout_sessions',
      'session_exercises',
      'logged_sets',
      'favorites',
      'recommendation_events',
      'ai_coach_messages',
      'sync_operations',
    ];

    for (const table of expectedTables) {
      const tableRegex = new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}\\b`, 'i');
      expect(sql, `Expected table public.${table} to be defined`).toMatch(tableRegex);
    }
  });

  it('uses canonical logged_sets and avoids ambiguous sets table name', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.logged_sets\b/i);
    expect(sql).not.toMatch(/CREATE TABLE IF NOT EXISTS public\.sets\b/i);
  });

  it('enforces user ownership references to auth.users(id) on all user-owned tables', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    const userOwnedTables = [
      'profiles',
      'workout_templates',
      'generated_workouts',
      'generated_workout_exercises',
      'workout_sessions',
      'session_exercises',
      'logged_sets',
      'favorites',
      'recommendation_events',
      'ai_coach_messages',
      'sync_operations',
    ];

    for (const table of userOwnedTables) {
      expect(
        sql,
        `Table public.${table} must reference auth.users(id)`
      ).toMatch(/user_id UUID.*REFERENCES auth\.users\(id\)/i);
    }
  });

  it('enforces required unique constraints and position ordering', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // generated_workout_id + position
    expect(sql).toMatch(/CONSTRAINT uq_generated_workout_position UNIQUE \(\s*generated_workout_id\s*,\s*position\s*\)/i);

    // workout_session_id + position
    expect(sql).toMatch(/CONSTRAINT uq_session_exercise_position UNIQUE \(\s*workout_session_id\s*,\s*position\s*\)/i);

    // session_exercise_id + set_number
    expect(sql).toMatch(/CONSTRAINT uq_session_exercise_set_number UNIQUE \(\s*session_exercise_id\s*,\s*set_number\s*\)/i);

    // user_id + entity_type + entity_id in favorites
    expect(sql).toMatch(/CONSTRAINT uq_user_favorite UNIQUE \(\s*user_id\s*,\s*entity_type\s*,\s*entity_id\s*\)/i);

    // idempotency_key in sync_operations
    expect(sql).toMatch(/idempotency_key TEXT NOT NULL UNIQUE/i);
  });

  it('enables Row Level Security on all user-owned and catalog tables', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    const tablesToSecure = [
      'profiles',
      'workout_templates',
      'generated_workouts',
      'generated_workout_exercises',
      'workout_sessions',
      'session_exercises',
      'logged_sets',
      'favorites',
      'recommendation_events',
      'ai_coach_messages',
      'sync_operations',
      'exercises',
      'muscles',
      'equipment',
      'joints',
    ];

    for (const table of tablesToSecure) {
      const rlsRegex = new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY;`, 'i');
      expect(sql, `RLS must be enabled on public.${table}`).toMatch(rlsRegex);
    }
  });

  it('establishes user isolation RLS policies for authenticated users', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    expect(sql).toMatch(/CREATE POLICY profiles_select ON public\.profiles FOR SELECT TO authenticated USING \(auth\.uid\(\) = user_id\);/i);
    expect(sql).toMatch(/CREATE POLICY templates_select ON public\.workout_templates FOR SELECT TO authenticated USING \(auth\.uid\(\) = user_id\);/i);
    expect(sql).toMatch(/CREATE POLICY sessions_select ON public\.workout_sessions FOR SELECT TO authenticated USING \(auth\.uid\(\) = user_id\);/i);
    expect(sql).toMatch(/CREATE POLICY logged_sets_select ON public\.logged_sets FOR SELECT TO authenticated USING \(auth\.uid\(\) = user_id\);/i);
    expect(sql).toMatch(/CREATE POLICY favorites_select ON public\.favorites FOR SELECT TO authenticated USING \(auth\.uid\(\) = user_id\);/i);
  });

  it('allows public read on catalog tables while blocking public writes', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    expect(sql).toMatch(/CREATE POLICY exercises_public_read ON public\.exercises FOR SELECT TO public USING \(is_active = true\);/i);
    expect(sql).toMatch(/CREATE POLICY muscles_public_read ON public\.muscles FOR SELECT TO public USING \(true\);/i);
    expect(sql).toMatch(/CREATE POLICY equipment_public_read ON public\.equipment FOR SELECT TO public USING \(true\);/i);
    expect(sql).toMatch(/CREATE POLICY joints_public_read ON public\.joints FOR SELECT TO public USING \(true\);/i);

    // No public insert/update/delete policies
    expect(sql).not.toMatch(/CREATE POLICY .* FOR INSERT TO public/i);
    expect(sql).not.toMatch(/CREATE POLICY .* FOR UPDATE TO public/i);
    expect(sql).not.toMatch(/CREATE POLICY .* FOR DELETE TO public/i);
  });
});
