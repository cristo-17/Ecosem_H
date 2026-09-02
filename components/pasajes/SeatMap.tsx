"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { SteeringWheelIcon } from "@/components/ui/icons";
import type { Asiento, DistribucionPiso, EstadoAsiento } from "@/lib/mock/asientos";

export interface SeatMapProps {
  distribucion: DistribucionPiso[];
  asientos: Asiento[];
  seleccionados: string[];
  onToggle: (asiento: Asiento) => void;
  className?: string;
}

type EstadoVisual = EstadoAsiento | "seleccionado";

const LEYENDA: { estado: EstadoVisual; label: string }[] = [
  { estado: "libre", label: "Libre" },
  { estado: "ocupado", label: "Ocupado" },
  { estado: "seleccionado", label: "Seleccionado" },
  { estado: "reservado", label: "Reservado" },
];

// El skill no define un color propio para el plano de asientos: se
// reutilizan tokens ya semánticos en vez de inventar uno. "Reservado" (un
// apartado temporal de otro comprador, no una venta) toma el mismo ámbar
// que la placa "Pendiente"; "Ocupado" (venta confirmada) toma navy, igual
// que "Completado"; "Seleccionado" reutiliza el secundario azul, el mismo
// tono que ya usa el botón "Seleccionar" de la tarjeta de viaje.
const ESTILO_ESTADO: Record<EstadoVisual, string> = {
  libre: "border border-navy/25 bg-white text-navy hover:border-secondary",
  ocupado: "bg-navy/10 text-navy/30 cursor-not-allowed",
  reservado: "bg-warning-fill text-warning-fill-foreground cursor-not-allowed",
  seleccionado: "bg-secondary text-white",
};

const ESTILO_SWATCH: Record<EstadoVisual, string> = {
  libre: "border border-navy/25 bg-white",
  ocupado: "bg-navy/10",
  reservado: "bg-warning-fill",
  seleccionado: "bg-secondary",
};

export function SeatMap({ distribucion, asientos, seleccionados, onToggle, className }: SeatMapProps) {
  const [pisoActivo, setPisoActivo] = useState<1 | 2>(1);

  const piso = distribucion.find((p) => p.piso === pisoActivo) ?? distribucion[0];
  const asientosPiso = asientos.filter((a) => a.piso === piso.piso);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {distribucion.length > 1 && (
        <div role="tablist" aria-label="Piso del bus" className="flex gap-2">
          {distribucion.map((p) => {
            const activo = p.piso === pisoActivo;
            return (
              <button
                key={p.piso}
                type="button"
                role="tab"
                aria-selected={activo}
                onClick={() => setPisoActivo(p.piso)}
                className={cn(
                  "h-11 flex-1 rounded-full text-sm font-semibold transition",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary",
                  activo ? "bg-primary text-white" : "bg-navy/5 text-navy/60 hover:text-navy"
                )}
              >
                {p.nombre}
              </button>
            );
          })}
        </div>
      )}

      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {LEYENDA.map(({ estado, label }) => (
          <li key={estado} className="flex items-center gap-1.5 text-xs text-navy/70">
            <span aria-hidden="true" className={cn("size-3.5 rounded", ESTILO_SWATCH[estado])} />
            {label}
          </li>
        ))}
      </ul>

      <div className="rounded-modal border border-navy/10 bg-white p-4">
        <div className="mb-3 flex items-center justify-center gap-1.5 text-xs font-medium text-navy/40">
          <SteeringWheelIcon />
          Adelante
        </div>

        <div role="group" aria-label={piso.nombre} className="flex flex-col items-center gap-2">
          {Array.from({ length: piso.filas }, (_, i) => i + 1).map((fila) => (
            <div key={fila} className="flex items-center gap-1.5">
              <span className="w-4 shrink-0 text-center text-xs text-navy/40">{fila}</span>
              <div className="flex gap-1.5">
                {piso.columnas.map((columna, indice) => {
                  const asiento = asientosPiso.find((a) => a.fila === fila && a.columna === columna);
                  if (!asiento) return null;
                  const seleccionado = seleccionados.includes(asiento.id);
                  const estadoVisual: EstadoVisual = seleccionado ? "seleccionado" : asiento.estado;
                  const bloqueado = asiento.estado !== "libre" && !seleccionado;

                  return (
                    <div key={columna} className="flex items-center gap-1.5">
                      {indice === piso.pasilloTrasIndice + 1 && <span className="w-4" aria-hidden="true" />}
                      <button
                        type="button"
                        disabled={bloqueado}
                        aria-pressed={seleccionado}
                        aria-label={`Asiento ${fila}${columna}, ${estadoVisual}`}
                        onClick={() => onToggle(asiento)}
                        className={cn(
                          "flex size-11 shrink-0 items-center justify-center rounded-field text-xs font-semibold transition",
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary",
                          "disabled:pointer-events-none",
                          ESTILO_ESTADO[estadoVisual]
                        )}
                      >
                        {columna}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
