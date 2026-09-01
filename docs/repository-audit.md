# Repository Audit

Audit date: 2026-08-24

Scope: `app/`, `components/`, `contexts/`, `hooks/`, `lib/`, `public/`, `styles/`, `package.json`, configuration files, Supabase usage, environment variables, localStorage, workout generation, recommendation logic, dashboard, realtime, tests, PWA, responsive behavior, and accessibility.

Note: The original workspace path was not writable and contained only incomplete Git metadata. This audit was produced from a fresh clone of `https://github.com/vikas0223/workout_planner` in the writable audit workspace.

## Executive Summary

The current application is a client-heavy Next.js App Router project generated from a v0/shadcn-style baseline. It has useful pieces: a visible end-to-end workout planning flow, a static exercise dataset, Radix-based UI primitives, basic responsive Tailwind classes, and an early Supabase persistence attempt.

The main architectural issue is not a missing feature; it is misplaced ownership. UI components own business rules, persistence, data modeling, recommendation behavior, realtime subscriptions, dashboard aggregation, and local fallback behavior. The result is entropy (the natural tendency of systems toward decay, disorder, and complexity without value): a 2,934-line planner component, a 958-line completion context, duplicated dashboards, duplicated difficulty modules, duplicate CSS files, multiple favorites contexts, multiple localStorage schemas, and a Supabase access layer that blurs client, server, mock, auth, and service-role concerns.

The desired direction is negentropy (the deliberate reversal of decay: growth, compounding value, increasing order): preserve the working user journey and UI primitives, then extract pure domain services, define typed storage/repository boundaries, consolidate dashboard/recommendation implementations, and re-enable quality gates. Tacit knowledge (the unwritten knowledge of how things actually work) currently lives inside component branches and comments; the migration should externalize it into documented domain contracts and tests.

## Current State

### Application Structure

- `app/page.tsx` is a server component shell that renders `WorkoutPlanner`.
- `app/dashboard/page.tsx` is a client page that reads `userProfile` from localStorage, wraps the page in `WorkoutCompletionProvider` and `FavoritesProvider`, and renders `EnhancedDashboard`.
- Most application components are client components. The app is effectively client-side React inside Next.js.
- `components/ui/` contains a broad shadcn/Radix UI kit, much of which is not used by the current workflow.
- `lib/` contains static data, recommendation helpers, duplicated difficulty helpers, mock users/workouts, and Supabase client setup.
- `public/` contains placeholder assets plus `images/muscle-groups.svg`.
- `styles/globals.css` and `app/globals.css` are exact duplicates, but only `app/globals.css` is imported.

### Monolithic Components

- `components/workout-planner.tsx` is 2,934 lines. It owns form state, step flow, returning-user detection, validation, exercise generation, fallback exercise data, feedback regeneration, localStorage persistence, recommendation selection, modal rendering, and page layout.
- `contexts/workout-completion-context.tsx` is 958 lines. It owns Supabase table probing, localStorage hydration, user identity generation, realtime subscriptions, completed exercise writes, saved workout writes, favorite exercise writes, and derived completion metrics.
- `components/enhanced-dashboard.tsx` is 748 lines and duplicates much of `components/enhanced-dashboard-with-realtime.tsx` at 689 lines.
- `components/workout-plan-with-tracking.tsx` is 707 lines and mixes workout presentation, tracking actions, calories estimation, favorites, persistence, routing, toasts, dialogs, and feedback modal state.

### Duplicated Components And Logic

- `lib/difficulty_adjuster.ts` and `lib/difficulty-adjuster.ts` are identical 219-line files. The planner imports the underscore version.
- `styles/globals.css` and `app/globals.css` are byte-identical.
- `hooks/use-toast.ts` and `components/ui/use-toast.ts` are duplicate toast stores.
- `hooks/use-mobile.tsx` and `components/ui/use-mobile.tsx` are duplicate hooks.
- `components/favorites-context.tsx` and `lib/favorites-context.ts` both define favorites context behavior. `workout-recommendations.tsx` imports from `lib/favorites-context`; other components import from `components/favorites-context`.
- Dashboard logic exists in at least three places: `EnhancedDashboard`, `EnhancedDashboardWithRealtime`, and `ProgressDashboard`.
- Recommendation/display logic exists in `workout-recommendations.tsx`, `similar-workouts.tsx`, `recommendation-engine.ts`, `collaborative-filtering.ts`, and planner handlers.

### State Ownership Problems

- Form data and workout generation state are local to `WorkoutPlanner`.
- User profile state is stored in localStorage under `userProfile`, also copied into React state, also consumed by dashboard.
- Workout completion state is owned by `WorkoutCompletionProvider`, but completion data is also persisted in localStorage keys and Supabase tables.
- Favorites are split between workout-plan favorites and exercise favorites, with separate contexts and storage keys.
- Returning user behavior is driven by a `returningUsers` localStorage list of names, not durable user identity or auth.
- Completion IDs are generated from exercise names and workout IDs are sometimes UUIDs, sometimes `plan_${Date.now()}`, sometimes `workout_${Date.now()}`, and sometimes transformed to `workout_${workoutId}` for database writes.

