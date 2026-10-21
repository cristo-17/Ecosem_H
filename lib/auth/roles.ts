/**
 * Roles de la plataforma. La única fuente de verdad es la tabla de personal
 * del backend (`ventas.usuarios_operativos`), que la base escribe dentro del
 * token de acceso al emitirlo (`app_rol`, D-015 del backend). Quien no es
 * personal activo es pasajero.
 *
 * Estas funciones solo leen un rol que ya se verificó en el servidor. Mostrar
 * u ocultar un enlace con ellas es comodidad visual, nunca seguridad.
 */
export type RolUsuario = "pasajero" | "counter" | "supervisor" | "embarque";

const ROLES_DE_PERSONAL: readonly RolUsuario[] = ["counter", "supervisor", "embarque"];

export function rolDesdeClaims(claims: Record<string, unknown> | null | undefined): RolUsuario {
  const rol = claims?.app_rol as RolUsuario;
  return ROLES_DE_PERSONAL.includes(rol) ? rol : "pasajero";
}

/** Cualquier personal, incluido embarque. No decide la entrada al panel. */
export function esPersonal(rol: RolUsuario): boolean {
  return rol !== "pasajero";
}

/**
 * Panel interno: venta, caja, encomiendas, viajes y manifiesto. Counter y
 * supervisor; embarque no (D-XXX-rol-embarque del backend: esas rutas le
 * responden 403).
 */
export function usaPanel(rol: RolUsuario): boolean {
  return rol === "counter" || rol === "supervisor";
}

/**
 * /embarque: elegir viaje, bajar el paquete, escanear y sincronizar. Los
 * mismos tres roles que el backend deja pasar en `boardingStaff`.
 */
export function puedeEmbarcar(rol: RolUsuario): boolean {
  return rol === "counter" || rol === "supervisor" || rol === "embarque";
}

/** Precios, flota, conductores, alertas y tarifario son solo de supervisor. */
export function esSupervisor(rol: RolUsuario): boolean {
  return rol === "supervisor";
}
