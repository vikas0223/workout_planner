import React from 'react';
import { renderToString } from 'react-dom/server';
import { useDashboard } from '@/hooks/use-dashboard';
import { describe, it, expect, beforeEach } from 'vitest';
import { setupMockIndexedDB } from './helpers/fake-indexeddb';
import { IndexedDBEngine } from '@/lib/storage/indexeddb-engine';
import { getSyncCoordinator } from '@/lib/sync';

describe('Hydration & SSR Determinism Regression', () => {
  beforeEach(() => {
    IndexedDBEngine.resetInstance();
    setupMockIndexedDB();
  });

  it('guarantees navigator.onLine safe handling when running in Node.js where onLine is undefined', async () => {
    // Verify current Node.js environment characteristics
    const hasNavigator = typeof navigator !== 'undefined';
    const isOnlineBoolean = typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean';

    expect(hasNavigator).toBe(true);
    // In Node.js 21+, navigator.onLine is NOT a boolean (undefined)
    expect(isOnlineBoolean).toBe(false);

    // Old flawed check: typeof navigator !== 'undefined' ? !navigator.onLine : false
    // Evaluated to: !undefined => true (erroneously reported OFFLINE on server!)
    const oldFlawedCheck = typeof navigator !== 'undefined' ? !navigator.onLine : false;
    expect(oldFlawedCheck).toBe(true);

    // Verify production hook initialization path under SSR:
    // When rendered on the server (Node.js where navigator.onLine is undefined),
    // useDashboard must initialize isOffline deterministically to false.
    let initialIsOfflineValue: boolean | undefined;
    function TestDashboardHookConsumer() {
      const { isOffline } = useDashboard();
      initialIsOfflineValue = isOffline;
      return React.createElement('div', { 'data-testid': 'offline-state' }, String(isOffline));
    }

    const html = renderToString(React.createElement(TestDashboardHookConsumer));
    expect(initialIsOfflineValue).toBe(false);
    expect(html).toContain('>false<');
  });

  it('safely handles non-boolean navigator.onLine in SyncCoordinator.getStatus() without false offline alert', async () => {
    const coordinator = getSyncCoordinator();
    const status = await coordinator.getStatus();

    // Must not falsely identify as Offline when navigator.onLine is undefined
    expect(status.statusText).not.toBe('Offline');
    expect(status.isOnline).toBe(true);
  });
});