### Context Overuse

- `WorkoutCompletionContext` is a broad data and service container. Any consumer gets a large mutable API surface.
- Favorites context exists in two locations, creating provider mismatch risk.
- Contexts are being used as persistence services rather than narrow state boundaries.

### Server/Client Boundary Problems

- Nearly all business behavior runs in client components.
- `lib/supabase-client.ts` exports both browser and server clients from one module.
- `getSupabaseServerClient()` can fall back to anon keys and references `SUPABASE_SERVICE_ROLE_KEY`. It is not currently imported, but keeping service-role logic in a shared module is risky because a future client import mistake could expose privileged assumptions.
- `next.config.mjs` disables TypeScript and ESLint failures during builds, so App Router boundary mistakes can ship.

### localStorage Limitations

Current keys observed:

- `savedWorkoutPlans`
- `userProfile`
- `returningUsers`
- `completedExercises`
- `savedWorkouts`
- `favoriteExercises`
- `workoutAppUserId`
- `workoutAppUserName`

Problems:

- No schema versioning or migration path.
- JSON parse failures fall back inconsistently.
- User identity is device/browser scoped.
- Data is not available across browsers or after storage clearing.
- No quota handling, transaction boundary, or conflict resolution.
- localStorage is synchronous and accessed from UI workflows.
- Different features use different schemas for saved workouts.

### Supabase Usage

- `getSupabaseBrowserClient()` uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Missing env vars return a mock client rather than an explicit typed offline repository.
- `WorkoutCompletionProvider` probes tables with `.select().limit(1)` and switches to offline mode based on string matching for missing relation errors.
- Client code writes directly to tables: `users`, `user_stats`, `completed_exercises`, `saved_workouts`, `favorite_exercises`.
- Realtime subscriptions are broad: `postgres_changes` on `event: "*"` for whole public tables, with no user filter in the subscription definitions.
- There is no local schema, migration file, RLS policy documentation, or typed database contract in the repository.
- RPC `increment_user_stats` is assumed to exist but not documented or guarded by a checked migration.

### Data Model Problems

- User model is not authenticated and is generated locally.
- Saved workout `workout_data` is stringified JSON in some flows and parsed back defensively.
- Exercise identity is name-derived, so renames or duplicate names break completion history.
- Workout IDs are inconsistent across app layers.
- Recommendation profile, saved workout data, completion data, and Supabase rows are not represented by one canonical type set.
- Calories estimation is hardcoded in `WorkoutPlanWithTracking`, not a domain function.

### Workout Generation Logic

Current logic lives inside `WorkoutPlanner.generateExercises()` starting near line 567. It:

- Reads `exerciseDatabase` from `lib/exercise-database.ts`.
- Filters by goal, muscle group, and equipment.
- Injects additional hardcoded fallback exercises inside the component.
- Applies gender-specific rep/weight adjustments.
- Randomly shuffles exercises with `Math.random()`.
- Adjusts sets/reps by difficulty.
- Limits exercise count by duration.
- Mutates exercise objects to add generic instructions.

Problems:

- Not testable without rendering the component.
- Non-deterministic output prevents stable tests and reproducible plans.
- Contains domain assumptions that should be explicit and reviewed.
- Hardcoded fallback data duplicates the exercise database responsibility.
- Mutates exercise objects in mapping when adding instructions.

### Recommendation Logic

- `lib/recommendation-engine.ts` wraps mock users and mock workout plans.
- `lib/collaborative-filtering.ts` calculates similarity across demographics, equipment, muscle groups, and ratings.
- Recommendations are based on mock data, local profile history, and in-component handlers.
- `workout-recommendations.tsx` imports `useFavorites` from `lib/favorites-context`, while other workout views use `components/favorites-context`.

Problems:

- Mock data is part of production recommendation path.
- No tests validate similarity scoring or edge cases.
- Recommendation source is not separated from presentation.
- User profile updates are localStorage-based and not canonical with Supabase.

### Dashboard Implementation

- `app/dashboard/page.tsx` reads `userProfile` from localStorage and renders `EnhancedDashboard`.
- `EnhancedDashboard` fetches `user_stats` directly from Supabase, also reads completion context, then computes weekly data, category data, calendars, and recent workouts.
- `EnhancedDashboardWithRealtime` separately sets up realtime subscriptions and fetches similar dashboard data directly.
- `ProgressDashboard` is a separate dashboard component based on `userProfile.completedWorkouts`.

Problems:

