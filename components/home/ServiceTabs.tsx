"use client";

import { useId, useState } from "react";
import { PopularRoutes } from "@/components/home/PopularRoutes";
import { EncomiendaPromo } from "@/components/home/EncomiendaPromo";
import { EncomiendasTabIcon, PasajesTabIcon } from "@/components/ui/icons";
import { PillTabs, pillTabPanelProps, type PillTabItem } from "@/components/ui/PillTabs";

type Servicio = "pasajes" | "encomiendas";

const TABS: PillTabItem<Servicio>[] = [
  { value: "pasajes", label: "Pasajes", Icon: PasajesTabIcon },
  { value: "encomiendas", label: "Encomiendas", Icon: EncomiendasTabIcon },
];

export function ServiceTabs() {
  const [activo, setActivo] = useState<Servicio>("pasajes");
  const baseId = useId();

  return (
    <div>
      <PillTabs tabs={TABS} value={activo} onChange={setActivo} aria-label="Tipo de servicio" baseId={baseId} />

      <div {...pillTabPanelProps(baseId, "pasajes")} hidden={activo !== "pasajes"} className="pt-4">
        <PopularRoutes />
      </div>
      <div {...pillTabPanelProps(baseId, "encomiendas")} hidden={activo !== "encomiendas"} className="pt-4">
        <EncomiendaPromo />
      </div>
    </div>
  );
}
