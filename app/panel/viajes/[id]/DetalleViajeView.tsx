"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SkeletonShape } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { ChevronLeftIcon, DownloadIcon, ExclamationIcon, SteeringWheelIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import type { Manifiesto, TipoDocumento, VersionManifiesto } from "@/lib/embarque/contrato";
import {
  generarManifiesto,
  manifiesto as pedirManifiesto,
  mensajeManifiesto,
  versionesManifiesto,
} from "@/lib/api/operacion";
import type { MensajeError } from "@/lib/api/compra";
import { etiquetaAsiento } from "@/lib/asientos";
import { labelTipoAsiento } from "@/lib/mock/viajes";
import { descargarManifiestoPdf } from "@/lib/pdf/manifiesto";
import { formatFechaCorta, formatFechaLarga, formatHora12, maskDocumento } from "@/lib/format";
import { RUTAS } from "@/lib/routes";

const TIPO_DOCUMENTO: Record<TipoDocumento, string> = {
  dni: "DNI",
  carne_extranjeria: "C.E.",
  pasaporte: "Pasaporte",
};

type Carga =
  | { tipo: "cargando" }
  | { tipo: "error"; mensaje: MensajeError }
  | { tipo: "sin-manifiesto" }
  | { tipo: "listo"; manifiesto: Manifiesto; versiones: VersionManifiesto[] };

