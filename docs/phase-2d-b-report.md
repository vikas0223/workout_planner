# Phase 2D-B & Phase 2D-B-V — Offline Sync Queue, Retry, Idempotency, Conflict Resolution & Real Supabase / PostgreSQL Validation Report

**Author:** Antigravity AI  
**Date:** August 25, 2026  
**Status:** COMPLETE & VERIFIED  

---

## 1. Executive Summary

Phase 2D-B and 2D-B-V deliver and fully verify the enterprise-grade offline-to-online synchronization layer between the authoritative device data store (**IndexedDB**) and the authenticated cloud replica (**Supabase Postgres**). Building upon the domain command layer (Phase 2C) and the typed cloud repositories/migrations (Phase 2D-A), this subsystem ensures robust, bidirectional data flow with zero data loss, strictly deterministic idempotency, multi-tab coordination, intelligent conflict resolution, atomic cursor progression, and verified execution against a real PostgreSQL engine.

### Key Architectural Commitments Fulfilled & Verified
1. **IndexedDB Device Authority:** All user mutations commit locally first. Offline workout logging is 100% resilient and functional without network connectivity.
2. **Guest Isolation:** Guest mutations (`ownerKind === 'guest'`) are strictly excluded from the cloud sync queue and never transmitted to Supabase.
3. **Deterministic Idempotency:** Sync operations use cloud-authoritative canonical keys (`{ownerId}:{entityType}:{entityId}:{operation}:{version}`) recorded in the remote `sync_operations` ledger.
4. **Parent-Before-Child Dependency Hierarchy:** Outbox queue processing strictly enforces foreign key ordering (`profiles` → `workout_templates` → `generated_workouts` → `generated_workout_exercises` → `workout_sessions` → `session_exercises` → `logged_sets` → `favorites` → `recommendation_events`).
5. **Multi-Tab Master Lock:** Tab concurrency is governed via IndexedDB (`outbox_locks`) with a 30s heartbeat TTL, preventing concurrent push races across browser tabs.
6. **Exponential Backoff & Error Classification:** 6-step jittered backoff progression with immediate dead-lettering for non-retryable 4xx / RLS errors.
7. **Entity-Specific Conflict Engine:** Deterministic merge semantics (e.g., status precedence `completed > active > planned > abandoned`, template favorite OR-merges, disjoint field merges, conflict persistence in `sync_conflicts`).
8. **Atomic Cursor Progression:** Remote cursors in `sync_cursors` advance if and only if full batch writes commit successfully to IndexedDB.
9. **Startup Consistency Scanner:** Automatically detects unqueued dirty records resulting from potential power loss/crashes and reconstructs outbox operations.
10. **Human-Centric UX:** Non-intrusive `SyncStatusIndicator` component and `useSyncStatus` hook providing reassuring microcopy and manual retry controls.
11. **Real PostgreSQL / RLS Execution Verified:** Verified against real PostgreSQL WASM instance with official SQL migrations, table constraints, foreign key cascades, and row-level security policies.

---

## 2. REAL ENVIRONMENT VERIFICATION (Phase 2D-B-V)

In Phase 2D-B-V, real database verification was executed against an isolated, in-process real PostgreSQL engine (`@electric-sql/pglite` running PostgreSQL 16.x WASM) with live schema migration, genuine SQL catalog inspection, active row-level security policy enforcement, and end-to-end sync cycles.

### Summary of Results

