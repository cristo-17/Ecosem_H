import type { ParcelRatesResponse, SaveParcelRatesRequest, SaveDeclaredValueSurchargeRequest, BaggageRatesResponse, SaveBaggageRatesRequest, } from "@/lib/types/contratos-panel";
import { ApiError, pedirJson, type OpcionesPeticion } from "./cliente";
import { conCuenta } from "./cuenta";
import { mensajeEncomienda } from "./encomiendas";
export const leerTarifario = (opciones: OpcionesPeticion = {}) => pedirJson<ParcelRatesResponse>("encomiendas", "/v1/tarifario", opciones);
export const guardarRangos = (cuerpo: SaveParcelRatesRequest) => conCuenta<ParcelRatesResponse>("/v1/tarifario/rutas", { metodo: "PUT", cuerpo }, "encomiendas");
export const guardarRecargo = (cuerpo: SaveDeclaredValueSurchargeRequest) => conCuenta<ParcelRatesResponse>("/v1/tarifario/recargo-valor-declarado", { metodo: "PUT", cuerpo }, "encomiendas");
export const leerEquipaje = (opciones: OpcionesPeticion = {}) => pedirJson<BaggageRatesResponse>("encomiendas", "/v1/tarifario/equipaje", opciones);
/** Reemplaza TODOS los escalones. El llamador debe enviar el conjunto completo. */
export const guardarEquipaje = (cuerpo: SaveBaggageRatesRequest) => conCuenta<BaggageRatesResponse>("/v1/tarifario/equipaje", { metodo: "PUT", cuerpo }, "encomiendas");
export function mensajeTarifario(error: unknown) {
  if (error instanceof ApiError) {
    if (error.codigo === "NOT_FOUND")
      return { titulo: "Configuración no disponible", descripcion: "No pudimos consultar esta configuración en el servicio. Reintenta; si continúa, comunícalo a soporte. Esto no indica que los montos estén sin definir." };
    if (error.codigo === "VALIDATION")
      return { titulo: "Revisa los valores", descripcion: "Verifica los límites, montos y que los escalones no se superpongan. No se confirmó el guardado." };
  }
  return mensajeEncomienda(error);
}
