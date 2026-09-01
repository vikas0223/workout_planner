/**
 * Workout Planner — Service Worker
 * 
 * Responsibilities:
 * - Cache application shell for offline startup
 * - Cache-first for immutable static assets
 * - Network-first for navigation with offline fallback
 * - NEVER cache Supabase, auth, or API responses
 * - User-controlled update lifecycle (no auto skipWaiting)
 * 
 * This SW does NOT own workout data. IndexedDB is the local data store.
 * This SW does NOT perform sync. SyncCoordinator handles cloud sync.
 */

// ─── Cache Configuration ─────────────────────────────────────────
const SHELL_CACHE = 'workout-planner-shell-v1';
const RUNTIME_CACHE = 'workout-planner-runtime-v1';
const MEDIA_CACHE = 'workout-planner-media-v1';

const CURRENT_CACHES = [SHELL_CACHE, RUNTIME_CACHE, MEDIA_CACHE];

// Resources to precache on install
const SHELL_RESOURCES = [
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/manifest.webmanifest',
];

// URL patterns that must NEVER be cached (network-only)
const NEVER_CACHE_PATTERNS = [
  /supabase\.co/,
  /supabase\.in/,
  /\/api\//,
  /\/auth\//,
  /\/rest\/v1\//,
  /\/realtime\//,
  /\/storage\/v1\//,
  /\/functions\/v1\//,
  /access_token/,
  /refresh_token/,
  /\.supabase\./,
];

// ─── Install ─────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  // Do NOT call self.skipWaiting() — update is user-controlled
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return cache.addAll(SHELL_RESOURCES);
    })
  );
});

// ─── Activate ────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  // Clean up old caches that are not in CURRENT_CACHES
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !CURRENT_CACHES.includes(name))
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      // Take control of all open clients
      return self.clients.claim();
    })
  );
});

// ─── Message Handler ─────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ─── Fetch Handler ───────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Skip non-GET requests (mutations, POST, etc.)
  if (request.method !== 'GET') {
    return;
  }

  // 2. Never cache Supabase, auth, or API requests — network only
  if (shouldNeverCache(url.href)) {
    return;
  }

  // 3. Navigation requests — network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // 4. Next.js static assets (/_next/static/) — cache-first (immutable, hash-versioned)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // 5. Icons and manifest — cache-first
  if (url.pathname.startsWith('/icons/') || url.pathname === '/manifest.webmanifest') {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // 6. Image assets — stale-while-revalidate via media cache
  if (url.pathname.startsWith('/images/') || /\.(png|jpg|jpeg|gif|svg|webp|ico)$/.test(url.pathname)) {
    event.respondWith(handleMediaAsset(request));
    return;
  }

  // 7. Everything else — network-first with runtime cache fallback
  event.respondWith(handleDefault(request));
});

// ─── Strategy: Navigation (network-first + offline fallback) ─────
async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    // Cache the successful navigation response in shell cache
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Network failed — try cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    // Fallback to offline page
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// ─── Strategy: Static Asset (cache-first) ────────────────────────
async function handleStaticAsset(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 503 });
  }
}

// ─── Strategy: Media (stale-while-revalidate) ────────────────────
async function handleMediaAsset(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      caches.open(MEDIA_CACHE).then((cache) => cache.put(request, response.clone()));
    }
    return response;
  }).catch(() => null);

  return cached || (await fetchPromise) || new Response('', { status: 503 });
}

// ─── Strategy: Default (network-first with cache fallback) ───────
async function handleDefault(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('', { status: 503 });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────
function shouldNeverCache(url) {
  return NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(url));
}
