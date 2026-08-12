// Minimal service worker — required for "Add to Home Screen" installability
// on Android. Doesn't cache anything (dashboard needs live data every load),
// just needs to exist and respond to the fetch event to qualify as a PWA.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {}); // pass-through, no caching — always fresh data
