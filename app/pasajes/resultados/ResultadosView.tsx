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
  buscarViajes,
  franjaHoraria,
  labelTipoAsiento,
  FRANJAS_HORARIAS,
  TIPOS_ASIENTO,
  type Ciudad,
  type Viaje,
} from "@/lib/mock/viajes";
import { RUTAS } from "@/lib/routes";

type Estado = "cargando" | "error" | "listo";

const OPCIONES_HORARIO: SelectOption[] = [
  { value: "todos", label: "Todos los horarios" },
  ...FRANJAS_HORARIAS,
];

const OPCIONES_SERVICIO: SelectOption[] = [
  { value: "todos", label: "Todos los servicios" },
  ...TIPOS_ASIENTO,
];

export interface ResultadosViewProps {
  origen: Ciudad;
  destino: Ciudad;
  /**
   * true cuando la URL trae ?error=1. No hay backend todavía: es la forma
   * de probar el estado de error de esta pantalla sin depender de una
   * falla real de red. Se reemplaza cuando se integre la búsqueda real.
   */
  forzarError: boolean;
  pasajerosCount: number;
}

export function ResultadosView({
  origen,
  destino,
  forzarError,
  pasajerosCount,
}: ResultadosViewProps) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>("cargando");
  const [viajesRuta, setViajesRuta] = useState<Viaje[]>([]);
  const [horario, setHorario] = useState("todos");
  const [tipoServicio, setTipoServicio] = useState("todos");
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  // Cambiar este contador reprograma la simulación de red sin necesitar un
  // setState síncrono en el efecto (el reintento ya puso "cargando" antes
  // de incrementarlo, desde el event handler del botón).
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (forzarError) {
        setEstado("error");
        return;
      }
      setViajesRuta(buscarViajes(origen, destino));
      setEstado("listo");
    }, 700);
    return () => clearTimeout(timeoutId);
  }, [origen, destino, forzarError, intento]);

  function reintentar() {
    setEstado("cargando");
    setIntento((valor) => valor + 1);
  }

  const viajesFiltrados = viajesRuta.filter((viaje) => {
    if (horario !== "todos" && franjaHoraria(viaje.horaSalida) !== horario)
      return false;
    if (tipoServicio !== "todos" && viaje.tipoAsiento !== tipoServicio)
      return false;
    return true;
  });

  function limpiarFiltros() {
    setHorario("todos");
    setTipoServicio("todos");
  }

  const filtrosDeshabilitados = estado !== "listo";

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
      <p className="mt-1 text-sm text-navy/70">
        {estado === "cargando" && "Buscando los mejores horarios…"}
        {estado === "error" && "No se pudo completar la búsqueda"}
        {estado === "listo" &&
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
        {estado === "cargando" && (
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

        {estado === "error" && (
          <EmptyState
            icon={<ExclamationIcon className="!size-12 !text-primary" />}
            title="Sin conexión a internet"
            description="No pudimos completar la búsqueda. Revisa tu conexión e intenta nuevamente."
            actionLabel="Reintentar"
            onAction={reintentar}
            footer={
              <p className="text-sm text-navy/70">
                O llama a la central: +51 959 366 710
              </p>
            }
          />
        )}

        {estado === "listo" && viajesRuta.length === 0 && (
          <EmptyState
            icon={<SearchOffIcon />}
            title="No hay viajes para esta ruta"
            description="Todavía no tenemos horarios programados entre estas ciudades. Prueba con otro origen o destino."
            actionLabel="Modificar búsqueda"
            onAction={() => router.push(RUTAS.inicio)}
          />
        )}

        {estado === "listo" &&
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

        {estado === "listo" &&
          viajesFiltrados.map((viaje) => (
            <TripCard
              key={viaje.id}
              marca={viaje.marca}
              terminalOrigen={viaje.terminalOrigen}
              destino={viaje.destino}
              horaSalida={viaje.horaSalida}
              horaLlegada={viaje.horaLlegada}
              duracionMinutos={viaje.duracionMinutos}
              asientosDisponibles={viaje.asientosDisponibles}
              tipoAsiento={labelTipoAsiento(viaje.tipoAsiento)}
              precio={viaje.precio}
              selected={seleccionadoId === viaje.id}
              onSeleccionar={() => setSeleccionadoId(viaje.id)}
            />
          ))}
      </div>

      {seleccionadoId && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-navy/10 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto max-w-3xl">
            <Button
              className="w-full"
              onClick={() =>
                router.push(
                  `${RUTAS.compraAsientos}?viajeId=${encodeURIComponent(seleccionadoId)}&pasajeros=${pasajerosCount}`,
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
