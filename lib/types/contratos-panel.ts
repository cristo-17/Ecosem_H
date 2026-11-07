// GENERADO: no editar a mano. Se regenera con `deno task contratos:frontend`
// en el repositorio del backend (D-052), desde `supabase/functions/_shared/contratos`.
//
// Lo que consumen los paneles de personal: caja de counter, operación del
// viaje, embarque, programación, precios, personal, encomiendas, flota,
// comprobantes y notificaciones. Que un tipo esté aquí no da acceso a nada: cada
// ruta exige su rol y personal activo en el servidor. Las rutas internas entre
// servicios no están aquí.

// ----- De _shared/contratos/mod.ts

/** @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta. */
export const API_VERSION = 'v1';

/** Espera base de un 503, en segundos. Va en `Retry-After` y en el cuerpo.
 * @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta.
 */
export const SERVICE_BUSY_RETRY_AFTER_SECONDS = 2;

/** Reintentos de un 503 antes de mostrar el error.
 * @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta.
 */
export const RETRY_MAX_ATTEMPTS = 4;

/** Ninguna espera pasa de esto.
 * @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta.
 */
export const RETRY_MAX_DELAY_MS = 30_000;

/**
 * Cuánto esperar antes del reintento número `attempt` (1, 2, 3...). Duplica la
 * base en cada intento hasta el tope, y elige al azar entre la mitad y el total.
 * Nunca es menos de la mitad de `Retry-After`: con espera aleatoria pura,
 * algunos clientes reintentarían casi de inmediato.

 * @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta.
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

/** @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta. */
export type ErrorCode =
  | 'VALIDATION'
  | 'STAFF_TERMINAL_REQUIRED'
  // Falta el token de acceso o no es válido (B-14).
  | 'UNAUTHENTICATED'
  // Token válido, pero sin el rol que hace falta.
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  // Falta el token de sesión de compra, es inválido o venció. Se pide otro.
  | 'SESSION_REQUIRED'
  | 'LINK_PASSENGER_REQUIRED'
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
  | 'BUS_OVERLAP'
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
  // Alta de personal por correo (D-054).
  | 'STAFF_ACCOUNT_NOT_FOUND'
  | 'STAFF_ALREADY_ACTIVE'
  // Reimpresión de boletos (D-057).
  | 'REPRINT_SHIFT_CLOSED'
  | 'PURCHASE_VOIDED'
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

/** Datos que acompañan a un error para que el cliente pueda actuar. Sin datos personales.
 * @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta.
 */
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

/** Formato de error único de los cinco servicios.
 * @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta.
 */
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

/** @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta. */
export type ServiceType = 'confort' | 'ejecutivo' | 'suite';

/** GET /v1/tarifas */
export interface FareListResponse {
  fares: Array<{
    route: string;
    /** Nulos si la ruta todavía no tiene tarifa. */
    baseFare: string | null;
    minFare: string | null;
    maxFare: string | null;
    fictitious: boolean;
  }>;
}

/** PUT /v1/tarifas/:ruta */
export interface SaveFareRequest {
  baseFare: number;
  minFare: number;
  /** Obligatorio: una ruta sin tope máximo no se puede guardar. */
  maxFare: number;
  fictitious?: boolean;
}

/** @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta. */
export type PriceFactorType = 'ocupacion' | 'anticipacion' | 'temporada';

/** Un factor configurado. Ocupación y anticipación van por rango; temporada, por fechas.
 * @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta.
 */
export interface PriceFactorConfig {
  id: string;
  type: PriceFactorType;
  label: string;
  multiplier: number;
  /** Rango `[from, to)`. `to` nulo es "en adelante". */
  rangeFrom: number | null;
  rangeTo: number | null;
  /** Fechas de salida, ambas inclusive, `AAAA-MM-DD`. */
  dateFrom: string | null;
  dateTo: string | null;
  active: boolean;
  fictitious: boolean;
}

/** GET /v1/factores-precio */
export interface PriceFactorListResponse {
  factors: PriceFactorConfig[];
}

/** POST /v1/factores-precio y PUT /v1/factores-precio/:id */
export interface SavePriceFactorRequest {
  type: PriceFactorType;
  label: string;
  multiplier: number;
  rangeFrom?: number | null;
  rangeTo?: number | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  active?: boolean;
  fictitious?: boolean;
}

/** GET /v1/auditoria-tarifas */
export interface PriceAuditResponse {
  changes: Array<{
    table: 'tarifas_ruta' | 'factores_precio';
    recordId: string;
    userId: string;
    changedAt: string;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
  }>;
}

/**
 * `embarque` (D-056): baja el paquete del viaje y sincroniza
 * escaneos, y ve los viajes de su agencia para elegir cuál. Nada de venta, caja
 * ni tarifas. Como el counter, exige agencia.

 * @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta.
 */
export type StaffRole = 'counter' | 'supervisor' | 'embarque';

/** GET /v1/personal */
export interface StaffListResponse {
  staff: Array<{
    userId: string;
    role: StaffRole;
    terminal: string | null;
    firstName: string;
    lastName: string;
    active: boolean;
  }>;
}

/**
 * POST /v1/personal. Alta por correo (D-054): la persona ya tiene cuenta en
 * Supabase Auth. Sin cuenta responde `STAFF_ACCOUNT_NOT_FOUND` y no crea nada;
 * si ya es personal activo, `STAFF_ALREADY_ACTIVE`.
 */
