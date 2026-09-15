"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { iniciarSesion } from "@/lib/auth/acciones";
import { RUTAS } from "@/lib/routes";

interface FormState {
  identificador: string;
  contrasena: string;
}

const FORM_VACIO: FormState = { identificador: "", contrasena: "" };

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validar(datos: FormState): Partial<Record<keyof FormState, string>> {
  const errores: Partial<Record<keyof FormState, string>> = {};

  const identificador = datos.identificador.trim();
  if (!identificador) {
    errores.identificador = "Este campo es obligatorio";
  } else if (/^\d+$/.test(identificador)) {
    if (identificador.length !== 8) errores.identificador = "El DNI debe tener 8 dígitos";
  } else if (!REGEX_CORREO.test(identificador)) {
    errores.identificador = "Ingresa tu DNI (8 dígitos) o un correo electrónico válido";
  }

  if (!datos.contrasena) errores.contrasena = "Este campo es obligatorio";

  return errores;
}

export function IngresarView() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(FORM_VACIO);
  const [errores, setErrores] = useState<ReturnType<typeof validar>>({});
  const [cargando, setCargando] = useState(false);

  function actualizar<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nuevosErrores = validar(form);
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    setCargando(true);
    try {
      await iniciarSesion(form);
      router.push(RUTAS.miPerfil);
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10 sm:py-14">
      <h1 className="text-xl font-semibold text-navy sm:text-2xl">Ingresar</h1>
      <p className="mt-1 text-sm text-navy/70">
        Accede con tu DNI o correo para ver tus pasajes y encomiendas.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6">
        <Card className="flex flex-col gap-4">
          <Input
            label="DNI o correo electrónico"
            value={form.identificador}
            onChange={(evento) => actualizar("identificador", evento.target.value)}
            errorText={errores.identificador}
          />
          <div>
            <Input
              label="Contraseña"
              type="password"
              value={form.contrasena}
              onChange={(evento) => actualizar("contrasena", evento.target.value)}
              errorText={errores.contrasena}
            />
            <Link
              href={RUTAS.recuperarClave}
              className="mt-2 inline-block text-sm font-medium text-secondary hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button type="submit" isLoading={cargando} className="mt-2 w-full">
            Ingresar
          </Button>
        </Card>
      </form>

      <p className="mt-4 text-center text-sm text-navy/70">
        ¿No tienes cuenta?{" "}
        <Link href={RUTAS.registro} className="font-medium text-secondary hover:underline">
          Regístrate
        </Link>
      </p>
    </main>
  );
}
