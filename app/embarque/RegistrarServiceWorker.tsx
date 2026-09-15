"use client";

import { useEffect } from "react";

/**
 * Registra el service worker solo con alcance `/embarque/` (docs/prompts/10-pwa-embarque.md):
 * así el resto del sitio (incluido /panel) no pasa por él. Sin esto, la PWA
 * no abre sin conexión — un simple `<Script>` no basta, un service worker
 * tiene que registrarse desde JS del lado del cliente.
 */
export function RegistrarServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/embarque-sw.js", { scope: "/embarque/" }).catch(() => {
      // Sin service worker, la app sigue funcionando en línea — solo se
      // pierde la posibilidad de abrir sin red. No es un error que deba
      // interrumpir nada.
    });
  }, []);

  return null;
}
