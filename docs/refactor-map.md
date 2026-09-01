# Refactor Map

Audit date: 2026-08-24

This map is a migration plan only. It intentionally does not implement the migration.

## Current State

| Area | Current Owner | Problem |
|---|---|---|
| Planner flow | `components/workout-planner.tsx` | 2,934-line component owns UI, generation, persistence, feedback, recommendations |
| Workout generation | `WorkoutPlanner.generateExercises()` | Untested, non-deterministic, hardcoded fallback data, component-bound |
| Exercise catalog | `lib/exercise-database.ts` plus planner fallback objects | No stable typed catalog boundary |
| Difficulty adjustment | `lib/difficulty_adjuster.ts` and duplicate `lib/difficulty-adjuster.ts` | Duplicate modules, partially typed internals |
| Recommendations | `recommendation-engine.ts`, `collaborative-filtering.ts`, UI components, planner handlers | Mock data in production path, split ownership |
| Completion tracking | `WorkoutCompletionProvider` | Broad context owns data fetching, writes, realtime, local fallback |
| Favorites | `components/favorites-context.tsx` and `lib/favorites-context.ts` | Duplicate contexts and provider mismatch risk |
| Dashboard | `EnhancedDashboard`, `EnhancedDashboardWithRealtime`, `ProgressDashboard` | Three implementations and mixed data sources |
| Supabase | `lib/supabase-client.ts` and direct component/context calls | No repository boundary, schema, migrations, or RLS evidence |
| Offline/local data | Ad hoc localStorage calls | No versioning, validation, migration, quota/conflict handling |
| UI kit | Full `components/ui/*` set | Many primitives unused, dependencies retained for unused primitives |
| Quality gates | `next.config.mjs` suppresses build errors | CI/build cannot be trusted |

## Desired State

### Proposed Target Modules

```text
lib/
  domain/
    types.ts
    workout-generation.ts
    workout-feedback.ts
    difficulty-adjustment.ts
    calories.ts
    recommendations.ts
    dashboard-metrics.ts
  data/
    exercise-catalog.ts
    exercise-catalog.types.ts
  storage/
    local-storage-adapter.ts
    storage-schema.ts
  supabase/
    browser-client.ts
    server-client.ts
    workout-repository.ts
    completion-repository.ts
    favorites-repository.ts
    user-repository.ts
contexts/
  workout-session-context.tsx
  user-profile-context.tsx
hooks/
  use-workout-plan.ts
  use-dashboard-metrics.ts
  use-favorites.ts
components/
  planner/
  workout-plan/
  dashboard/
```

### Domain Services To Extract

| Service | Extract From | Inputs | Outputs | Initial Tests |
|---|---|---|---|---|
| `generateWorkoutPlan` | `WorkoutPlanner.generateExercises()` | form data, catalog, random source | workout plan | filters by goal/equipment/muscle, duration limits, stable IDs |
| `adjustPlanFromFeedback` | `regenerateBasedOnFeedback()` | current request, feedback text | adjusted request | too hard/easy/long/short, muscle keywords |
| `analyzeDifficultyAdjustment` | `difficulty_adjuster.ts` | user profile | difficulty result | empty profile, progression, feedback overrides |
| `estimateExerciseCalories` | `WorkoutPlanWithTracking.calculateExerciseCalories()` | exercise | calories number | major muscle groups, reps parsing |
| `getRecommendations` | `recommendation-engine.ts`, `collaborative-filtering.ts` | user profile, candidate workouts | recommendations | similarity scoring, empty inputs, exclusion of rated workouts |
| `buildDashboardMetrics` | dashboards | completions, workouts, stats | dashboard view model | weekly data, category data, streaks |

### Reusable Components To Extract

| Component | Extract From | Purpose |
|---|---|---|
| `PlannerStepper` | `WorkoutPlanner` | Step navigation and validation display |
| `UserProfileStep` | `WorkoutPlanner` | Name/gender/age/weight inputs |
| `EquipmentStep` | `WorkoutPlanner` | Equipment selection |
| `MuscleGroupStep` | `WorkoutPlanner` | Muscle selection and confirmation |
| `SavedWorkoutDialog` | `WorkoutPlanner` | Saved/favorite plan list |
| `WorkoutPlanActions` | `WorkoutPlanWithTracking` | Save, favorite, dashboard, feedback actions |
| `DashboardMetricCards` | dashboards | Metric cards |
| `DashboardCharts` | dashboards | Recharts rendering |

## Migration Strategy

### Phase 1: Quality Baseline And Domain Types

Goal: make future changes measurable.

Tasks:

- Add `typecheck` script.
- Add a test runner in an approved dependency phase.
- Remove `ignoreBuildErrors` and `ignoreDuringBuilds` only after current failures are documented and fixed.
- Define canonical domain types.
- Create fixtures from current localStorage/Supabase-shaped objects.

