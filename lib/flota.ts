import type { AlertLevel, UnitDocumentType } from "@/lib/types/contratos-panel";
export const DOCUMENTOS: Record<UnitDocumentType, string> = { soat: "SOAT", revision_tecnica: "Revisión técnica", tarjeta_circulacion: "Tarjeta de circulación" };
export function nivelDocumento(fecha: string): AlertLevel | null {
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const dias = Math.round((Date.parse(fecha) - Date.parse(hoy)) / 86400000);
  return dias <= 0 ? "vencido" : dias <= 7 ? "error" : dias <= 15 ? "warning" : dias <= 30 ? "info" : null;
}
