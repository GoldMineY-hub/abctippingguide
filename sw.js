// ABC Tipping Guide — Service Worker
// Caches all pages and assets for full offline support

const CACHE_NAME = 'abc-tipping-v2';

const PAGES_TO_CACHE = [
  '/',
  '/index.html',
  '/blog.html',
  '/blog-aruba-tipping-guide.html',
  '/blog-bonaire-tipping-guide.html',
  '/blog-curacao-tipping-guide.html',
  '/manifest.json',
];

// Install — cache all pages immediately
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PAGES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate — delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache first, fall back to network
self.addEventListener('fetch', e => {
  // Skip non-GET requests and external APIs
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.hostname.includes('workers.dev')) return;
  if (url.hostname.includes('ipapi.co')) return;
  if (url.hostname.includes('google.com')) return;
  if (url.hostname.includes('googleapis.com')) return;
  if (url.hostname.includes('gstatic.com')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Cache successful HTML responses
        if (response.ok && e.request.destination === 'document') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback — return cached index
        return caches.match('/');
      });
    })
  );
});
