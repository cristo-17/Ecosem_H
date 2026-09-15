"use client";

import { useState } from "react";
import { InfoIcon } from "@/components/ui/icons";
import { USUARIO_MOCK } from "@/lib/mock/sesion";
import { formatPrecio } from "@/lib/format";
import {
  TARIFAS_RUTA,
  FACTORES_OCUPACION,
  FACTORES_ANTICIPACION,
  FACTORES_TEMPORADA,
  etiquetaRuta,
  type TarifaRuta,
  type RangoFactor,
  type FactorTemporada,
  type CambioTarifa,
} from "@/lib/mock/precios";
import { TablaRutas } from "./TablaRutas";
import { TablaFactores } from "./TablaFactores";
import { SimuladorPrecio } from "./SimuladorPrecio";
import { HistorialCambios } from "./HistorialCambios";

function nuevoId(): string {
  return typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

export function PreciosView() {
  const [rutas, setRutas] = useState<TarifaRuta[]>(TARIFAS_RUTA);
  const [ocupacion, setOcupacion] = useState<RangoFactor[]>(FACTORES_OCUPACION);
  const [anticipacion, setAnticipacion] = useState<RangoFactor[]>(FACTORES_ANTICIPACION);
  const [temporada, setTemporada] = useState<FactorTemporada[]>(FACTORES_TEMPORADA);
  const [historial, setHistorial] = useState<CambioTarifa[]>([]);

  function registrarCambio(campo: string, valorAnterior: string, valorNuevo: string) {
    setHistorial((prev) => [
      { id: nuevoId(), fecha: new Date(), usuario: USUARIO_MOCK.nombre, campo, valorAnterior, valorNuevo },
      ...prev,
    ]);
  }

  function handleGuardarRuta(actualizada: TarifaRuta, anterior: TarifaRuta) {
    const nombreRuta = etiquetaRuta(actualizada);
    if (actualizada.tarifaBase !== anterior.tarifaBase) {
      registrarCambio(`Tarifa base — ${nombreRuta}`, formatPrecio(anterior.tarifaBase), formatPrecio(actualizada.tarifaBase));
    }
    if (actualizada.topeMinimo !== anterior.topeMinimo) {
      registrarCambio(`Tope mínimo — ${nombreRuta}`, formatPrecio(anterior.topeMinimo), formatPrecio(actualizada.topeMinimo));
    }
    if (actualizada.topeMaximo !== anterior.topeMaximo) {
      registrarCambio(`Tope máximo — ${nombreRuta}`, formatPrecio(anterior.topeMaximo), formatPrecio(actualizada.topeMaximo));
    }
    setRutas((prev) => prev.map((ruta) => (ruta.id === actualizada.id ? actualizada : ruta)));
  }

  function handleGuardarOcupacion(id: string, anterior: number, nuevo: number) {
    const etiqueta = ocupacion.find((rango) => rango.id === id)?.etiqueta ?? id;
    registrarCambio(`Factor de ocupación — ${etiqueta}`, `×${anterior.toFixed(2)}`, `×${nuevo.toFixed(2)}`);
    setOcupacion((prev) => prev.map((rango) => (rango.id === id ? { ...rango, factor: nuevo } : rango)));
  }

  function handleGuardarAnticipacion(id: string, anterior: number, nuevo: number) {
    const etiqueta = anticipacion.find((rango) => rango.id === id)?.etiqueta ?? id;
    registrarCambio(`Factor de anticipación — ${etiqueta}`, `×${anterior.toFixed(2)}`, `×${nuevo.toFixed(2)}`);
    setAnticipacion((prev) => prev.map((rango) => (rango.id === id ? { ...rango, factor: nuevo } : rango)));
  }

  function handleGuardarTemporada(id: string, anterior: number, nuevo: number) {
    const etiqueta = temporada.find((fila) => fila.id === id)?.etiqueta ?? id;
    registrarCambio(`Factor de temporada — ${etiqueta}`, `×${anterior.toFixed(2)}`, `×${nuevo.toFixed(2)}`);
    setTemporada((prev) => prev.map((fila) => (fila.id === id ? { ...fila, factor: nuevo } : fila)));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-navy sm:text-2xl">Motor de precios</h1>
        <p className="mt-1 text-sm text-navy/70">
          Reglas explícitas, no un algoritmo de optimización: precio = tarifa base × ocupación ×
          anticipación × temporada, acotado por el tope de la ruta.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-md bg-info-fill p-4 text-sm text-info-text">
        <InfoIcon className="mt-0.5 !size-5 shrink-0" />
        <p>
          Los cambios de acá solo aplican a reservas nuevas. El precio de un carrito en curso ya
          quedó congelado al iniciar esa reserva y no se recalcula (regla del proyecto) — nada de lo
          que edites en esta pantalla toca una compra que ya está en camino.
        </p>
      </div>

      <TablaRutas rutas={rutas} onGuardar={handleGuardarRuta} />

      <TablaFactores
        titulo="Factores de ocupación"
        descripcion="Referenciales de la propuesta técnica — editables."
        columnaEtiqueta="Ocupación"
        factores={ocupacion}
        onGuardar={handleGuardarOcupacion}
      />

      <TablaFactores
        titulo="Factores de anticipación"
        descripcion="Placeholder: pendiente de definición comercial (ver docs/INFORME-AVANCE.md)."
        columnaEtiqueta="Anticipación"
        factores={anticipacion}
        onGuardar={handleGuardarAnticipacion}
      />

      <TablaFactores
        titulo="Factores de temporada"
        descripcion="Feriados, Fiestas Patrias, fin de año y eventos locales de Pasco y Junín."
        columnaEtiqueta="Temporada"
        factores={temporada}
        onGuardar={handleGuardarTemporada}
      />

      <SimuladorPrecio rutas={rutas} ocupacion={ocupacion} anticipacion={anticipacion} temporada={temporada} />

      <HistorialCambios historial={historial} />
    </div>
  );
}
