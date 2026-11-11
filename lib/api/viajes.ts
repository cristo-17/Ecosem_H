import type { AssignDriverRequest, AssignDriverResponse, TripDriversResponse, ChangeBusRequest, BusFromFleetRequest, BusResponse, BusListResponse } from "@/lib/types/contratos-panel";
import { conCuenta } from "./cuenta";
import { ApiError, type OpcionesPeticion } from "./cliente";
import { mensajeManifiesto } from "./operacion";

const ruta = (id: string) => `/v1/viajes/${encodeURIComponent(id)}`;
export const conductoresDelViaje = (id: string, opciones: OpcionesPeticion = {}) => conCuenta<TripDriversResponse>(`${ruta(id)}/conductores`, opciones);
export const asignarConductor = (id: string, cuerpo: AssignDriverRequest) => conCuenta<AssignDriverResponse>(`${ruta(id)}/conductores`, { metodo: "POST", cuerpo });
export const retirarConductor = (id: string, asignacion: string, reason: string) => conCuenta<unknown>(`${ruta(id)}/conductores/${encodeURIComponent(asignacion)}/retiro`, { metodo: "POST", cuerpo: { reason } });
export const listarBuses = () => conCuenta<BusListResponse>("/v1/buses");
export const cambiarBus = (id: string, cuerpo: ChangeBusRequest) => conCuenta<unknown>(`${ruta(id)}/bus`, { metodo: "PUT", cuerpo });
export const traerBusDesdeFlota = (cuerpo: BusFromFleetRequest) => conCuenta<BusResponse>("/v1/buses/desde-flota", { metodo: "POST", cuerpo });

export function mensajeOperacionViaje(error: unknown) {
  if (error instanceof ApiError) {
    switch (error.codigo) {
      case "DRIVER_OVERLAP": return { titulo: "El conductor tiene otro viaje", descripcion: `Se solapa con el viaje ${error.detalles?.conflictingTripId ?? "indicado por operación"}. Elige otro conductor o revisa los horarios.` };
      case "DRIVER_LICENSE_EXPIRED": return { titulo: "La licencia está vencida", descripcion: "La licencia del conductor no cubre este viaje. Revisa su vigencia en flota." };
      case "DRIVER_INACTIVE": return { titulo: "El conductor está inactivo", descripcion: "Actívalo en flota o elige otro conductor." };
      case "BUS_OVERLAP": return { titulo: "El bus tiene otro viaje", descripcion: "El bus ya está asignado a un viaje que se solapa con este horario. Elige otra unidad." };
      case "BUS_CHANGE_REJECTED": return { titulo: "No se puede usar ese bus", descripcion: error.detalles?.serviceTypeChange ? "Ya hay ventas y el bus tiene otro tipo de servicio." : `El bus no tiene lugar para los asientos ocupados: ${error.detalles?.seatsWithoutPlace?.join(", ") ?? "revisa el plano"}.` };
      case "BUS_CAPACITY_MISMATCH": return { titulo: "El plano no coincide con flota", descripcion: "La cantidad de asientos del plano debe coincidir con la capacidad de la unidad en flota." };
      case "TRIP_NOT_MODIFIABLE": return { titulo: "El viaje ya no admite cambios", descripcion: error.message };
      case "TRIP_ARRIVAL_UNKNOWN": return { titulo: "Falta la hora de llegada", descripcion: "Operación debe definir la llegada para comprobar los cruces de horarios." };
      case "VALIDATION": return { titulo: "Revisa los datos", descripcion: error.message };
      case "FORBIDDEN": return { titulo: "Acceso restringido", descripcion: "Tu cuenta no puede realizar esta operación en el viaje. Los cambios de bus y conductores requieren un supervisor activo." };
      case "NOT_FOUND": return { titulo: "El registro ya no está disponible", descripcion: "No se encontró el viaje, conductor, asignación o bus solicitado. Actualiza la consulta antes de reintentar." };
    }
  }
  return mensajeManifiesto(error);
}
