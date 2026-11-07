import type { ServiceType } from "@/lib/types/contratos-frontend";

/** Clases comerciales y códigos vigentes del contrato API. */
export const TIPOS_SERVICIO: { value: ServiceType; label: string; descripcion: string }[] = [
  { value: "ejecutivo", label: "Ejecutivo", descripcion: "Bus de dos pisos, asientos reclinables de 160° en el primer piso y 150° en el segundo, aire acondicionado, luz de lectura, mesa plegable, TV y música." },
  { value: "confort", label: "Confort", descripcion: "Bus de dos pisos, asientos de cuero reclinables de 160° en ambos pisos, aire acondicionado, luz de lectura, mesa plegable, TV, música, servicio higiénico y servicio a bordo." },
  { value: "suite", label: "Suite", descripcion: "Todos los servicios de Confort, con refrigerio." },
];

export function labelTipoServicio(tipo: ServiceType): string {
  return TIPOS_SERVICIO.find((servicio) => servicio.value === tipo)?.label ?? tipo;
}
