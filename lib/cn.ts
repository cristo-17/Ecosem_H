/**
 * Combina clases condicionales sin depender de clsx/tailwind-merge —
 * el proyecto evita dependencias no justificadas.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
