# Database Design

Phase: 1 - Architecture and Data Design Review
Date: 2026-08-24

This document specifies the target Supabase/Postgres schema, relationships, and RLS strategy. It does not create migrations.

## Design Principles

- Supabase is the authenticated cloud replica, not the guest source of truth.
- Guest data remains in IndexedDB until the user signs in.
- Every user-owned table has `user_id uuid not null references auth.users(id)`.
- Mutable records use `created_at`, `updated_at`, `deleted_at`, `version`, and `client_updated_at`.
- Client-generated IDs are UUIDs. Use UUID v4 or UUID v7 consistently.
- Catalog tables are public read-only in V1.
- No service-role access from client-importable code.

## Core Workout Relationships

Exact relationship:

```text
WorkoutTemplate 1 -> many GeneratedWorkout
GeneratedWorkout 1 -> many WorkoutSession
WorkoutSession 1 -> many SessionExercise
SessionExercise 1 -> many Set
```

Meaning:

- `WorkoutTemplate`: reusable intent and constraints, e.g. "45-minute upper body hypertrophy with dumbbells".
- `GeneratedWorkout`: concrete deterministic output from the engine for a point in time, using an engine version and catalog version.
- `WorkoutSession`: one execution attempt of a generated workout.
- `SessionExercise`: one exercise inside a session, preserving order and planned prescription.
- `Set`: one logged set with reps, load, RPE, rest, and completion state.

## Exercise Library Relationships

Exact relationship:

```text
Exercise many -> many Muscle through exercise_muscles
Exercise many -> many Equipment through exercise_equipment
Exercise many -> many Joint through exercise_joints
Exercise 1 -> many Media
Exercise many -> many Exercise through Alternative
```

Meaning:

- `Exercise`: canonical movement.
- `Muscle`: anatomy target or stabilizer.
- `Equipment`: required or optional equipment.
- `Joint`: involved joint and movement pattern.
- `Media`: image/video/instruction assets.
- `Alternative`: substitution edge from one exercise to another with reason and constraints.

## Table Specifications

### profiles

One row per authenticated user.

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid primary key references auth.users(id) | owner |
| `display_name` | text | nullable |
| `units` | text | `metric` or `imperial` |
| `experience_level` | text | `beginner`, `intermediate`, `advanced` |
| `default_session_minutes` | integer | nullable |
| `created_at` | timestamptz | default now |
| `updated_at` | timestamptz | default now |

### workout_templates

| Column | Type | Notes |
|---|---|---|
| `id` | uuid primary key | client generated |
| `user_id` | uuid references auth.users(id) | owner |
| `name` | text | required |
| `goal` | text | e.g. strength, hypertrophy, endurance, mobility |
| `duration_minutes` | integer | required |
| `experience_level` | text | required |
| `target_muscle_ids` | uuid[] | denormalized planner intent |
| `avoid_muscle_ids` | uuid[] | nullable |
| `avoid_joint_ids` | uuid[] | nullable |
| `equipment_ids` | uuid[] | available equipment |
| `constraints` | jsonb | injuries, preferences, schedule |
| `is_favorite` | boolean | default false |
| `created_at` | timestamptz | default now |
| `updated_at` | timestamptz | default now |
| `client_updated_at` | timestamptz | from device |
| `deleted_at` | timestamptz | soft delete |
| `version` | integer | optimistic version |

Indexes:

- `(user_id, updated_at desc)`
- `(user_id, deleted_at)`

### generated_workouts

| Column | Type | Notes |
|---|---|---|
| `id` | uuid primary key | client generated |
| `user_id` | uuid references auth.users(id) | owner |
| `workout_template_id` | uuid references workout_templates(id) | nullable for one-off workouts |
| `name` | text | display |
| `goal` | text | copied from request |
| `duration_minutes` | integer | planned |
| `engine_version` | text | required |
| `catalog_version` | text | required |
| `seed` | text | required deterministic seed |
| `generation_input` | jsonb | sanitized input |
| `generation_trace` | jsonb | rule trace and exclusions |
| `created_at` | timestamptz | default now |
| `updated_at` | timestamptz | default now |
| `client_updated_at` | timestamptz | from device |
| `deleted_at` | timestamptz | soft delete |
| `version` | integer | optimistic version |

Indexes:

- `(user_id, created_at desc)`
- `(user_id, workout_template_id)`

### generated_workout_exercises

Preserves generated plan details before a session starts.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid primary key |
| `user_id` | uuid references auth.users(id) |
| `generated_workout_id` | uuid references generated_workouts(id) on delete cascade |
| `exercise_id` | uuid references exercises(id) |
| `position` | integer | zero-based or one-based; choose one and document |
| `planned_sets` | integer | required |
| `planned_reps_min` | integer | nullable |
| `planned_reps_max` | integer | nullable |
| `planned_duration_seconds` | integer | nullable |
| `planned_rest_seconds` | integer | nullable |
| `planned_load` | numeric | nullable |
| `intensity_target` | jsonb | RPE, tempo, notes |
| `notes` | text | nullable |
| `created_at` | timestamptz | default now |
| `updated_at` | timestamptz | default now |

