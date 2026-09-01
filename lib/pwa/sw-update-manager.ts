/**
 * Service Worker Update Manager
 * 
 * Manages the user-controlled service worker update lifecycle.
 * 
 * Flow:
 * 1. New SW detected → waiting
 * 2. Notify application → show update banner
 * 3. User clicks Reload
 * 4. Check for active workout session
 * 5. If active workout: warn user to finish first
 * 6. Send SKIP_WAITING to waiting SW
 * 7. Wait for controllerchange
 * 8. Reload page
 * 
 * NEVER destroys IndexedDB, active workout, sync queue, or preferences.
 */

import { getIndexedDBEngine } from '../storage/indexeddb-engine';
import { STORES } from '../storage/indexeddb-schema';

export interface UpdateState {
  hasUpdate: boolean;
  isApplying: boolean;
  hasActiveWorkout: boolean;
}

/**
 * Checks whether there is an active (non-completed) workout session in IndexedDB.
 */
export async function hasActiveWorkoutSession(): Promise<boolean> {
  try {
    const db = getIndexedDBEngine();
    const sessions = await db.getAll(STORES.WORKOUT_SESSIONS);
    return sessions.some(
      (s: any) => s.status === 'active' || s.status === 'planned'
    );
  } catch {
    // If IndexedDB is unavailable, err on the side of caution
    return false;
  }
}

/**
 * Applies a waiting service worker update with user control.
 * 
 * @param registration - The SW registration with a waiting worker
 * @param force - If true, skips the active workout check (user explicitly confirmed)
 * @returns true if update was applied, false if blocked
 */
export async function applyUpdate(
  registration: ServiceWorkerRegistration,
  force = false
): Promise<{ applied: boolean; blockedByWorkout: boolean }> {
  if (!registration.waiting) {
    return { applied: false, blockedByWorkout: false };
  }

  // Check for active workout unless force is true
  if (!force) {
    const hasWorkout = await hasActiveWorkoutSession();
    if (hasWorkout) {
      return { applied: false, blockedByWorkout: true };
    }
  }

  return new Promise((resolve) => {
    // Listen for the new controller
    const onControllerChange = () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      // Reload safely after new SW takes control
      window.location.reload();
      resolve({ applied: true, blockedByWorkout: false });
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    // Tell the waiting SW to activate
    registration.waiting!.postMessage({ type: 'SKIP_WAITING' });
  });
}
