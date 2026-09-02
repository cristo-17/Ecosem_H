import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ChevronRightIcon } from "@/components/ui/icons";
import { buscarViajes, RUTAS_POPULARES } from "@/lib/mock/viajes";
import { formatDuracion, formatPrecio } from "@/lib/format";
import { RUTAS } from "@/lib/routes";

export function PopularRoutes() {
  return (
    <div>
      <h2 className="text-base font-semibold text-navy">Rutas populares</h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {RUTAS_POPULARES.map((ruta) => {
          // Marca y duración vienen del catálogo real de viajes (una sola
          // fuente de datos, sin duplicar en RUTAS_POPULARES): se toma el
          // primer viaje de la ruta como referencia.
          const [viajeReferencia] = buscarViajes(ruta.origen, ruta.destino);
          return (
            <Link
              key={ruta.id}
              href={`${RUTAS.resultadosPasajes}?origen=${ruta.origen}&destino=${ruta.destino}`}
              className="block rounded-modal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
            >
              <Card className="flex items-center justify-between gap-3 transition hover:shadow-medium">
                <div className="min-w-0">
                  {viajeReferencia && (
                    <p className="text-xs font-semibold text-navy/60">{viajeReferencia.marca}</p>
                  )}
                  <p className="mt-0.5 truncate text-sm font-semibold text-navy">
                    {ruta.origen} → {ruta.destino}
                  </p>
                  <p className="mt-1 text-xs text-navy/60">
                    {viajeReferencia && `${formatDuracion(viajeReferencia.duracionMinutos)} · `}
                    Por tramo Desde {formatPrecio(ruta.precioDesde)}
                  </p>
                </div>
                <ChevronRightIcon className="!size-6 shrink-0 text-navy/40" />
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