- Three dashboard paths with overlapping responsibility.
- Data is sourced from localStorage, context, and Supabase at the same time.
- Aggregation logic is embedded in React render modules.
- Realtime variant appears unused.

### Realtime Implementation

- `WorkoutCompletionProvider` subscribes to all changes for four tables.
- `EnhancedDashboardWithRealtime` subscribes again to completed exercises and stats.
- Subscriptions refresh whole data sets rather than applying scoped deltas.
- No channel filters appear to restrict events to the current user.
- Subscription setup depends on a broad context and mock Supabase fallback shape.

### Existing Tests

- No test framework is configured.
- No test files were found.
- `package.json` has no `test` script.

### PWA/Service Worker

- No manifest file found.
- No service worker found.
- No `next-pwa`, Workbox, cache registration, or install prompt logic found.
- The app has an "offline mode" label, but it is localStorage fallback, not PWA offline capability.

### Responsive Implementation

Current state:

- Many layouts use Tailwind responsive classes such as `sm:`, `md:`, `lg:`, grid breakpoints, and `flex-wrap`.
- `use-mobile` is duplicated.

Risks:

- `app/page.tsx` centers a large card inside `min-h-screen`; the planner itself also uses `min-h-screen`, creating nested viewport layouts that can be awkward on mobile.
- Some controls use fixed widths such as `w-[120px]`, `min-w-[300px]`, and fixed modal heights.
- Large cards, charts, and modals may overflow small screens.
- Responsive behavior is not verified by tests or visual snapshots.

### Accessibility Implementation

Positive:

- Radix primitives provide good base accessibility for dialogs, select, tabs, radio groups, and similar UI.
- Some icon-only buttons include sr-only text or aria labels.
- Form inputs commonly have labels.

Problems:

- Custom clickable SVG muscle regions use `onClick` without keyboard interaction or accessible names.
- Several custom card-like controls are click targets but not always represented as buttons/radios.
- Motion-heavy components have no observed reduced-motion handling.
- Some star/rating and thumb feedback controls lack complete semantic grouping.
- Color palette relies heavily on low-contrast indigo/purple-on-translucent backgrounds.
- Accessibility is not validated by tests.

### Security And RLS Concerns

- No authentication boundary is implemented in the app flow.
- Locally generated `workoutAppUserId` acts like identity.
- Direct client table writes require strong RLS, but no RLS policies or migrations are present.
- Realtime subscriptions are not user-scoped in code.
- Service-role credential logic exists in a shared Supabase module.
- Console logging may expose internal error details in production.
- Missing environment variables silently switch to fallback mode, hiding deployment misconfiguration.

### Performance Bottlenecks

- Large client bundle risk from a 2,934-line planner, a 2,578-line exercise database, animation library usage, charting library usage, and a broad committed UI kit.
- Dashboard aggregation recomputes data in component code.
- Context provider dependencies can trigger repeated fetch/re-render behavior because the Supabase client is acquired inside the provider and included in callbacks/effects.
- localStorage synchronous reads/writes occur in user interactions.
- Realtime refreshes fetch full data instead of applying scoped changes.

### Dead Or Legacy Files

Likely unused or legacy based on static references:

- `components/enhanced-dashboard-with-realtime.tsx`
- `components/progress-dashboard.tsx`
- `components/simplified-workout-flow.tsx`
- `components/goal-selection.tsx`
- `components/interactive-feedback.tsx`
- `components/muscle-group-svg-selector.tsx`
- `components/workout-recommendations.tsx`
- `lib/difficulty-adjuster.ts`
- `styles/globals.css`
- Many `components/ui/*` primitives are unused by the current app routes.

These should not be deleted in Phase 0. They should be confirmed with import graph tooling after dependencies are restorable.

## Desired State

- Keep Next.js App Router, TypeScript, Tailwind, Radix/shadcn primitives, Supabase, and the existing user journey.
- Move workout generation into a pure domain service, for example `lib/domain/workout-generation`.
- Move exercise catalog into typed catalog modules with stable exercise IDs.
- Move recommendation scoring into pure tested services with explicit inputs and outputs.
- Move completion, saved workout, favorites, and user profile persistence behind repositories.
- Split localStorage fallback into a typed adapter with schema versioning.
- Split Supabase browser/server clients into separate modules.
- Add Supabase schema migrations and RLS policy docs/tests.
- Consolidate dashboard into one implementation backed by a dashboard query/service.
- Consolidate favorites into one context or, preferably, one repository plus small hooks.
- Re-enable build-time type and lint enforcement.
- Add unit tests for generation, recommendations, difficulty adjustment, ID mapping, storage migrations, and dashboard aggregations.

## Migration Strategy

Do not rewrite the app in one pass. First stabilize boundaries around existing behavior, then move code behind them.

