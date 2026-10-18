// GENERADO: no editar a mano. Se regenera con `deno task contratos:frontend`
// en el repositorio del backend (D-046), desde `supabase/functions/_shared/contratos`.
//
// Solo lo que el navegador consume: búsqueda, viajes, asientos, reserva, pago,
// boleto y rastreo de encomienda, más el formato de error y cómo reintentar un
// 503 (D-044). Las rutas internas entre servicios no están aquí.

// ----- De _shared/contratos/mod.ts

export const API_VERSION = 'v1';

/** Espera base de un 503, en segundos. Va en `Retry-After` y en el cuerpo. */
export const SERVICE_BUSY_RETRY_AFTER_SECONDS = 2;

/** Reintentos de un 503 antes de mostrar el error. */
export const RETRY_MAX_ATTEMPTS = 4;

/** Ninguna espera pasa de esto. */
export const RETRY_MAX_DELAY_MS = 30_000;

/**
 * Cuánto esperar antes del reintento número `attempt` (1, 2, 3...). Duplica la
 * base en cada intento hasta el tope, y elige al azar entre la mitad y el total.
 * Nunca es menos de la mitad de `Retry-After`: con espera aleatoria pura,
 * algunos clientes reintentarían casi de inmediato.
 */
export function retryDelayMs(
  attempt: number,
  retryAfterSeconds: number = SERVICE_BUSY_RETRY_AFTER_SECONDS,
  random: () => number = Math.random,
): number {
  const base = Math.max(1, retryAfterSeconds) * 1000;
  const ceiling = Math.min(RETRY_MAX_DELAY_MS, base * 2 ** (Math.max(1, Math.floor(attempt)) - 1));
  return Math.round(ceiling / 2 + random() * (ceiling / 2));
}

export type ErrorCode =
  | 'VALIDATION'
  // Falta el token de acceso o no es válido (B-14).
  | 'UNAUTHENTICATED'
  // Token válido, pero sin el rol que hace falta.
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  // Falta el token de sesión de compra, es inválido o venció. Se pide otro.
  | 'SESSION_REQUIRED'
  // Inventario (B-03).
  | 'TRIP_UNAVAILABLE'
  | 'SEAT_UNAVAILABLE'
  | 'SEAT_LIMIT_EXCEEDED'
  | 'FARE_NOT_DEFINED'
  | 'RESERVATION_NOT_ACTIVE'
  // Pagos y caja (B-05).
  | 'WEBHOOK_SIGNATURE_INVALID'
  | 'PAYMENT_UNAVAILABLE'
  | 'SHIFT_REQUIRED'
  | 'INSUFFICIENT_CASH'
  | 'CASH_MOVEMENT_CONFLICT'
  // Datos del pasajero (B-15).
  | 'PASSENGERS_REQUIRED'
  | 'DATA_AUTHORIZATION_REQUIRED'
  | 'MINOR_COMPANION_REQUIRED'
  // Conductores, menores en brazos y manifiesto (B-16).
  | 'INFANT_NOT_ELIGIBLE'
  | 'DRIVER_OVERLAP'
  | 'DRIVER_LICENSE_EXPIRED'
  | 'TRIP_ARRIVAL_UNKNOWN'
  | 'DRIVERS_MISSING'
  | 'MANIFEST_NOT_GENERABLE'
  // Programación de viajes (B-13).
  | 'TRIP_NOT_MODIFIABLE'
  | 'BUS_CHANGE_REJECTED'
  // QR y embarque (B-07).
  | 'BOARDING_KEY_UNAVAILABLE'
  // Facturación (B-06).
  | 'RECEIPT_NOT_RETRYABLE'
  | 'RECEIPT_CONFLICT'
  // Encomiendas (B-08).
  | 'ROUTE_UNKNOWN'
  | 'ROUTE_UNVERIFIABLE'
  | 'PARCEL_RATE_NOT_DEFINED'
  | 'PARCEL_WEIGHT_OUT_OF_RANGE'
  | 'DECLARED_VALUE_SURCHARGE_NOT_DEFINED'
  | 'PARCEL_TRANSITION_INVALID'
  | 'PARCEL_WRONG_AGENCY'
  | 'PARCEL_NOT_CANCELLABLE'
  | 'DELIVERY_DOCUMENT_MISMATCH'
  | 'PAYMENT_UNCONFIRMED'
  | 'CASH_REGISTER_UNAVAILABLE'
  | 'PAYMENT_WINDOW_EXPIRED'
  | 'TRACKING_CODE_INVALID'
  // Personal activo, consultado a ventas antes de una escritura (D-032).
  | 'STAFF_VERIFICATION_UNAVAILABLE'
  // Flota (B-09).
  | 'MILEAGE_DECREASED'
  | 'ALERT_ALREADY_ATTENDED'
  | 'FLEET_UNAVAILABLE'
  | 'DRIVER_INACTIVE'
  | 'BUS_CAPACITY_MISMATCH'
  // Documentos versionados de las unidades (D-034).
  | 'DOCUMENT_REASON_REQUIRED'
  | 'DOCUMENT_RENEWAL_NOT_LATER'
  // El pooler rechazó la conexión (techo de clientes, D-001). No se vendió nada.
  | 'SERVICE_BUSY'
  // Postgres abortó la transacción por un deadlock o un conflicto de
  // serialización (D-036): otra operación sobre lo mismo en el mismo instante.
  // Reintentable; nunca un 500.
  | 'REFUND_IN_PROGRESS'
  | 'CONCURRENT_CONFLICT'
  | 'INTERNAL';

