/* Click & Connect — minimal service worker.
   Only purpose: make the site installable as an app on phones.
   It does NOT cache anything, so login/session pages are never stale. */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function () { /* network pass-through */ });
