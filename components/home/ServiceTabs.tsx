"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import { PopularRoutes } from "@/components/home/PopularRoutes";
import { EncomiendaPromo } from "@/components/home/EncomiendaPromo";
import { EncomiendasTabIcon, PasajesTabIcon } from "@/components/ui/icons";

type Servicio = "pasajes" | "encomiendas";

const TABS: { value: Servicio; label: string; Icon: typeof PasajesTabIcon }[] = [
  { value: "pasajes", label: "Pasajes", Icon: PasajesTabIcon },
  { value: "encomiendas", label: "Encomiendas", Icon: EncomiendasTabIcon },
];

// El skill no define tokens propios para pestañas: se reutiliza el rojo
// primario (acento de la acción principal del sitio) para el estado activo,
// sin inventar un color nuevo.
export function ServiceTabs() {
  const [activo, setActivo] = useState<Servicio>("pasajes");
  const baseId = useId();

  return (
    <div>
      <div role="tablist" aria-label="Tipo de servicio" className="flex gap-2">
        {TABS.map((tab) => {
          const selected = tab.value === activo;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.value}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.value}`}
              onClick={() => setActivo(tab.value)}
              className={cn(
                "flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary",
                selected ? "bg-primary text-white" : "bg-navy/5 text-navy/60 hover:text-navy"
              )}
            >
              <tab.Icon />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel-pasajes`}
        aria-labelledby={`${baseId}-tab-pasajes`}
        hidden={activo !== "pasajes"}
        className="pt-4"
      >
        <PopularRoutes />
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-panel-encomiendas`}
        aria-labelledby={`${baseId}-tab-encomiendas`}
        hidden={activo !== "encomiendas"}
        className="pt-4"
      >
        <EncomiendaPromo />
      </div>
    </div>
  );
}