/** Datos que acompañan a un error para que el cliente pueda actuar. Sin datos personales. */
export interface ErrorDetails {
  /** Con SEAT_UNAVAILABLE: los asientos que ya no están libres. */
  unavailableSeats?: string[];
  /** Con VALIDATION por asientos que no existen en el viaje. */
  unknownSeats?: string[];
  /** Con SEAT_LIMIT_EXCEEDED: el máximo de asientos que se pueden retener sin pagar. */
  maxSeats?: number;
  /** Con SEAT_LIMIT_EXCEEDED: los que ya se retienen dentro de ese alcance. */
  heldSeats?: number;
  /**
   * Con SEAT_LIMIT_EXCEEDED: qué tope se alcanzó. `session`, el de esta sesión
   * de compra; `network`, el de todas las sesiones de la misma red.
   */
  limitScope?: 'session' | 'network';
  /** Con INSUFFICIENT_CASH: lo que cuesta la venta, como texto decimal. */
  totalAmount?: string;
  /** Con PASSENGERS_REQUIRED: los asientos que todavía no tienen pasajero. */
  missingSeats?: string[];
  /** Con BUS_CHANGE_REJECTED: asientos tomados que el bus nuevo no tiene. */
  seatsWithoutPlace?: string[];
  /** Con BUS_CHANGE_REJECTED: el bus nuevo es de otro tipo de servicio y ya hay ventas. */
  serviceTypeChange?: boolean;
  /** Con DRIVER_OVERLAP: el viaje con el que se solapa. */
  conflictingTripId?: string;
  /** Con DRIVERS_MISSING: cuántos conductores exige el viaje. */
  requiredDrivers?: number;
  /** Con PAYMENT_UNCONFIRMED: la encomienda pendiente, para reintentar el cobro. */
  parcelId?: string;
  trackingCode?: string;
  /** Con MANIFEST_NOT_GENERABLE: `viaje_cancelado`, `viaje_salio` o `sin_bus`. */
  reason?: 'viaje_cancelado' | 'viaje_salio' | 'sin_bus';
}

/** Formato de error único de los cinco servicios. */
export interface ErrorBody {
  error: {
    code: ErrorCode;
    /** Mensaje para el usuario, en español. Nunca lleva datos personales. */
    message: string;
    correlationId: string;
    /** true si repetir la misma petición puede funcionar. */
    retryable: boolean;
    /**
     * Solo en SERVICE_BUSY: la espera base, igual que `Retry-After`. Va también
     * en el cuerpo porque un navegador no lee `Retry-After` de otro origen sin
     * CORS que la exponga. Se reintenta con `retryDelayMs`, nunca de inmediato.
     */
    retryAfterSeconds?: number;
    details?: ErrorDetails;
  };
}

// ----- De _shared/contratos/ventas.ts

export type ServiceType = 'economico' | 'ejecutivo' | 'vip';

/** Estado de un asiento. La disponibilidad que devuelve esta API es la única fuente de verdad. */
export type SeatStatus = 'libre' | 'reservado' | 'vendido';

/**
 * POST /v1/sesiones
 *
 * Abre una sesión de compra. No es autenticación: no identifica a una persona
 * ni exige registrarse. El token va en la cabecera `x-session-token` de las
 * peticiones de reserva.
 */
