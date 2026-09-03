/**
 * React Hook for Sync Status & Manual Controls
 * Exposes current offline/online sync state, pending/dead counts, and syncNow/retryFailed actions.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSyncCoordinator, SyncStatusState, SyncEventEmitter } from '@/lib/sync';

const initialSyncState: SyncStatusState = {
  isOnline: true,
  isSyncing: false,
  statusText: 'Synced',
  pendingCount: 0,
  failedCount: 0,
  deadCount: 0,
  conflictCount: 0,
  lastSyncedAt: null,
  lastError: null,
};

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatusState>(initialSyncState);
  const coordinator = getSyncCoordinator();

  const refreshStatus = useCallback(async () => {
    try {
      const state = await coordinator.getStatus();
      setStatus(state);
    } catch {
      // Keep existing state
    }
  }, [coordinator]);

  useEffect(() => {
    refreshStatus();
    coordinator.start();

    const unsubscribe = SyncEventEmitter.subscribe(() => {
      refreshStatus();
    });

    const handleOnline = () => refreshStatus();
    const handleOffline = () => refreshStatus();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    const interval = setInterval(refreshStatus, 10000);

    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
      clearInterval(interval);
    };
  }, [coordinator, refreshStatus]);

  const syncNow = useCallback(async () => {
    try {
      await coordinator.syncNow('user_manual_click');
      await refreshStatus();
    } catch {
      await refreshStatus();
    }
  }, [coordinator, refreshStatus]);

  const retryFailed = useCallback(async () => {
    try {
      await coordinator.retryFailed();
      await refreshStatus();
    } catch {
      await refreshStatus();
    }
  }, [coordinator, refreshStatus]);

  return {
    ...status,
    syncNow,
    retryFailed,
  };
}
