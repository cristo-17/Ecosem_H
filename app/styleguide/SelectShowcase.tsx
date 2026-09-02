"use client";

import { useState } from "react";
import { Select } from "@/components/ui/Select";

const DESTINOS = [
  { value: "lima", label: "Lima" },
  { value: "cerro-de-pasco", label: "Cerro de Pasco" },
  { value: "huancayo", label: "Huancayo" },
];

// Componente cliente separado porque Select es controlado (value/onChange)
// y app/styleguide/page.tsx es un Server Component sin estado propio.
export function SelectShowcase() {
  const [closedValue, setClosedValue] = useState<string | null>("huancayo");
  const [openValue, setOpenValue] = useState<string | null>("huancayo");
  const [errorValue, setErrorValue] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Select label="Cerrado" options={DESTINOS} value={closedValue} onChange={setClosedValue} />
      <Select
        label="Abierto (opción marcada)"
        options={DESTINOS}
        value={openValue}
        onChange={setOpenValue}
        initialOpen
      />
      <Select
        label="Error"
        options={DESTINOS}
        value={errorValue}
        onChange={setErrorValue}
        errorText="Selecciona un destino"
      />
      <Select label="Bloqueado" options={DESTINOS} value="lima" onChange={() => {}} locked />
    </div>
  );
}
