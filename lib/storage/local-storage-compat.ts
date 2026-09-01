/**
 * LocalStorage Compatibility Layer
 * Documents and safely accesses legacy storage keys.
 */

export const LEGACY_STORAGE_KEYS = {
  USER_PROFILE: 'userProfile',
  SAVED_WORKOUT_PLANS: 'savedWorkoutPlans',
  RETURNING_USERS: 'returningUsers',
  COMPLETED_EXERCISES: 'completedExercises',
  SAVED_WORKOUTS: 'savedWorkouts',
  FAVORITE_EXERCISES: 'favoriteExercises',
  FAVORITE_WORKOUTS: 'favoriteWorkouts',
  WORKOUT_APP_USER_ID: 'workoutAppUserId',
  WORKOUT_APP_USER_NAME: 'workoutAppUserName',
} as const;

export class LocalStorageCompat {
  public static getItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  public static setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`[LocalStorageCompat] Failed to write key ${key}`, err);
    }
  }

  public static removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch (err) {
      console.warn(`[LocalStorageCompat] Failed to remove key ${key}`, err);
    }
  }
}
