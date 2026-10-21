import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { clienteSupabaseServidor } from "@/lib/supabase/servidor";
import { esSupervisor, puedeEmbarcar, rolDesdeClaims, usaPanel, type RolUsuario } from "@/lib/auth/roles";
import { RUTAS } from "@/lib/routes";

export interface Sesion {
  /** Identificador interno de Supabase Auth. No es un dato personal. */
  userId: string;
  rol: RolUsuario;
  /**
   * Agencia del personal de counter (`app_terminal_id`, firmado por la base
   * igual que el rol). Nulo para pasajeros y para el supervisor, que no tiene
   * una agencia fija. Solo decide qué se muestra: el backend la vuelve a tomar
   * del token y de la tabla de personal.
   */
  terminalId: string | null;
  /** Para saludar. Lo escribió el propio usuario al registrarse. */
  nombre: string | null;
  correo: string | null;
}

/**
 * La sesión de quien hace la petición, verificada en el servidor.
 *
 * `getClaims()` comprueba la firma del token de acceso (ES256, con las claves
 * públicas del proyecto), su vencimiento y su emisor. El rol sale de `app_rol`,
 * que pone la base al emitir el token: editar cookies o cualquier cosa en el
 * navegador rompe la firma y deja sin sesión. Nunca se mira `user_metadata`
 * para decidir permisos.
 *
 * `cache` la memoriza durante un render: varios layouts y páginas preguntan
 * sin repetir la verificación.
 */
export const obtenerSesion = cache(async (): Promise<Sesion | null> => {
  const supabase = await clienteSupabaseServidor();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub || claims.is_anonymous === true) return null;
  const metadatos = (claims.user_metadata ?? {}) as Record<string, unknown>;
  return {
    userId: claims.sub,
    rol: rolDesdeClaims(claims as Record<string, unknown>),
    terminalId: typeof claims.app_terminal_id === "string" ? claims.app_terminal_id : null,
    nombre: typeof metadatos.nombre === "string" ? metadatos.nombre : null,
    correo: typeof claims.email === "string" ? claims.email : null,
  };
});

export async function haySesionActiva(): Promise<boolean> {
  return (await obtenerSesion()) !== null;
}

/** Ruta de ingreso que, al entrar, vuelve a donde estaba. */
export function rutaIngreso(siguiente: string): string {
  return `${RUTAS.ingresar}?${new URLSearchParams({ siguiente }).toString()}`;
}

export type Acceso =
  | { tipo: "permitido"; sesion: Sesion }
  | { tipo: "denegado"; sesion: Sesion };

/**
 * Protege una sección en el servidor. Sin sesión, al ingreso (y de vuelta
 * aquí al entrar). Con sesión pero sin el rol, "denegado": el layout muestra
 * la pantalla de acceso denegado y no renderiza nada de la sección.
 *
 * Es la barrera de la interfaz. Los datos reales los protegen además los
 * servicios, que verifican el token y, para el personal, que siga activo en
 * la base (D-015 del backend).
 */
export async function exigirAcceso(
  requisito: "sesion" | "panel" | "embarque" | "supervisor",
  rutaActual: string,
): Promise<Acceso> {
  const sesion = await obtenerSesion();
  if (!sesion) redirect(rutaIngreso(rutaActual));
  const permitido =
    requisito === "sesion" ||
    (requisito === "panel" && usaPanel(sesion.rol)) ||
    (requisito === "embarque" && puedeEmbarcar(sesion.rol)) ||
    (requisito === "supervisor" && esSupervisor(sesion.rol));
  return { tipo: permitido ? "permitido" : "denegado", sesion };
}