export interface CreateStaffRequest {
  email: string;
  role: StaffRole;
  /** Código de la agencia. Obligatorio para counter y embarque; opcional para supervisor. */
  terminal?: string | null;
  firstName: string;
  lastName: string;
}

/** Respuesta de POST /v1/personal (201). */
export interface CreateStaffResponse {
  userId: string;
}

/** PUT /v1/personal/:usuarioId */
export interface AssignStaffRoleRequest {
  role: StaffRole;
  /** Código de la agencia. Obligatorio para counter y embarque; opcional para supervisor. */
  terminal?: string | null;
  firstName: string;
  lastName: string;
}

/** @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta. */
export type ElectronicPaymentMethod = 'tarjeta' | 'yape' | 'plin';

/** @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta. */
export type PaymentMethod = ElectronicPaymentMethod | 'efectivo';

/**
 * Quién asume el pago, si quiere que el boleto de viaje sustente su gasto: su
 * RUC y sus apellidos y nombres, denominación o razón social. Van en el mismo
 * boleto (RS 156-2003/SUNAT, artículo 3). **No hay factura de un pasaje**: el
 * artículo 2 prohíbe canjear boletos de viaje por facturas (D-019).

 * @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta.
 */
export interface BillTo {
  ruc: string;
  name: string;
}

/** GET /v1/pagos/por-resolver. Solo supervisor. */
export interface PendingPaymentsResponse {
  pending: Array<{
    id: string;
    /** `payment`: cobro aprobado sin compra. `unmatched`: notificación sin reserva. */
    kind: 'payment' | 'unmatched';
    provider: string;
    transactionId: string;
    reference: string | null;
    amount: string | null;
    reason:
      | 'asiento_revendido'
      | 'reserva_ya_pagada'
      | 'monto_distinto'
      | 'sin_pasajeros'
      | 'reserva_desconocida';
    receivedAt: string;
    /**
     * D-043: un asiento revendido se devuelve solo. `pendiente`: en curso con la
     * pasarela. `rechazada`: la pasarela no la hizo y la resuelve el supervisor.
     * Las ya devueltas no aparecen en la lista.
     */
    refund?: 'pendiente' | 'rechazada';
  }>;
}

/** GET /v1/caja/conciliacion?fecha=<AAAA-MM-DD>. Solo supervisor. */
export interface ReconciliationResponse {
  date: string;
  provider: string;
  matched: number;
  onlyInSystem: Array<{ transactionId: string; amount: string }>;
  onlyInProvider: Array<{ transactionId: string; amount: string }>;
  amountMismatch: Array<{ transactionId: string; systemAmount: string; providerAmount: string }>;
}

/** POST /v1/caja/turnos */
export interface OpenShiftRequest {
  /** Código de la agencia. Solo lo usa un supervisor; el counter abre en la suya. */
  terminal?: string | null;
}

/** POST /v1/caja/turnos */
export interface OpenShiftResponse {
  shiftId: string;
  status: 'opened' | 'already_open';
}

/**
 * GET /v1/caja/turnos/actual. Arqueo del turno abierto, por medio de pago.
 *
 * Efectivo y electrónico no se suman: el efectivo se cuenta al cerrar; Yape,
 * Plin y tarjeta se concilian contra el reporte de la pasarela.
 */
export interface ShiftSummaryResponse {
  shiftId: string;
  terminal: string;
  openedAt: string;
  /** Lo que tiene que haber en la caja en efectivo. */
  expectedCash: string;
  breakdown: Array<{
    method: PaymentMethod;
    control: 'cash_count' | 'gateway_reconciliation';
    movements: number;
    income: string;
    outflow: string;
    net: string;
  }>;
}

/** POST /v1/caja/turnos/actual/cierre */
export interface CloseShiftRequest {
  /** El efectivo que contó el operador. Sin conteo no hay cierre. */
  countedCash: number;
  note?: string | null;
}

/** POST /v1/caja/turnos/actual/cierre */
export interface CloseShiftResponse {
  shiftId: string;
  expectedCash: string;
  countedCash: string;
  /** Contado menos esperado. Positiva: sobrante. Negativa: faltante. */
  difference: string;
}

/** POST /v1/caja/turnos/:id/cierre-forzado. Solo supervisor. */
export interface ForceCloseShiftRequest {
  reason: string;
}

/** POST /v1/caja/ventas */
export interface CashSaleRequest {
  tripId: string;
  seats: string[];
  cashReceived: number;
  /** Uno por asiento. Sin ellos no se vende nada (B-15). */
  passengers: Array<PassengerData & { seat: string }>;
  /** Quien da los datos declara que tiene autorización de cada pasajero (D-020). */
  dataAuthorization: true;
  billTo?: BillTo | null;
}

/** POST /v1/caja/ventas */
export interface CashSaleResponse {
  purchaseId: string;
  purchaseCode: string;
  /**
   * Con él, quien vendió pide los boletos con su QR firmado
   * (`GET /v1/reservas/:id/boletos`, D-051).
   */
  reservationId: string;
  tripId: string;
  seats: string[];
  totalAmount: string;
  /** Vuelto. */
  change: string;
  currency: 'PEN';
}

/** @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta. */
export type DocumentKind = 'dni' | 'carne_extranjeria' | 'pasaporte';

