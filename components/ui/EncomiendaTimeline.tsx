import { cn } from "@/lib/cn";
import { formatFechaLarga, formatHora12 } from "@/lib/format";
import { Badge, type BadgeStatus } from "@/components/ui/Badge";
import type { ParcelStatus, ParcelTrackingResponse } from "@/lib/types/contratos-frontend";

// Los cinco estados del ciclo de vida de una encomienda, con las claves del
// backend (D-031 del backend): `en_destino` es que llegó a la agencia de
// destino; `entregada`, que se le entregó al destinatario con su documento
// verificado. `cancelada` no tiene lugar fijo: corta la línea donde estaba.
const ETAPAS = [
  { key: "registrada", label: "Encomienda registrada" },
  { key: "alistando", label: "Alistando encomienda" },
  { key: "en_camino", label: "Encomienda en camino" },
  { key: "en_destino", label: "En la agencia de destino" },
  { key: "entregada", label: "Entregada al destinatario" },
] as const satisfies ReadonlyArray<{ key: ParcelStatus; label: string }>;

/** Placa de estado (Badge) de una encomienda. */
export function badgeDeEncomienda(estado: ParcelStatus): BadgeStatus {
  switch (estado) {
    case "en_camino":
      return "en-ruta";
    case "entregada":
      return "completado";
    case "cancelada":
      return "cancelado";
    default:
      // Registrada, alistando o esperando que la recojan.
      return "pendiente";
  }
}

export interface EncomiendaTimelineProps {
  estado: ParcelStatus;
  /** Tal como los devuelve el backend: estado, hora con zona y terminal. */
  eventos: ParcelTrackingResponse["events"];
  className?: string;
}

export function EncomiendaTimeline({ estado, eventos, className }: EncomiendaTimelineProps) {
  const ultimo = (clave: ParcelStatus) => eventos.filter((e) => e.status === clave).at(-1);
  // Cancelada: la etapa actual es la última que alcanzó antes de cancelarse.
  const alcanzadas = ETAPAS.map((etapa, index) => (ultimo(etapa.key) ? index : -1));
  const indiceActual =
    estado === "cancelada"
      ? Math.max(0, ...alcanzadas)
      : ETAPAS.findIndex((etapa) => etapa.key === estado);
  const cancelacion = estado === "cancelada" ? ultimo("cancelada") : undefined;

  return (
    <ol aria-label="Estado de la encomienda" className={cn("flex flex-col", className)}>
      {ETAPAS.map((etapa, index) => {
        const esCumplido = index < indiceActual;
        const esActual = index === indiceActual;
        const esUltimo = index === ETAPAS.length - 1;
        const evento = ultimo(etapa.key);

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
                {esActual && <Badge status={badgeDeEncomienda(estado)} />}
              </div>
              {evento && <DetalleEvento terminal={evento.terminal} at={evento.at} />}
              {esActual && cancelacion && (
                <DetalleEvento prefijo="Cancelada en" terminal={cancelacion.terminal} at={cancelacion.at} />
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function DetalleEvento({ prefijo, terminal, at }: { prefijo?: string; terminal: string; at: string }) {
  const fecha = new Date(at);
  return (
    <p className="mt-0.5 text-xs text-text-secondary">
      {prefijo ? `${prefijo} ` : ""}
      {terminal} · {formatFechaLarga(fecha)}, {formatHora12(fecha)}
    </p>
  );
}
