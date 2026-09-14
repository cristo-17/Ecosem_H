import { maskDocumento } from "@/lib/format";

/**
 * Sesión simulada: todavía no hay backend de autenticación (ver
 * docs/prompts/02-perfil-usuario.md). HAY_SESION_MOCK es el único
 * interruptor — no hay login/logout reales, así que es una constante que se
 * cambia acá a mano, nunca un valor en localStorage (regla de CLAUDE.md).
 */
export const HAY_SESION_MOCK = true;

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
