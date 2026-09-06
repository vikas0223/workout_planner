# Third-Party Notices and Licensing Information

This document details third-party code, data, and asset attributions incorporated into or referenced by Replyf.

---

## 1. MuscleMap

- **Repository**: [https://github.com/melihcolpan/MuscleMap.git](https://github.com/melihcolpan/MuscleMap.git)
- **Author**: Melih Colpan
- **License**: MIT License
- **Usage in Replyf**:
  - Anatomy presentation geometry and body silhouette vector coordinate mapping
  - Interactive muscle highlighting (anterior/posterior, bilateral selection)
  - Muscle volume heatmap visualization
- **Domain Authority**:
  - Replyf's canonical anatomy definitions (`lib/anatomy/anatomy-definitions.ts`) remain the canonical application authority. MuscleMap is utilized strictly for presentation geometry and display ID translation.

### MIT License Text (MuscleMap)

```
MIT License

Copyright (c) 2023 Melih Colpan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 2. exercises-dataset

- **Repository**: [https://github.com/hasaneyldrm/exercises-dataset.git](https://github.com/hasaneyldrm/exercises-dataset.git)
- **Author**: Hasan Yıldırım
- **Total Records**: 1,324 exercise definitions
- **Usage in Replyf**: Reference taxonomy mapping for exercise identification, naming conventions, primary/secondary muscle targets, equipment categories, and movement instructions.

### IMPORTANT: Strict License Separation

The `exercises-dataset` repository contains two distinct categories of content subject to different legal terms:

### A. Dataset Metadata & Code
- **License**: MIT License
- **Scope**: Exercise names, equipment categories, muscle target metadata, instructions, and schemas.
- **Permitted Use in Replyf**: Used as a source reference and deterministic mapping dictionary (`lib/data/exercise-dataset-mapping.ts`).

### B. Exercise Demonstration Media (Images & GIFs)
- **Copyright**: © Gym visual
- **Terms**: Distributed within `hasaneyldrm/exercises-dataset` under specific permission.
- **CRITICAL NOTICE**:
  - **The exercise images and GIFs are NOT licensed under MIT.**
  - Replyf does NOT claim Gym visual media as MIT-licensed.
  - Replyf does NOT bundle or redistribute Gym visual GIFs in `public/` assets without independent verification of redistributable commercial licensing.
  - Replyf does NOT perform derivative transformations (tracing, recoloring, frame extraction) as a license bypass.
  - Where third-party media is referenced externally, provenance retains `source: 'Gym visual via hasaneyldrm/exercises-dataset'` with `commercialUseAllowed: false`.

---

## 3. Replyf In-House Artwork & Demonstrations

- **Author**: Replyf Design & Engineering Team
- **Location**: `public/images/exercises/*.svg`
- **License**: Project-Owned / Creative Commons Attribution 4.0 International (CC-BY-4.0)
- **Scope**: Original, high-fidelity SVG vector demonstrations with anatomical muscle highlighting, motion vectors, and equipment geometry for core movements (Abductor Machine, Adductor Machine, Ankle Rotations, Barbell Back Squat, Bench Press, Deadlift, Pull-Ups, Overhead Press, Barbell Rows, Dips, Lunges, Push-Ups, Lat Pulldown, Incline Dumbbell Press, Dumbbell Press, Bicep Curls, Tricep Extensions, etc.).
- **Commercial Use**: Permitted (`commercialUseAllowed: true`).
