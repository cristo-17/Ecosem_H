"use client";

import { useState } from "react";
import { DatePicker } from "@/components/ui/DatePicker";

// Componente cliente separado porque DatePicker es controlado (value/onChange)
// y app/styleguide/page.tsx es un Server Component sin estado propio.
function daysFromToday(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date;
}

// Se elige +5 o -5 según el día del mes para que la fecha de ejemplo caiga
// en el mismo mes que hoy: si no, el calendario abriría en el mes siguiente
// y el anillo de "hoy" no se vería junto al relleno de "seleccionado".
function sampleDateInSameMonth() {
  const today = new Date();
  return daysFromToday(today.getDate() <= 20 ? 5 : -5);
}

export function DatePickerShowcase() {
  const [closedValue, setClosedValue] = useState<Date | null>(new Date());
  const [openValue, setOpenValue] = useState<Date | null>(sampleDateInSameMonth());
  const [errorValue, setErrorValue] = useState<Date | null>(null);
  const [minDateValue, setMinDateValue] = useState<Date | null>(new Date());

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DatePicker label="Cerrado" value={closedValue} onChange={setClosedValue} />
        <DatePicker
          label="Error"
          value={errorValue}
          onChange={setErrorValue}
          errorText="Selecciona una fecha de viaje"
        />
        <DatePicker label="Bloqueado" value={new Date()} onChange={() => {}} locked />
      </div>

      {/*
        Cada demo "abierto" vive en su propia fila con espacio reservado
        debajo (pb-96): el panel es position:absolute y no empuja el layout
        de la página, así que sin ese margen se solaparía con lo que viene
        después en vez de solo flotar sobre su propio campo.
      */}
      <div className="max-w-xs pb-96">
        <DatePicker
          label="Abierto (hoy vs. seleccionado)"
          value={openValue}
          onChange={setOpenValue}
          initialOpen
        />
      </div>
      <div className="max-w-xs pb-96">
        <DatePicker
          label="Fechas pasadas deshabilitadas"
          value={minDateValue}
          onChange={setMinDateValue}
          minDate={new Date()}
          initialOpen
        />
      </div>
    </div>
  );
}
