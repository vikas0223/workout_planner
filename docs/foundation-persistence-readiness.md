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
| Challenge | ✅ | ✅ (DB v2) | ✅ | ✅ | **Cloud-synced** |
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

## Future Supabase Tables (Not Created in 2H.5)

When future phases implement persistence for domain-only entities, the following tables will be needed:

| Future Table | Phase | Notes |
|---|---|---|
| `training_preferences` | 2I | Embedded in user profile or separate table |
| `body_metrics` | 2I | Time-series body measurements |
| `recovery_snapshots` | 2I | Non-medical readiness data |
| `programs` | 2J | Multi-week training programs |
| `program_weeks` | 2J | Embedded or separate table |
| `program_days` | 2J | References workout_templates |
| `fitness_goal_targets` | 2J | User-level goals |
| `personal_records` | 2J | Per-exercise PR tracking |
| `streaks` | 2J | Consecutive activity tracking |
| `challenges` | 2J | Challenge definitions |
| `challenge_progress` | 2J | User progress toward challenges |
| `reminders` | 2J | Scheduled notifications |
| `shareable_workouts` | 2N | Privacy-respecting workout sharing |
| `workout_shares` | 2N | Share links and permissions |
| `integration_providers` | 2O | Provider registry |
| `integration_connections` | 2O | User-provider connections |
| `ai_coach_messages` | 2M | Conversation history |

---

## IndexedDB Stores (No Changes in 2H.5)

**DB_VERSION remains 1.**

No new stores added. Existing stores:
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

New optional fields (groupId, groupType, groupPosition, side, presentationMode, quickProfile) are backward-compatible within existing stores — they will be persisted as `undefined` until the UI writes them.
