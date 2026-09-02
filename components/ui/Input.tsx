import { useId } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { LockIcon } from "@/components/ui/icons";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Texto de la etiqueta, siempre visible arriba del campo. */
  label: string;
  /** Texto de ayuda bajo el campo. Se oculta si hay errorText. */
  helperText?: string;
  /** Mensaje de error. Activa el estado de error y reemplaza a helperText. */
  errorText?: string;
  /**
   * Campo ya definido por un paso anterior (origen/destino en la búsqueda):
   * se ve atenuado con ícono de candado y no es editable, pero el valor
   * sigue visible y el campo sigue siendo focuseable/anunciado por lectores
   * de pantalla (por eso es readOnly, no disabled).
   */
  locked?: boolean;
}

export function Input({
  label,
  helperText,
  errorText,
  locked = false,
  id,
  className,
  disabled,
  ...props
}: InputProps) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const helperId = `${inputId}-helper`;
  const hasError = Boolean(errorText);

  return (
    <div className="flex w-full flex-col gap-1">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-text-primary"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          readOnly={locked}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={helperText || errorText ? helperId : undefined}
          className={cn(
            "h-12 w-full rounded-md border bg-white px-4 text-base text-text-primary transition",
            "placeholder:text-text-secondary",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary",
            "disabled:cursor-not-allowed disabled:opacity-40",
            locked &&
              "cursor-default border-transparent bg-navy/5 pr-11 text-text-secondary",
            !locked && hasError && "border-primary focus:border-primary",
            !locked &&
              !hasError &&
              "border-border-default focus:border-secondary",
            className,
          )}
          {...props}
        />
        {locked && (
          <LockIcon className="absolute top-1/2 right-4 -translate-y-1/2" />
        )}
      </div>
      {hasError ? (
        <p id={helperId} className="text-sm text-error-text">
          {errorText}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-sm text-text-secondary">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
