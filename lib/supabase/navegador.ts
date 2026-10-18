"use client";

import { createBrowserClient } from "@supabase/ssr";

let cliente: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Cliente de Supabase en el navegador: lee la misma sesión (cookies) que el
 * servidor y la renueva sola. Se usa para obtener el token de acceso que va
 * en `Authorization` hacia los servicios. Lo que el navegador crea saber del
 * rol nunca decide nada: el servidor y los servicios verifican el token.
 */
export function clienteSupabaseNavegador() {
  cliente ??= createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return cliente;
}

/** Token de acceso vigente, renovado si hacía falta. null sin sesión. */
export async function tokenDeAcceso(): Promise<string | null> {
  const supabase = clienteSupabaseNavegador();
  // getSession renueva el token si venció. Su contenido no se usa para
  // decidir nada en el cliente: solo se reenvía a un servicio que lo verifica.
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
