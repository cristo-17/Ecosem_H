import type { UnitsResponse, DriversResponse, AlertsResponse, SaveUnitRequest, SaveDriverRequest, SaveUnitDocumentRequest, SaveUnitDocumentResponse, UnitDocumentType, UnitDocumentHistoryResponse, UnitDocumentCoverageResponse, AttendAlertRequest } from "@/lib/types/contratos-panel";
import { conCuenta } from "./cuenta";
import { ApiError } from "./cliente";
import { mensajeCompra } from "./compra";
const id = encodeURIComponent;
const pedir = <T>(ruta: string) => conCuenta<T>(ruta, {}, "flota");
const guardar = <T = void>(ruta: string, cuerpo: unknown, metodo: "PUT" | "POST" = "PUT") => conCuenta<T>(ruta, { metodo, cuerpo }, "flota");
export const listarUnidades = () => pedir<UnitsResponse>("/v1/unidades");
export const listarConductores = () => pedir<DriversResponse>("/v1/conductores");
export const registrarUnidad = (cuerpo: SaveUnitRequest) => guardar<unknown>("/v1/unidades", cuerpo, "POST");
export const registrarConductor = (cuerpo: SaveDriverRequest) => guardar<unknown>("/v1/conductores", cuerpo, "POST");
export const listarAlertas = (estado: "activa" | "atendida") => pedir<AlertsResponse>(`/v1/alertas?estado=${estado}`);
export const guardarUnidad = (unidad: string, cuerpo: SaveUnitRequest) => guardar(`/v1/unidades/${id(unidad)}`, cuerpo);
export const guardarConductor = (conductor: string, cuerpo: SaveDriverRequest) => guardar(`/v1/conductores/${id(conductor)}`, cuerpo);
export const guardarDocumento = (unidad: string, tipo: UnitDocumentType, cuerpo: SaveUnitDocumentRequest) => guardar<SaveUnitDocumentResponse>(`/v1/unidades/${id(unidad)}/documentos/${tipo}`, cuerpo);
export const historialDocumento = (unidad: string, tipo: UnitDocumentType) => pedir<UnitDocumentHistoryResponse>(`/v1/unidades/${id(unidad)}/documentos/${tipo}/historial`);
export const coberturaDocumentos = (unidad: string, fecha: string) => pedir<UnitDocumentCoverageResponse>(`/v1/unidades/${id(unidad)}/documentos/cobertura?${new URLSearchParams({ fecha })}`);
export const atenderAlerta = (alerta: string, cuerpo: AttendAlertRequest) => guardar(`/v1/alertas/${id(alerta)}/atencion`, cuerpo, "POST");
export function mensajeFlota(error: unknown) {
  if (error instanceof ApiError) {
    switch (error.codigo) {
      case "ALERT_ALREADY_ATTENDED": return { titulo: "La alerta ya fue atendida", descripcion: "Otra persona ya registró la atención. Cierra este formulario y actualiza la consulta para ver el responsable y la nota registrados." };
      case "DOCUMENT_REASON_REQUIRED": return { titulo: "Falta el motivo", descripcion: "Selecciona renovación o corrección para registrar la nueva versión." };
      case "DOCUMENT_RENEWAL_NOT_LATER": return { titulo: "Revisa el vencimiento", descripcion: "Una renovación debe vencer después del documento vigente. Si estás corrigiendo datos mal digitados, elige Corrección." };
      case "FORBIDDEN": return { titulo: "Acceso restringido", descripcion: "Solo un supervisor activo puede gestionar flota y alertas." };
      case "VALIDATION": return { titulo: "Revisa los datos", descripcion: "Verifica los campos y sus límites antes de guardar." };
    }
  }
  return mensajeCompra(error);
}