export interface SessionResponse {
  sessionToken: string;
  /** Vencimiento del token, en ISO 8601. */
  expiresAt: string;
}

/** GET /v1/viajes?ruta=<código>&fecha=<AAAA-MM-DD> */
export interface TripSummary {
  id: string;
  route: string;
  serviceType: ServiceType;
  /** Fecha y hora en ISO 8601, con zona. */
  departsAt: string;
  arrivesAt: string | null;
  /** true si la llegada sale de una duración de ruta sin confirmar (B-13). */
  arrivalProvisional: boolean;
  availableSeats: number;
  totalSeats: number;
  /**
   * Precio de un asiento en este momento, como texto decimal. Nulo si la ruta
   * todavía no tiene tarifa. Es informativo: el precio que vale es el que
   * devuelve la reserva, que queda congelado.
   */
  unitPrice: string | null;
}

/** Un factor del precio, tal como se aplicó. */
export interface PriceFactor {
  /** Multiplicador aplicado. 1 si no hay un factor configurado para el caso. */
  factor: number;
  /** Nombre del rango o de la temporada. Nulo si no hay factor configurado. */
  label: string | null;
  configured: boolean;
}

/**
 * Desglose del precio, factor por factor. Es lo que hace el precio defendible
 * ante un reclamo: tarifa base × ocupación × anticipación × temporada, acotado
 * por el mínimo y el máximo de la ruta.
 */
export interface PriceBreakdown {
  baseFare: string;
  occupancy: PriceFactor & { occupancyPct: number };
  advance: PriceFactor & { days: number };
  season: PriceFactor;
  /** Resultado de multiplicar, antes de aplicar los topes. */
  subtotal: string;
  minFare: string;
  maxFare: string;
  /** Si el precio se ajustó a un tope de la ruta, y a cuál. */
  adjustedTo: 'none' | 'min' | 'max';
  /** Precio final de un asiento. */
  unitPrice: string;
  /** true si la tarifa o algún factor es de prueba. Nunca en producción. */
  fictitious: boolean;
}

/** GET /v1/viajes/:id/precio */
export interface PriceQuoteResponse extends PriceBreakdown {
  tripId: string;
  currency: 'PEN';
}

export interface TripListResponse {
  trips: TripSummary[];
}

export interface Seat {
  /** Código del asiento, por ejemplo `P1-3A`. */
  code: string;
  deck: number;
  row: number;
  column: string;
  status: SeatStatus;
}

/** GET /v1/viajes/:id/asientos */
export interface SeatMapResponse {
  tripId: string;
  seats: Seat[];
}

/** POST /v1/reservas, con la cabecera `x-session-token`. */
export interface CreateReservationRequest {
  tripId: string;
  seats: string[];
  /**
   * Otra reserva del mismo titular, vencida o liberada, de la que llevarse los
   * pasajeros y el contacto ya cargados (B-15, D-020). Es lo que evita que quien
   * tardó más de 10 minutos en escribir los datos tenga que escribirlos de nuevo.
   */
  copyPassengersFrom?: string;
}

export interface ReservationResponse {
  reservationId: string;
  tripId: string;
  seats: string[];
  /** Momento exacto de expiración, en ISO 8601. El temporizador no lo adivina. */
  expiresAt: string;
  /** Precio congelado al reservar, como texto decimal (`70.00`). Nunca se recalcula. */
  totalAmount: string;
  currency: 'PEN';
  /** Cómo se llegó al precio de cada asiento. Congelado junto con el monto. */
  priceBreakdown: PriceBreakdown;
  /** Con `copyPassengersFrom`: cuántos pasajeros se trajeron de la otra reserva. */
  passengersCopied?: number;
}

/** DELETE /v1/reservas/:id, con la sesión que la reservó. */
export interface ReleaseReservationResponse {
  reservationId: string;
  status: 'released';
}

/**
 * POST /v1/sesiones/vincular, con el token de acceso y `x-session-token`.
 *
 * Tras iniciar sesión: lo reservado o comprado con la sesión de compra pasa a
 * ser del usuario. No cambia el precio ni la expiración.
 */
export interface LinkReservationsResponse {
  linkedReservations: number;
}

