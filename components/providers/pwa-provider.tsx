/**
 * PWA Provider
 * 
 * SEPARATE from PersistenceProvider — a PWA failure must never break IndexedDB initialization.
 * 
 * Responsibilities:
 * - Service worker registration
 * - Update lifecycle management
 * - Install eligibility tracking (session-level visit recording)
 * - First-time onboarding message
 * 
 * Does NOT own workout data.
 * Does NOT replace SyncCoordinator.
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { registerServiceWorker } from '@/lib/pwa/sw-registration';
import { recordVisit, shouldShowOnboarding, recordOnboardingShown } from '@/lib/pwa/install-eligibility';
import { InstallBanner } from '@/components/pwa/install-banner';
import { UpdateNotification } from '@/components/pwa/update-notification';

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [updateRegistration, setUpdateRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // 1. Register service worker with update callback
    registerServiceWorker((registration) => {
      setUpdateRegistration(registration);
    });

    // 2. Record meaningful session visit (once per browser session)
    recordVisit();

    // 3. Check if first-time onboarding should be shown
    shouldShowOnboarding().then((should) => {
      if (should) {
        setShowOnboarding(true);
      }
    });
  }, []);

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    recordOnboardingShown();
  }, []);

  return (
    <>
      {children}

      {/* First-time onboarding message */}
      {showOnboarding && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none"
        >
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 shadow-md">
            <p className="text-sm text-indigo-800">
              Your workouts are saved on this device and will sync when you&apos;re online.
            </p>
            <button
              onClick={dismissOnboarding}
              className="text-xs text-indigo-600 font-medium mt-1 hover:underline"
              aria-label="Got it, dismiss onboarding message"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Install CTA */}
      <InstallBanner />

      {/* Update notification */}
      <UpdateNotification registration={updateRegistration} />
    </>
  );
}
