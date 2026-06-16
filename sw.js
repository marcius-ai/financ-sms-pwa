const CACHE_NAME = 'finanmm-v5';
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
    // Network first for API
    event.respondWith(fetch(event.request).catch(() => new Response('{"error":"offline"}', {headers:{'Content-Type':'application/json'}})));
  } else {
    // Cache first for assets
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
  }
});

// Push notifications
self.addEventListener('push', event => {
  let data = { title: 'Finan$M$', body: 'Novo gasto para classificar!', categoria: null, estabelecimento: null };
  try { data = event.data.json(); } catch (e) {}

  const title = data.title || 'Finan$M$ - Novo gasto!';
  const options = {
    body: data.body || 'Toque para classificar',
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: 'finanmm-gasto',
    renotify: true,
    requireInteraction: true,
    data: { url: './', categoria: data.categoria },
    actions: data.categoria ? [
      { action: 'confirmar', title: 'Confirmar: ' + data.categoria },
      { action: 'abrir', title: 'Ver no app' }
    ] : [
      { action: 'abrir', title: 'Classificar agora' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || './';

  if (event.action === 'confirmar' && event.notification.data && event.notification.data.gastoId) {
    // Confirm category directly
    const gastoId = event.notification.data.gastoId;
    const categoria = event.notification.data.categoria;
    fetch(API_BASE + '/gastos/' + gastoId + '/confirmar?categoria=' + encodeURIComponent(categoria), { method: 'PATCH' });
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('financ-sms-pwa') && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
