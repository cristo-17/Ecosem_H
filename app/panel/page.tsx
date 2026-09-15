import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { TicketIcon, ClockIcon } from "@/components/ui/icons";
import { RUTAS } from "@/lib/routes";

export default function PanelIndexPage() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Link href={RUTAS.panelVenta} className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary rounded-md">
        <Card className="flex h-full flex-col gap-3 transition hover:shadow-medium">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <TicketIcon />
          </span>
          <div>
            <h2 className="text-base font-semibold text-navy">Venta en counter</h2>
            <p className="mt-1 text-sm text-navy/70">
              Busca un viaje, elige asiento y registra un pasaje vendido de forma presencial.
            </p>
          </div>
          <span className="mt-auto text-sm font-semibold text-primary">Ir a Venta →</span>
        </Card>
      </Link>

      <Link href={RUTAS.panelCaja} className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary rounded-md">
        <Card className="flex h-full flex-col gap-3 transition hover:shadow-medium">
          <span className="flex size-11 items-center justify-center rounded-full bg-secondary/10 text-secondary">
            <ClockIcon />
          </span>
          <div>
            <h2 className="text-base font-semibold text-navy">Arqueo de caja</h2>
            <p className="mt-1 text-sm text-navy/70">
              Revisa el resumen de ventas de un turno por medio de pago y ciérralo.
            </p>
          </div>
          <span className="mt-auto text-sm font-semibold text-secondary">Ir a Caja →</span>
        </Card>
      </Link>
    </div>
  );
}
