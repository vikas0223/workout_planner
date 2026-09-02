# Phase 2L — Adaptive Training Implementation Report

**Document Version:** 1.0.0  
**Status:** COMPLETED & VERIFIED  
**Final Feature Phase of V1.0:** Complete  
**Architecture:** Deterministic, Local-First, Offline-Capable, Zero-LLM, Non-Medical  

---

## 1. Executive Summary

Phase 2L delivers the final feature module of V1.0: **Deterministic Adaptive Training**.

The adaptive engine is a pure, zero-I/O pipeline that calibrates exercise prescriptions (load, reps, sets, tempo, rest, variation, unilateral balance, and fatigue volume) on staged or upcoming workouts based on observed historical performance. It enforces strict precedence hierarchies for conflict resolution, validates all proposals against equipment and modality limits, and provides an accessible, side-by-side **Original vs Adapted** review interface to the user prior to workout session execution.

Zero external LLMs or black-box machine learning models are used. All adaptations are proposed in-memory and require explicit user acceptance before being executed through `SessionCommandService.startSession()`, guaranteeing that historical sessions, program blueprints, and database templates remain immutable.

---

## 2. Architecture & Data Flow

```
Canonical Sessions / Sets / Feedback / PRs
                    ↓
          Context Normalization (AdaptiveNormalization)
                    ↓
            Adaptive Context (zero Date.now() / clock dependencies)
                    ↓
            Rule Evaluation (AdaptiveRules)
                    ↓
          Conflict Resolution (6-Tier Precedence Hierarchy)
                    ↓
       Prescription Validation (AdaptiveValidation)
                    ↓
     Deterministic Adaptation Decision (Stable FNV-1a Hash)
                    ↓
           User Review (AdaptiveReviewCard)
             ↙       ↘
        Accept       Keep Original
           ↓              ↓
      Adapted Draft    Original Draft
             \          /
              \        /
          SessionCommandService.startSession()
                    ↓
            Canonical Session
                    ↓
         Progress Analytics / Invalidation Bus
```

---

## 3. Pure Determinism & Zero Time Dependency

The pure engine (`DeterministicAdaptiveEngine`, `AdaptiveRules`, `AdaptiveNormalization`, `AdaptiveValidation`) adheres to strict invariants:
1. **Zero System Clock Calls:** The engine never invokes `Date.now()`, `new Date()`, `performance.now()`, or `Math.random()`.
2. **Explicit Evaluation Date:** Callers pass an explicit `evaluationDate: string` (ISO format).
3. **Deterministic Hash Fingerprint:** Computed exclusively over normalized deterministic inputs (`version`, `workoutSource`, `sourceEntityId`, sorted session IDs, validated proposals). `evaluationTimestamp` and UI state are excluded from the hash payload.
4. **Permutation Invariance:** Session collections and goal collections are sorted deterministically before processing, guaranteeing identical output regardless of input array ordering.

---

## 4. Contextual Progression & Increment Derivation

Rather than applying universal rules, the engine derives adaptations from baseline prescription, equipment modality, and execution quality:

| Modality / Condition | Trigger Criterion | Calibrated Adaptation |
|---|---|---|
| **Barbell Compound** | $\ge 2$ sessions clean target reps, $\text{RPE} \le 8.5$ | +2.5 kg load progression |
| **Dumbbells** | $\ge 2$ sessions clean target reps, $\text{RPE} \le 8.5$ | +2.0 kg load progression (+1.0 kg per dumbbell) |
| **Cables / Machines** | $\ge 2$ sessions clean target reps, $\text{RPE} \le 8.5$ | +2.5 kg or +5% increment |
| **Form Optimization / Deload** | $\ge 2$ sessions missed reps ($\ge 20\%$) or $\text{RPE} \ge 9.5$ | Conservative 5%–10% reduction (-2.5 kg or -1.0 kg) |
| **Bodyweight Reps** | $\ge 2$ sessions clean execution below ceiling ($< 20$) | +1 to +2 reps |
| **Bodyweight Variations** | $\ge 3$ sessions at rep ceiling ($\ge 15 - 20$ reps) | Progress to advanced variation (e.g. Standard Pushup $\to$ Diamond Pushup) |
| **Unilateral Asymmetry** | $\ge 2$ reps or $> 10\%$ load difference between Left & Right | Anchor prescription to weaker side |
| **Fatigue Volume** | $\ge 3$ consecutive workouts in rolling 4-day window | -1 set on secondary exercises (floor: 2 sets) |

---

