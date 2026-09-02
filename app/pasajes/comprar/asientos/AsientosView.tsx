"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/ui/Stepper";
import { Button } from "@/components/ui/Button";
import { SkeletonShape } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { SeatMap } from "@/components/pasajes/SeatMap";
import { ReservationTimer } from "@/components/pasajes/ReservationTimer";
import { usePurchase } from "@/components/pasajes/PurchaseProvider";
import { useToast } from "@/components/ui/Toast";
import { SearchOffIcon } from "@/components/ui/icons";
import { VIAJES } from "@/lib/mock/viajes";
import { distribucionBus, generarAsientos, type Asiento } from "@/lib/mock/asientos";
import { formatDuracion, formatHora12, formatPrecio } from "@/lib/format";
import { RUTAS } from "@/lib/routes";

type Estado = "cargando" | "error" | "listo";

export interface AsientosViewProps {
  viajeId: string;
  pasajerosCount: number;
}

export function AsientosView({ viajeId, pasajerosCount }: AsientosViewProps) {
  const router = useRouter();
  const purchase = usePurchase();
  const { showToast } = useToast();
  const [estado, setEstado] = useState<Estado>("cargando");

  // Mismo patrón que Modal/TopBar (ver sus comentarios): sincronizar en un
  // ref evita que el efecto de abajo dependa de todo el objeto `purchase`
  // (nueva referencia cada vez que cambia cualquier campo del contexto, p.
  // ej. al marcar un asiento) y se reprograme sin necesidad.
  const iniciarRef = useRef(purchase.iniciar);
  useEffect(() => {
    iniciarRef.current = purchase.iniciar;
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const viaje = VIAJES.find((v) => v.id === viajeId);
      if (!viaje) {
        setEstado("error");
        return;
      }
      iniciarRef.current(viaje, pasajerosCount);
      setEstado("listo");
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [viajeId, pasajerosCount]);

  const viaje = purchase.viaje;
  const distribucion = useMemo(() => (viaje ? distribucionBus(viaje.tipoAsiento) : []), [viaje]);
  const asientos = useMemo(() => (viaje ? generarAsientos(viaje) : []), [viaje]);

  function manejarExpiracion() {
    const rutaVuelta = viaje
      ? `${RUTAS.resultadosPasajes}?origen=${encodeURIComponent(viaje.origen)}&destino=${encodeURIComponent(viaje.destino)}`
      : RUTAS.inicio;
    showToast({
      type: "error",
      title: "Tu reserva expiró",
      description: "Los asientos que elegiste fueron liberados. Vuelve a intentarlo.",
    });
    purchase.reiniciar();
    router.push(rutaVuelta);
  }

  function manejarToggle(asiento: Asiento) {
    const yaSeleccionado = purchase.asientos.includes(asiento.id);
    if (yaSeleccionado) {
      purchase.setAsientos(purchase.asientos.filter((id) => id !== asiento.id));
      return;
    }
    if (asiento.estado !== "libre") return;
    if (purchase.asientos.length >= purchase.pasajerosCount) {
      showToast({
        type: "info",
        title: "Ya elegiste tus asientos",
        description: `Puedes elegir hasta ${purchase.pasajerosCount} ${purchase.pasajerosCount === 1 ? "asiento" : "asientos"}. Quita uno para cambiar tu elección.`,
      });
      return;
    }
    purchase.setAsientos([...purchase.asientos, asiento.id]);
  }

  const listoParaContinuar = purchase.asientos.length === purchase.pasajerosCount;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 pb-28 sm:py-8">
      <Stepper currentStep={2} className="mb-6" />

      {estado === "cargando" && (
        <div role="status" aria-label="Cargando plano de asientos" className="flex flex-col gap-4">
          <SkeletonShape variant="text" lines={2} className="max-w-sm" />
          <SkeletonShape variant="card" className="h-96" />
        </div>
      )}

      {estado === "error" && (
        <EmptyState
          icon={<SearchOffIcon />}
          title="No encontramos ese viaje"
          description="El viaje que intentas reservar ya no está disponible. Vuelve a buscar tus horarios."
          actionLabel="Volver a resultados"
          onAction={() => router.push(RUTAS.inicio)}
        />
      )}

      {estado === "listo" && viaje && (
        <>
          <h1 className="text-xl font-semibold text-navy sm:text-2xl">
            {viaje.origen} → {viaje.destino}
          </h1>
          <p className="mt-1 text-sm text-navy/70">
            {formatHora12(viaje.horaSalida)} · {formatDuracion(viaje.duracionMinutos)} · Elige{" "}
            {purchase.pasajerosCount === 1 ? "tu asiento" : `tus ${purchase.pasajerosCount} asientos`} (
            {purchase.asientos.length}/{purchase.pasajerosCount})
          </p>

          <ReservationTimer expiraEn={purchase.reservaExpiraEn} onExpire={manejarExpiracion} className="mt-4" />

          <SeatMap
            distribucion={distribucion}
            asientos={asientos}
            seleccionados={purchase.asientos}
            onToggle={manejarToggle}
            className="mt-4"
          />

          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-navy/10 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
              <div>
                <p className="text-xs text-navy/60">Total</p>
                <p className="text-lg font-bold text-navy">
                  {formatPrecio(viaje.precio * purchase.pasajerosCount)}
                </p>
              </div>
              <Button
                disabled={!listoParaContinuar}
                onClick={() => router.push(RUTAS.compraDatos)}
                className="min-w-40"
              >
                Continuar
              </Button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
