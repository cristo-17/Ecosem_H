/**
 * Qué decide el dispositivo al escanear un QR, sin red: con el paquete del
 * viaje y los escaneos que él mismo ya hizo. El servidor vuelve a verificar
 * todo al sincronizar (BoardingSyncResponse) y su respuesta manda.
 *
 * Sin imports con alias: se prueba también fuera de Next, contra el backend.
 */
import type { BoletoDeViaje, PaqueteEmbarque } from "./contrato";
import { leerQr, verificarFirma, type QrBoleto } from "./qr";

export type MotivoRechazoLocal =
  | "formato"
  | "paquete_vencido"
  | "otro_viaje"
  | "viaje_cancelado"
  | "clave_desconocida"
  | "firma_invalida"
  | "boleto_anulado";

export type Decision =
  | {
      tipo: "embarcar";
      qr: QrBoleto;
      /** Edad del pasajero si es menor de edad el día del viaje. */
      menor: number | null;
      /** Edad del menor que lleva en brazos, si lleva uno. */
      enBrazos: number | null;
    }
  | {
      tipo: "ya-embarcado";
      qr: QrBoleto;
      /** Hora del escaneo de este dispositivo; nulo si lo embarcó otro. */
      embarcadoAqui: string | null;
    }
  | { tipo: "rechazado"; qr: QrBoleto | null; motivo: MotivoRechazoLocal };

/** Lo que el dispositivo ya aceptó de este viaje. */
export interface EmbarqueLocal extends BoletoDeViaje {
  scannedAt: string;
}

const mismoBoleto = (a: BoletoDeViaje) => (b: BoletoDeViaje) =>
  a.purchaseCode === b.purchaseCode && a.seat === b.seat;

export function paqueteVencido(paquete: PaqueteEmbarque, ahora: Date): boolean {
  return Date.parse(paquete.validUntil) <= ahora.getTime();
}

export async function decidirEscaneo(
  texto: string,
  paquete: PaqueteEmbarque,
  embarcadosAqui: EmbarqueLocal[],
  ahora: Date = new Date(),
): Promise<Decision> {
  const qr = leerQr(texto);
  if (!qr) return { tipo: "rechazado", qr: null, motivo: "formato" };
  // Un paquete viejo puede no traer anulaciones ni claves revocadas recientes.
  if (paqueteVencido(paquete, ahora)) return { tipo: "rechazado", qr, motivo: "paquete_vencido" };
  if (qr.tripId !== paquete.tripId) return { tipo: "rechazado", qr, motivo: "otro_viaje" };
  if (paquete.status === "cancelado") return { tipo: "rechazado", qr, motivo: "viaje_cancelado" };

  const clave = paquete.keys.find((k) => k.kid === qr.kid);
  if (!clave) return { tipo: "rechazado", qr, motivo: "clave_desconocida" };
  if (!(await verificarFirma(qr, clave.publicKey))) {
    return { tipo: "rechazado", qr, motivo: "firma_invalida" };
  }

  const boleto: BoletoDeViaje = { purchaseCode: qr.purchaseCode, seat: qr.seat };
  if (paquete.revoked.some(mismoBoleto(boleto))) {
    return { tipo: "rechazado", qr, motivo: "boleto_anulado" };
  }
  const aqui = embarcadosAqui.find(mismoBoleto(boleto));
  if (aqui) return { tipo: "ya-embarcado", qr, embarcadoAqui: aqui.scannedAt };
  if (paquete.boarded.some(mismoBoleto(boleto))) {
    return { tipo: "ya-embarcado", qr, embarcadoAqui: null };
  }

  return {
    tipo: "embarcar",
    qr,
    menor: paquete.minors.find(mismoBoleto(boleto))?.ageAtTrip ?? null,
    enBrazos: paquete.infantsInArms.find(mismoBoleto(boleto))?.ageAtTrip ?? null,
  };
}