/** Los datos que van en el boleto de viaje (RS 156-2003, artículo 3).
 * @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta.
 */
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

 * @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta.
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

/** El menor en brazos: sus datos y qué es suyo el adulto que lo lleva.
 * @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta.
 */
export interface InfantInArms extends TicketPassenger {
  /** `AAAA-MM-DD`. */
  birthDate: string;
  /** Qué es del menor el adulto que lo lleva: madre, padre, abuela... */
  relationship: string;
}

/**
 * Plano de asientos, el mismo del frontend. Un asiento es `P<piso>-<fila><columna>`.
 * `sinAsiento` quita posiciones de la grilla (un baño, una escalera).

 * @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta.
 */
export interface SeatPlan {
  pisos: Array<{
    piso: 1 | 2;
    filas: number;
    columnas: string[];
    pasilloTrasIndice?: number;
    sinAsiento?: string[];
  }>;
}

/**
 * POST /v1/buses. Registra un bus, o una versión nueva de uno ya registrado
 * (misma `unit`). Un bus registrado no se modifica: los viajes ya programados
 * conservan los datos de su versión (D-022).
 */
export interface RegisterBusRequest {
  /** Identificador estable del bus físico, dentro de ventas. */
  unit: string;
  plate: string;
  brand: string;
  model: string;
  /** Pendiente de definición (docs/ESTADO.md): puede ir vacío. */
  enablementNumber?: string | null;
  serviceType: ServiceType;
  seatPlan: SeatPlan;
  /** Bus de desarrollo. */
  fictitious?: boolean;
}

/** @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta. */
export interface BusResponse {
  busId: string;
  unit: string;
  version: number;
}

/** GET /v1/buses: las versiones vigentes. */
export interface BusListResponse {
  buses: Array<{
    busId: string;
    unit: string;
    version: number;
    plate: string;
    brand: string;
    model: string;
    enablementNumber: string | null;
    /** Cantidad máxima de asientos: los del plano. */
    capacity: number;
    serviceType: ServiceType;
    fictitious: boolean;
  }>;
}

/** POST /v1/viajes/programacion: una salida suelta. */
export interface ScheduleTripRequest {
  /** Código de la ruta (`lima-huancayo`). */
  route: string;
  busId: string;
  /** ISO 8601 con zona (`2026-10-20T08:00:00-05:00`). */
  departsAt: string;
  fictitious?: boolean;
}

/** POST /v1/viajes/programacion: */
export interface ScheduleTripResponse {
  tripId: string;
  /** false si esa salida ya existía: no se creó otra. */
  created: boolean;
}

/**
 * POST /v1/plantillas y PUT /v1/plantillas/:id. Cambiar una plantilla afecta
 * solo a los viajes que todavía no se generaron (D-021). La ruta no cambia.
 */
export interface ScheduleTemplateRequest {
  route: string;
  unit: string;
  /** Hora de salida en Perú, `HH:MM`. */
  departureTime: string;
  /** Días ISO: 1 lunes … 7 domingo. */
  weekdays: number[];
  validFrom: string;
  validTo?: string | null;
  active?: boolean;
  fictitious?: boolean;
}

/** POST /v1/plantillas; PUT /v1/plantillas/:id. */
export interface ScheduleTemplateResponse {
  templateId: string;
}

/** GET /v1/plantillas */
export interface TemplateListResponse {
  templates: Array<{
    templateId: string;
    route: string;
    unit: string;
    departureTime: string;
    weekdays: number[];
    validFrom: string;
    validTo: string | null;
    active: boolean;
    fictitious: boolean;
  }>;
}

/** POST /v1/viajes/generacion: genera hasta el horizonte. También corre cada día. */
export interface GenerateTripsResponse {
  created: number;
  /** Salidas que no se generaron porque su bus no tiene versión vigente. */
  withoutBus: number;
}

/** PUT /v1/viajes/:id/bus */
export interface ChangeBusRequest {
  busId: string;
}

/** POST /v1/viajes/:id/cancelacion */
export interface CancelTripRequest {
  reason: string;
}

/** POST /v1/viajes/:id/cancelacion */
export interface CancelTripResponse {
  tripId: string;
  releasedReservations: number;
  /** Compras que quedan en la lista para devolver (`GET /v1/compras-afectadas`). */
  affectedPurchases: number;
}

/** GET /v1/compras-afectadas: lo que hay que devolver o resolver. */
export interface AffectedPurchasesResponse {
  purchases: Array<{
    id: string;
    purchaseCode: string;
    tripId: string;
    route: string;
    departsAt: string;
    amount: string;
    reason: 'viaje_cancelado';
    since: string;
  }>;
}

/** GET y PUT /v1/configuracion/programacion */
export interface SchedulingConfig {
  /** Días hacia adelante que se generan. Entre 1 y 120. */
  horizonDays: number;
}

/**
 * GET /v1/operacion/viajes?fecha=<AAAA-MM-DD>[&agencia=<código>]. Counter: los
 * de su agencia. Supervisor: cualquier agencia, o todas.
 */
export interface OperationsTripsResponse {
  date: string;
  trips: Array<{
    tripId: string;
    route: string;
    departsAt: string;
    arrivesAt: string | null;
    arrivalProvisional: boolean;
    status: 'programado' | 'en_ruta' | 'completado' | 'cancelado';
    serviceType: ServiceType;
    bus: { unit: string; plate: string } | null;
    seats: { total: number; sold: number; held: number; free: number };
    fictitious: boolean;
  }>;
}

