import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  /** Texto explicativo: debe sugerir qué cambiar, no solo decir "vacío". */
  description: string;
  actionLabel: string;
  onAction: () => void;
  /** Contenido opcional debajo del botón (p. ej. un canal de contacto alterno). */
  footer?: ReactNode;
  className?: string;
}

// El botón siempre es "secundario": el skill define ese tipo para
// "Regresar, Seleccionar", y la acción de una pantalla vacía es
// literalmente volver al paso anterior — no es una elección del caller.
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  footer,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 py-12 text-center",
        className,
      )}
    >
      <div aria-hidden="true" className="text-navy/30">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-navy">{title}</h3>
      <p className="max-w-xs text-sm text-navy/70">{description}</p>
      <Button variant="secundario" onClick={onAction} className="mt-2">
        {actionLabel}
      </Button>
      {footer}
    </div>
  );
}
