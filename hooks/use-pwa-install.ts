/**
 * React Hook for PWA Install Prompt
 * 
 * Captures the beforeinstallprompt event and provides:
 * - Install prompt state management
 * - Deferred prompt triggering with single-use guarantee
 * - Platform-specific fallback instructions
 * - Standalone mode detection
 * 
 * States: not_available | available | prompting | installed | dismissed
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { isStandaloneMode, recordInstalled, recordInstallDismissed } from '@/lib/pwa/install-eligibility';

export type InstallState = 'not_available' | 'available' | 'prompting' | 'installed' | 'dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface PwaInstallResult {
  /** Current install prompt state */
  state: InstallState;
  /** Whether the app is running in standalone/installed mode */
  isStandalone: boolean;
  /** Triggers the native install prompt (only works when state is 'available') */
  triggerInstall: () => Promise<void>;
  /** Dismisses the install CTA without installing */
  dismiss: () => void;
  /** Platform-specific install instructions when beforeinstallprompt is unavailable */
  platformInstructions: string | null;
}

export function usePwaInstall(): PwaInstallResult {
  const [state, setState] = useState<InstallState>('not_available');
  const [isStandalone, setIsStandalone] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check standalone mode
    const standalone = isStandaloneMode();
    setIsStandalone(standalone);
    if (standalone) {
      setState('installed');
      return;
    }

    // Listen for display-mode changes
    let mediaQuery: MediaQueryList | null = null;
    let handleMediaChange: ((e: MediaQueryListEvent) => void) | null = null;

    try {
      mediaQuery = window.matchMedia('(display-mode: standalone)');
      handleMediaChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          setIsStandalone(true);
          setState('installed');
          deferredPromptRef.current = null;
        }
      };
      mediaQuery.addEventListener?.('change', handleMediaChange);
    } catch {
      // Ignore environments without matchMedia addEventListener
    }

    // Capture beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setState('available');
    };

    // Detect successful installation
    const handleAppInstalled = () => {
      setState('installed');
      deferredPromptRef.current = null;
      recordInstalled();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (mediaQuery && handleMediaChange) {
        mediaQuery.removeEventListener?.('change', handleMediaChange);
      }
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return;

    // Immediately clear prompt reference to guarantee single consumption
    deferredPromptRef.current = null;
    setState('prompting');

    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;

      if (outcome === 'accepted') {
        setState('installed');
        await recordInstalled();
      } else {
        setState('dismissed');
        await recordInstallDismissed();
      }
    } catch (err) {
      console.warn('Native install prompt encountered an error:', err);
      setState('not_available');
    }
  }, []);

  const dismiss = useCallback(() => {
    setState('dismissed');
    deferredPromptRef.current = null;
    recordInstallDismissed();
  }, []);

  // Platform-specific fallback instructions
  const platformInstructions = getPlatformInstructions(state);

  return {
    state,
    isStandalone,
    triggerInstall,
    dismiss,
    platformInstructions,
  };
}

/**
 * Returns platform-appropriate install instructions when
 * beforeinstallprompt is not available.
 */
function getPlatformInstructions(state: InstallState): string | null {
  if (typeof navigator === 'undefined') return null;
  if (state === 'available' || state === 'installed') return null;

  const ua = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua) && /safari/.test(ua)) {
    return 'Tap Share, then "Add to Home Screen", then "Add"';
  }

  if (/android/.test(ua)) {
    return 'Open your browser menu (⋮) and tap "Install app" or "Add to Home screen"';
  }

  if (/chrome|chromium|edg/.test(ua) && !/mobile/.test(ua)) {
    return 'Look for the install icon in your browser\'s address bar or menu';
  }

  return 'Replyf can still be used directly in your browser with full offline support';
}