Exit criteria:

- Dependency installation is reproducible.
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` have known results.
- Domain types compile without changing UI behavior.

### Phase 2: Extract Workout Generation

Goal: remove highest-risk domain logic from the planner.

Tasks:

- Move generation logic into a pure service.
- Inject random source for deterministic testing.
- Move fallback exercises into the catalog layer.
- Add stable exercise IDs.
- Keep the existing planner UI and visible behavior.

Exit criteria:

- Planner calls `generateWorkoutPlan()` service.
- Unit tests cover filters, duration, difficulty, feedback adjustment, and empty-result behavior.

### Phase 3: Persistence Boundary

Goal: stop UI/context code from knowing storage mechanics.

Tasks:

- Add localStorage schema versioning.
- Create repository interfaces.
- Add Supabase adapters.
- Keep old localStorage keys readable.
- Introduce explicit offline/degraded modes.

Exit criteria:

- Components call hooks/services, not localStorage or Supabase directly.
- Storage migration tests pass.

### Phase 4: Context Slimming

Goal: shrink `WorkoutCompletionContext` into narrow state boundaries.

Tasks:

- Move fetch/write logic into repositories.
- Move derived metrics into domain services.
- Split completion, saved workouts, favorites, and profile concerns.
- Remove duplicate favorites context after compatibility shim.

Exit criteria:

- Context providers expose minimal state and commands.
- No direct table probing in context.

### Phase 5: Supabase Hardening

Goal: make remote persistence safe and reproducible.

Tasks:

- Add migrations for expected tables and RPC.
- Document RLS policies.
- Scope realtime subscriptions by user.
- Separate browser and server clients.
- Remove service-role fallback from shared module.

Exit criteria:

- RLS policy review exists.
- Client writes are permitted only for current user rows.
- Realtime cannot receive unrelated user events.

### Phase 6: Dashboard And Recommendation Consolidation

Goal: eliminate duplicated implementations.

Tasks:

- Choose one dashboard UI.
- Move all dashboard aggregation into `buildDashboardMetrics`.
- Replace mock recommendation source with a candidate repository boundary.
- Keep mock data as test fixtures or demo adapter only.

Exit criteria:

- One dashboard component remains active.
- Recommendation logic has tests and one public API.

### Phase 7: Dead Code And Dependency Cleanup

Goal: reduce maintenance surface after behavior is protected.

Tasks:

- Remove duplicate difficulty file.
- Remove duplicate global CSS.
- Remove duplicate hooks.
- Remove duplicate favorites context.
- Remove unused alternate components.
- Remove unused UI primitives and dependencies only when import graph confirms.
- Pin `latest` dependencies to reviewed versions.

Exit criteria:

- Import graph is clean.
- Bundle/dependency list matches actual feature usage.

## File-Level Refactor Targets

### `components/workout-planner.tsx`

Keep initially:

- Existing render behavior.
- Existing step order.
- Existing copy unless a later UI phase changes it.

Extract:

- Form schema and validation.
- Generation request builder.
- Generation service call.
- Saved plan persistence.
- Returning-user detection.
- Feedback adjustment.
- Saved plans dialog.

Do not do first:

- Visual redesign.
- New recommendation algorithm.
- New authentication flow.

### `contexts/workout-completion-context.tsx`

Keep initially:

- Public hook behavior for consumers.
- Offline fallback behavior as a compatibility path.

Extract:

- Supabase table access.
- localStorage access.
- user ID management.
- realtime subscription setup.
- derived completion metrics.

Replace later:

- Table-existence probing by migrations and explicit health checks.
- Broad context with narrow feature hooks.

### `lib/supabase-client.ts`

Split into:

- `lib/supabase/browser-client.ts`
- `lib/supabase/server-client.ts`
- repository adapters

Remove:

- Mock Supabase client as a fake client.
- Service role fallback from shared imports.

### Dashboards

Keep:

- Current active dashboard UI until metrics service exists.

Extract:

- metric card model
- weekly aggregation
- category aggregation
- streak calculation
- recent workouts model

Remove after parity:

- unused realtime dashboard or merge realtime capability into active dashboard.
- unused `ProgressDashboard`.

## Risk Controls

- Capture current generated plan examples before extraction.
- Use seeded randomness in tests.
- Keep old localStorage keys readable through migration adapters.
- Do not delete unused-looking UI primitives until dependency usage is verified after installation.
- Treat Supabase schema/RLS as a blocking design artifact before enabling real multi-user remote persistence.

## Anti-Vanity Guardrails

- No abstraction without at least two consumers or a documented migration need.
- No new dependency until it replaces enough custom code or unlocks a PRD requirement.
- Do not introduce a global state library unless context slimming still leaves proven cross-tree state pressure.
- Do not redesign the UI during architecture cleanup.
- Kill or merge alternate dashboards once one canonical dashboard is verified.
