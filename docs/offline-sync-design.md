# Offline Sync Design

Phase: 1 - Architecture and Data Design Review
Date: 2026-08-24

This document defines IndexedDB local-first storage, sync queue behavior, conflict rules, offline behavior, retry behavior, and duplicate prevention. It does not implement storage or sync code.

## Core Decision

IndexedDB is the local source of truth. Supabase is the authenticated cloud replica. Guest mode never writes to Supabase. When a guest signs in, local records are re-owned by the authenticated user and queued for sync.

## IndexedDB Schema

Database name: `workout_planner`

Schema version: start at `1`

Object stores:

```text
meta
local_profiles
exercise_catalog
muscle_catalog
equipment_catalog
joint_catalog
exercise_muscles
exercise_equipment
exercise_joints
exercise_media
exercise_alternatives
workout_templates
generated_workouts
generated_workout_exercises
workout_sessions
session_exercises
sets
recommendation_events
ai_coach_cache
sync_queue
sync_conflicts
sync_cursors
outbox_locks
```

## Common Local Record Shape

All mutable local records should include:

```ts
type LocalRecordMeta = {
  id: string
  ownerKind: "guest" | "user"
  ownerId: string
  createdAt: string
  updatedAt: string
  clientUpdatedAt: string
  deletedAt?: string | null
  version: number
  syncStatus: "local" | "queued" | "syncing" | "synced" | "conflict" | "error"
  lastSyncedAt?: string | null
}
```

Catalog records use `catalogVersion` and do not need owner fields.

## IndexedDB Store Details

### meta

Keys:

- `schema_version`
- `catalog_version`
- `engine_version`
- `local_profile_id`
- `last_successful_sync_at`
- `last_localstorage_migration_at`

### local_profiles

Local guest or authenticated profile settings.

Indexes:

- `ownerKind`
- `ownerId`

### catalog stores

Stores:

- `exercise_catalog`
- `muscle_catalog`
- `equipment_catalog`
- `joint_catalog`
- join stores and media/alternatives

Behavior:

- Seeded from bundled app catalog.
- Refreshed by catalog version in a later phase.
- Read-only for the user.

### workout stores

Stores mirror the domain:

- `workout_templates`
- `generated_workouts`
- `generated_workout_exercises`
- `workout_sessions`
- `session_exercises`
- `sets`

Important indexes:

- `ownerId`
- `[ownerId, updatedAt]`
- `[ownerId, syncStatus]`
- `workoutTemplateId`
- `generatedWorkoutId`
- `workoutSessionId`
- `sessionExerciseId`
- `[sessionExerciseId, setNumber]`
- `[ownerId, deletedAt]`

### sync_queue

Required fields:

| Field | Type | Notes |
|---|---|---|
| `id` | string | local queue record ID |
| `operation` | string | `insert`, `update`, `delete`, `upsert` |
| `entityType` | string | domain entity type |
| `entityId` | string | UUID |
| `idempotencyKey` | string | stable duplicate-prevention key |
| `payload` | object | sanitized entity delta or full upsert body |
| `baseVersion` | number | version known when op was created |
| `baseUpdatedAt` | string | remote/local timestamp known when op was created |
| `retryCount` | number | starts at 0 |
| `status` | string | `pending`, `processing`, `succeeded`, `failed`, `conflict`, `dead` |
| `createdAt` | string | ISO |
| `updatedAt` | string | ISO |
| `nextAttemptAt` | string | ISO |
| `lastAttemptAt` | string | nullable |
| `processedAt` | string | nullable |
| `errorData` | object | nullable structured error |

Indexes:

- `status`
- `nextAttemptAt`
- `[status, nextAttemptAt]`
- `entityType`
- `entityId`
- `idempotencyKey` unique

### sync_conflicts

Fields:

- `id`
- `entityType`
- `entityId`
- `localRecord`
- `remoteRecord`
- `conflictReason`
- `resolutionStatus`
- `createdAt`
- `resolvedAt`

## Sync Record Example

