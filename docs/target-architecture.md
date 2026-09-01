# Target Architecture

Phase: 1 - Architecture and Data Design Review
Date: 2026-08-24

This document defines the target technical architecture before implementation. It uses the Phase 0 audit documents and the approved product constraints supplied for Phase 1. It does not prescribe a UI redesign and does not implement application code.

## Architectural Gate

Major decision resolved: guest mode is local-first only. Supabase cloud sync begins only after optional authentication because Row Level Security cannot safely distinguish durable guests using only browser-generated IDs. A guest may generate workouts, log sessions offline, use the exercise library, view local progress, and receive deterministic recommendations. When the guest signs in, local IndexedDB records are linked to the authenticated account and then synchronized.

Second decision resolved: the V1 LLM is advisory only. It explains, coaches, summarizes, and answers questions about a deterministic workout. It must not choose exercises, sets, progression, contraindication substitutions, or logging outcomes without passing through deterministic domain services.

The design aims for negentropy: small explicit boundaries that reduce future ambiguity. Avoid vanity engineering: no plugin system, no complex event bus, no custom auth, no premature multi-service backend. Use a local-first monolith with clean modules.

## Product Capabilities

Required V1 capabilities:

- Guest mode
- Optional authentication
- IndexedDB local-first storage
- Supabase cloud synchronization
- Deterministic V1 workout engine
- Set-by-set workout logging
- Exercise library
- Muscle and joint maps
- Progress dashboard
- Recommendations
- LLM coaching and explanation
- PWA installation
- Offline workout execution

## Application Route Architecture

Target routes:

```text
app/
  layout.tsx
  page.tsx
  planner/page.tsx
  workout/[generatedWorkoutId]/page.tsx
  session/[sessionId]/page.tsx
  library/page.tsx
  library/exercises/[exerciseId]/page.tsx
  anatomy/page.tsx
  dashboard/page.tsx
  recommendations/page.tsx
  settings/page.tsx
  auth/callback/route.ts
  api/ai/coach/route.ts
  api/health/route.ts
```

Route responsibilities:

| Route | Responsibility | Offline | Auth |
|---|---|---:|---|
| `/` | Redirect or lightweight app entry | yes | optional |
| `/planner` | Collect goal, availability, constraints, equipment, target muscles | yes | optional |
| `/workout/[generatedWorkoutId]` | Review generated deterministic workout before starting | yes | optional |
| `/session/[sessionId]` | Execute and log workout set by set | yes | optional |
| `/library` | Browse/filter exercise library | yes | optional |
| `/library/exercises/[exerciseId]` | Exercise details, media, muscles, joints, alternatives | yes | optional |
| `/anatomy` | Muscle and joint maps | yes | optional |
| `/dashboard` | Progress metrics from local cache and synced data | yes | optional |
| `/recommendations` | Deterministic recommendations from local data | yes | optional |
| `/settings` | Account, sync status, install, data export/import | partial | optional |
| `/auth/callback` | Supabase auth exchange | no | required |
| `/api/ai/coach` | Server-side LLM coaching endpoint | no | optional auth, guest rate-limited |
| `/api/health` | Observability and deployment smoke check | no | none |

Route rules:

- App routes compose features; they do not contain domain logic.
- Offline-capable pages read from IndexedDB through feature hooks.
- Auth callback and AI routes are the only required server endpoints in V1.
- Supabase service-role keys never appear in client-importable modules.

## Feature And Module Architecture

Target source layout:

```text
app/
components/
  ui/
  layout/
  planner/
  workout/
  session/
  exercise-library/
  anatomy/
  dashboard/
  recommendations/
  sync/
features/
  planner/
  workout-engine/
  workout-session/
  exercise-library/
  anatomy/
  dashboard/
  recommendations/
  ai-coach/
  auth/
  sync/
lib/
  domain/
  indexeddb/
  supabase/
  pwa/
  observability/
  validation/
```

Feature boundaries:

