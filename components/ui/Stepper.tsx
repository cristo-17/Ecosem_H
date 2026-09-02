import { cn } from "@/lib/cn";
import { CheckIcon } from "@/components/ui/icons";

// Cuatro pasos fijos del skill. Nunca cambiar el número ni los nombres.
const STEPS = ["Búsqueda", "Selección", "Datos", "Pago"] as const;

export interface StepperProps {
  /** Paso activo, 1 a 4. */
  currentStep: 1 | 2 | 3 | 4;
  className?: string;
}

export function Stepper({ currentStep, className }: StepperProps) {
  return (
    <ol aria-label="Progreso de compra" className={cn("flex items-start", className)}>
      {STEPS.map((label, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        const isLast = stepNumber === STEPS.length;

        return (
          <li key={label} className={cn("flex items-start", !isLast && "flex-1")}>
            <div className="flex flex-col items-center gap-1">
              <span
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                  isCompleted && "bg-secondary text-white",
                  isActive && "bg-primary text-white",
                  !isCompleted && !isActive && "bg-navy/10 text-navy/40"
                )}
              >
                {isCompleted ? <CheckIcon className="!text-white" /> : stepNumber}
              </span>
              <span
                className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  isActive && "text-navy",
                  isCompleted && "text-navy/70",
                  !isActive && !isCompleted && "text-navy/40"
                )}
              >
                {label}
              </span>
            </div>
            {/* mt-4 centra la línea contra el círculo de 32px (size-8), no
                contra toda la columna con la etiqueta debajo. */}
            {!isLast && (
              <div
                aria-hidden="true"
                className={cn("mx-2 mt-4 h-0.5 flex-1", isCompleted ? "bg-secondary" : "bg-navy/10")}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
