# Foundation Persistence Readiness Matrix

> **Phase 2H.5** — Domain-only extensions. No new IndexedDB stores, Supabase tables, or sync entities.

## Readiness Legend

| Status | Meaning |
|--------|---------|
| ✅ | Implemented and operational |
| 🔲 | Domain type defined, persistence deferred to future phase |
| — | Not applicable for this entity |

---

## USER Domain

| Entity | Domain Type | IndexedDB | Supabase | Sync Queue | Status |
|--------|:-----------:|:---------:|:--------:|:----------:|--------|
| UserProfile | ✅ | ✅ | ✅ | ✅ | **Cloud-synced** |
| TrainingPreferences | ✅ | 🔲 | 🔲 | 🔲 | **Domain-only** |
| TrainingConstraints | ✅ (union type) | — | — | — | **Domain-only** (embedded in TrainingPreferences) |
| BodyMetricEntry | ✅ | 🔲 | 🔲 | 🔲 | **Domain-only** |

## DISCOVERY Domain

| Entity | Domain Type | IndexedDB | Supabase | Sync Queue | Status |
|--------|:-----------:|:---------:|:--------:|:----------:|--------|
| Exercise | ✅ | ✅ (catalog) | ✅ (catalog) | — | **Cloud-persisted** (read-only catalog) |
| ExerciseVariation | ✅ | 🔲 | 🔲 | — | **Domain-only** (embedded in Exercise) |
| ExerciseAlternative | ✅ | ✅ (embedded) | ✅ (embedded) | — | **Cloud-persisted** (embedded in Exercise) |
| ComplementaryExercise | ✅ | 🔲 | 🔲 | — | **Domain-only** (embedded in Exercise) |
| Muscle | ✅ | ✅ | ✅ | — | **Cloud-persisted** (read-only) |
| Joint | ✅ | ✅ | ✅ | — | **Cloud-persisted** (read-only) |
| Equipment | ✅ | ✅ | ✅ | — | **Cloud-persisted** (read-only) |

## WORKOUT Domain

| Entity | Domain Type | IndexedDB | Supabase | Sync Queue | Status |
|--------|:-----------:|:---------:|:--------:|:----------:|--------|
| WorkoutDraft | ✅ | — (in-memory) | — | — | **Local-only** (in-memory) |
| WorkoutTemplate | ✅ | ✅ | ✅ | ✅ | **Cloud-synced** |
| GeneratedWorkout | ✅ | ✅ | ✅ | ✅ | **Cloud-synced** |
| GeneratedWorkoutExercise | ✅ | ✅ (embedded) | ✅ (embedded) | — | **Cloud-synced** (embedded in parent) |
| WorkoutExerciseGroup | ✅ (via groupId/groupType/groupPosition) | 🔲 | 🔲 | — | **Domain-only** (optional metadata on exercises) |
| WorkoutPresentationMode | ✅ (union type) | 🔲 | 🔲 | — | **Domain-only** (optional field on workouts) |
| QuickWorkoutProfile | ✅ (union type) | 🔲 | 🔲 | — | **Domain-only** (optional field on workouts) |

## SESSION Domain

| Entity | Domain Type | IndexedDB | Supabase | Sync Queue | Status |
|--------|:-----------:|:---------:|:--------:|:----------:|--------|
| WorkoutSession | ✅ | ✅ | ✅ | ✅ | **Cloud-synced** |
| SessionExercise | ✅ | ✅ (embedded) | ✅ (embedded) | — | **Cloud-synced** (embedded in session) |
| WorkoutSet | ✅ | ✅ (embedded) | ✅ (embedded) | — | **Cloud-synced** (embedded in session) |
| WorkoutSet.side | ✅ (SetSide) | 🔲 | 🔲 | — | **Domain-only** (optional field) |
| WorkoutFeedback | ✅ | ✅ | ✅ | ✅ | **Cloud-synced** |
| RecoverySnapshot | ✅ | 🔲 | 🔲 | 🔲 | **Domain-only** |

## PROGRAMMING Domain

