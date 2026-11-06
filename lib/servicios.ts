import type { ServiceType } from "@/lib/types/contratos-frontend";

/** Nombres de la interfaz para los códigos del contrato, no datos de viajes. */
export const TIPOS_SERVICIO: { value: ServiceType; label: string }[] = [
  { value: "economico", label: "Económico" },
  { value: "ejecutivo", label: "Ejecutivo" },
  { value: "vip", label: "VIP" },
];

export function labelTipoServicio(tipo: ServiceType): string {
  return TIPOS_SERVICIO.find((servicio) => servicio.value === tipo)?.label ?? tipo;
}
