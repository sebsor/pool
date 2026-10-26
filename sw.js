/* Rack Ledger service worker — NETWORK-FIRST.

   Why network-first and not cache-first?
   Cache-first serves the old cached index.html even after you push a new
   version to GitHub Pages, which is the classic "I deployed but nothing
   changed" problem. Network-first always tries the live file first and
   only falls back to the cache when the phone is offline.

   Your games are NOT in this cache — they live in localStorage. Clearing
   or bumping this cache never touches game data.

   Bump VERSION only if you add/rename files in ASSETS. */
const VERSION = 'rack-ledger-v1';
const ASSETS = ['./', './index.html', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)));
  self.skipWaiting();                 // activate the new worker immediately
});

self.addEventListener('activate', e => {
  // Delete caches from older versions.
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))));
  self.clients.claim();               // take control of open tabs right away
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        // Keep the cache fresh with whatever the network just returned.
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});
