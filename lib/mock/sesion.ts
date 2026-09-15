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
