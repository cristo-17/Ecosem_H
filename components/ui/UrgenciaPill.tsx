import { cn } from "@/lib/cn";
import type { UrgenciaAlerta } from "@/lib/mock/flota";

// Vocabulario propio para alertas de flota (no Badge: ese está fijado a los
// 5 estados de pasajes/encomiendas, ver su propio comentario). "Vencido" no
// tiene token semántico propio en el skill, así que reutiliza navy sólido,
// mismo criterio que "completado" en Badge.tsx — no se inventa un color.
const CONFIG: Record<UrgenciaAlerta, { label: string; className: string }> = {
  info: { label: "Por vencer", className: "bg-info-fill text-info-text" },
  warning: { label: "Atención", className: "bg-warning-fill text-warning-text" },
  error: { label: "Urgente", className: "bg-error-fill text-error-text" },
  vencido: { label: "Vencido", className: "bg-navy text-white" },
};

export interface UrgenciaPillProps {
  urgencia: UrgenciaAlerta;
  className?: string;
}

export function UrgenciaPill({ urgencia, className }: UrgenciaPillProps) {
  const config = CONFIG[urgencia];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-field px-3 py-1 text-sm font-medium",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
