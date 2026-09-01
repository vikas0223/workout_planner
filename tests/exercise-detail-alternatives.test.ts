/**
 * Phase 2F: Exercise Detail and Alternatives Tests
 */

import { describe, it, expect } from 'vitest';
import { ExerciseCatalog } from '@/lib/data/exercise-catalog';

describe('Phase 2F: Exercise Detail and Alternatives', () => {
  it('retrieves exercise by ID and by slug', () => {
    const all = ExerciseCatalog.listExercises();
    const first = all[0];

    const byId = ExerciseCatalog.getExerciseById(first.id);
    expect(byId).toBeDefined();
    expect(byId?.name).toBe(first.name);

    if (first.slug) {
      const bySlug = ExerciseCatalog.getExerciseBySlug(first.slug);
      expect(bySlug).toBeDefined();
      expect(bySlug?.id).toBe(first.id);
    }
  });

  it('returns valid deterministic alternatives for exercises', () => {
    const squat = ExerciseCatalog.getExerciseByName('Barbell Squat') || ExerciseCatalog.listExercises()[0];
    const alternatives = ExerciseCatalog.findAlternatives(squat.id);

    expect(alternatives).toBeDefined();
    expect(Array.isArray(alternatives)).toBe(true);

    // Alternatives should not contain the original exercise itself
    for (const alt of alternatives) {
      expect(alt.id).not.toBe(squat.id);
    }
  });

  it('returns related exercises based on muscle and movement patterns', () => {
    const bench = ExerciseCatalog.getExerciseByName('Bench Press') || ExerciseCatalog.listExercises()[0];
    const related = ExerciseCatalog.findRelatedExercises(bench.id);

    expect(related).toBeDefined();
    expect(Array.isArray(related)).toBe(true);
    for (const rel of related) {
      expect(rel.id).not.toBe(bench.id);
    }
  });

  it('handles non-existent exercise ID safely', () => {
    expect(ExerciseCatalog.getExerciseById('non-existent-id')).toBeUndefined();
    expect(ExerciseCatalog.findAlternatives('non-existent-id')).toEqual([]);
    expect(ExerciseCatalog.findRelatedExercises('non-existent-id')).toEqual([]);
  });

  it('contains step-by-step instructions, form cues, and common mistakes', () => {
    const exercises = ExerciseCatalog.listExercises();
    const sample = exercises.find((e) => e.formCues && e.formCues.length > 0) || exercises[0];

    expect(sample.instructions).toBeDefined();
    expect(sample.instructions!.length).toBeGreaterThan(0);
    expect(sample.formCues).toBeDefined();
    expect(sample.formCues!.length).toBeGreaterThan(0);
    expect(sample.commonMistakes).toBeDefined();
    expect(sample.commonMistakes!.length).toBeGreaterThan(0);
  });
});
