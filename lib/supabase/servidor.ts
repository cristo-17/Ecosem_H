import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para Server Components, Server Actions y Route
 * Handlers. La sesión vive en cookies que escribe Supabase Auth; aquí solo se
 * leen y, cuando se puede (acciones y route handlers), se renuevan.
 *
 * Solo la URL y la anon key, que son públicas. Ninguna clave de servicio.
 */
export async function clienteSupabaseServidor() {
  const almacen = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => almacen.getAll(),
        setAll(porEscribir) {
          try {
            for (const { name, value, options } of porEscribir) almacen.set(name, value, options);
          } catch {
            // Un Server Component no puede escribir cookies. La renovación ya
            // la hizo proxy.ts antes de renderizar.
          }
        },
      },
    },
  );
}
