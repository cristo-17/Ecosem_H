"use client";

import { useEffect, useId, useState } from "react";
import { PillTabs, pillTabPanelProps, type PillTabItem } from "@/components/ui/PillTabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonShape } from "@/components/ui/Skeleton";
import { BoxIcon, ExclamationIcon, TrackIcon } from "@/components/ui/icons";
import { obtenerCatalogo } from "@/lib/api/ventas";
import { RegistroEncomienda } from "./RegistroEncomienda";
import { GestionEncomienda } from "./GestionEncomienda";

/** Una agencia del catálogo, con las agencias a las que llega una ruta activa desde ella. */
export interface Agencia {
  id: string;
  code: string;
  name: string;
  destinos: string[];
}

type Pestana = "registrar" | "buscar";

const TABS: PillTabItem<Pestana>[] = [
  { value: "registrar", label: "Registrar", Icon: BoxIcon },
  { value: "buscar", label: "Buscar por guía", Icon: TrackIcon },
];

export interface EncomiendasViewProps {
  /** `app_terminal_id` del token: la agencia del counter. Nulo para el supervisor. */
  terminalId: string | null;
  eligeAgencia: boolean;
}

export function EncomiendasView({ terminalId, eligeAgencia }: EncomiendasViewProps) {
  const baseId = useId();
  const [pestana, setPestana] = useState<Pestana>("registrar");
  const [agencias, setAgencias] = useState<Agencia[] | null>(null);
  const [errorCatalogo, setErrorCatalogo] = useState(false);
  const [intento, setIntento] = useState(0);
  // Cambia la clave de la gestión para abrirla con una guía nueva.
  const [guiaAbierta, setGuiaAbierta] = useState<{ guia: string; vez: number } | null>(null);

  useEffect(() => {
    obtenerCatalogo().then(
      ({ terminals, routes }) => {
        setAgencias(
          terminals
            .map((t) => ({
              id: t.id,
              code: t.code,
              name: t.name,
              destinos: routes
                .filter((r) => r.active && r.originId === t.id)
                .map((r) => r.destinationId),
            }))
            .sort((a, b) => a.name.localeCompare(b.name, "es")),
        );
      },
      () => setErrorCatalogo(true),
    );
  }, [intento]);

  // Solo el counter tiene la agencia fija. El supervisor elige, aunque su
  // token traiga una agencia: el backend lo deja operar en cualquiera.
  const agenciaPropia = eligeAgencia ? null : (agencias?.find((a) => a.id === terminalId) ?? null);

  function verEncomienda(guia: string) {
    setGuiaAbierta((previa) => ({ guia, vez: (previa?.vez ?? 0) + 1 }));
    setPestana("buscar");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-navy sm:text-2xl">Encomiendas</h1>
        <p className="mt-1 text-sm text-navy/70">
          Registra y cobra con la tarifa vigente, avanza su estado y entrégala con el documento de
          quien recoge.
        </p>
      </div>

      {errorCatalogo && (
        <EmptyState
          icon={<ExclamationIcon className="!size-12 !text-primary" />}
          title="No pudimos cargar las agencias"
          description="Revisa la conexión e intenta nuevamente."
          actionLabel="Reintentar"
          onAction={() => {
            setErrorCatalogo(false);
            setIntento((v) => v + 1);
          }}
        />
      )}

      {!errorCatalogo && !agencias && (
        <div role="status" aria-label="Cargando agencias">
          <SkeletonShape variant="card" />
        </div>
      )}

      {agencias && !eligeAgencia && !agenciaPropia && (
        <EmptyState
          icon={<ExclamationIcon className="!size-12 !text-primary" />}
          title="Tu cuenta no tiene una agencia asignada"
          description="Para registrar y entregar encomiendas, tu supervisor tiene que asignarte una agencia. Luego vuelve a ingresar."
          actionLabel="Reintentar"
          onAction={() => setIntento((v) => v + 1)}
        />
      )}

      {agencias && (eligeAgencia || agenciaPropia) && (
        <>
          <PillTabs
            tabs={TABS}
            value={pestana}
            onChange={setPestana}
            aria-label="Secciones de encomiendas"
            baseId={baseId}
          />
          <div {...pillTabPanelProps(baseId, "registrar")} hidden={pestana !== "registrar"}>
            <RegistroEncomienda
              agencias={agencias}
              agenciaPropia={agenciaPropia}
              onVerEncomienda={verEncomienda}
            />
          </div>
          <div {...pillTabPanelProps(baseId, "buscar")} hidden={pestana !== "buscar"}>
            <GestionEncomienda
              key={guiaAbierta?.vez ?? 0}
              agencias={agencias}
              eligeAgencia={eligeAgencia}
              guiaInicial={guiaAbierta?.guia ?? null}
            />
          </div>
        </>
      )}
    </div>
  );
}
