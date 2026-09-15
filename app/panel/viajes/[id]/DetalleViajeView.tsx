"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SkeletonShape } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChevronLeftIcon, DownloadIcon, SearchOffIcon, SteeringWheelIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import {
  buscarViajeDelDiaPorId,
  type ViajeDelDia,
  type EstadoEmbarquePasajero,
} from "@/lib/mock/manifiesto";
import { labelTipoAsiento } from "@/lib/mock/viajes";
import { descargarManifiestoPdf } from "@/lib/pdf/manifiesto";
import { formatFechaLarga, formatHora12 } from "@/lib/format";
import { RUTAS } from "@/lib/routes";

type Estado = "cargando" | "error" | "listo";

// No es el Badge de pasajes/encomiendas (components/ui/Badge.tsx): ese
// componente tiene 5 estados fijos que pide el skill para esos dominios
// ("Confirmado" ya significa otra cosa ahí) — acá hacen falta exactamente
// las dos palabras del prompt, "pendiente"/"embarcado", así que se reusan
// los mismos tokens de color en un span propio en vez de forzar el
// vocabulario de ese componente a un tercer significado.
function PlacaEmbarque({ estado }: { estado: EstadoEmbarquePasajero }) {
  const embarcado = estado === "embarcado";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-field px-3 py-1 text-sm font-medium",
        embarcado ? "bg-success-fill text-success-text" : "bg-warning-fill text-warning-text",
      )}
    >
      {embarcado ? "Embarcado" : "Pendiente"}
    </span>
  );
}

export interface DetalleViajeViewProps {
  viajeId: string;
}

export function DetalleViajeView({ viajeId }: DetalleViajeViewProps) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>("cargando");
  const [viaje, setViaje] = useState<ViajeDelDia | null>(null);
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const encontrado = buscarViajeDelDiaPorId(viajeId);
      if (!encontrado) {
        setEstado("error");
        return;
      }
      setViaje(encontrado);
      setEstado("listo");
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [viajeId]);

  async function generarManifiesto() {
    if (!viaje) return;
    setGenerando(true);
    try {
      // Mismo módulo (lib/pdf/manifiesto.ts) sin importar desde dónde se
      // llame — un solo generador, igual que el boleto.
      await descargarManifiestoPdf({
        origen: viaje.origen,
        destino: viaje.destino,
        terminalOrigen: viaje.terminalOrigen,
        fechaSalida: viaje.fechaSalida,
        placaBus: viaje.placaBus,
        conductores: viaje.conductores,
        pasajeros: viaje.pasajeros.map((pasajero) => ({
          asiento: pasajero.asiento,
          apellidos: pasajero.apellidos,
          nombres: pasajero.nombres,
          tipoDocumento: pasajero.tipoDocumento,
          numeroDocumento: pasajero.numeroDocumento,
          origen: pasajero.origen,
          destino: pasajero.destino,
        })),
      });
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Button variant="terciario" className="w-fit" onClick={() => router.push(RUTAS.panelViajes)}>
        <ChevronLeftIcon />
        Volver a viajes
      </Button>

      {estado === "cargando" && (
        <div role="status" aria-label="Cargando viaje" className="flex flex-col gap-4">
          <SkeletonShape variant="text" lines={2} className="max-w-sm" />
          <SkeletonShape variant="card" className="h-64" />
        </div>
      )}

      {estado === "error" && (
        <EmptyState
          icon={<SearchOffIcon />}
          title="No encontramos ese viaje"
          description="Puede que ya no esté programado para hoy."
          actionLabel="Volver a viajes"
          onAction={() => router.push(RUTAS.panelViajes)}
        />
      )}

      {estado === "listo" && viaje && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-navy sm:text-2xl">
                {viaje.origen} → {viaje.destino}
              </h1>
              <p className="mt-1 text-sm text-navy/70">
                {formatFechaLarga(viaje.fechaSalida)}, {formatHora12(viaje.fechaSalida)} ·{" "}
                {labelTipoAsiento(viaje.tipoAsiento)} · {viaje.terminalOrigen}
              </p>
            </div>
            <Badge status={viaje.estado} />
          </div>

          <Card className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <SteeringWheelIcon className="!text-navy/50" />
              <div>
                <p className="text-xs text-navy/60">Unidad</p>
                <p className="text-sm font-semibold text-navy">{viaje.placaBus}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-navy/60">
                {viaje.conductores.length > 1 ? "Conductores" : "Conductor"}
              </p>
              <p className="text-sm font-semibold text-navy">{viaje.conductores.join(" / ")}</p>
            </div>
            <div>
              <p className="text-xs text-navy/60">Ocupación</p>
              <p className="text-sm font-semibold text-navy">
                {viaje.pasajeros.length}/{viaje.capacidad} vendidos
              </p>
            </div>
          </Card>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-navy">Pasajeros</h2>
              <Button onClick={generarManifiesto} isLoading={generando} disabled={viaje.pasajeros.length === 0}>
                <DownloadIcon />
                Generar manifiesto
              </Button>
            </div>

            {viaje.pasajeros.length === 0 ? (
              <p className="mt-4 text-sm text-navy/60">
                Este viaje no tiene pasajeros vendidos — no hay manifiesto que generar.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="text-xs font-medium text-navy/60">
                      <th className="pb-2 font-medium">Asiento</th>
                      <th className="pb-2 font-medium">Nombre completo</th>
                      <th className="pb-2 font-medium">Documento</th>
                      <th className="pb-2 font-medium">Destino</th>
                      <th className="pb-2 font-medium">Embarque</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viaje.pasajeros.map((pasajero) => (
                      <tr key={pasajero.asiento} className="border-t border-navy/10">
                        <td className="py-2 text-navy">{pasajero.asiento}</td>
                        <td className="py-2 text-navy">
                          {pasajero.apellidos}, {pasajero.nombres}
                        </td>
                        <td className="py-2 text-navy/70">
                          {pasajero.tipoDocumento} {pasajero.numeroDocumento}
                        </td>
                        <td className="py-2 text-navy/70">{pasajero.destino}</td>
                        <td className="py-2">
                          <PlacaEmbarque estado={pasajero.estadoEmbarque} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