/** GET /v1/reservas, con el token de acceso. */
export interface MyReservationsResponse {
  reservations: Array<{
    reservationId: string;
    tripId: string;
    seats: string[];
    /** `held`: reservada y sin vencer. `purchased`: compra confirmada. */
    status: 'held' | 'purchased';
    expiresAt: string;
    totalAmount: string;
    currency: 'PEN';
    /**
     * Los comprobantes de una compra (B-06, D-019): un boleto de viaje por
     * asiento. Se emiten después de la compra: `pending` no es un error, la
     * compra ya está confirmada.
     */
    receipts?: Array<{
      type: DocumentType;
      /** Asiento, en un boleto de viaje. */
      seat: string | null;
      status: ReceiptStatus;
      /** Serie y número, cuando está emitido. */
      series: string | null;
      number: string | null;
    }>;
  }>;
}

export type ElectronicPaymentMethod = 'tarjeta' | 'yape' | 'plin';

/**
 * Quién asume el pago, si quiere que el boleto de viaje sustente su gasto: su
 * RUC y sus apellidos y nombres, denominación o razón social. Van en el mismo
 * boleto (RS 156-2003/SUNAT, artículo 3). **No hay factura de un pasaje**: el
 * artículo 2 prohíbe canjear boletos de viaje por facturas (D-019).
 */
export interface BillTo {
  ruc: string;
  name: string;
}

/** POST /v1/reservas/:id/pago, con la sesión de compra o el usuario que reservó. */
export interface StartPaymentRequest {
  method: ElectronicPaymentMethod;
  billTo?: BillTo | null;
}

/**
 * Lo que el cliente necesita para completar el pago en la pasarela. **Recibir
 * esta respuesta no confirma nada**: la compra se confirma solo cuando la
 * pasarela notifica al servidor.
 */
export interface StartPaymentResponse {
  reservationId: string;
  /** El precio congelado de la reserva. */
  amount: string;
  currency: 'PEN';
  provider: string;
  /** Depende de la pasarela. */
  checkout: Record<string, unknown>;
}

export type DocumentKind = 'dni' | 'carne_extranjeria' | 'pasaporte';

/** Los datos que van en el boleto de viaje (RS 156-2003, artículo 3). */
export interface TicketPassenger {
  documentType: DocumentKind;
  /** DNI: 8 dígitos. Carné de extranjería y pasaporte: 4 a 20 letras o dígitos. */
  documentNumber: string;
  firstNames: string;
  lastNames: string;
}

/**
 * Los datos de un pasajero al cargarlo. La fecha de nacimiento, no la edad: la
 * edad se calcula a la fecha del viaje (D-025).
 */
export interface PassengerData extends TicketPassenger {
  /** `AAAA-MM-DD`. */
  birthDate: string;
  /**
   * Quien acompaña al menor: solo nombre y parentesco. Obligatorio si el
   * pasajero es menor de 18 a la fecha del viaje; rechazado si no lo es.
   */
  companion?: { name: string; relationship: string } | null;
  /**
   * Un niño que no paga pasaje (menos de 5 años el día del viaje) y viaja en
   * brazos de este pasajero, que tiene que ser adulto. No ocupa asiento ni
   * cambia el precio, pero va en el manifiesto (B-16). Uno por adulto. Nulo u
   * omitido: no lleva ninguno (y se quita el que hubiera).
   */
  infantInArms?: InfantInArms | null;
}

/** El menor en brazos: sus datos y qué es suyo el adulto que lo lleva. */
export interface InfantInArms extends TicketPassenger {
  /** `AAAA-MM-DD`. */
  birthDate: string;
  /** Qué es del menor el adulto que lo lleva: madre, padre, abuela... */
  relationship: string;
}

/**
 * PUT /v1/reservas/:id/pasajeros/:asiento, con la sesión o el usuario que
 * reservó, mientras la reserva esté vigente. Guarda o corrige el pasajero de ese
 * asiento apenas se escribe: si la reserva vence, lo cargado no se pierde.
 */
export interface SavePassengerRequest extends PassengerData {
  /** Declaración de quien da los datos de que tiene autorización del pasajero (D-020). */
  dataAuthorization: true;
}

/**
 * Un pasajero, tal como se muestra en una lista: con el documento enmascarado.
 * Una lista junta datos de varias personas; el documento completo va solo en el
 * boleto de cada pasajero (D-020).
 */
