"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { iniciarSesion } from "@/lib/auth/acciones";
import { REGEX_CORREO } from "@/lib/auth/tipos";
import { vincularComprasDeEstaPestana } from "@/lib/api/cuenta";
import { RUTAS } from "@/lib/routes";

interface FormState {
  correo: string;
  contrasena: string;
}

const FORM_VACIO: FormState = { correo: "", contrasena: "" };

function validar(datos: FormState): Partial<Record<keyof FormState, string>> {
  const errores: Partial<Record<keyof FormState, string>> = {};
  const correo = datos.correo.trim();
  if (!correo) errores.correo = "Este campo es obligatorio";
  else if (!REGEX_CORREO.test(correo)) errores.correo = "Ingresa un correo electrónico válido";
  if (!datos.contrasena) errores.contrasena = "Este campo es obligatorio";
  return errores;
}

export interface IngresarViewProps {
  /** Ruta interna a la que volver tras entrar (ya validada en el servidor). */
  siguiente: string;
  /** El enlace de confirmación o recuperación ya venció o se usó. */
  enlaceInvalido: boolean;
  /** Se llegó aquí porque la sesión terminó a media acción. */
  sesionVencida: boolean;
}

export function IngresarView({ siguiente, enlaceInvalido, sesionVencida }: IngresarViewProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(FORM_VACIO);
  const [errores, setErrores] = useState<ReturnType<typeof validar>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  function actualizar<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nuevosErrores = validar(form);
    setErrores(nuevosErrores);
    setErrorGeneral(null);
    if (Object.keys(nuevosErrores).length > 0) return;

    setCargando(true);
    const resultado = await iniciarSesion({ correo: form.correo, contrasena: form.contrasena });
    if (resultado.error) {
      setErrorGeneral(resultado.error);
      setCargando(false);
      return;
    }
    // Lo comprado sin cuenta en esta pestaña pasa a la cuenta (D-048).
    await vincularComprasDeEstaPestana();
    router.replace(siguiente);
    router.refresh();
  }

  const aviso = enlaceInvalido
    ? "El enlace venció o ya se usó. Inicia sesión, o pide uno nuevo."
    : sesionVencida
      ? "Tu sesión terminó. Vuelve a ingresar para continuar donde estabas."
      : null;

  return (
    <main className="mx-auto max-w-md px-4 py-10 sm:py-14">
      <h1 className="text-xl font-semibold text-navy sm:text-2xl">Ingresar</h1>
      <p className="mt-1 text-sm text-navy/70">
        Accede con tu correo para ver tus compras. Para comprar pasajes no necesitas una cuenta.
      </p>

      {aviso && (
        <p role="status" className="mt-4 rounded-field bg-info-fill p-4 text-sm text-info-text">
          {aviso}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-6">
        <Card className="flex flex-col gap-4">
          <Input
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            value={form.correo}
            onChange={(evento) => actualizar("correo", evento.target.value)}
            errorText={errores.correo}
          />
          <div>
            <Input
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              value={form.contrasena}
              onChange={(evento) => actualizar("contrasena", evento.target.value)}
              errorText={errores.contrasena}
            />
            <Link
              href={RUTAS.recuperarClave}
              className="mt-2 inline-block min-h-11 py-2 text-sm font-medium text-secondary hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {errorGeneral && (
            <p role="alert" className="rounded-field bg-error-fill p-3 text-sm text-error-text">
              {errorGeneral}
            </p>
          )}

          <Button type="submit" isLoading={cargando} className="mt-2 w-full">
            Ingresar
          </Button>
        </Card>
      </form>

      <p className="mt-4 text-center text-sm text-navy/70">
        ¿No tienes cuenta?{" "}
        <Link
          href={`${RUTAS.registro}?${new URLSearchParams({ siguiente }).toString()}`}
          className="font-medium text-secondary hover:underline"
        >
          Regístrate
        </Link>
      </p>
    </main>
  );
}
