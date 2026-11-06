import type { FareListResponse, SaveFareRequest, PriceFactorListResponse, SavePriceFactorRequest, PriceAuditResponse, } from "@/lib/types/contratos-panel";
import type { PriceQuoteResponse, TripListResponse } from "@/lib/types/contratos-frontend";
import { conCuenta } from "./cuenta";
import { ApiError, pedirJson, type OpcionesPeticion } from "./cliente";
import { mensajeCompra } from "./compra";
export const listarTarifas = (opciones: OpcionesPeticion = {}) => conCuenta<FareListResponse>("/v1/tarifas", opciones);
export const guardarTarifa = (ruta: string, cuerpo: SaveFareRequest) => conCuenta<void>(`/v1/tarifas/${encodeURIComponent(ruta)}`, { metodo: "PUT", cuerpo });
export const listarFactores = (opciones: OpcionesPeticion = {}) => conCuenta<PriceFactorListResponse>("/v1/factores-precio", opciones);
export const guardarFactor = (id: string | null, cuerpo: SavePriceFactorRequest) => conCuenta<void>(id ? `/v1/factores-precio/${encodeURIComponent(id)}` : "/v1/factores-precio", {
  metodo: id ? "PUT" : "POST", cuerpo,
});
export const auditoriaPrecios = (opciones: OpcionesPeticion = {}) => conCuenta<PriceAuditResponse>("/v1/auditoria-tarifas", opciones);
/** El simulador consulta el motor real; no reproduce reglas de rangos en el cliente. */
export const viajesParaCotizar = (ruta: string, fecha: string, opciones: OpcionesPeticion = {}) => pedirJson<TripListResponse>("ventas", `/v1/viajes?${new URLSearchParams({ ruta, fecha })}`, opciones);
export const cotizarViaje = (id: string, opciones: OpcionesPeticion = {}) => pedirJson<PriceQuoteResponse>("ventas", `/v1/viajes/${encodeURIComponent(id)}/precio`, opciones);
export function mensajePrecios(error: unknown) {
  if (error instanceof ApiError) {
    switch (error.codigo) {
      case "VALIDATION": return { titulo: "Revisa la configuración", descripcion: error.message };
      case "FORBIDDEN": return { titulo: "Acceso restringido", descripcion: "Solo un supervisor activo puede gestionar precios." };
      case "NOT_FOUND": return { titulo: "Registro no encontrado", descripcion: "Actualiza la consulta: la ruta, el factor o el viaje pueden haber cambiado." };
    }
  }
  return mensajeCompra(error);
}
