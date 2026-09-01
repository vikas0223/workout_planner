import { describe, it, expect } from 'vitest';
import { ExerciseCatalog } from '@/lib/data/exercise-catalog';

describe('ExerciseCatalog Boundary', () => {
  it('lists existing exercises', () => {
    const list = ExerciseCatalog.listExercises();
    expect(list.length).toBeGreaterThan(0);
  });

  it('finds exercises by muscle group', () => {
    const chestExercises = ExerciseCatalog.findExercisesByMuscle('Chest');
    expect(chestExercises.length).toBeGreaterThan(0);
    chestExercises.forEach((ex) => {
      const match = ex.primaryMuscles.some((m) => m.toLowerCase().includes('chest'));
      expect(match).toBe(true);
    });
  });

  it('finds exercises by equipment constraint', () => {
    const dumbbellExercises = ExerciseCatalog.findExercisesByEquipment(['Dumbbells']);
    expect(dumbbellExercises.length).toBeGreaterThan(0);
    dumbbellExercises.forEach((ex) => {
      const allowed = ex.equipment.every(
        (eq) =>
          eq.toLowerCase() === 'dumbbells' ||
          eq.toLowerCase() === 'dumbbell' ||
          eq.toLowerCase() === 'bodyweight'
      );
      expect(allowed).toBe(true);
    });
  });

  it('retrieves exercise by ID or name', () => {
    const list = ExerciseCatalog.listExercises();
    const first = list[0];
    const retrieved = ExerciseCatalog.getExerciseById(first.id);
    expect(retrieved?.name).toBe(first.name);
  });
});
