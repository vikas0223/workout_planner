/**
 * Phase 2F: Exercise Catalog Validation Tests
 */

import { describe, it, expect } from 'vitest';
import { CANONICAL_EXERCISES } from '@/lib/data/canonical-exercises';
import { validateExerciseCatalog } from '@/lib/data/validate-catalog';
import { ExerciseCatalog } from '@/lib/data/exercise-catalog';

describe('Phase 2F: Canonical Exercise Catalog Validation', () => {
  it('validates canonical catalog passes quality checks with zero errors', () => {
    const report = validateExerciseCatalog(CANONICAL_EXERCISES);
    if (!report.isValid) {
      console.error('Validation errors:', report.issues.filter((i) => i.type === 'error'));
    }
    expect(report.isValid).toBe(true);
    expect(report.errorCount).toBe(0);
    expect(report.totalExercises).toBeGreaterThanOrEqual(150);
  });

  it('ensures all exercise IDs are unique', () => {
    const ids = CANONICAL_EXERCISES.map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('ensures all exercise slugs are unique and URL-safe', () => {
    const slugs = CANONICAL_EXERCISES.map((e) => e.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);

    for (const slug of slugs) {
      expect(slug).toBeDefined();
      expect(/^[a-z0-9-]+$/.test(slug!)).toBe(true);
    }
  });

  it('validates difficulty is beginner, intermediate, or advanced', () => {
    const valid = new Set(['beginner', 'intermediate', 'advanced']);
    for (const ex of CANONICAL_EXERCISES) {
      expect(valid.has(ex.difficulty.toLowerCase())).toBe(true);
    }
  });

  it('validates every alternative references an existing exercise in the catalog', () => {
    const idSet = new Set(CANONICAL_EXERCISES.map((e) => e.id));
    for (const ex of CANONICAL_EXERCISES) {
      if (ex.alternatives && ex.alternatives.length > 0) {
        for (const alt of ex.alternatives) {
          const altId = typeof alt === 'string' ? alt : alt.alternativeExerciseId;
          expect(idSet.has(altId), `Broken alternative ${altId} on ${ex.name}`).toBe(true);
        }
      }
    }
  });

  it('ensures provenance & licensing metadata is present on all records', () => {
    for (const ex of CANONICAL_EXERCISES) {
      expect(ex.provenance).toBeDefined();
      expect(ex.provenance?.license).toBeDefined();
      expect(ex.provenance?.attribution).toBeDefined();
      expect(ex.provenance?.commercialUseAllowed).toBe(true);
    }
  });

  it('ensures catalog version is consistent', () => {
    expect(ExerciseCatalog.getCatalogVersion()).toBe('1.0.0');
    for (const ex of CANONICAL_EXERCISES) {
      expect(ex.catalogVersion).toBe('1.0.0');
    }
  });
});
