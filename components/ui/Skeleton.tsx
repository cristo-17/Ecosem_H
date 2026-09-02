import { cn } from "@/lib/cn";

export type SkeletonVariant = "card" | "text" | "button";

export interface SkeletonShapeProps {
  variant: SkeletonVariant;
  /** Solo aplica a variant="text": cuántas líneas mostrar. */
  lines?: number;
  className?: string;
}

/**
 * Pieza visual del esqueleto, sin role="status" propio (aria-hidden). Úsala
 * directamente cuando compongas varias en una lista/grilla (p. ej. tarjetas
 * de viaje mientras cargan resultados): el wrapper de la lista debe llevar
 * un único role="status", no cada pieza. Para un esqueleto suelto usa
 * <Skeleton>, que ya incluye ese wrapper.
 */
// El radio de cada variante sigue al del componente real que imita (regla
// del skill: "Radius matches the content they represent"), no un valor
// único para todo el skeleton: card imita a Card (radius-md), button imita
// a Button (radius-pill, extremos totalmente redondeados) y text usa
// radius-sm — el token más chico definido — para una barra angosta de 12px.
export function SkeletonShape({
  variant,
  lines = 3,
  className,
}: SkeletonShapeProps) {
  if (variant === "card") {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "h-40 w-full animate-pulse rounded-md bg-skeleton",
          className,
        )}
      />
    );
  }

  if (variant === "button") {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "h-12 w-32 animate-pulse rounded-pill bg-skeleton",
          className,
        )}
      />
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className={cn(
            "h-3 animate-pulse rounded-sm bg-skeleton",
            index === lines - 1 ? "w-2/3" : "w-full",
          )}
        />
      ))}
    </div>
  );
}

export type SkeletonProps = SkeletonShapeProps;

// role="status" + aria-label anuncia "Cargando" a lectores de pantalla una
// vez. Si vas a mostrar varias piezas juntas, usa SkeletonShape y pon este
// rol una sola vez en el contenedor de la lista (ver SkeletonShape).
export function Skeleton(props: SkeletonProps) {
  return (
    <div role="status" aria-label="Cargando">
      <SkeletonShape {...props} />
    </div>
  );
}
