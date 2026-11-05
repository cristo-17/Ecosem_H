/** Alias del contrato generado del backend. */
import type { BoardingPackageResponse, ManifestContent } from "../types/contratos-panel";
export type {
 OperationsTripsResponse as ViajesOperacion,
 BoardingPackageResponse as PaqueteEmbarque,
 BoardingSyncRequest as PedidoSincronizacion,
 BoardingSyncResponse as RespuestaSincronizacion,
 BoardingRejection as MotivoRechazoServidor,
 ManifestVersion as VersionManifiesto,
 ManifestVersionsResponse as VersionesManifiesto,
 ManifestResponse as Manifiesto,
} from "../types/contratos-panel";
export type EstadoViajeOperacion = BoardingPackageResponse["status"];
export type BoletoDeViaje = BoardingPackageResponse["revoked"][number];
export type TipoDocumento = ManifestContent["passengers"][number]["documentType"];
export const MAX_ESCANEOS_POR_SINCRONIZACION = 500;
