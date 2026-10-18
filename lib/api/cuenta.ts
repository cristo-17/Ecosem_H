/**
 * Lo que hace el navegador en nombre de una cuenta: vincular lo comprado sin
 * sesión, y listar las compras propias. Cada petición lleva el token de acceso
 * de Supabase Auth; quien decide qué datos salen es el servicio, que verifica
 * el token y filtra por el usuario (D-015 del backend), no esta pantalla.
 */
import type {
  LinkReservationsResponse,
  MyReservationsResponse,
  TicketsResponse,
} from "@/lib/types/contratos-frontend";
import { ApiError, pedirJson, type OpcionesPeticion } from "@/lib/api/cliente";
import { tokenSesionCompraGuardado } from "@/lib/api/compra";
import { tokenDeAcceso } from "@/lib/supabase/navegador";

async function conCuenta<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  const token = await tokenDeAcceso();
  if (!token) throw new ApiError("servidor", "Tu sesión terminó.", "UNAUTHENTICATED");
  return pedirJson<T>("ventas", ruta, {
    ...opciones,
    cabeceras: { ...opciones.cabeceras, authorization: `Bearer ${token}` },
  });
}

/** El token venció o se cerró la sesión a media acción: hay que volver a entrar. */
export function esSesionVencida(error: unknown): boolean {
  return error instanceof ApiError && error.codigo === "UNAUTHENTICATED";
}

/**
 * Tras iniciar sesión: lo reservado o comprado con la sesión de compra de
 * esta pestaña pasa a ser de la cuenta (D-048). Sin sesión de compra no hay
 * nada que vincular. Un fallo no impide entrar: la compra sigue siendo válida
 * y se puede consultar con la sesión de compra.
 */
export async function vincularComprasDeEstaPestana(): Promise<number> {
  const sesionCompra = tokenSesionCompraGuardado();
  if (!sesionCompra) return 0;
  try {
    const { linkedReservations } = await conCuenta<LinkReservationsResponse>(
      "/v1/sesiones/vincular",
      { metodo: "POST", cabeceras: { "x-session-token": sesionCompra } },
    );
    return linkedReservations;
  } catch {
    return 0;
  }
}

export function misReservas(opciones: OpcionesPeticion = {}) {
  return conCuenta<MyReservationsResponse>("/v1/reservas", opciones);
}

export function boletosDeMiCompra(reservationId: string, opciones: OpcionesPeticion = {}) {
  return conCuenta<TicketsResponse>(
    `/v1/reservas/${encodeURIComponent(reservationId)}/boletos`,
    opciones,
  );
}
