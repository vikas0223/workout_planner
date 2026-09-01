import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import path from 'path';

export async function createRealPostgresTestDb() {
  const db = new PGlite();

  // Create roles and auth schema required by Supabase PostgreSQL
  await db.exec(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon;
      END IF;
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated;
      END IF;
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role;
      END IF;
    END
    $$;

    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE TABLE IF NOT EXISTS auth.users (
      id UUID PRIMARY KEY,
      email TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
      SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID;
    $$ LANGUAGE SQL STABLE;

    CREATE OR REPLACE FUNCTION auth.role() RETURNS TEXT AS $$
      SELECT COALESCE(NULLIF(current_setting('request.jwt.claim.role', true), ''), 'anon');
    $$ LANGUAGE SQL STABLE;

    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
    GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
  `);

  // Read and apply migration SQL
  const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20260825000000_initial_schema.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  await db.exec(sql);

  // Standard Supabase grants: allow table access so that Row Level Security (RLS) governs row access
  await db.exec(`
    GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
    GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
  `);

  return db;
}
