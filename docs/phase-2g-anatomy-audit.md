# Phase 2G — Anatomy Data & Taxonomy Audit Report

Date: 2026-08-25  
Author: Antigravity Agent  
Phase: 2G (Interactive Muscle Map + Joint Map)  
Status: AUDIT COMPLETE

---

## 1. Current Muscle Taxonomy

The canonical dataset contains exercises mapped to the following muscle groups:

### Primary Muscles
- `Chest` (Pectorals, Upper/Lower Chest)
- `Back` / `Upper Back` / `Lats` / `Traps`
- `Shoulders` (Deltoids - Anterior, Lateral, Posterior)
- `Biceps`
- `Triceps`
- `Forearms`
- `Abs` / `Core` / `Obliques`
- `Lower Back` (Erector Spinae)
- `Glutes` (Maximus, Medius)
- `Quads` (Quadriceps)
- `Hamstrings`
- `Calves` (Gastrocnemius, Soleus)

---

## 2. Current Joint Taxonomy

Canonical exercises map to the following functional joint articulations:

- `shoulders` (Glenohumeral / Scapulothoracic joints)
- `elbows` (Humeroulnar / Humeroradial joints)
- `wrists` (Radiocarpal joint)
- `spine` (Cervical, Thoracic, Lumbar spinal columns)
- `hips` (Acetabulofemoral joint)
- `knees` (Tibiofemoral / Patellofemoral joints)
- `ankles` (Talocrural joint)

---

## 3. Anatomy Identifier Strategy

To bridge SVG interactive regions with `ExerciseCatalog`, exactly 40 canonical anatomy region definitions are structured across Front and Back views:

### Muscle Region Identifiers (17 Regions: 8 Front, 9 Back)

| Region ID | Canonical Label | Target View | Associated Muscles in Catalog |
| --- | --- | --- | --- |
| `chest` | Chest / Pectorals | Front | `['Chest']` |
| `front_deltoids` | Front Shoulders | Front | `['Shoulders']` |
| `biceps` | Biceps | Front | `['Biceps']` |
| `forearms_front` | Forearms (Anterior) | Front | `['Forearms']` |
| `abs` | Abdominals / Core | Front | `['Abs', 'Core']` |
| `obliques` | Obliques | Front | `['Obliques', 'Core', 'Abs']` |
| `quads` | Quadriceps | Front | `['Quads']` |
| `calves_front` | Calves (Anterior / Tibialis) | Front | `['Calves']` |
| `traps` | Trapezius / Upper Back | Back | `['Traps', 'Upper Back', 'Back']` |
| `rear_deltoids` | Rear Shoulders | Back | `['Shoulders']` |
| `triceps` | Triceps | Back | `['Triceps']` |
| `forearms_back` | Forearms (Posterior) | Back | `['Forearms']` |
| `lats` | Lats (Latissimus Dorsi) | Back | `['Lats', 'Back']` |
| `lower_back` | Lower Back (Erectors) | Back | `['Lower Back', 'Back']` |
| `glutes` | Glutes | Back | `['Glutes']` |
| `hamstrings` | Hamstrings | Back | `['Hamstrings']` |
| `calves_back` | Calves (Gastrocnemius & Soleus) | Back | `['Calves']` |

### Joint Region Identifiers (23 Articulation Points: 13 Front, 10 Back)

| Joint ID | Label | View | Catalog Joint Query |
| --- | --- | --- | --- |
| `shoulder_left` | Left Shoulder | Front | `['shoulders']` |
| `shoulder_right` | Right Shoulder | Front | `['shoulders']` |
| `elbow_left` | Left Elbow | Front | `['elbows']` |
| `elbow_right` | Right Elbow | Front | `['elbows']` |
| `wrist_left` | Left Wrist | Front | `['wrists']` |
| `wrist_right` | Right Wrist | Front | `['wrists']` |
| `spine_neck` | Cervical Spine / Neck | Front | `['spine']` |
| `hip_left` | Left Hip | Front | `['hips']` |
| `hip_right` | Right Hip | Front | `['hips']` |
| `knee_left` | Left Knee | Front | `['knees']` |
| `knee_right` | Right Knee | Front | `['knees']` |
| `ankle_left` | Left Ankle | Front | `['ankles']` |
| `ankle_right` | Right Ankle | Front | `['ankles']` |
| `spine_thoracic` | Thoracic Spine | Back | `['spine']` |
| `spine_lumbar` | Lumbar Spine | Back | `['spine']` |
| `shoulder_left_back` | Left Scapula / Shoulder | Back | `['shoulders']` |
| `shoulder_right_back` | Right Scapula / Shoulder | Back | `['shoulders']` |
| `elbow_left_back` | Left Elbow (Posterior) | Back | `['elbows']` |
| `elbow_right_back` | Right Elbow (Posterior) | Back | `['elbows']` |
| `knee_left_back` | Left Knee (Popliteal) | Back | `['knees']` |
| `knee_right_back` | Right Knee (Popliteal) | Back | `['knees']` |
| `ankle_left_back` | Left Achilles / Ankle | Back | `['ankles']` |
| `ankle_right_back` | Right Achilles / Ankle | Back | `['ankles']` |

---

## 4. Exercise Relationship Strategy

1. **Selection Flow:**
   - User clicks or keyboard-selects region (`type: 'muscle' | 'joint'`, `id: string`).
   - Region metadata maps `id` to query parameters.
   - For muscles: `ExerciseCatalog.queryExercises({ muscles: regionDef.catalogMuscles })`.
   - For joints: `ExerciseCatalog.queryExercises({ joints: regionDef.catalogJoints })`.
2. **Pure Boundary Integration:**
   - No separate exercise arrays inside anatomy components.
   - `useAnatomySelection` manages view state (`mode`, `sex`, `view`, `selectedRegion`).
   - Selected anatomy filters synchronize seamlessly with the `/exercises` discovery UI.

---

## 5. Asset Strategy & Provenance

- **Source:** Original project vector artwork.
- **Third-party assets:** None.
- **License:** MIT License.
- Clean vector paths with descriptive `data-region-id` and `data-region-type` attributes.
- Centralized styling via CSS variables and Tailwind classes.
- Zero dependencies on copyrighted or scraped diagrams.
