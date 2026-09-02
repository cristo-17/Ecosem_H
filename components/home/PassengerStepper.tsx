"use client";

import { cn } from "@/lib/cn";
import { MinusIcon, PlusIcon } from "@/components/ui/icons";

const MIN_PASAJEROS = 1;
const MAX_PASAJEROS = 8;

export interface PassengerStepperProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

// Antes era un <Select> con 8 opciones: el desplegable se desbordaba de la
// tarjeta del buscador en pantallas angostas. Un control −/+ con el número
// al centro no necesita espacio para una lista emergente.
export function PassengerStepper({ value, onChange, className }: PassengerStepperProps) {
  const puedeRestar = value > MIN_PASAJEROS;
  const puedeSumar = value < MAX_PASAJEROS;

  return (
    <div className={cn("flex w-full flex-col gap-1", className)}>
      <span className="text-sm font-medium text-navy">Pasajeros</span>
      <div className="flex h-12 w-full items-center justify-between rounded-field border border-navy/20 bg-white px-2">
        <button
          type="button"
          aria-label="Quitar un pasajero"
          disabled={!puedeRestar}
          onClick={() => onChange(Math.max(MIN_PASAJEROS, value - 1))}
          className="flex size-11 items-center justify-center rounded-field text-navy transition hover:bg-navy/5 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
        >
          <MinusIcon />
        </button>
        <span aria-live="polite" className="text-base font-semibold text-navy">
          {value} {value === 1 ? "pasajero" : "pasajeros"}
        </span>
        <button
          type="button"
          aria-label="Agregar un pasajero"
          disabled={!puedeSumar}
          onClick={() => onChange(Math.min(MAX_PASAJEROS, value + 1))}
          className="flex size-11 items-center justify-center rounded-field text-navy transition hover:bg-navy/5 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
        >
          <PlusIcon />
        </button>
      </div>
    </div>
  );
}
