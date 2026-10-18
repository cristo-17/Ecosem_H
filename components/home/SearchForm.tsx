"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { Button } from "@/components/ui/Button";
import { PassengerStepper } from "@/components/home/PassengerStepper";
import { PinIcon } from "@/components/ui/icons";
import { RUTAS } from "@/lib/routes";
import {
  ciudadesConRuta,
  fechaParaBusqueda,
  iniciarBusqueda,
  obtenerCatalogo,
  type CiudadesConRuta,
} from "@/lib/api/ventas";
import { ApiError, type AvisoReintento, type TipoFalla } from "@/lib/api/cliente";

// Misma referencia de "hoy" que usa DatePicker internamente (new Date() en
// el cuerpo del componente): no vendemos pasajes para fechas pasadas.
const hoy = new Date();

type EstadoCatalogo =
  | { tipo: "cargando" }
  | { tipo: "error"; falla: ApiError }
  | { tipo: "listo"; ciudades: CiudadesConRuta };

const MOTIVO_CATALOGO: Record<Exclude<TipoFalla, "servidor">, string> = {
  red: "Revisa tu conexión e intenta nuevamente.",
  tiempo: "El servidor no respondió a tiempo. Intenta nuevamente en unos segundos.",
  ocupado: "Hay mucha demanda en este momento. Espera un momento e intenta nuevamente.",
};

function aOpciones(ciudades: string[]) {
  return ciudades.map((ciudad) => ({ value: ciudad, label: ciudad }));
}

