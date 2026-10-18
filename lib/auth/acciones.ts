"use server";

import { headers } from "next/headers";
import type { AuthError } from "@supabase/supabase-js";
import { clienteSupabaseServidor } from "@/lib/supabase/servidor";
import {
  LARGO_MINIMO_CONTRASENA,
  REGEX_CORREO,
  type CredencialesIngreso,
  type DatosRegistro,
  type ResultadoAuth,
} from "@/lib/auth/tipos";
import { rutaInterna } from "@/lib/auth/rutas";
import { RUTAS } from "@/lib/routes";

// Lo que llega a una Server Action viene del navegador: se vuelve a validar
// aquí, aunque el formulario ya lo haya hecho.
function correoValido(correo: unknown): correo is string {
  return typeof correo === "string" && correo.length <= 254 && REGEX_CORREO.test(correo.trim());
}

function contrasenaValida(contrasena: unknown): contrasena is string {
  return (
    typeof contrasena === "string" &&
    contrasena.length >= LARGO_MINIMO_CONTRASENA &&
    contrasena.length <= 72
  );
}

async function origen(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const protocolo = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${protocolo}://${host}`;
}

/** Mensaje para el usuario. Nunca el texto crudo de Supabase ni datos personales. */
function mensaje(error: AuthError): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Correo o contraseña incorrectos.";
    case "email_not_confirmed":
      return "Todavía no confirmaste tu correo. Revisa tu bandeja de entrada (y la de spam).";
    case "weak_password":
      return "La contraseña es muy débil. Usa al menos 8 caracteres combinando letras y números.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Hiciste demasiados intentos seguidos. Espera unos minutos y vuelve a intentarlo.";
    case "same_password":
      return "La nueva contraseña tiene que ser distinta de la anterior.";
    default:
      return error.status === 0 || error.name === "AuthRetryableFetchError"
        ? "No hay conexión con el servidor. Revisa tu conexión e intenta nuevamente."
        : "No pudimos completar la operación. Intenta nuevamente en unos minutos.";
  }
}

export async function iniciarSesion(credenciales: CredencialesIngreso): Promise<ResultadoAuth> {
  if (!correoValido(credenciales?.correo) || typeof credenciales?.contrasena !== "string") {
    return { error: "Correo o contraseña incorrectos." };
  }
  const supabase = await clienteSupabaseServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: credenciales.correo.trim(),
    password: credenciales.contrasena,
  });
  return error ? { error: mensaje(error) } : {};
}

export async function registrar(datos: DatosRegistro): Promise<ResultadoAuth> {
  const nombre = typeof datos?.nombre === "string" ? datos.nombre.trim() : "";
  if (!nombre || nombre.length > 100) return { error: "Revisa tu nombre." };
  if (!correoValido(datos.correo)) return { error: "Ingresa un correo electrónico válido." };
  if (!contrasenaValida(datos.contrasena)) {
    return { error: `La contraseña debe tener entre ${LARGO_MINIMO_CONTRASENA} y 72 caracteres.` };
  }

  const siguiente = rutaInterna(datos.siguiente, RUTAS.miPerfil);
  const supabase = await clienteSupabaseServidor();
  const { data, error } = await supabase.auth.signUp({
    email: datos.correo.trim(),
    password: datos.contrasena,
    options: {
      // Solo el nombre, para saludar. Nunca DNI ni celular: no hacen falta
      // para la cuenta y quedarían en metadatos que el usuario puede editar.
      data: { nombre },
      emailRedirectTo: `${await origen()}/auth/confirmar?${new URLSearchParams({ siguiente })}`,
    },
  });
  if (error) return { error: mensaje(error) };
  // Sin sesión: el proyecto pide confirmar el correo. Supabase responde igual
  // si el correo ya tenía cuenta, para no revelar quién está registrado.
  return data.session ? {} : { requiereConfirmacion: true };
}

export async function cerrarSesion(): Promise<void> {
  const supabase = await clienteSupabaseServidor();
  // "local": cierra esta sesión, no las de los otros dispositivos.
  await supabase.auth.signOut({ scope: "local" });
}

export async function enviarRecuperacion(correo: string): Promise<ResultadoAuth> {
  if (!correoValido(correo)) return { error: "Ingresa un correo electrónico válido." };
  const supabase = await clienteSupabaseServidor();
  const { error } = await supabase.auth.resetPasswordForEmail(correo.trim(), {
    redirectTo: `${await origen()}/auth/confirmar?${new URLSearchParams({
      siguiente: RUTAS.nuevaClave,
    })}`,
  });
  // No se distingue si el correo tiene cuenta o no: el mensaje es el mismo.
  if (error && error.code !== "user_not_found") return { error: mensaje(error) };
  return {};
}

/** Tras volver del enlace de recuperación, con la sesión que abrió ese enlace. */
export async function cambiarContrasena(contrasena: string): Promise<ResultadoAuth> {
  if (!contrasenaValida(contrasena)) {
    return { error: `La contraseña debe tener entre ${LARGO_MINIMO_CONTRASENA} y 72 caracteres.` };
  }
  const supabase = await clienteSupabaseServidor();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) {
    return { error: "El enlace venció o ya se usó. Pide uno nuevo desde «¿Olvidaste tu contraseña?»." };
  }
  const { error } = await supabase.auth.updateUser({ password: contrasena });
  return error ? { error: mensaje(error) } : {};
}