1. Baseline and safety gates: restore lockfile integrity, install dependencies in a separate approved phase, add `typecheck`, test runner, and CI-quality scripts, and stop ignoring TypeScript/ESLint during build.
2. Domain model pass: define canonical types for user, exercise, workout plan, saved workout, completion, favorite, rating, and dashboard metrics.
3. Extract pure services: move `generateExercises`, feedback regeneration, difficulty adjustment, recommendation scoring, and calories estimation into `lib/domain/*` with tests.
4. Persistence boundary: create repository interfaces and adapters for localStorage and Supabase. Keep existing storage keys during transition.
5. Context slimming: replace broad context methods with small hooks that call repositories/services.
6. Dashboard consolidation: pick one dashboard component, move aggregation to a service, remove duplicate dashboard code after parity tests.
7. Supabase hardening: add migrations, RLS policy documentation, typed DB rows, user-scoped realtime channels, and explicit offline/degraded states.
8. Cleanup: remove confirmed dead files, duplicate contexts, duplicate CSS, duplicate hooks, and unused UI primitives only after import graph and tests agree.

## Critical Findings

| Severity | Finding | Evidence | Impact |
|---|---|---|---|
| Critical | Build can hide type/lint failures | `next.config.mjs` sets `ignoreDuringBuilds` and `ignoreBuildErrors` | Broken code can deploy |
| Critical | Supabase direct client writes without repo schema/RLS evidence | `WorkoutCompletionProvider` writes to five public tables | User data isolation depends on undocumented external state |
| High | Planner is a monolith | `components/workout-planner.tsx`, 2,934 lines | High regression risk, untestable generation |
| High | Completion context is a persistence monolith | `contexts/workout-completion-context.tsx`, 958 lines | Context overuse and inconsistent data ownership |
| High | Realtime subscriptions are broad | `postgres_changes`, `event: "*"`, no user filter in code | Data leakage/performance risk if RLS/realtime policies are wrong |
| High | localStorage is the de facto database | Multiple keys and schemas | No cross-device persistence or migration strategy |
| Medium | Duplicate dashboards | `EnhancedDashboard`, `EnhancedDashboardWithRealtime`, `ProgressDashboard` | Feature divergence |
| Medium | Duplicate favorites contexts | `components/favorites-context.tsx`, `lib/favorites-context.ts` | Provider mismatch risk |
| Medium | Duplicate difficulty modules | hyphen and underscore files identical | Maintenance confusion |
| Medium | No tests | No test files, no `test` script | No regression safety |
| Medium | No PWA implementation | No manifest/service worker | Offline claims are limited to local fallback |

## What Should Remain

- The current user-facing workflow as the behavioral baseline.
- Next.js App Router.
- Tailwind and existing design tokens.
- Radix/shadcn UI primitives that are actually used.
- Supabase as the intended remote persistence layer.
- `lib/exercise-database.ts` data, but behind a typed catalog boundary.
- The collaborative filtering idea, but with real inputs and tests.

## What Should Be Extracted

- Workout generation service.
- Feedback-to-plan-adjustment service.
- Difficulty adjustment service.
- Recommendation scoring service.
- Calories estimation service.
- Dashboard aggregation service.
- localStorage adapter with schema versions.
- Supabase repository adapter.
- Stable ID generation and mapping utilities.
- Shared domain types.

## What Should Be Replaced

- Mock Supabase client fallback with explicit repository mode selection.
- Broad `WorkoutCompletionContext` with narrow hooks/services.
- Multiple favorites contexts with one canonical favorites boundary.
- Duplicate dashboards with one dashboard surface.
- Stringified `workout_data` handling with typed JSON/data model.
- Name-derived exercise IDs with stable catalog IDs.
- `latest` dependency pins with pinned, reviewed versions.
- Build config that ignores TypeScript and ESLint errors.

## Recommended Migration Order

1. Quality baseline restoration.
2. Type/domain model extraction.
3. Workout generation extraction and tests.
4. Storage/repository boundary.
5. Supabase schema/RLS/realtime hardening.
6. Dashboard consolidation.
7. Recommendation consolidation.
8. Dead-code and dependency cleanup.
9. Responsive and accessibility verification pass.

## Risks

- Without tests, even extraction-only refactors can change generated workout behavior.
- Supabase behavior may depend on external tables/RPC/policies not present in the repo.
- localStorage data already in user browsers may break without versioned migration.
- Removing seemingly unused shadcn components can break future generated imports if not checked.
- Re-enabling TypeScript and lint may reveal substantial existing errors because builds currently ignore them.

## Exact Recommended Next Phase

Phase 1 should be "Quality Baseline And Domain Boundary Setup". It should not redesign the UI. It should restore installable dependency state, add explicit `typecheck` and test scripts, remove build-error suppression only after current failures are documented, define canonical domain types, and extract/test the pure workout-generation logic without changing visible behavior.
