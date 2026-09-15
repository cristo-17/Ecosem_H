"use client";

import { useCallback, useEffect, useState } from "react";
import { listarPendientesSincronizar } from "@/lib/embarque/db";
import { sincronizarEscaneosPendientes } from "@/lib/embarque/sync";

/** Se dispara después de cada escaneo válido para que el contador de pendientes se actualice en cualquier pantalla montada. */
export const EVENTO_NUEVO_ESCANEO = "ecosem-embarque:nuevo-escaneo";

export interface EstadoSincronizacion {
  enLinea: boolean;
  pendientes: number;
  sincronizando: boolean;
  sincronizarAhora: () => Promise<void>;
}

/**
 * Estado de conexión + cola de sincronización de la PWA de embarque. Cada
 * componente que lo usa mantiene su propia copia (no hay Context: el
 * origen de verdad es IndexedDB, no memoria compartida) y se refresca solo
 * con los eventos `online`/`offline` del navegador y `EVENTO_NUEVO_ESCANEO`.
 */
export function useEstadoSincronizacion(): EstadoSincronizacion {
  // Inicializador perezoso (no un setState dentro del efecto): en SSR
  // `navigator` no existe, así que se asume en línea hasta que el efecto de
  // abajo confirme el valor real ya en el cliente.
  const [enLinea, setEnLinea] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [pendientes, setPendientes] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);

  const actualizarPendientes = useCallback(() => {
    listarPendientesSincronizar().then((lista) => setPendientes(lista.length));
  }, []);

  const sincronizarAhora = useCallback(async () => {
    if (!navigator.onLine) return;
    setSincronizando(true);
    try {
      await sincronizarEscaneosPendientes();
    } finally {
      setSincronizando(false);
      actualizarPendientes();
    }
  }, [actualizarPendientes]);

  useEffect(() => {
    actualizarPendientes();

    function handleOnline() {
      setEnLinea(true);
      // Al recuperar señal, sincronizar automáticamente (pedido explícito del prompt).
      sincronizarAhora();
    }
    function handleOffline() {
      setEnLinea(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener(EVENTO_NUEVO_ESCANEO, actualizarPendientes);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(EVENTO_NUEVO_ESCANEO, actualizarPendientes);
    };
  }, [actualizarPendientes, sincronizarAhora]);

  return { enLinea, pendientes, sincronizando, sincronizarAhora };
}
