/**
 * Caja de counter contra svc-ventas: turno, venta en efectivo y arqueo. Cada
 * petición va con el token del operador; el servicio comprueba que sea
 * personal activo y la base decide qué turno y qué movimientos son suyos (RLS
 * por operador). Esta pantalla no elige agencia, turno ni usuario.
 *
 * Lo que este archivo NO hace, a propósito:
 * - Confirmar el cobro por separado. En efectivo, asiento, cobro y compra se
 *   confirman en una sola transacción del backend (`ventas.vender_en_efectivo`),
 *   o no pasa nada. No hay webhook ni segundo paso.
 * - Calcular el total o el vuelto que valen. Los dos los devuelve la venta.
 */
import type {
  BillTo,
  PassengerData,
} from "@/lib/types/contratos-frontend";
import { ApiError, type OpcionesPeticion } from "@/lib/api/cliente";
import { conCuenta } from "@/lib/api/cuenta";
import { mensajeCompra, type MensajeError } from "@/lib/api/compra";

// ----- Copia a mano de `_shared/contratos/ventas.ts` (Caja, B-05) del backend.
// El generador del contrato del frontend deja fuera, a propósito, las formas
// de los paneles de personal (D-046 del backend). Hasta que el backend decida
// publicarlas, estas copias tienen que seguir al contrato: si cambia allá,
// cambia aquí.

export type MedioPagoCaja = "efectivo" | "tarjeta" | "yape" | "plin";

/** POST /v1/caja/turnos */
export interface AbrirTurnoRespuesta {
  shiftId: string;
  status: "opened" | "already_open";
}

/** GET /v1/caja/turnos/actual. Efectivo y electrónico no se suman. */
export interface ArqueoTurno {
  shiftId: string;
  /** Código de la agencia del turno. */
  terminal: string;
  openedAt: string;
  /** Lo que tiene que haber en la caja en efectivo. */
  expectedCash: string;
  breakdown: Array<{
    method: MedioPagoCaja;
    control: "cash_count" | "gateway_reconciliation";
    movements: number;
    income: string;
    outflow: string;
    net: string;
  }>;
}

/** POST /v1/caja/turnos/actual/cierre */
export interface CierreTurno {
  shiftId: string;
  expectedCash: string;
  countedCash: string;
  /** Contado menos esperado. Positiva: sobrante. Negativa: faltante. */
  difference: string;
}

/** POST /v1/caja/ventas */
export interface VentaEfectivoPedido {
  tripId: string;
  seats: string[];
  cashReceived: number;
  passengers: Array<PassengerData & { seat: string }>;
  dataAuthorization: true;
  billTo?: BillTo | null;
}

export interface VentaEfectivo {
  purchaseId: string;
  purchaseCode: string;
  tripId: string;
  seats: string[];
  totalAmount: string;
  /** Vuelto. */
  change: string;
  currency: "PEN";
}

// ----- Peticiones

/** Un supervisor sin agencia tiene que decir en cuál abre; un counter abre en la suya. */
export function abrirTurno(terminal: string | null = null, opciones: OpcionesPeticion = {}) {
  return conCuenta<AbrirTurnoRespuesta>("/v1/caja/turnos", {
    ...opciones,
    metodo: "POST",
    cuerpo: { terminal },
  });
}

/** Arqueo del turno abierto de quien llama. Sin turno: `SHIFT_REQUIRED`. */
export function arqueoTurnoActual(opciones: OpcionesPeticion = {}) {
  return conCuenta<ArqueoTurno>("/v1/caja/turnos/actual", opciones);
}

export function cerrarTurno(
  efectivoContado: number,
  nota: string | null,
  opciones: OpcionesPeticion = {},
) {
  return conCuenta<CierreTurno>("/v1/caja/turnos/actual/cierre", {
    ...opciones,
    metodo: "POST",
    cuerpo: { countedCash: efectivoContado, note: nota },
  });
}

/**
 * Asiento, cobro y compra en una sola transacción. Un 503 se reintenta
 * (`pedirJson`): el backend lo da solo si no llegó a conectarse a la base, así
 * que no se vendió nada. Cualquier otra falla de red NO se reintenta sola: la
 * venta pudo haberse hecho (ver `ventaPudoRegistrarse`).
 */
export function venderEnEfectivo(pedido: VentaEfectivoPedido, opciones: OpcionesPeticion = {}) {
  return conCuenta<VentaEfectivo>("/v1/caja/ventas", {
    ...opciones,
    metodo: "POST",
    cuerpo: pedido,
  });
}

/**
 * Un monto en soles tal como lo escribe el operador ("40", "40.5", "40,50").
 * Nulo si no es un monto: más de dos decimales, negativo o vacío.
 */
export function leerMonto(texto: string): number | null {
  const limpio = texto.trim().replace(",", ".");
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(limpio)) return null;
  return Number(limpio);
}

export const ETIQUETA_MEDIO: Record<MedioPagoCaja, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  yape: "Yape",
  plin: "Plin",
};

export function esSinTurno(error: unknown): boolean {
  return error instanceof ApiError && error.codigo === "SHIFT_REQUIRED";
}

/**
 * Se cortó la conexión o se agotó el tiempo después de enviar la venta: no se
 * sabe si el backend la hizo. Cobrar de nuevo sin revisar podría cobrar dos
 * veces al pasajero.
 */
export function ventaPudoRegistrarse(error: unknown): boolean {
  return error instanceof ApiError && (error.tipo === "red" || error.tipo === "tiempo");
}

/** Qué decirle al operador por cada error de caja. Lo demás, como en la compra web. */
export function mensajeCaja(error: unknown): MensajeError {
  if (error instanceof ApiError) {
    switch (error.codigo) {
      case "SHIFT_REQUIRED":
        return {
          titulo: "No tienes un turno abierto",
          descripcion: "Abre tu turno en Caja antes de cobrar. Todo cobro tiene que entrar a un arqueo.",
        };
      case "INSUFFICIENT_CASH":
        return {
          titulo: "El efectivo recibido no alcanza",
          descripcion: error.detalles?.totalAmount
            ? `El total de esta venta es S/ ${error.detalles.totalAmount}. No se vendió nada.`
            : "El monto recibido es menor que el total. No se vendió nada.",
        };
      case "DATA_AUTHORIZATION_REQUIRED":
        return {
          titulo: "Falta la declaración de autorización",
          descripcion: "Marca que el pasajero te autorizó a registrar sus datos.",
        };
      case "INFANT_NOT_ELIGIBLE":
        return {
          titulo: "Revisa los datos del menor en brazos",
          descripcion: "Solo un niño menor de 5 años al día del viaje puede ir en brazos de un adulto.",
        };
      case "FORBIDDEN":
      case "STAFF_VERIFICATION_UNAVAILABLE":
        return {
          titulo: "Tu cuenta no puede operar la caja",
          descripcion:
            error.codigo === "FORBIDDEN"
              ? "Tu cuenta no figura como personal activo de counter. Habla con tu supervisor."
              : "No pudimos verificar tu cuenta de personal. Intenta nuevamente en unos segundos.",
        };
      case "VALIDATION":
        return { titulo: "Revisa los datos", descripcion: error.message };
    }
  }
  return mensajeCompra(error);
}
