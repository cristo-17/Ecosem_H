"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Select, type SelectOption } from "@/components/ui/Select";
import { SkeletonShape } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { TripCard } from "@/components/ui/TripCard";
import { Stepper } from "@/components/ui/Stepper";
import { Button } from "@/components/ui/Button";
import { SearchOffIcon, ExclamationIcon } from "@/components/ui/icons";
import {
  franjaHoraria,
  labelTipoAsiento,
  FRANJAS_HORARIAS,
  TIPOS_ASIENTO,
} from "@/lib/mock/viajes";
import { RUTAS } from "@/lib/routes";
import { formatFechaLarga } from "@/lib/format";
import {
  buscarViajes,
  busquedaEntregada,
  fechaDesdeBusqueda,
  type ResultadoBusqueda,
} from "@/lib/api/ventas";
import { ApiError, type AvisoReintento, type TipoFalla } from "@/lib/api/cliente";

type Estado =
  | { tipo: "cargando"; reintento: AvisoReintento | null }
  | { tipo: "error"; falla: ApiError }
  | { tipo: "listo"; resultado: ResultadoBusqueda };

const MENSAJES_FALLA: Record<TipoFalla, { titulo: string; descripcion: string }> = {
  red: {
    titulo: "Sin conexión a internet",
    descripcion: "No pudimos completar la búsqueda. Revisa tu conexión e intenta nuevamente.",
  },
  tiempo: {
    titulo: "La búsqueda tardó demasiado",
    descripcion:
      "El servidor no respondió a tiempo. Puede ser una señal débil: intenta nuevamente en unos segundos.",
  },
  ocupado: {
    titulo: "Hay mucha demanda en este momento",
    descripcion:
      "Intentamos varias veces y el sistema de ventas sigue ocupado. Espera un momento e intenta nuevamente.",
  },
  // La descripción es el mensaje del backend: viene en español y sin datos personales.
  servidor: {
    titulo: "No se pudo completar la búsqueda",
    descripcion: "",
  },
};

const MARCA = "Ecosem H";

const OPCIONES_HORARIO: SelectOption[] = [
  { value: "todos", label: "Todos los horarios" },
  ...FRANJAS_HORARIAS,
];

const OPCIONES_SERVICIO: SelectOption[] = [
  { value: "todos", label: "Todos los servicios" },
  ...TIPOS_ASIENTO,
];

export interface ResultadosViewProps {
  origen: string;
  destino: string;
  /** `AAAA-MM-DD`, hora de Perú. */
  fecha: string;
  pasajerosCount: number;
}

