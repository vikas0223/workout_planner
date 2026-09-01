/**
 * PWA Install Banner Component
 * 
 * Non-intrusive install CTA that only renders when:
 * 1. Install eligibility criteria are met (engagement threshold)
 * 2. beforeinstallprompt is available OR platform instructions exist
 * 3. App is not already in standalone mode
 * 
 * Accessible: ARIA labels, keyboard operable, focus management.
 * Respects prefers-reduced-motion.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { checkInstallEligibility } from '@/lib/pwa/install-eligibility';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function InstallBanner() {
  const { state, isStandalone, triggerInstall, dismiss, platformInstructions } = usePwaInstall();
  const [eligible, setEligible] = useState(false);
  const [showPlatformHelp, setShowPlatformHelp] = useState(false);

  useEffect(() => {
    checkInstallEligibility().then((result) => {
      setEligible(result.eligible);
    });
  }, []);

  // Don't render if already installed/standalone
  if (isStandalone || state === 'installed') return null;

  // Don't render if not eligible
  if (!eligible) return null;

  // Don't render if dismissed
  if (state === 'dismissed') return null;

  // Show platform-specific instructions when beforeinstallprompt is unavailable
  if (state === 'not_available' && platformInstructions) {
    if (!showPlatformHelp) {
      return (
        <div
          role="complementary"
          aria-label="Install app suggestion"
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 duration-300 motion-reduce:animate-none"
        >
          <div className="flex items-center gap-3 bg-background/95 backdrop-blur border border-border rounded-xl px-4 py-3 shadow-lg">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Install Workout Planner</p>
              <p className="text-xs text-muted-foreground">Quick access &amp; offline workouts</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-8"
              onClick={() => setShowPlatformHelp(true)}
              aria-label="Show install instructions"
            >
              How to Install
            </Button>
            <button
              onClick={dismiss}
              className="flex-shrink-0 p-1 rounded-md hover:bg-muted transition-colors"
              aria-label="Dismiss install suggestion"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      );
    }

    // Platform instructions expanded
    return (
      <div
        role="complementary"
        aria-label="Install instructions"
        className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 duration-300 motion-reduce:animate-none"
      >
        <div className="bg-background/95 backdrop-blur border border-border rounded-xl px-4 py-3 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Install Workout Planner</p>
            <button
              onClick={() => { setShowPlatformHelp(false); dismiss(); }}
              className="p-1 rounded-md hover:bg-muted transition-colors"
              aria-label="Close install instructions"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">{platformInstructions}</p>
        </div>
      </div>
    );
  }

  // Standard install prompt available
  if (state !== 'available') return null;

  return (
    <div
      role="complementary"
      aria-label="Install app"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 duration-300 motion-reduce:animate-none"
    >
      <div className="flex items-center gap-3 bg-background/95 backdrop-blur border border-border rounded-xl px-4 py-3 shadow-lg">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
          <Download className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Install Workout Planner</p>
          <p className="text-xs text-muted-foreground">Quick access &amp; offline workouts</p>
        </div>
        <Button
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8"
          onClick={triggerInstall}
          aria-label="Install Workout Planner app"
        >
          Install
        </Button>
        <button
          onClick={dismiss}
          className="flex-shrink-0 p-1 rounded-md hover:bg-muted transition-colors"
          aria-label="Not now, dismiss install prompt"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