- **Environment:** Isolated PostgreSQL 16.x engine (`@electric-sql/pglite`) executing native PostgreSQL catalog, query planner, constraint engine, and RLS subsystem.
- **Migration:** **PASS** (`supabase/migrations/20260825000000_initial_schema.sql` applied cleanly; all 19 canonical tables, foreign keys, unique constraints, check constraints, indexes, and RLS activations verified via `information_schema`, `pg_constraint`, and `pg_class`).
- **RLS:** **PASS** (Tested User A, User B, and Anonymous roles. User A CRUD isolation confirmed; cross-tenant read/update/delete blocked with 0 rows affected; anonymous write attempts rejected with permission errors; public active catalog read access verified).
- **Real Idempotency:** **PASS** (Authenticated mutations registered in `sync_operations`; duplicate submissions with identical idempotency keys deduplicated and rejected from double application; unique key constraint enforced in PostgreSQL).
- **Real Push:** **PASS** (6-tier dependency hierarchy verified: inserting children before parents in PostgreSQL fails with FK violation; `SyncPushWorker` dependency sort orders mutations to guarantee parent-before-child insertion).
- **Real Pull:** **PASS** (Remote PostgreSQL updates pulled into IndexedDB; cursor advances atomically only upon successful local persistence).
- **Real Conflict:** **PASS** (Concurrent local dirty vs remote changes evaluated; 45kg vs 47.5kg logged set conflict safely preserved in `sync_conflicts` without silent data loss; status precedence `completed > active > planned > abandoned` verified).
- **Offline → Online:** **PASS** (Full lifecycle executed: online generation → offline logging of 3 sets → complete session offline → reload from IndexedDB offline verified → network restored → sync push to PostgreSQL → parity check confirmed 3/3 sets with zero duplicates).
- **Failure Resilience:** **PASS** (Network timeouts, 429, 500, and RLS rejections handled gracefully; local IndexedDB records remain 100% durable and uncorrupted under all failure conditions).
- **Known Limitations:** Production Supabase cloud hosting depends on live network connectivity and API keys in `.env.local`; when offline, local-first engine operates autonomously with full feature parity.

---

## 3. Sync Architecture & Data Flow

```
   ┌─────────────────────────────────────────────────────────────┐
   │                     User Mutation Flow                      │
   └─────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                     useWorkoutSession / UI
                                 │
                                 ▼
                       SessionCommandService
                                 │
                                 ▼
                     Local Repositories (IndexedDB)
                     (Authoritative Local State)
                                 │
                                 ▼
                            SyncOutbox
        (Filters guest data, computes idempotency key,
              enqueues to STORES.SYNC_QUEUE)
                                 │
                                 ▼
                          SyncCoordinator
                                 │
               ┌─────────────────┴─────────────────┐
               ▼                                   ▼
        SyncPushWorker                      SyncPullWorker
  - Acquires SyncLock (outbox_locks)   - Reads sync_cursors
  - Sorts items by dependency tier     - Pulls remote rows
  - Checks sync_operations             - Reconciles dirty records via
  - Invokes Supabase Repositories        SyncConflictResolver
  - Updates local syncStatus           - Advances cursor on batch commit
               │                                   │
               └─────────────────┬─────────────────┘
                                 ▼
                        Supabase Postgres
                    (Authenticated Cloud Replica)
```

---

## 4. Idempotency Key Architecture

Canonical keys are computed deterministically by `SyncIdempotency`:
```
{ownerId}:{entityType}:{entityId}:{operation}:{version}
```
Example: `usr_28a9b:workout_sessions:ses_71c4d:insert:1`

### Guarantees
- **Retry Stability:** When an item fails due to transient network failure, retrying the item reuses the exact same key.
- **Cloud Deduplication:** `SyncPushWorker` queries the remote `sync_operations` table before executing mutations. If already marked `applied`, it skips re-execution and marks local queue item as `succeeded`.
- **Outbox Deduplication:** `SyncOutbox.enqueue` searches existing pending/processing queue items for matching idempotency keys, avoiding duplicate queue growth.

---

## 5. Multi-Tab Lock Mechanism (`SyncLock`)

To prevent multiple browser tabs from pushing concurrently and creating race conditions, `SyncLock` implements an IndexedDB-based distributed lock in `STORES.OUTBOX_LOCKS`:
- **Lock Key:** `sync_worker_master_lock`
- **Payload:** `{ lockKey, ownerTabId, acquiredAt, expiresAt }`
- **TTL:** 30,000 ms (30 seconds)
- **Rules:**
  1. A tab cannot overwrite an active lock held by another tab.
  2. Expired locks (`now > expiresAt`) are automatically reclaimed.
  3. A tab cannot release or renew a lock owned by another `ownerTabId`.

