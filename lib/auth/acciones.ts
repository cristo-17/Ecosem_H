"use server";

import type { CredencialesIngreso, DatosRegistro, ResultadoAuth } from "@/lib/auth/tipos";
import type { RolUsuario } from "@/lib/mock/sesion";
import {
  crearCookieSesion,
  eliminarCookieSesion,
  establecerRolDemo,
  eliminarRolDemo,
} from "@/lib/auth/sesion";

/**
 * Mock: sin backend todavía no hay contra qué validar el identificador ni la
 * contraseña (docs/prompts/07-autenticacion.md) — el formato ya se validó en
 * el cliente. La firma es la definitiva: cuando entre Supabase Auth, acá va
 * supabase.auth.signInWithPassword(...) y este mismo shape de retorno.
 */
export async function iniciarSesion(credenciales: CredencialesIngreso): Promise<ResultadoAuth> {
  void credenciales;
  await crearCookieSesion();
  return {};
}

/** Mismo mock: crea la sesión sin persistir los datos en ningún lado. */
export async function registrar(datos: DatosRegistro): Promise<ResultadoAuth> {
  void datos;
  await crearCookieSesion();
  return {};
}

export async function cerrarSesion(): Promise<void> {
  await eliminarCookieSesion();
}

/**
 * Selector de rol para demo y QA (docs/prompts/16-navbar-por-rol.md):
 * alterna entre sin sesión, pasajero, counter y supervisor sin editar
 * código. Ninguna verificación de por medio porque no es una barrera de
 * seguridad — es exactamente lo que reemplaza a `ROL_MOCK` (D-040), la
 * misma falta de seguridad real que ya tenía esa constante, solo que ahora
 * se cambia desde la interfaz en vez de editando el archivo. El guard de
 * NODE_ENV es la segunda mitad de la restricción del prompt ("no debe
 * aparecer en el build de producción"): la interfaz ya no se renderiza en
 * producción (ver `components/layout/SelectorRolDemo.tsx`), y esta acción
 * tampoco hace nada aunque alguien la invoque directamente.
 */
export async function cambiarRolDemo(opcion: RolUsuario | "sin-sesion"): Promise<void> {
  if (process.env.NODE_ENV === "production") return;

  if (opcion === "sin-sesion") {
    await eliminarCookieSesion();
    await eliminarRolDemo();
    return;
  }

  await crearCookieSesion();
  await establecerRolDemo(opcion);
}
