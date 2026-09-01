/**
 * Service Worker Registration Module
 * 
 * Registers /sw.js and listens for update lifecycle events.
 * Exposes callback for "new version available" notification.
 * Graceful degradation: if registration fails, app continues normally.
 * No impact on IndexedDB or sync engine.
 */

export type SWUpdateCallback = (registration: ServiceWorkerRegistration) => void;

let registrationRef: ServiceWorkerRegistration | null = null;

/**
 * Registers the service worker and sets up update detection.
 * @param onUpdate - Called when a new service worker is waiting to activate.
 */
export async function registerServiceWorker(
  onUpdate?: SWUpdateCallback
): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    registrationRef = registration;

    // Listen for new service worker installations
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        // New SW is waiting — notify the application
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          onUpdate?.(registration);
        }
      });
    });

    // Check if there's already a waiting worker (e.g. from a previous page load)
    if (registration.waiting && navigator.serviceWorker.controller) {
      onUpdate?.(registration);
    }

    return registration;
  } catch (error) {
    // Service worker registration failed — app continues without PWA features
    console.warn('[PWA] Service worker registration failed:', error);
    return null;
  }
}

/**
 * Returns the current service worker registration, if available.
 */
export function getRegistration(): ServiceWorkerRegistration | null {
  return registrationRef;
}
