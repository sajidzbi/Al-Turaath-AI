/* Al-Turath AI — Service Worker
   App-shell caching only. API calls (generativelanguage.googleapis.com) are
   never intercepted — they always go straight to the network. Bump CACHE_NAME
   on every deploy so returning users automatically get the new shell. */
const CACHE_NAME = 'al-turath-shell-v4';
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './JameelNooriNastaleeq.ttf',
  './KFGQPC.ttf',
  './icon-96.png',
  './icon-128.png',
  './icon-144.png',
  './icon-152.png',
  './icon-192.png',
  './icon-384.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        SHELL_FILES.map((f) => cache.add(f).catch(() => {/* font filename mismatch etc. — ignore, not fatal */}))
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Never touch API calls or any cross-origin request other than our font/CSS CDNs we want cached opportunistically.
  if (url.origin !== self.location.origin && !url.hostname.includes('fonts.gstatic.com') && !url.hostname.includes('fonts.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => {
        // Offline fallback for page navigations
        if (req.mode === 'navigate') return caches.match('./index.html');
        return cached;
      });
    })
  );
});
