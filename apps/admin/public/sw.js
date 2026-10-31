// Service worker: shows push notifications and opens the right page on tap.
// Served from the root so its scope covers both /employee and /erp.

self.addEventListener('push', (event) => {
  const message = event.data ? event.data.json() : {};

  event.waitUntil(
    self.registration.showNotification(message.title || 'XLEVELSUP', {
      body: message.body,
      icon: '/xlu_icon_192.png',
      badge: '/xlu_icon_192.png',
      tag: message.tag,
      data: { url: message.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => client.url.startsWith(self.location.origin));
      if (!open) return self.clients.openWindow(target);
      return open.focus().then((client) => client.navigate(target));
    }),
  );
});
