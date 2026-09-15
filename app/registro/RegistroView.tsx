"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { OPCIONES_TIPO_DOCUMENTO } from "@/components/pasajes/PassengerForm";
import { registrar } from "@/lib/auth/acciones";
import { RUTAS } from "@/lib/routes";

interface FormState {
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  correo: string;
  celular: string;
  contrasena: string;
  confirmarContrasena: string;
  aceptaTerminos: boolean;
}

const FORM_VACIO: FormState = {
  nombres: "",
  apellidos: "",
  tipoDocumento: "dni",
  numeroDocumento: "",
  correo: "",
  celular: "",
  contrasena: "",
  confirmarContrasena: "",
  aceptaTerminos: false,
};

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errores = Partial<Record<keyof FormState, string>>;

function validar(datos: FormState): Errores {
  const errores: Errores = {};

  if (!datos.nombres.trim()) errores.nombres = "Este campo es obligatorio";
  if (!datos.apellidos.trim()) errores.apellidos = "Este campo es obligatorio";

  if (!datos.numeroDocumento.trim()) {
    errores.numeroDocumento = "Este campo es obligatorio";
  } else if (datos.tipoDocumento === "dni" && !/^\d{8}$/.test(datos.numeroDocumento)) {
    errores.numeroDocumento = "El DNI debe tener 8 dígitos";
  }

  if (!datos.correo) {
    errores.correo = "Este campo es obligatorio";
  } else if (!REGEX_CORREO.test(datos.correo)) {
    errores.correo = "Ingresa un correo electrónico válido";
  }

  if (!datos.celular) {
    errores.celular = "Este campo es obligatorio";
  } else if (!/^\d{9}$/.test(datos.celular)) {
    errores.celular = "Debe contener exactamente 9 dígitos";
  }

  if (!datos.contrasena) {
    errores.contrasena = "Este campo es obligatorio";
  } else if (datos.contrasena.length < 8) {
    errores.contrasena = "Debe tener al menos 8 caracteres";
  }

  if (!datos.confirmarContrasena) {
    errores.confirmarContrasena = "Este campo es obligatorio";
  } else if (datos.confirmarContrasena !== datos.contrasena) {
    errores.confirmarContrasena = "Las contraseñas no coinciden";
  }

  if (!datos.aceptaTerminos) {
    errores.aceptaTerminos = "Debes aceptar el tratamiento de tus datos personales para continuar";
  }

  return errores;
}

export function RegistroView() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(FORM_VACIO);
  const [errores, setErrores] = useState<Errores>({});
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
      const { nombres, apellidos, tipoDocumento, numeroDocumento, correo, celular, contrasena } = form;
      await registrar({ nombres, apellidos, tipoDocumento, numeroDocumento, correo, celular, contrasena });
      router.push(RUTAS.miPerfil);
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <h1 className="text-xl font-semibold text-navy sm:text-2xl">Crear cuenta</h1>
      <p className="mt-1 text-sm text-navy/70">
        Regístrate para gestionar tus pasajes y encomiendas desde Mi Perfil.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6">
        <Card className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nombres"
              value={form.nombres}
              onChange={(evento) => actualizar("nombres", evento.target.value)}
              errorText={errores.nombres}
            />
            <Input
              label="Apellidos"
              value={form.apellidos}
              onChange={(evento) => actualizar("apellidos", evento.target.value)}
              errorText={errores.apellidos}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Tipo de documento"
              options={OPCIONES_TIPO_DOCUMENTO}
              value={form.tipoDocumento}
              onChange={(valor) => actualizar("tipoDocumento", valor)}
              errorText={errores.tipoDocumento}
            />
            <Input
              label="N.° de documento"
              value={form.numeroDocumento}
              inputMode="numeric"
              onChange={(evento) => actualizar("numeroDocumento", evento.target.value)}
              helperText={
                form.tipoDocumento === "dni"
                  ? "Ingrese tal como figura en su DNI"
                  : "Ingrese tal como figura en su documento"
              }
              errorText={errores.numeroDocumento}
            />
          </div>

          <Input
            label="Correo electrónico"
            type="email"
            value={form.correo}
            onChange={(evento) => actualizar("correo", evento.target.value)}
            errorText={errores.correo}
          />

          <Input
            label="Celular"
            inputMode="numeric"
            value={form.celular}
            onChange={(evento) => actualizar("celular", evento.target.value)}
            helperText="Debe contener exactamente 9 dígitos"
            errorText={errores.celular}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Contraseña"
              type="password"
              value={form.contrasena}
              onChange={(evento) => actualizar("contrasena", evento.target.value)}
              errorText={errores.contrasena}
            />
            <Input
              label="Confirmar contraseña"
              type="password"
              value={form.confirmarContrasena}
              onChange={(evento) => actualizar("confirmarContrasena", evento.target.value)}
              errorText={errores.confirmarContrasena}
            />
          </div>

          <Checkbox
            label={
              <>
                Acepto los Términos y Condiciones y la Política de Privacidad. Entiendo que mis
                datos personales (DNI, nombre, correo y celular) serán tratados conforme a la Ley
                N.° 29733, Ley de Protección de Datos Personales.
              </>
            }
            checked={form.aceptaTerminos}
            onChange={(evento) => actualizar("aceptaTerminos", evento.target.checked)}
            errorText={errores.aceptaTerminos}
          />

          <Button type="submit" isLoading={cargando} className="mt-2 w-full">
            Crear cuenta
          </Button>
        </Card>
      </form>

      <p className="mt-4 text-center text-sm text-navy/70">
        ¿Ya tienes cuenta?{" "}
        <Link href={RUTAS.ingresar} className="font-medium text-secondary hover:underline">
          Ingresa
        </Link>
      </p>
    </main>
  );
}
