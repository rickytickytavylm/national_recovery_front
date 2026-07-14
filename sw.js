/* NSV Public Platform — service worker */
const CACHE = "nsv-public-v6";
const OFFLINE_URL = "offline.html";

const PRECACHE = [
  "./",
  "index.html",
  "help.html",
  "centers.html",
  "center-detail.html",
  "materials.html",
  "material-detail.html",
  "diagnostic.html",
  OFFLINE_URL,
  "styles.css",
  "app.js",
  "help.js",
  "materials.js",
  "material-detail.js",
  "diagnostic.js",
  "centers.js",
  "center-detail.js",
  "site.webmanifest",
  "material-first-30-days.webp",
  "material-talk-to-loved-one.webp",
  "material-codependency.webp",
  "material-motivational-interview.webp",
  "material-relapse.webp",
  "material-family-role.webp",
  "material-diagnostics-pro.webp",
  "material-breathing.webp",
  "material-choose-center.webp",
  "material-burnout-pro.webp",
  "material-recovery-journal.webp",
  "material-evidence-based.webp",
  "shared/config.js",
  "shared/constants.js",
  "shared/api.js",
  "shared/routes.js",
  "shared/ios-tabbar.css",
  "shared/ios-tabbar.js",
  "shared/pwa-register.js",
  "shared/assets/favicon.svg"
];

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
