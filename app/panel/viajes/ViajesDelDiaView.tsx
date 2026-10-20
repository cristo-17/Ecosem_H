"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Select, type SelectOption } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { Badge, type BadgeStatus } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonShape } from "@/components/ui/Skeleton";
import { BusIcon, ExclamationIcon, SearchOffIcon } from "@/components/ui/icons";
import type { CatalogResponse } from "@/lib/types/contratos-frontend";
import type { EstadoViajeOperacion, ViajesOperacion } from "@/lib/embarque/contrato";
import { ciudadesDeRuta, viajesDelDia } from "@/lib/api/operacion";
import { fechaDesdeBusqueda, fechaParaBusqueda, hoyEnPeru, obtenerCatalogo } from "@/lib/api/ventas";
import { esSesionVencida } from "@/lib/api/cuenta";
import { mensajeCompra, type MensajeError } from "@/lib/api/compra";
import { labelTipoAsiento } from "@/lib/mock/viajes";
import { formatFechaCorta, formatHora12 } from "@/lib/format";
import { RUTAS, rutaPanelViaje } from "@/lib/routes";

export const BADGE_VIAJE: Record<EstadoViajeOperacion, BadgeStatus> = {
  programado: "pendiente",
  en_ruta: "en-ruta",
  completado: "completado",
  cancelado: "cancelado",
};

type Lista =
  | { tipo: "cargando" }
  | { tipo: "sesion-vencida" }
  | { tipo: "error"; mensaje: MensajeError }
  | { tipo: "lista"; viajes: ViajesOperacion["trips"]; catalogo: CatalogResponse };

export interface ViajesDelDiaViewProps {
  /** El supervisor puede elegir una agencia; al counter el backend le da la suya. */
  eligeAgencia: boolean;
}

export function ViajesDelDiaView({ eligeAgencia }: ViajesDelDiaViewProps) {
  const router = useRouter();
  const [fecha, setFecha] = useState<Date>(() => fechaDesdeBusqueda(hoyEnPeru()));
  const [agencia, setAgencia] = useState<string | null>(null);
  const [agencias, setAgencias] = useState<SelectOption[]>([]);
  const [lista, setLista] = useState<Lista>({ tipo: "cargando" });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!eligeAgencia) return;
    obtenerCatalogo().then(
      ({ terminals }) => setAgencias(terminals.map((t) => ({ value: t.code, label: t.name }))),
      () => setAgencias([]),
    );
  }, [eligeAgencia]);

  useEffect(() => {
    const controlador = new AbortController();
    Promise.all([
      viajesDelDia(fechaParaBusqueda(fecha), agencia, { signal: controlador.signal }),
      obtenerCatalogo(),
    ]).then(
      ([{ trips }, catalogo]) => {
        if (controlador.signal.aborted) return;
        setLista({
          tipo: "lista",
          viajes: [...trips].sort((a, b) => a.departsAt.localeCompare(b.departsAt)),
          catalogo,
        });
      },
      (error: unknown) => {
        if (controlador.signal.aborted) return;
        setLista(
          esSesionVencida(error)
            ? { tipo: "sesion-vencida" }
            : { tipo: "error", mensaje: mensajeCompra(error) },
        );
      },
    );
    return () => controlador.abort();
  }, [fecha, agencia, intento]);

  function recargar() {
    setLista({ tipo: "cargando" });
    setIntento((v) => v + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-navy sm:text-2xl">Viajes del día</h1>
        <p className="mt-1 text-sm text-navy/70">
          Entra a un viaje para ver sus pasajeros, el embarque y generar el manifiesto.
        </p>
      </div>

      <Card className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DatePicker
          label="Fecha"
          value={fecha}
          onChange={(nueva) => {
            setLista({ tipo: "cargando" });
            setFecha(nueva);
          }}
        />
        {eligeAgencia && (
          <Select
            label="Agencia"
            options={agencias}
            value={agencia}
            onChange={(valor) => {
              setLista({ tipo: "cargando" });
              setAgencia(valor);
            }}
            placeholder="Todas"
          />
        )}
      </Card>

      {lista.tipo === "cargando" && (
        <div role="status" aria-label="Cargando viajes" className="flex flex-col gap-3">
          <SkeletonShape variant="card" />
          <SkeletonShape variant="card" />
        </div>
      )}

      {lista.tipo === "sesion-vencida" && (
        <EmptyState
          icon={<ExclamationIcon className="!size-12 !text-primary" />}
          title="Tu sesión terminó"
          description="Vuelve a ingresar para ver los viajes."
          actionLabel="Ingresar"
          onAction={() =>
            router.push(`${RUTAS.ingresar}?${new URLSearchParams({ siguiente: RUTAS.panelViajes, motivo: "sesion-vencida" })}`)
          }
        />
      )}

      {lista.tipo === "error" && (
        <EmptyState
          icon={<ExclamationIcon className="!size-12 !text-primary" />}
          title={lista.mensaje.titulo}
          description={lista.mensaje.descripcion}
          actionLabel="Reintentar"
          onAction={recargar}
        />
      )}

      {lista.tipo === "lista" && lista.viajes.length === 0 && (
        <EmptyState
          icon={<SearchOffIcon />}
          title="No hay viajes en esta fecha"
          description={eligeAgencia ? "Prueba con otra fecha o agencia." : "Prueba con otra fecha. Solo ves los viajes de tu agencia."}
          actionLabel="Ver hoy"
          onAction={() => {
            setLista({ tipo: "cargando" });
            setFecha(fechaDesdeBusqueda(hoyEnPeru()));
          }}
        />
      )}

      {lista.tipo === "lista" && lista.viajes.length > 0 && (
        <div className="flex flex-col gap-3">
          {lista.viajes.map((viaje) => {
            const { origen, destino } = ciudadesDeRuta(lista.catalogo, viaje.route);
            const salida = new Date(viaje.departsAt);
            return (
              <Card key={viaje.tripId} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-navy/5 text-navy/60">
                    <BusIcon />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-navy">
                      {origen} → {destino}
                    </p>
                    <p className="text-xs text-navy/60">
                      {formatHora12(salida)} · {formatFechaCorta(salida)}
                      {viaje.bus ? ` · Bus ${viaje.bus.plate}` : " · Sin bus asignado"} ·{" "}
                      {labelTipoAsiento(viaje.serviceType)}
                    </p>
                    <p className="mt-1 text-xs text-navy/60">
                      {viaje.seats.sold}/{viaje.seats.total} vendidos
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  <Badge status={BADGE_VIAJE[viaje.status]} />
                  <Button variant="secundario" onClick={() => router.push(rutaPanelViaje(viaje.tripId))}>
                    Ver detalle
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
