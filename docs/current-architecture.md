# Current Architecture

Audit date: 2026-08-24

## System Boundary

Workout Planner is currently a Next.js App Router application that behaves mostly as a client-side React app. The production route surface is small:

- `/` renders the planner flow.
- `/dashboard` renders a dashboard from localStorage, context, and Supabase data.

There are no API routes, server actions, database migrations, schema files, or test suites in the repository.

## Component Map

### app/

- `app/layout.tsx`: root HTML shell, imports `app/globals.css`, metadata still says `v0 App`.
- `app/page.tsx`: server component wrapper with page styling and `WorkoutPlanner`.
- `app/dashboard/page.tsx`: client page. Reads `userProfile` from localStorage and wraps content in `WorkoutCompletionProvider` and `FavoritesProvider`.
- `app/globals.css`: active global Tailwind and CSS variable file.

### components/

Primary flow:

- `workout-planner.tsx`: owns onboarding, form steps, validation, generation, saved plans, local profile, returning user mode, feedback, and major render branches.
- `workout-plan-with-tracking.tsx`: renders generated plan and owns completion/favorites/save/feedback interactions.
- `favorites-view.tsx`: saved/favorite workout dialog UI.
- `similar-workouts.tsx`: recommendation surface for similar workouts.
- `enhanced-muscle-group-dropdown.tsx`: muscle group selection used by planner.
- `loading-animation.tsx`, `success-toast.tsx`, `workout-feedback-form.tsx`, `star-rating.tsx`: support UI.

Dashboard:

- `enhanced-dashboard.tsx`: active dashboard imported by `/dashboard`.
- `enhanced-dashboard-with-realtime.tsx`: unused alternate dashboard with direct realtime subscriptions.
- `progress-dashboard.tsx`: unused alternate dashboard based on profile completed workouts.

Legacy or alternate flow:

- `simplified-workout-flow.tsx`
- `goal-selection.tsx`
- `equipment-selection-grid.tsx`
- `muscle-group-dropdown.tsx`
- `muscle-group-svg-selector.tsx`
- `interactive-feedback.tsx`
- `workout-recommendations.tsx`
- `workout-plan.tsx`

UI kit:

- `components/ui/*`: shadcn/Radix component set. Some primitives are used; many are committed but not currently referenced by routes.

### contexts/

- `workout-completion-context.tsx`: broad state/persistence context for completed exercises, saved workouts, exercise favorites, local user ID, offline mode, Supabase reads/writes, and realtime subscriptions.

### hooks/

- `use-toast.ts`: duplicate of `components/ui/use-toast.ts`.
- `use-mobile.tsx`: duplicate of `components/ui/use-mobile.tsx`.

### lib/

- `exercise-database.ts`: large static exercise catalog.
- `recommendation-engine.ts`: types, mock data access, recommendation wrapper helpers, profile mutation helpers.
- `collaborative-filtering.ts`: similarity and recommendation scoring.
- `difficulty_adjuster.ts`: imported difficulty service.
- `difficulty-adjuster.ts`: duplicate unused difficulty service.
- `mock-user-data.ts`: mock users and workout plans used by recommendations.
- `supabase-client.ts`: browser client, server client, and fallback mock client.
- `favorites-context.ts`: duplicate favorites context used by `workout-recommendations.tsx`.
- `utils.ts`: shadcn `cn` helper.

### public/

- Placeholder assets and `images/muscle-groups.svg`.
- No manifest or service worker.

### styles/

- `styles/globals.css`: duplicate of `app/globals.css`, apparently unused.

## Runtime Data Flow

### Workout Generation

1. User enters data in `WorkoutPlanner`.
2. `generateWorkoutPlan()` calls local `generateExercises(formData)`.
3. `generateExercises()` reads `exerciseDatabase`, filters by goal, equipment, and muscle groups, applies fallback exercise injection, difficulty/gender adjustments, randomization, and duration limiting.
4. Result is stored in component state and rendered by `WorkoutPlanWithTracking`.

### Save And Completion

1. `WorkoutPlanWithTracking` calls methods from `useWorkoutCompletion()`.
2. Context updates React state first.
3. Context writes backup data to localStorage.
4. If not offline, context writes directly to Supabase tables.
5. On Supabase failure, context keeps localStorage state and may switch offline mode.

### Dashboard

1. `/dashboard` reads `userProfile` from localStorage.
2. `EnhancedDashboard` reads completion data from context.
3. `EnhancedDashboard` also fetches `user_stats` from Supabase by `workoutAppUserId`.
4. Dashboard computes chart/calendar/recent-workout data in component code.

### Realtime

1. `WorkoutCompletionProvider` subscribes to `completed_exercises`, `user_stats`, `saved_workouts`, and `favorite_exercises`.
2. Subscription events trigger refresh functions.
3. `EnhancedDashboardWithRealtime` has additional subscriptions, but the active dashboard route does not import it.

## Persistence Model

### localStorage

localStorage acts as the primary stable store in the current UX:

- `userProfile`: profile, completed workouts, and ratings used by recommendations/dashboard.
- `savedWorkoutPlans`: planner-saved plans.
- `returningUsers`: name list used to detect returning users.
- `workoutAppUserId`: generated pseudo-user ID for Supabase rows.
- `completedExercises`: completion state backup.
- `savedWorkouts`: Supabase-context saved workouts backup.
- `favoriteExercises`: exercise favorites backup.

### Supabase

Expected tables/RPC inferred from code:

- `users`
- `user_stats`
- `completed_exercises`
- `saved_workouts`
- `favorite_exercises`
- RPC: `increment_user_stats`

No schema, migrations, or RLS policies are present in the repository.

## Environment Variables

Browser:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Server helper:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- public fallbacks

Current behavior:

- Missing browser env vars return a mock fallback client.
- Missing server env vars throw an error.

## Configuration

- `package.json`: private Next app, `dev`, `build`, `start`, `lint` scripts only.
- `pnpm-lock.yaml`: present but contains no package snapshots.
- `next.config.mjs`: ignores TypeScript and ESLint errors during build and sets images unoptimized.
- `tsconfig.json`: strict mode enabled, `allowJs: true`, path alias `@/*`.
- `tailwind.config.ts`: broad content glob and shadcn CSS variables.
- `components.json`: shadcn config with `rsc: true`.

## Desired State

The architecture should become a small Next shell over explicit domains:

- `app/`: route composition only.
- `components/`: presentational and workflow components only.
- `lib/domain/`: pure workout, recommendation, difficulty, calories, dashboard services.
- `lib/data/`: exercise catalog and typed catalog queries.
- `lib/storage/`: localStorage adapter with versioned schemas.
- `lib/supabase/`: separate browser/server clients and typed repositories.
- `contexts/`: narrow UI state providers only.
- `docs/`: architecture, data model, RLS, and migration notes.
- `tests/`: domain service tests and integration tests for storage/repository behavior.

## Migration Strategy

1. Add domain types without changing runtime.
2. Copy workout-generation logic into a pure service and test it against captured current outputs where deterministic behavior can be controlled.
3. Replace component-local generation calls with service calls.
4. Introduce repository interfaces and keep old localStorage keys behind adapters.
5. Split Supabase browser/server modules.
6. Consolidate dashboards after dashboard aggregation is tested.
7. Remove duplicate files only after import graph and tests confirm they are unused.
