import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { TicketIcon, ClockIcon, CreditCardIcon, BusIcon, SteeringWheelIcon, ExclamationIcon, ScaleIcon } from "@/components/ui/icons";
import { esSupervisor } from "@/lib/mock/sesion";
import { obtenerRolDemo } from "@/lib/auth/sesion";
import { RUTAS } from "@/lib/routes";

export default async function PanelIndexPage() {
  const rol = await obtenerRolDemo();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Link
        href={RUTAS.panelViajes}
        className="block rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
      >
        <Card className="flex h-full flex-col gap-3 transition hover:shadow-medium">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <TicketIcon />
          </span>
          <div>
            <h2 className="text-base font-semibold text-navy">Manifiestos y Viajes</h2>
            <p className="mt-1 text-sm text-navy/70">
              Visualiza los viajes del día, lista de pasajeros y genera los manifiestos SUTRAN.
            </p>
          </div>
          <span className="mt-auto text-sm font-semibold text-primary">Ir a Viajes →</span>
        </Card>
      </Link>

      <Link
        href={RUTAS.panelVenta}
        className="block rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
      >
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

      <Link
        href={RUTAS.panelCaja}
        className="block rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
      >
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

      {esSupervisor(rol) && (
        <Link
          href={RUTAS.panelPrecios}
          className="block rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
        >
          <Card className="flex h-full flex-col gap-3 transition hover:shadow-medium">
            <span className="flex size-11 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <CreditCardIcon />
            </span>
            <div>
              <h2 className="text-base font-semibold text-navy">Motor de precios</h2>
              <p className="mt-1 text-sm text-navy/70">
                Tarifas por ruta, factores de ocupación/anticipación/temporada y simulador. Solo
                supervisor.
              </p>
            </div>
            <span className="mt-auto text-sm font-semibold text-secondary">Ir a Precios →</span>
          </Card>
        </Link>
      )}

      {esSupervisor(rol) && (
        <Link
          href={RUTAS.panelFlota}
          className="block rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
        >
          <Card className="flex h-full flex-col gap-3 transition hover:shadow-medium">
            <span className="flex size-11 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <BusIcon />
            </span>
            <div>
              <h2 className="text-base font-semibold text-navy">Flota</h2>
              <p className="mt-1 text-sm text-navy/70">
                Unidades, documentos con vencimiento y umbral de kilometraje para mantenimiento.
              </p>
            </div>
            <span className="mt-auto text-sm font-semibold text-secondary">Ir a Flota →</span>
          </Card>
        </Link>
      )}

      {esSupervisor(rol) && (
        <Link
          href={RUTAS.panelConductores}
          className="block rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
        >
          <Card className="flex h-full flex-col gap-3 transition hover:shadow-medium">
            <span className="flex size-11 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <SteeringWheelIcon className="!text-secondary" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-navy">Conductores</h2>
              <p className="mt-1 text-sm text-navy/70">
                Licencias, vencimientos y horas de conducción acumuladas por conductor.
              </p>
            </div>
            <span className="mt-auto text-sm font-semibold text-secondary">Ir a Conductores →</span>
          </Card>
        </Link>
      )}

      {esSupervisor(rol) && (
        <Link
          href={RUTAS.panelAlertas}
          className="block rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
        >
          <Card className="flex h-full flex-col gap-3 transition hover:shadow-medium">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ExclamationIcon className="!size-6" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-navy">Alertas</h2>
              <p className="mt-1 text-sm text-navy/70">
                Bandeja de alertas activas de flota y conductores, ordenadas por urgencia.
              </p>
            </div>
            <span className="mt-auto text-sm font-semibold text-primary">Ir a Alertas →</span>
          </Card>
        </Link>
      )}

      {esSupervisor(rol) && (
        <Link
          href={RUTAS.panelTarifario}
          className="block rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
        >
          <Card className="flex h-full flex-col gap-3 transition hover:shadow-medium">
            <span className="flex size-11 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <ScaleIcon />
            </span>
            <div>
              <h2 className="text-base font-semibold text-navy">Tarifario</h2>
              <p className="mt-1 text-sm text-navy/70">
                Rangos de encomiendas por ruta, exceso de equipaje y recargo por valor declarado.
              </p>
            </div>
            <span className="mt-auto text-sm font-semibold text-secondary">Ir a Tarifario →</span>
          </Card>
        </Link>
      )}
    </div>
  );
}
