"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { BoxIcon, TrackIcon } from "@/components/ui/icons";
import { buscarMisEncomiendas } from "@/lib/mock/encomiendas";
import { USUARIO_MOCK } from "@/lib/mock/sesion";
import { RUTAS } from "@/lib/routes";

export interface MisEncomiendasTabProps {
  /** Fuerza la lista vacía para probar el EmptyState (?vacio=encomiendas). */
  forzarVacio?: boolean;
}

export function MisEncomiendasTab({ forzarVacio = false }: MisEncomiendasTabProps) {
  const router = useRouter();
  const encomiendas = forzarVacio ? [] : buscarMisEncomiendas(USUARIO_MOCK.nombre);

  if (encomiendas.length === 0) {
    return (
      <EmptyState
        icon={<BoxIcon />}
        title="Todavía no tienes encomiendas"
        description="Cuando envíes una encomienda, va a aparecer aquí con su estado y acceso al rastreo."
        actionLabel="Enviar encomienda"
        onAction={() => router.push(RUTAS.enviarEncomienda)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {encomiendas.map((encomienda) => (
        <Card key={encomienda.guia} className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-navy/60">Guía {encomienda.guia}</p>
              <p className="text-base font-semibold text-navy">
                {encomienda.origen} → {encomienda.destino}
              </p>
              <p className="mt-0.5 text-xs text-navy/60">
                Peso facturable: {encomienda.pesoFacturableKg.toFixed(2)} kg
              </p>
            </div>
            <Badge status={encomienda.estadoActual} />
          </div>

          <div className="flex items-center justify-between border-t border-navy/10 pt-3">
            <p className="text-sm text-navy/70">Para {encomienda.destinatario}</p>
            <Button
              variant="secundario"
              onClick={() =>
                router.push(`${RUTAS.rastrearEncomienda}?guia=${encomienda.guia}`)
              }
            >
              <TrackIcon className="!size-5 !text-secondary" />
              Ver seguimiento
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
