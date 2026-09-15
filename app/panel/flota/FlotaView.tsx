import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { UrgenciaPill } from "@/components/ui/UrgenciaPill";
import { BusIcon } from "@/components/ui/icons";
import {
  labelTipoServicio,
  UNIDADES,
  generarAlertasActivas,
  alertasDeUnidad,
  ordenarPorUrgencia,
} from "@/lib/mock/flota";
import { rutaPanelUnidad } from "@/lib/routes";

export function FlotaView() {
  const alertasActivas = generarAlertasActivas();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-navy sm:text-2xl">Flota</h1>
        <p className="mt-1 text-sm text-navy/70">
          Unidades registradas. Entra al detalle de una placa para ver sus documentos, umbrales y
          el histórico de alertas.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {UNIDADES.map((unidad) => {
          const propias = ordenarPorUrgencia(alertasDeUnidad(unidad.placa, alertasActivas));
          const [masUrgente] = propias;

          return (
            <Link key={unidad.placa} href={rutaPanelUnidad(unidad.placa)} className="block">
              <Card className="flex flex-col gap-3 transition hover:shadow-medium sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-navy/5 text-navy/60">
                    <BusIcon className="size-7" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-navy">
                      {unidad.placa} · {unidad.modelo}
                    </p>
                    <p className="text-xs text-navy/60">
                      {labelTipoServicio(unidad.tipoServicio)} · {unidad.capacidad} asientos
                    </p>
                    <p className="mt-1 text-xs text-navy/60">
                      {unidad.kilometrajeAcumulado.toLocaleString("es-PE")} km acumulados
                    </p>
                  </div>
                </div>
                <div className="sm:text-right">
                  {masUrgente ? (
                    <div className="flex flex-col gap-1 sm:items-end">
                      <UrgenciaPill urgencia={masUrgente.urgencia} />
                      {propias.length > 1 && (
                        <span className="text-xs text-navy/60">
                          +{propias.length - 1} alerta{propias.length - 1 === 1 ? "" : "s"} más
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-navy/50">Sin alertas activas</span>
                  )}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
