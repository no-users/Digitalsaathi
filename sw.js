self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('digital-saathi-store').then((cache) => {
      return cache.addAll(['index.html']); // Sirf index.html rakhein
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});