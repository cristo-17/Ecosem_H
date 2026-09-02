import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type CardElevation = "low" | "medium" | "high";

const ELEVATION_CLASSES: Record<CardElevation, string> = {
  low: "shadow-low",
  medium: "shadow-medium",
  high: "shadow-high",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Nivel de sombra. "low" es el reposo; usa "medium"/"high" para estados
   * destacados o seleccionados (p. ej. la tarjeta de viaje elegida). */
  elevation?: CardElevation;
}

export function Card({
  elevation = "low",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-white p-4",
        ELEVATION_CLASSES[elevation],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
