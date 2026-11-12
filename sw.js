// Service worker : met tout en cache pour un fonctionnement 100 % hors ligne.
// Changez VERSION à chaque mise à jour des fichiers pour forcer le rafraîchissement.
const VERSION = 'veilleuse-v3';
const FILES = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'manifest.json',
  'media/veille.mp4',
  'media/silence.m4a',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Réponse partielle (Range) pour la vidéo : Safari l'exige pour lire un média depuis le cache.
async function rangeResponse(request, response) {
  const range = request.headers.get('range');
  const buf = await response.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(range || '');
  const size = buf.byteLength;
  let start = m && m[1] ? parseInt(m[1], 10) : 0;
  let end = m && m[2] ? parseInt(m[2], 10) : size - 1;
  if (m && !m[1] && m[2]) { start = Math.max(0, size - parseInt(m[2], 10)); end = size - 1; }
  end = Math.min(end, size - 1);
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'video/mp4',
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const isNav = req.mode === 'navigate';
    const cached = await cache.match(isNav ? './' : req, { ignoreSearch: true });
    if (cached) {
      if (req.headers.has('range')) return rangeResponse(req, cached.clone());
      return cached;
    }
    try {
      const res = await fetch(req);
      if (res.ok && res.status === 200 && !req.headers.has('range')) cache.put(req, res.clone());
      return res;
    } catch (e) {
      if (isNav) {
        const fallback = await cache.match('index.html');
        if (fallback) return fallback;
      }
      return new Response('', { status: 504, statusText: 'Hors ligne' });
    }
  })());
});
