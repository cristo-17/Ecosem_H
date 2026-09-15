"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { formatPrecio } from "@/lib/format";
import {
  buscarRango,
  calcularPrecio,
  etiquetaRuta,
  type TarifaRuta,
  type RangoFactor,
  type FactorTemporada,
} from "@/lib/mock/precios";

export interface SimuladorPrecioProps {
  rutas: TarifaRuta[];
  ocupacion: RangoFactor[];
  anticipacion: RangoFactor[];
  temporada: FactorTemporada[];
}

export function SimuladorPrecio({ rutas, ocupacion, anticipacion, temporada }: SimuladorPrecioProps) {
  const [rutaId, setRutaId] = useState<string | null>(rutas[0]?.id ?? null);
  const [ocupacionPct, setOcupacionPct] = useState("70");
  const [diasAnticipacion, setDiasAnticipacion] = useState("5");
  const [temporadaId, setTemporadaId] = useState<string | null>(temporada[0]?.id ?? null);

  const ruta = rutas.find((r) => r.id === rutaId) ?? null;
  const factorTemporada = temporada.find((t) => t.id === temporadaId) ?? null;

  const ocupacionNum = Number(ocupacionPct);
  const errorOcupacion = !ocupacionPct.trim()
    ? "Ingresa un valor"
    : !Number.isFinite(ocupacionNum) || ocupacionNum < 0
      ? "Debe ser un número positivo"
      : ocupacionNum > 100
        ? "No puede superar 100%"
        : undefined;
  const rangoOcupacion = errorOcupacion ? undefined : buscarRango(ocupacion, ocupacionNum);

  const diasNum = Number(diasAnticipacion);
  const errorAnticipacion = !diasAnticipacion.trim()
    ? "Ingresa un valor"
    : !Number.isFinite(diasNum) || diasNum < 0
      ? "Debe ser un número positivo"
      : undefined;
  const rangoAnticipacion = errorAnticipacion ? undefined : buscarRango(anticipacion, diasNum);

  const opcionesRuta = rutas.map((r) => ({ value: r.id, label: etiquetaRuta(r) }));
  const opcionesTemporada = temporada.map((t) => ({ value: t.id, label: t.etiqueta }));

  const resultado =
    ruta && rangoOcupacion && rangoAnticipacion && factorTemporada
      ? calcularPrecio(ruta, rangoOcupacion.factor, rangoAnticipacion.factor, factorTemporada.factor)
      : null;

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-navy">Simulador</h2>
        <p className="mt-1 text-sm text-navy/70">
          Elige una ruta y las condiciones del viaje: así se explica cualquier tarifa, factor por
          factor.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select label="Ruta" options={opcionesRuta} value={rutaId} onChange={setRutaId} />
        <Select label="Temporada" options={opcionesTemporada} value={temporadaId} onChange={setTemporadaId} />
        <Input
          label="Ocupación actual (%)"
          inputMode="numeric"
          value={ocupacionPct}
          onChange={(evento) => setOcupacionPct(evento.target.value)}
          errorText={errorOcupacion ?? (!rangoOcupacion ? "Fuera de los rangos configurados" : undefined)}
        />
        <Input
          label="Días de anticipación"
          inputMode="numeric"
          value={diasAnticipacion}
          onChange={(evento) => setDiasAnticipacion(evento.target.value)}
          errorText={errorAnticipacion ?? (!rangoAnticipacion ? "Fuera de los rangos configurados" : undefined)}
        />
      </div>

      {ruta && resultado && rangoOcupacion && rangoAnticipacion && factorTemporada ? (
        <div className="rounded-modal bg-navy/5 p-4">
          <p className="text-xs font-medium text-navy/60">Desglose</p>
          <dl className="mt-2 flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-navy/70">Tarifa base ({etiquetaRuta(ruta)})</dt>
              <dd className="shrink-0 text-navy">{formatPrecio(resultado.tarifaBase)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-navy/70">Factor de ocupación ({rangoOcupacion.etiqueta})</dt>
              <dd className="shrink-0 text-navy">×{resultado.factorOcupacion.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-navy/70">Factor de anticipación ({rangoAnticipacion.etiqueta})</dt>
              <dd className="shrink-0 text-navy">×{resultado.factorAnticipacion.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-navy/70">Factor de temporada ({factorTemporada.etiqueta})</dt>
              <dd className="shrink-0 text-navy">×{resultado.factorTemporada.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-navy/10 pt-1.5 font-medium">
              <dt className="text-navy">Subtotal</dt>
              <dd className="shrink-0 text-navy">{formatPrecio(resultado.subtotal)}</dd>
            </div>
          </dl>

          {resultado.ajustadoPor !== "ninguno" && (
            <p className="mt-3 rounded-md bg-warning-fill px-3 py-2 text-xs text-warning-text">
              Ajustado al tope {resultado.ajustadoPor === "minimo" ? "mínimo" : "máximo"} de la ruta
              ({formatPrecio(resultado.ajustadoPor === "minimo" ? ruta.topeMinimo : ruta.topeMaximo)}
              ): el cálculo {resultado.ajustadoPor === "minimo" ? "quedaba por debajo" : "superaba"}{" "}
              ese límite configurado.
            </p>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-navy/10 pt-3">
            <span className="text-sm font-semibold text-navy">Precio final</span>
            <span className="text-2xl font-bold text-navy">{formatPrecio(resultado.precioFinal)}</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-navy/60">Corrige los campos marcados para ver el precio.</p>
      )}
    </Card>
  );
}
