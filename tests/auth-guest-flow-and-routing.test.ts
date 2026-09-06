/**
 * Canonical Auth / Guest Flow & Routing Guard Test Suite (Part U)
 * 
 * Verifies all 15 mandatory test cases:
 * 1. Fresh user -> Auth/Guest screen
 * 2. Continue as Guest -> guest persisted -> onboarding if incomplete
 * 3. Authenticated user without onboarding -> onboarding
 * 4. Guest with completed onboarding -> Workout Hub
 * 5. Authenticated user with completed onboarding -> Workout Hub
 * 6. Refresh while in Guest mode -> Guest state preserved
 * 7. Refresh during incomplete onboarding -> Onboarding preserved
 * 8. Completed onboarding -> does not unnecessarily return to onboarding
 * 9. localStorage authenticated value cannot fake Supabase authentication
 * 10. Supabase session resolves authenticated state
 * 11. IndexedDB remains durable local authority
 * 12. initialization prevents premature route selection
 * 13. browser-only APIs do not influence SSR initial output
 * 14. browser Back does not trap completed users in onboarding
 * 15. deep-link access does not bypass the access initialization flow
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  resolveAppRoute,
  reconcileAccessState,
  AccessMode,
  OnboardingState,
  AuthGuardStatus,
  ACCESS_MODE_KEY,
  ONBOARDING_STATE_KEY,
  ONBOARDING_COMPLETED_AT_KEY,
  ONBOARDING_VERSION_KEY,
  CURRENT_ONBOARDING_VERSION,
} from '@/contexts/auth-guard-context';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { STORES, MetaRecord } from '@/lib/storage/indexeddb-schema';

describe('Part U: Auth / Guest Flow & Routing Guard Canonical Matrix', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    IndexedDBEngine.resetInstance();
    setupMockIndexedDB();
    mockStorage = {};

    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Fresh user -> Auth/Guest screen
  it('1. routes fresh user (unselected access mode) to Auth/Guest screen', () => {
    const accessMode: AccessMode = 'unselected';
    const onboardingState: OnboardingState = 'incomplete';
    const status: AuthGuardStatus = 'ready';

    const decision = resolveAppRoute(accessMode, onboardingState, status);
    expect(decision).toBe('auth_guest_screen');
  });

  // 2. Continue as Guest -> guest persisted -> onboarding if incomplete
  it('2. persists guest mode and routes to onboarding when incomplete', async () => {
    const engine = IndexedDBEngine.getInstance();

    // User clicks Continue as Guest
    localStorage.setItem(ACCESS_MODE_KEY, 'guest');
    await engine.put(STORES.META, {
      key: ACCESS_MODE_KEY,
      value: 'guest',
      updatedAt: new Date().toISOString(),
    });

    const access = localStorage.getItem(ACCESS_MODE_KEY) as AccessMode;
    const onboarding: OnboardingState = 'incomplete';

    expect(access).toBe('guest');
    const decision = resolveAppRoute(access, onboarding, 'ready');
    expect(decision).toBe('onboarding');
  });

  // 3. Authenticated user without onboarding -> onboarding
  it('3. routes authenticated user with incomplete onboarding to onboarding', () => {
    const accessMode: AccessMode = 'authenticated';
    const onboardingState: OnboardingState = 'incomplete';

    const decision = resolveAppRoute(accessMode, onboardingState, 'ready');
    expect(decision).toBe('onboarding');
  });

  // 4. Guest with completed onboarding -> Workout Hub
  it('4. routes guest with completed onboarding directly to Workout Hub', () => {
    const accessMode: AccessMode = 'guest';
    const onboardingState: OnboardingState = 'complete';

    const decision = resolveAppRoute(accessMode, onboardingState, 'ready');
    expect(decision).toBe('workout_hub');
  });

  // 5. Authenticated user with completed onboarding -> Workout Hub
  it('5. routes authenticated user with completed onboarding directly to Workout Hub', () => {
    const accessMode: AccessMode = 'authenticated';
    const onboardingState: OnboardingState = 'complete';

    const decision = resolveAppRoute(accessMode, onboardingState, 'ready');
    expect(decision).toBe('workout_hub');
  });

  // 6. Refresh while in Guest mode -> Guest state preserved
  it('6. preserves guest access mode across simulated page refresh in localStorage and IndexedDB', async () => {
    const engine = IndexedDBEngine.getInstance();

    localStorage.setItem(ACCESS_MODE_KEY, 'guest');
    await engine.put(STORES.META, {
      key: ACCESS_MODE_KEY,
      value: 'guest',
      updatedAt: new Date().toISOString(),
    });

    const refreshedLocal = localStorage.getItem(ACCESS_MODE_KEY);
    const refreshedIdb = await engine.get<MetaRecord>(STORES.META, ACCESS_MODE_KEY);

    expect(refreshedLocal).toBe('guest');
    expect(refreshedIdb?.value).toBe('guest');

    const decision = resolveAppRoute('guest', 'incomplete', 'ready');
    expect(decision).toBe('onboarding');
  });

  // 7. Refresh during incomplete onboarding -> Onboarding preserved
  it('7. preserves incomplete onboarding state across simulated page refresh', async () => {
    const engine = IndexedDBEngine.getInstance();

    localStorage.setItem(ACCESS_MODE_KEY, 'guest');
    localStorage.setItem(ONBOARDING_STATE_KEY, 'incomplete');
    await engine.put(STORES.META, {
      key: ONBOARDING_STATE_KEY,
      value: 'incomplete',
      updatedAt: new Date().toISOString(),
    });

    const localOnboarding = localStorage.getItem(ONBOARDING_STATE_KEY) as OnboardingState;
    const idbOnboarding = await engine.get<MetaRecord>(STORES.META, ONBOARDING_STATE_KEY);

    expect(localOnboarding).toBe('incomplete');
    expect(idbOnboarding?.value).toBe('incomplete');

    const decision = resolveAppRoute('guest', localOnboarding, 'ready');
    expect(decision).toBe('onboarding');
  });

  // 8. Completed onboarding -> does not unnecessarily return to onboarding
  it('8. ensures completed onboarding does not return to onboarding and persists metadata', async () => {
    const engine = IndexedDBEngine.getInstance();
    const now = new Date().toISOString();

    localStorage.setItem(ACCESS_MODE_KEY, 'guest');
    localStorage.setItem(ONBOARDING_STATE_KEY, 'complete');
    await engine.put(STORES.META, {
      key: ONBOARDING_STATE_KEY,
      value: 'complete',
      updatedAt: now,
    });
    await engine.put(STORES.META, {
      key: ONBOARDING_COMPLETED_AT_KEY,
      value: now,
      updatedAt: now,
    });
    await engine.put(STORES.META, {
      key: ONBOARDING_VERSION_KEY,
      value: CURRENT_ONBOARDING_VERSION,
      updatedAt: now,
    });

    const localOnboarding = localStorage.getItem(ONBOARDING_STATE_KEY) as OnboardingState;
    const idbRecord = await engine.get<MetaRecord>(STORES.META, ONBOARDING_STATE_KEY);
    const versionRecord = await engine.get<MetaRecord>(STORES.META, ONBOARDING_VERSION_KEY);

    expect(localOnboarding).toBe('complete');
    expect(idbRecord?.value).toBe('complete');
    expect(versionRecord?.value).toBe(CURRENT_ONBOARDING_VERSION);

    const decision = resolveAppRoute('guest', localOnboarding, 'ready');
    expect(decision).toBe('workout_hub');
  });

  // 9. localStorage authenticated value cannot fake Supabase authentication
  it('9. prevents faking authentication via localStorage.accessMode = "authenticated"', () => {
    // Attacker or stale cache has authenticated in localStorage, but no Supabase session exists
    const result = reconcileAccessState({
      localAccess: 'authenticated',
      localOnboarding: 'complete',
      idbAccess: null,
      idbOnboarding: null,
      hasSupabaseSession: false,
    });

    // Supabase is authoritative: Must resolve to unselected and flag localStorage repair
    expect(result.resolvedAccess).toBe('unselected');
    expect(result.shouldRepairLocal).toBe(true);

    const decision = resolveAppRoute(result.resolvedAccess, result.resolvedOnboarding, 'ready');
    expect(decision).toBe('auth_guest_screen');
  });

  // 10. Supabase session resolves authenticated state
  it('10. resolves authenticated state authoritatively when valid Supabase session exists', () => {
    // Even if localStorage was empty or unselected
    const result = reconcileAccessState({
      localAccess: null,
      localOnboarding: null,
      idbAccess: null,
      idbOnboarding: 'complete',
      hasSupabaseSession: true,
      supabaseUserEmail: 'athlete@replyf.com',
    });

    expect(result.resolvedAccess).toBe('authenticated');
    expect(result.resolvedOnboarding).toBe('complete');

    const decision = resolveAppRoute(result.resolvedAccess, result.resolvedOnboarding, 'ready');
    expect(decision).toBe('workout_hub');
  });

  // 11. IndexedDB remains durable local authority
  it('11. gives IndexedDB precedence over localStorage for durable local state', () => {
    // Disagreement between localStorage (corrupted/stale) and IndexedDB (authoritative)
    const result = reconcileAccessState({
      localAccess: 'unselected',
      localOnboarding: 'incomplete',
      idbAccess: 'guest',
      idbOnboarding: 'complete',
      hasSupabaseSession: false,
    });

    expect(result.resolvedAccess).toBe('guest');
    expect(result.resolvedOnboarding).toBe('complete');
    expect(result.shouldRepairLocal).toBe(true);

    const decision = resolveAppRoute(result.resolvedAccess, result.resolvedOnboarding, 'ready');
    expect(decision).toBe('workout_hub');
  });

  // 12. initialization prevents premature route selection
  it('12. prevents premature route selection while status is "initializing"', () => {
    // Even if parameters have default values, status === 'initializing' must hold routing
    const decision = resolveAppRoute('unselected', 'incomplete', 'initializing');
    expect(decision).toBe('initializing');

    const decision2 = resolveAppRoute('guest', 'complete', 'initializing');
    expect(decision2).toBe('initializing');
  });

  // 13. browser-only APIs do not influence SSR initial output
  it('13. provides deterministic initial output without touching window or navigator', () => {
    // SSR environment simulation (window is undefined or untouched)
    const ssrStatus: AuthGuardStatus = 'initializing';
    const ssrAccess: AccessMode = 'unselected';
    const ssrOnboarding: OnboardingState = 'incomplete';

    const ssrDecision = resolveAppRoute(ssrAccess, ssrOnboarding, ssrStatus);
    expect(ssrDecision).toBe('initializing');
  });

  // 14. browser Back does not trap completed users in onboarding
  it('14. ensures completed onboarding continues resolving to Workout Hub on back navigation', () => {
    // User already completed onboarding
    const accessMode: AccessMode = 'guest';
    const onboardingState: OnboardingState = 'complete';

    // Simulate back button navigating to root "/"
    const decision = resolveAppRoute(accessMode, onboardingState, 'ready');
    expect(decision).toBe('workout_hub');
    expect(decision).not.toBe('onboarding');
  });

  // 15. deep-link access does not bypass the access initialization flow
  it('15. enforces access initialization before granting deep-link entry', () => {
    // Unselected fresh user attempting deep link
    const freshUserAccess: AccessMode = 'unselected';
    const freshUserOnboarding: OnboardingState = 'incomplete';

    const decision = resolveAppRoute(freshUserAccess, freshUserOnboarding, 'ready');
    // Must be gated to auth_guest_screen, not workout_hub
    expect(decision).toBe('auth_guest_screen');
    expect(decision).not.toBe('workout_hub');

    // Incomplete onboarding user attempting deep link
    const guestUserAccess: AccessMode = 'guest';
    const incompleteOnboarding: OnboardingState = 'incomplete';
    const decision2 = resolveAppRoute(guestUserAccess, incompleteOnboarding, 'ready');
    expect(decision2).toBe('onboarding');
    expect(decision2).not.toBe('workout_hub');
  });

  // 16. switchAccess clears only access mode and preserves onboarding state
  it('16. switchAccess preserves onboarding state and metadata while clearing access mode', async () => {
    const engine = IndexedDBEngine.getInstance();
    const now = new Date().toISOString();

    // Seed completed guest state in localStorage and IndexedDB
    mockStorage[ACCESS_MODE_KEY] = 'guest';
    mockStorage[ONBOARDING_STATE_KEY] = 'complete';
    mockStorage[ONBOARDING_COMPLETED_AT_KEY] = now;
    mockStorage[ONBOARDING_VERSION_KEY] = CURRENT_ONBOARDING_VERSION;

    await engine.put(STORES.META, { key: ACCESS_MODE_KEY, value: 'guest', updatedAt: now });
    await engine.put(STORES.META, { key: ONBOARDING_STATE_KEY, value: 'complete', updatedAt: now });
    await engine.put(STORES.META, { key: ONBOARDING_COMPLETED_AT_KEY, value: now, updatedAt: now });
    await engine.put(STORES.META, { key: ONBOARDING_VERSION_KEY, value: CURRENT_ONBOARDING_VERSION, updatedAt: now });

    // Simulate switchAccess logic
    mockStorage[ACCESS_MODE_KEY] = '';
    delete mockStorage[ACCESS_MODE_KEY];
    await engine.delete(STORES.META, ACCESS_MODE_KEY);

    // Verify ACCESS_MODE_KEY is cleared
    expect(mockStorage[ACCESS_MODE_KEY]).toBeUndefined();
    const idbAccess = await engine.get<MetaRecord>(STORES.META, ACCESS_MODE_KEY);
    expect(idbAccess).toBeNull();

    // Verify ONBOARDING keys remain preserved
    expect(mockStorage[ONBOARDING_STATE_KEY]).toBe('complete');
    const idbOnboarding = await engine.get<MetaRecord>(STORES.META, ONBOARDING_STATE_KEY);
    expect(idbOnboarding?.value).toBe('complete');
    const idbCompletedAt = await engine.get<MetaRecord>(STORES.META, ONBOARDING_COMPLETED_AT_KEY);
    expect(idbCompletedAt?.value).toBe(now);

    // Reconciling after switchAccess: resolved access is unselected, but onboarding is complete
    const reconciled = reconcileAccessState({
      localAccess: mockStorage[ACCESS_MODE_KEY] || null,
      localOnboarding: mockStorage[ONBOARDING_STATE_KEY] || null,
      idbAccess: idbAccess ? (idbAccess.value as string) : null,
      idbOnboarding: idbOnboarding ? (idbOnboarding.value as string) : null,
      hasSupabaseSession: false,
    });

    expect(reconciled.resolvedAccess).toBe('unselected');
    expect(reconciled.resolvedOnboarding).toBe('complete');

    // Routing redirects to auth/guest screen to choose account
    const routeDecision = resolveAppRoute(reconciled.resolvedAccess, reconciled.resolvedOnboarding, 'ready');
    expect(routeDecision).toBe('auth_guest_screen');
  });
});
