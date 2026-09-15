/**
 * Service worker de la PWA de embarque (docs/prompts/10-pwa-embarque.md).
 * Se registra con scope "/embarque/" (ver app/embarque/RegistrarServiceWorker.tsx)
 * — no toca ninguna otra ruta del sitio, incluido /panel.
 *
 * No usa un framework de PWA (next-pwa u otro): es un service worker chico
 * a mano, sin agregar una dependencia solo para esto. Cachea sobre la
 * marcha (no hay lista de build para precachear sin integrarse al bundler),
 * lo que alcanza para el objetivo real de esta tarea: que la app abra en
 * vez de mostrar el error offline del navegador. La validación de embarque
 * en sí (lib/embarque/validar.ts) no depende de este archivo — es
 * IndexedDB + JS puro, funciona sin red exista o no el service worker.
 */
const CACHE = "ecosem-embarque-v1";
const SHELL = ["/embarque", "/manifest.webmanifest", "/icon.png"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL).catch(() => undefined))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((clave) => clave !== CACHE).map((clave) => caches.delete(clave))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const esMismoOrigen = new URL(request.url).origin === self.location.origin;
  if (!esMismoOrigen) return;

  // Navegación (recargar /embarque o /embarque/[id]): red primero, y si no
  // hay red, lo último que se cacheó de esa URL o, en su defecto, el shell.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((respuesta) => {
          const copia = respuesta.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copia));
          return respuesta;
        })
        .catch(() => caches.match(request).then((match) => match || caches.match("/embarque")))
    );
    return;
  }

  // Assets (JS/CSS/imágenes del propio origen): cache primero, completando
  // el cache con lo que se vaya pidiendo.
  event.respondWith(
    caches.match(request).then((match) => {
      if (match) return match;
      return fetch(request).then((respuesta) => {
        const copia = respuesta.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copia));
        return respuesta;
      });
    })
  );
});