/**
 * GET /v1/reservas/:id/boletos, con la sesión o el usuario que compró; en una
 * venta de counter, con el token del operador que la vendió (D-051). Un boleto
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

/**
 * POST /v1/caja/ventas/:codigo/impresiones (D-057). Los
 * boletos de una venta en counter, para imprimirlos. Puede el operador que
 * vendió mientras siga abierto el turno de la venta, y un supervisor siempre.
 * Cada llamada queda registrada, la primera también. Con el turno cerrado, el
 * vendedor recibe `REPRINT_SHIFT_CLOSED`; cualquier otro, 404.
 */
export interface TicketPrintResponse extends TicketsResponse {
  /** 1 es la impresión de la venta; desde 2, reimpresiones. */
  printNumber: number;
  reprint: boolean;
}

/** GET /v1/caja/ventas/:codigo/impresiones. Supervisor. Quién imprimió y cuándo. */
export interface TicketPrintLogResponse {
  purchaseCode: string;
  prints: Array<{
    printNumber: number;
    printedAt: string;
    printedBy: { userId: string; firstName: string | null; lastName: string | null };
    role: 'counter' | 'supervisor';
    /** `vendedor`: quien vendió, con su turno abierto. `supervisor`: un supervisor. */
    via: 'vendedor' | 'supervisor';
  }>;
}

/**
 * GET /v1/embarque/viajes/:id/paquete. Personal. Lo que el dispositivo necesita
 * para validar sin conexión. Vence a las 24 horas: después hay que bajar otro.
 */
export interface BoardingPackageResponse {
  tripId: string;
  departsAt: string;
  status: 'programado' | 'en_ruta' | 'completado' | 'cancelado';
  issuedAt: string;
  validUntil: string;
  /** Claves públicas que verifican boletos de este viaje. Una revocada no viene. */
  keys: Array<{ kid: string; publicKey: JsonWebKey; retired: boolean }>;
  /** Boletos de compras anuladas: no embarcan. */
  revoked: Array<{ purchaseCode: string; seat: string }>;
  /** Ya embarcados, según lo sincronizado por cualquier dispositivo. */
  boarded: Array<{ purchaseCode: string; seat: string }>;
  /**
   * Pasajeros menores de 18 el día del viaje: al escanearlos, la app avisa que
   * hay que ver el permiso notarial (Condiciones Generales, punto 4). Sin
   * nombres: el asiento basta.
   */
  minors: Array<{ purchaseCode: string; seat: string; ageAtTrip: number }>;
  /** Pasajeros que llevan un menor en brazos: también hay que ver su permiso. */
  infantsInArms: Array<{ purchaseCode: string; seat: string; ageAtTrip: number }>;
}

/** POST /v1/embarque/sincronizacion. Personal. Hasta 500 escaneos por vez. */
export interface BoardingSyncRequest {
  /** El viaje que el dispositivo estaba embarcando. */
  tripId: string;
  scans: Array<{
    /** Lo genera el dispositivo: reenviarlo no duplica. */
    scanId: string;
    qr: string;
    /** Hora del escaneo en el dispositivo, ISO 8601. */
    scannedAt: string;
  }>;
}

/** @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta. */
export type BoardingRejection =
  | 'firma_invalida'
  | 'clave_desconocida'
  | 'clave_revocada'
  | 'clave_retirada'
  | 'otro_viaje'
  | 'viaje_cancelado'
  | 'boleto_desconocido'
  | 'boleto_anulado';

/** POST /v1/embarque/sincronizacion. */
export interface BoardingSyncResponse {
  tripId: string;
  /** Lo que decidió el servidor, que vuelve a verificar todo. */
  results: Array<{
    scanId: string;
    result: 'embarcado' | 'duplicado' | 'rechazado';
    reason: BoardingRejection | null;
    /** true si ese escaneo ya se había recibido. */
    alreadyRecorded: boolean;
  }>;
}

/** POST /v1/embarque/claves. Supervisor. Publica una clave pública nueva. */
export interface PublishBoardingKeyRequest {
  kid: string;
  publicKey: JsonWebKey;
}

/**
 * POST /v1/viajes/:id/conductores. Supervisor. Los datos del conductor como los
 * tiene flota, el maestro (D-026). Ventas guarda una foto: lo que flota cambie
 * después no toca este viaje.
 */
export interface AssignDriverRequest {
  /**
   * El conductor en flota. Nombres, licencia y vencimiento los toma ventas de
   * flota, el maestro (B-09): no los escribe quien asigna.
   */
  driverId: string;
}

/** POST /v1/viajes/:id/conductores. */
export interface AssignDriverResponse {
  assignmentId: string;
  tripId: string;
  /** Ya estaba asignado a este viaje: no se creó otra asignación. */
  alreadyAssigned: boolean;
}

/** GET /v1/viajes/:id/conductores. Personal que opera el viaje. */
export interface TripDriversResponse {
  tripId: string;
  drivers: Array<{
    assignmentId: string;
    driverId: string;
    firstNames: string;
    lastNames: string;
    licenseNumber: string;
    licenseExpiresOn: string;
  }>;
  required: RequiredDrivers;
}

