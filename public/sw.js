/**
 * Brisco Marketplace — Minimal-Service-Worker.
 *
 * Hauptzweck: PWA-Installierbarkeits-Kriterium erfüllen.
 * Strategie: Network-First mit Offline-Fallback auf gecachte Shell.
 *
 * - HTML/Pages: Network-First, fallback auf Cache, sonst /offline-Stub
 * - Static Assets (Logos, Manifest, Icons): Cache-First
 * - API-Calls / Auth: bypass — immer Network
 */

const CACHE_VERSION = "brisco-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(STATIC_ASSETS).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((n) => n !== CACHE_VERSION).map((n) => caches.delete(n))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Niemals API/Auth cachen — sonst gibt's veraltete Listings/Auth-Probleme
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/data") ||
    url.pathname.includes("/auth/")
  ) {
    return;
  }

  // Static Assets: Cache-First
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/brand-logos/") ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, clone));
          }
          return res;
        });
      }),
    );
    return;
  }

  // HTML-Navigation: Network-First mit Cache-Fallback
  if (req.mode === "navigate" || (req.headers.get("accept") ?? "").includes("text/html")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match("/"))),
    );
    return;
  }
});
