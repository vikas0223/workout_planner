-- ==============================================================================
-- PHASE 2J: PROGRAMS, GOALS & CHALLENGES SCHEMA MIGRATION
-- Supports user-owned training programs, granular program days, fitness goal targets,
-- and challenge participation with strict Row Level Security.
-- ==============================================================================

-- 1. Programs Table
CREATE TABLE IF NOT EXISTS public.programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    goal TEXT,
    difficulty TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
    start_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    current_week_number INTEGER DEFAULT 1,
    current_day_number INTEGER DEFAULT 1,
    is_custom BOOLEAN DEFAULT false,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    client_updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMPTZ
);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own programs"
    ON public.programs
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_programs_user_id ON public.programs(user_id);
CREATE INDEX IF NOT EXISTS idx_programs_status ON public.programs(user_id, status);

-- 2. Program Weeks Table
CREATE TABLE IF NOT EXISTS public.program_weeks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    label TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    client_updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMPTZ
);

ALTER TABLE public.program_weeks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own program weeks"
    ON public.program_weeks
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_program_weeks_program_id ON public.program_weeks(program_id);

-- 3. Program Days Table
CREATE TABLE IF NOT EXISTS public.program_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    program_week_id UUID NOT NULL REFERENCES public.program_weeks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 7),
    type TEXT NOT NULL DEFAULT 'workout' CHECK (type IN ('workout', 'rest', 'recovery', 'mobility')),
    label TEXT,
    workout_template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'skipped', 'rescheduled')),
    scheduled_date DATE,
    effective_date DATE,
    completed_session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    client_updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMPTZ
);

ALTER TABLE public.program_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own program days"
    ON public.program_days
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_program_days_program_id ON public.program_days(program_id);
CREATE INDEX IF NOT EXISTS idx_program_days_week_id ON public.program_days(program_week_id);
CREATE INDEX IF NOT EXISTS idx_program_days_template_id ON public.program_days(workout_template_id);

-- 4. Fitness Goals Table
CREATE TABLE IF NOT EXISTS public.fitness_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('weight', 'frequency', 'strength', 'volume', 'workouts_completed', 'personal_record', 'body_metric')),
    direction TEXT NOT NULL DEFAULT 'increase' CHECK (direction IN ('increase', 'decrease', 'maintain')),
    label TEXT,
    target_value NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    start_value NUMERIC,
    start_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    target_date TIMESTAMPTZ,
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    client_updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMPTZ
);

ALTER TABLE public.fitness_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own fitness goals"
    ON public.fitness_goals
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_fitness_goals_user_id ON public.fitness_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_fitness_goals_status ON public.fitness_goals(user_id, status);

-- 5. Platform Challenges (Publicly Readable Catalog)
CREATE TABLE IF NOT EXISTS public.challenges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('workout_count', 'set_count', 'volume', 'frequency', 'streak', 'personal_record')),
    target_value NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated or anonymous can view challenges"
    ON public.challenges
    FOR SELECT
    USING (true);

-- Seed Platform Challenges Catalog
INSERT INTO public.challenges (id, name, description, type, target_value, unit, start_date, end_date, status)
VALUES
    ('chal_cat_7d_consistency', '7-Day Consistency Kickoff', 'Complete 4 workouts over a 7-day period to build immediate training momentum.', 'workout_count', 4, 'workouts', '2026-01-01T00:00:00Z', '2026-12-31T23:59:59Z', 'active'),
    ('chal_cat_100_sets', 'Century Club: 100 Performed Sets', 'Log 100 working sets across any completed workout sessions.', 'set_count', 100, 'sets', '2026-01-01T00:00:00Z', '2026-12-31T23:59:59Z', 'active'),
    ('chal_cat_10_workouts', 'Iron Milestone: 10 Workouts', 'Complete 10 total workout sessions across any routines or programs.', 'workout_count', 10, 'workouts', '2026-01-01T00:00:00Z', '2026-12-31T23:59:59Z', 'active'),
    ('chal_cat_5d_streak', 'Streak Starter: 5-Day Workout Streak', 'Build a continuous 5-day active workout streak.', 'streak', 5, 'days', '2026-01-01T00:00:00Z', '2026-12-31T23:59:59Z', 'active'),
    ('chal_cat_10t_volume', 'Titan Volume: 10,000 kg Moved', 'Accumulate 10,000 kg in total load volume across your workouts.', 'volume', 10000, 'kg', '2026-01-01T00:00:00Z', '2026-12-31T23:59:59Z', 'active')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    type = EXCLUDED.type,
    target_value = EXCLUDED.target_value,
    unit = EXCLUDED.unit,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    status = EXCLUDED.status,
    updated_at = timezone('utc'::text, now());

-- 6. User Challenge Progress / Participation Table
CREATE TABLE IF NOT EXISTS public.challenge_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id TEXT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    client_updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_user_challenge UNIQUE (user_id, challenge_id)
);

ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own challenge participation"
    ON public.challenge_progress
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_challenge_progress_user_id ON public.challenge_progress(user_id);
