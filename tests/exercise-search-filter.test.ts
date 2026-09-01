/**
 * Phase 2F: Exercise Search and Multi-Category Filter Tests
 */

import { describe, it, expect } from 'vitest';
import { ExerciseCatalog } from '@/lib/data/exercise-catalog';

describe('Phase 2F: Exercise Search & Filtering', () => {
  it('searches by exact exercise name (case-insensitive)', () => {
    const results = ExerciseCatalog.query({ searchTerm: 'barbell squat' });
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].name.toLowerCase()).toContain('barbell squat');
  });

  it('searches by partial name and movement pattern', () => {
    const results = ExerciseCatalog.query({ searchTerm: 'press' });
    expect(results.length).toBeGreaterThan(1);
    expect(results.some((e) => e.name.toLowerCase().includes('press'))).toBe(true);
  });

  it('searches by muscle term matching name, aliases, or muscles', () => {
    const results = ExerciseCatalog.query({ searchTerm: 'chest' });
    expect(results.length).toBeGreaterThan(1);
    expect(
      results.every(
        (e) =>
          e.name.toLowerCase().includes('chest') ||
          e.aliases?.some((a) => a.toLowerCase().includes('chest')) ||
          e.primaryMuscles.some((m) => m.toLowerCase().includes('chest')) ||
          e.secondaryMuscles?.some((m) => m.toLowerCase().includes('chest'))
      )
    ).toBe(true);
  });

  it('handles empty query gracefully (returns all exercises)', () => {
    const results = ExerciseCatalog.query({});
    expect(results.length).toBe(ExerciseCatalog.listExercises().length);
  });

  it('handles no-match search query gracefully', () => {
    const results = ExerciseCatalog.query({ searchTerm: 'xyznonexistentworkout12345' });
    expect(results.length).toBe(0);
  });

  it('filters by multiple muscles with OR semantics within category', () => {
    const results = ExerciseCatalog.query({ muscles: ['Chest', 'Lats'] });
    expect(results.length).toBeGreaterThan(0);
    for (const ex of results) {
      const hasChest = ex.primaryMuscles.includes('Chest') || ex.secondaryMuscles?.includes('Chest');
      const hasLats = ex.primaryMuscles.includes('Lats') || ex.secondaryMuscles?.includes('Lats');
      expect(hasChest || hasLats).toBe(true);
    }
  });

  it('filters by multiple equipment with OR semantics within category', () => {
    const results = ExerciseCatalog.query({ equipment: ['Dumbbell', 'Kettlebell'] });
    expect(results.length).toBeGreaterThan(0);
    for (const ex of results) {
      const hasDb = ex.equipment.some((eq) => eq.toLowerCase() === 'dumbbell');
      const hasKb = ex.equipment.some((eq) => eq.toLowerCase() === 'kettlebell');
      expect(hasDb || hasKb).toBe(true);
    }
  });

  it('combines muscle AND equipment with AND semantics across categories', () => {
    const results = ExerciseCatalog.query({
      muscles: ['Chest'],
      equipment: ['Dumbbell'],
    });

    expect(results.length).toBeGreaterThan(0);
    for (const ex of results) {
      const hasChest = ex.primaryMuscles.includes('Chest') || ex.secondaryMuscles?.includes('Chest');
      const hasDb = ex.equipment.some((eq) => eq.toLowerCase() === 'dumbbell');
      expect(hasChest).toBe(true);
      expect(hasDb).toBe(true);
    }
  });

  it('filters by difficulty level', () => {
    const beginnerResults = ExerciseCatalog.query({ difficulty: 'beginner' });
    expect(beginnerResults.length).toBeGreaterThan(0);
    for (const ex of beginnerResults) {
      expect(ex.difficulty).toBe('beginner');
    }
  });

  it('filters by movement pattern', () => {
    const pushResults = ExerciseCatalog.query({ movementPatterns: ['push'] });
    expect(pushResults.length).toBeGreaterThan(0);
    for (const ex of pushResults) {
      expect(ex.movementPattern).toBe('push');
    }
  });

  it('sorts exercises by name ascending and descending', () => {
    const asc = ExerciseCatalog.query({ sortBy: 'name-asc' });
    for (let i = 1; i < asc.length; i++) {
      expect(asc[i].name.localeCompare(asc[i - 1].name)).toBeGreaterThanOrEqual(0);
    }

    const desc = ExerciseCatalog.query({ sortBy: 'name-desc' });
    for (let i = 1; i < desc.length; i++) {
      expect(desc[i - 1].name.localeCompare(desc[i].name)).toBeGreaterThanOrEqual(0);
    }
  });

  it('supports pagination via queryPaginated', () => {
    const page1 = ExerciseCatalog.queryPaginated({ limit: 10, offset: 0 });
    expect(page1.exercises.length).toBe(10);
    expect(page1.hasMore).toBe(true);
    expect(page1.totalCount).toBe(ExerciseCatalog.listExercises().length);

    const page2 = ExerciseCatalog.queryPaginated({ limit: 10, offset: 10 });
    expect(page2.exercises.length).toBe(10);
    expect(page2.exercises[0].id).not.toBe(page1.exercises[0].id);
  });
});