| Entity | Domain Type | IndexedDB | Supabase | Sync Queue | Status |
|--------|:-----------:|:---------:|:--------:|:----------:|--------|
| Program | ✅ | ✅ (DB v2) | ✅ | ✅ | **Cloud-synced** |
| ProgramWeek | ✅ | ✅ (DB v2) | ✅ | ✅ | **Cloud-synced** |
| ProgramDay | ✅ | ✅ (DB v2) | ✅ | ✅ | **Cloud-synced** |

## PROGRESS Domain

| Entity | Domain Type | IndexedDB | Supabase | Sync Queue | Status |
|--------|:-----------:|:---------:|:--------:|:----------:|--------|
| DashboardMetrics | ✅ | — (computed) | — | — | **Computed** (derived from sessions) |
| PersonalRecord | ✅ | — (computed) | — | — | **Computed** (derived from sessions) |
| FitnessGoalTarget | ✅ | ✅ (DB v2) | ✅ | ✅ | **Cloud-synced** |
| Streak | ✅ | — (computed) | — | — | **Computed** (derived from sessions) |
| ChallengeProgress | ✅ | ✅ (DB v2) | ✅ | ✅ | **Cloud-synced** |

## ENGAGEMENT Domain

| Entity | Domain Type | IndexedDB | Supabase | Sync Queue | Status |
|--------|:-----------:|:---------:|:--------:|:----------:|--------|
| Reminder | ✅ | 🔲 | 🔲 | 🔲 | **Domain-only** |
| Challenge | ✅ | ✅ (DB v2) | ✅ | — | **Read-only Catalog / Custom** |
| ShareableWorkout | ✅ | 🔲 | 🔲 | 🔲 | **Domain-only** |
| WorkoutShare | ✅ | 🔲 | 🔲 | 🔲 | **Domain-only** |

## INTEGRATION Domain

| Entity | Domain Type | IndexedDB | Supabase | Sync Queue | Status |
|--------|:-----------:|:---------:|:--------:|:----------:|--------|
| IntegrationProvider | ✅ | 🔲 | 🔲 | — | **Domain-only** |
| IntegrationConnection | ✅ | 🔲 | 🔲 | 🔲 | **Domain-only** |
| IntegrationCapability | ✅ | 🔲 | 🔲 | — | **Domain-only** (embedded in Provider) |

## AI Domain

| Entity | Domain Type | IndexedDB | Supabase | Sync Queue | Status |
|--------|:-----------:|:---------:|:--------:|:----------:|--------|
| Recommendation | ✅ | — | — | — | **Computed** |
| RecommendationEvent | ✅ | 🔲 | 🔲 | 🔲 | **Domain-only** |
| AICoachMessage | ✅ | 🔲 | 🔲 | 🔲 | **Domain-only** |

---

## Future Supabase Tables (Post-Phase 2J)

When future phases implement persistence for remaining domain-only entities, the following tables will be needed:

| Future Table | Phase | Notes |
|---|---|---|
| `training_preferences` | Future | Embedded in user profile or separate table |
| `body_metrics` | Future | Time-series body measurements |
| `recovery_snapshots` | Future | Non-medical readiness data |
| `reminders` | Future | Scheduled notifications |
| `shareable_workouts` | 2N | Privacy-respecting workout sharing |
| `workout_shares` | 2N | Share links and permissions |
| `integration_providers` | 2O | Provider registry |
| `integration_connections` | 2O | User-provider connections |
| `ai_coach_messages` | 2M | Conversation history |

---

## IndexedDB Stores (Phase 2J — DB_VERSION 2)

**DB_VERSION is 2.**

New stores added in Phase 2J:
- `programs`
- `program_weeks`
- `program_days`
- `fitness_goals`
- `challenges`
- `challenge_progress`

Existing stores (retained from DB v1):
- `local_profiles`
- `local_workout_templates`
- `local_generated_workouts`
- `local_workout_sessions`
- `local_workout_feedback`
- `local_favorites`
- `sync_queue`
- `sync_locks`
- `sync_conflicts`
- `sync_cursors`
- `catalog_exercises`
- `catalog_muscles`
- `catalog_equipment`
- `catalog_joints`
- `anatomy_regions`

All legacy v1 session, set, template, and profile data remain 100% backward-compatible and preserved during the v1 $\to$ v2 upgrade.
