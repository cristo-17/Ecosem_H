import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { clienteSupabaseServidor } from "@/lib/supabase/servidor";
import { rutaInterna } from "@/lib/auth/rutas";
import { RUTAS } from "@/lib/routes";

/**
 * Vuelta desde los enlaces que envía Supabase Auth por correo (confirmar la
 * cuenta, recuperar la contraseña). Cambia el código del enlace por una
 * sesión y lleva a `siguiente`, que solo puede ser una ruta interna.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const siguiente = rutaInterna(url.searchParams.get("siguiente"), RUTAS.miPerfil);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const tipo = url.searchParams.get("type") as EmailOtpType | null;

  const supabase = await clienteSupabaseServidor();
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && tipo
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo })
      : { error: new Error("enlace incompleto") };

  if (error) {
    const destino = new URL(RUTAS.ingresar, url);
    destino.searchParams.set("enlace", "invalido");
    return NextResponse.redirect(destino);
  }
  return NextResponse.redirect(new URL(siguiente, url));
}
