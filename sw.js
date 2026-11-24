/* Offline-Cache: Die App läuft nach dem ersten Öffnen komplett ohne Internet. */
const CACHE = 'alltagsheld-v10';
const FILES = ['./', './index.html', './app.js', './parser.js', './recipes.js', './zxing.min.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  // Kalendertermin als echte .ics-Datei ausliefern (Inhalt kommt aus der Adresse)
  if (u.origin === location.origin && u.pathname.endsWith('/termin.ics')) {
    e.respondWith(new Response(u.searchParams.get('d') || '', { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'inline; filename="termin.ics"' } }));
    return;
  }
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // Netz zuerst (damit Updates ankommen), sonst Cache – so geht es auch offline.
  e.respondWith(fetch(e.request).then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return res; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
});
self.addEventListener('notificationclick', e => { e.notification.close(); e.waitUntil(self.clients.matchAll({ type: 'window' }).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow('./#todos'))); });
