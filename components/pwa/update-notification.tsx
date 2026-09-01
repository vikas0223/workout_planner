/**
 * PWA Update Notification Component
 * 
 * Non-blocking notification when a new service worker version is available.
 * User-controlled: does NOT auto-reload.
 * If an active workout exists, warns the user before applying.
 */

'use client';

import React, { useState, useCallback } from 'react';
import { applyUpdate, hasActiveWorkoutSession } from '@/lib/pwa/sw-update-manager';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UpdateNotificationProps {
  registration: ServiceWorkerRegistration | null;
}

export function UpdateNotification({ registration }: UpdateNotificationProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [showWorkoutWarning, setShowWorkoutWarning] = useState(false);

  const handleReload = useCallback(async () => {
    if (!registration) return;

    setIsApplying(true);

    // Check for active workout
    const hasWorkout = await hasActiveWorkoutSession();
    if (hasWorkout) {
      setShowWorkoutWarning(true);
      setIsApplying(false);
      return;
    }

    await applyUpdate(registration, false);
  }, [registration]);

  const handleForceUpdate = useCallback(async () => {
    if (!registration) return;
    setIsApplying(true);
    await applyUpdate(registration, true);
  }, [registration]);

  if (!registration) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-top-4 duration-300 motion-reduce:animate-none"
    >
      <div className="bg-background/95 backdrop-blur border border-border rounded-xl px-4 py-3 shadow-lg">
        {showWorkoutWarning ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-sm font-medium text-amber-700">
                You have an active workout
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Finish or save your workout before updating. Your workout data is safe.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7"
                onClick={() => setShowWorkoutWarning(false)}
              >
                Later
              </Button>
              <Button
                size="sm"
                variant="default"
                className="text-xs h-7 bg-amber-600 hover:bg-amber-700 text-white"
                onClick={handleForceUpdate}
                disabled={isApplying}
              >
                {isApplying ? 'Updating...' : 'Update Anyway'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <RefreshCw className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <p className="text-sm flex-1">A new version is available.</p>
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-7"
              onClick={handleReload}
              disabled={isApplying}
              aria-label="Reload to update app"
            >
              {isApplying ? 'Updating...' : 'Reload'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
