"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SkeletonShape } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { DownloadIcon, ExclamationIcon, TicketIcon } from "@/components/ui/icons";
import { MIS_COMPRAS, type CompraPasaje } from "@/lib/mock/compras";
import { labelTipoAsiento, terminalDe } from "@/lib/mock/viajes";
import { formatFechaLarga, formatHora12, formatPrecio } from "@/lib/format";
import { descargarBoletoPdf, type BoletoPdfData } from "@/lib/pdf/boleto";
import { RUTAS } from "@/lib/routes";

type Estado = "cargando" | "error" | "listo";

export interface MisViajesTabProps {
  forzarError?: boolean;
  /** Fuerza la lista vacía para probar el EmptyState (?vacio=viajes). */
  forzarVacio?: boolean;
}

function etiquetaAsiento(id: string): string {
  return id.replace(/^P\d-/, "");
}

async function descargarCompra(compra: CompraPasaje) {
  const datos: BoletoPdfData = {
    codigo: compra.codigo,
    emitidoEn: compra.fechaSalida,
    origen: compra.origen,
    destino: compra.destino,
    terminalOrigen: terminalDe(compra.origen),
    terminalDestino: terminalDe(compra.destino),
    horaSalida: compra.fechaSalida,
    tipoServicio: labelTipoAsiento(compra.tipoAsiento),
    asientos: compra.asientos.map(etiquetaAsiento),
    pasajeros: compra.pasajeros,
    totalSoles: compra.total,
    comprobante: compra.comprobante,
  };
  await descargarBoletoPdf(datos);
}

export function MisViajesTab({ forzarError = false, forzarVacio = false }: MisViajesTabProps) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>("cargando");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setEstado(forzarError ? "error" : "listo");
    }, 600);
    return () => clearTimeout(timeoutId);
  }, [forzarError, intento]);

  function reintentar() {
    setEstado("cargando");
    setIntento((valor) => valor + 1);
  }

  const compras = forzarVacio ? [] : MIS_COMPRAS;

  return (
    <div className="flex flex-col gap-4">
      {estado === "cargando" && (
        <div role="status" aria-label="Cargando tus viajes" className="flex flex-col gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <SkeletonShape key={index} variant="card" />
          ))}
        </div>
      )}

      {estado === "error" && (
        <EmptyState
          icon={<ExclamationIcon className="!size-12 !text-primary" />}
          title="No pudimos cargar tus viajes"
          description="Ocurrió un problema de conexión. Intenta nuevamente en unos segundos."
          actionLabel="Reintentar"
          onAction={reintentar}
        />
      )}

      {estado === "listo" && compras.length === 0 && (
        <EmptyState
          icon={<TicketIcon />}
          title="Todavía no tienes viajes"
          description="Cuando compres un pasaje, va a aparecer aquí con su estado y tu boleto."
          actionLabel="Buscar pasajes"
          onAction={() => router.push(RUTAS.inicio)}
        />
      )}

      {estado === "listo" &&
        compras.map((compra) => (
          <Card key={compra.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-navy/60">{compra.marca}</p>
                <p className="text-base font-semibold text-navy">
                  {compra.origen} → {compra.destino}
                </p>
                <p className="mt-0.5 text-xs text-navy/60">
                  {formatFechaLarga(compra.fechaSalida)} · {formatHora12(compra.fechaSalida)}
                </p>
              </div>
              <Badge status={compra.estado} />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-navy/10 pt-3 text-sm text-navy/70">
              <span>
                Código <span className="font-medium text-navy">{compra.codigo}</span>
              </span>
              <span>Asientos {compra.asientos.map(etiquetaAsiento).join(", ")}</span>
              <span>{labelTipoAsiento(compra.tipoAsiento)}</span>
              <span>
                {compra.pasajeros.length === 1 ? "1 pasajero" : `${compra.pasajeros.length} pasajeros`}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-navy/10 pt-3">
              <p className="text-lg font-bold text-navy">{formatPrecio(compra.total)}</p>
              <Button variant="secundario" onClick={() => descargarCompra(compra)}>
                <DownloadIcon className="!text-white" />
                Descargar PDF
              </Button>
            </div>
          </Card>
        ))}
    </div>
  );
}
