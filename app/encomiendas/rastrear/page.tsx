"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { cn } from "@/lib/cn";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeStatus } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonShape } from "@/components/ui/Skeleton";
import { SearchOffIcon, TrackIcon } from "@/components/ui/icons";
import { buscarEncomiendaPorGuia, type Encomienda } from "@/lib/mock/encomiendas";
import { formatFechaLarga, formatHora12 } from "@/lib/format";

type Estado = "inicial" | "cargando" | "no-encontrado" | "listo";

// Mismos colores de relleno que Badge (Badge.tsx no los expone como
// export aparte): un punto de línea de tiempo es una versión mínima de la
// misma placa de estado, así que reutiliza el mismo mapeo semántico.
const COLOR_PUNTO: Record<BadgeStatus, string> = {
  confirmado: "bg-success-fill",
  pendiente: "bg-warning-fill",
  cancelado: "bg-error-fill",
  "en-ruta": "bg-info-fill",
  completado: "bg-navy",
};

export default function RastrearEncomiendaPage() {
  const [guia, setGuia] = useState("");
  const [estado, setEstado] = useState<Estado>("inicial");
  const [resultado, setResultado] = useState<Encomienda | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!guia.trim()) return;

    setEstado("cargando");
    setTimeout(() => {
      const encontrada = buscarEncomiendaPorGuia(guia);
      if (!encontrada) {
        setResultado(null);
        setEstado("no-encontrado");
        return;
      }
      setResultado(encontrada);
      setEstado("listo");
    }, 600);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="text-xl font-semibold text-navy sm:text-2xl">Rastrear Encomienda</h1>
      <p className="mt-2 text-sm text-navy/70">
        Ingresa tu número de guía para ver en qué punto de la ruta se encuentra.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 flex items-end gap-3">
        <Input
          label="Número de guía"
          placeholder="Ej: ECH-000123"
          value={guia}
          onChange={(evento) => setGuia(evento.target.value)}
          className="flex-1"
        />
        <Button type="submit" isLoading={estado === "cargando"}>
          Rastrear
        </Button>
      </form>

      <div className="mt-6">
        {estado === "inicial" && (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-navy/50">
            <TrackIcon />
            <p className="max-w-xs text-sm">
              Ingresa el número de guía que recibiste al momento del envío para ver su estado.
            </p>
          </div>
        )}

        {estado === "cargando" && (
          <div role="status" aria-label="Buscando tu encomienda">
            <SkeletonShape variant="card" className="h-40" />
          </div>
        )}

        {estado === "no-encontrado" && (
          <EmptyState
            icon={<SearchOffIcon />}
            title="No encontramos esa guía"
            description="Revisa que el número esté bien escrito, tal como figura en tu comprobante de envío."
            actionLabel="Intentar de nuevo"
            onAction={() => setEstado("inicial")}
          />
        )}

        {estado === "listo" && resultado && (
          <Card className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-navy/60">Guía {resultado.guia}</p>
                <p className="text-base font-semibold text-navy">
                  {resultado.origen} → {resultado.destino}
                </p>
                <p className="mt-0.5 text-xs text-navy/60">
                  Peso facturable: {resultado.pesoFacturableKg.toFixed(2)} kg
                </p>
              </div>
              <Badge status={resultado.estadoActual} />
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-navy/10 pt-3 text-sm">
              <div>
                <p className="text-xs text-navy/60">Remitente</p>
                <p className="text-navy">{resultado.remitente}</p>
              </div>
              <div>
                <p className="text-xs text-navy/60">Destinatario</p>
                <p className="text-navy">{resultado.destinatario}</p>
              </div>
            </div>

            <ol className="flex flex-col border-t border-navy/10 pt-4">
              {resultado.eventos.map((evento, indice) => {
                const esUltimo = indice === resultado.eventos.length - 1;
                return (
                  <li key={indice} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span aria-hidden="true" className={cn("mt-1 size-3 shrink-0 rounded-full", COLOR_PUNTO[evento.estado])} />
                      {!esUltimo && <span aria-hidden="true" className="w-px flex-1 bg-navy/15" />}
                    </div>
                    <div className={cn("min-w-0", !esUltimo && "pb-4")}>
                      <p className="text-sm font-medium text-navy">{evento.descripcion}</p>
                      <p className="text-xs text-navy/60">
                        {evento.ubicacion} · {formatFechaLarga(evento.fecha)}, {formatHora12(evento.fecha)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        )}
      </div>
    </main>
  );
}