```json
{
  "id": "queue_018f...",
  "operation": "upsert",
  "entityType": "Set",
  "entityId": "018f...",
  "idempotencyKey": "user_123:Set:018f...:v4",
  "payload": {
    "id": "018f...",
    "session_exercise_id": "018e...",
    "set_number": 3,
    "actual_reps": 10,
    "load_value": 25,
    "load_unit": "kg",
    "rpe": 8,
    "status": "completed",
    "client_updated_at": "2026-08-24T10:00:00.000Z",
    "version": 4
  },
  "baseVersion": 3,
  "baseUpdatedAt": "2026-08-24T09:59:00.000Z",
  "retryCount": 0,
  "status": "pending",
  "createdAt": "2026-08-24T10:00:01.000Z",
  "updatedAt": "2026-08-24T10:00:01.000Z",
  "nextAttemptAt": "2026-08-24T10:00:01.000Z",
  "lastAttemptAt": null,
  "processedAt": null,
  "errorData": null
}
```

## Sync Worker Design

Triggers:

- app start
- auth state changes
- network comes online
- periodic interval while app is open
- service worker background sync where supported
- manual "sync now"

Processing order:

1. owner/profile link operations
2. workout templates
3. generated workouts
4. generated workout exercises
5. workout sessions
6. session exercises
7. sets
8. recommendation events
9. AI cache opt-in records

Dependency rule: child records must not sync before parent records succeed.

Batching:

- Process small batches, e.g. 25 operations.
- Group by entity type only when parent ordering is safe.
- Keep individual idempotency keys for every record mutation.

Locking:

- Use an `outbox_locks` store to prevent two browser tabs from processing the same queue concurrently.
- Lock expires after a short TTL, e.g. 30 seconds.
- A tab renews lock while processing.

## Idempotency And Duplicate Prevention

Idempotency key format:

```text
{ownerId}:{entityType}:{entityId}:{operation}:{version}
```

Rules:

- Same entity version must produce the same key.
- Retrying does not create a new key.
- Changing the entity increments local version and creates a new key.
- Supabase has a `sync_operations.idempotency_key` unique constraint.
- If the cloud has processed a key, the client marks the queue item succeeded.

Duplicate prevention:

- Object store unique indexes prevent duplicate local IDs.
- `sets` unique index on `[sessionExerciseId, setNumber]`.
- Supabase unique `(session_exercise_id, set_number)`.
- Sync queue unique `idempotencyKey`.
- Cloud `sync_operations` unique `idempotency_key`.

## Conflict Rules

Default conflict model: deterministic field-level resolution where safe; conflict record where unsafe.

Entity conflict policy:

| Entity | Rule |
|---|---|
| `WorkoutTemplate` | last writer wins for metadata; merge favorite flag with OR if one side true and neither deleted |
| `GeneratedWorkout` | immutable after creation except favorite/name/notes; conflicting engine output creates conflict |
| `GeneratedWorkoutExercise` | immutable after creation; conflict if changed |
| `WorkoutSession` | status precedence: completed > active > planned > abandoned unless deleted |
| `SessionExercise` | completed beats pending; skipped/substituted conflicts with completed |
| `Set` | field-level merge when different fields changed; same field conflict uses higher version, then later `clientUpdatedAt`; keep conflict audit |
| `RecommendationEvent` | append-only; no conflict |
| `AI cache` | cache by request hash; no conflict |

Delete rules:

- Soft delete wins only if `deletedAt` is later than both local and remote `updatedAt`.
- Completed sessions and sets should not be hard-deleted by sync.
- If one side updates after the other side deletes, create conflict unless entity is low-value metadata.

Set-specific conflict rules:

- Same `set.id`, different reps/load/RPE changed offline on two devices: mark conflict and prefer later `clientUpdatedAt` for active value.
- Same `sessionExerciseId + setNumber`, different IDs: merge into one canonical set if values match; otherwise create duplicate-set conflict.
- Completed set should never be overwritten by planned set.

## Offline Behavior

Guest offline:

- Full planner works.
- Deterministic workout generation works from local catalog.
- Workout execution and set logging work.
- Dashboard uses local data.
- Recommendations use local data.
- AI coach shows offline unavailable state unless cached answer exists.
- Sync indicator says "Local only - sign in to sync".

