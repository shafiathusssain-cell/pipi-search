self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', () => {
  // Pass-through SW: lookups go straight to the network so users always get
  // the latest app shell. No offline caching for pipi search.
});