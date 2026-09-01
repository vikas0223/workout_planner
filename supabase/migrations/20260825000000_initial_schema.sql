-- =============================================================================
-- Migration: 20260825000000_initial_schema.sql
-- Description: Phase 2D-A Supabase Cloud Schema with RLS, Constraints, and Indexes
-- Canonical Table for sets: logged_sets
-- =============================================================================

-- 1. Profiles (User Settings & Profile)
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  units TEXT CHECK (units IS NULL OR units IN ('metric', 'imperial')),
  experience_level TEXT CHECK (experience_level IS NULL OR experience_level IN ('beginner', 'intermediate', 'advanced')),
  default_session_minutes INTEGER CHECK (default_session_minutes IS NULL OR default_session_minutes > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1
);

-- 2. Exercise Catalog (Public Read-Only)
CREATE TABLE IF NOT EXISTS public.muscles (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  region TEXT NOT NULL CHECK (region IN ('upper', 'lower', 'core', 'full_body')),
  parent_muscle_id UUID REFERENCES public.muscles(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.equipment (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  is_common_home_equipment BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.joints (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  region TEXT NOT NULL CHECK (region IN ('upper', 'lower', 'spine')),
  movement_pattern TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  movement_pattern TEXT CHECK (movement_pattern IS NULL OR movement_pattern IN ('push', 'pull', 'squat', 'hinge', 'carry', 'rotation', 'locomotion')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  mechanics TEXT CHECK (mechanics IS NULL OR mechanics IN ('compound', 'isolation')),
  force TEXT CHECK (force IS NULL OR force IN ('push', 'pull', 'static', 'dynamic')),
  instructions TEXT[],
  contraindications JSONB,
  default_prescription JSONB,
  catalog_version TEXT NOT NULL DEFAULT '1.0.0',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exercise_muscles (
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  muscle_id UUID NOT NULL REFERENCES public.muscles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('primary', 'secondary', 'stabilizer')),
  PRIMARY KEY (exercise_id, muscle_id)
);

CREATE TABLE IF NOT EXISTS public.exercise_equipment (
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (exercise_id, equipment_id)
);

CREATE TABLE IF NOT EXISTS public.exercise_joints (
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  joint_id UUID NOT NULL REFERENCES public.joints(id) ON DELETE CASCADE,
  stress_level TEXT CHECK (stress_level IS NULL OR stress_level IN ('low', 'moderate', 'high')),
  PRIMARY KEY (exercise_id, joint_id)
);

CREATE TABLE IF NOT EXISTS public.exercise_media (
  id UUID PRIMARY KEY,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'animation')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exercise_alternatives (
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  alternative_exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  similarity_score NUMERIC CHECK (similarity_score IS NULL OR (similarity_score >= 0 AND similarity_score <= 1)),
  reason TEXT,
  PRIMARY KEY (exercise_id, alternative_exercise_id)
);

-- 3. Workout Templates (Reusable Plans)
CREATE TABLE IF NOT EXISTS public.workout_templates (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  experience_level TEXT NOT NULL CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  target_muscle_ids UUID[],
  avoid_muscle_ids UUID[],
  avoid_joint_ids UUID[],
  equipment_ids UUID[],
  constraints JSONB,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1
);

-- 4. Generated Workouts (Concrete Deterministic Blueprint Plans)
CREATE TABLE IF NOT EXISTS public.generated_workouts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  goal TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  engine_version TEXT NOT NULL,
  catalog_version TEXT NOT NULL,
  seed TEXT NOT NULL,
  generation_input JSONB,
  generation_trace JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1
);

-- 5. Generated Workout Exercises (Planned Prescriptions)
CREATE TABLE IF NOT EXISTS public.generated_workout_exercises (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generated_workout_id UUID NOT NULL REFERENCES public.generated_workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  position INTEGER NOT NULL CHECK (position > 0),
  planned_sets INTEGER NOT NULL CHECK (planned_sets > 0),
  planned_reps_min INTEGER CHECK (planned_reps_min IS NULL OR planned_reps_min >= 0),
  planned_reps_max INTEGER CHECK (planned_reps_max IS NULL OR planned_reps_max >= 0),
  planned_duration_seconds INTEGER CHECK (planned_duration_seconds IS NULL OR planned_duration_seconds >= 0),
  planned_rest_seconds INTEGER CHECK (planned_rest_seconds IS NULL OR planned_rest_seconds >= 0),
  planned_load NUMERIC CHECK (planned_load IS NULL OR planned_load >= 0),
  intensity_target JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_generated_workout_position UNIQUE (generated_workout_id, position)
);

-- 6. Workout Sessions (Session Execution Instances)
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generated_workout_id UUID REFERENCES public.generated_workouts(id) ON DELETE SET NULL,
  workout_template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('planned', 'active', 'completed', 'abandoned')),
  duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes >= 0),
  total_calories_burned NUMERIC CHECK (total_calories_burned IS NULL OR total_calories_burned >= 0),
  total_volume NUMERIC CHECK (total_volume IS NULL OR total_volume >= 0),
  perceived_exertion INTEGER CHECK (perceived_exertion IS NULL OR (perceived_exertion >= 1 AND perceived_exertion <= 10)),
  satisfaction_rating INTEGER CHECK (satisfaction_rating IS NULL OR (satisfaction_rating >= 1 AND satisfaction_rating <= 5)),
  notes TEXT,
  feedback JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1
);

