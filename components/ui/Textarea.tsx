import { useId } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Texto de la etiqueta, siempre visible arriba del campo. */
  label: string;
  /** Texto de ayuda bajo el campo. Se oculta si hay errorText. */
  helperText?: string;
  /** Mensaje de error. Activa el estado de error y reemplaza a helperText. */
  errorText?: string;
}

// Mismo lenguaje visual que Input (etiqueta arriba, radio 8px, mismos
// estados normal/foco/error/bloqueado vía disabled) aplicado a texto
// multilínea: el skill no define un componente de textarea aparte, así que
// se extiende el patrón de campo existente en vez de inventar uno nuevo.
export function Textarea({
  label,
  helperText,
  errorText,
  id,
  className,
  disabled,
  rows = 4,
  ...props
}: TextareaProps) {
  const reactId = useId();
  const textareaId = id ?? reactId;
  const helperId = `${textareaId}-helper`;
  const hasError = Boolean(errorText);

  return (
    <div className="flex w-full flex-col gap-1">
      <label htmlFor={textareaId} className="text-sm font-medium text-navy">
        {label}
      </label>
      <textarea
        id={textareaId}
        rows={rows}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={helperText || errorText ? helperId : undefined}
        className={cn(
          "w-full resize-y rounded-field border bg-white px-4 py-3 text-base text-navy transition",
          "placeholder:text-navy/40",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary",
          "disabled:cursor-not-allowed disabled:opacity-40",
          hasError ? "border-primary focus:border-primary" : "border-navy/20 focus:border-secondary",
          className
        )}
        {...props}
      />
      {hasError ? (
        <p id={helperId} className="text-sm text-error-text">
          {errorText}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-sm text-navy/70">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
