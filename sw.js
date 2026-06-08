const CACHE_NAME = 'financmm-v1';
const API_BASE = 'https://web-production-09718.up.railway.app';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Install: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for API, cache-first for assets
self.addEventListener('fetch', event => {
  const url = event.request.url;
  if (url.startsWith(API_BASE)) {
    // Network first for API
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
  } else {
    // Cache first for static assets
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
  }
});

// Push notifications
self.addEventListener('push', event => {
  let data = { title: 'FinanMM', body: 'Novo gasto para classificar!' };
  try { data = event.data.json(); } catch (e) {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'FinanMM', {
      body: data.body || 'Novo gasto para classificar!',
      icon: './icon-192.png',
      badge: './icon-192.png',
      vibrate: [200, 100, 200],
      data: { url: './' },
      actions: [
        { action: 'open', title: 'Classificar agora' },
        { action: 'close', title: 'Depois' }
      ]
    })
  );
});

// Notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'close') return;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) {
        const client = clientList[0];
        client.focus();
        return client.navigate('./');
      }
      return clients.openWindow('./');
    })
  );
});

// Background sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-gastos') {
    event.waitUntil(
      fetch(API_BASE + '/gastos/pendentes')
        .then(res => res.json())
        .then(data => {
          const gastos = Array.isArray(data) ? data : (data.gastos || []);
          if (gastos.length > 0) {
            return self.registration.showNotification('FinanMM', {
              body: 'Voce tem ' + gastos.length + ' gasto(s) pendentes!',
              icon: './icon-192.png',
              badge: './icon-192.png'
            });
          }
        })
        .catch(() => {})
    );
  }
});