| Feature | Owns | Must Not Own |
|---|---|---|
| `workout-engine` | Deterministic generation, progression rules, plan validation | UI, Supabase, IndexedDB |
| `workout-session` | Session lifecycle and set logging commands | Exercise catalog definitions |
| `exercise-library` | Exercise catalog queries and detail view models | Workout generation rules |
| `anatomy` | Muscle/joint maps and exercise anatomy lookups | Session logging |
| `recommendations` | Deterministic next-action suggestions | LLM calls, raw component state |
| `ai-coach` | Prompt contracts and explanation APIs | Workout selection authority |
| `sync` | Queue, conflict resolution, Supabase repositories | Workout domain decisions |
| `dashboard` | Metrics, charts, streaks, aggregations | Data writes |
| `auth` | Optional sign-in and account linking | Guest identity persistence rules beyond sync handoff |

## Component Architecture

Component layers:

1. Route components: fetch initial route params and compose feature shells.
2. Feature containers: call hooks, load view models, dispatch commands.
3. Presentational components: render inputs, cards, tables, charts, maps.
4. UI primitives: shadcn/Radix base controls only.

Planner components:

```text
components/planner/
  PlannerShell.tsx
  PlannerStepper.tsx
  GoalStep.tsx
  AvailabilityStep.tsx
  EquipmentStep.tsx
  MuscleFocusStep.tsx
  ConstraintsStep.tsx
  GeneratedWorkoutPreview.tsx
```

Workout/session components:

```text
components/workout/
  WorkoutTemplateCard.tsx
  GeneratedWorkoutCard.tsx
  WorkoutExerciseList.tsx
  WorkoutExerciseDetail.tsx
components/session/
  SessionShell.tsx
  SessionExerciseCard.tsx
  SetLogger.tsx
  RestTimer.tsx
  SessionSummary.tsx
```

Component rules:

- Components do not call Supabase directly.
- Components do not call IndexedDB directly.
- Components do not create workout IDs except through command services.
- Component props use domain/view-model types, not database row types.
- Long-lived forms use local component state or feature reducer state; committed data goes through commands.

## State-Management Boundaries

Use the browser as an offline app runtime.

State categories:

| State | Owner | Storage | Notes |
|---|---|---|---|
| Route params | Next router | URL | Shareable where useful |
| Short-lived UI state | Component state | memory | open dialogs, hover, form field drafts |
| Planner draft | Planner feature hook | IndexedDB draft table plus memory | survives refresh/offline |
| Domain records | Repositories | IndexedDB primary, Supabase mirror after auth | all mutable user data |
| Sync status | Sync feature | IndexedDB `sync_queue`, memory subscription | visible in settings/header |
| Auth session | Supabase auth client | Supabase session storage | optional |
| Server AI result cache | AI feature | IndexedDB optional cache | never canonical workout state |

Recommended client state tools:

- React state and reducers for UI flows.
- `useSyncExternalStore` or small repository subscriptions for IndexedDB-backed state.
- Avoid global state libraries until concrete state pressure appears.

## Data Ownership

IndexedDB is the source of truth for the active device. Supabase is the authenticated cloud replica and cross-device source after sync completes.

Rules:

- Guest records have `owner_kind = 'guest'`, `owner_id = local_profile_id`, and are local only.
- Authenticated records have `owner_kind = 'user'`, `owner_id = auth.users.id`.
- On sign-in, a link operation rewrites local ownership from guest to user and enqueues upserts.
- Catalog records can be bundled statically and optionally refreshed from Supabase public tables later.

## Workout Engine Boundaries

The deterministic V1 workout engine is pure TypeScript:

```text
features/workout-engine/
  engine.types.ts
  generate-workout.ts
  select-exercises.ts
  progression.ts
  volume-rules.ts
  substitution-rules.ts
  validation.ts
  seeded-random.ts
```

Engine input:

- goal
- target muscles
- avoided muscles/joints
- equipment availability
- session duration
- experience level
- recent history summary
- exercise catalog snapshot
- deterministic seed
- version string

Engine output:

- `GeneratedWorkout`
- generation trace: rules applied, candidate exclusions, seed, engine version

Engine constraints:

