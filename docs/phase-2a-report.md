# Phase 2A — Architecture Foundation Report

**Phase:** Phase 2A — Implement the Architecture Foundation  
**Status:** COMPLETE  

---

## 1. Quality & Verification Gates

- **DEPENDENCY STATUS:** Clean & Reproducible (`package.json` with Vitest, TypeScript, Next.js, and Radix UI).
- **TYPECHECK:** PASS (Strict TypeScript enabled, branded & canonical domain types mapped).
- **LINT:** PASS (ESLint configuration enabled, Next.js linting verified).
- **TEST:** PASS (Vitest unit & deterministic engine test suite passing).
- **BUILD:** PASS (Next.js build suppression flags disabled: `ignoreBuildErrors: false`, `ignoreDuringBuilds: false`).

---

## 2. New Domain Types (`types/domain.ts`)

- **Semantic / Branded IDs:** `UserId`, `ExerciseId`, `MuscleId`, `EquipmentId`, `JointId`, `TemplateId`, `GeneratedWorkoutId`, `SessionId`, `SessionExerciseId`, `SetId`, `RecommendationId`.
- **Core Entities:**
  - `UserProfile` & `WorkoutRating`
  - `Muscle`, `Equipment`, `Joint`, `Exercise`
  - `WorkoutTemplate`
  - `GeneratedWorkout`, `GeneratedWorkoutExercise`, `GenerationTrace`
  - `WorkoutSession`, `SessionExercise`, `WorkoutSet`, `WorkoutFeedback`
  - `Recommendation`, `RecommendationEvent`
  - `DashboardMetrics`

---

## 3. New Domain Services

1. **Deterministic Workout Engine** (`features/workout-engine/generate-workout.ts` & `features/workout-engine/seeded-random.ts`):
   - Pure domain service free from React, UI, or storage dependencies.
   - Injectable PRNG (`SeededRandom`) guaranteeing: `input + seed + catalogVersion = identical GeneratedWorkout`.
   - Filters by goal, equipment, target muscles, and enforces duration-to-volume rules.
   - Assigns standard UUID v4 / deterministic UUIDs.
   - Rule-based feedback parameter adjustment service.

2. **Exercise Catalog Boundary** (`lib/data/exercise-catalog.ts`):
   - Typed wrapper over `lib/exercise-database.ts`.
   - Supports `getExerciseById()`, `listExercises()`, `findExercisesByMuscle()`, `findExercisesByEquipment()`, and keyword search.

3. **Difficulty Adjustment Service** (`lib/domain/difficulty-adjustment.ts`):
   - Unified boundary consolidating logic from duplicate legacy modules (`lib/difficulty_adjuster.ts`).
   - Analyzes recent volume, frequency, and feedback ratings to recommend progression.

4. **Calorie Estimation Service** (`lib/domain/calories.ts`):
   - Extracted pure formula taking exercise type, rep counts, and recruited muscle groups.

5. **Dashboard Metrics Service** (`lib/domain/dashboard-metrics.ts`):
   - Aggregates workout completion counts, duration, streaks, weekly targets, and distribution without UI couplings.

6. **Recommendation Boundary** (`lib/domain/recommendations.ts`):
   - Decoupled recommendation service isolating presentation components from recommendation algorithms.

7. **Stable ID Strategy** (`lib/utils/id.ts`):
   - Provides native `crypto.randomUUID()` generation with deterministic fallback mapping (`toStableId`).

---

## 4. New Repository Interfaces (`lib/repositories/interfaces.ts`)

- `UserRepository`: Profile retrieval, saving, returning users listing.
- `WorkoutRepository`: Template CRUD, generated workout persistence.
- `CompletionRepository`: Session tracking, exercise completion, feedback storage.
- `FavoritesRepository`: Favorite workouts and exercises management.

---

## 5. Security & Storage Boundaries

- **Supabase Client Split** (`lib/supabase/browser-client.ts` & `lib/supabase/server-client.ts`):
  - Browser client uses only public anon keys.
  - Server client securely guards service-role credentials and prevents leaking to client bundles.
- **LocalStorage Compatibility Layer** (`lib/storage/local-storage-compat.ts`):
  - Safely interfaces with all 8 legacy localStorage keys (`userProfile`, `savedWorkoutPlans`, `returningUsers`, `completedExercises`, `savedWorkouts`, `favoriteExercises`, `workoutAppUserId`, `workoutAppUserName`).
  - Prepares structured data for Phase 2B migration into IndexedDB without deleting existing user data.

---

## 6. Tests Added (`tests/`)

1. `tests/smoke.test.ts`: Vitest test runner validation.
2. `tests/seeded-random.test.ts`: Pseudo-random number generator determinism and range verification.
3. `tests/exercise-catalog.test.ts`: Catalog querying, filtering by muscles/equipment, and stable ID verification.
4. `tests/workout-engine.test.ts`:
   - Seeded deterministic generation reproducibility.
   - Valid UUID assignment for workouts and exercises.
   - Routine duplicate exercise prevention.
   - Duration scaling and goal-specific rep/set prescription.
   - Feedback adjustment parsing.
5. `tests/difficulty-adjustment.test.ts`: History analysis, feedback overrides, and consistency scoring.
6. `tests/calories.test.ts`: Reps parsing, large muscle group multipliers, and total workout calculation.
7. `tests/dashboard-metrics.test.ts`: Streak calculation, category distribution, and weekly workout metrics.

---

## 7. Files Changed / Created

- `types/domain.ts` (NEW)
- `features/workout-engine/generate-workout.ts` (NEW)
- `features/workout-engine/seeded-random.ts` (NEW)
- `features/workout-engine/index.ts` (NEW)
- `lib/data/exercise-catalog.ts` (NEW)
- `lib/domain/workout-generation.ts` (NEW)
- `lib/domain/difficulty-adjustment.ts` (NEW)
- `lib/domain/calories.ts` (NEW)
- `lib/domain/dashboard-metrics.ts` (NEW)
- `lib/domain/recommendations.ts` (NEW)
- `lib/repositories/interfaces.ts` (NEW)
- `lib/storage/local-storage-compat.ts` (NEW)
- `lib/supabase/browser-client.ts` (NEW)
- `lib/supabase/server-client.ts` (NEW)
- `lib/utils/id.ts` (NEW)
- `next.config.mjs` (UPDATED - error suppressions removed)
- `tests/*.test.ts` (NEW - 7 test suites)

---

## 8. Compatibility Notes & Known Issues

- Existing UI components (`components/workout-planner.tsx`, `components/workout-plan-with-tracking.tsx`, `components/enhanced-dashboard.tsx`) continue to function without disruption.
- Legacy localStorage keys are maintained and read safely via the compatibility layer.
- Duplicate legacy files (`lib/difficulty_adjuster.ts` vs `lib/difficulty-adjuster.ts`) are retained for backwards import compatibility until component refactoring in subsequent phases.

---

## 9. Next Recommended Phase

**PHASE 2B — INDEXEDDB + LOCAL-FIRST PERSISTENCE**  
- Implement IndexedDB schema (`workout_planner` v1) with Dexie / native IndexedDB stores.
- Implement Local Repositories (`LocalUserRepository`, `LocalWorkoutRepository`, `LocalCompletionRepository`, `LocalFavoritesRepository`).
- Implement idempotent `LocalStorage` -> `IndexedDB` migration adapter.
- Add local persistence test suite.
