import { maskDocumento } from "@/lib/format";

/**
 * Nombre de personal simulado para las pantallas del panel que siguen con
 * mock (alertas, precios) y las encomiendas mock del perfil. La sesión y el
 * rol reales salen de Supabase Auth (lib/auth/sesion.ts, lib/auth/roles.ts).
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
