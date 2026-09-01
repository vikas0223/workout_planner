/**
 * React Hook for PWA Install Prompt
 * 
 * Captures the beforeinstallprompt event and provides:
 * - Install prompt state management
 * - Deferred prompt triggering
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
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return;

    setState('prompting');
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;

    if (outcome === 'accepted') {
      setState('installed');
      deferredPromptRef.current = null;
      await recordInstalled();
    } else {
      setState('dismissed');
      deferredPromptRef.current = null;
      await recordInstallDismissed();
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
    return 'Tap the Share button, then "Add to Home Screen"';
  }

  if (/firefox/.test(ua)) {
    return 'Tap the menu (⋮), then "Install" or "Add to Home Screen"';
  }

  if (/samsung/.test(ua)) {
    return 'Tap the menu, then "Add page to" → "Home screen"';
  }

  // For browsers that don't support beforeinstallprompt, provide generic advice
  if (state === 'not_available' && !/chrome/.test(ua)) {
    return 'Use your browser menu to add this app to your home screen';
  }

  return null;
}