export function SearchForm() {
  const router = useRouter();

  const [origen, setOrigen] = useState<string | null>(null);
  const [destino, setDestino] = useState<string | null>(null);
  const [fechaIda, setFechaIda] = useState<Date | null>(null);
  const [mostrarRetorno, setMostrarRetorno] = useState(false);
  const [fechaRetorno, setFechaRetorno] = useState<Date | null>(null);
  const [pasajeros, setPasajeros] = useState(1);
  const [buscando, setBuscando] = useState(false);
  const [reintento, setReintento] = useState<AvisoReintento | null>(null);
  const [catalogo, setCatalogo] = useState<EstadoCatalogo>({ tipo: "cargando" });
  // Cambiarlo vuelve a pedir el catálogo (el botón ya puso "cargando").
  const [intentoCatalogo, setIntentoCatalogo] = useState(0);
  const [errores, setErrores] = useState<{
    origen?: string;
    destino?: string;
    fechaIda?: string;
  }>({});

  // Ciudades y rutas salen del catálogo del backend, nunca de una lista
  // escrita a mano: una ruta nueva aparece sola, y no se ofrece una que no
  // existe. Si no carga, el buscador queda deshabilitado con el motivo.
  useEffect(() => {
    let vigente = true;
    obtenerCatalogo({ onReintento: setReintento }).then(
      (respuesta) => {
        if (!vigente) return;
        setReintento(null);
        setCatalogo({ tipo: "listo", ciudades: ciudadesConRuta(respuesta) });
      },
      (error: unknown) => {
        if (!vigente) return;
        setReintento(null);
        setCatalogo({
          tipo: "error",
          falla:
            error instanceof ApiError
              ? error
              : new ApiError("servidor", "No pudimos cargar las ciudades."),
        });
      },
    );
    return () => {
      vigente = false;
    };
  }, [intentoCatalogo]);

  function reintentarCatalogo() {
    setCatalogo({ tipo: "cargando" });
    setIntentoCatalogo((valor) => valor + 1);
  }

  const ciudades = catalogo.tipo === "listo" ? catalogo.ciudades : null;
  const opcionesOrigen = aOpciones(ciudades?.origenes ?? []);
  const opcionesDestino = aOpciones(
    (origen && ciudades?.destinosDesde[origen]) || [],
  );
  const deshabilitado = catalogo.tipo !== "listo";
  const placeholderCiudad =
    catalogo.tipo === "cargando" ? "Cargando…" : catalogo.tipo === "error" ? "No disponible" : "Ciudad";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nuevosErrores: typeof errores = {};
    if (!origen) nuevosErrores.origen = "Elige una ciudad de origen";
    if (!destino) nuevosErrores.destino = "Elige una ciudad de destino";
    if (origen && destino && !ciudades?.destinosDesde[origen]?.includes(destino)) {
      nuevosErrores.destino = "No hay una ruta entre estas ciudades";
    }
    if (!fechaIda) nuevosErrores.fechaIda = "Elige una fecha de ida";

    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    // Fecha de calendario (AAAA-MM-DD), no toISOString(): en UTC una
    // fecha elegida de noche en Perú podía pasar al día siguiente.
    const fecha = fechaParaBusqueda(fechaIda!);
    const params = new URLSearchParams({
      origen: origen!,
      destino: destino!,
      fecha,
      pasajeros: String(pasajeros),
    });
    if (mostrarRetorno && fechaRetorno) {
      params.set("fechaRetorno", fechaParaBusqueda(fechaRetorno));
    }

    // El botón queda cargando mientras dura la búsqueda real. Si falla, se
    // navega igual: resultados muestra el error de esta misma búsqueda (sin
    // repetirla) y ofrece reintentar.
    setBuscando(true);
    setReintento(null);
    try {
      await iniciarBusqueda(origen!, destino!, fecha, { onReintento: setReintento });
    } catch {
      // Lo muestra resultados.
    }
    router.push(`${RUTAS.resultadosPasajes}?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      {catalogo.tipo === "error" && (
        <div role="alert" className="flex flex-col gap-3 rounded-field bg-error-fill p-4 text-sm text-error-text">
          <p>
            <span className="font-semibold">No pudimos cargar las ciudades y rutas.</span>{" "}
            {catalogo.falla.tipo === "servidor"
              ? catalogo.falla.message
              : MOTIVO_CATALOGO[catalogo.falla.tipo]}
          </p>
          <Button variant="secundario" onClick={reintentarCatalogo} className="self-start">
            Reintentar
          </Button>
        </div>
      )}

      {/* fieldset disabled bloquea de una vez todo lo de adentro, también el
          contador de pasajeros y Buscar, mientras no haya catálogo. */}
      <fieldset
        disabled={deshabilitado}
        aria-busy={catalogo.tipo === "cargando"}
        className="flex min-w-0 flex-col gap-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Origen"
            options={opcionesOrigen}
            value={origen}
            onChange={(valor) => {
              setOrigen(valor);
              // El destino elegido puede no tener ruta desde el nuevo origen.
              if (destino && !ciudades?.destinosDesde[valor]?.includes(destino)) setDestino(null);
            }}
            placeholder={placeholderCiudad}
            errorText={errores.origen}
            icon={<PinIcon />}
            disabled={deshabilitado}
          />
          <Select
            label="Destino"
            options={opcionesDestino}
            value={destino}
            onChange={setDestino}
            placeholder={placeholderCiudad}
            helperText={!deshabilitado && !origen ? "Elige primero el origen" : undefined}
            errorText={errores.destino}
            icon={<PinIcon />}
            disabled={deshabilitado || !origen}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DatePicker
            label="Fecha de ida"
            value={fechaIda}
            onChange={setFechaIda}
            minDate={hoy}
            errorText={errores.fechaIda}
            disabled={deshabilitado}
          />
          {mostrarRetorno ? (
            <DatePicker
              label="Fecha de retorno"
              value={fechaRetorno}
              onChange={setFechaRetorno}
              minDate={fechaIda ?? hoy}
              disabled={deshabilitado}
            />
          ) : (
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-navy">
                Retorno (opcional)
              </span>
              <button
                type="button"
                onClick={() => setMostrarRetorno(true)}
                className="flex h-12 w-full items-center justify-center gap-1 rounded-field border border-dashed border-navy/30 text-sm font-medium text-secondary transition hover:bg-secondary/5 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
              >
                ¿Agregar fecha de retorno?
              </button>
            </div>
          )}
        </div>

        <PassengerStepper value={pasajeros} onChange={setPasajeros} />

        <Button type="submit" className="mt-1 w-full" isLoading={buscando}>
          Buscar
        </Button>
      </fieldset>
      <p role="status" aria-live="polite" className="text-center text-sm text-navy/70 empty:hidden">
        {reintento &&
          `Hay mucha demanda en este momento. Reintentando (${reintento.intento} de ${reintento.maximo})…`}
      </p>
    </form>
  );
}