## 5. Conflict Resolution & Precedence Hierarchy

1. **Tier 1: Hard Constraints Guard** (Physical equipment absence, user injury constraints; overrides all).
2. **Tier 2: Fatigue & Deload Guard** (Active fatigue suppresses all load/volume increases; fatigue reduction takes precedence).
3. **Tier 3: Performance Regression Guard** (Repeated missed reps force load reduction regardless of user goal).
4. **Tier 4: Variation Progression** (Advanced variation takes precedence over rep progression).
5. **Tier 5: Modality Load / Rep Progression** (Standard overload progression).
6. **Tier 6: Unilateral Balance** (Weaker-side anchoring).

---

## 6. Prescription Validation Bounds

Every adaptation is validated prior to emission:
- **Sets:** $1 \le \text{sets} \le 6$
- **Reps:** $1 \le \text{reps} \le 30$
- **Load:** $\text{targetWeightKg} \ge 0$, $\le 500$ kg
- **Constraints:** If user has `bodyweight_only` active, external load proposals are rejected.

---

## 7. Deliverables & Components

1. **`lib/domain/adaptive/adaptive-types.ts`:** Feature-internal types, interfaces, and engine version `1.0.0`.
2. **`lib/domain/adaptive/adaptive-normalization.ts`:** Session sorting, baseline extraction, and performance history aggregation.
3. **`lib/domain/adaptive/adaptive-rules.ts`:** Pure rule evaluators for load, reps, variations, unilateral balance, and fatigue.
4. **`lib/domain/adaptive/adaptive-validation.ts`:** Boundary, equipment, and constraint validator.
5. **`lib/domain/adaptive/adaptive-engine.ts`:** Pure deterministic engine, conflict resolver, and FNV-1a hash fingerprint generator.
6. **`lib/domain/adaptive/index.ts`:** Module export barrel.
7. **`hooks/use-adaptive-training.ts`:** React hook providing reactive evaluation and `applyAdaptations` helper.
8. **`components/adaptive/adaptive-review-card.tsx`:** Side-by-side diff card with non-medical rationale and accept/decline actions.
9. **`components/adaptive/adaptive-diff-badge.tsx`:** Compact inline badge for exercise lists.
10. **`components/workout/workout-review.tsx`:** Integrated adaptive review gate before starting workouts.
11. **`components/workout/workout-hub.tsx`:** Wired with review staging for saved templates.

---

## 8. Verification Results

| Quality Gate | Command | Requirement | Result | Status |
|---|---|---|---|---|
| **TypeScript Typecheck** | `pnpm typecheck` | 0 errors | 0 errors | **PASSED** |
| **ESLint Quality** | `pnpm lint` | 0 errors | 0 errors | **PASSED** |
| **Vitest Test Suite** | `pnpm test` | All 63 suites pass | 63 passed (351 passed, 8 skipped, 0 failed) | **PASSED** |
| **Next.js Production Build** | `pnpm build` | 10 static routes prerendered | 10 static routes prerendered | **PASSED** |
| **Lighthouse Home (`/`)** | `npx lighthouse http://localhost:3000` | Perf $\ge 75$, A11y $\ge 95$, BP $\ge 95$ | **Perf: 79, A11y: 100, BP: 100, SEO: 100** | **PASSED** |
| **Lighthouse Dashboard (`/dashboard`)** | `npx lighthouse http://localhost:3000/dashboard` | Perf $\ge 75$, A11y $\ge 95$, BP $\ge 95$ | **Perf: 82, A11y: 100, BP: 96, SEO: 100** | **PASSED** |
| **Visual Browser Verification** | `browser_subagent` | Clean wizard \& review flow | Recorded in `phase_2l_adaptive_ui_verification` | **PASSED** |

---

## 9. V1.0 Feature Completion Milestone

Phase 2L marks the completion of the final feature phase of V1.0:
- **Completed V1.0 Feature Phases:** 2A $\to$ 2B $\to$ 2C $\to$ 2D-A $\to$ 2D-B $\to$ 2D-B-V $\to$ 2E $\to$ 2F $\to$ 2G $\to$ 2H $\to$ 2H.5 $\to$ 2I $\to$ 2J $\to$ 2K $\to$ 2L.
- **Next Stage:** V1.0 Stabilization, Optimization, Release Candidate, and V1.0 Release.
- **Strictly Deferred to V2.0:** Conversational AI Coach / LLM (Phase 2M), Social & Community Sharing (Phase 2N), Wearable Device Integrations (Phase 2O).
