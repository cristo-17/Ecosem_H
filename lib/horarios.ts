/** Franjas del filtro de búsqueda: etiquetas de la interfaz, no un catálogo. */
export type FranjaHoraria = "manana" | "tarde" | "noche";

export const FRANJAS_HORARIAS: { value: FranjaHoraria; label: string }[] = [
  { value: "manana", label: "Mañana (5:00 AM – 11:59 AM)" },
  { value: "tarde", label: "Tarde (12:00 PM – 5:59 PM)" },
  { value: "noche", label: "Noche (6:00 PM – 11:59 PM)" },
];

export function franjaHoraria(date: Date): FranjaHoraria {
  const hora = date.getHours();
  if (hora < 12) return "manana";
  if (hora < 18) return "tarde";
  return "noche";
}
