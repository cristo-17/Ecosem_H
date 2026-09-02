import { cn } from "@/lib/cn";

export type BadgeStatus =
  | "confirmado"
  | "pendiente"
  | "cancelado"
  | "en-ruta"
  | "completado";

// El skill define color semántico para 4 estados (éxito/advertencia/error/
// info) pero pide 5 placas. "Completado" no tiene slot semántico propio, así
// que usa navy (ya existente, tono institucional/neutro) en vez de inventar
// un color: es un estado final/archivado, no uno que requiera atención como
// los otros cuatro.
const STATUS_CONFIG: Record<BadgeStatus, { label: string; className: string }> =
  {
    confirmado: {
      label: "Confirmado",
      className: "bg-success-fill text-success-text",
    },
    pendiente: {
      label: "Pendiente",
      className: "bg-warning-fill text-warning-text",
    },
    cancelado: {
      label: "Cancelado",
      className: "bg-error-fill text-error-text",
    },
    "en-ruta": {
      label: "En ruta",
      className: "bg-info-fill text-info-text",
    },
    completado: {
      label: "Completado",
      className: "bg-navy text-white",
    },
  };

export interface BadgeProps {
  status: BadgeStatus;
  className?: string;
}

export function Badge({ status, className }: BadgeProps) {
  const config = STATUS_CONFIG[status];
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
