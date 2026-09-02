"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PinIcon, ScaleIcon } from "@/components/ui/icons";
import { OPCIONES_CIUDAD } from "@/lib/mock/viajes";
import { calcularPesoFacturable, calcularPesoVolumetrico, calcularTarifa } from "@/lib/mock/encomiendas";
import { formatPrecio } from "@/lib/format";

interface FormState {
  origen: string | null;
  destino: string | null;
  peso: string;
  largo: string;
  ancho: string;
  alto: string;
  valorDeclarado: string;
}

const FORM_VACIO: FormState = {
  origen: null,
  destino: null,
  peso: "",
  largo: "",
  ancho: "",
  alto: "",
  valorDeclarado: "",
};

interface Resultado {
  pesoReal: number;
  pesoVolumetrico: number;
  pesoFacturable: number;
  tarifa: number;
}

function numeroValido(valor: string): number | null {
  const numero = Number(valor);
  return valor.trim() !== "" && Number.isFinite(numero) && numero > 0 ? numero : null;
}

export default function EnviarEncomiendaPage() {
  const [form, setForm] = useState<FormState>(FORM_VACIO);
  const [errores, setErrores] = useState<Partial<Record<keyof FormState, string>>>({});
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const opcionesDestino = OPCIONES_CIUDAD.filter((opcion) => opcion.value !== form.origen);

  function actualizar<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setResultado(null);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nuevosErrores: typeof errores = {};
    if (!form.origen) nuevosErrores.origen = "Elige una ciudad de origen";
    if (!form.destino) nuevosErrores.destino = "Elige una ciudad de destino";
    if (form.origen && form.destino && form.origen === form.destino) {
      nuevosErrores.destino = "El destino debe ser distinto al origen";
    }
    if (numeroValido(form.peso) === null) nuevosErrores.peso = "Ingresa un peso válido en kg";
    if (numeroValido(form.largo) === null) nuevosErrores.largo = "Ingresa un valor válido en cm";
    if (numeroValido(form.ancho) === null) nuevosErrores.ancho = "Ingresa un valor válido en cm";
    if (numeroValido(form.alto) === null) nuevosErrores.alto = "Ingresa un valor válido en cm";
    if (numeroValido(form.valorDeclarado) === null) {
      nuevosErrores.valorDeclarado = "Ingresa el valor declarado en soles";
    }

    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) {
      setResultado(null);
      return;
    }

    const pesoReal = numeroValido(form.peso)!;
    const pesoVolumetrico = calcularPesoVolumetrico(
      numeroValido(form.largo)!,
      numeroValido(form.ancho)!,
      numeroValido(form.alto)!
    );
    const pesoFacturable = calcularPesoFacturable(pesoReal, pesoVolumetrico);
    setResultado({ pesoReal, pesoVolumetrico, pesoFacturable, tarifa: calcularTarifa(pesoFacturable) });
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="text-xl font-semibold text-navy sm:text-2xl">Enviar Encomienda</h1>
      <p className="mt-2 text-sm text-navy/70">
        Calcula el costo de tu envío antes de registrarlo. 20 kg de franquicia por pasajero no
        aplican aquí: este es un envío independiente, cobrado íntegramente por peso.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6">
        <Card className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Origen"
              options={OPCIONES_CIUDAD}
              value={form.origen}
              onChange={(valor) => {
                actualizar("origen", valor);
                if (form.destino === valor) actualizar("destino", null);
              }}
              placeholder="Ciudad"
              errorText={errores.origen}
              icon={<PinIcon />}
            />
            <Select
              label="Destino"
              options={opcionesDestino}
              value={form.destino}
              onChange={(valor) => actualizar("destino", valor)}
              placeholder="Ciudad"
              errorText={errores.destino}
              icon={<PinIcon />}
            />
          </div>

          <Input
            label="Peso real (kg)"
            inputMode="decimal"
            value={form.peso}
            onChange={(evento) => actualizar("peso", evento.target.value)}
            errorText={errores.peso}
          />

          <div>
            <p className="text-sm font-medium text-navy">Dimensiones (cm)</p>
            <div className="mt-1 grid grid-cols-3 gap-3">
              <Input
                label="Largo"
                inputMode="decimal"
                value={form.largo}
                onChange={(evento) => actualizar("largo", evento.target.value)}
                errorText={errores.largo}
              />
              <Input
                label="Ancho"
                inputMode="decimal"
                value={form.ancho}
                onChange={(evento) => actualizar("ancho", evento.target.value)}
                errorText={errores.ancho}
              />
              <Input
                label="Alto"
                inputMode="decimal"
                value={form.alto}
                onChange={(evento) => actualizar("alto", evento.target.value)}
                errorText={errores.alto}
              />
            </div>
          </div>

          <Input
            label="Valor declarado (S/)"
            inputMode="decimal"
            value={form.valorDeclarado}
            onChange={(evento) => actualizar("valorDeclarado", evento.target.value)}
            helperText="Para el seguro de tu envío"
            errorText={errores.valorDeclarado}
          />

          <Button type="submit" className="self-start">
            Cotizar
          </Button>
        </Card>
      </form>

      {resultado && (
        <Card className="mt-6 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ScaleIcon />
            <h2 className="text-base font-semibold text-navy">Resultado</h2>
          </div>

          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-navy/60">Peso real</dt>
            <dd className="text-right text-navy">{resultado.pesoReal.toFixed(2)} kg</dd>
            <dt className="text-navy/60">Peso volumétrico</dt>
            <dd className="text-right text-navy">{resultado.pesoVolumetrico.toFixed(2)} kg</dd>
            <dt className="font-medium text-navy">Peso a facturar</dt>
            <dd className="text-right font-medium text-navy">{resultado.pesoFacturable.toFixed(2)} kg</dd>
          </dl>
          <p className="text-xs text-navy/60">
            Se cobra el mayor entre el peso real y el volumétrico (largo × ancho × alto ÷ 5000).
          </p>

          <div className="flex items-center justify-between border-t border-navy/10 pt-3">
            <span className="text-sm font-medium text-navy/70">Total estimado</span>
            <span className="text-xl font-bold text-navy">{formatPrecio(resultado.tarifa)}</span>
          </div>
        </Card>
      )}
    </main>
  );
}