export interface PassengerView {
  seat: string;
  documentType: DocumentKind;
  /** Los últimos tres caracteres; el resto, asteriscos. */
  documentNumberMasked: string;
  firstNames: string;
  lastNames: string;
  /** Edad que tendrá el día del viaje. */
  ageAtTrip: number;
  /** Menor de 18 el día del viaje: necesita permiso notarial (Condiciones Generales, punto 4). */
  minor: boolean;
  hasCompanion: boolean;
  /** El menor en brazos que lleva, con el documento enmascarado. */
  infantInArms: {
    firstNames: string;
    lastNames: string;
    documentType: DocumentKind;
    documentNumberMasked: string;
    ageAtTrip: number;
    relationship: string;
  } | null;
}

/** GET /v1/reservas/:id/pasajeros, y la respuesta de guardar uno. */
export interface ReservationPassengersResponse {
  reservationId: string;
  /** Hasta cuándo se pueden cargar o corregir. Para avisar antes de que venza. */
  expiresAt: string;
  /** `active`: se pueden cargar. `expired`: venció; se pueden llevar a una reserva nueva. */
  status: 'active' | 'expired' | 'purchased';
  passengers: PassengerView[];
  /** Asientos que todavía no tienen pasajero. Con alguno, no se puede pagar. */
  missingSeats: string[];
}

/** PUT /v1/reservas/:id/contacto: de quien compra, para entregarle sus boletos. */
export interface SaveContactRequest {
  phone?: string | null;
  email?: string | null;
  /**
   * Acepta recibir WhatsApp de la empresa (B-10, D-035): Meta exige este opt-in
   * para todo mensaje que inicia el negocio. Sin él, nada por WhatsApp. Exige
   * `phone`. El texto que lo pide, con el nombre de la empresa, lo muestra el
   * frontend.
   */
  whatsappOptIn?: boolean;
}

/**
 * GET /v1/reservas/:id/boletos, con la sesión o el usuario que compró. Un boleto
 * por pasajero: con su documento completo (el boleto lo exige, D-020) y su QR.
 */
export interface TicketsResponse {
  reservationId: string;
  purchaseCode: string;
  tickets: Array<{
    seat: string;
    passenger: TicketPassenger | null;
    trip: {
      tripId: string;
      origin: string;
      destination: string;
      departsAt: string;
      arrivesAt: string | null;
      arrivalProvisional: boolean;
      cancelled: boolean;
    };
    amount: string;
    /** El boleto de viaje como comprobante (B-06): su estado, serie y número. */
    receipt: { status: string; series: string | null; number: string | null };
    /**
     * `EH1.<kid>.<viaje>.<compra>.<asiento>.<firma>`: firma ECDSA P-256 (SHA-256,
     * r||s, base64url) sobre lo que va antes del último punto. Sin datos personales.
     */
    qr: string;
  }>;
}

// ----- De _shared/contratos/encomiendas.ts

/** GET /v1/catalogo en svc-ventas. Público: terminales y rutas. */
export interface CatalogResponse {
  terminals: Array<{ id: string; code: string; name: string; city: string }>;
  routes: Array<{ code: string; originId: string; destinationId: string; active: boolean }>;
}

/**
 * D-031: cinco estados. `en_destino` es que llegó a la agencia de destino;
 * `entregada`, que se le entregó al destinatario, con su documento verificado.
 */
export type ParcelStatus =
  | 'registrada'
  | 'alistando'
  | 'en_camino'
  | 'en_destino'
  | 'entregada'
  | 'cancelada';

/**
 * GET /v1/encomiendas/rastreo/:guia. Público, sin autenticación: lo usa el
 * destinatario. Sin datos personales: ni nombres, ni documentos, ni teléfonos.
 */
export interface ParcelTrackingResponse {
  trackingCode: string;
  origin: string;
  destination: string;
  status: ParcelStatus;
  billableWeightKg: string;
  events: Array<{ status: ParcelStatus; at: string; terminal: string }>;
}

// ----- De _shared/contratos/facturacion.ts

/**
 * Tipo de comprobante (D-019). El pasaje va en boleto de viaje
 * (RS 156-2003/SUNAT), nunca en boleta ni en factura. Boleta y factura son para
 * el exceso de equipaje y la encomienda.
 */
export type DocumentType = 'boleto_viaje' | 'boleta' | 'factura';

/** Estado del comprobante, tal como lo ve quien compró. */
export type ReceiptStatus = 'pending' | 'issued' | 'failed' | 'voided';
