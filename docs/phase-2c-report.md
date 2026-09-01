# Phase 2C — Workout Session Command Layer Report

**Phase:** Phase 2C — Workout Session Command Layer  
**Status:** COMPLETE  

---

## 1. Quality & Verification Gates

- **TYPECHECK:** PASS (`tsc --noEmit` clean, 0 errors)
- **LINT:** PASS (`next lint` clean, 0 errors)
- **TEST:** PASS (67 / 67 tests passing across 10 test suites)
  - `tests/workout-session-commands.test.ts` (23 tests passing)
  - `tests/local-persistence.test.ts` (18 tests passing)
  - `tests/migration-fixtures.test.ts` (4 tests passing)
  - `tests/workout-engine.test.ts` (6 tests passing)
  - `tests/exercise-catalog.test.ts` (4 tests passing)
  - `tests/dashboard-metrics.test.ts` (2 tests passing)
  - `tests/difficulty-adjustment.test.ts` (3 tests passing)
  - `tests/calories.test.ts` (3 tests passing)
  - `tests/seeded-random.test.ts` (3 tests passing)
  - `tests/smoke.test.ts` (1 test passing)
- **BUILD:** PASS (Next.js production build verified clean with static optimization)

---

## 2. Current 2B Session Implementation vs Target 2C Contract

### Audit Findings:
1. **Session Status**:
   - *Phase 2B*: Used `'in_progress'` as session status string in initial prototype.
   - *Phase 2C Target*: Standardized on the database design contract: `'planned' | 'active' | 'completed' | 'abandoned'`.
2. **Set Creation & Semantics**:
   - *Phase 2B*: Stored planned set counts by instantiating placeholder `sets` records at session creation.
   - *Phase 2C Target*: `startSession()` creates `WorkoutSession` + ordered `SessionExercise` records preserving planned prescriptions (`plannedSets`, `plannedReps`, `plannedRestSeconds`), but does **not** instantiate premature `Set` records. Actual `Set` records are created and logged during active session execution.
3. **Command Architecture & Duplication**:
   - *Phase 2B*: Mutations existed inside `lib/domain/commands/local-workout-service.ts`.
   - *Phase 2C Target*: Established one authoritative canonical domain command service in `features/workout-session/session-command-service.ts`. Converted `LocalWorkoutService` into a thin compatibility adapter that delegates directly to `SessionCommandService`, completely eliminating duplicate business rules.
4. **Validation & State Transitions**:
   - *Phase 2C Target*: Added `SessionValidator` enforcing strict positive set numbers, unique `(sessionExerciseId, setNumber)`, non-negative loads/reps, RPE 1–10, legal exercise transitions (`pending -> active -> completed/skipped/substituted`), and completed-set measurability validation.
5. **Set Deletion & Versioning**:
   - *Phase 2C Target*: Implemented soft-delete (`deletedAt`) and version incrementing on `SetRecord` while preserving original stable IDs.

---

## 3. Changes Made

1. **Domain Types (`types/domain.ts`)**:
   - Aligned `SessionStatus` to exact `'planned' | 'active' | 'completed' | 'abandoned'`.
   - Added `SessionExerciseStatus` (`'pending' | 'active' | 'completed' | 'skipped' | 'substituted'`).
   - Extended `SessionExercise` with prescription fields (`plannedSets`, `plannedReps`, `plannedRestSeconds`) and substitution tracking (`substitutedFromExerciseId`, `substitutionReason`).
   - Extended `WorkoutSet` with V1 fields (`loadValue`, `loadUnit`, `durationSeconds`, `distanceValue`, `distanceUnit`, `tempo`).
   - Added `PreviousPerformanceSummary` and `PreviousPerformanceRecord` contracts.

2. **Command Contracts & Structured Errors (`features/workout-session/session-commands.types.ts`)**:
   - Defined `StartSessionInput`, `CreateSessionExerciseInput`, `LogSetInput`, `UpdateSetInput`, `SubstituteExerciseInput`, `CompleteSessionOptions`.
   - Created structured domain error hierarchy: `WorkoutDomainError`, `SessionNotFoundError`, `SessionExerciseNotFoundError`, `SetNotFoundError`, `InvalidStateTransitionError`, `SetValidationError`, `DuplicateSetNumberError`, `InvalidSessionInputError`.

3. **Session & Set Validator (`features/workout-session/session-validator.ts`)**:
   - Enforces legal session status transitions.
   - Enforces legal exercise status transitions (`pending -> active`, `active -> completed`, `pending -> skipped`, etc.).
   - Validates set input values, range checks, set numbering uniqueness, and completed-set measurability.

4. **Authoritative Session Command Service (`features/workout-session/session-command-service.ts`)**:
   - `startSession(input)`
   - `createSessionExercises(sessionId, exercises)`
   - `addSessionExercise(sessionId, exercise)`
   - `logSet(input)`
   - `updateSet(input)`
   - `deleteSet(sessionId, sessionExerciseId, setId)`
   - `completeExercise(sessionId, sessionExerciseId)`
   - `skipExercise(sessionId, sessionExerciseId)`
   - `substituteExercise(input)`
   - `completeSession(sessionId, options)`
   - `abandonSession(sessionId)`
   - `resumeSession(sessionId)`
   - `getActiveSession(userId)`
   - Read models: `getSession()`, `getSessionExercises()`, `getSets()`, `getCompleteSession()`, `getPreviousPerformance()`.

5. **Workout Session React Hook (`features/workout-session/use-workout-session.ts`)**:
   - Exposes clean session state and command dispatchers without leaking database/IndexedDB implementation details to UI components.

