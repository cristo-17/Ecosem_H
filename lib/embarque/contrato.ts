/**
 * Copia a mano de `_shared/contratos/ventas.ts` del backend (B-07, B-16): lo
 * que la app de embarque y el panel de viajes piden a svc-ventas. El contrato
 * generado para el frontend deja fuera las formas de personal (D-046 del
 * backend); si cambian allá, cambian aquí.
 *
 * Sin imports con alias: `lib/embarque/qr.ts` y `lib/embarque/decidir.ts` se
 * prueban también fuera de Next, contra el backend real.
 */

export type EstadoViajeOperacion = "programado" | "en_ruta" | "completado" | "cancelado";

/** GET /v1/operacion/viajes?fecha=<AAAA-MM-DD>[&agencia=<código>] */
export interface ViajesOperacion {
  date: string;
  trips: Array<{
    tripId: string;
    route: string;
    departsAt: string;
    arrivesAt: string | null;
    arrivalProvisional: boolean;
    status: EstadoViajeOperacion;
    serviceType: "economico" | "ejecutivo" | "vip";
    bus: { unit: string; plate: string } | null;
    seats: { total: number; sold: number; held: number; free: number };
    fictitious: boolean;
  }>;
}

export interface BoletoDeViaje {
  purchaseCode: string;
  /** Código del asiento, p. ej. `P1-3A`. */
  seat: string;
}

/**
 * GET /v1/embarque/viajes/:id/paquete. Lo que el dispositivo necesita para
 * validar sin conexión. Vence a las 24 horas.
 */
export interface PaqueteEmbarque {
  tripId: string;
  departsAt: string;
  status: EstadoViajeOperacion;
  issuedAt: string;
  validUntil: string;
  /** Claves públicas que verifican boletos de este viaje. Una revocada no viene. */
  keys: Array<{ kid: string; publicKey: JsonWebKey; retired: boolean }>;
  /** Boletos de compras anuladas: no embarcan. */
  revoked: BoletoDeViaje[];
  /** Ya embarcados, según lo sincronizado por cualquier dispositivo. */
  boarded: BoletoDeViaje[];
  /** Menores de 18 el día del viaje. Sin nombres. */
  minors: Array<BoletoDeViaje & { ageAtTrip: number }>;
  /** Quien lleva un menor en brazos; la edad es la del menor. Sin nombres. */
  infantsInArms: Array<BoletoDeViaje & { ageAtTrip: number }>;
}

/** POST /v1/embarque/sincronizacion. Hasta 500 escaneos por vez. */
export interface PedidoSincronizacion {
  tripId: string;
  scans: Array<{ scanId: string; qr: string; scannedAt: string }>;
}

export type MotivoRechazoServidor =
  | "firma_invalida"
  | "clave_desconocida"
  | "clave_revocada"
  | "clave_retirada"
  | "otro_viaje"
  | "viaje_cancelado"
  | "boleto_desconocido"
  | "boleto_anulado";

export interface RespuestaSincronizacion {
  tripId: string;
  results: Array<{
    scanId: string;
    result: "embarcado" | "duplicado" | "rechazado";
    reason: MotivoRechazoServidor | null;
    /** true si ese escaneo ya se había recibido antes. */
    alreadyRecorded: boolean;
  }>;
}

export const MAX_ESCANEOS_POR_SINCRONIZACION = 500;

// ----- Manifiesto (B-16)

export type TipoDocumento = "dni" | "carne_extranjeria" | "pasaporte";

export interface VersionManifiesto {
  version: number;
  generatedBy: string;
  generatedByName: string | null;
  generatedAt: string;
  fingerprint: string | null;
  changes: { first: true } | { unchanged: boolean; [campo: string]: unknown };
}

/** GET /v1/operacion/viajes/:id/manifiestos */
export interface VersionesManifiesto {
  tripId: string;
  versions: VersionManifiesto[];
}

/**
 * GET /v1/operacion/viajes/:id/manifiestos/:version. Lleva el documento
 * COMPLETO de cada pasajero: va al PDF (D-052). En pantalla, enmascarado.
 */
export interface Manifiesto extends VersionManifiesto {
  tripId: string;
  content: {
    trip: {
      id: string;
      origin: string;
      destination: string;
      serviceType: "economico" | "ejecutivo" | "vip";
      departsAt: string;
      estimatedArrival: string | null;
      arrivalProvisional: boolean;
    };
    bus: {
      unit: string;
      plate: string;
      make: string;
      model: string;
      authorizationNumber: string | null;
      maxSeats: number;
    };
    drivers: Array<{
      assignmentId: string;
      driverId: string;
      firstNames: string;
      lastNames: string;
      licenseNumber: string;
      licenseExpiresOn: string;
    }>;
    requiredDrivers: { required: number; ruleConfirmed: boolean; shift: "diurno" | "nocturno" };
    passengers: Array<{
      seat: string;
      firstNames: string;
      lastNames: string;
      documentType: TipoDocumento;
      documentNumber: string;
      ageAtTrip: number;
      minor: boolean;
      companion: { name: string; relationship: string } | null;
      origin: string;
      destination: string;
      ticket: { series: string; number: string; issued: boolean } | null;
      amount: string;
      boarded: boolean;
      boardedAt: string | null;
    }>;
    infantsInArms: Array<{
      carrierSeat: string;
      firstNames: string;
      lastNames: string;
      documentType: TipoDocumento;
      documentNumber: string;
      ageAtTrip: number;
      carrierFirstNames: string;
      carrierLastNames: string;
      relationship: string;
    }>;
    ticketsWithoutNumber: string[];
    driverSignature: null;
  };
}
