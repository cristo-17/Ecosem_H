"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeStatus } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SkeletonShape } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { DownloadIcon, ExclamationIcon, TicketIcon } from "@/components/ui/icons";
import type { TicketsResponse } from "@/lib/types/contratos-frontend";
import { boletosDeMiCompra, esSesionVencida, misReservas } from "@/lib/api/cuenta";
import { mensajeCompra, type MensajeError } from "@/lib/api/compra";
import { etiquetaAsiento } from "@/lib/asientos";
import { formatFechaLarga, formatHora12, formatPrecio } from "@/lib/format";
import { descargarBoletosCompraPdf } from "@/lib/pdf/boleto";
import { RUTAS } from "@/lib/routes";

interface Compra {
  reservationId: string;
  /** Total congelado de la reserva, tal como lo devuelve el backend. */
  total: string;
  boletos: TicketsResponse | null;
}

type Estado =
  | { tipo: "cargando" }
  | { tipo: "sesion-vencida" }
  | { tipo: "error"; mensaje: MensajeError }
  | { tipo: "listo"; compras: Compra[] };

export interface MisViajesTabProps {
  /** Fuerza la lista vacía para probar el EmptyState (?vacio=viajes). */
  forzarVacio?: boolean;
}

function estadoViaje(boletos: TicketsResponse | null): BadgeStatus {
  const viaje = boletos?.tickets[0]?.trip;
  if (!viaje) return "confirmado";
  if (viaje.cancelled) return "cancelado";
  return Date.parse(viaje.departsAt) < Date.now() ? "completado" : "confirmado";
}

/**
 * Las compras de la cuenta. Las entrega svc-ventas filtrando por el usuario
 * del token verificado (D-015 del backend): esta pantalla no decide qué
 * compras son de quién. Aparecen las hechas con la sesión iniciada y las
 * vinculadas desde la pestaña donde se compró sin cuenta (D-048).
 */
export function MisViajesTab({ forzarVacio = false }: MisViajesTabProps) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });
  const [intento, setIntento] = useState(0);
  const [descargando, setDescargando] = useState<Set<string>>(new Set());

  useEffect(() => {
    const controlador = new AbortController();
    (async () => {
      const { reservations } = await misReservas({ signal: controlador.signal });
      const compradas = forzarVacio ? [] : reservations.filter((r) => r.status === "purchased");
      // Los boletos traen el viaje (ruta, hora) y el QR. Si uno falla, la
      // compra se muestra igual, sin descarga.
      return Promise.all(
        compradas.map(async (r) => ({
          reservationId: r.reservationId,
          total: r.totalAmount,
          boletos: await boletosDeMiCompra(r.reservationId, { signal: controlador.signal }).catch(
            () => null,
          ),
        })),
      );
    })().then(
      (compras) => {
        if (controlador.signal.aborted) return;
        compras.sort(
          (a, b) =>
            Date.parse(b.boletos?.tickets[0]?.trip.departsAt ?? "0") -
            Date.parse(a.boletos?.tickets[0]?.trip.departsAt ?? "0"),
        );
        setEstado({ tipo: "listo", compras });
      },
      (error: unknown) => {
        if (controlador.signal.aborted) return;
        setEstado(
          esSesionVencida(error)
            ? { tipo: "sesion-vencida" }
            : { tipo: "error", mensaje: mensajeCompra(error) },
        );
      },
    );
    return () => controlador.abort();
  }, [forzarVacio, intento]);

  function reintentar() {
    setEstado({ tipo: "cargando" });
    setIntento((valor) => valor + 1);
  }

  async function handleDescargar(compra: Compra) {
    if (!compra.boletos) return;
    setDescargando((prev) => new Set(prev).add(compra.reservationId));
    try {
      await descargarBoletosCompraPdf(compra.boletos);
    } finally {
      setDescargando((prev) => {
        const siguiente = new Set(prev);
        siguiente.delete(compra.reservationId);
        return siguiente;
      });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {estado.tipo === "cargando" && (
        <div role="status" aria-label="Cargando tus viajes" className="flex flex-col gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <SkeletonShape key={index} variant="card" />
          ))}
        </div>
      )}

      {estado.tipo === "sesion-vencida" && (
        <EmptyState
          icon={<ExclamationIcon className="!size-12 !text-primary" />}
          title="Tu sesión terminó"
          description="Vuelve a ingresar para ver tus viajes."
          actionLabel="Ingresar"
          onAction={() =>
            router.push(
              `${RUTAS.ingresar}?${new URLSearchParams({ siguiente: RUTAS.miPerfil, motivo: "sesion-vencida" })}`,
            )
          }
        />
      )}

      {estado.tipo === "error" && (
        <EmptyState
          icon={<ExclamationIcon className="!size-12 !text-primary" />}
          title="No pudimos cargar tus viajes"
          description={estado.mensaje.descripcion}
          actionLabel="Reintentar"
          onAction={reintentar}
        />
      )}

      {estado.tipo === "listo" && estado.compras.length === 0 && (
        <EmptyState
          icon={<TicketIcon />}
          title="Todavía no tienes viajes en esta cuenta"
          description="Aparecen aquí las compras hechas con tu sesión iniciada, y las que hiciste sin cuenta si después ingresaste en esa misma pestaña."
          actionLabel="Buscar pasajes"
          onAction={() => router.push(RUTAS.inicio)}
        />
      )}

      {estado.tipo === "listo" &&
        estado.compras.map((compra) => {
          const viaje = compra.boletos?.tickets[0]?.trip;
          const asientos = compra.boletos?.tickets.map((t) => etiquetaAsiento(t.seat)) ?? [];
          return (
            <Card key={compra.reservationId} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-navy/60">Ecosem H</p>
                  {viaje ? (
                    <>
                      <p className="text-base font-semibold text-navy">
                        {viaje.origin} → {viaje.destination}
                      </p>
                      <p className="mt-0.5 text-xs text-navy/60">
                        {formatFechaLarga(new Date(viaje.departsAt))} ·{" "}
                        {formatHora12(new Date(viaje.departsAt))}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-navy/70">No pudimos cargar el detalle de este viaje.</p>
                  )}
                </div>
                <Badge status={estadoViaje(compra.boletos)} />
              </div>

              {compra.boletos && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-navy/10 pt-3 text-sm text-navy/70">
                  <span>
                    Código <span className="font-medium text-navy">{compra.boletos.purchaseCode}</span>
                  </span>
                  <span>Asientos {asientos.join(", ")}</span>
                  <span>{asientos.length === 1 ? "1 pasajero" : `${asientos.length} pasajeros`}</span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-navy/10 pt-3">
                <p className="text-lg font-bold text-navy">{formatPrecio(Number(compra.total))}</p>
                <Button
                  variant="secundario"
                  disabled={!compra.boletos || descargando.has(compra.reservationId)}
                  onClick={() => handleDescargar(compra)}
                >
                  <DownloadIcon className="h-4 w-4 shrink-0" />
                  {descargando.has(compra.reservationId) ? "Generando..." : "Descargar PDF"}
                </Button>
              </div>
            </Card>
          );
        })}
    </div>
  );
}