export function ResultadosView({
  origen,
  destino,
  fecha,
  pasajerosCount,
}: ResultadosViewProps) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando", reintento: null });
  const [horario, setHorario] = useState("todos");
  const [tipoServicio, setTipoServicio] = useState("todos");
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  // Cambiar este contador repite la búsqueda sin necesitar un setState
  // síncrono en el efecto (el reintento ya puso "cargando" antes de
  // incrementarlo, desde el event handler del botón).
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controlador = new AbortController();
    // La primera vez se usa la búsqueda que ya hizo el buscador; "Reintentar"
    // siempre pide datos nuevos.
    const busqueda =
      (intento === 0 && busquedaEntregada(origen, destino, fecha)) ||
      buscarViajes(origen, destino, fecha, {
        signal: controlador.signal,
        onReintento: (reintento) => setEstado({ tipo: "cargando", reintento }),
      });

    busqueda.then(
      (resultado) => {
        if (!controlador.signal.aborted) setEstado({ tipo: "listo", resultado });
      },
      (error: unknown) => {
        if (controlador.signal.aborted) return;
        setEstado({
          tipo: "error",
          falla:
            error instanceof ApiError
              ? error
              : new ApiError("servidor", "No pudimos completar la búsqueda."),
        });
      },
    );
    return () => controlador.abort();
  }, [origen, destino, fecha, intento]);

  function reintentar() {
    setEstado({ tipo: "cargando", reintento: null });
    setIntento((valor) => valor + 1);
  }

  const viajesRuta = estado.tipo === "listo" ? estado.resultado.viajes : [];
  const viajesFiltrados = viajesRuta.filter(({ viaje }) => {
    if (horario !== "todos" && franjaHoraria(new Date(viaje.departsAt)) !== horario)
      return false;
    if (tipoServicio !== "todos" && viaje.serviceType !== tipoServicio)
      return false;
    return true;
  });

  function limpiarFiltros() {
    setHorario("todos");
    setTipoServicio("todos");
  }

  const filtrosDeshabilitados = estado.tipo !== "listo";
  const fechaLegible = formatFechaLarga(fechaDesdeBusqueda(fecha));

  return (
    <main
      className={cn(
        "mx-auto max-w-3xl px-4 py-6 sm:py-8",
        seleccionadoId && "pb-28",
      )}
    >
      <Stepper currentStep={1} className="mb-6" />

      <h1 className="text-xl font-semibold text-navy sm:text-2xl">
        {origen} → {destino}
      </h1>
      <p className="mt-1 text-sm font-medium text-navy">{fechaLegible}</p>
      <p aria-live="polite" className="mt-1 text-sm text-navy/70">
        {estado.tipo === "cargando" &&
          (estado.reintento
            ? `Hay mucha demanda en este momento. Reintentando (${estado.reintento.intento} de ${estado.reintento.maximo})…`
            : "Buscando los mejores horarios…")}
        {estado.tipo === "error" && "No se pudo completar la búsqueda"}
        {estado.tipo === "listo" &&
          `${viajesFiltrados.length} ${viajesFiltrados.length === 1 ? "viaje encontrado" : "viajes encontrados"}`}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Select
          label="Horario"
          options={OPCIONES_HORARIO}
          value={horario}
          onChange={setHorario}
          disabled={filtrosDeshabilitados}
        />
        <Select
          label="Tipo de servicio"
          options={OPCIONES_SERVICIO}
          value={tipoServicio}
          onChange={setTipoServicio}
          disabled={filtrosDeshabilitados}
        />
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {estado.tipo === "cargando" && (
          <div
            role="status"
            aria-label="Cargando resultados"
            className="flex flex-col gap-4"
          >
            {Array.from({ length: 4 }, (_, index) => (
              <SkeletonShape key={index} variant="card" />
            ))}
          </div>
        )}

        {estado.tipo === "error" && (
          <EmptyState
            icon={<ExclamationIcon className="!size-12 !text-primary" />}
            title={MENSAJES_FALLA[estado.falla.tipo].titulo}
            description={
              estado.falla.tipo === "servidor"
                ? estado.falla.message
                : MENSAJES_FALLA[estado.falla.tipo].descripcion
            }
            actionLabel="Reintentar"
            onAction={reintentar}
            footer={
              <div className="flex flex-col gap-1 text-sm text-navy/70">
                <p>O llama a la central: +51 959 366 710</p>
                {estado.falla.correlationId && (
                  <p className="text-xs">
                    Código de referencia: {estado.falla.correlationId.slice(0, 8)}
                  </p>
                )}
              </div>
            }
          />
        )}

        {estado.tipo === "listo" && !estado.resultado.existeRuta && (
          <EmptyState
            icon={<SearchOffIcon />}
            title="No hay viajes para esta ruta"
            description="Todavía no tenemos horarios programados entre estas ciudades. Prueba con otro origen o destino."
            actionLabel="Modificar búsqueda"
            onAction={() => router.push(RUTAS.inicio)}
          />
        )}

        {estado.tipo === "listo" &&
          estado.resultado.existeRuta &&
          viajesRuta.length === 0 && (
            <EmptyState
              icon={<SearchOffIcon />}
              title="No hay viajes para esta fecha"
              description={`No tenemos salidas programadas de ${origen} a ${destino} el ${fechaLegible}. Prueba con otra fecha.`}
              actionLabel="Cambiar fecha"
              onAction={() => router.push(RUTAS.inicio)}
            />
          )}

        {estado.tipo === "listo" &&
          viajesRuta.length > 0 &&
          viajesFiltrados.length === 0 && (
            <EmptyState
              icon={<SearchOffIcon />}
              title="Ningún viaje coincide con tus filtros"
              description="Prueba ampliando el horario o el tipo de servicio."
              actionLabel="Quitar filtros"
              onAction={limpiarFiltros}
            />
          )}

        {estado.tipo === "listo" &&
          viajesFiltrados.map(({ viaje, terminalOrigen }) => {
            const salida = new Date(viaje.departsAt);
            const llegada = viaje.arrivesAt ? new Date(viaje.arrivesAt) : null;
            return (
              <TripCard
                key={viaje.id}
                marca={MARCA}
                terminalOrigen={terminalOrigen}
                destino={destino}
                horaSalida={salida}
                horaLlegada={llegada}
                duracionMinutos={
                  llegada ? Math.round((llegada.getTime() - salida.getTime()) / 60_000) : null
                }
                llegadaAproximada={viaje.arrivalProvisional}
                asientosDisponibles={viaje.availableSeats}
                tipoAsiento={labelTipoAsiento(viaje.serviceType)}
                // Informativo: el precio que vale es el que congela la reserva.
                precio={viaje.unitPrice !== null ? Number(viaje.unitPrice) : null}
                selected={seleccionadoId === viaje.id}
                onSeleccionar={() => setSeleccionadoId(viaje.id)}
              />
            );
          })}
      </div>

      {seleccionadoId && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-navy/10 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto max-w-3xl">
            <Button
              className="w-full"
              onClick={() =>
                router.push(
                  `${RUTAS.compraAsientos}?${new URLSearchParams({
                    viajeId: seleccionadoId,
                    pasajeros: String(pasajerosCount),
                    // La búsqueda viaja con el viaje: si se recarga la página de
                    // asientos, se vuelve a pedir y se encuentra el viaje por id.
                    origen,
                    destino,
                    fecha,
                  }).toString()}`,
                )
              }
            >
              Continuar
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
