/**
 * Compra de pasajes contra svc-ventas: sesión de compra, reserva, pasajeros,
 * contacto, inicio del pago, estado y boletos.
 *
 * Lo que este archivo NO hace, a propósito:
 * - Confirmar una compra. La confirma solo el webhook de la pasarela en el
 *   backend; el cliente únicamente consulta el estado (`consultarReserva`).
 * - Calcular precios. El monto es el que devolvió la reserva, congelado.
 * - Guardar el estado de la reserva en el navegador. Lo único que se guarda
 *   es el token de la sesión de compra (ver `sesionCompra`).
 */
import type {
  ReleaseReservationResponse,
  ReservationPassengersResponse,
  ReservationResponse,
  SaveContactRequest,
  SavePassengerRequest,
  SeatMapResponse,
  SessionResponse,
  StartPaymentRequest,
  StartPaymentResponse,
  TicketsResponse,
} from "@/lib/types/contratos-frontend";
import { ApiError, ahoraServidor, pedirJson, type OpcionesPeticion } from "@/lib/api/cliente";
import { etiquetaAsiento } from "@/lib/asientos";

// El token de la sesión de compra va en sessionStorage, no en memoria: la
// pasarela puede devolver al usuario con una recarga completa de la página, y
// sin el token la pantalla de retorno no podría consultar el estado de su
// compra. No es estado de la reserva ni dato personal: es un identificador
// anónimo firmado por el servidor (D-013), muere al cerrar la pestaña y no
// sirve en otro navegador. Asientos, precio, vencimiento y estado se piden
// siempre al backend.
const CLAVE_SESION = "ecosemh.sesionCompra";
// Una sesión a punto de vencer no se reutiliza: una compra puede durar más.
const MARGEN_SESION_MS = 60 * 60 * 1000;

function leerSesion(): SessionResponse | null {
  try {
    const guardada = sessionStorage.getItem(CLAVE_SESION);
    return guardada ? (JSON.parse(guardada) as SessionResponse) : null;
  } catch {
    return null;
  }
}

function guardarSesion(sesion: SessionResponse) {
  try {
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
  } catch {
    // Sin almacenamiento (modo privado estricto): la compra funciona igual
    // mientras no se recargue la página.
  }
}

let sesionEnMemoria: SessionResponse | null = null;

export function haySesionCompra(): boolean {
  const sesion = sesionEnMemoria ?? leerSesion();
  return sesion !== null && Date.parse(sesion.expiresAt) > ahoraServidor();
}

async function sesionCompra(nueva = false): Promise<string> {
  const actual = nueva ? null : (sesionEnMemoria ?? leerSesion());
  if (actual && Date.parse(actual.expiresAt) - ahoraServidor() > MARGEN_SESION_MS) {
    sesionEnMemoria = actual;
    return actual.sessionToken;
  }
  const sesion = await pedirJson<SessionResponse>("ventas", "/v1/sesiones", { metodo: "POST" });
  sesionEnMemoria = sesion;
  guardarSesion(sesion);
  return sesion.sessionToken;
}

async function conSesion<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  const token = await sesionCompra();
  return pedirJson<T>("ventas", ruta, {
    ...opciones,
    cabeceras: { ...opciones.cabeceras, "x-session-token": token },
  });
}

/** Público: el estado de cada asiento ahora mismo. */
export function obtenerPlano(tripId: string, opciones: OpcionesPeticion = {}) {
  return pedirJson<SeatMapResponse>(
    "ventas",
    `/v1/viajes/${encodeURIComponent(tripId)}/asientos`,
    opciones,
  );
}

/**
 * Separa los asientos. El backend los bloquea en una transacción con
 * `SELECT ... FOR UPDATE` y congela el precio. Si la sesión venció, pide otra
 * y reintenta una vez: una reserva nueva no depende de la sesión anterior.
 */
export async function reservarAsientos(
  tripId: string,
  seats: string[],
  opciones: OpcionesPeticion = {},
): Promise<ReservationResponse> {
  const pedir = () =>
    conSesion<ReservationResponse>("/v1/reservas", {
      ...opciones,
      metodo: "POST",
      cuerpo: { tripId, seats },
    });
  try {
    return await pedir();
  } catch (error) {
    if (!(error instanceof ApiError) || error.codigo !== "SESSION_REQUIRED") throw error;
    await sesionCompra(true);
    return pedir();
  }
}

export function liberarReserva(reservationId: string, opciones: OpcionesPeticion = {}) {
  return conSesion<ReleaseReservationResponse>(
    `/v1/reservas/${encodeURIComponent(reservationId)}`,
    { ...opciones, metodo: "DELETE" },
  );
}

/**
 * Estado de la reserva según el backend: `active`, `expired` o `purchased`.
 * Es lo único que decide si la compra está confirmada o si la reserva venció.
 */
export function consultarReserva(reservationId: string, opciones: OpcionesPeticion = {}) {
  return conSesion<ReservationPassengersResponse>(
    `/v1/reservas/${encodeURIComponent(reservationId)}/pasajeros`,
    opciones,
  );
}

export function guardarPasajero(
  reservationId: string,
  seat: string,
  datos: SavePassengerRequest,
  opciones: OpcionesPeticion = {},
) {
  return conSesion<ReservationPassengersResponse>(
    `/v1/reservas/${encodeURIComponent(reservationId)}/pasajeros/${encodeURIComponent(seat)}`,
    { ...opciones, metodo: "PUT", cuerpo: datos },
  );
}