-- 7. Session Exercises (Exercises in Workout Execution)
CREATE TABLE IF NOT EXISTS public.session_exercises (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  generated_workout_exercise_id UUID REFERENCES public.generated_workout_exercises(id) ON DELETE SET NULL,
  position INTEGER NOT NULL CHECK (position > 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'completed', 'skipped', 'substituted')),
  planned_sets INTEGER CHECK (planned_sets IS NULL OR planned_sets > 0),
  planned_reps TEXT,
  planned_rest_seconds INTEGER CHECK (planned_rest_seconds IS NULL OR planned_rest_seconds >= 0),
  substituted_from_exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  substitution_reason TEXT,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT uq_session_exercise_position UNIQUE (workout_session_id, position)
);

-- 8. Logged Sets (Actual Performed / Logged Set Records)
CREATE TABLE IF NOT EXISTS public.logged_sets (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_exercise_id UUID NOT NULL REFERENCES public.session_exercises(id) ON DELETE CASCADE,
  workout_session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL CHECK (set_number > 0),
  type TEXT NOT NULL DEFAULT 'working' CHECK (type IN ('warmup', 'working', 'drop', 'failure', 'cooldown')),
  target_reps INTEGER CHECK (target_reps IS NULL OR target_reps >= 0),
  actual_reps INTEGER CHECK (actual_reps IS NULL OR actual_reps >= 0),
  load_value NUMERIC CHECK (load_value IS NULL OR load_value >= 0),
  load_unit TEXT CHECK (load_unit IS NULL OR load_unit IN ('kg', 'lbs', 'bodyweight')),
  duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  distance_value NUMERIC CHECK (distance_value IS NULL OR distance_value >= 0),
  distance_unit TEXT,
  rpe NUMERIC CHECK (rpe IS NULL OR (rpe >= 1 AND rpe <= 10)),
  rir NUMERIC CHECK (rir IS NULL OR rir >= 0),
  rest_seconds INTEGER CHECK (rest_seconds IS NULL OR rest_seconds >= 0),
  tempo TEXT,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('planned', 'completed', 'skipped')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT uq_session_exercise_set_number UNIQUE (session_exercise_id, set_number)
);

-- 9. Favorites (User Favorite Exercises, Workouts, Templates)
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('exercise', 'workout', 'template')),
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT uq_user_favorite UNIQUE (user_id, entity_type, entity_id)
);

-- 10. Recommendation Events
CREATE TABLE IF NOT EXISTS public.recommendation_events (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('shown', 'accepted', 'dismissed', 'rated')),
  score NUMERIC,
  context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. AI Coach Messages
CREATE TABLE IF NOT EXISTS public.ai_coach_messages (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Sync Operations (Idempotency and Cloud Sync Log)
CREATE TABLE IF NOT EXISTS public.sync_operations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL UNIQUE,
  operation TEXT NOT NULL CHECK (operation IN ('insert', 'update', 'delete', 'upsert')),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'conflict', 'dead')),
  request_hash TEXT,
  error_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles(user_id, updated_at DESC);

