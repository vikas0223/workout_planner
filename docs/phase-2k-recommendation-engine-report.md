# Phase 2K — Deterministic Recommendation Engine Report

**Status:** COMPLETE & FULLY VERIFIED  
**Phase Scope:** Deterministic, Local-First, Zero-LLM Recommendation Engine & Rule Evaluation Pipeline  
**Version:** 1.0.0  

---

## 1. Executive Summary

Phase 2K delivers a deterministic, local-first, offline-capable recommendation engine for the workout planner platform. Built strictly without external LLMs or black-box machine-learning APIs, the engine evaluates structured user context—including workout history, completed sets, feedback, active programs, goals, and training constraints—to generate explainable, actionable training suggestions with deterministic scoring and cooldown suppression.

---

## 2. Core Architecture & Invariants

### 2.1 Single Source of Truth & Data Flow
$$\text{Canonical Workout / Session History} \longrightarrow \text{ProgressAnalytics / Goals / Programs} \longrightarrow \text{RecommendationContext} \longrightarrow \text{DeterministicRecommendationEngine} \longrightarrow \text{Recommendation[]} \longrightarrow \text{UI} \longrightarrow \text{RecommendationEvent}$$

- **Zero Dual-State / Competing Domain Types:** Canonical domain entities (`Recommendation`, `RecommendationEvent`, `RecommendationId`) remain centralized in `types/domain.ts`. Pipeline-specific constructs (`RecommendationContext`, `RecommendationCandidate`, `RecommendationEvidence`, `RecommendationRuleResult`, `RecommendationScoreBreakdown`, `DeterministicRecommendation`) reside in `lib/domain/recommendations/recommendation-types.ts`.
- **In-Memory Derivation:** Recommendations are computed on demand in memory from canonical data. No duplicate derived recommendation models are stored in IndexedDB.
- **Substitution Derivation:** Exercise substitution preferences are derived directly from canonical `WorkoutSession` $\to$ `SessionExercise.substitutedFromExerciseId` occurrences ($\ge 2$ observations threshold), completely isolated from recommendation telemetry.
- **Pure Function Boundary:** `DeterministicRecommendationEngine` and `RecommendationRules` are 100% pure functions with zero direct I/O, storage, or browser dependencies.

---

## 3. Engine Pipeline & Rule Specifications

### 3.1 Pipeline Sequence
1. **Candidate Gathering:** Rule evaluators inspect `RecommendationContext` and produce candidate results.
2. **Hard Constraints Filtering (Before Scoring):** User constraints (`bodyweight_only`, `home_only`, `quiet`, `no_jump`, `limited_space`) are evaluated first; violating candidates are immediately eliminated.
3. **Scoring & Preference Weighting:**
   - Goal Alignment (Max 30)
   - Performance Evidence (Max 25)
   - User Preferences (Max 20)
   - Consistency & Frequency (Max 15)
   - Recency (Max 10)
   - *Total Score: 0–100*
4. **Deterministic Fingerprinting:** Stable 32-bit integer hash generated from `(version, category, ruleId, entityId, payload)` for deduplication and cooldown tracking.
5. **Cooldown & Dismissal Suppression:** Dismissed recommendations and recently shown recommendations within the active window (24h general, 2h in-workout) are suppressed.
6. **Ranking & Limiting:** Sorted descending by score.

### 3.2 Implemented Rule Evaluators
| Category | Rule ID | Description & Contextual Behavior |
|---|---|---|
| `progress_load` | `rule_load_progression` / `rule_bodyweight_progression` | Conservative load progression (+2.5kg barbell / +2.0kg dumbbell) after 2+ clean sessions meeting target reps; rep/tempo progression for bodyweight. |
| `reduce_load` | `rule_load_reduction` | Form optimization and load reduction (5%–10%) after repeated missed reps or high RPE with non-medical language. |
| `swap_exercise` | `rule_substitution_preference` | Learned substitution preference derived from canonical `substitutedFromExerciseId` history. |
| `choose_workout` | `rule_program_next_day` | Automatically surfaces next scheduled/planned day from user's active training program. |
| `choose_workout` | `rule_muscle_balance` | Focuses underworked muscle groups (<8% volume distribution) identified by ProgressAnalytics. |
| `recovery_day` | `rule_active_recovery` | Light active recovery suggestion after 3 consecutive workout days or high reported fatigue. |
| `goal_alignment` | `rule_goal_alignment` | Actionable milestone target for user's highest priority active fitness goal. |
| `consistency` | `rule_weekly_consistency` | Mid/late-week nudge when completed workouts are below weekly target. |

