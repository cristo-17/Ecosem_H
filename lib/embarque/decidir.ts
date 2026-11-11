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
  | "paquete_incompleto"
  | "embarque_sin_configurar"
  | "embarque_no_abierto"
  | "embarque_cerrado"
  | "incidencia_reloj"
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
  const limite = Date.parse(paquete.validUntil);
  return !Number.isFinite(limite) || limite < ahora.getTime();
}

/** No deducir márgenes de la salida ni de la vigencia técnica del paquete. */
export function impedimentoTemporal(paquete: PaqueteEmbarque, ahora: Date): MotivoRechazoLocal | null {
  const emision = Date.parse(paquete.issuedAt);
  const vencimiento = Date.parse(paquete.validUntil);
  if (!paquete.packageId || !Number.isFinite(emision) || !Number.isFinite(vencimiento) ||
      !Number.isFinite(ahora.getTime()) || vencimiento < emision) return "paquete_incompleto";
  if (!paquete.boardingRuleVersion || !paquete.boardingOpensAt || !paquete.boardingClosesAt) return "embarque_sin_configurar";
  const apertura = Date.parse(paquete.boardingOpensAt);
  const cierre = Date.parse(paquete.boardingClosesAt);
  if (!Number.isFinite(apertura) || !Number.isFinite(cierre) || cierre < apertura) return "paquete_incompleto";
  if (ahora.getTime() < emision) return "incidencia_reloj";
  if (paqueteVencido(paquete, ahora)) return "paquete_vencido";
  if (ahora.getTime() < apertura) return "embarque_no_abierto";
  if (ahora.getTime() > cierre) return "embarque_cerrado";
  return null;
}

export async function decidirEscaneo(
  texto: string,
  paquete: PaqueteEmbarque,
  embarcadosAqui: EmbarqueLocal[],
  ahora: Date = new Date(),
): Promise<Decision> {
  const qr = leerQr(texto);
  if (!qr) return { tipo: "rechazado", qr: null, motivo: "formato" };
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
  const impedimento = impedimentoTemporal(paquete, ahora);
  if (impedimento) return { tipo: "rechazado", qr, motivo: impedimento };
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
