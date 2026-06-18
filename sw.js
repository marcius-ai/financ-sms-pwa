const CACHE_NAME = 'finanmm-v6';
const API_BASE = 'https://web-production-09718.up.railway.app';

const ASSETS = [
  './', './index.html', './manifest.json',
  './icon-192.png', './icon-512.png'
];

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for assets
self.addEventListener('fetch', event => {
  const url = event.request.url;
  if (url.startsWith(API_BASE)) {
    event.respondWith(fetch(event.request).catch(() => new Response('{"error":"offline"}', {headers:{'Content-Type':'application/json'}})));
  } else {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
  }
});

// Push notification
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data.json(); } catch(e) {}
  const title = data.title || 'Finan$M$';
  const options = {
    body: data.body || 'Novo gasto para classificar',
    icon: './icon-192.png',
    badge: './icon-192.png',
    data: data
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow('./'));
});
