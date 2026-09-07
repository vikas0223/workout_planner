# Reproducible Exercise Media Import Pipeline

This document explains how exercise demonstrations are ingested, deterministically matched, verified, and bundled into Replyf.

---

## 1. Source Repositories & Pinned Revisions

To ensure completely reproducible imports across environments, all external sources are pinned to specific Git commit SHAs:

| Source | Repository | Pinned Commit SHA | Primary Role & Rights |
| :--- | :--- | :--- | :--- |
| **free-exercise-db** | `yuhonas/free-exercise-db` | `a859101d633a01c4a1a920d6a8ce41dabba0705f` | Public domain under The Unlicense. Structured metadata, deterministic matching, static exercise images (`0.jpg`, `1.jpg`). Eligible for local bundling. |
| **azilRababe/Exercises_Dataset** | `azilRababe/Exercises_Dataset` | `29145279a39a2675f5e4ade584a50718f71cfa58` | MIT repository code, but individual GIFs are scraped from third-party sites without redistributable license. Kept strictly `referenceOnly: true` (never bundled in production). |
| **ExerciseDB API** | `ExerciseDB/exercisedb-api` | `401ef93437a160f86927fee43b8e692532d04469` | AGPL-3.0 repository / hosted non-commercial API. Used for supplemental reference; never bundled or relied upon for offline runtime. |
| **ExerciseDB Muscle Visualizer API** | `ExerciseDB/muscle-visualizer-api` | `3177d1ce2c9ab382fd875901fa4c6c86b64462c0` | Dynamic anatomical visualization only; never used as exercise movement demonstration source. |
| **MuscleMap** | `melihcolpan/MuscleMap` | `b36312678b6ad3d3c47ea68cb7e18b0d59ee5d86` (v1.0.0) | MIT License. Vector body silhouette geometry; never used as movement demonstration source. |

---

## 2. Canonical Model Protection

Replyf's **166 canonical exercises** in `lib/data/canonical-exercises.ts` remain the sole authoritative domain model.
- External exercise datasets contain thousands of exercises, but Replyf **never imports external catalogs wholesale**.
- Canonical exercise IDs, muscle definitions, and equipment tags are **never overwritten or altered** by external matching.

---

## 3. Deterministic Matching Pipeline

Exercise candidates are evaluated through a 5-tier deterministic hierarchy (`lib/data/exercise-dataset-mapping.ts`):

1. **Exact Source ID Mapping**: Pre-verified source ID in provenance metadata.
2. **Exact Normalized Name**: Strict normalization removing punctuation, equipment prefixes, and plural endings.
3. **Verified Name + Equipment**: Shared name stem plus identical equipment category.
4. **Verified Name + Primary Target Muscles**: Shared name stem plus matching primary target muscle.
5. **Manual Verified Mapping**: Explicit verified lookup table for complex exercise names (`CANONICAL_TO_EXTERNAL_DATASET_MAP`).

### Safety Signatures & Mismatch Prevention

No asset is ever attached simply because of a partial keyword match. The matching pipeline enforces safety signatures:
- **Squat media NEVER displays for Ankle Rotations, Abductor Machine, or Adductor Machine.**
- **Abductor Machine NEVER matches Adductor Machine.**
- **Barbell Back Squat NEVER matches Barbell Front Squat or Smith Machine Squat.**
- **Barbell Row NEVER matches Cable Row or Dumbbell Row.**
- **Bench Press NEVER matches Dumbbell Bench Press or Incline Bench Press.**
- **Resistance Band NEVER matches Barbell, Dumbbell, or Cable machines.**

---

## 4. Verification in Three Dimensions

Every asset is tracked across three independent dimensions:

```ts
verification: {
  identity: 'verified' | 'unverified';
  rights: 'verified' | 'unverified' | 'restricted';
  asset: 'verified' | 'broken';
}
```

- **Identity Verification**: Confirms the movement depicted accurately matches the canonical exercise form.
- **Rights Verification**: Confirms legal redistribution rights (e.g. Unlicense public domain release or CC-BY-4.0). Third-party scraped media is classified as `unverified` or `restricted`.
- **Asset Verification**: Confirms the file exists locally, loads without errors, and has a matching SHA-256 hash.

---

## 5. Media Approval Lifecycle

```
DISCOVERED
    │
    ▼
MATCHED (Deterministic Signature)
    │
    ▼
IDENTITY VERIFIED (Correct biomechanical movement)
    │
    ▼
RIGHTS VERIFIED (Unlicense / CC-BY-4.0 / explicit permission)
    │
    ▼
ASSET VERIFIED (SHA-256 recorded, valid geometry)
    │
    ▼
 APPROVED ───────────────► BUNDLE IN PRODUCTION (public/exercises/{slug}/)
    │
    ▼ REJECTED / UNVERIFIED
REFERENCE ONLY (Never bundled; ignored by production resolver)
```

Only **APPROVED** media is attached to canonical production exercises.

---

## 6. How to Run the Import Command

To execute the reproducible import pipeline:

```bash
# Execute reproducible media import script (using Node native type-stripping)
node --experimental-strip-types scripts/import-exercise-media.ts
```

### Pipeline Flow:
1. Clones/reads pinned external repository trees in `scratch/`.
2. Matches external exercise records to Replyf canonical exercises.
3. Copies approved public-domain image pairs (`0.jpg`, `1.jpg`) into `public/exercises/{slug}/`.
4. Computes SHA-256 asset hashes for tamper prevention.
5. Writes the import audit log to `public/exercises/manifest.json`.
6. Attaches verified media records with complete provenance to `lib/data/canonical-exercises.ts`.

---

## 7. Generated Output

The import pipeline generates:
1. **Local Assets**: `public/exercises/{slug}/0.jpg` and optional `1.jpg`.
2. **Manifest**: `public/exercises/manifest.json` recording `sourceCommit`, `sourcePath`, `assetHash`, and `generatedAt`.
3. **Canonical Catalog Updates**: Verified media records attached to `CANONICAL_EXERCISES` in `lib/data/canonical-exercises.ts`.

---

## 8. Fallback Behavior & Offline-First Strategy

If an exercise does not have an approved demonstration:
- **No generic movement placeholders** ("SQUAT PATTERN", "PUSH PATTERN", etc.) are ever displayed.
- The canonical `ExerciseMedia` component displays a **neutral, polished fallback**:
  - Aspect ratio: fixed `4:3` (zero CLS).
  - Clean dumbbell icon.
  - "Exercise demonstration unavailable" label.
  - Primary target muscles and equipment tags.
- The fallback is a legitimate, first-class catalog state, not an error screen.
- All exercise instructions, form cues, and metadata remain 100% functional offline without internet access.
