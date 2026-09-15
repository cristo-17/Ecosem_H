"use server";

import type { CredencialesIngreso, DatosRegistro, ResultadoAuth } from "@/lib/auth/tipos";
import { crearCookieSesion, eliminarCookieSesion } from "@/lib/auth/sesion";

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
