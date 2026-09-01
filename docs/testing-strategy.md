# Testing Strategy

Phase: 1 - Architecture and Data Design Review
Date: 2026-08-24

This document defines the target testing architecture before implementation. The current repository has no test runner, no test files, and a production build that ignores TypeScript and ESLint failures. The first implementation step must make quality measurable.

## Testing Goals

- Protect the current visible flow during incremental migration.
- Prove the deterministic workout engine is stable.
- Prove local-first logging never loses set data offline.
- Prove sync queue idempotency, retry, and conflict behavior.
- Prove Supabase RLS isolates user data.
- Prove PWA offline workout execution works.
- Prove the LLM cannot replace deterministic engine decisions.

## Test Layers

| Layer | Tooling Target | Scope |
|---|---|---|
| Type checks | `tsc --noEmit` | compile-time contracts |
| Lint | ESLint | boundaries, accessibility rules, hook rules |
| Unit tests | Vitest or equivalent | pure domain functions |
| Component tests | React Testing Library | feature components and accessibility |
| Repository tests | fake IndexedDB plus Supabase local/stub | local storage and sync repositories |
| Integration tests | Supabase local or test project | RLS, migrations, sync RPCs |
| E2E tests | Playwright | planner, session logging, dashboard, offline PWA |
| Visual/responsive tests | Playwright screenshots | mobile/desktop layout and critical states |
| Contract tests | fixtures and schema validators | AI, sync payload, DB row mapping |

## Required Scripts

Target `package.json` scripts:

```json
{
  "typecheck": "tsc --noEmit",
  "lint": "eslint .",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test",
  "test:a11y": "playwright test tests/e2e/accessibility.spec.ts",
  "build": "next build"
}
```

Build rule:

- Remove `typescript.ignoreBuildErrors`.
- Remove `eslint.ignoreDuringBuilds`.
- `build` must fail on type or lint errors.

## Domain Unit Tests

### Workout Engine

Coverage:

- same input + same seed + same catalog version => identical `GeneratedWorkout`
- target muscle filtering
- equipment filtering
- avoided joint filtering
- duration-to-volume rules
- experience-level progression rules
- no duplicate exercises unless explicitly allowed
- fallback when insufficient exercises exist
- generation trace includes rejected candidates and applied rules
- LLM output is not an engine input

Fixtures:

- minimal exercise catalog
- full catalog snapshot
- beginner home workout request
- advanced gym workout request
- joint-avoidance request
- no-equipment request

### Session Logging

Coverage:

- start session from generated workout
- create session exercises from generated workout exercises
- log set by set
- edit set
- skip set
- complete exercise
- complete session
- calories/volume metrics derived from sets
- completed set cannot be overwritten by planned set

### Exercise/Anatomy Model

Coverage:

- exercise has stable ID and slug
- exercise-muscle role validation
- alternatives never point to self
- joint stress filtering
- media requires alt text for images

### Recommendations

Coverage:

- recommendations from local history
- excludes recently completed workout where needed
- respects equipment and joint constraints
- reason codes are deterministic
- recommendation event logging

### AI Coach

Coverage:

- prompt builder includes deterministic workout facts
- prompt builder excludes sensitive data not required
- response schema validation
- policy rejects exercise invention and workout replacement
- offline unavailable state

## Repository And Sync Tests

### IndexedDB

Use fake IndexedDB for unit/integration tests.

Coverage:

- schema migration from empty DB
- schema migration from v1 to future versions
- localStorage import from each legacy key
- write template/generated workout/session/exercise/set
- indexes support dashboard queries
- dirty record recovery creates missing sync queue entries

### Sync Queue

Coverage:

- enqueue insert/update/delete/upsert
- idempotency key uniqueness
- parent-before-child ordering
- retryable error backoff
- non-retryable error dead-letter
- lock prevents two workers from processing same item
- queue survives page reload
- succeeded item updates local record sync status

### Conflict Resolution

Coverage:

- workout metadata last-writer-wins
- immutable generated workout conflict
- session status precedence
- set field-level merge
- duplicate set detection by `sessionExerciseId + setNumber`
- soft delete vs later update conflict

## Supabase And RLS Tests

Test against Supabase local stack or isolated test project.

Migration tests:

- all tables created
- required indexes exist
- foreign keys enforce relationships
- unique constraints enforce duplicate prevention

RLS tests:

- user A can select/insert/update own workout templates
- user A cannot select/insert/update user B records
- guest/anon cannot write user-owned tables
- public can read active catalog rows
- public cannot write catalog rows
- realtime subscriptions do not expose other user rows
- `sync_operations.idempotency_key` prevents duplicate processing

RPC tests if RPCs are added:

- callable only by authenticated user
- validates ownership
- idempotent when called twice with same key

## E2E Tests

Critical flows:

1. Guest generates deterministic workout.
2. Guest starts workout offline and logs sets.
3. Guest completes session offline and sees dashboard update.
4. Guest signs in and local data queues for sync.
5. Authenticated user logs set offline, reconnects, sync succeeds.
6. Exercise library search/filter works offline.
7. Anatomy map opens exercise lists by muscle/joint.
8. Recommendation accepts/dismisses record events.
9. AI explanation explains generated workout without changing it.
10. PWA install metadata is valid and app loads offline.

Playwright offline requirements:

- emulate offline before session start.
- emulate offline during active session.
- reload page while offline and verify active session state returns.
- reconnect and verify queued count drains.

## Accessibility Tests

Automated:

- axe checks on planner, session, library, dashboard, settings.
- keyboard navigation through planner.
- keyboard set logging.
- dialog focus trap and return focus.
- anatomy map has keyboard-accessible alternatives.
- ratings have accessible names and grouping.

Manual checklist:

- screen reader labels for exercise media and anatomy maps.
- reduced motion respected.
- color contrast on translucent cards.
- mobile touch targets.

## Performance And PWA Tests

Performance:

- workout generation under target threshold with full catalog.
- dashboard aggregation under target threshold for large local history.
- IndexedDB queries remain indexed for large set logs.
- service worker install does not cache unbounded media.

PWA:

- manifest validates.
- service worker activates.
- app shell loads offline.
- exercise catalog available offline.
- no network required to log set.
- background sync or foreground sync drains queue.

## Monitoring Tests

Observability events should be contract-tested:

- `workout_generation_failed`
- `indexeddb_migration_failed`
- `sync_queue_item_failed`
- `sync_conflict_created`
- `sync_queue_drained`
- `ai_coach_request_failed`
- `service_worker_update_found`

Tests should verify events contain required diagnostic fields and omit sensitive profile detail.

## Implementation-Ready Sequence For Antigravity

1. Add test tooling and scripts.
2. Add boundary lint rules where practical.
3. Add workout engine fixture tests before extraction.
4. Add IndexedDB fake repository tests.
5. Add sync queue unit tests.
6. Add Supabase migration/RLS tests after schema files exist.
7. Add Playwright smoke tests for current planner before major component splits.
8. Add offline E2E tests after IndexedDB and service worker land.
9. Add AI policy/contract tests before enabling AI UI.
10. Require typecheck, lint, unit tests, and build before each migration phase closes.
