/**
 * Sincronización de escaneos con svc-ventas (POST /v1/embarque/sincronizacion).
 *
 * - Idempotente: cada escaneo lleva el `scanId` que generó el dispositivo al
 *   escanear y que no cambia. Si la respuesta se pierde y se reenvía el lote,
 *   el servidor responde `alreadyRecorded` y no embarca dos veces.
 * - El servidor vuelve a verificar firma, clave, viaje y anulación; su
 *   respuesta queda guardada junto al escaneo y es la que vale.
 * - Lo que otro dispositivo embarcó antes llega como `duplicado`: la app lo
 *   muestra como conflicto, no como un embarque más.
 */
import { MAX_ESCANEOS_POR_SINCRONIZACION } from "@/lib/embarque/contrato";
import { aplicarRespuesta, escaneosPendientes, type EscaneoLocal } from "@/lib/embarque/db";
import { sincronizarEscaneos } from "@/lib/api/operacion";

export interface ResultadoSincronizacion {
  enviados: number;
  /** Embarcados aquí que el servidor dice que ya había embarcado otro dispositivo. */
  conflictos: number;
  /** Aceptados aquí que el servidor rechazó al volver a verificar. */
  rechazadosPorServidor: number;
}

/**
 * Solo lo que el dispositivo embarcó. El servidor trata cada escaneo como un
 * intento de embarque: si se enviara un rechazo local (paquete vencido, por
 * ejemplo), podría quedar "embarcado" alguien a quien no se dejó subir. Un QR
 * que no es de un boleto, además, no sale del dispositivo.
 */
export async function escaneosPorEnviar(): Promise<EscaneoLocal[]> {
  return (await escaneosPendientes()).filter((e) => e.local === "embarcado" && e.qr !== null);
}

// Una sola sincronización a la vez en toda la app: la cabecera y la pantalla
// de escaneo la piden por su cuenta.
let enCurso: Promise<ResultadoSincronizacion> | null = null;

export function sincronizarPendientes(): Promise<ResultadoSincronizacion> {
  enCurso ??= enviarPendientes().finally(() => {
    enCurso = null;
  });
  return enCurso;
}

async function enviarPendientes(): Promise<ResultadoSincronizacion> {
  const pendientes = await escaneosPorEnviar();
  const porViaje = new Map<string, EscaneoLocal[]>();
  for (const e of pendientes) porViaje.set(e.tripId, [...(porViaje.get(e.tripId) ?? []), e]);

  const resultado: ResultadoSincronizacion = { enviados: 0, conflictos: 0, rechazadosPorServidor: 0 };
  for (const [tripId, escaneos] of porViaje) {
    for (let i = 0; i < escaneos.length; i += MAX_ESCANEOS_POR_SINCRONIZACION) {
      const lote = escaneos.slice(i, i + MAX_ESCANEOS_POR_SINCRONIZACION);
      const respuesta = await sincronizarEscaneos({
        tripId,
        scans: lote.map((e) => ({ scanId: e.scanId, qr: e.qr!, scannedAt: e.scannedAt })),
      });
      await aplicarRespuesta(respuesta);
      resultado.enviados += lote.length;
      for (const r of respuesta.results) {
        if (r.result === "duplicado") resultado.conflictos += 1;
        if (r.result === "rechazado") resultado.rechazadosPorServidor += 1;
      }
    }
  }
  return resultado;
}

/** Cómo quedó un escaneo, mirando primero lo que dijo el servidor. */
export function estadoFinal(e: EscaneoLocal):
  | "embarcado"
  | "pendiente"
  | "ya-embarcado"
  | "conflicto"
  | "rechazado"
  | "rechazado-servidor" {
  if (e.local === "rechazado") return "rechazado";
  if (e.local === "ya-embarcado") return "ya-embarcado";
  if (!e.servidor) return "pendiente";
  if (e.servidor.result === "duplicado") return "conflicto";
  if (e.servidor.result === "rechazado") return "rechazado-servidor";
  return "embarcado";
}
