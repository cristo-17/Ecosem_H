import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "principal"
  | "secundario"
  | "terciario"
  | "destructivo";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Tipo visual del botón. Por defecto "principal". */
  variant?: ButtonVariant;
  /**
   * Activa el estado de carga: muestra spinner + "Procesando..." y bloquea
   * el clic. Obligatorio en cualquier botón que dispare una operación de red.
   */
  isLoading?: boolean;
  children: ReactNode;
}

// Variante -> clases de color por estado. hover/pressed se resuelven con
// filtros de brillo o tintes de opacidad sobre el token existente (no hay
// tono "hover" ni "pressed" definido en el skill, y así no se inventa un
// color nuevo). El salto entre hover y pressed es deliberadamente más
// grande que el salto entre default y hover, para que pressed no se lea
// como "el mismo hover un poco más oscuro" sino como un estado propio.
//
// Destructivo usa fondo blanco sólido (no transparente) + borde/texto rojo,
// en vez del rojo relleno de principal: junto a "Sí, Reservar" en un modal
// de confirmación, dos botones con relleno rojo son ambiguos sobre cuál es
// la acción irreversible. El contraste relleno-vs-contorno es la señal, no
// el tono de rojo.
//
// Secundario (v2) pasa de relleno a contorno: mismo tratamiento de fondo
// blanco + borde/texto de color que destructivo, para que "una acción
// primaria por pantalla" sea legible de un vistazo (solo principal lleva
// relleno sólido).
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  principal:
    "bg-primary text-white border border-transparent hover:brightness-95 active:brightness-85",
  secundario:
    "bg-white text-secondary border border-secondary hover:bg-secondary/5 active:bg-secondary/15",
  terciario:
    "bg-transparent text-text-primary border border-transparent hover:bg-navy/5 active:bg-navy/15",
  destructivo:
    "bg-white text-primary border border-primary hover:bg-primary/5 active:bg-primary/15",
};

function Spinner() {
  return (
    <svg
      className="size-5 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
      />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "principal",
      isLoading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type="button"
        disabled={isDisabled}
        aria-busy={isLoading}
        className={cn(
          "inline-flex h-12 min-w-11 items-center justify-center gap-2 rounded-pill px-6 text-base font-medium transition",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary",
          "disabled:pointer-events-none disabled:opacity-40",
          VARIANT_CLASSES[variant],
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Spinner />
            Procesando...
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
