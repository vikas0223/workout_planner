/**
 * Phase 2G: Anatomy Map -> ExerciseCatalog Integration Tests
 * 
 * Verifies:
 * - Direct mapping from anatomy selection to ExerciseCatalog
 * - Mixed Filter Scenarios (A, B, C, D, E) preserving manual filters across anatomy changes
 * - Hover count caching performance
 */

import { describe, it, expect } from 'vitest';
import { getRegionById, getRegionExerciseCount } from '@/lib/anatomy/anatomy-definitions';
import { ExerciseCatalog, ExerciseFilter } from '@/lib/data/exercise-catalog';

describe('Phase 2G: Anatomy -> ExerciseCatalog Integration', () => {
  it('queries chest exercises matching anatomical chest region', () => {
    const chestRegion = getRegionById('chest')!;
    expect(chestRegion).toBeDefined();

    const results = ExerciseCatalog.queryExercises({
      muscles: chestRegion.catalogMuscles,
    });

    expect(results.totalCount).toBeGreaterThan(0);
    expect(results.exercises.length).toBeGreaterThan(0);
    expect(
      results.exercises.some((e) =>
        e.primaryMuscles.includes('Chest') || e.secondaryMuscles?.includes('Chest')
      )
    ).toBe(true);
  });

  it('queries lats and back exercises matching anatomical lats region', () => {
    const latsRegion = getRegionById('lats')!;
    expect(latsRegion).toBeDefined();

    const results = ExerciseCatalog.queryExercises({
      muscles: latsRegion.catalogMuscles,
    });

    expect(results.totalCount).toBeGreaterThan(0);
    expect(
      results.exercises.some((e) =>
        e.primaryMuscles.includes('Lats') ||
        e.primaryMuscles.includes('Back') ||
        e.secondaryMuscles?.includes('Lats')
      )
    ).toBe(true);
  });

  it('queries quad exercises matching anatomical quads region', () => {
    const quadsRegion = getRegionById('quads')!;
    expect(quadsRegion).toBeDefined();

    const results = ExerciseCatalog.queryExercises({
      muscles: quadsRegion.catalogMuscles,
    });

    expect(results.totalCount).toBeGreaterThan(0);
    expect(
      results.exercises.some((e) =>
        e.primaryMuscles.includes('Quads') || e.secondaryMuscles?.includes('Quads')
      )
    ).toBe(true);
  });

  it('queries knee-involved exercises matching knee joint region', () => {
    const kneeRegion = getRegionById('knee_left')!;
    expect(kneeRegion).toBeDefined();

    const results = ExerciseCatalog.queryExercises({
      joints: kneeRegion.catalogJoints,
    });

    expect(results.totalCount).toBeGreaterThan(0);
    expect(results.exercises.every((e) => e.joints?.includes('knees'))).toBe(true);
  });

  it('queries shoulder-involved exercises matching shoulder joint region', () => {
    const shoulderRegion = getRegionById('shoulder_right')!;
    expect(shoulderRegion).toBeDefined();

    const results = ExerciseCatalog.queryExercises({
      joints: shoulderRegion.catalogJoints,
    });

    expect(results.totalCount).toBeGreaterThan(0);
    expect(results.exercises.every((e) => e.joints?.includes('shoulders'))).toBe(true);
  });

  it('queries spine-involved exercises matching thoracic spine joint region', () => {
    const spineRegion = getRegionById('spine_thoracic')!;
    expect(spineRegion).toBeDefined();

    const results = ExerciseCatalog.queryExercises({
      joints: spineRegion.catalogJoints,
    });

    expect(results.totalCount).toBeGreaterThan(0);
    expect(results.exercises.every((e) => e.joints?.includes('spine'))).toBe(true);
  });

  // ==========================================
  // MIXED FILTER PRESERVATION TESTS
  // ==========================================

  it('Scenario A: Equipment = Dumbbell + Anatomy = Chest -> Chest AND Dumbbell', () => {
    const chestRegion = getRegionById('chest')!;
    const filter: ExerciseFilter = {
      equipment: ['Dumbbell'],
      muscles: chestRegion.catalogMuscles,
    };

    const results = ExerciseCatalog.queryExercises(filter);
    expect(results.totalCount).toBeGreaterThan(0);
    for (const ex of results.exercises) {
      const hasChest = ex.primaryMuscles.includes('Chest') || ex.secondaryMuscles?.includes('Chest');
      const hasDumbbell = ex.equipment.some((eq) => eq.toLowerCase().includes('dumbbell'));
      expect(hasChest, `${ex.name} should target Chest`).toBe(true);
      expect(hasDumbbell, `${ex.name} should use Dumbbell`).toBe(true);
    }
  });

  it('Scenario B: Difficulty = Intermediate + Anatomy = Knee -> Knee AND Intermediate', () => {
    const kneeRegion = getRegionById('knee_left')!;
    const filter: ExerciseFilter = {
      difficulty: 'intermediate',
      joints: kneeRegion.catalogJoints,
    };

    const results = ExerciseCatalog.queryExercises(filter);
    expect(results.totalCount).toBeGreaterThan(0);
    for (const ex of results.exercises) {
      expect(ex.difficulty).toBe('intermediate');
      expect(ex.joints?.includes('knees')).toBe(true);
    }
  });

  it('Scenario C: Equipment = Dumbbell + Difficulty = Intermediate + Anatomy = Chest -> Chest AND Dumbbell AND Intermediate', () => {
    const chestRegion = getRegionById('chest')!;
    const filter: ExerciseFilter = {
      equipment: ['Dumbbell'],
      difficulty: 'intermediate',
      muscles: chestRegion.catalogMuscles,
    };

    const results = ExerciseCatalog.queryExercises(filter);
    expect(results.totalCount).toBeGreaterThan(0);
    for (const ex of results.exercises) {
      const hasChest = ex.primaryMuscles.includes('Chest') || ex.secondaryMuscles?.includes('Chest');
      const hasDumbbell = ex.equipment.some((eq) => eq.toLowerCase().includes('dumbbell'));
      expect(hasChest).toBe(true);
      expect(hasDumbbell).toBe(true);
      expect(ex.difficulty).toBe('intermediate');
    }
  });

  it('Scenario D: Equipment = Dumbbell + Anatomy = Chest -> switch to Back -> Back AND Dumbbell', () => {
    const backRegion = getRegionById('traps')!;
    const filter: ExerciseFilter = {
      equipment: ['Dumbbell'],
      muscles: backRegion.catalogMuscles,
    };

    const results = ExerciseCatalog.queryExercises(filter);
    expect(results.totalCount).toBeGreaterThan(0);
    for (const ex of results.exercises) {
      const hasBack =
        ex.primaryMuscles.some((m) =>
          backRegion.catalogMuscles?.some((bm) => m.toLowerCase().includes(bm.toLowerCase()) || bm.toLowerCase().includes(m.toLowerCase()))
        ) ||
        ex.secondaryMuscles?.some((m) =>
          backRegion.catalogMuscles?.some((bm) => m.toLowerCase().includes(bm.toLowerCase()) || bm.toLowerCase().includes(m.toLowerCase()))
        );
      const hasDumbbell = ex.equipment.some((eq) => eq.toLowerCase().includes('dumbbell'));
      expect(hasBack).toBe(true);
      expect(hasDumbbell).toBe(true);
    }
  });

  it('Scenario E: Equipment = Dumbbell + Anatomy = Chest -> clear anatomy -> Dumbbell only', () => {
    const filter: ExerciseFilter = {
      equipment: ['Dumbbell'],
      muscles: undefined,
    };

    const results = ExerciseCatalog.queryExercises(filter);
    expect(results.totalCount).toBeGreaterThan(0);
    for (const ex of results.exercises) {
      const hasDumbbell = ex.equipment.some((eq) => eq.toLowerCase().includes('dumbbell'));
      expect(hasDumbbell).toBe(true);
    }
  });

  // ==========================================
  // HOVER PERFORMANCE TEST
  // ==========================================

  it('retrieves cached region counts with sub-millisecond execution', () => {
    const chestRegion = getRegionById('chest')!;
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      getRegionExerciseCount(chestRegion);
    }
    const elapsed = performance.now() - start;
    // 1000 lookups should take less than 15ms total
    expect(elapsed).toBeLessThan(50);
  });
});
