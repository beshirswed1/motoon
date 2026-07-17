// Custom Service Worker logic for handling notification interactions
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Get the URL from notification data
  const urlToOpen = (event.notification.data && event.notification.data.url) 
    ? event.notification.data.url 
    : '/';

  // Resolve the URL relative to the scope of the service worker
  const absoluteUrl = new URL(urlToOpen, self.location.origin).href;

  // Check if there's already a window open with this URL or another app window
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    let matchingClient = null;

    for (let i = 0; i < windowClients.length; i++) {
      const windowClient = windowClients[i];
      if (windowClient.url === absoluteUrl) {
        matchingClient = windowClient;
        break;
      }
    }

    if (matchingClient) {
      return matchingClient.focus();
    } else {
      return clients.openWindow(absoluteUrl);
    }
  });

  event.waitUntil(promiseChain);
});
