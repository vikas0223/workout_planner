/**
 * Phase 2E: Install Eligibility Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { STORES, MetaRecord } from '@/lib/storage/indexeddb-schema';
import {
  checkInstallEligibility,
  recordVisit,
  recordFirstWorkoutCompleted,
  recordInstallDismissed,
  recordInstalled,
  INSTALL_CONFIG,
  _resetSessionTracking,
} from '@/lib/pwa/install-eligibility';

describe('Phase 2E: Install Eligibility', () => {
  let db: IndexedDBEngine;

  beforeEach(async () => {
    setupMockIndexedDB();
    IndexedDBEngine.resetInstance();
    db = IndexedDBEngine.getInstance();
    _resetSessionTracking();
  });

  it('not eligible on first visit (0 visits, no workout)', async () => {
    const result = await checkInstallEligibility();
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('engagement_insufficient');
  });

  it('eligible after first completed workout', async () => {
    await recordFirstWorkoutCompleted();
    const result = await checkInstallEligibility();
    expect(result.eligible).toBe(true);
    expect(result.reason).toBe('first_workout_completed');
  });

  it('eligible after 3+ meaningful visits', async () => {
    // Simulate 3 separate sessions
    for (let i = 0; i < INSTALL_CONFIG.visitThreshold; i++) {
      _resetSessionTracking(); // Reset so each call counts as a new session
      await recordVisit();
    }

    const result = await checkInstallEligibility();
    expect(result.eligible).toBe(true);
    expect(result.reason).toBe('visit_threshold_reached');
  });

  it('not eligible if dismissed within 7 days', async () => {
    await recordFirstWorkoutCompleted();
    await recordInstallDismissed();

    const result = await checkInstallEligibility();
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('recently_dismissed');
  });

  it('eligible if dismissal is older than cooldown period', async () => {
    await recordFirstWorkoutCompleted();

    // Set dismissal to 8 days ago
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    await db.put<MetaRecord>(STORES.META, {
      key: 'pwa_install_dismissed_at',
      value: eightDaysAgo,
      updatedAt: eightDaysAgo,
    });

    const result = await checkInstallEligibility();
    expect(result.eligible).toBe(true);
    expect(result.reason).toBe('first_workout_completed');
  });

  it('not eligible if already installed', async () => {
    await recordFirstWorkoutCompleted();
    await recordInstalled();

    const result = await checkInstallEligibility();
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('already_installed');
  });

  it('session-level visit tracking prevents double counting', async () => {
    // First call counts
    await recordVisit();
    // Second call in same session should NOT count
    await recordVisit();
    await recordVisit();

    const record = await db.get<MetaRecord>(STORES.META, 'pwa_visit_count');
    expect(record?.value).toBe(1);
  });

  it('beforeinstallprompt unavailable does not crash eligibility check', async () => {
    // Eligibility check works independently of prompt availability
    await recordFirstWorkoutCompleted();
    const result = await checkInstallEligibility();
    expect(result.eligible).toBe(true);
  });
});