// No es el Badge de pasajes/encomiendas: ahí "Confirmado" ya significa otra
// cosa. Mismos tokens de color, dos palabras propias.
function PlacaEmbarque({ embarcado }: { embarcado: boolean }) {
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

/**
 * El manifiesto versionado del viaje (B-16 del backend). En pantalla el
 * documento va enmascarado, y menores y menores en brazos se marcan sin
 * nombres. Completo solo en el PDF, que es el documento de fiscalización
 * (D-052).
 */
export function DetalleViajeView({ viajeId }: DetalleViajeViewProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [carga, setCarga] = useState<Carga>({ tipo: "cargando" });
  const [intento, setIntento] = useState(0);
  const [generando, setGenerando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const generandoRef = useRef(false);

  useEffect(() => {
    const controlador = new AbortController();
    const { signal } = controlador;
    versionesManifiesto(viajeId, { signal })
      .then(async ({ versions }): Promise<Carga> => {
        if (versions.length === 0) return { tipo: "sin-manifiesto" };
        const ultima = Math.max(...versions.map((v) => v.version));
        const manifiesto = await pedirManifiesto(viajeId, ultima, { signal });
        return { tipo: "listo", manifiesto, versiones: versions };
      })
      .then(
        (estado) => {
          if (!signal.aborted) setCarga(estado);
        },
        (error: unknown) => {
          if (!signal.aborted) setCarga({ tipo: "error", mensaje: mensajeManifiesto(error) });
        },
      );
    return () => controlador.abort();
  }, [viajeId, intento]);

  function recargar() {
    setCarga({ tipo: "cargando" });
    setIntento((v) => v + 1);
  }

  async function handleGenerar() {
    if (generandoRef.current) return;
    generandoRef.current = true;
    setGenerando(true);
    try {
      const nueva = await generarManifiesto(viajeId);
      showToast({
        type: "success",
        title: `Manifiesto versión ${nueva.version}`,
        description: "Generado con los pasajeros, el bus y los conductores de ahora.",
      });
      recargar();
    } catch (error) {
      const mensaje = mensajeManifiesto(error);
      showToast({ type: "error", title: mensaje.titulo, description: mensaje.descripcion });
    } finally {
      generandoRef.current = false;
      setGenerando(false);
    }
  }

  async function handleDescargar(manifiesto: Manifiesto) {
    setDescargando(true);
    try {
      await descargarManifiestoPdf(manifiesto);
    } finally {
      setDescargando(false);
    }
  }

  const volver = (
    <Button variant="terciario" className="w-fit" onClick={() => router.push(RUTAS.panelViajes)}>
      <ChevronLeftIcon />
      Volver a viajes
    </Button>
  );

  if (carga.tipo === "cargando") {
    return (
      <div className="flex flex-col gap-4">
        {volver}
        <div role="status" aria-label="Cargando el manifiesto" className="flex flex-col gap-4">
          <SkeletonShape variant="text" lines={2} className="max-w-sm" />
          <SkeletonShape variant="card" className="h-64" />
        </div>
      </div>
    );
  }

  if (carga.tipo === "error") {
    return (
      <div className="flex flex-col gap-4">
        {volver}
        <EmptyState
          icon={<ExclamationIcon className="!size-12 !text-primary" />}
          title={carga.mensaje.titulo}
          description={carga.mensaje.descripcion}
          actionLabel="Reintentar"
          onAction={recargar}
        />
      </div>
    );
  }

  if (carga.tipo === "sin-manifiesto") {
    return (
      <div className="flex flex-col gap-4">
        {volver}
        <Card className="flex flex-col gap-3">
          <h1 className="text-lg font-semibold text-navy">Este viaje todavía no tiene manifiesto</h1>
          <p className="text-sm text-navy/70">
            Al generarlo se toma la foto de pasajeros, bus y conductores de ahora. Cada versión queda
            registrada con quién la generó y qué cambió.
          </p>
          <Button onClick={handleGenerar} isLoading={generando} className="self-start">
            Generar manifiesto
          </Button>
        </Card>
      </div>
    );
  }

  const { manifiesto, versiones } = carga;
  const { trip, bus, drivers, requiredDrivers, passengers, infantsInArms } = manifiesto.content;
  const salida = new Date(trip.departsAt);
  const generado = new Date(manifiesto.generatedAt);
  const embarcados = passengers.filter((p) => p.boarded).length;
  const enBrazosDe = (asiento: string) => infantsInArms.find((m) => m.carrierSeat === asiento);

  return (
    <div className="flex flex-col gap-4">
      {volver}

      <div>
        <h1 className="text-xl font-semibold text-navy sm:text-2xl">
          {trip.origin} → {trip.destination}
        </h1>
        <p className="mt-1 text-sm text-navy/70">
          {formatFechaLarga(salida)}, {formatHora12(salida)} · {labelTipoAsiento(trip.serviceType)}
        </p>
      </div>

      <Card className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-2">
          <SteeringWheelIcon className="!text-navy/50" />
          <div>
            <p className="text-xs text-navy/60">Unidad</p>
            <p className="text-sm font-semibold text-navy">
              {bus.unit} · {bus.plate}
            </p>
          </div>
        </div>
        <div>
          <p className="text-xs text-navy/60">{drivers.length > 1 ? "Conductores" : "Conductor"}</p>
          <p className="text-sm font-semibold text-navy">
            {drivers.length
              ? drivers.map((d) => `${d.firstNames} ${d.lastNames}`).join(" / ")
              : "Sin asignar"}
          </p>
          {drivers.length < requiredDrivers.required && (
            <p className="text-xs text-error-text">El viaje exige {requiredDrivers.required}.</p>
          )}
        </div>
        <div>
          <p className="text-xs text-navy/60">Embarque (en esta versión)</p>
          <p className="text-sm font-semibold text-navy">
            {embarcados}/{passengers.length} embarcados
            {infantsInArms.length > 0 ? ` · ${infantsInArms.length} en brazos` : ""}
          </p>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-navy">Pasajeros</h2>
            <p className="text-xs text-navy/60">
              Versión {manifiesto.version} · {formatFechaCorta(generado)} {formatHora12(generado)}
              {manifiesto.generatedByName ? ` · ${manifiesto.generatedByName}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secundario" onClick={handleGenerar} isLoading={generando}>
              Generar versión nueva
            </Button>
            <Button
              onClick={() => handleDescargar(manifiesto)}
              isLoading={descargando}
              disabled={passengers.length === 0}
            >
              <DownloadIcon />
              Descargar PDF
            </Button>
          </div>
        </div>
        <p className="mt-2 text-xs text-navy/60">
          El embarque que ves es el de esta versión. Genera una nueva para incluir lo último que
          sincronizaron los dispositivos.
        </p>

        {passengers.length === 0 ? (
          <p className="mt-4 text-sm text-navy/60">Este viaje no tiene pasajeros vendidos.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="text-xs font-medium text-navy/60">
                  <th className="pb-2 font-medium">Asiento</th>
                  <th className="pb-2 font-medium">Nombre completo</th>
                  <th className="pb-2 font-medium">Documento</th>
                  <th className="pb-2 font-medium">Destino</th>
                  <th className="pb-2 font-medium">Avisos</th>
                  <th className="pb-2 font-medium">Embarque</th>
                </tr>
              </thead>
              <tbody>
                {passengers.map((pasajero) => {
                  const enBrazos = enBrazosDe(pasajero.seat);
                  return (
                    <tr key={pasajero.seat} className="border-t border-navy/10">
                      <td className="py-2 text-navy">{etiquetaAsiento(pasajero.seat)}</td>
                      <td className="py-2 text-navy">
                        {pasajero.lastNames}, {pasajero.firstNames}
                      </td>
                      <td className="py-2 text-navy/70">
                        {/* En pantalla, enmascarado: completo solo en el PDF (D-052). */}
                        {TIPO_DOCUMENTO[pasajero.documentType]} {maskDocumento(pasajero.documentNumber)}
                      </td>
                      <td className="py-2 text-navy/70">{pasajero.destination}</td>
                      <td className="py-2 text-xs text-warning-text">
                        {/* Marcas sin nombres: el asiento basta para pedir el permiso. */}
                        {pasajero.minor && <p>Menor ({pasajero.ageAtTrip} años)</p>}
                        {enBrazos && <p>Lleva menor en brazos ({enBrazos.ageAtTrip})</p>}
                      </td>
                      <td className="py-2">
                        <PlacaEmbarque embarcado={pasajero.boarded} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {versiones.length > 1 && (
        <Card>
          <h2 className="text-base font-semibold text-navy">Versiones</h2>
          <ul className="mt-2 flex flex-col text-sm">
            {[...versiones]
              .sort((a, b) => b.version - a.version)
              .map((v) => (
                <li
                  key={v.version}
                  className="flex justify-between gap-3 border-t border-navy/10 py-2 first:border-0"
                >
                  <span className="text-navy">Versión {v.version}</span>
                  <span className="text-navy/60">
                    {formatFechaCorta(new Date(v.generatedAt))} {formatHora12(new Date(v.generatedAt))}
                    {v.generatedByName ? ` · ${v.generatedByName}` : ""}
                    {"first" in v.changes ? "" : v.changes.unchanged ? " · sin cambios" : " · con cambios"}
                  </span>
                </li>
              ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
