import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";
import { formatDuracion, formatHora12, formatPrecio } from "@/lib/format";
import type { Viaje } from "@/lib/mock/viajes";
import type { DatosPasajero } from "@/components/pasajes/PurchaseProvider";

export interface PurchaseSummaryProps {
  viaje: Viaje;
  asientos: string[];
  pasajeros: DatosPasajero[];
  className?: string;
}

function etiquetaAsiento(id: string): string {
  return id.replace(/^P\d-/, "");
}

export function PurchaseSummary({ viaje, asientos, pasajeros, className }: PurchaseSummaryProps) {
  const total = viaje.precio * asientos.length;

  return (
    <Card className={cn("flex flex-col gap-3", className)}>
      <div>
        <p className="text-xs font-semibold text-navy/60">{viaje.marca}</p>
        <p className="text-base font-semibold text-navy">
          {viaje.origen} → {viaje.destino}
        </p>
        <p className="text-xs text-navy/60">
          {formatHora12(viaje.horaSalida)} · {formatDuracion(viaje.duracionMinutos)}
        </p>
      </div>

      <div className="border-t border-navy/10 pt-3">
        <p className="text-xs font-medium text-navy/60">Asientos</p>
        <p className="text-sm text-navy">{asientos.map(etiquetaAsiento).join(", ")}</p>
      </div>

      {pasajeros.length > 0 && (
        <div className="border-t border-navy/10 pt-3">
          <p className="text-xs font-medium text-navy/60">Pasajeros</p>
          <ul className="text-sm text-navy">
            {pasajeros.map((pasajero, indice) => (
              <li key={indice}>{pasajero.nombres || `Pasajero ${indice + 1}`}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-navy/10 pt-3">
        <span className="text-sm font-medium text-navy/70">
          Total ({asientos.length} × {formatPrecio(viaje.precio)})
        </span>
        <span className="text-xl font-bold text-navy">{formatPrecio(total)}</span>
      </div>
    </Card>
  );
}
