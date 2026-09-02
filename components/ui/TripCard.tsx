import { cn } from "@/lib/cn";
import { formatDuracion, formatHora12, formatPrecio } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";

export interface TripCardProps {
  marca: string;
  terminalOrigen: string;
  destino: string;
  horaSalida: Date;
  horaLlegada: Date;
  duracionMinutos: number;
  asientosDisponibles: number;
  /** Etiqueta ya lista para mostrar, p. ej. "Ejecutivo". */
  tipoAsiento: string;
  precio: number;
  /** Tarjeta seleccionada: borde de color + elevación mayor (skill). */
  selected?: boolean;
  onSeleccionar?: () => void;
  className?: string;
}

// Umbral fijo del skill: 4 o menos es disponibilidad baja (ámbar, texto
// explícito). Por encima, verde con el conteo ("14 Libres").
const UMBRAL_DISPONIBILIDAD_BAJA = 4;

export function TripCard({
  marca,
  terminalOrigen,
  destino,
  horaSalida,
  horaLlegada,
  duracionMinutos,
  asientosDisponibles,
  tipoAsiento,
  precio,
  selected = false,
  onSeleccionar,
  className,
}: TripCardProps) {
  const disponibilidadBaja = asientosDisponibles <= UMBRAL_DISPONIBILIDAD_BAJA;
  const textoDisponibilidad = disponibilidadBaja
    ? `Sólo ${asientosDisponibles} ${asientosDisponibles === 1 ? "asiento" : "asientos"}`
    : `${asientosDisponibles} Libres`;

  return (
    <Card
      elevation={selected ? "high" : "low"}
      className={cn(selected && "border-2 border-secondary", className)}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-navy">{marca}</span>
        <span
          className={cn(
            "text-sm font-semibold",
            disponibilidadBaja ? "text-warning-text" : "text-success-text"
          )}
        >
          {textoDisponibilidad}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-lg font-semibold text-navy">{formatHora12(horaSalida)}</p>
          <p className="text-xs text-navy/60">{terminalOrigen}</p>
        </div>
        <div className="flex flex-1 flex-col items-center px-2">
          <span className="text-xs whitespace-nowrap text-navy/60">
            {formatDuracion(duracionMinutos)}
          </span>
          <span aria-hidden="true" className="mt-1 h-px w-full bg-navy/15" />
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-navy">{formatHora12(horaLlegada)}</p>
          <p className="text-xs text-navy/60">{destino}</p>
        </div>
      </div>

      <p className="mt-3 text-sm text-navy/70">Asiento {tipoAsiento}</p>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-navy/60">Precio</p>
          <p className="text-xl font-bold text-navy">{formatPrecio(precio)}</p>
        </div>
        {/*
          disabled es "no se puede interactuar", no "ya confirmado" — usarlo
          aquí atenuaría el botón al 40% de opacidad y se leería como no
          disponible. La selección la marca la tarjeta (borde + elevación,
          por skill); el botón se mantiene interactivo y solo cambia de
          etiqueta para confirmar visualmente el estado.
        */}
        <Button variant="secundario" onClick={onSeleccionar} className="min-w-32">
          {selected ? (
            <>
              <CheckIcon className="!text-white" />
              Seleccionado
            </>
          ) : (
            "Seleccionar"
          )}
        </Button>
      </div>
    </Card>
  );
}