---

## 4. Storage & Persistence Layer

- **Store:** `STORES.RECOMMENDATION_EVENTS` (`recommendation_events` in IndexedDB v2).
- **`LocalRecommendationRepository`:** Persists `RecommendationEvent` records (`shown`, `accepted`, `dismissed`, `rated`) for interaction tracking and cooldown suppression.
- **Guest vs Auth Boundary:**
  - Guest events are saved with `ownerKind: 'guest'` and `syncStatus: 'local'`, remaining isolated from the cloud queue.
  - Authenticated events are saved with `ownerKind: 'user'` and enqueued into `SYNC_QUEUE` for Supabase sync.

---

## 5. UI Integration & Accessibility

1. **`RecommendationCard` (`components/recommendations/recommendation-card.tsx`):**
   - Accessible banner & card presentation with category icons, confidence badges, factual explanations, and action/dismiss buttons.
   - 100% WCAG AA compliant contrast, matching visible text accessible names, and full keyboard navigation.
2. **Workout Hub (`components/workout/workout-hub.tsx`):**
   - Renders primary contextual recommendation banner at the top of the hub view.
3. **In-Workout Session View (`components/workout/workout-session-view.tsx`):**
   - Renders live exercise progression / learned substitution chip above the `SetLogger`.
4. **Dashboard Overview (`components/dashboard/overview-tab.tsx`):**
   - Surfaces goal alignment, consistency, and recovery recommendations.

---

## 6. Verification Results

### 6.1 Quality Gates
- **TypeScript Typecheck (`pnpm typecheck`):** PASS (0 errors)
- **ESLint (`pnpm lint`):** PASS (0 errors)
- **Vitest Test Suite (`pnpm test`):**
  - **55 / 55 Test Files Passed**
  - **332 Passed, 8 Skipped, 0 Failed (340 Total Tests)**
- **Next.js Production Build (`pnpm build`):** PASS (10 / 10 static routes prerendered)

### 6.2 Lighthouse Audits (Production Build)
| Route | Performance | Accessibility | Best Practices | Status |
|---|---|---|---|---|
| `/` (Home / Workout Hub) | 79 (Desktop Emulation) | **100** | **100** | PASS |
| `/dashboard` | 77 (Desktop Emulation) | **100** | **96** | PASS |

---

## 7. Deliverables & File Summary

- `lib/domain/recommendations/recommendation-types.ts` — Engine internal pipeline types and contracts.
- `lib/domain/recommendations/recommendation-rules.ts` — Pure deterministic rule evaluators.
- `lib/domain/recommendations/recommendation-engine.ts` — Pure `DeterministicRecommendationEngine` implementation.
- `lib/domain/recommendations/index.ts` — Module exports.
- `lib/domain/recommendations.ts` — Canonical domain adapter and backward compatibility wrapper.
- `lib/repositories/local/local-recommendation-repository.ts` — Local persistence for recommendation events.
- `hooks/use-recommendations.ts` — Reactive hook with canonical context hydration and event dispatch.
- `components/recommendations/recommendation-card.tsx` — Accessible UI recommendation card and compact banner.
- `tests/recommendation-engine.test.ts` — Pure engine determinism and constraint tests.
- `tests/recommendation-rules.test.ts` — Rule evaluator tests.
- `tests/recommendation-ranking.test.ts` — Scoring weights, preference boosts, and ranking tests.
- `tests/recommendation-events.test.ts` — Event persistence and cooldown suppression tests.
- `tests/recommendation-offline.test.ts` — 100% offline local-first end-to-end integration tests.

---

**Phase 2K is complete and fully verified. Ready for user inspection.**