/**
 * Cuántos conductores exige el viaje. Sin regla cargada, uno, y `ruleConfirmed`
 * en falso: la regla depende de operación (docs/ESTADO.md).

 * @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta.
 */
export interface RequiredDrivers {
  required: number;
  ruleConfirmed: boolean;
  /** RENAT 30.3: nocturno si el viaje toca entre las 22:00 y las 05:59. */
  shift: 'diurno' | 'nocturno';
}

/** PUT /v1/configuracion/conductores. Supervisor. Reemplaza la regla entera. */
export interface DriverRulesRequest {
  rules: Array<{ shift: 'diurno' | 'nocturno'; fromMinutes: number; drivers: number }>;
  /** La norma o el documento que la respalda. Obligatoria. */
  source: string;
}

/** PUT /v1/configuracion/conductores. */
export interface DriverRulesResponse {
  rules: Array<{ shift: 'diurno' | 'nocturno'; fromMinutes: number; drivers: number }>;
  source: string | null;
}

/** Qué cambió respecto a la versión anterior del manifiesto. Asientos, no datos.
 * @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta.
 */
export type ManifestChanges =
  | { first: true }
  | {
    passengersAdded: string[];
    passengersRemoved: string[];
    /** Qué campos cambiaron, no sus valores. */
    passengersChanged: Array<{ seat: string; fields: string[] }>;
    ticketsNumbered: string[];
    boarded: string[];
    /** El menor en brazos, por el asiento de quien lo lleva. */
    infantsAdded: string[];
    infantsRemoved: string[];
    infantsChanged: string[];
    driversAdded: Array<{ firstNames: string; lastNames: string }>;
    driversRemoved: Array<{ firstNames: string; lastNames: string }>;
    busChanged: boolean;
    unchanged: boolean;
  };

/**
 * El manifiesto de un viaje (D-019, D-028). Lleva el documento COMPLETO de cada
 * pasajero: excepción documentada de la regla 5. Solo personal que opera el
 * viaje, con el rol verificado en el servidor.

 * @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta.
 */
export interface ManifestContent {
  trip: {
    id: string;
    origin: string;
    destination: string;
    serviceType: 'confort' | 'ejecutivo' | 'suite';
    departsAt: string;
    estimatedArrival: string | null;
    arrivalProvisional: boolean;
  };
  /** El bus de ESTE viaje, la foto de D-022. */
  bus: {
    unit: string;
    plate: string;
    make: string;
    model: string;
    /** Pendiente: si es del vehículo o de la empresa (docs/ESTADO.md). */
    authorizationNumber: string | null;
    maxSeats: number;
  };
  drivers: TripDriversResponse['drivers'];
  requiredDrivers: RequiredDrivers;
  passengers: Array<{
    seat: string;
    firstNames: string;
    lastNames: string;
    documentType: DocumentKind;
    documentNumber: string;
    ageAtTrip: number;
    minor: boolean;
    companion: { name: string; relationship: string } | null;
    origin: string;
    destination: string;
    /** Serie y número asignados, aunque todavía no esté emitido. Nulo: sin número. */
    ticket: { series: string; number: string; issued: boolean } | null;
    amount: string;
    boarded: boolean;
    boardedAt: string | null;
  }>;
  infantsInArms: Array<{
    carrierSeat: string;
    firstNames: string;
    lastNames: string;
    documentType: DocumentKind;
    documentNumber: string;
    ageAtTrip: number;
    carrierFirstNames: string;
    carrierLastNames: string;
    relationship: string;
  }>;
  /** Boletos todavía sin número: qué hacer con ellos lo decide el contador. */
  ticketsWithoutNumber: string[];
  /** Se firma en el impreso. */
  driverSignature: null;
}

/** Una versión del manifiesto, sin el contenido.
 * @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta.
 */
export interface ManifestVersion {
  version: number;
  generatedBy: string;
  generatedByName: string | null;
  generatedAt: string;
  /** SHA-256 del contenido, en hexadecimal. */
  fingerprint: string | null;
  changes: ManifestChanges;
}

/** POST /v1/operacion/viajes/:id/manifiestos: genera una versión nueva. */
export interface GenerateManifestResponse extends ManifestVersion {
  tripId: string;
}

/** GET /v1/operacion/viajes/:id/manifiestos */
export interface ManifestVersionsResponse {
  tripId: string;
  versions: ManifestVersion[];
}

/** GET /v1/operacion/viajes/:id/manifiestos/:version */
export interface ManifestResponse extends ManifestVersion {
  tripId: string;
  content: ManifestContent;
}

/**
 * POST /v1/buses/desde-flota. Supervisor. Una versión nueva del bus con los datos
 * que tiene hoy flota (D-022): pedida a mano, nunca propagada sola. El plano de
 * asientos es de ventas: se conserva el de la versión vigente, salvo que venga uno.
 */
export interface BusFromFleetRequest {
  fleetUnitId: string;
  /** Solo la primera vez: el identificador del bus dentro de ventas. */
  unit?: string;
  /** Solo la primera vez, o para cambiarlo. Su capacidad tiene que ser la de flota. */
  seatPlan?: SeatPlan;
}

// ----- De _shared/contratos/encomiendas.ts

/** POST /v1/encomiendas/cotizacion. Público. Agencias por su código. */
export interface ParcelQuoteRequest {
  origin: string;
  destination: string;
  weightKg: number;
  /** Las tres o ninguna, en centímetros. */
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  declaredValue?: number | null;
}

