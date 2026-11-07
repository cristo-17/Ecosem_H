import { cn } from "@/lib/cn";
import type { TripSummary } from "@/lib/types/contratos-frontend";

/** null es ausencia de tarifa; false es una tarifa que no es de prueba. */
export function AvisoTarifa({ fictitious, className }: {
  fictitious: TripSummary["fictitious"];
  className?: string;
}) {
  if (fictitious === false) return null;
  if (fictitious === null) {
    return <p className={cn("text-sm text-text-secondary", className)}>
      Esta ruta todavía no tiene una tarifa definida.
    </p>;
  }
  if (fictitious === true) {
    return <p className={cn("rounded-sm bg-warning-fill px-3 py-2 text-sm text-warning-text", className)}>
      Precio de prueba. No es una tarifa real.
    </p>;
  }
  return null;
}