Authenticated offline:

- Same as guest, plus all mutations queue for sync.
- Last known cloud data remains available locally.
- Sync indicator shows pending count and last successful sync.

Data loss rules:

- Never require network to save a set.
- A set log command must first commit to IndexedDB, then enqueue sync.
- If queue write fails after entity write, recovery scanner must detect unsynced dirty records and enqueue them.

## Retry Behavior

Retryable errors:

- network failure
- timeout
- 429 rate limit
- 5xx Supabase/API response
- auth token refresh transient failure

Non-retryable errors:

- RLS violation
- validation error
- missing required parent after retries
- catalog version mismatch requiring migration

Backoff:

```text
attempt 1: immediate
attempt 2: 5 seconds
attempt 3: 30 seconds
attempt 4: 2 minutes
attempt 5: 10 minutes
attempt 6+: 30 minutes, max retry count before dead-letter
```

Status transitions:

```text
pending -> processing -> succeeded
pending -> processing -> pending
pending -> processing -> conflict
pending -> processing -> failed -> pending
failed -> dead
```

Dead-letter:

- After maximum retry count, mark `dead`.
- Keep error data.
- Show "Needs attention" in settings.
- Allow manual retry after user action.

## Sync Pull Strategy

Push local queue first, then pull remote changes.

Pull mechanism:

- Maintain `sync_cursors` per entity type with last `updated_at`.
- Fetch remote rows where `updated_at > cursor` or `deleted_at > cursor`.
- Apply conflict rules against dirty local records.
- Update cursor only after batch is fully applied.

Realtime:

- Realtime is an acceleration, not the source of truth.
- Realtime event triggers a pull for affected entity type and user.
- Do not directly trust realtime payload as the final local write.

## Account Linking

On sign-in:

1. Pause sync worker.
2. Read current guest `local_profile_id`.
3. Create or load authenticated profile.
4. For guest-owned mutable records, rewrite `ownerKind` to `user` and `ownerId` to `auth.uid()`.
5. Enqueue upserts for rewritten records.
6. Resume sync.
7. Keep a local account-link audit record.

Duplicate prevention during linking:

- If authenticated cloud already has records, pull first into a staging comparison.
- Match likely duplicate workouts by `engineVersion + catalogVersion + seed + createdAt window`.
- Match likely duplicate sessions by `generatedWorkoutId + startedAt window`.
- Never auto-merge sets with conflicting numeric values without preserving a conflict record.

## localStorage Migration

Existing keys:

- `savedWorkoutPlans`
- `userProfile`
- `returningUsers`
- `completedExercises`
- `savedWorkouts`
- `favoriteExercises`
- `workoutAppUserId`
- `workoutAppUserName`

Migration plan:

1. Detect if migration has already run in `meta.last_localstorage_migration_at`.
2. Parse each key defensively.
3. Convert records into target IndexedDB stores with generated stable IDs where missing.
4. Preserve original raw payload in a migration audit record for rollback/debug.
5. Do not delete old keys in the first release.
6. After successful release window, mark old localStorage keys as legacy read-only.

## Validation Rules

Before local commit:

- Required IDs exist.
- Parent references exist locally.
- Set number is positive and unique within session exercise.
- Completed set has at least one measurable value: reps, duration, distance, or explicit skipped status.
- Generated workout has engine version, catalog version, and seed.

Before sync:

- Owner is authenticated user.
- Payload conforms to Supabase schema.
- Parent operation has succeeded or parent exists remotely.
- Idempotency key exists.

## Implementation-Ready Sequence For Antigravity

1. Define IndexedDB schema constants and migration plan.
2. Build repository interfaces and fake in-memory test repositories.
3. Implement IndexedDB adapter with migrations.
4. Add local write commands for template, generated workout, session, session exercise, and set.
5. Add sync queue writes to every mutation command.
6. Add localStorage import adapter.
7. Add sync worker with lock, backoff, and status transitions.
8. Add Supabase repositories and idempotency table usage.
9. Add pull sync and cursor application.
10. Add conflict store and visible sync status UI.