/**
 * La cotización con su desglose: es lo que evita la discusión en counter.
 * Importes y pesos como texto decimal.

 * POST /v1/encomiendas/cotizacion
 */
export interface ParcelQuote {
  realWeightKg: string;
  /** Nulo sin medidas. */
  volumetricWeightKg: string | null;
  billableWeightKg: string;
  /** Por qué se factura ese peso: el mayor entre el real y el volumétrico. */
  billedBy: 'real' | 'volumetrico';
  volumetricDivisor: number;
  range: { fromKg: string; toKg: string; price: string };
  declaredValue: string | null;
  surchargePercent: string | null;
  surcharge: string;
  total: string;
  currency: 'PEN';
  /**
   * El rango o el recargo aplicados son ficticios (D-055): solo en desarrollo,
   * hasta que comercial defina el tarifario. Queda congelado con la encomienda.
   */
  fictitiousRate: boolean;
}

/** @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta. */
export interface ParcelPerson {
  name: string;
  documentType?: DocumentKind | 'ruc';
  documentNumber?: string;
  phone?: string;
}

/**
 * POST /v1/encomiendas. Personal de counter, en la agencia de origen. Registra
 * y cobra: el cobro pasa por la caja de svc-ventas (D-009, D-029).
 */
export interface RegisterParcelRequest {
  origin: string;
  destination: string;
  weightKg: number;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  declaredValue?: number | null;
  /** Documento obligatorio. */
  sender: ParcelPerson & {
    documentType: DocumentKind | 'ruc';
    documentNumber: string;
    /**
     * El remitente acepta, en el counter, recibir WhatsApp de la empresa (B-10,
     * D-035). Sin esto, la guía no se le envía por WhatsApp. Exige `phone`.
     */
    whatsappOptIn?: boolean;
  };
  /**
   * Documento obligatorio (D-031): en la entrega se verifica contra el de quien
   * recoge. Sin él, cualquiera con la guía se llevaría el paquete.
   */
  recipient: ParcelPerson & { documentType: DocumentKind | 'ruc'; documentNumber: string };
  /** Boleta o factura, gravada (D-019). La factura exige RUC y razón social. */
  receipt: { type: 'boleta' | 'factura'; ruc?: string; name?: string };
  payment: { method: PaymentMethod; cashReceived?: number };
}

/**
 * D-031: cinco estados. `en_destino` es que llegó a la agencia de destino;
 * `entregada`, que se le entregó al destinatario, con su documento verificado.

 * @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta.
 */
export type ParcelStatus =
  | 'registrada'
  | 'alistando'
  | 'en_camino'
  | 'en_destino'
  | 'entregada'
  | 'cancelada';

/** POST /v1/encomiendas. */
export interface RegisterParcelResponse {
  parcelId: string;
  /** `EH-XXXX-XXXX`, dictable por teléfono. */
  trackingCode: string;
  quote: ParcelQuote;
  /** Vuelto, si fue en efectivo. */
  change: string | null;
  status: ParcelStatus;
}

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

/**
 * POST /v1/encomiendas/:id/estado. Personal. Solo el siguiente del flujo.
 * `entregada` no va por aquí: es POST /v1/encomiendas/:id/entrega.
 */
export interface ParcelStatusRequest {
  status: 'alistando' | 'en_camino' | 'en_destino';
  /** Solo el supervisor la elige; el counter marca en su agencia. */
  terminal?: string;
}

/**
 * POST /v1/encomiendas/:id/entrega. Personal de la agencia de destino, con la
 * encomienda en destino. El documento que muestra quien recoge: tiene que ser el
 * del destinatario registrado (D-031).
 */
export interface DeliverParcelRequest {
  documentType: DocumentKind | 'ruc';
  documentNumber: string;
  /** Solo el supervisor la indica. */
  terminal?: string;
}

/**
 * GET /v1/encomiendas/:id, o GET /v1/encomiendas/guia/:guia. Personal de la
 * agencia de origen o de destino.
 */
export interface ParcelDetailResponse {
  parcelId: string;
  trackingCode: string;
  origin: string;
  destination: string;
  status: ParcelStatus;
  sender: Required<Pick<ParcelPerson, 'name' | 'documentType' | 'documentNumber'>> & {
    phone: string | null;
  };
  recipient: {
    name: string;
    documentType: DocumentKind | 'ruc' | null;
    documentNumber: string | null;
    phone: string | null;
  };
  quote: ParcelQuote;
  payment: { method: PaymentMethod; confirmedAt: string };
  receipt: {
    type: 'boleta' | 'factura';
    status: 'pendiente' | 'emitido' | 'rechazado' | 'fallido' | 'anulado';
    series: string | null;
    number: string | null;
  };
  cancellation: { at: string; reason: string; refundResolved: boolean } | null;
  /** Quién entregó, dónde, cuándo y con qué tipo de documento se verificó. */
  delivery: { at: string; deliveredBy: string; documentType: DocumentKind | 'ruc' } | null;
  events: ParcelTrackingResponse['events'];
}

/** PUT /v1/tarifario/rutas. Supervisor. Reemplaza los rangos de un par. */
export interface SaveParcelRatesRequest {
  origin: string;
  destination: string;
  /** Tope de cada rango y su precio. El primero va desde 0. */
  ranges: Array<{ toKg: number; price: number }>;
}

