/**
 * Non-Intrusive Offline & Sync Status Indicator Component
 * Displays human-friendly sync state and manual retry controls.
 */

'use client';

import React from 'react';
import { useSyncStatus } from '@/hooks/use-sync-status';
import { Cloud, CloudOff, RefreshCw, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SyncStatusIndicator() {
  const {
    isOnline,
    isSyncing,
    statusText,
    pendingCount,
    failedCount,
    deadCount,
    syncNow,
    retryFailed,
  } = useSyncStatus();

  // If online, fully synced, and zero pending/dead items, render compact idle indicator
  if (isOnline && statusText === 'Synced' && pendingCount === 0 && failedCount === 0 && deadCount === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-full border border-border/40">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        <span>Synced</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs bg-background/80 backdrop-blur border border-border px-3 py-1.5 rounded-lg shadow-sm">
      {!isOnline ? (
        <>
          <CloudOff className="w-4 h-4 text-amber-500" />
          <span className="text-amber-500 font-medium">You&apos;re offline. Your workout is saved on this device.</span>
        </>
      ) : isSyncing ? (
        <>
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
          <span>Syncing ({pendingCount} pending)...</span>
        </>
      ) : deadCount > 0 ? (
        <>
          <AlertCircle className="w-4 h-4 text-destructive" />
          <span className="text-destructive font-medium">Some data needs attention.</span>
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[11px] px-2 ml-1"
            onClick={retryFailed}
          >
            Retry
          </Button>
        </>
      ) : failedCount > 0 ? (
        <>
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <span className="text-amber-500">Your workout is safe on this device, but syncing failed.</span>
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[11px] px-2 ml-1"
            onClick={retryFailed}
          >
            Retry
          </Button>
        </>
      ) : (
        <>
          <Cloud className="w-4 h-4 text-primary" />
          <span>Your workout is saved and will sync when you&apos;re online. ({pendingCount} pending)</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-[11px] px-2 ml-1"
            onClick={syncNow}
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Sync Now
          </Button>
        </>
      )}
    </div>
  );
}
