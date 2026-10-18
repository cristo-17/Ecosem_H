"use client";

import { useEffect, useState } from "react";
import { ahoraServidor } from "@/lib/api/cliente";
import { consultarReserva } from "@/lib/api/compra";

export type Vigencia = "activa" | "verificando" | "vencida" | "comprada";

// Cada cuánto se pregunta al backend mientras el contador corre, y cada cuánto
// cuando el contador ya llegó a cero pero el backend todavía dice "activa"
// (reloj del teléfono adelantado).
const CONSULTA_NORMAL_MS = 30_000;
const CONSULTA_EN_CERO_MS = 5_000;

/**
 * Cuánto le queda a una reserva y si sigue viva.
 *
 * El tiempo restante sale de `expiresAt`, la hora exacta que devolvió el
 * backend, nunca de contar diez minutos en el navegador. Como el reloj del
 * teléfono puede estar desfasado y una pestaña dormida congela los
 * temporizadores, el contador es solo lo que se muestra: la decisión de que
 * venció (o de que se compró) la toma el estado que devuelve el backend, que
 * se consulta cada 30 s, al volver a la pestaña y al llegar a cero.
 */
export function useVigenciaReserva(reservationId: string | null, expiresAt: string | null) {
  const [ahora, setAhora] = useState(() => ahoraServidor());
  const [vigencia, setVigencia] = useState<Vigencia>("activa");

  // Pantalla: recalcula desde la hora absoluta. Si la pestaña durmió, el
  // primer tick al despertar ya muestra el valor correcto.
  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => setAhora(ahoraServidor()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const vence = expiresAt ? Date.parse(expiresAt) : null;
  const restanteMs = vence !== null ? Math.max(0, vence - ahora) : null;
  const enCero = restanteMs === 0;

  // Verdad: el backend.
  useEffect(() => {
    if (!reservationId) return;
    let vigente = true;
    let temporizador: ReturnType<typeof setTimeout> | undefined;

    async function consultar() {
      clearTimeout(temporizador);
      try {
        const { status } = await consultarReserva(reservationId!);
        if (!vigente) return;
        if (status === "expired") return setVigencia("vencida");
        if (status === "purchased") return setVigencia("comprada");
        setVigencia(enCero ? "verificando" : "activa");
      } catch {
        // Sin red no se decide nada: se sigue mostrando el contador y se
        // vuelve a preguntar. Que la reserva venció lo dice el backend.
      }
      if (vigente) {
        temporizador = setTimeout(consultar, enCero ? CONSULTA_EN_CERO_MS : CONSULTA_NORMAL_MS);
      }
    }

    function alVolver() {
      if (document.visibilityState === "visible") {
        setAhora(ahoraServidor());
        consultar();
      }
    }

    consultar();
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("focus", alVolver);
    return () => {
      vigente = false;
      clearTimeout(temporizador);
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("focus", alVolver);
    };
  }, [reservationId, enCero]);

  return {
    restanteMs,
    vigencia: vigencia === "activa" && enCero ? ("verificando" as const) : vigencia,
  };
}
