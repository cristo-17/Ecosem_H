"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { escaneosPorEnviar, sincronizarPendientes } from "@/lib/embarque/sync";
import { EVENTO_EMBARQUE } from "@/lib/embarque/escanear";
import { esSesionVencida } from "@/lib/api/cuenta";

/** Con señal y pendientes, se reintenta cada tanto aunque nadie escanee. */
const INTERVALO_SINCRONIZACION_MS = 30_000;

export interface EstadoSincronizacion {
  enLinea: boolean;
  pendientes: number;
  sincronizando: boolean;
  /** El token venció: los escaneos siguen guardados, hay que volver a ingresar para subirlos. */
  sesionVencida: boolean;
  sincronizarAhora: () => Promise<void>;
}

/**
 * Conexión y cola de sincronización. La fuente de verdad es IndexedDB; cada
 * componente que usa el hook tiene su copia y se refresca con los eventos
 * `online`/`offline` y `EVENTO_EMBARQUE`. Con señal, sincroniza al volver la
 * conexión, después de cada escaneo y cada 30 segundos si queda algo.
 */
function suscribirConexion(avisar: () => void) {
  window.addEventListener("online", avisar);
  window.addEventListener("offline", avisar);
  return () => {
    window.removeEventListener("online", avisar);
    window.removeEventListener("offline", avisar);
  };
}

export function useEstadoSincronizacion(): EstadoSincronizacion {
  // En el servidor se asume en línea: Node 21+ tiene un `navigator` global sin
  // `onLine`, y leerlo ahí pintaba "Sin conexión" y rompía la hidratación.
  const enLinea = useSyncExternalStore(
    suscribirConexion,
    () => navigator.onLine,
    () => true,
  );
  const [pendientes, setPendientes] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);
  const [sesionVencida, setSesionVencida] = useState(false);

  const actualizarPendientes = useCallback(() => {
    escaneosPorEnviar().then(
      (lista) => setPendientes(lista.length),
      () => undefined,
    );
  }, []);

  const sincronizarAhora = useCallback(async () => {
    if (!navigator.onLine) return;
    setSincronizando(true);
    try {
      const { enviados } = await sincronizarPendientes();
      setSesionVencida(false);
      if (enviados > 0) window.dispatchEvent(new Event(EVENTO_EMBARQUE));
    } catch (error) {
      // Sin señal real o servidor caído: queda pendiente y se reintenta.
      if (esSesionVencida(error)) setSesionVencida(true);
    } finally {
      setSincronizando(false);
      actualizarPendientes();
    }
  }, [actualizarPendientes]);

  useEffect(() => {
    actualizarPendientes();
    const alCambiar = () => {
      actualizarPendientes();
      if (navigator.onLine) void sincronizarAhora();
    };
    const alConectar = () => void sincronizarAhora();
    const intervalo = window.setInterval(() => {
      if (navigator.onLine) void sincronizarAhora();
    }, INTERVALO_SINCRONIZACION_MS);

    window.addEventListener("online", alConectar);
    window.addEventListener(EVENTO_EMBARQUE, alCambiar);
    return () => {
      window.clearInterval(intervalo);
      window.removeEventListener("online", alConectar);
      window.removeEventListener(EVENTO_EMBARQUE, alCambiar);
    };
  }, [actualizarPendientes, sincronizarAhora]);

  return { enLinea, pendientes, sincronizando, sesionVencida, sincronizarAhora };
}
