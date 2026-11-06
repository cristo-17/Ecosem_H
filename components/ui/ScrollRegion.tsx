import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Región de tabla alcanzable con Tab; las flechas desplazan el scroll nativo. */
export function ScrollRegion({ children, label, className }: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  return <div role="region" aria-label={`${label}. Usa las flechas para desplazarte horizontalmente.`}
    tabIndex={0}
    className={cn("overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary", className)}>
    {children}
  </div>;
}
