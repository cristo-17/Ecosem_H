"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonShape } from "@/components/ui/Skeleton";
import { ChevronRightIcon, ExclamationIcon, SearchOffIcon } from "@/components/ui/icons";
import { ciudadesConRuta, obtenerCatalogo } from "@/lib/api/ventas";
import { RUTAS } from "@/lib/routes";

type Ruta = { origen: string; destino: string };
type Estado =
  | { tipo: "cargando" }
  | { tipo: "error" }
  | { tipo: "listo"; rutas: Ruta[] };

export function OurRoutes() {
  const tituloId = useId();
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    obtenerCatalogo().then(
      (catalogo) => {
        if (!vigente) return;
        // El mismo filtro de rutas activas y deduplicación por ciudades que
        // usa el buscador. Sin terminales válidos no se ofrece un enlace.
        const { origenes, destinosDesde } = ciudadesConRuta(catalogo);
        const rutas = origenes.flatMap((origen) =>
          destinosDesde[origen].map((destino) => ({ origen, destino })),
        );
        setEstado({ tipo: "listo", rutas });
      },
      () => {
        if (vigente) setEstado({ tipo: "error" });
      },
    );
    return () => { vigente = false; };
  }, [intento]);

  function reintentar() {
    setEstado({ tipo: "cargando" });
    setIntento((valor) => valor + 1);
  }

  return (
    <section aria-labelledby={tituloId}>
      <h2 id={tituloId} className="text-base font-semibold text-navy">Nuestras rutas</h2>
      {estado.tipo === "cargando" && (
        <div role="status" aria-label="Cargando rutas" className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SkeletonShape variant="card" />
          <SkeletonShape variant="card" />
        </div>
      )}
      {estado.tipo === "error" && (
        <EmptyState icon={<ExclamationIcon />} title="No pudimos cargar las rutas"
          description="Intenta nuevamente. También puedes consultar en nuestra central."
          actionLabel="Reintentar rutas" onAction={reintentar} />
      )}
      {estado.tipo === "listo" && estado.rutas.length === 0 && (
        <EmptyState icon={<SearchOffIcon />} title="No hay rutas disponibles"
          description="El catálogo no tiene rutas activas entre ciudades. Actualiza la página o consulta en nuestra central."
          actionLabel="Actualizar página" onAction={() => window.location.reload()} />
      )}
      {estado.tipo === "listo" && estado.rutas.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {estado.rutas.map(({ origen, destino }) => (
            <Link key={JSON.stringify([origen, destino])}
              href={`${RUTAS.resultadosPasajes}?${new URLSearchParams({ origen, destino }).toString()}`}
              className="block rounded-modal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary">
              <Card className="flex items-center justify-between gap-3 transition hover:shadow-medium">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-navy">{origen} → {destino}</p>
                  <p className="mt-1 text-xs text-text-secondary">Ver horarios de hoy</p>
                </div>
                <ChevronRightIcon className="!size-6 shrink-0 text-text-faint" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
