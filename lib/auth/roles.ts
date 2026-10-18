/**
 * Roles de la plataforma. La única fuente de verdad es la tabla de personal
 * del backend (`ventas.usuarios_operativos`), que la base escribe dentro del
 * token de acceso al emitirlo (`app_rol`, D-015 del backend). Quien no es
 * personal activo es pasajero.
 *
 * Estas funciones solo leen un rol que ya se verificó en el servidor. Mostrar
 * u ocultar un enlace con ellas es comodidad visual, nunca seguridad.
 */
export type RolUsuario = "pasajero" | "counter" | "supervisor";

export function rolDesdeClaims(claims: Record<string, unknown> | null | undefined): RolUsuario {
  const rol = claims?.app_rol;
  return rol === "counter" || rol === "supervisor" ? rol : "pasajero";
}

export function esPersonal(rol: RolUsuario): boolean {
  return rol !== "pasajero";
}

/** Precios, flota, conductores, alertas y tarifario son solo de supervisor. */
export function esSupervisor(rol: RolUsuario): boolean {
  return rol === "supervisor";
}
