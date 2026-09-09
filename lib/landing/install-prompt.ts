/**
 * Client-Side PWA Installation State Manager
 * 
 * Safely captures and manages the beforeinstallprompt lifecycle without
 * ever evaluating browser-specific APIs during SSR.
 * 
 * Provides an authoritative, centralized capability model:
 * - 'installed': app is running standalone or appinstalled has fired
 * - 'native-installable': beforeinstallprompt event is captured and unconsumed
 * - 'instructional-fallback': native prompt is unavailable, platform manual instructions required
 */

'use client';

import { useSyncExternalStore, useCallback } from 'react';

export type InstallCapability = 'installed' | 'native-installable' | 'instructional-fallback';
export type PlatformType = 'ios' | 'android' | 'desktop-chrome' | 'other';
export type InstallPromptOutcome = 'accepted' | 'dismissed' | 'manual_needed' | 'already_installed';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms?: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function detectPlatform(userAgent?: string): PlatformType {
  const ua = userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '') ?? '';
  // iOS detection (iPhone, iPad, iPod)
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) &&
    !(typeof window !== 'undefined' && (window as any).MSStream);
  if (isIOS) return 'ios';

  // Android detection
  const isAndroid = /Android/.test(ua);
  if (isAndroid) return 'android';

  // Desktop Chromium / Edge detection
  const isDesktopChrome =
    /Chrome|Chromium|Edg/.test(ua) && !/Mobile|Android/.test(ua);
  if (isDesktopChrome) return 'desktop-chrome';

  return 'other';
}

interface InstallStoreState {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  platform: PlatformType;
  showGuidanceModal: boolean;
}

let storeState: InstallStoreState = {
  deferredPrompt: null,
  isInstalled: false,
  platform: 'other',
  showGuidanceModal: false,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error('Error in install store listener:', err);
    }
  });
}

function updateStore(patch: Partial<InstallStoreState>) {
  storeState = { ...storeState, ...patch };
  notify();
}

function checkStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)')?.matches === true ||
    Boolean((window.navigator as any)?.standalone)
  );
}

let isInitialized = false;

function initListeners() {
  if (typeof window === 'undefined' || isInitialized) return;
  isInitialized = true;

  // Initialize platform detection
  updateStore({
    platform: detectPlatform(),
    isInstalled: checkStandalone(),
  });

  // Listen for display-mode changes (e.g. user installs or switches mode)
  try {
    const mediaQuery = window.matchMedia?.('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        updateStore({
          isInstalled: true,
          showGuidanceModal: false,
        });
      }
    };
    mediaQuery?.addEventListener?.('change', handleMediaChange);
  } catch {
    // Ignore environments without matchMedia addEventListener
  }

  // Listen for beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    updateStore({
      deferredPrompt: e as BeforeInstallPromptEvent,
    });
  });

  // Listen for appinstalled
  window.addEventListener('appinstalled', () => {
    updateStore({
      isInstalled: true,
      deferredPrompt: null,
      showGuidanceModal: false,
    });
  });
}

export function useInstallPrompt() {
  // Ensure browser listeners are registered once on the client
  if (typeof window !== 'undefined' && !isInitialized) {
    initListeners();
  }

  const currentSnapshot = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => storeState,
    () => ({
      deferredPrompt: null,
      isInstalled: false,
      platform: 'other' as PlatformType,
      showGuidanceModal: false,
    })
  );

  const capability: InstallCapability = currentSnapshot.isInstalled
    ? 'installed'
    : currentSnapshot.deferredPrompt !== null
    ? 'native-installable'
    : 'instructional-fallback';

  const setShowGuidanceModal = useCallback((show: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof show === 'function' ? show(storeState.showGuidanceModal) : show;
    if (storeState.showGuidanceModal !== nextVal) {
      updateStore({ showGuidanceModal: nextVal });
    }
  }, []);

  const triggerInstall = useCallback(async (): Promise<InstallPromptOutcome> => {
    // 1. If already installed:
    if (storeState.isInstalled || checkStandalone()) {
      updateStore({
        isInstalled: true,
        showGuidanceModal: false,
      });
      return 'already_installed';
    }

    // 2. If native browser prompt is available:
    if (storeState.deferredPrompt) {
      const promptEvent = storeState.deferredPrompt;
      // Immediately clear prompt reference with immutable update to guarantee single consumption
      updateStore({ deferredPrompt: null });

      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice?.outcome === 'accepted') {
          updateStore({
            isInstalled: true,
            showGuidanceModal: false,
          });
          return 'accepted';
        }
        // User dismissed native dialog
        return 'dismissed';
      } catch (err) {
        console.warn('Native install prompt failed or was dismissed:', err);
        // Fall back to guidance modal without crashing
        updateStore({ showGuidanceModal: true });
        return 'manual_needed';
      }
    }

    // 3. Native prompt unavailable: show platform-appropriate guidance modal
    updateStore({ showGuidanceModal: true });
    return 'manual_needed';
  }, []);

  return {
    capability,
    isInstallable: capability === 'native-installable',
    isInstalled: currentSnapshot.isInstalled,
    platform: currentSnapshot.platform,
    showGuidanceModal: currentSnapshot.showGuidanceModal,
    setShowGuidanceModal,
    triggerInstall,
  };
}

// Test / Diagnostic Helpers
export function _resetInstallStateForTesting() {
  storeState = {
    deferredPrompt: null,
    isInstalled: false,
    platform: 'other',
    showGuidanceModal: false,
  };
  isInitialized = false;
  notify();
}

export function _setDeferredPromptForTesting(prompt: BeforeInstallPromptEvent | null) {
  updateStore({ deferredPrompt: prompt });
}

export function _setIsInstalledForTesting(installed: boolean) {
  updateStore({ isInstalled: installed });
}

export function _setPlatformForTesting(platform: PlatformType) {
  updateStore({ platform });
}

export function _getInstallStateSnapshotForTesting() {
  const capability: InstallCapability = storeState.isInstalled
    ? 'installed'
    : storeState.deferredPrompt !== null
    ? 'native-installable'
    : 'instructional-fallback';
  return {
    ...storeState,
    capability,
  };
}