Constraints:

- unique `(generated_workout_id, position)`

### workout_sessions

| Column | Type | Notes |
|---|---|---|
| `id` | uuid primary key |
| `user_id` | uuid references auth.users(id) |
| `generated_workout_id` | uuid references generated_workouts(id) |
| `started_at` | timestamptz | nullable until started |
| `completed_at` | timestamptz | nullable |
| `status` | text | `planned`, `active`, `completed`, `abandoned` |
| `duration_seconds` | integer | nullable |
| `perceived_exertion` | integer | 1-10 nullable |
| `satisfaction_rating` | integer | 1-5 nullable |
| `notes` | text | nullable |
| `created_at` | timestamptz | default now |
| `updated_at` | timestamptz | default now |
| `client_updated_at` | timestamptz | from device |
| `deleted_at` | timestamptz | soft delete |
| `version` | integer | optimistic version |

Indexes:

- `(user_id, started_at desc)`
- `(user_id, status)`

### session_exercises

| Column | Type | Notes |
|---|---|---|
| `id` | uuid primary key |
| `user_id` | uuid references auth.users(id) |
| `workout_session_id` | uuid references workout_sessions(id) on delete cascade |
| `exercise_id` | uuid references exercises(id) |
| `generated_workout_exercise_id` | uuid references generated_workout_exercises(id) | nullable |
| `position` | integer | required |
| `status` | text | `pending`, `active`, `completed`, `skipped`, `substituted` |
| `substituted_from_exercise_id` | uuid references exercises(id) | nullable |
| `substitution_reason` | text | nullable |
| `notes` | text | nullable |
| `created_at` | timestamptz | default now |
| `updated_at` | timestamptz | default now |
| `client_updated_at` | timestamptz | from device |
| `deleted_at` | timestamptz | soft delete |
| `version` | integer | optimistic version |

Constraints:

- unique `(workout_session_id, position)`

### sets

Use table name `logged_sets` if `sets` is considered too generic in implementation. Domain name remains `Set`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid primary key |
| `user_id` | uuid references auth.users(id) |
| `session_exercise_id` | uuid references session_exercises(id) on delete cascade |
| `set_number` | integer | required |
| `type` | text | `warmup`, `working`, `drop`, `failure`, `cooldown` |
| `target_reps` | integer | nullable |
| `actual_reps` | integer | nullable |
| `load_value` | numeric | nullable |
| `load_unit` | text | `kg`, `lb`, `bodyweight`, nullable |
| `duration_seconds` | integer | nullable |
| `distance_value` | numeric | nullable |
| `distance_unit` | text | nullable |
| `rpe` | numeric | nullable 1-10 |
| `rir` | numeric | nullable |
| `rest_seconds` | integer | nullable |
| `tempo` | text | nullable |
| `completed_at` | timestamptz | nullable |
| `status` | text | `planned`, `completed`, `skipped` |
| `notes` | text | nullable |
| `created_at` | timestamptz | default now |
| `updated_at` | timestamptz | default now |
| `client_updated_at` | timestamptz | from device |
| `deleted_at` | timestamptz | soft delete |
| `version` | integer | optimistic version |

Constraints:

- unique `(session_exercise_id, set_number)`

Indexes:

- `(user_id, completed_at desc)`
- `(session_exercise_id, set_number)`

## Exercise Catalog Tables

### exercises

| Column | Type | Notes |
|---|---|---|
| `id` | uuid primary key |
| `slug` | text unique |
| `name` | text |
| `description` | text |
| `movement_pattern` | text | push, pull, squat, hinge, carry, rotation, locomotion |
| `difficulty` | text |
| `mechanics` | text | compound, isolation |
| `force` | text | push, pull, static, dynamic |
| `instructions` | text[] |
| `contraindications` | jsonb |
| `default_prescription` | jsonb |
| `catalog_version` | text |
| `is_active` | boolean |
| `created_at` | timestamptz |
| `updated_at` | timestamptz |

### muscles

| Column | Type | Notes |
|---|---|---|
| `id` | uuid primary key |
| `slug` | text unique |
| `name` | text |
| `region` | text |
| `parent_muscle_id` | uuid references muscles(id) | nullable |
| `map_path_id` | text | SVG/body map identifier |
| `description` | text |

### equipment

| Column | Type | Notes |
|---|---|---|
| `id` | uuid primary key |
| `slug` | text unique |
| `name` | text |
| `category` | text |
| `is_common_home_equipment` | boolean |

### joints

| Column | Type | Notes |
|---|---|---|
| `id` | uuid primary key |
| `slug` | text unique |
| `name` | text |
| `region` | text |
| `map_path_id` | text |

### exercise_muscles

| Column | Type | Notes |
|---|---|---|
| `exercise_id` | uuid references exercises(id) |
| `muscle_id` | uuid references muscles(id) |
| `role` | text | `primary`, `secondary`, `stabilizer` |
| `activation_level` | integer | 1-5 |