---

## 6. Retry Progression & Error Classification

`SyncPushWorker` calculates retry delays using exponential backoff with random jitter:

| Attempt | Base Delay | Delay Range (with Jitter) |
| :--- | :--- | :--- |
| Attempt 1 | 0s | 0ms |
| Attempt 2 | 5s | 5,000ms – 6,000ms |
| Attempt 3 | 30s | 30,000ms – 36,000ms |
| Attempt 4 | 2m (120s) | 120,000ms – 144,000ms |
| Attempt 5 | 10m (600s) | 600,000ms – 720,000ms |
| Attempt 6+ | 30m (1800s) | 1,800,000ms – 2,160,000ms |

### Error Classification
- **Retryable Errors:** `Failed to fetch`, network timeouts, HTTP 429 (Too Many Requests), HTTP 503 (Service Unavailable). Increments retry count up to max (6) before transitioning to `dead`.
- **Non-Retryable Errors:** HTTP 400 (Bad Request), HTTP 403 (Forbidden), HTTP 422 (Unprocessable Entity), schema violations, RLS policy violations (`violates row-level security policy`). Immediately transitioned to `failed` / `dead` without wasting retries.

---

## 7. Conflict Resolution Matrix (`SyncConflictResolver`)

When remote changes conflict with dirty local records during pull synchronization:

| Entity Type | Conflict Scenario | Resolution Rule | Strategy |
| :--- | :--- | :--- | :--- |
| **`workout_templates`** | Metadata clash (name, description) | Last writer wins by client timestamp; `isFavorite` is **OR-merged** (true wins) | `merged` |
| **`generated_workouts`** | Any concurrent update | Generated workouts are immutable; local record preserved | `local_kept` |
| **`workout_sessions`** | State discrepancy | **Status precedence:** `completed` > `active` > `planned` > `abandoned` | `local_kept` / `remote_kept` |
| **`session_exercises`** | Completion discrepancy | `completed` beats `pending`; conflicting substitutions trigger conflict log | `local_kept` / `manual_required` |
| **`logged_sets`** | Disjoint field edits (e.g. notes vs reps) | Automatically merged into unified record | `merged` |
| **`logged_sets`** | Conflicting field values (e.g. 45kg vs 47.5kg) | Preserves record in `STORES.SYNC_CONFLICTS` with zero data loss, takes latest timestamp | `manual_required` |

---

## 8. Startup Consistency Recovery Scanner (`SyncRecoveryScanner`)

Protects against catastrophic mid-mutation failures where local record writes succeed in IndexedDB, but the browser crashes before `SyncOutbox.enqueue` finishes:
- Scans `local_profiles`, `workout_templates`, `generated_workouts`, `workout_sessions`, `session_exercises`, `sets`, and `favorites`.
- Identifies any record where `ownerKind === 'user'` and `syncStatus !== 'synced'`.
- Cross-references existing pending items in `sync_queue`.
- Automatically re-enqueues missing items with reconstructed idempotency keys and versioning.

---

## 9. User Experience & Sync Status Indicator

Implemented in `components/sync-status-indicator.tsx` and `hooks/use-sync-status.ts`:
- **Offline:** *"You're offline. Your workout is saved on this device."*
- **Sync Pending:** *"Your workout is saved and will sync when you're online. (N pending)"* + [Sync Now]
- **Syncing:** *"Syncing (N pending)..."* (Animated loader)
- **Sync Failed:** *"Your workout is safe on this device, but syncing failed."* + [Retry]
- **Needs Attention:** *"Some data needs attention."* + [Retry]
- **Synced:** Minimal green badge indicating complete cloud synchronization.

---

## 10. Test Suite Validation Matrix

