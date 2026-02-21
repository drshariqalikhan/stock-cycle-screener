const CACHE_NAME = 'cycle-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  'https://cdn.jsdelivr.net/npm/bulma@1.0.4/css/bulma.min.css'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});