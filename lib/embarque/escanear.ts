/**
 * Escanear y descargar en el dispositivo de embarque.
 *
 * `procesarEscaneo` no toca la red: lee el paquete y los escaneos de
 * IndexedDB, decide con `decidirEscaneo` (firma ECDSA con la clave pública del
 * paquete) y guarda el escaneo con su `scanId` para sincronizarlo después.
 */
import type { ViajesOperacion } from "@/lib/embarque/contrato";
import { decidirEscaneo, type Decision } from "@/lib/embarque/decidir";
import {
  escaneosDeViaje,
  guardarEscaneo,
  guardarViaje,
  obtenerViaje,
  type ViajeDescargado,
} from "@/lib/embarque/db";
import { paqueteEmbarque } from "@/lib/api/operacion";

/** Se dispara tras cada escaneo y cada sincronización, para refrescar contadores. */
export const EVENTO_EMBARQUE = "ecosem-embarque:cambio";

export async function procesarEscaneo(tripId: string, texto: string): Promise<Decision | null> {
  const descargado = await obtenerViaje(tripId);
  if (!descargado) return null;
  const embarcadosAqui = (await escaneosDeViaje(tripId))
    .filter((e) => e.local === "embarcado" && e.purchaseCode && e.seat)
    .map((e) => ({ purchaseCode: e.purchaseCode!, seat: e.seat!, scannedAt: e.scannedAt }));

  const decision = await decidirEscaneo(texto, descargado.paquete, embarcadosAqui);
  const qr = decision.qr;
  await guardarEscaneo({
    scanId: crypto.randomUUID(),
    tripId,
    qr: qr ? texto.trim() : null,
    purchaseCode: qr?.purchaseCode ?? null,
    seat: qr?.seat ?? null,
    scannedAt: new Date().toISOString(),
    local:
      decision.tipo === "embarcar"
        ? "embarcado"
        : decision.tipo === "ya-embarcado"
          ? "ya-embarcado"
          : "rechazado",
    motivo: decision.tipo === "rechazado" ? decision.motivo : null,
    sincronizado: false,
    servidor: null,
  });
  window.dispatchEvent(new Event(EVENTO_EMBARQUE));
  return decision;
}

/** Con señal: baja el paquete del viaje y lo guarda para operar sin conexión. */
export async function descargarViaje(
  viaje: ViajesOperacion["trips"][number],
  ciudades: { origen: string; destino: string },
): Promise<ViajeDescargado> {
  const paquete = await paqueteEmbarque(viaje.tripId);
  const descargado: ViajeDescargado = {
    tripId: viaje.tripId,
    paquete,
    viaje,
    ...ciudades,
    descargadoEn: new Date().toISOString(),
  };
  await guardarViaje(descargado);
  return descargado;
}

/**
 * Con señal: trae lo que embarcaron los demás dispositivos (y anulaciones y
 * claves nuevas). Sin señal, falla y queda el paquete que había.
 */
export async function actualizarPaquete(tripId: string): Promise<ViajeDescargado | null> {
  const descargado = await obtenerViaje(tripId);
  if (!descargado) return null;
  const paquete = await paqueteEmbarque(tripId);
  const nuevo = { ...descargado, paquete, descargadoEn: new Date().toISOString() };
  await guardarViaje(nuevo);
  return nuevo;
}

/** Embarcados del viaje: los que trajo el paquete más los de este dispositivo. */
export function contarEmbarcados(
  descargado: ViajeDescargado,
  escaneos: Awaited<ReturnType<typeof escaneosDeViaje>>,
): number {
  const clave = (codigo: string, asiento: string) => `${codigo}|${asiento}`;
  const todos = new Set(descargado.paquete.boarded.map((b) => clave(b.purchaseCode, b.seat)));
  for (const e of escaneos) {
    if (e.local === "embarcado" && e.purchaseCode && e.seat && e.servidor?.result !== "rechazado") {
      todos.add(clave(e.purchaseCode, e.seat));
    }
  }
  return todos.size;
}