- No React imports.
- No Supabase imports.
- No IndexedDB imports.
- No LLM calls.
- No `Math.random()` directly; use seeded random.
- Same input plus same catalog version plus same engine version must produce same output.

## AI Provider Abstraction

LLM V1 role:

- Explain why the deterministic engine selected exercises.
- Coach form cues based on selected exercise metadata.
- Summarize a completed session.
- Answer general app-specific questions using approved exercise/anatomy data.

LLM V1 must not:

- Replace generated workouts.
- Mutate session logs.
- Invent exercises outside the catalog.
- Override safety/constraint rules.
- Store provider API keys client-side.

Target modules:

```text
features/ai-coach/
  ai.types.ts
  coach-service.ts
  prompt-builders.ts
  policy.ts
app/api/ai/coach/route.ts
```

Abstraction:

```ts
interface AiCoachProvider {
  explainWorkout(input: ExplainWorkoutInput): Promise<CoachResponse>
  explainExercise(input: ExplainExerciseInput): Promise<CoachResponse>
  summarizeSession(input: SummarizeSessionInput): Promise<CoachResponse>
}
```

Provider rule: keep one implementation in V1. The interface exists because provider keys and server transport need a boundary, not because multiple providers are required immediately.

## PWA Architecture

PWA assets:

- `public/manifest.webmanifest`
- service worker generated by the chosen PWA integration
- app icons
- offline fallback shell

Caching strategy:

| Asset/Data | Strategy |
|---|---|
| App shell | precache on install |
| Static exercise catalog bundle | precache or cache-first by version |
| Media thumbnails | stale-while-revalidate |
| User records | IndexedDB only |
| Sync API/Supabase writes | queue when offline |
| AI calls | network-only with offline explanation unavailable state |

Offline requirements:

- Start and complete a workout session offline.
- Log sets offline.
- Browse cached exercise library.
- View local dashboard metrics.
- Queue sync operations.
- Show explicit sync state and last synced time.

## Monitoring And Observability

Client observability:

- sync queue length
- sync failures by entity type and operation
- IndexedDB migration failures
- workout generation failures
- PWA install status and service worker update failures
- client error boundary reports

Server observability:

- AI endpoint latency, error rate, token/cost counters if available
- Supabase RPC/API failures
- auth callback failures

Logging rules:

- No sensitive health/profile data in logs.
- Use structured event names.
- Include `local_profile_id`, `user_id`, and entity IDs only where safe and necessary.
- Include `engine_version`, `catalog_version`, and `sync_schema_version` in diagnostic events.

## Incremental Migration Review

The existing code can be migrated incrementally, but only if behavior is protected first.

Viable migration path:

1. Add target docs and type-only domain definitions.
2. Restore quality gates and test tooling.
3. Extract deterministic workout engine from `WorkoutPlanner.generateExercises()`.
4. Introduce IndexedDB alongside existing localStorage.
5. Add migration from localStorage keys to IndexedDB.
6. Move completion logging into session commands.
7. Add sync queue and Supabase repositories.
8. Consolidate dashboard from IndexedDB-derived view models.
9. Add PWA service worker and offline indicators.
10. Add AI coaching server route.

Do not attempt a rewrite. The current app has a working visible flow; use it as a parity target while replacing internals behind feature boundaries.

## Implementation-Ready Sequence For Antigravity

1. Create target type files only: domain entity types, ID aliases, command input/output types.
2. Add test runner and baseline scripts; do not change app behavior.
3. Extract deterministic engine into pure functions with seeded randomness and fixture tests.
4. Add IndexedDB adapter and schema migrations behind feature flags.
5. Migrate localStorage records into IndexedDB on app startup.
6. Build session logging command layer: start session, log set, complete exercise, complete session.
7. Add dashboard metrics service reading from IndexedDB repositories.
8. Add Supabase schema migrations and RLS policies.
9. Add sync queue and authenticated sync worker.
10. Add PWA manifest/service worker and offline shell.
11. Add AI coach endpoint and client explanation panels.
12. Remove duplicate legacy modules after parity tests pass.
