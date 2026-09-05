// Deliberately narrow. This service worker's only job is: when a full
// page navigation fails because there is truly no connection, show the
// branded /offline page instead of the browser's own error screen.
//
// It does NOT try to cache or replay dynamic data, API calls, or Server
// Actions (the workout save flow handles its own offline queue in
// lib/offlineQueue.js / components/OfflineQueueSync.js). Caching signed-in,
// per-user pages here would risk serving stale data after a deploy with no
// safe way to know it is stale, so this stays out of that entirely.

const CACHE = "skill-shell-v1";
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  // Only step in for top-level page navigations. Everything else (JS/CSS
  // chunks, images, RSC data requests, Server Action POSTs) passes
  // straight through to the network untouched.
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL)),
  );
});