/** PUT /v1/tarifario/recargo-valor-declarado. Supervisor; porcentaje global. */
export interface SaveDeclaredValueSurchargeRequest {
  /** De 0 a 100. Guardar desde el panel quita la marca de ficticio (D-055). */
  percent: number;
}

/** PUT /v1/tarifario/equipaje. Supervisor; reemplaza todos los escalones globales. */
export interface SaveBaggageRatesRequest {
  /** Vacío deja el tarifario sin definir. Límites explícitos, sin franquicia inventada. */
  steps: Array<{ fromKg: number; toKg: number; surcharge: number | null }>;
}

/** GET /v1/tarifario/equipaje y respuesta de PUT /v1/tarifario/equipaje. */
export interface BaggageRatesResponse {
  steps: Array<{
    fromKg: string;
    toKg: string;
    /** Nulo mientras comercial no haya definido el monto. */
    surcharge: string | null;
    fictitious: boolean;
  }>;
}

/**
 * GET /v1/tarifario. Público: no tiene datos personales.
 * Respuesta de PUT /v1/tarifario/rutas y PUT /v1/tarifario/recargo-valor-declarado.
 */
export interface ParcelRatesResponse {
  routes: Array<{
    origin: string;
    destination: string;
    ranges: Array<{ fromKg: string; toKg: string; price: string }>;
    /** Algún rango de la ruta es ficticio (D-055). */
    fictitious: boolean;
  }>;
  /** Nulo: sin definir; con valor declarado no se cotiza. */
  declaredValueSurchargePercent: string | null;
  declaredValueSurchargeFictitious: boolean;
}

// ----- De _shared/contratos/facturacion.ts

/**
 * Tipo de comprobante (D-019). El pasaje va en boleto de viaje
 * (RS 156-2003/SUNAT), nunca en boleta ni en factura. Boleta y factura son para
 * el exceso de equipaje y la encomienda.

 * @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta.
 */
export type DocumentType = 'boleto_viaje' | 'boleta' | 'factura';

/** GET /v1/comprobantes/por-resolver. Solo supervisor. */
export interface ReceiptsToResolveResponse {
  receipts: Array<{
    receiptId: string;
    purchaseCode: string;
    type: DocumentType;
    /** Asiento, en un boleto de viaje. */
    seat: string | null;
    status: 'rechazado' | 'fallido';
    reason: string;
    attempts: number;
    generation: number;
    since: string;
  }>;
}

/** POST /v1/comprobantes/:id/reintentar. Solo supervisor, con una nota. */
export interface RetryReceiptResponse {
  receiptId: string;
  generation: number;
}

// ----- De _shared/contratos/flota.ts

/** @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta. */
export type UnitDocumentType = 'soat' | 'revision_tecnica' | 'tarjeta_circulacion';

/** @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta. */
export type AlertType = 'documento' | 'kilometraje' | 'horas_conduccion';

/** @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta. */
export type AlertLevel = 'info' | 'warning' | 'error' | 'vencido';

/** @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta. */
export type AlertSubject = UnitDocumentType | 'licencia' | 'kilometraje' | 'horas_conduccion';

/** POST /v1/unidades y PUT /v1/unidades/:id */
export interface SaveUnitRequest {
  plate: string;
  make: string;
  model: string;
  capacity: number;
  serviceType: ServiceType;
  /** Pendiente: si es del vehículo o de la empresa. Nulo hasta saberlo. */
  authorizationNumber?: string | null;
  /** Kilometraje a partir del cual se alerta. Nulo: sin alerta. */
  mileageThresholdKm?: number | null;
}

/** @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta. */
export interface UnitView {
  unitId: string;
  plate: string;
  make: string | null;
  model: string;
  capacity: number;
  serviceType: ServiceType;
  authorizationNumber: string | null;
  mileageKm: number;
  mileageThresholdKm: number | null;
  active: boolean;
  /** La versión vigente de cada documento. */
  documents: UnitDocumentView[];
  activeAlerts: number;
}

/** GET /v1/unidades */
export interface UnitsResponse {
  units: UnitView[];
}

/** Una versión de un documento (D-034). No se modifica: renovar o corregir crea otra.
 * @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta.
 */
export interface UnitDocumentView {
  type: UnitDocumentType;
  version: number;
  number: string;
  /** Periodo que cubre el documento, como lo dice el documento. `AAAA-MM-DD`. */
  validFrom: string;
  expiresOn: string;
  reason: UnitDocumentReason;
  registeredAt: string;
  /** Usuario que la registró. Nulo en datos cargados por el administrador. */
  registeredBy: string | null;
  /** Cuándo dejó de ser la vigente. Nulo: es la vigente. */
  replacedAt: string | null;
}

/**
 * alta: la primera · renovacion: un documento nuevo, que vence después ·
 * correccion: el mismo, mal digitado; la versión corregida no cuenta como cobertura.

 * @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta.
 */
export type UnitDocumentReason = 'alta' | 'renovacion' | 'correccion';

/**
 * PUT /v1/unidades/:id/documentos/:tipo. Sin documento vigente, registra la
 * versión 1. Con uno vigente, crea la siguiente y exige `reason`. Con los mismos
 * datos que la vigente, no crea nada (`unchanged`).
 */
