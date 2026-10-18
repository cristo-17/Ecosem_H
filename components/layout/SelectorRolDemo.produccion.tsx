/**
 * Sustituto de SelectorRolDemo en la compilación de producción
 * (next.config.ts lo pone en su lugar con `resolveAlias`). No dibuja nada
 * y no importa nada: ni el selector, ni su acción de cuentas de prueba
 * (lib/auth/desarrollo.ts), ni los nombres de sus variables llegan al build.
 */
export type EstadoDemo = "sin-sesion" | "pasajero" | "counter" | "supervisor";

export function SelectorRolDemo(props: { estadoActual: EstadoDemo }): null {
  void props;
  return null;
}
