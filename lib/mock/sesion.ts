import { maskDocumento } from "@/lib/format";

/**
 * Datos de perfil simulados: todavía no hay backend de autenticación (ver
 * docs/prompts/07-autenticacion.md). Si hay sesión o no ya lo decide una
 * cookie de servidor (lib/auth/sesion.ts) en vez de una constante fija —
 * esto solo cubre qué mostrar en pantalla mientras no exista Supabase Auth.
 */
export interface UsuarioSesion {
  nombre: string;
  documentoEnmascarado: string;
}

// El DNI completo nunca debería llegar al cliente en producción (Ley
// 29733): se enmascara acá mismo, en el mock, para no tener ni en
// desarrollo un archivo con el número completo dando vueltas por el bundle.
const DOCUMENTO_MOCK = "74812213";

export const USUARIO_MOCK: UsuarioSesion = {
  nombre: "Carlos Mendoza Ruiz",
  documentoEnmascarado: maskDocumento(DOCUMENTO_MOCK),
};

/**
 * Rol simulado (docs/prompts/08-panel-counter.md, reutilizado por
 * 09-manifiesto-sutran.md): el panel de counter y el manifiesto son para
 * personal, no para pasajeros. Como todavía no hay un rol real por usuario,
 * el valor actual vive en una cookie de servidor
 * (`lib/auth/sesion.ts` → `obtenerRolDemo()`), no en una constante de mano
 * como al principio (D-016) — así el selector de rol de
 * `docs/prompts/16-navbar-por-rol.md` puede cambiarlo sin editar código ni
 * reiniciar el server. La verificación real de acceso va a vivir
 * server-side con RLS cuando exista backend; esto sigue siendo solo la
 * interfaz, no una barrera de seguridad.
 */
export type RolUsuario = "pasajero" | "counter" | "supervisor";

export function esPersonal(rol: RolUsuario): boolean {
  return rol !== "pasajero";
}

/**
 * El motor de precios (docs/prompts/11-motor-precios.md) es solo para
 * supervisor — un counter no debería poder cambiar tarifas. Es la primera
 * pantalla del panel con un requisito de rol más estricto que "es
 * personal"; hasta ahora alcanzaba con esPersonal().
 */
export function esSupervisor(rol: RolUsuario): boolean {
  return rol === "supervisor";
}
