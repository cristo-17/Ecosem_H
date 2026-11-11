"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/ui/Stepper";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { SkeletonShape } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { SeatMap } from "@/components/pasajes/SeatMap";
import { ReservationTimer } from "@/components/pasajes/ReservationTimer";
import { ReservaVencida } from "@/components/pasajes/EstadosReserva";
import { useVigenciaReserva } from "@/components/pasajes/useVigenciaReserva";
import { usePurchase, type ViajeCompra } from "@/components/pasajes/PurchaseProvider";
import { useToast } from "@/components/ui/Toast";
import { ExclamationIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api/cliente";
import { buscarViajes, busquedaEntregada } from "@/lib/api/ventas";
import {
  liberarReserva,
  mensajeCompra,
  obtenerPlano,
  reservarAsientos,
  type MensajeError,
} from "@/lib/api/compra";
import { planoDesdeApi, type Asiento, type DistribucionPiso } from "@/lib/asientos";
import { formatFechaLarga, formatHora12, formatPrecio } from "@/lib/format";
import { RUTAS, rutaCompraConfirmacion, rutaCompraDatos } from "@/lib/routes";

type Carga =
  | { tipo: "cargando" }
  | { tipo: "error"; mensaje: MensajeError }
  | {
      tipo: "listo";
      viaje: ViajeCompra;
      distribucion: DistribucionPiso[];
      asientos: Asiento[];
    };

const VIAJE_NO_ENCONTRADO: MensajeError = {
  titulo: "No encontramos ese viaje",
  descripcion: "Puede que ya haya salido o que no esté a la venta. Vuelve a buscar tus horarios.",
};

function mismosAsientos(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((codigo) => b.includes(codigo));
}

export interface AsientosViewProps {
  viajeId: string;
  pasajerosCount: number;
  origen: string;
  destino: string;
  fecha: string;
}

export function AsientosView({ viajeId, pasajerosCount, origen, destino, fecha }: AsientosViewProps) {
  const router = useRouter();
  const purchase = usePurchase();
  const { showToast } = useToast();
  const [carga, setCarga] = useState<Carga>({ tipo: "cargando" });
  // Cambiarlo vuelve a pedir el plano (tras un asiento tomado o un reintento).
  const [intento, setIntento] = useState(0);
  const [reservando, setReservando] = useState(false);
  const [cambioPrecio, setCambioPrecio] = useState<{ anterior: number; actual: string; reservaId: string } | null>(null);
  const continuarRef = useRef<HTMLButtonElement>(null);

  // Una reserva viva de este mismo viaje (se volvió desde "Datos"): sus
  // asientos arrancan elegidos.
  const reserva = purchase.reserva?.tripId === viajeId ? purchase.reserva : null;
  const [seleccionados, setSeleccionados] = useState<string[]>(() => reserva?.seats ?? []);
  const { restanteMs, vigencia } = useVigenciaReserva(
    reserva?.reservationId ?? null,
    reserva?.expiresAt ?? null,
  );

  // Mismo patrón que Modal/TopBar: el efecto de carga no depende de todo el
  // objeto `purchase`, que cambia de referencia con cada campo.
  const purchaseRef = useRef(purchase);
  useEffect(() => {
    purchaseRef.current = purchase;
  });

  useEffect(() => {
    const controlador = new AbortController();
    const enMemoria = purchaseRef.current.viaje;
    const viaje: Promise<ViajeCompra | null> =
      enMemoria?.viaje.id === viajeId
        ? Promise.resolve(enMemoria)
        : origen && destino
          ? (busquedaEntregada(origen, destino, fecha) ?? buscarViajes(origen, destino, fecha)).then(
              ({ viajes }) => {
                const encontrado = viajes.find(({ viaje: v }) => v.id === viajeId);
                return encontrado ? { ...encontrado, origen, destino, fecha } : null;
              },
            )
          : Promise.resolve(null);

    Promise.all([viaje, obtenerPlano(viajeId, { signal: controlador.signal })]).then(
      ([encontrado, plano]) => {
        if (controlador.signal.aborted) return;
        if (!encontrado) return setCarga({ tipo: "error", mensaje: VIAJE_NO_ENCONTRADO });
        purchaseRef.current.iniciar(encontrado, pasajerosCount);
        setCarga({ tipo: "listo", viaje: encontrado, ...planoDesdeApi(plano.seats) });
      },
      (error: unknown) => {
        if (!controlador.signal.aborted) setCarga({ tipo: "error", mensaje: mensajeCompra(error) });
      },
    );
    return () => controlador.abort();
  }, [viajeId, origen, destino, fecha, pasajerosCount, intento]);

  // Ya comprada (p. ej. se volvió con "atrás" desde la confirmación).
  useEffect(() => {
    if (vigencia === "comprada" && reserva) router.replace(rutaCompraConfirmacion(reserva.reservationId));
  }, [vigencia, reserva, router]);

  function reintentar() {
    setCarga({ tipo: "cargando" });
    setIntento((valor) => valor + 1);
  }

  function elegirDeNuevo() {
    purchase.olvidarReserva();
    setSeleccionados([]);
    setIntento((valor) => valor + 1);
  }

  // Los asientos de la reserva propia vienen "reservado" del backend: aquí se
  // muestran como elegidos, no como tomados por otro.
  const asientosPlano =
    carga.tipo === "listo"
      ? carga.asientos.map((a) =>
          reserva?.seats.includes(a.id) && vigencia !== "vencida" ? { ...a, estado: "libre" as const } : a,
        )
      : [];

  function manejarToggle(asiento: Asiento) {
    // Actualización funcional: dos toques seguidos no deben pisarse.
    if (seleccionados.includes(asiento.id)) {
      setSeleccionados((actuales) => actuales.filter((id) => id !== asiento.id));
      return;
    }
    if (asiento.estado !== "libre") return;
    if (seleccionados.length >= pasajerosCount) {
      showToast({
        type: "info",
        title: "Ya elegiste tus asientos",
        description: `Puedes elegir hasta ${pasajerosCount} ${pasajerosCount === 1 ? "asiento" : "asientos"}. Quita uno para cambiar tu elección.`,
      });
      return;
    }
    setSeleccionados((actuales) =>
      actuales.includes(asiento.id) || actuales.length >= pasajerosCount
        ? actuales
        : [...actuales, asiento.id],
    );
  }

  async function continuar() {
    if (reservando || cambioPrecio) return;
    if (reserva && purchase.pagoIniciado) {
      router.push(rutaCompraConfirmacion(reserva.reservationId));
      return;
    }
    if (reserva && vigencia !== "vencida" && mismosAsientos(reserva.seats, seleccionados)) {
      router.push(rutaCompraDatos(reserva.reservationId));
      return;
    }

    setReservando(true);
    try {
      // Cambió la elección: primero se sueltan los asientos anteriores, para
      // no retenerlos dos veces ni sumarlos al tope de la sesión.
      if (reserva) {
        await liberarReserva(reserva.reservationId).catch(() => {});
        purchase.olvidarReserva();
      }
      const nueva = await reservarAsientos(viajeId, seleccionados);
      purchase.fijarReserva(nueva);
      const mostrado = carga.tipo === "listo" ? carga.viaje.viaje.unitPrice : null;
      // Comparar totales en céntimos: unitPrice es por asiento, totalAmount
      // ya incluye todos los elegidos. El monto congelado nunca se modifica.
      const anterior = mostrado ? Math.round(Number(mostrado) * 100) * seleccionados.length : null;
      if (anterior !== null && anterior !== Math.round(Number(nueva.totalAmount) * 100)) {
        setCambioPrecio({ anterior: anterior / 100, actual: nueva.totalAmount, reservaId: nueva.reservationId });
        setReservando(false);
        return;
      }
      router.push(rutaCompraDatos(nueva.reservationId));
    } catch (error) {
      const mensaje = mensajeCompra(error);
      showToast({ type: "error", title: mensaje.titulo, description: mensaje.descripcion });
      if (error instanceof ApiError && error.codigo === "SEAT_UNAVAILABLE") {
        const tomados = error.detalles?.unavailableSeats ?? [];
        setSeleccionados((actuales) => actuales.filter((codigo) => !tomados.includes(codigo)));
        setIntento((valor) => valor + 1);
      }
      setReservando(false);
    }
  }

  const listoParaContinuar = seleccionados.length === pasajerosCount;
  const reservaVigente = reserva && vigencia !== "vencida" ? reserva : null;
  const totalCongelado =
    reservaVigente && mismosAsientos(reservaVigente.seats, seleccionados) ? reservaVigente.totalAmount : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <Modal open={cambioPrecio !== null} title="La tarifa cambió" preventDismiss
        returnFocusRef={continuarRef} onClose={() => {}}
        footer={<>
          <Button variant="secundario" onClick={() => {
            purchase.soltarReserva();
            setCambioPrecio(null);
            router.push(RUTAS.inicio);
          }}>Volver a buscar</Button>
          <Button disabled={vigencia === "vencida" || vigencia === "verificando"} onClick={() => {
            if (!cambioPrecio || vigencia === "vencida") return;
            const id = cambioPrecio.reservaId;
            setCambioPrecio(null);
            router.push(rutaCompraDatos(id));
          }}>Aceptar y continuar</Button>
        </>}>
        {cambioPrecio && <div className="space-y-3">
          <p>La tarifa cambió desde tu búsqueda. Revisa el total antes de continuar.</p>
          <p>Total mostrado en la búsqueda: <strong>{formatPrecio(cambioPrecio.anterior)}</strong>.</p>
          <p>Total de la reserva: <strong>{formatPrecio(Number(cambioPrecio.actual))}</strong>.</p>
          <p>Este es el importe congelado para tus {seleccionados.length} asientos. Aún no se ha realizado ningún cobro.</p>
          {vigencia === "vencida" && <p role="alert">La reserva venció. Vuelve a buscar tus pasajes.</p>}
        </div>}
      </Modal>
      <Stepper currentStep={2} className="mb-6" />

      {carga.tipo === "cargando" && (
        <div role="status" aria-label="Cargando plano de asientos" className="flex flex-col gap-4">
          <SkeletonShape variant="text" lines={2} className="max-w-sm" />
          <SkeletonShape variant="card" className="h-96" />
        </div>
      )}

      {carga.tipo === "error" && (
        <EmptyState
          icon={<ExclamationIcon className="!size-12 !text-primary" />}
          title={carga.mensaje.titulo}
          description={carga.mensaje.descripcion}
          actionLabel={carga.mensaje === VIAJE_NO_ENCONTRADO ? "Buscar pasajes" : "Reintentar"}
          onAction={carga.mensaje === VIAJE_NO_ENCONTRADO ? () => router.push(RUTAS.inicio) : reintentar}
        />
      )}

      {carga.tipo === "listo" && (
        <>
          <h1 className="text-xl font-semibold text-navy sm:text-2xl">
            {carga.viaje.origen} → {carga.viaje.destino}
          </h1>
          <p className="mt-1 text-sm text-navy/70">
            {formatFechaLarga(new Date(carga.viaje.viaje.departsAt))} ·{" "}
            {formatHora12(new Date(carga.viaje.viaje.departsAt))} · Elige{" "}
            {pasajerosCount === 1 ? "tu asiento" : `tus ${pasajerosCount} asientos`} (
            {seleccionados.length}/{pasajerosCount})
          </p>

          {reserva && vigencia === "vencida" ? (
            <div className="mt-4">
              <ReservaVencida asientos={reserva.seats} onVolverAEmpezar={elegirDeNuevo} />
            </div>
          ) : (
            <>
              <ReservationTimer
                restanteMs={reservaVigente ? restanteMs : null}
                verificando={vigencia === "verificando"}
                className="mt-4"
              />
              <SeatMap
                distribucion={carga.distribucion}
                asientos={asientosPlano}
                seleccionados={seleccionados}
                onToggle={manejarToggle}
                className="mt-4"
              />
            </>
          )}

          <Card className="mt-4 border border-border-default">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {totalCongelado ? (
                  <>
                    <p className="text-xs text-text-secondary">Total</p>
                    <p className="text-lg font-bold text-navy">{formatPrecio(Number(totalCongelado))}</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-text-secondary">Precio por asiento, referencial</p>
                    <p className="text-lg font-bold text-navy">
                      {carga.viaje.viaje.unitPrice
                        ? formatPrecio(Number(carga.viaje.viaje.unitPrice))
                        : "Sin tarifa"}
                    </p>
                    <p className="text-xs text-text-secondary">El total se fija al separar los asientos</p>
                  </>
                )}
              </div>
              <Button
                ref={continuarRef}
                disabled={!listoParaContinuar || (reserva !== null && vigencia === "vencida")}
                isLoading={reservando}
                onClick={continuar}
                className="w-full sm:w-auto sm:min-w-40"
              >
                Continuar
              </Button>
            </div>
          </Card>
        </>
      )}
    </main>
  );
}
