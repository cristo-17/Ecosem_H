import type { MotivoRechazoServidor } from "./contrato";
import type { MotivoRechazoLocal } from "./decidir";

export const MOTIVO_LOCAL: Record<MotivoRechazoLocal, string> = {
  formato: "No es un boleto de Ecosem H",
  paquete_vencido: "El paquete del viaje venció: actualízalo con señal antes de seguir",
  paquete_incompleto: "El paquete no tiene los datos necesarios para embarcar. Descarga otro con señal",
  embarque_sin_configurar: "Ventana de embarque sin configurar. El supervisor debe guardar la regla y debes descargar otro paquete",
  embarque_no_abierto: "El embarque todavía no abre. Revisa la apertura indicada para este viaje",
  embarque_cerrado: "El embarque de este viaje ya cerró",
  incidencia_reloj: "La hora del dispositivo es anterior a la emisión del paquete. Revisa el reloj antes de embarcar",
  otro_viaje: "El boleto es de otro viaje",
  viaje_cancelado: "Este viaje está cancelado",
  clave_desconocida: "El boleto no se puede verificar con este paquete: actualízalo con señal",
  firma_invalida: "La firma no es válida: el boleto fue alterado o no lo emitió Ecosem H",
  boleto_anulado: "La compra de este boleto fue anulada",
};

export const MOTIVO_SERVIDOR: Record<MotivoRechazoServidor, string> = {
  firma_invalida: "Firma no válida",
  clave_desconocida: "Clave desconocida",
  clave_revocada: "Clave revocada",
  clave_retirada: "Clave retirada",
  otro_viaje: "Boleto de otro viaje",
  viaje_cancelado: "Viaje cancelado",
  boleto_desconocido: "Boleto inexistente",
  boleto_anulado: "Compra anulada",
  embarque_no_abierto: "El escaneo ocurrió antes de la apertura del embarque",
  embarque_cerrado: "El escaneo ocurrió después del cierre del embarque",
  embarque_sin_configurar: "Ventana de embarque sin configurar",
  incidencia_reloj: "Incidencia de reloj: hora anterior a la emisión del paquete o posterior a la recepción del escaneo",
  paquete_requerido: "El escaneo no conserva el paquete usado para validar",
  paquete_desconocido: "El paquete del escaneo no existe en el servidor",
  paquete_otro_viaje: "El paquete corresponde a otro viaje",
  paquete_vencido: "El paquete estaba vencido al escanear",
  paquete_desactualizado: "El viaje fue reprogramado y el paquete conserva otra salida",
};

/** Fechas completas para distinguir días y evitar depender de la zona del dispositivo. */
export function fechaHoraEmbarque(valor: string | null | undefined): string {
  if (!valor || !Number.isFinite(Date.parse(valor))) return "Sin registro";
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima", day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
  }).format(new Date(valor));
}
