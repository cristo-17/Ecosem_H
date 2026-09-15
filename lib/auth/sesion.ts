import { cookies } from "next/headers";

/**
 * Cookie de sesión: reemplaza a HAY_SESION_MOCK (antes una constante fija en
 * lib/mock/sesion.ts). Server-side, httpOnly — nunca localStorage (regla de
 * CLAUDE.md). Solo guarda una marca de "hay sesión", nunca DNI, nombre,
 * correo ni celular (Ley 29733): esos datos para mostrar en pantalla siguen
 * viniendo de USUARIO_MOCK hasta que exista Supabase Auth.
 */
const NOMBRE_COOKIE_SESION = "ecosem_sesion";

export async function haySesionActiva(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(NOMBRE_COOKIE_SESION)?.value === "activa";
}

export async function crearCookieSesion(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(NOMBRE_COOKIE_SESION, "activa", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function eliminarCookieSesion(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(NOMBRE_COOKIE_SESION);
}
