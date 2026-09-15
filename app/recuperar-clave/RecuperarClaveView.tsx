"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";
import { RUTAS } from "@/lib/routes";

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RecuperarClaveView() {
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!correo) {
      setError("Este campo es obligatorio");
      return;
    }
    if (!REGEX_CORREO.test(correo)) {
      setError("Ingresa un correo electrónico válido");
      return;
    }

    setError(undefined);
    // Sin backend todavía (docs/prompts/07-autenticacion.md): solo el flujo
    // visual de confirmación, sin envío real de correo.
    setEnviando(true);
    setTimeout(() => {
      setEnviando(false);
      setEnviado(true);
    }, 600);
  }

  if (enviado) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-14 text-center sm:py-20">
        <span className="flex size-14 items-center justify-center rounded-full bg-success-fill">
          <CheckIcon className="!size-6 text-success-text" />
        </span>
        <h1 className="text-xl font-semibold text-navy sm:text-2xl">Revisa tu correo</h1>
        <p className="max-w-sm text-sm text-navy/70">
          Si <span className="font-medium text-navy">{correo}</span> tiene una cuenta con
          nosotros, te enviamos un enlace para restablecer tu contraseña.
        </p>
        <Link
          href={RUTAS.ingresar}
          className="mt-2 inline-flex h-12 items-center justify-center rounded-pill bg-primary px-6 text-base font-medium text-white transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
        >
          Volver a ingresar
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10 sm:py-14">
      <h1 className="text-xl font-semibold text-navy sm:text-2xl">Recuperar contraseña</h1>
      <p className="mt-1 text-sm text-navy/70">
        Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6">
        <Card className="flex flex-col gap-4">
          <Input
            label="Correo electrónico"
            type="email"
            value={correo}
            onChange={(evento) => setCorreo(evento.target.value)}
            errorText={error}
          />
          <Button type="submit" isLoading={enviando} className="w-full">
            Enviar enlace
          </Button>
        </Card>
      </form>

      <p className="mt-4 text-center text-sm text-navy/70">
        <Link href={RUTAS.ingresar} className="font-medium text-secondary hover:underline">
          Volver a ingresar
        </Link>
      </p>
    </main>
  );
}
