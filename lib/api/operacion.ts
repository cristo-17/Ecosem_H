/**
 * Operación de viajes contra svc-ventas, con el token del personal: viajes del
 * día, paquete de embarque, sincronización de escaneos y manifiestos. Quién ve
 * qué lo decide el servicio (el counter, su agencia; el supervisor, la que
 * elija) y la base, no esta pantalla.
 */
import type { CatalogResponse } from "@/lib/types/contratos-frontend";
import type {
  Manifiesto,
  PaqueteEmbarque,
  PedidoSincronizacion,
  RespuestaSincronizacion,
  VersionManifiesto,
  VersionesManifiesto,
  ViajesOperacion,
} from "@/lib/embarque/contrato";
import { ApiError, type OpcionesPeticion } from "@/lib/api/cliente";
import { mensajeCompra, type MensajeError } from "@/lib/api/compra";
import { conCuenta } from "@/lib/api/cuenta";

const viaje = (tripId: string) => `/v1/operacion/viajes/${encodeURIComponent(tripId)}`;

/** `fecha` en AAAA-MM-DD, hora de Perú. El supervisor puede pedir una agencia. */
export function viajesDelDia(fecha: string, agencia: string | null, opciones: OpcionesPeticion = {}) {
  const params = new URLSearchParams({ fecha, ...(agencia ? { agencia } : {}) });
  return conCuenta<ViajesOperacion>(`/v1/operacion/viajes?${params.toString()}`, opciones);
}

export function paqueteEmbarque(tripId: string, opciones: OpcionesPeticion = {}) {
  return conCuenta<PaqueteEmbarque>(
    `/v1/embarque/viajes/${encodeURIComponent(tripId)}/paquete`,
    opciones,
  );
}

/** Idempotente por `scanId`: reenviar un lote no duplica embarques. */
export function sincronizarEscaneos(pedido: PedidoSincronizacion, opciones: OpcionesPeticion = {}) {
  return conCuenta<RespuestaSincronizacion>("/v1/embarque/sincronizacion", {
    ...opciones,
    metodo: "POST",
    cuerpo: pedido,
  });
}

export function versionesManifiesto(tripId: string, opciones: OpcionesPeticion = {}) {
  return conCuenta<VersionesManifiesto>(`${viaje(tripId)}/manifiestos`, opciones);
}

/** Con el documento completo de cada pasajero: para el PDF (D-052). */
export function manifiesto(tripId: string, version: number, opciones: OpcionesPeticion = {}) {
  return conCuenta<Manifiesto>(`${viaje(tripId)}/manifiestos/${version}`, opciones);
}

/** Una versión nueva, con lo que el viaje tiene ahora. Queda registrada quién la generó. */
export function generarManifiesto(tripId: string, opciones: OpcionesPeticion = {}) {
  return conCuenta<VersionManifiesto & { tripId: string }>(`${viaje(tripId)}/manifiestos`, {
    ...opciones,
    metodo: "POST",
  });
}

/** `lima-huancayo` → ciudades de origen y destino, según el catálogo. */
export function ciudadesDeRuta(
  { terminals, routes }: CatalogResponse,
  codigo: string,
): { origen: string; destino: string } {
  const ruta = routes.find((r) => r.code === codigo);
  const ciudad = (id: string | undefined) => terminals.find((t) => t.id === id)?.city;
  return {
    origen: ciudad(ruta?.originId) ?? codigo,
    destino: ciudad(ruta?.destinationId) ?? "",
  };
}

const MOTIVO_NO_GENERABLE: Record<string, string> = {
  viaje_cancelado: "El viaje está cancelado.",
  viaje_salio: "El viaje ya salió: no se genera una versión nueva.",
  sin_bus: "El viaje no tiene un bus asignado.",
};

/** Qué decirle al personal por cada error del manifiesto. */
export function mensajeManifiesto(error: unknown): MensajeError {
  if (error instanceof ApiError) {
    switch (error.codigo) {
      case "DRIVERS_MISSING":
        return {
          titulo: "Faltan conductores",
          descripcion: `Este viaje exige ${error.detalles?.requiredDrivers ?? "más"} conductor(es) asignado(s) antes de generar el manifiesto.`,
        };
      case "MANIFEST_NOT_GENERABLE":
        return {
          titulo: "No se puede generar el manifiesto",
          descripcion: MOTIVO_NO_GENERABLE[error.detalles?.reason ?? ""] ?? error.message,
        };
      case "FORBIDDEN":
        return {
          titulo: "No operas este viaje",
          descripcion: "Solo el personal de la agencia de salida y el supervisor ven su manifiesto.",
        };
      case "NOT_FOUND":
        return { titulo: "No encontramos ese viaje", descripcion: "Vuelve a la lista de viajes del día." };
    }
  }
  return mensajeCompra(error);
}
