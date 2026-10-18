"use server";

import { clienteSupabaseServidor } from "@/lib/supabase/servidor";
import type { RolUsuario } from "@/lib/auth/roles";

/**
 * SOLO DESARROLLO. Cambia de cuenta de prueba desde la barra de rol
 * (components/layout/SelectorRolDemo.tsx) iniciando sesión de verdad con
 * Supabase Auth: no da roles, el rol lo trae el token de cada cuenta.
 *
 * Las credenciales viven en .env.local (no se sube) en variables sin
 * NEXT_PUBLIC_, así que nunca llegan al navegador. Las cuentas de counter y
 * supervisor las crea el administrador con `ventas.crear_primer_supervisor`
 * y `asignar_rol_operativo` (docs/DESPLIEGUE.md del backend).
 *
 * Fuera de desarrollo no hace nada aunque alguien la invoque. Además, en el
 * build de producción esta acción no se incluye: el único que la importa es
 * el selector, que app/layout.tsx solo renderiza en desarrollo.
 */
export async function entrarComoCuentaDePrueba(
  opcion: RolUsuario | "sin-sesion",
): Promise<{ error?: string }> {
  if (process.env.NODE_ENV !== "development") return { error: "No disponible." };

  const supabase = await clienteSupabaseServidor();
  await supabase.auth.signOut({ scope: "local" });
  if (opcion === "sin-sesion") return {};

  const prefijo = `DEV_CUENTA_${opcion.toUpperCase()}`;
  const correo = process.env[`${prefijo}_CORREO`];
  const clave = process.env[`${prefijo}_CLAVE`];
  if (!correo || !clave) {
    return { error: `Falta ${prefijo}_CORREO o ${prefijo}_CLAVE en .env.local.` };
  }
  const { error } = await supabase.auth.signInWithPassword({ email: correo, password: clave });
  return error ? { error: `No se pudo entrar con la cuenta de prueba de ${opcion}.` } : {};
}
