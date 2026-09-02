"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckIcon } from "@/components/ui/icons";

const TIPOS_RECLAMO: SelectOption[] = [
  { value: "reclamo", label: "Reclamo — disconformidad con el producto o servicio" },
  { value: "queja", label: "Queja — malestar con la atención recibida" },
];

const SERVICIOS: SelectOption[] = [
  { value: "pasajes", label: "Venta de pasajes" },
  { value: "encomiendas", label: "Envío de encomiendas" },
];

interface FormState {
  tipo: string | null;
  nombres: string;
  numeroDocumento: string;
  celular: string;
  correo: string;
  domicilio: string;
  servicio: string | null;
  detalle: string;
  pedido: string;
}

const FORM_VACIO: FormState = {
  tipo: null,
  nombres: "",
  numeroDocumento: "",
  celular: "",
  correo: "",
  domicilio: "",
  servicio: null,
  detalle: "",
  pedido: "",
};

// Campos obligatorios según el formato mínimo del Libro de Reclamaciones
// virtual exigido por el Código de Protección al Consumidor.
const CAMPOS_OBLIGATORIOS: (keyof FormState)[] = [
  "tipo",
  "nombres",
  "numeroDocumento",
  "celular",
  "correo",
  "servicio",
  "detalle",
  "pedido",
];

export default function LibroDeReclamacionesPage() {
  const [form, setForm] = useState<FormState>(FORM_VACIO);
  const [errores, setErrores] = useState<Partial<Record<keyof FormState, string>>>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  function actualizar<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function validar(): boolean {
    const nuevosErrores: Partial<Record<keyof FormState, string>> = {};

    for (const campo of CAMPOS_OBLIGATORIOS) {
      if (!form[campo]) nuevosErrores[campo] = "Este campo es obligatorio";
    }
    if (form.celular && !/^\d{9}$/.test(form.celular)) {
      nuevosErrores.celular = "Debe contener exactamente 9 dígitos";
    }
    if (form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) {
      nuevosErrores.correo = "Ingrese un correo electrónico válido";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validar()) return;

    setEnviando(true);
    // No hay backend todavía: se simula el envío. Los datos personales del
    // formulario nunca se escriben a consola ni se anexan a la URL (Ley
    // 29733) — solo viven en el estado de este componente.
    await new Promise((resolve) => setTimeout(resolve, 900));
    setEnviando(false);
    setEnviado(true);
  }

  function handleNuevoReclamo() {
    setForm(FORM_VACIO);
    setErrores({});
    setEnviado(false);
  }

  if (enviado) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success-fill">
          <CheckIcon className="!size-6 !text-white" />
        </span>
        <h1 className="text-xl font-semibold text-navy">Tu reclamo fue registrado</h1>
        <p className="max-w-sm text-sm text-navy/70">
          Hemos recibido tu {form.tipo === "queja" ? "queja" : "reclamo"}. Te responderemos al
          correo indicado en un plazo máximo de 30 días calendario, conforme al Código de
          Protección y Defensa del Consumidor.
        </p>
        <Button variant="secundario" onClick={handleNuevoReclamo} className="mt-2">
          Registrar otro reclamo
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="text-xl font-semibold text-navy sm:text-2xl">Libro de Reclamaciones</h1>
      <p className="mt-2 text-sm text-navy/70">
        Conforme a lo establecido en el Código de Protección y Defensa del Consumidor, este
        establecimiento cuenta con un Libro de Reclamaciones virtual a tu disposición.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6">
        <Card className="flex flex-col gap-5">
          <Select
            label="Tipo"
            options={TIPOS_RECLAMO}
            value={form.tipo}
            onChange={(valor) => actualizar("tipo", valor)}
            placeholder="Selecciona reclamo o queja"
            errorText={errores.tipo}
          />

          <Input
            label="Nombres y apellidos"
            value={form.nombres}
            onChange={(event) => actualizar("nombres", event.target.value)}
            errorText={errores.nombres}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="N.° de documento"
              value={form.numeroDocumento}
              onChange={(event) => actualizar("numeroDocumento", event.target.value)}
              helperText="Ingrese tal como figura en su DNI"
              errorText={errores.numeroDocumento}
            />
            <Input
              label="Celular"
              inputMode="numeric"
              value={form.celular}
              onChange={(event) => actualizar("celular", event.target.value)}
              helperText="Debe contener exactamente 9 dígitos"
              errorText={errores.celular}
            />
          </div>

          <Input
            label="Correo electrónico"
            type="email"
            value={form.correo}
            onChange={(event) => actualizar("correo", event.target.value)}
            errorText={errores.correo}
          />

          <Input
            label="Domicilio (opcional)"
            value={form.domicilio}
            onChange={(event) => actualizar("domicilio", event.target.value)}
          />

          <Select
            label="Bien o servicio contratado"
            options={SERVICIOS}
            value={form.servicio}
            onChange={(valor) => actualizar("servicio", valor)}
            placeholder="Selecciona un servicio"
            errorText={errores.servicio}
          />

          <Textarea
            label="Detalle del reclamo o queja"
            value={form.detalle}
            onChange={(event) => actualizar("detalle", event.target.value)}
            errorText={errores.detalle}
          />

          <Textarea
            label="Pedido del consumidor"
            value={form.pedido}
            onChange={(event) => actualizar("pedido", event.target.value)}
            errorText={errores.pedido}
          />

          <Button type="submit" isLoading={enviando} className="self-start">
            Enviar reclamo
          </Button>
        </Card>
      </form>
    </main>
  );
}
