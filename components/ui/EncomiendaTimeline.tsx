import { cn } from "@/lib/cn";
import { formatFechaLarga, formatHora12 } from "@/lib/format";
import { Badge, type BadgeStatus } from "@/components/ui/Badge";

// Cuatro estados fijos del ciclo de vida de una encomienda (ver CLAUDE.md).
// Igual que Stepper con los 4 pasos de compra: nunca cambiar el número, el
// orden ni las etiquetas.
const ETAPAS = [
  { key: "registrada", label: "Encomienda registrada" },
  { key: "alistando", label: "Alistando encomienda" },
  { key: "en-camino", label: "Encomienda en camino" },
  { key: "despachada", label: "Encomienda despachada" },
] as const;

export type EstadoEncomienda = (typeof ETAPAS)[number]["key"];

export interface EventoEncomienda {
  estado: EstadoEncomienda;
  terminal: string;
  fecha: Date;
}

export interface EncomiendaTimelineProps {
  /** Etapa actual del ciclo de vida fijo (posición en la línea de tiempo). */
  etapaActual: EstadoEncomienda;
  /** Un evento por cada etapa ya alcanzada, en cualquier orden. */
  eventos: EventoEncomienda[];
  /**
   * Estado general de la encomienda para el Badge junto al punto actual.
   * Vocabulario aparte de EstadoEncomienda: Badge es la placa compartida con
   * pasajes (incluye "cancelado", que no tiene lugar fijo en esta línea de
   * tiempo de 4 pasos).
   */
  estadoBadge: BadgeStatus;
  className?: string;
}

export function EncomiendaTimeline({
  etapaActual,
  eventos,
  estadoBadge,
  className,
}: EncomiendaTimelineProps) {
  const indiceActual = ETAPAS.findIndex((etapa) => etapa.key === etapaActual);

  return (
    <ol aria-label="Estado de la encomienda" className={cn("flex flex-col", className)}>
      {ETAPAS.map((etapa, index) => {
        const esCumplido = index < indiceActual;
        const esActual = index === indiceActual;
        const esUltimo = index === ETAPAS.length - 1;
        const evento = eventos.find((e) => e.estado === etapa.key);

        return (
          <li
            key={etapa.key}
            aria-current={esActual ? "step" : undefined}
            className="flex gap-3"
          >
            <div className="flex flex-col items-center">
              {/*
                Mismo recurso "anillo vs relleno" que DatePicker usa para
                distinguir hoy (anillo) de seleccionado (relleno): acá el
                punto actual combina ambos —relleno + anillo— porque es el
                más destacado de los tres, no solo distinto de "cumplido".
              */}
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 shrink-0 rounded-full",
                  esActual && "size-4 bg-primary ring-4 ring-primary/20",
                  esCumplido && "size-3 bg-secondary",
                  !esActual && !esCumplido && "size-3 border-2 border-border-default bg-white",
                )}
              />
              {!esUltimo && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "w-px flex-1",
                    esCumplido ? "bg-secondary" : "bg-border-default",
                  )}
                />
              )}
            </div>
            <div className={cn("min-w-0", !esUltimo && "pb-5")}>
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={cn(
                    "text-sm",
                    esActual && "font-bold text-text-primary",
                    esCumplido && "font-medium text-text-primary",
                    !esActual && !esCumplido && "text-text-secondary",
                  )}
                >
                  {etapa.label}
                </p>
                {esActual && <Badge status={estadoBadge} />}
              </div>
              {evento && (
                <p className="mt-0.5 text-xs text-text-secondary">
                  {evento.terminal} · {formatFechaLarga(evento.fecha)}, {formatHora12(evento.fecha)}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