6. **Repository & Service Harmonization (`lib/repositories/local/local-completion-repository.ts` & `lib/domain/commands/local-workout-service.ts`)**:
   - Enhanced `LocalCompletionRepository` with soft-deletion, active session querying, and previous performance calculation.
   - Refactored `LocalWorkoutService` to delegate all session execution logic to `SessionCommandService`.

---

## 4. Canonical Command API

```typescript
import { SessionCommandService } from '@/features/workout-session';

const sessionService = new SessionCommandService();

// 1. Start session
const session = await sessionService.startSession({ userId: 'user_1', workout: generatedWorkout });

// 2. Log set
const set = await sessionService.logSet({
  sessionId: session.id,
  sessionExerciseId: session.exercises[0].id,
  actualReps: 10,
  actualWeight: 25,
  rpe: 8,
});

// 3. Update set
await sessionService.updateSet({
  sessionId: session.id,
  sessionExerciseId: session.exercises[0].id,
  setId: set.id,
  patch: { actualReps: 12 },
});

// 4. Delete set (soft delete)
await sessionService.deleteSet(session.id, session.exercises[0].id, set.id);

// 5. Complete exercise
await sessionService.completeExercise(session.id, session.exercises[0].id);

// 6. Complete session
const completed = await sessionService.completeSession(session.id);
```

---

## 5. Session Model & Set Model

- **Session Hierarchy**:
  ```
  WorkoutSession (status: planned | active | completed | abandoned)
      ↓
  SessionExercise (status: pending | active | completed | skipped | substituted)
      ↓
  WorkoutSet (status: planned | completed | skipped)
  ```
- **Prescription vs Performed Distinction**:
  - `GeneratedWorkoutExercise`: Original deterministic plan prescription.
  - `SessionExercise`: Exercise instance in the active workout execution. Holds `plannedSets`, `plannedReps`, and `plannedRestSeconds`.
  - `WorkoutSet`: Represents actual performed / logged sets created during execution.

---

## 6. Tests Added & Updated

### `tests/workout-session-commands.test.ts` (23 tests):
1. `startSession` creates active session and initializes exercises with planned prescriptions.
2. `createSessionExercises` appends ordered exercise records to active session.
3. Session exercise ordering is strictly preserved.
4. `logSet` logs first set with valid values and updates exercise status to active.
5. `logSet` auto-determines next set number when omitted.
6. `logSet` rejects duplicate set number with `DuplicateSetNumberError`.
7. `updateSet` updates reps, weight, RPE, rest, and notes.
8. `updateSet` preserves original set ID.
9. `deleteSet` removes set from active view and soft-deletes in repository.
10. `completeExercise` marks exercise status as completed and timestamps completion.
11. `skipExercise` marks exercise as skipped while preserving logged sets.
12. `substituteExercise` records replacement and preserves previous exercise reference.
13. `completeSession` calculates duration, total volume, and marks status completed.
14. `abandonSession` marks status abandoned and preserves logged data.
15. `resumeSession` reconstructs active session directly from local persistence.
16. Invalid session ID throws `SessionNotFoundError`.
17. Invalid exercise ID throws `SessionExerciseNotFoundError`.
18. Invalid set inputs (negative reps, invalid RPE) throw `SetValidationError`.
19. Completed set validation requires at least one measurable value.
20. Session persistence survives repository reinitialization.
21. Integration: start session -> reload repository -> reconstruct session.
22. Integration: log set -> reload repository -> verify exact set values.
23. Integration: complete session -> reload repository -> verify status/history and previous performance.

### `tests/local-persistence.test.ts` (18 tests):
- Updated to verify `'active'` status and planned prescription model without premature set records.

---

## 7. Files Changed / Created

- `types/domain.ts` (UPDATED)
- `lib/repositories/interfaces.ts` (UPDATED)
- `lib/repositories/local/local-completion-repository.ts` (UPDATED)
- `lib/domain/commands/local-workout-service.ts` (UPDATED)
- `features/workout-session/session-commands.types.ts` (NEW)
- `features/workout-session/session-validator.ts` (NEW)
- `features/workout-session/session-command-service.ts` (NEW)
- `features/workout-session/use-workout-session.ts` (NEW)
- `features/workout-session/index.ts` (NEW)
- `tests/workout-session-commands.test.ts` (NEW)
- `tests/local-persistence.test.ts` (UPDATED)
- `docs/phase-2c-report.md` (NEW)

---

## 8. Duplicated Logic Removed

- Eliminated divergent session mutation logic between `LocalWorkoutService` and the domain session layer.
- `LocalWorkoutService` now acts as a thin compatibility wrapper that directly delegates all session lifecycle, exercise transitions, set logging, set updates, and completion operations to the canonical `SessionCommandService`.
- Centralized validation rules into `SessionValidator` to avoid fragmented validation across controllers and UI components.

---

## 9. Known Issues & Compatibility

- **UI Migration**: UI components (`components/workout-plan-with-tracking.tsx`, `contexts/workout-completion-context.tsx`) maintain their presentational behavior and can cleanly adopt `useWorkoutSession` in Phase 2D / UI consolidation phases without architectural blockers.
- **Offline Reliability**: 100% offline-first. Zero network dependency on session creation, set logging, and completion.

---

## 10. Next Recommended Phase

**PHASE 2D — SYNC QUEUE & SUPABASE CLOUD REPLICA INTEGRATION** (or designated next phase as specified by roadmap).
