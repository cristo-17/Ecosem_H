import { cookies } from "next/headers";
import type { RolUsuario } from "@/lib/mock/sesion";

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

/**
 * Rol simulado (docs/prompts/16-navbar-por-rol.md, D-040 — reemplaza a
 * `ROL_MOCK`, la constante de mano que vivía en `lib/mock/sesion.ts`, D-016):
 * misma cookie de servidor que la sesión, para que el selector de rol de
 * desarrollo pueda cambiarlo sin editar código. `pasajero` es el valor por
 * defecto cuando no hay cookie — el estado de un visitante nuevo, con o sin
 * sesión.
 */
const NOMBRE_COOKIE_ROL_DEMO = "ecosem_rol_demo";

export async function obtenerRolDemo(): Promise<RolUsuario> {
  const cookieStore = await cookies();
  const valor = cookieStore.get(NOMBRE_COOKIE_ROL_DEMO)?.value;
  return valor === "counter" || valor === "supervisor" ? valor : "pasajero";
}

export async function establecerRolDemo(rol: RolUsuario): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(NOMBRE_COOKIE_ROL_DEMO, rol, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function eliminarRolDemo(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(NOMBRE_COOKIE_ROL_DEMO);
}
