# Phase 2F — Exercise Data Audit Report

Date: 2026-08-25  
Audited Files: `lib/exercise-database.ts`, `lib/data/exercise-catalog.ts`, `types/domain.ts`

---

## 1. Current Data State

### Quantitative Summary

- **Raw Top-Level Goal Categories:** 4 (`strength`, `cardio`, `flexibility`, `hypertrophy`)
- **Raw Sub-Group Buckets:** 6 (`full-body`, `upper-body`, `lower-body`, `push`, `pull`, `split`)
- **Raw Exercise Entries (with duplicates across buckets):** 268 entries
- **Normalized Unique Exercise Count:** 166 unique exercises

### Current Schema in `lib/exercise-database.ts`

Each entry in `exerciseDatabase` has:

```ts
{
  name: string;
  sets: number;
  reps: string;
  rest: string | number;
  equipment: string[];
  muscleGroup: string;
  instructions: string;
}
```

---

## 2. Identified Data Quality Issues

| Issue Category | Description in Current Dataset | Target Normalization |
| --- | --- | --- |
| **Duplicate Definitions** | Same exercise defined across multiple goals/splits (e.g. "Barbell Bench Press" appears under Push, Hypertrophy, Upper Body). | Merge into single canonical record with array of supported `goals: FitnessGoal[]`. |
| **Missing Unique Stable IDs** | Raw records have no `id` or `slug`, only transient array indices. | Generate deterministic UUIDs using canonical namespaces and URL-safe slugs. |
| **Unnormalized Muscle Groups** | Values like `"Chest/Triceps"`, `"Legs/Back"`, `"Abs/Obliques"`. | Normalize into `primaryMuscles: string[]` and `secondaryMuscles: string[]`. |
| **Equipment Variations** | Plural vs singular `"Dumbbells"` vs `"Dumbbell"`, `"Body Weight"` vs `"Bodyweight"`. | Canonical equipment enum (`Barbell`, `Dumbbell`, `Cable`, `Machine`, `Bodyweight`, `Kettlebell`, `Resistance Band`). |
| **Missing Movement Pattern** | No classification for push/pull/squat/hinge/carry/rotation/isolation. | Add `movementPattern: MovementPattern` to every canonical exercise. |
| **Lack of Form Cues & Mistakes** | Instructions are single concatenated strings without bulleted cues or injury-prevention notes. | Add `formCues: string[]` and `commonMistakes: string[]` (using safe, non-medical language). |
| **No Structured Alternatives** | No direct mapping of exercise substitutions for progression/regression/equipment. | Add `alternatives: ExerciseAlternative[]` with `alternativeExerciseId` and `reason`. |
| **Media Provenance Missing** | No license, source attribution, or commercial use metadata. | Add `provenance: ProvenanceMetadata` (`source`, `license`, `attribution`, `commercialUseAllowed: true`). |

---

## 3. Taxonomy Mapping

### Muscle Mapping

- `"Chest/Triceps"` -> Primary: `['Chest']`, Secondary: `['Triceps', 'Shoulders']`
- `"Back/Biceps"` -> Primary: `['Back', 'Lats']`, Secondary: `['Biceps', 'Forearms']`
- `"Legs/Glutes"` -> Primary: `['Quads', 'Hamstrings']`, Secondary: `['Glutes', 'Calves']`
- `"Shoulders/Traps"` -> Primary: `['Shoulders']`, Secondary: `['Traps', 'Triceps']`
- `"Abs/Core"` -> Primary: `['Abs']`, Secondary: `['Obliques', 'Lower Back']`

### Movement Pattern Taxonomy

- Horizontal & Vertical Pressing -> `push`
- Horizontal & Vertical Pulling -> `pull`
- Knee-dominant lower body -> `squat`
- Hip-dominant lower body -> `hinge`
- Loaded carries -> `carry`
- Rotational / anti-rotational -> `rotation`
- Single joint isolation -> `isolation`
- Cardio / bodyweight travel -> `locomotion`

### Goal Normalization

Canonical goals:
- `strength`
- `hypertrophy`
- `endurance`
- `general_fitness`
- `fat_loss`
- `mobility`
- `cardio`
- `flexibility`

---

## 4. Normalization Execution

The normalization script at `scripts/generate-canonical-exercises.ts`:

- Deduplicates all 268 raw items down to 166 unique canonical exercises.
- Assigns deterministic UUIDs based on normalized name hashes.
- Injects standard movement patterns, primary/secondary muscles, equipment, cues, mistakes, alternatives, and licensing metadata.
- Outputs `lib/data/canonical-exercises.ts`.

---

## 5. Verification & Referential Integrity

- Run `validateExerciseCatalog(CANONICAL_EXERCISES)` to ensure 0 errors.
- Referential integrity check ensures every `alternativeExerciseId` exists in the 166 dataset.
- All exercises contain valid CC-BY-4.0 / Public Domain provenance metadata.
