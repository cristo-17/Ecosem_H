"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";
import { registrar } from "@/lib/auth/acciones";
import { LARGO_MINIMO_CONTRASENA, REGEX_CORREO } from "@/lib/auth/tipos";
import { vincularComprasDeEstaPestana } from "@/lib/api/cuenta";
import { RUTAS } from "@/lib/routes";

interface FormState {
  nombre: string;
  correo: string;
  contrasena: string;
  confirmarContrasena: string;
  aceptaTerminos: boolean;
}

const FORM_VACIO: FormState = {
  nombre: "",
  correo: "",
  contrasena: "",
  confirmarContrasena: "",
  aceptaTerminos: false,
};

type Errores = Partial<Record<keyof FormState, string>>;

function validar(datos: FormState): Errores {
  const errores: Errores = {};
  if (!datos.nombre.trim()) errores.nombre = "Este campo es obligatorio";
  else if (datos.nombre.trim().length > 100) errores.nombre = "Máximo 100 caracteres";

  if (!datos.correo.trim()) errores.correo = "Este campo es obligatorio";
  else if (!REGEX_CORREO.test(datos.correo.trim())) errores.correo = "Ingresa un correo electrónico válido";

  if (!datos.contrasena) errores.contrasena = "Este campo es obligatorio";
  else if (datos.contrasena.length < LARGO_MINIMO_CONTRASENA)
    errores.contrasena = `Debe tener al menos ${LARGO_MINIMO_CONTRASENA} caracteres`;
  else if (datos.contrasena.length > 72) errores.contrasena = "Máximo 72 caracteres";

  if (!datos.confirmarContrasena) errores.confirmarContrasena = "Este campo es obligatorio";
  else if (datos.confirmarContrasena !== datos.contrasena)
    errores.confirmarContrasena = "Las contraseñas no coinciden";

  if (!datos.aceptaTerminos) {
    errores.aceptaTerminos = "Debes aceptar el tratamiento de tus datos personales para continuar";
  }
  return errores;
}

/**
 * Registro con lo mínimo (D-047, Ley 29733): nombre para saludar, correo y
 * contraseña. El DNI y el celular no se piden aquí: se piden en cada compra,
 * por pasajero, donde sí se usan.
 */
export function RegistroView({ siguiente }: { siguiente: string }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(FORM_VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [porConfirmar, setPorConfirmar] = useState(false);

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
    const resultado = await registrar({
      nombre: form.nombre,
      correo: form.correo,
      contrasena: form.contrasena,
      siguiente,
    });
    if (resultado.error) {
      setErrorGeneral(resultado.error);
      setCargando(false);
      return;
    }
    if (resultado.requiereConfirmacion) {
      setPorConfirmar(true);
      setCargando(false);
      return;
    }
    await vincularComprasDeEstaPestana();
    router.replace(siguiente);
    router.refresh();
  }

  if (porConfirmar) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-14 text-center sm:py-20">
        <span className="flex size-14 items-center justify-center rounded-full bg-success-fill">
          <CheckIcon className="!size-6 text-success-text" />
        </span>
        <h1 className="text-xl font-semibold text-navy sm:text-2xl">Revisa tu correo</h1>
        <p className="max-w-sm text-sm text-navy/70">
          Te enviamos un enlace a <span className="font-medium text-navy">{form.correo.trim()}</span>{" "}
          para confirmar tu cuenta. Ábrelo en este mismo dispositivo. Si no llega en unos
          minutos, revisa la carpeta de spam.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10 sm:py-14">
      <h1 className="text-xl font-semibold text-navy sm:text-2xl">Crear cuenta</h1>
      <p className="mt-1 text-sm text-navy/70">
        Con una cuenta ves tus compras desde Mi Perfil. Para comprar pasajes no hace falta.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6">
        <Card className="flex flex-col gap-4">
          <Input
            label="Nombre"
            autoComplete="name"
            value={form.nombre}
            onChange={(evento) => actualizar("nombre", evento.target.value)}
            helperText="Cómo quieres que te saludemos"
            errorText={errores.nombre}
          />
          <Input
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            value={form.correo}
            onChange={(evento) => actualizar("correo", evento.target.value)}
            errorText={errores.correo}
          />
          <Input
            label="Contraseña"
            type="password"
            autoComplete="new-password"
            value={form.contrasena}
            onChange={(evento) => actualizar("contrasena", evento.target.value)}
            helperText={`Al menos ${LARGO_MINIMO_CONTRASENA} caracteres`}
            errorText={errores.contrasena}
          />
          <Input
            label="Confirmar contraseña"
            type="password"
            autoComplete="new-password"
            value={form.confirmarContrasena}
            onChange={(evento) => actualizar("confirmarContrasena", evento.target.value)}
            errorText={errores.confirmarContrasena}
          />

          <Checkbox
            label={
              <>
                Acepto los{" "}
                <Link
                  href={RUTAS.terminos}
                  target="_blank"
                  onClick={(evento) => evento.stopPropagation()}
                  className="text-secondary underline"
                >
                  Términos y Condiciones
                </Link>{" "}
                y la{" "}
                <Link
                  href={RUTAS.privacidad}
                  target="_blank"
                  onClick={(evento) => evento.stopPropagation()}
                  className="text-secondary underline"
                >
                  Política de Privacidad
                </Link>
                . Entiendo que mi nombre y mi correo serán tratados conforme a la Ley N.° 29733,
                Ley de Protección de Datos Personales.
              </>
            }
            checked={form.aceptaTerminos}
            onChange={(evento) => actualizar("aceptaTerminos", evento.target.checked)}
            errorText={errores.aceptaTerminos}
          />

          {errorGeneral && (
            <p role="alert" className="rounded-field bg-error-fill p-3 text-sm text-error-text">
              {errorGeneral}
            </p>
          )}

          <Button type="submit" isLoading={cargando} className="mt-2 w-full">
            Crear cuenta
          </Button>
        </Card>
      </form>

      <p className="mt-4 text-center text-sm text-navy/70">
        ¿Ya tienes cuenta?{" "}
        <Link
          href={`${RUTAS.ingresar}?${new URLSearchParams({ siguiente }).toString()}`}
          className="font-medium text-secondary hover:underline"
        >
          Ingresa
        </Link>
      </p>
    </main>
  );
}