-- Workout Templates
CREATE INDEX IF NOT EXISTS idx_workout_templates_user_updated ON public.workout_templates(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_templates_user_deleted ON public.workout_templates(user_id, deleted_at);

-- Generated Workouts
CREATE INDEX IF NOT EXISTS idx_generated_workouts_user_created ON public.generated_workouts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_workouts_template ON public.generated_workouts(user_id, workout_template_id);
CREATE INDEX IF NOT EXISTS idx_generated_workouts_user_deleted ON public.generated_workouts(user_id, deleted_at);

-- Generated Workout Exercises
CREATE INDEX IF NOT EXISTS idx_gen_workout_ex_workout ON public.generated_workout_exercises(generated_workout_id);
CREATE INDEX IF NOT EXISTS idx_gen_workout_ex_exercise ON public.generated_workout_exercises(exercise_id);

-- Workout Sessions
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_started ON public.workout_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_status ON public.workout_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_deleted ON public.workout_sessions(user_id, deleted_at);

-- Session Exercises
CREATE INDEX IF NOT EXISTS idx_session_exercises_session ON public.session_exercises(workout_session_id);
CREATE INDEX IF NOT EXISTS idx_session_exercises_exercise ON public.session_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_session_exercises_user_deleted ON public.session_exercises(user_id, deleted_at);

-- Logged Sets
CREATE INDEX IF NOT EXISTS idx_logged_sets_exercise ON public.logged_sets(session_exercise_id, set_number);
CREATE INDEX IF NOT EXISTS idx_logged_sets_user_completed ON public.logged_sets(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_logged_sets_user_deleted ON public.logged_sets(user_id, deleted_at);

-- Favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_favorites_user_deleted ON public.favorites(user_id, deleted_at);

-- Recommendation Events & AI
CREATE INDEX IF NOT EXISTS idx_rec_events_user_created ON public.recommendation_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_coach_user_session ON public.ai_coach_messages(user_id, session_id);

-- Sync Operations
CREATE INDEX IF NOT EXISTS idx_sync_ops_user_status ON public.sync_operations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sync_ops_idempotency ON public.sync_operations(idempotency_key);

-- Catalog Indexes
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON public.exercises(difficulty);
CREATE INDEX IF NOT EXISTS idx_exercises_movement ON public.exercises(movement_pattern);
CREATE INDEX IF NOT EXISTS idx_exercises_active ON public.exercises(is_active);
CREATE INDEX IF NOT EXISTS idx_ex_muscles_muscle ON public.exercise_muscles(muscle_id);
CREATE INDEX IF NOT EXISTS idx_ex_equipment_equipment ON public.exercise_equipment(equipment_id);
CREATE INDEX IF NOT EXISTS idx_ex_joints_joint ON public.exercise_joints(joint_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all user-owned and catalog tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logged_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_coach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_operations ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.muscles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.joints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_muscles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_joints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_alternatives ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- User-Owned Table Policies (auth.uid() = user_id)
-- -----------------------------------------------------------------------------

-- Profiles
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY profiles_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY profiles_delete ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Workout Templates
CREATE POLICY templates_select ON public.workout_templates FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY templates_insert ON public.workout_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY templates_update ON public.workout_templates FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY templates_delete ON public.workout_templates FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Generated Workouts
CREATE POLICY gen_workouts_select ON public.generated_workouts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY gen_workouts_insert ON public.generated_workouts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY gen_workouts_update ON public.generated_workouts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY gen_workouts_delete ON public.generated_workouts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Generated Workout Exercises
CREATE POLICY gen_workout_ex_select ON public.generated_workout_exercises FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY gen_workout_ex_insert ON public.generated_workout_exercises FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY gen_workout_ex_update ON public.generated_workout_exercises FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY gen_workout_ex_delete ON public.generated_workout_exercises FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Workout Sessions
CREATE POLICY sessions_select ON public.workout_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY sessions_insert ON public.workout_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY sessions_update ON public.workout_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY sessions_delete ON public.workout_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Session Exercises
CREATE POLICY session_ex_select ON public.session_exercises FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY session_ex_insert ON public.session_exercises FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY session_ex_update ON public.session_exercises FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY session_ex_delete ON public.session_exercises FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Logged Sets
CREATE POLICY logged_sets_select ON public.logged_sets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY logged_sets_insert ON public.logged_sets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY logged_sets_update ON public.logged_sets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY logged_sets_delete ON public.logged_sets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Favorites
CREATE POLICY favorites_select ON public.favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY favorites_insert ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY favorites_update ON public.favorites FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY favorites_delete ON public.favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Recommendation Events
CREATE POLICY rec_events_select ON public.recommendation_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY rec_events_insert ON public.recommendation_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- AI Coach Messages
CREATE POLICY ai_messages_select ON public.ai_coach_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY ai_messages_insert ON public.ai_coach_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Sync Operations (Narrower: Read/Insert only for client)
CREATE POLICY sync_ops_select ON public.sync_operations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY sync_ops_insert ON public.sync_operations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Catalog Tables Policies (Public Read, No Public Write)
-- -----------------------------------------------------------------------------

CREATE POLICY muscles_public_read ON public.muscles FOR SELECT TO public USING (true);
CREATE POLICY equipment_public_read ON public.equipment FOR SELECT TO public USING (true);
CREATE POLICY joints_public_read ON public.joints FOR SELECT TO public USING (true);
CREATE POLICY exercises_public_read ON public.exercises FOR SELECT TO public USING (is_active = true);
CREATE POLICY ex_muscles_public_read ON public.exercise_muscles FOR SELECT TO public USING (true);
CREATE POLICY ex_equipment_public_read ON public.exercise_equipment FOR SELECT TO public USING (true);
CREATE POLICY ex_joints_public_read ON public.exercise_joints FOR SELECT TO public USING (true);
CREATE POLICY ex_media_public_read ON public.exercise_media FOR SELECT TO public USING (true);
CREATE POLICY ex_alt_public_read ON public.exercise_alternatives FOR SELECT TO public USING (true);
