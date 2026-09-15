import { useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> {
  /** Texto junto a la casilla. Puede llevar énfasis (p. ej. <strong>). */
  label: ReactNode;
  /** Mensaje de error, p. ej. cuando es obligatoria y no se marcó. */
  errorText?: string;
  id?: string;
}

export function Checkbox({ label, errorText, id, ...props }: CheckboxProps) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const errorId = `${inputId}-error`;
  const hasError = Boolean(errorText);

  return (
    <div className="flex w-full flex-col gap-1">
      <label
        htmlFor={inputId}
        className="flex min-h-11 cursor-pointer items-start gap-3 py-1"
      >
        <input
          id={inputId}
          type="checkbox"
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          className={cn(
            "mt-0.5 size-5 shrink-0 rounded-sm border bg-white text-primary accent-primary",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary",
            hasError ? "border-primary" : "border-border-default",
          )}
          {...props}
        />
        <span className="text-sm text-text-primary">{label}</span>
      </label>
      {hasError && (
        <p id={errorId} className="text-sm text-error-text">
          {errorText}
        </p>
      )}
    </div>
  );
}
