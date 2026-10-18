import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";
import { formatFechaLarga, formatHora12, formatPrecio } from "@/lib/format";
import { etiquetaAsiento } from "@/lib/asientos";

export interface PurchaseSummaryProps {
  origen: string;
  destino: string;
  terminalOrigen: string;
  salida: Date;
  asientos: string[];
  /** Nombres ya escritos; vacío si todavía no hay. */
  pasajeros: string[];
  /** Precio de un asiento, tal como lo congeló la reserva (`priceBreakdown.unitPrice`). */
  precioAsiento: string;
  /** Total congelado de la reserva (`totalAmount`). Es lo que se cobra. */
  total: string;
  className?: string;
}

// Los montos son texto decimal del backend; solo se les da formato. Nada se
// multiplica ni se suma aquí: una cuenta propia podría mostrar un número
// distinto del que se va a cobrar.
function soles(monto: string): string {
  return formatPrecio(Number(monto));
}

export function PurchaseSummary({
  origen,
  destino,
  terminalOrigen,
  salida,
  asientos,
  pasajeros,
  precioAsiento,
  total,
  className,
}: PurchaseSummaryProps) {
  return (
    <Card className={cn("flex flex-col gap-3", className)}>
      <div>
        <p className="text-base font-semibold text-navy">
          {origen} → {destino}
        </p>
        <p className="text-xs text-navy/60">
          {formatFechaLarga(salida)} · {formatHora12(salida)} · {terminalOrigen}
        </p>
      </div>

      <div className="border-t border-navy/10 pt-3">
        <p className="text-xs font-medium text-navy/60">Asientos</p>
        <p className="text-sm text-navy">{asientos.map(etiquetaAsiento).join(", ")}</p>
      </div>

      {pasajeros.some(Boolean) && (
        <div className="border-t border-navy/10 pt-3">
          <p className="text-xs font-medium text-navy/60">Pasajeros</p>
          <ul className="text-sm text-navy">
            {pasajeros.map((nombre, indice) => (
              <li key={indice}>{nombre || `Pasajero ${indice + 1}`}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-navy/10 pt-3">
        <span className="text-sm text-navy/70">Precio por asiento</span>
        <span className="text-sm font-medium text-navy">{soles(precioAsiento)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-navy/70">Total</span>
        <span className="text-xl font-bold text-navy">{soles(total)}</span>
      </div>
    </Card>
  );
}
