/**
 * Legacy Storage Test Fixtures
 * Provides normal, empty, malformed, duplicate, and missing-ID shapes for migration testing.
 */

export const LEGACY_STORAGE_FIXTURES = {
  NORMAL: {
    userProfile: {
      id: 'usr_normal_1',
      name: 'Jordan Rivera',
      gender: 'male',
      age: 28,
      weight: 75,
      fitnessLevel: 'intermediate',
      primaryGoal: 'muscle_gain',
      preferredEquipment: ['Dumbbells', 'Barbell'],
      preferredMuscleGroups: ['Chest', 'Back'],
      completedWorkouts: 12,
      ratings: [{ workoutPlanId: 'p1', rating: 5, feedback: 'Great workout', timestamp: 1690000000 }],
    },
    returningUsers: ['Jordan Rivera', 'Sam Taylor'],
    savedWorkoutPlans: [
      {
        id: 'plan_1680000000',
        name: 'Upper Body Hypertrophy',
        goal: 'muscle_gain',
        difficulty: 'intermediate',
        duration: 45,
        targetMuscles: ['Chest', 'Triceps'],
        equipment: ['Dumbbells'],
        exercises: [
          { name: 'Dumbbell Bench Press', sets: 4, reps: '8-10', rest: '90s', targetMuscles: ['Chest'] },
          { name: 'Tricep Pushdown', sets: 3, reps: '12-15', rest: '60s', targetMuscles: ['Triceps'] },
        ],
        isFavorite: true,
      },
    ],
    completedExercises: [
      {
        id: 'comp_1680000000',
        workoutPlanId: 'plan_1680000000',
        name: 'Completed Upper Body',
        date: '2026-08-20T10:00:00.000Z',
        duration: 45,
        caloriesBurned: 320,
        exercises: [{ name: 'Dumbbell Bench Press', sets: 4, reps: '10' }],
      },
    ],
    favoriteExercises: ['Dumbbell Bench Press', 'Pull Up', 'Squat'],
  },

  EMPTY: {
    userProfile: null,
    returningUsers: [],
    savedWorkoutPlans: [],
    completedExercises: [],
    favoriteExercises: [],
  },

  MALFORMED: {
    userProfile: '{unparseable-json',
    returningUsers: 'not-an-array',
    savedWorkoutPlans: '[{"id": 123, "exercises": "invalid-exercise-array"}]',
    completedExercises: '[null, undefined, 42]',
    favoriteExercises: '{notAnArray: true}',
  },

  DUPLICATE_AND_MISSING_IDS: {
    userProfile: {
      name: 'Duplicate Tester',
      fitnessLevel: 'beginner',
    },
    returningUsers: ['Duplicate Tester', 'Duplicate Tester', '   '],
    savedWorkoutPlans: [
      { name: 'No ID Plan 1', duration: 30, exercises: [] },
      { name: 'No ID Plan 1', duration: 30, exercises: [] }, // duplicate name/shape
      { id: '', name: 'Empty String ID Plan', duration: 25 },
    ],
    completedExercises: [
      { name: 'No ID Session', duration: 20, exercises: [] },
      { id: 'custom-session-1', name: 'Session with ID', exercises: [] },
    ],
    favoriteExercises: ['Push Up', 'Push Up', 'Push Up'], // duplicate favorites
  },
};
