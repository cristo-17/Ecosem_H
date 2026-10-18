"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExclamationIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/Toast";
import { cambiarContrasena } from "@/lib/auth/acciones";
import { LARGO_MINIMO_CONTRASENA } from "@/lib/auth/tipos";
import { RUTAS } from "@/lib/routes";

export function NuevaClaveView({ conSesion }: { conSesion: boolean }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [errores, setErrores] = useState<{ contrasena?: string; confirmar?: string }>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  if (!conSesion) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <EmptyState
          icon={<ExclamationIcon className="!size-12 !text-primary" />}
          title="El enlace venció o ya se usó"
          description="Pide un enlace nuevo para restablecer tu contraseña."
          actionLabel="Pedir otro enlace"
          onAction={() => router.push(RUTAS.recuperarClave)}
        />
      </main>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nuevos: typeof errores = {};
    if (contrasena.length < LARGO_MINIMO_CONTRASENA)
      nuevos.contrasena = `Debe tener al menos ${LARGO_MINIMO_CONTRASENA} caracteres`;
    else if (contrasena.length > 72) nuevos.contrasena = "Máximo 72 caracteres";
    if (confirmar !== contrasena) nuevos.confirmar = "Las contraseñas no coinciden";
    setErrores(nuevos);
    setErrorGeneral(null);
    if (Object.keys(nuevos).length > 0) return;

    setGuardando(true);
    const resultado = await cambiarContrasena(contrasena);
    setGuardando(false);
    if (resultado.error) {
      setErrorGeneral(resultado.error);
      return;
    }
    showToast({ type: "success", title: "Contraseña actualizada", description: "Ya puedes usarla para ingresar." });
    router.replace(RUTAS.miPerfil);
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10 sm:py-14">
      <h1 className="text-xl font-semibold text-navy sm:text-2xl">Nueva contraseña</h1>
      <form onSubmit={handleSubmit} noValidate className="mt-6">
        <Card className="flex flex-col gap-4">
          <Input
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            value={contrasena}
            onChange={(evento) => setContrasena(evento.target.value)}
            helperText={`Al menos ${LARGO_MINIMO_CONTRASENA} caracteres`}
            errorText={errores.contrasena}
          />
          <Input
            label="Confirmar contraseña"
            type="password"
            autoComplete="new-password"
            value={confirmar}
            onChange={(evento) => setConfirmar(evento.target.value)}
            errorText={errores.confirmar}
          />
          {errorGeneral && (
            <p role="alert" className="rounded-field bg-error-fill p-3 text-sm text-error-text">
              {errorGeneral}
            </p>
          )}
          <Button type="submit" isLoading={guardando} className="w-full">
            Guardar contraseña
          </Button>
        </Card>
      </form>
    </main>
  );
}
