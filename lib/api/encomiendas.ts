/**
 * Encomiendas contra svc-encomiendas: cotización y rastreo (públicos), y el
 * registro, los estados y la entrega (personal, con su token).
 *
 * Lo que este archivo NO hace, a propósito:
 * - Calcular un monto. La cotización y el total los da el backend con el
 *   tarifario vigente; sin tarifa para la ruta o el peso, no hay monto.
 * - Decidir quién puede qué. El servicio verifica el rol y la agencia, y la
 *   base (RLS) solo deja leer encomiendas de la agencia de origen o destino.
 * - Asociar una encomienda a una cuenta. Ninguna operación del backend lo hace
 *   todavía, y no se suple con el DNI ni el correo (D-048, D-050).
 */
import type {
  DocumentKind,
  ParcelStatus,
  ParcelTrackingResponse,
} from "@/lib/types/contratos-frontend";
import { ApiError, pedirJson, type OpcionesPeticion } from "@/lib/api/cliente";
import { conCuenta } from "@/lib/api/cuenta";
import { mensajeCaja, type MedioPagoCaja } from "@/lib/api/caja";
import type { MensajeError } from "@/lib/api/compra";

// ----- Copia a mano de `_shared/contratos/encomiendas.ts` del backend (B-08).
// El contrato generado para el frontend solo trae el rastreo (D-046 del
// backend). Si cambia allá, cambia aquí.

export type DocumentoEncomienda = DocumentKind | "ruc";

/** POST /v1/encomiendas/cotizacion. Público. Agencias por su código. */
export interface PedidoCotizacion {
  origin: string;
  destination: string;
  weightKg: number;
  /** Las tres o ninguna, en centímetros. */
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  declaredValue?: number | null;
}

export interface Cotizacion {
  realWeightKg: string;
  volumetricWeightKg: string | null;
  billableWeightKg: string;
  billedBy: "real" | "volumetrico";
  volumetricDivisor: number;
  range: { fromKg: string; toKg: string; price: string };
  declaredValue: string | null;
  surchargePercent: string | null;
  surcharge: string;
  total: string;
  currency: "PEN";
}

export interface PersonaEncomienda {
  name: string;
  documentType: DocumentoEncomienda;
  documentNumber: string;
  phone?: string;
}

/** POST /v1/encomiendas. Counter de la agencia de origen: registra y cobra. */
export interface PedidoRegistro extends PedidoCotizacion {
  sender: PersonaEncomienda & { whatsappOptIn?: boolean };
  recipient: PersonaEncomienda;
  receipt: { type: "boleta" | "factura"; ruc?: string; name?: string };
  payment: { method: MedioPagoCaja; cashReceived?: number };
}

export interface Registro {
  parcelId: string;
  trackingCode: string;
  quote: Cotizacion;
  change: string | null;
  status: ParcelStatus;
}

/** GET /v1/encomiendas/guia/:guia. Personal de la agencia de origen o de destino. */
export interface DetalleEncomienda {
  parcelId: string;
  trackingCode: string;
  origin: string;
  destination: string;
  status: ParcelStatus;
  sender: { name: string; documentType: DocumentoEncomienda; documentNumber: string; phone: string | null };
  recipient: {
    name: string;
    documentType: DocumentoEncomienda | null;
    documentNumber: string | null;
    phone: string | null;
  };
  quote: Cotizacion;
  payment: { method: MedioPagoCaja; confirmedAt: string };
  receipt: {
    type: "boleta" | "factura";
    status: "pendiente" | "emitido" | "rechazado" | "fallido" | "anulado";
    series: string | null;
    number: string | null;
  };
  cancellation: { at: string; reason: string; refundResolved: boolean } | null;
  delivery: { at: string; deliveredBy: string; documentType: DocumentoEncomienda } | null;
  events: ParcelTrackingResponse["events"];
}

/** Los estados que se marcan a mano, en orden. `entregada` va por la entrega. */
export type EstadoManual = "alistando" | "en_camino" | "en_destino";

// ----- Públicas

export function cotizar(pedido: PedidoCotizacion, opciones: OpcionesPeticion = {}) {
  return pedirJson<Cotizacion>("encomiendas", "/v1/encomiendas/cotizacion", {
    ...opciones,
    metodo: "POST",
    cuerpo: pedido,
  });
}

/** Sin cuenta. Devuelve ruta, estado y eventos; nunca nombres, documentos ni teléfonos. */
export function rastrear(guia: string, opciones: OpcionesPeticion = {}) {
  return pedirJson<ParcelTrackingResponse>(
    "encomiendas",
    `/v1/encomiendas/rastreo/${encodeURIComponent(guia.trim())}`,
    opciones,
  );
}

// ----- Personal

/**
 * Registra y cobra. Si la caja de ventas no confirma a tiempo, el backend deja
 * la encomienda pendiente y responde `PAYMENT_UNCONFIRMED` con su guía: se
 * reintenta con `reintentarCobro`, que nunca cobra dos veces.
 */
export function registrarEncomienda(pedido: PedidoRegistro, opciones: OpcionesPeticion = {}) {
  return conCuenta<Registro>(
    "/v1/encomiendas",
    { ...opciones, metodo: "POST", cuerpo: pedido },
    "encomiendas",
  );
}

export function reintentarCobro(parcelId: string, opciones: OpcionesPeticion = {}) {
  return conCuenta<{ parcelId: string; trackingCode: string; status: ParcelStatus }>(
    `/v1/encomiendas/${encodeURIComponent(parcelId)}/cobro`,
    { ...opciones, metodo: "POST" },
    "encomiendas",
  );
}