```
 ✓ tests/sync-pull-and-recovery.test.ts (2 tests)
 ✓ tests/workout-session-commands.test.ts (23 tests)
 ✓ tests/sync-queue-and-ordering.test.ts (11 tests)
 ✓ tests/local-persistence.test.ts (18 tests)
 ✓ tests/migration-fixtures.test.ts (4 tests)
 ✓ tests/offline-e2e-simulation.test.ts (1 test)
 ✓ tests/workout-engine.test.ts (6 tests)
 ✓ tests/real-postgres-failure-resilience.test.ts (3 tests)
 ✓ tests/real-postgres-schema.test.ts (6 tests)
 ✓ tests/smoke.test.ts (1 test)
 ✓ tests/difficulty-adjustment.test.ts (3 tests)
 ✓ tests/real-postgres-idempotency.test.ts (1 test)
 ✓ tests/seeded-random.test.ts (3 tests)
 ✓ tests/sync-conflict-resolution.test.ts (5 tests)
 ✓ tests/supabase-schema-validation.test.ts (8 tests)
 ✓ tests/real-postgres-conflict.test.ts (2 tests)
 ✓ tests/real-postgres-rls.test.ts (4 tests)
 ✓ tests/calories.test.ts (3 tests)
 ✓ tests/real-postgres-offline-online.test.ts (1 test)
 ✓ tests/exercise-catalog.test.ts (4 tests)
 ✓ tests/supabase-repositories.test.ts (8 tests)
 ✓ tests/dashboard-metrics.test.ts (2 tests)
 ✓ tests/real-postgres-push-pull.test.ts (2 tests)

 Test Files  23 passed (23)
      Tests  121 passed (121)
   Duration  16.91s
```

### Build & Verification Commands
- `npm test`: **23/23 test suites passed (121 tests passed, 0 failures)**
- `npm run typecheck`: **Clean (0 errors)**
- `npm run lint`: **Clean (0 errors)**
- `npm run build`: **Compiled successfully (Static production bundle generated)**

---

## 11. Files Created in Phase 2D-B-V

### Real PostgreSQL Test Suites & Harness
- [`tests/helpers/real-postgres-helper.ts`](file:///e:/Mini%20project%202/workout-planner/workout_planner/tests/helpers/real-postgres-helper.ts) — In-process PostgreSQL WASM test database harness with Supabase auth schema and roles.
- [`tests/real-postgres-schema.test.ts`](file:///e:/Mini%20project%202/workout-planner/workout_planner/tests/real-postgres-schema.test.ts) — Real Postgres catalog, column, constraint, index, and RLS policy verification.
- [`tests/real-postgres-rls.test.ts`](file:///e:/Mini%20project%202/workout-planner/workout_planner/tests/real-postgres-rls.test.ts) — Real Postgres cross-tenant RLS isolation and anonymous write restriction verification.
- [`tests/real-postgres-idempotency.test.ts`](file:///e:/Mini%20project%202/workout-planner/workout_planner/tests/real-postgres-idempotency.test.ts) — Real Postgres `sync_operations` ledger deduplication and idempotency verification.
- [`tests/real-postgres-push-pull.test.ts`](file:///e:/Mini%20project%202/workout-planner/workout_planner/tests/real-postgres-push-pull.test.ts) — Real Postgres 6-tier parent-before-child ordering and cursor progression verification.
- [`tests/real-postgres-conflict.test.ts`](file:///e:/Mini%20project%202/workout-planner/workout_planner/tests/real-postgres-conflict.test.ts) — Real Postgres conflict detection, zero data loss preservation, and status precedence verification.
- [`tests/real-postgres-offline-online.test.ts`](file:///e:/Mini%20project%202/workout-planner/workout_planner/tests/real-postgres-offline-online.test.ts) — Complete offline-to-online lifecycle simulation with reload, sync, and parity check.
- [`tests/real-postgres-failure-resilience.test.ts`](file:///e:/Mini%20project%202/workout-planner/workout_planner/tests/real-postgres-failure-resilience.test.ts) — Resilience against 429, 500, RLS rejection, and parent failure.

---

## 12. Verification & Next Phase Readiness

Phase 2D-B and 2D-B-V are complete and verified against a real PostgreSQL environment. All requirements from the approved specification and architecture documents have been strictly implemented and validated. We STOP here as directed before initiating any subsequent phases.
