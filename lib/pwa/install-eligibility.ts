/**
 * PWA Install Eligibility Service
 * 
 * Single configurable service that determines when to show the install CTA.
 * Tracks engagement signals in IndexedDB meta store.
 * 
 * Policy:
 * - Show install CTA after first completed workout OR after N meaningful visits
 * - Do not show if dismissed within cooldown period
 * - Do not show if already installed
 * - Do not show if running in standalone mode
 * 
 * "Meaningful visit" = session-level (one per browser session, not per component mount).
 */

import { getIndexedDBEngine } from '../storage/indexeddb-engine';
import { STORES, MetaRecord } from '../storage/indexeddb-schema';

// ─── Configuration ───────────────────────────────────────────────
export const INSTALL_CONFIG = {
  /** Number of meaningful visits before showing install CTA */
  visitThreshold: 3,
  /** Cooldown period (ms) after dismissal before showing again */
  dismissCooldownMs: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

// ─── Session Tracking ────────────────────────────────────────────

// Tracks whether the current browser session has already been counted
let sessionCounted = false;

/**
 * Records a meaningful app visit (once per browser session).
 * Uses a module-level flag to avoid counting multiple React mounts.
 */
export async function recordVisit(): Promise<void> {
  if (sessionCounted) return;
  sessionCounted = true;

  try {
    const db = getIndexedDBEngine();
    const existing = await db.get<MetaRecord>(STORES.META, 'pwa_visit_count');
    const currentCount = typeof existing?.value === 'number' ? existing.value : 0;
    await db.put<MetaRecord>(STORES.META, {
      key: 'pwa_visit_count',
      value: currentCount + 1,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    // Silently fail — not critical
  }
}

/**
 * Records that the user has completed their first workout.
 */
export async function recordFirstWorkoutCompleted(): Promise<void> {
  try {
    const db = getIndexedDBEngine();
    await db.put<MetaRecord>(STORES.META, {
      key: 'pwa_first_workout_completed',
      value: true,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    // Silently fail
  }
}

/**
 * Records that the user dismissed the install CTA.
 */
export async function recordInstallDismissed(): Promise<void> {
  try {
    const db = getIndexedDBEngine();
    await db.put<MetaRecord>(STORES.META, {
      key: 'pwa_install_dismissed_at',
      value: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch {
    // Silently fail
  }
}

/**
 * Records that the app has been installed.
 */
export async function recordInstalled(): Promise<void> {
  try {
    const db = getIndexedDBEngine();
    await db.put<MetaRecord>(STORES.META, {
      key: 'pwa_installed',
      value: true,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    // Silently fail
  }
}

/**
 * Records that first-time onboarding message has been shown.
 */
export async function recordOnboardingShown(): Promise<void> {
  try {
    const db = getIndexedDBEngine();
    await db.put<MetaRecord>(STORES.META, {
      key: 'pwa_onboarding_shown',
      value: true,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    // Silently fail
  }
}

/**
 * Checks whether the first-time onboarding message should be shown.
 */
export async function shouldShowOnboarding(): Promise<boolean> {
  try {
    const db = getIndexedDBEngine();
    const shown = await db.get<MetaRecord>(STORES.META, 'pwa_onboarding_shown');
    return !shown?.value;
  } catch {
    return false;
  }
}

// ─── Eligibility Check ──────────────────────────────────────────

export interface EligibilityResult {
  eligible: boolean;
  reason: string;
}

/**
 * Determines whether the install CTA should be shown.
 */
export async function checkInstallEligibility(): Promise<EligibilityResult> {
  // 1. Already running in standalone mode?
  if (isStandaloneMode()) {
    return { eligible: false, reason: 'standalone_mode' };
  }

  try {
    const db = getIndexedDBEngine();

    // 2. Already installed?
    const installed = await db.get<MetaRecord>(STORES.META, 'pwa_installed');
    if (installed?.value === true) {
      return { eligible: false, reason: 'already_installed' };
    }

    // 3. Dismissed recently?
    const dismissedAt = await db.get<MetaRecord>(STORES.META, 'pwa_install_dismissed_at');
    if (dismissedAt && typeof dismissedAt.value === 'string') {
      const dismissedTime = new Date(dismissedAt.value).getTime();
      const now = Date.now();
      if (now - dismissedTime < INSTALL_CONFIG.dismissCooldownMs) {
        return { eligible: false, reason: 'recently_dismissed' };
      }
    }

    // 4. First workout completed? → eligible
    const firstWorkout = await db.get<MetaRecord>(STORES.META, 'pwa_first_workout_completed');
    if (firstWorkout?.value === true) {
      return { eligible: true, reason: 'first_workout_completed' };
    }

    // 5. Enough meaningful visits? → eligible
    const visitCount = await db.get<MetaRecord>(STORES.META, 'pwa_visit_count');
    if (typeof visitCount?.value === 'number' && visitCount.value >= INSTALL_CONFIG.visitThreshold) {
      return { eligible: true, reason: 'visit_threshold_reached' };
    }

    return { eligible: false, reason: 'engagement_insufficient' };
  } catch {
    return { eligible: false, reason: 'error' };
  }
}

/**
 * Checks if the app is running in standalone/installed PWA mode.
 */
export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;

  // Check display-mode media query
  if (window.matchMedia('(display-mode: standalone)').matches) return true;

  // iOS Safari standalone mode
  if ((navigator as any).standalone === true) return true;

  return false;
}

/**
 * Resets the session tracking flag (for testing).
 */
export function _resetSessionTracking(): void {
  sessionCounted = false;
}