/** Lo que trae quien recoge es la guía: con ella se busca el detalle. */
export function buscarPorGuia(guia: string, opciones: OpcionesPeticion = {}) {
  return conCuenta<DetalleEncomienda>(
    `/v1/encomiendas/guia/${encodeURIComponent(guia.trim())}`,
    opciones,
    "encomiendas",
  );
}

/** El supervisor indica la agencia; el counter marca en la suya. */
export function marcarEstado(
  parcelId: string,
  status: EstadoManual,
  terminal: string | null,
  opciones: OpcionesPeticion = {},
) {
  return conCuenta<{ parcelId: string; status: ParcelStatus }>(
    `/v1/encomiendas/${encodeURIComponent(parcelId)}/estado`,
    { ...opciones, metodo: "POST", cuerpo: { status, ...(terminal ? { terminal } : {}) } },
    "encomiendas",
  );
}

/**
 * Entrega con el documento que muestra quien recoge. Va en el cuerpo, nunca en
 * la URL (Ley 29733). El backend lo compara con el del destinatario registrado.
 */
export function entregarEncomienda(
  parcelId: string,
  documento: { documentType: DocumentoEncomienda; documentNumber: string },
  terminal: string | null,
  opciones: OpcionesPeticion = {},
) {
  return conCuenta<{ parcelId: string; status: ParcelStatus }>(
    `/v1/encomiendas/${encodeURIComponent(parcelId)}/entrega`,
    {
      ...opciones,
      metodo: "POST",
      cuerpo: { ...documento, ...(terminal ? { terminal } : {}) },
    },
    "encomiendas",
  );
}

/** El siguiente estado que se marca a mano, o nulo si ya no hay. */
export function siguienteEstado(estado: ParcelStatus): EstadoManual | null {
  switch (estado) {
    case "registrada":
      return "alistando";
    case "alistando":
      return "en_camino";
    case "en_camino":
      return "en_destino";
    default:
      return null;
  }
}

export const ETIQUETA_ESTADO: Record<ParcelStatus, string> = {
  registrada: "Registrada",
  alistando: "Alistando",
  en_camino: "En camino",
  en_destino: "En la agencia de destino",
  entregada: "Entregada",
  cancelada: "Cancelada",
};

export function esCobroSinConfirmar(error: unknown): error is ApiError {
  return error instanceof ApiError && error.codigo === "PAYMENT_UNCONFIRMED";
}

export function mensajeEncomienda(error: unknown): MensajeError {
  if (error instanceof ApiError) {
    switch (error.codigo) {
      case "ROUTE_UNKNOWN":
        return {
          titulo: "No hay una ruta activa entre esas agencias",
          descripcion: "Elige otro origen o destino.",
        };
      case "ROUTE_UNVERIFIABLE":
        return {
          titulo: "No pudimos verificar la ruta",
          descripcion: "El servicio de ventas no respondió. Intenta nuevamente en unos segundos.",
        };
      case "PARCEL_RATE_NOT_DEFINED":
        return {
          titulo: "Esta ruta todavía no tiene tarifa de encomiendas",
          descripcion: "No se puede cotizar ni registrar hasta que la empresa la defina.",
        };
      case "PARCEL_WEIGHT_OUT_OF_RANGE":
        return {
          titulo: "El peso está fuera de los rangos de la tarifa",
          descripcion: "Para ese peso no hay un precio definido en esta ruta.",
        };
      case "DECLARED_VALUE_SURCHARGE_NOT_DEFINED":
        return {
          titulo: "Todavía no se puede declarar valor",
          descripcion: "El recargo por valor declarado no está definido. Registra sin valor declarado o consulta a tu supervisor.",
        };
      case "PARCEL_TRANSITION_INVALID":
        return {
          titulo: "Ese cambio de estado ya no corresponde",
          descripcion: "Alguien la actualizó mientras tanto. Volvimos a cargar la encomienda.",
        };
      case "PARCEL_WRONG_AGENCY":
        return {
          titulo: "No corresponde a tu agencia",
          descripcion: "Este paso se hace en la agencia de origen o de destino de la encomienda, según el estado.",
        };
      case "DELIVERY_DOCUMENT_MISMATCH":
        return {
          titulo: "El documento no es el del destinatario",
          descripcion: "No se entregó. Solo puede recogerla la persona registrada como destinataria, con su documento.",
        };
      case "PAYMENT_UNCONFIRMED":
        return {
          titulo: "El cobro no se pudo confirmar",
          descripcion: "Reintenta el cobro: si ya se había registrado, no se cobra dos veces.",
        };
      case "PAYMENT_WINDOW_EXPIRED":
        return {
          titulo: "Pasó el plazo para reintentar el cobro",
          descripcion: "El sistema lo resolverá con la caja en unos minutos. No cobres de nuevo.",
        };
      case "CASH_REGISTER_UNAVAILABLE":
        return {
          titulo: "La caja no respondió",
          descripcion: "No se registró ni se cobró nada. Intenta nuevamente.",
        };
      case "TRACKING_CODE_INVALID":
        return {
          titulo: "Ese número de guía no es válido",
          descripcion: "Revisa que esté bien escrito: tiene la forma EH-XXXX-XXXX.",
        };
      case "NOT_FOUND":
        return {
          titulo: "No encontramos esa encomienda",
          descripcion: "Revisa la guía. Solo ves las encomiendas que salen de tu agencia o llegan a ella.",
        };
    }
  }
  return mensajeCaja(error);
}
