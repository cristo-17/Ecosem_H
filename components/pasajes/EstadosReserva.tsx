"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonShape } from "@/components/ui/Skeleton";
import { ClockIcon, ExclamationIcon } from "@/components/ui/icons";
import { consultarReserva, liberarReserva, mensajeCompra } from "@/lib/api/compra";
import { etiquetaAsiento } from "@/lib/asientos";
import { RUTAS, rutaCompraConfirmacion } from "@/lib/routes";

export interface ReservaVencidaProps {
  asientos: string[];
  /** Vuelve a la selección de asientos del mismo viaje, con lo escrito intacto. */
  onVolverAEmpezar: () => void;
}

/**
 * La reserva venció (lo dijo el backend). Reemplaza al formulario: no se deja
 * enviar nada sobre una reserva que ya no existe.
 */
export function ReservaVencida({ asientos, onVolverAEmpezar }: ReservaVencidaProps) {
  const router = useRouter();
  return (
    <div role="alert">
      <EmptyState
        icon={<ClockIcon className="!size-12 !text-warning-text" />}
        title="Tu reserva venció"
        description={`Se acabó el tiempo para completar la compra y ${asientos.length === 1 ? "el asiento" : "los asientos"} ${asientos.map(etiquetaAsiento).join(", ")} se liberaron. Lo que escribiste sigue aquí: vuelve a elegir asientos para continuar.`}
        actionLabel="Volver a elegir asientos"
        onAction={onVolverAEmpezar}
        footer={
          <button
            type="button"
            onClick={() => router.push(RUTAS.inicio)}
            className="min-h-11 text-sm font-medium text-secondary underline"
          >
            Buscar otro viaje
          </button>
        }
      />
    </div>
  );
}

type Comprobacion =
  | { tipo: "consultando" }
  | { tipo: "activa" }
  | { tipo: "terminada" }
  | { tipo: "error"; titulo: string; descripcion: string };

/**
 * Se llegó a un paso con `?reserva=` pero esta pestaña ya no tiene los datos
 * de la compra (se recargó). El estado real se pregunta al backend: si ya está
 * comprada se va a la confirmación; si sigue activa se ofrece empezar de
 * nuevo, liberando esos asientos.
 */
export function CompraInterrumpida({ reservationId }: { reservationId: string }) {
  const router = useRouter();
  const [comprobacion, setComprobacion] = useState<Comprobacion>({ tipo: "consultando" });

  useEffect(() => {
    let vigente = true;
    consultarReserva(reservationId).then(
      ({ status }) => {
        if (!vigente) return;
        if (status === "purchased") return router.replace(rutaCompraConfirmacion(reservationId));
        setComprobacion({ tipo: status === "active" ? "activa" : "terminada" });
      },
      (error: unknown) => {
        if (vigente) setComprobacion({ tipo: "error", ...mensajeCompra(error) });
      },
    );
    return () => {
      vigente = false;
    };
  }, [reservationId, router]);

  async function empezarDeNuevo() {
    // Los asientos de esta reserva se sueltan para no bloquearlos hasta que venza.
    await liberarReserva(reservationId).catch(() => {});
    router.push(RUTAS.inicio);
  }

  if (comprobacion.tipo === "consultando") {
    return (
      <div role="status" aria-label="Consultando tu reserva">
        <SkeletonShape variant="card" className="h-48" />
      </div>
    );
  }

  if (comprobacion.tipo === "error") {
    return (
      <EmptyState
        icon={<ExclamationIcon className="!size-12 !text-primary" />}
        title={comprobacion.titulo}
        description={comprobacion.descripcion}
        actionLabel="Buscar pasajes"
        onAction={() => router.push(RUTAS.inicio)}
      />
    );
  }

  return (
    <EmptyState
      icon={<ExclamationIcon className="!size-12 !text-primary" />}
      title="Tu compra se interrumpió"
      description={
        comprobacion.tipo === "activa"
          ? "Al recargar la página se perdieron los datos de esta compra en este dispositivo. Tus asientos siguen separados por unos minutos más: empieza de nuevo y los liberamos para que puedas elegir."
          : "Al recargar la página se perdieron los datos de esta compra, y la reserva ya no está vigente. Empieza una búsqueda nueva."
      }
      actionLabel="Empezar de nuevo"
      onAction={empezarDeNuevo}
    />
  );
}

/** Se entró a un paso sin `?reserva=`: no hay compra que continuar. */
export function SinCompraEnCurso() {
  const router = useRouter();
  return (
    <EmptyState
      icon={<ExclamationIcon className="!size-12 !text-primary" />}
      title="No hay una compra en curso"
      description="Busca un viaje para empezar a reservar tus pasajes."
      actionLabel="Buscar pasajes"
      onAction={() => router.push(RUTAS.inicio)}
    />
  );
}
