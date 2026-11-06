import { cn } from "@/lib/cn";
import type { AlertLevel } from "@/lib/types/contratos-panel";

// Vocabulario propio para alertas de flota (no Badge: ese está fijado a los
// 5 estados de pasajes/encomiendas). Vencido reutiliza el estado de error;
// la etiqueta lo distingue sin introducir colores adicionales.
const CONFIG: Record<AlertLevel, { label: string; className: string }> = {
  info: { label: "Por vencer", className: "bg-info-fill text-info-text" },
  warning: { label: "Atención", className: "bg-warning-fill text-warning-text" },
  error: { label: "Urgente", className: "bg-error-fill text-error-text" },
  vencido: { label: "Vencido", className: "bg-error-fill text-error-text" },
};

export interface UrgenciaPillProps {
  urgencia: AlertLevel;
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