export interface SaveUnitDocumentRequest {
  number: string;
  /** Inicio de vigencia según el documento. `AAAA-MM-DD`. */
  validFrom: string;
  /** `AAAA-MM-DD`. No antes de `validFrom`. */
  expiresOn: string;
  reason?: 'renovacion' | 'correccion';
}

/** PUT /v1/unidades/:id/documentos/:tipo. */
export interface SaveUnitDocumentResponse {
  unitId: string;
  type: UnitDocumentType;
  version: number;
  result: 'registered' | 'renewed' | 'corrected' | 'unchanged';
}

/** GET /v1/unidades/:id/documentos/:tipo/historial. De la más reciente a la primera. */
export interface UnitDocumentHistoryResponse {
  unitId: string;
  type: UnitDocumentType;
  versions: UnitDocumentView[];
}

/**
 * GET /v1/unidades/:id/documentos/cobertura?fecha=AAAA-MM-DD. Qué documento de
 * cada tipo cubría a la unidad ese día. Las versiones corregidas no cuentan.
 */
export interface UnitDocumentCoverageResponse {
  unitId: string;
  date: string;
  coverage: Array<{
    type: UnitDocumentType;
    covered: boolean;
    document: { version: number; number: string; validFrom: string; expiresOn: string } | null;
  }>;
}

/** PUT /v1/unidades/:id/kilometraje. No retrocede. */
export interface MileageRequest {
  mileageKm: number;
}

/** POST /v1/conductores y PUT /v1/conductores/:id. Datos personales (Ley 29733). */
export interface SaveDriverRequest {
  firstNames: string;
  lastNames: string;
  licenseNumber: string;
  /** `AAAA-MM-DD`. */
  licenseExpiresOn: string;
  /** Horas acumuladas a partir de las cuales se alerta. Nulo: sin alerta. */
  drivingHoursLimit?: number | null;
}

/** @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta. */
export interface DriverView {
  driverId: string;
  firstNames: string;
  lastNames: string;
  licenseNumber: string;
  licenseExpiresOn: string;
  drivingHours: string;
  drivingHoursLimit: string | null;
  active: boolean;
  activeAlerts: number;
}

/** GET /v1/conductores */
export interface DriversResponse {
  drivers: DriverView[];
}

/** PUT /v1/conductores/:id/horas */
export interface DrivingHoursRequest {
  hours: number;
}

/** Una alerta, tal como se emitió. Lo que dice no cambia después.
 * @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta.
 */
export interface AlertView {
  alertId: string;
  type: AlertType;
  level: AlertLevel;
  subject: AlertSubject;
  unitId: string | null;
  driverId: string | null;
  /** Generada al emitir. Sin datos personales: un conductor se identifica por su id. */
  description: string;
  /** Días al vencimiento, kilómetros u horas, al emitir. */
  observedValue: string;
  issuedAt: string;
  status: 'activa' | 'atendida';
  attention: { at: string; by: string; responsible: string; note: string } | null;
}

/** GET /v1/alertas?estado=activa|atendida. Activas, por urgencia. */
export interface AlertsResponse {
  alerts: AlertView[];
}

/** POST /v1/alertas/:id/atencion. Un UPDATE, nunca un borrado. */
export interface AttendAlertRequest {
  /** Quién se hace cargo de la acción. */
  responsible: string;
  note: string;
}

// ----- De _shared/contratos/notificaciones.ts

/** @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta. */
export type NotificationChannel = 'whatsapp' | 'correo';

/** @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta. */
export type DeliveryStatus = 'pendiente' | 'enviado' | 'fallido' | 'omitido';

/** Un envío, sin contenido ni dirección: solo a quién como referencia.
 * @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta.
 */
export interface DeliveryView {
  deliveryId: string;
  source: 'ventas' | 'encomiendas' | 'flota';
  eventType: string;
  eventId: string;
  channel: NotificationChannel;
  recipient: string;
  template: string;
  status: DeliveryStatus;
  /** Un código propio, nunca el texto del proveedor. */
  reason: string | null;
  attempts: number;
  createdAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  failedAt: string | null;
}

/** GET /v1/envios?estado=fallido|pendiente|omitido|enviado. Solo supervisor. */
export interface DeliveriesResponse {
  deliveries: DeliveryView[];
}

/** @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta. */
export type TemplateStatus =
  | 'pendiente_aprobacion'
  | 'aprobada'
  | 'rechazada'
  | 'pausada'
  | 'deshabilitada';

/** @noExpuesto Forma auxiliar compartida; no se expone como contrato autónomo de una ruta. */
export interface TemplateView {
  code: string;
  channel: NotificationChannel;
  providerName: string | null;
  language: string | null;
  category: 'utility' | 'propia';
  status: TemplateStatus;
  note: string | null;
}

/** GET /v1/plantillas. Solo supervisor. */
export interface TemplatesResponse {
  templates: TemplateView[];
}

/**
 * PUT /v1/plantillas/:codigo/whatsapp. Solo supervisor: registra lo que dijo
 * Meta. Aprobar exige el nombre y el idioma con que se registró allá.
 */
export interface UpdateTemplateRequest {
  status: TemplateStatus;
  providerName?: string | null;
  language?: string | null;
  note: string;
}

/** PUT /v1/buzones/:codigo. A dónde van los avisos internos. Solo supervisor. */
export interface MailboxRequest {
  email: string;
}