export function guardarContacto(
  reservationId: string,
  datos: SaveContactRequest,
  opciones: OpcionesPeticion = {},
) {
  return conSesion<{ reservationId: string }>(
    `/v1/reservas/${encodeURIComponent(reservationId)}/contacto`,
    { ...opciones, metodo: "PUT", cuerpo: datos },
  );
}

/** Inicia el cobro en la pasarela. Recibir la respuesta NO confirma nada. */
export function iniciarPago(
  reservationId: string,
  datos: StartPaymentRequest,
  opciones: OpcionesPeticion = {},
) {
  return conSesion<StartPaymentResponse>(
    `/v1/reservas/${encodeURIComponent(reservationId)}/pago`,
    { ...opciones, metodo: "POST", cuerpo: datos },
  );
}

export function obtenerBoletos(reservationId: string, opciones: OpcionesPeticion = {}) {
  return conSesion<TicketsResponse>(
    `/v1/reservas/${encodeURIComponent(reservationId)}/boletos`,
    opciones,
  );
}

/** Ya no hay nada que cobrar ni que corregir: venció o se liberó. */
export function esReservaNoVigente(error: unknown): boolean {
  return error instanceof ApiError && error.codigo === "RESERVATION_NOT_ACTIVE";
}

export interface MensajeError {
  titulo: string;
  descripcion: string;
}

function listaAsientos(codigos: string[] | undefined): string {
  return (codigos ?? []).map(etiquetaAsiento).join(", ");
}

/**
 * Qué decirle al usuario por cada error del flujo de compra. Los límites del
 * backend tienen su propio mensaje, con los números que el backend manda:
 * nunca un "algo salió mal".
 */
export function mensajeCompra(error: unknown): MensajeError {
  if (!(error instanceof ApiError)) {
    return {
      titulo: "No pudimos completar la operación",
      descripcion: "Intenta nuevamente en unos segundos.",
    };
  }
  const d = error.detalles;
  switch (error.codigo) {
    case "SEAT_LIMIT_EXCEEDED":
      return d?.limitScope === "network"
        ? {
            titulo: "Se alcanzó el límite de asientos separados desde tu conexión",
            descripcion: `Desde tu red ya hay ${d.heldSeats ?? "varios"} asientos separados sin pagar, y el máximo es ${d.maxSeats ?? "limitado"}. Cuando se paguen o venzan podrás separar más. Si compartes la conexión con otras personas, espera unos minutos o llama a la central.`,
          }
        : {
            titulo: "Llegaste al máximo de asientos separados",
            descripcion: `Puedes separar hasta ${d?.maxSeats ?? "un número limitado de"} asientos a la vez sin pagar${d?.heldSeats ? `, y ya tienes ${d.heldSeats} separados` : ""}. Paga o deja vencer los que tienes para separar otros.`,
          };
    case "SEAT_UNAVAILABLE":
      return {
        titulo: "Alguien acaba de tomar un asiento",
        descripcion: d?.unavailableSeats?.length
          ? `El asiento ${listaAsientos(d.unavailableSeats)} ya no está libre. Actualizamos el plano: elige otro.`
          : "Uno de los asientos ya no está libre. Actualizamos el plano: elige otro.",
      };
    case "TRIP_UNAVAILABLE":
      return {
        titulo: "Este viaje ya no está a la venta",
        descripcion: "Puede que haya salido, se haya cancelado o ya no queden asientos. Busca otro horario.",
      };
    case "FARE_NOT_DEFINED":
      return {
        titulo: "Este viaje todavía no tiene tarifa",
        descripcion: "No se puede vender hasta que la empresa defina su precio. Elige otro horario o llama a la central.",
      };
    case "RESERVATION_NOT_ACTIVE":
      return {
        titulo: "Tu reserva venció",
        descripcion: "Se acabó el tiempo para completar la compra y los asientos se liberaron.",
      };
    case "PASSENGERS_REQUIRED":
      return {
        titulo: "Faltan datos de pasajeros",
        descripcion: d?.missingSeats?.length
          ? `Completa los datos del pasajero del asiento ${listaAsientos(d.missingSeats)} antes de pagar.`
          : "Completa los datos de todos los pasajeros antes de pagar.",
      };
    case "MINOR_COMPANION_REQUIRED":
      return {
        titulo: "Falta el acompañante de un menor",
        descripcion: "Un pasajero es menor de edad el día del viaje: indica quién lo acompaña y su parentesco.",
      };
    case "PAYMENT_UNAVAILABLE":
      return {
        titulo: "El pago no está disponible en este momento",
        descripcion: "La pasarela no respondió. Tu reserva sigue separada: intenta nuevamente en unos segundos.",
      };
    case "SESSION_REQUIRED":
    case "NOT_FOUND":
      return {
        titulo: "No encontramos tu reserva",
        descripcion: "Puede que haya vencido o que la hayas empezado en otra pestaña o navegador.",
      };
  }
  switch (error.tipo) {
    case "red":
      return {
        titulo: "Sin conexión a internet",
        descripcion: "Revisa tu conexión e intenta nuevamente.",
      };
    case "tiempo":
      return {
        titulo: "El servidor tardó demasiado",
        descripcion: "Puede ser una señal débil. Intenta nuevamente en unos segundos.",
      };
    case "ocupado":
      return {
        titulo: "Hay mucha demanda en este momento",
        descripcion: "Intentamos varias veces y el sistema sigue ocupado. Espera un momento e intenta nuevamente.",
      };
    default:
      return { titulo: "No pudimos completar la operación", descripcion: error.message };
  }
}
