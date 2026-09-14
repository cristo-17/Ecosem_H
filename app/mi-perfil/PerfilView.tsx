"use client";

import { useId, useState } from "react";
import { PillTabs, pillTabPanelProps, type PillTabItem } from "@/components/ui/PillTabs";
import { UserIcon, EncomiendasTabIcon, PasajesTabIcon } from "@/components/ui/icons";
import { MisViajesTab } from "@/components/perfil/MisViajesTab";
import { MisEncomiendasTab } from "@/components/perfil/MisEncomiendasTab";
import { USUARIO_MOCK } from "@/lib/mock/sesion";

type Pestana = "viajes" | "encomiendas";

const TABS: PillTabItem<Pestana>[] = [
  { value: "viajes", label: "Mis viajes", Icon: PasajesTabIcon },
  { value: "encomiendas", label: "Mis encomiendas", Icon: EncomiendasTabIcon },
];

export interface PerfilViewProps {
  forzarViajesVacios: boolean;
  forzarEncomiendasVacias: boolean;
}

export function PerfilView({ forzarViajesVacios, forzarEncomiendasVacias }: PerfilViewProps) {
  const [pestana, setPestana] = useState<Pestana>("viajes");
  const baseId = useId();

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary/10">
          <UserIcon className="!text-secondary" />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-navy sm:text-2xl">{USUARIO_MOCK.nombre}</h1>
          <p className="text-sm text-navy/60">Documento {USUARIO_MOCK.documentoEnmascarado}</p>
        </div>
      </div>

      <div className="mt-6">
        <PillTabs
          tabs={TABS}
          value={pestana}
          onChange={setPestana}
          aria-label="Secciones de mi perfil"
          baseId={baseId}
        />
      </div>

      <div {...pillTabPanelProps(baseId, "viajes")} hidden={pestana !== "viajes"} className="mt-4">
        <MisViajesTab forzarVacio={forzarViajesVacios} />
      </div>
      <div {...pillTabPanelProps(baseId, "encomiendas")} hidden={pestana !== "encomiendas"} className="mt-4">
        <MisEncomiendasTab forzarVacio={forzarEncomiendasVacias} />
      </div>
    </main>
  );
}
