# Phase 2H — Current UI & State Architecture Audit

Date: 2026-08-26  
Author: Antigravity Agent  
Phase: 2H (Workout UI / Builder Integration)  
Status: AUDIT COMPLETE

---

## 1. Executive Summary

This audit inspects the legacy prototype UI components ([components/workout-planner.tsx](file:///e:/Mini%20project%202/workout-planner/workout_planner/components/workout-planner.tsx), [components/workout-plan-with-tracking.tsx](file:///e:/Mini%20project%202/workout-planner/workout_planner/components/workout-plan-with-tracking.tsx), and [contexts/workout-completion-context.tsx](file:///e:/Mini%20project%202/workout-planner/workout_planner/contexts/workout-completion-context.tsx)) to document current state ownership, data flow, direct `localStorage` access, direct Supabase calls, and business logic duplication prior to modular migration onto the verified Phase 2A–2G domain architecture.

---

## 2. Current Components & Responsibilities

| Component / File | Current Responsibility | Architectural Issue / Anti-Pattern |
| --- | --- | --- |
| `components/workout-planner.tsx` (1,235 lines) | Monolithic controller handling questionnaire steps, legacy generation triggers, local state editing, saved plans list, user profile creation, and sub-modal orchestrations. | Directly reads and writes `localStorage` (`savedWorkoutPlans`, `userProfile`, `returningUsers`), mixes UI rendering with storage operations, duplicates workout structures. |
| `components/workout-plan-with-tracking.tsx` (381 lines) | Displays generated plan cards, handles set checkboxes, calls context for completion, triggers legacy calorie recalculations. | Conflates planned exercise cards with live session tracking; attempts to create Supabase tables on the fly via context; creates fake performed sets from planned sets. |
| `contexts/workout-completion-context.tsx` (1,247 lines) | Manages completed exercises, saved workouts, favorites, and offline flags. | Contains duplicated database logic, inline SQL RPC table creation, direct Supabase client calls, and bypassed `LocalWorkoutRepository` / `SessionCommandService`. |
| `components/favorites-context.tsx` (102 lines) | Manages workout favorites in `localStorage`. | Bypasses `LocalFavoritesRepository` (IndexedDB `favorites` store) and creates duplicate favorite arrays. |
| `components/enhanced-muscle-group-dropdown.tsx` | Custom dropdown for selecting muscle focus. | Hardcoded muscle groups not unified with Phase 2F/2G canonical taxonomy. |

---

## 3. Current State Ownership & Data Flow

```text
[LEGACY PROTOTYPE FLOW]

User Form / Clicks
       │
       ▼
components/workout-planner.tsx (useState: formData, savedPlans, workoutPlan)
       │
   ┌───┴───────────────────────────┐
   ▼                               ▼
localStorage.setItem()       contexts/workout-completion-context.tsx
("savedWorkoutPlans",              │
 "userProfile",              ┌─────┴─────────────────────┐
 "returningUsers")           ▼                           ▼
                       supabase.from()             createRequiredTables()
                       (Direct API calls)          (Inline RPC table creation)
```

### Identified Flaws:
1. **Direct `localStorage` Mutations:** Saved plans, user profiles, and returning user names are stringified directly into `localStorage`, bypassing IndexedDB, repository abstractions, and offline sync queues.
2. **Direct Supabase Mutations:** `workout-completion-context.tsx` tries to query and mutate `completed_exercises` and `saved_workouts` directly in Supabase without passing through `LocalWorkoutSessionRepository` or `SyncCoordinator`.
3. **Premature Session Execution:** Marking an exercise completed in the plan creates ad-hoc records without an active `WorkoutSession` aggregate or `SessionCommandService` lifecycle.
4. **Duplication of Domain Models:** Legacy objects (`SavedWorkout`, `CompletedExercise`, `plan.exercises`) conflict with verified domain entities (`WorkoutTemplate`, `GeneratedWorkout`, `WorkoutSession`, `SessionExercise`, `WorkoutSet`).

---

## 4. Specific Duplications to Eliminate

1. **Generation Logic in Components:** Questionnaire must invoke `WorkoutEngine.generateWorkoutPlan()` without calculating sets/reps inside React component handlers.
2. **Session Logic in Contexts:** Session execution must strictly use `useWorkoutSession()` / `SessionCommandService`.
3. **Exercise Data in UI:** Exercise selection must query `ExerciseCatalog` and `ANATOMY_REGIONS` rather than legacy hardcoded objects.
4. **Favorites Storage:** Favorites must use `LocalFavoritesRepository` (IndexedDB backed).

---

## 5. Target Architecture for Phase 2H

```text
[TARGET MODULAR ARCHITECTURE]

                      WORKOUT CREATION
                             │
               ┌─────────────┴─────────────┐
               │                           │
        Generated (Wizard)              Manual
               │                           │
               └─────────────┬─────────────┘
                             ▼
                       Workout Builder
                             │
                    ┌────────┴────────┐
                    │                 │
                 Exercise          Exercise
                 Library            Anatomy
                    │                 │
                    └────────┬────────┘
                             ▼
                       Saved Workout
                    (LocalWorkoutRepo)
                             │
                             ▼
                       Start Workout
                             │
                             ▼
                   SessionCommandService
                   (useWorkoutSession)
                             │
                             ▼
                         IndexedDB
                             │
                             ▼
                        Sync Queue
                             │
                             ▼
                         Supabase
```

---

## 6. Migration & Backward Compatibility Strategy

- Legacy files (`components/workout-planner.tsx`, `contexts/workout-completion-context.tsx`) will be preserved for backward compatibility until their consumers are migrated.
- The new modular system will live in `components/workout/` (or `features/workout/`) and be wired into `app/page.tsx`.
- All newly saved workouts, generated plans, and active sessions will strictly target `IndexedDB` through repository interfaces and `SessionCommandService`.