Primary key: `(exercise_id, muscle_id, role)`

### exercise_equipment

| Column | Type | Notes |
|---|---|---|
| `exercise_id` | uuid references exercises(id) |
| `equipment_id` | uuid references equipment(id) |
| `requirement` | text | `required`, `optional`, `alternative` |

Primary key: `(exercise_id, equipment_id)`

### exercise_joints

| Column | Type | Notes |
|---|---|---|
| `exercise_id` | uuid references exercises(id) |
| `joint_id` | uuid references joints(id) |
| `movement` | text | flexion, extension, abduction, etc. |
| `stress_level` | integer | 1-5 |

Primary key: `(exercise_id, joint_id, movement)`

### exercise_media

| Column | Type | Notes |
|---|---|---|
| `id` | uuid primary key |
| `exercise_id` | uuid references exercises(id) |
| `media_type` | text | `image`, `video`, `animation` |
| `url` | text |
| `thumbnail_url` | text |
| `alt_text` | text |
| `source` | text |
| `sort_order` | integer |

### exercise_alternatives

| Column | Type | Notes |
|---|---|---|
| `id` | uuid primary key |
| `exercise_id` | uuid references exercises(id) |
| `alternative_exercise_id` | uuid references exercises(id) |
| `reason` | text | equipment, joint-friendly, easier, harder |
| `similarity_score` | numeric | 0-1 |
| `notes` | text |

Constraint:

- unique `(exercise_id, alternative_exercise_id, reason)`

## Recommendation Tables

### recommendation_events

Stores impressions, accepts, dismissals, and ratings.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid primary key |
| `user_id` | uuid references auth.users(id) |
| `recommendation_type` | text |
| `entity_type` | text |
| `entity_id` | uuid |
| `reason_codes` | text[] |
| `score` | numeric |
| `action` | text | `shown`, `accepted`, `dismissed`, `rated` |
| `rating` | integer | nullable |
| `context` | jsonb |
| `created_at` | timestamptz |

## AI Tables

### ai_coach_messages

Optional persistence for authenticated users who opt into history.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid primary key |
| `user_id` | uuid references auth.users(id) |
| `related_entity_type` | text |
| `related_entity_id` | uuid |
| `prompt_kind` | text |
| `request_hash` | text |
| `response_text` | text |
| `provider` | text |
| `model` | text |
| `created_at` | timestamptz |

## Sync Metadata Table

### sync_operations

Cloud copy of processed idempotency keys for duplicate prevention and diagnostics.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid primary key |
| `user_id` | uuid references auth.users(id) |
| `idempotency_key` | text unique |
| `operation` | text | `insert`, `update`, `delete`, `upsert` |
| `entity_type` | text |
| `entity_id` | uuid |
| `status` | text | `processed`, `rejected` |
| `request_hash` | text |
| `error_data` | jsonb |
| `created_at` | timestamptz |
| `processed_at` | timestamptz |

## RLS Strategy

General policy:

- Enable RLS on all user-owned tables.
- `select`, `insert`, `update`, `delete` only when `auth.uid() = user_id`.
- Disallow hard deletes from client for records that need sync; use soft delete.
- Catalog tables allow public `select`, no public writes.
- `sync_operations` allow users to read/insert only their own idempotency records.
- AI message history is user-owned and opt-in.

Representative policies:

```sql
create policy "user_select_own_workout_sessions"
on workout_sessions for select
using (auth.uid() = user_id);

create policy "user_insert_own_workout_sessions"
on workout_sessions for insert
with check (auth.uid() = user_id);

create policy "user_update_own_workout_sessions"
on workout_sessions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

Catalog policy:

```sql
create policy "public_read_exercises"
on exercises for select
using (is_active = true);
```

Realtime:

- Enable realtime only for authenticated user-owned tables required by dashboard/session sync.
- Client subscriptions must filter by `user_id = auth.uid()`.
- RLS remains the final data isolation layer.

## Indexing Strategy

Minimum indexes:

- All foreign keys.
- `(user_id, updated_at desc)` on mutable user tables.
- `(user_id, deleted_at)` on soft-deleted user tables.
- `(user_id, client_updated_at desc)` for sync scans.
- `(session_exercise_id, set_number)` for set logging.
- `(exercise_id)` on all join tables.
- `(muscle_id)`, `(equipment_id)`, `(joint_id)` on catalog joins.
- unique `slug` on catalog base tables.
- unique `idempotency_key` on `sync_operations`.

## Incremental Migration Notes

Existing code can migrate incrementally:

- Current localStorage `savedWorkoutPlans` maps to `workout_templates` and `generated_workouts` depending on shape.
- Current `completedExercises` maps only partially; set-by-set logging requires new session model.
- Existing `exerciseDatabase` can seed `exercises`, `muscles`, `equipment`, and joins after stable IDs are assigned.
- Existing `userProfile.completedWorkouts` becomes derived or imported into `workout_sessions`.
- Existing favorites split should become either `workout_templates.is_favorite` or a generic `favorites` table if multiple entity types need favorite state.
