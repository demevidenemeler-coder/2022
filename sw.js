/* Prisma – Service Worker: macht das Spiel nach dem ersten Laden offline spielbar.
   Bei jeder Änderung an den Spieldateien VERSION erhöhen, damit Geräte die neue Fassung holen. */
const VERSION = 'prisma-v7';
const ASSETS = [
  './', 'index.html', 'css/style.css',
  'js/themes.js', 'js/themes2.js', 'js/audio.js', 'js/game.js',
  'manifest.webmanifest', 'icon.svg', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const font = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !font) return;
  // Erst aus dem Speicher antworten (sofort, auch offline) und im Hintergrund auffrischen
  e.respondWith(
    caches.open(VERSION).then(cache =>
      cache.match(req, { ignoreSearch: url.origin === location.origin }).then(hit => {
        const fresh = fetch(req).then(res => {
          if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
          return res;
        }).catch(() => hit);
        return hit || fresh;
      })
    )
  );
});
