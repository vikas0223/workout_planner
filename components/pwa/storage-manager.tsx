/**
 * Storage Manager Component
 * 
 * Storage & Offline Data panel for Settings integration.
 * Displays approximate storage usage and provides safe cleanup actions.
 * 
 * Cleanup actions NEVER delete:
 * - IndexedDB (workout sessions, logged sets, saved workouts, preferences)
 * - Sync queue
 * 
 * Cleanup actions only affect:
 * - Service worker caches (shell, runtime, media)
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useStorageEstimate, formatBytes } from '@/hooks/use-storage-estimate';
import { HardDrive, Trash2, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_WARNING_THRESHOLD = 80; // percent

export function StorageManager() {
  const { usage, quota, percent, isEstimateAvailable, isLoading, refresh } = useStorageEstimate();
  const [confirmAction, setConfirmAction] = useState<'media' | 'app' | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const clearMediaCache = useCallback(async () => {
    setIsClearing(true);
    try {
      if ('caches' in window) {
        await caches.delete('workout-planner-media-v1');
      }
      await refresh();
    } catch {
      // Silently fail
    }
    setIsClearing(false);
    setConfirmAction(null);
  }, [refresh]);

  const clearAppCache = useCallback(async () => {
    setIsClearing(true);
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      // Re-register service worker so it can repopulate caches
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
        }
      }
      await refresh();
    } catch {
      // Silently fail
    }
    setIsClearing(false);
    setConfirmAction(null);
  }, [refresh]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-background p-4 space-y-3">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-sm font-medium">Storage & Offline Data</h3>
        </div>
        <p className="text-xs text-muted-foreground">Loading storage information...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-background p-4 space-y-4">
      <div className="flex items-center gap-2">
        <HardDrive className="w-5 h-5 text-indigo-600" />
        <h3 className="text-sm font-medium">Storage & Offline Data</h3>
      </div>

      {isEstimateAvailable ? (
        <>
          {/* Usage bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Approximate storage usage</span>
              <span>{formatBytes(usage)} / {formatBytes(quota)}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  percent >= STORAGE_WARNING_THRESHOLD
                    ? 'bg-amber-500'
                    : 'bg-indigo-500'
                }`}
                style={{ width: `${Math.min(percent, 100)}%` }}
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Storage usage: ${percent}%`}
              />
            </div>
            <p className="text-[11px] text-muted-foreground/70 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Values are approximate browser estimates
            </p>
          </div>

          {/* Storage warning */}
          {percent >= STORAGE_WARNING_THRESHOLD && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-amber-800">
                  Your device is storing a large amount of offline data.
                </p>
                <p className="text-xs text-amber-700">
                  You can clear cached media without deleting your workout history.
                </p>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          Storage estimates are not available in this browser.
        </p>
      )}

      {/* Cleanup actions */}
      <div className="space-y-2 pt-1">
        <p className="text-xs font-medium text-muted-foreground">Cache Management</p>

        {confirmAction === 'media' ? (
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
            <p className="text-xs flex-1">Clear cached media? Your workouts are not affected.</p>
            <Button
              size="sm"
              variant="destructive"
              className="text-xs h-7"
              onClick={clearMediaCache}
              disabled={isClearing}
            >
              {isClearing ? 'Clearing...' : 'Confirm'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7"
              onClick={() => setConfirmAction(null)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start text-xs h-8"
            onClick={() => setConfirmAction('media')}
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" />
            Clear cached media
          </Button>
        )}

        {confirmAction === 'app' ? (
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
            <p className="text-xs flex-1">Clear application cache? The app will reload resources from the server. Your workouts are not affected.</p>
            <Button
              size="sm"
              variant="destructive"
              className="text-xs h-7"
              onClick={clearAppCache}
              disabled={isClearing}
            >
              {isClearing ? 'Clearing...' : 'Confirm'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7"
              onClick={() => setConfirmAction(null)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start text-xs h-8"
            onClick={() => setConfirmAction('app')}
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" />
            Clear application cache
          </Button>
        )}

        <p className="text-[11px] text-muted-foreground/70 mt-1">
          These actions only clear cached resources. Your workout history, logged sets, and preferences are never deleted.
        </p>
      </div>
    </div>
  );
}
