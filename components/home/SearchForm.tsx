"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { Button } from "@/components/ui/Button";
import { PassengerStepper } from "@/components/home/PassengerStepper";
import { PinIcon } from "@/components/ui/icons";
import { OPCIONES_CIUDAD } from "@/lib/mock/viajes";
import { RUTAS } from "@/lib/routes";

// Misma referencia de "hoy" que usa DatePicker internamente (new Date() en
// el cuerpo del componente): no vendemos pasajes para fechas pasadas.
const hoy = new Date();

export function SearchForm() {
  const router = useRouter();

  const [origen, setOrigen] = useState<string | null>(null);
  const [destino, setDestino] = useState<string | null>(null);
  const [fechaIda, setFechaIda] = useState<Date | null>(null);
  const [mostrarRetorno, setMostrarRetorno] = useState(false);
  const [fechaRetorno, setFechaRetorno] = useState<Date | null>(null);
  const [pasajeros, setPasajeros] = useState(1);
  const [errores, setErrores] = useState<{
    origen?: string;
    destino?: string;
    fechaIda?: string;
  }>({});

  const opcionesDestino = OPCIONES_CIUDAD.filter(
    (opcion) => opcion.value !== origen,
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nuevosErrores: typeof errores = {};
    if (!origen) nuevosErrores.origen = "Elige una ciudad de origen";
    if (!destino) nuevosErrores.destino = "Elige una ciudad de destino";
    if (origen && destino && origen === destino) {
      nuevosErrores.destino = "El destino debe ser distinto al origen";
    }
    if (!fechaIda) nuevosErrores.fechaIda = "Elige una fecha de ida";

    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    const params = new URLSearchParams({
      origen: origen!,
      destino: destino!,
      fechaIda: fechaIda!.toISOString(),
      pasajeros: String(pasajeros),
    });
    if (mostrarRetorno && fechaRetorno) {
      params.set("fechaRetorno", fechaRetorno.toISOString());
    }

    router.push(`${RUTAS.resultadosPasajes}?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Origen"
          options={OPCIONES_CIUDAD}
          value={origen}
          onChange={(valor) => {
            setOrigen(valor);
            if (destino === valor) setDestino(null);
          }}
          placeholder="Ciudad"
          errorText={errores.origen}
          icon={<PinIcon />}
        />
        <Select
          label="Destino"
          options={opcionesDestino}
          value={destino}
          onChange={setDestino}
          placeholder="Ciudad"
          errorText={errores.destino}
          icon={<PinIcon />}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <DatePicker
          label="Fecha de ida"
          value={fechaIda}
          onChange={setFechaIda}
          minDate={hoy}
          errorText={errores.fechaIda}
        />
        {mostrarRetorno ? (
          <DatePicker
            label="Fecha de retorno"
            value={fechaRetorno}
            onChange={setFechaRetorno}
            minDate={fechaIda ?? hoy}
          />
        ) : (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-navy">
              Retorno (opcional)
            </span>
            <button
              type="button"
              onClick={() => setMostrarRetorno(true)}
              className="flex h-12 w-full items-center justify-center gap-1 rounded-field border border-dashed border-navy/30 text-sm font-medium text-secondary tran
sition hover:bg-secondary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
            >
              ¿Agregar fecha de retorno?
            </button>
          </div>
        )}
      </div>

      <PassengerStepper value={pasajeros} onChange={setPasajeros} />

      <Button type="submit" className="mt-1 w-full">
        Buscar
      </Button>
    </form>
  );
}
