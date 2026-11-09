// Lean Mode — Service Worker (Android PWA, push-optimized)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

function parsePushData(event) {
  if (!event.data) return {};
  try {
    return event.data.json();
  } catch {
    try {
      return { body: event.data.text() };
    } catch {
      return {};
    }
  }
}

self.addEventListener('push', (event) => {
  const data = parsePushData(event);
  const title = data.title || 'Lean Mode';
  const body = data.body || 'Ada update target mingguanmu.';
  const url = typeof data.url === 'string' && data.url ? data.url : '/';

  // Maximize Android-visible options (actual sound/vibration follow OS channel + DND)
  const options = {
    body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    image: data.image || undefined,
    tag: data.tag || 'leanmode-weekly-reminder',
    renotify: data.renotify === true,
    requireInteraction: data.requireInteraction === true,
    silent: data.silent === true,
    vibrate: Array.isArray(data.vibrate) ? data.vibrate : [200, 100, 200, 100, 300],
    timestamp: typeof data.timestamp === 'number' ? data.timestamp : Date.now(),
    dir: 'auto',
    lang: 'id',
    data: { url, ...(data.data && typeof data.data === 'object' ? data.data : {}) },
    actions: Array.isArray(data.actions) ? data.actions : [
      { action: 'open', title: 'Buka Lean Mode' },
      { action: 'dismiss', title: 'Tutup' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  if (action === 'dismiss') return;

  const rawUrl = event.notification && event.notification.data && event.notification.data.url;
  const targetUrl = typeof rawUrl === 'string' && rawUrl ? rawUrl : '/';

  event.waitUntil((async () => {
    const absUrl = new URL(targetUrl, self.location.origin).href;
    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of allClients) {
      try {
        if (client.url === absUrl && 'focus' in client) return client.focus();
      } catch {}
    }
    for (const client of allClients) {
      try {
        if ('focus' in client && 'navigate' in client) {
          await client.navigate(absUrl);
          return client.focus();
        }
      } catch {}
    }
    if (clients.openWindow) return clients.openWindow(absUrl);
  })());
});

self.addEventListener('pushsubscriptionchange', (event) => {
  // Browser rotated subscription; re-subscribe endpoint must be handled by app on next open.
  event.waitUntil(Promise.resolve());
});
