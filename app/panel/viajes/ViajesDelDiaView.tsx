"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { BusIcon, SearchOffIcon } from "@/components/ui/icons";
import { OPCIONES_CIUDAD, labelTipoAsiento, type Ciudad } from "@/lib/mock/viajes";
import { FECHA_VIAJES_DEL_DIA, buscarViajesDelDia } from "@/lib/mock/manifiesto";
import { formatFechaCorta, formatHora12 } from "@/lib/format";
import { rutaPanelViaje } from "@/lib/routes";

export function ViajesDelDiaView() {
  const router = useRouter();
  const [fecha, setFecha] = useState<Date | null>(FECHA_VIAJES_DEL_DIA);
  const [origen, setOrigen] = useState<string | null>(null);
  const [destino, setDestino] = useState<string | null>(null);
  const [agencia, setAgencia] = useState<string | null>(null);

  const opcionesDestino = OPCIONES_CIUDAD.filter((opcion) => opcion.value !== origen);

  const viajes = useMemo(
    () =>
      buscarViajesDelDia({
        fecha,
        origen: (origen as Ciudad | null) ?? null,
        destino: (destino as Ciudad | null) ?? null,
        agencia: (agencia as Ciudad | null) ?? null,
      }),
    [fecha, origen, destino, agencia],
  );

  function limpiarFiltros() {
    setFecha(FECHA_VIAJES_DEL_DIA);
    setOrigen(null);
    setDestino(null);
    setAgencia(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-navy sm:text-2xl">Viajes del día</h1>
        <p className="mt-1 text-sm text-navy/70">
          Filtra por fecha, ruta y agencia, y entra al detalle para generar el manifiesto.
        </p>
      </div>

      <Card className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DatePicker label="Fecha" value={fecha} onChange={setFecha} />
        <Select
          label="Origen"
          options={OPCIONES_CIUDAD}
          value={origen}
          onChange={(valor) => {
            setOrigen(valor);
            if (destino === valor) setDestino(null);
          }}
          placeholder="Todas"
        />
        <Select
          label="Destino"
          options={opcionesDestino}
          value={destino}
          onChange={setDestino}
          placeholder="Todas"
        />
        <Select
          label="Agencia"
          options={OPCIONES_CIUDAD}
          value={agencia}
          onChange={setAgencia}
          placeholder="Todas"
        />
      </Card>

      {viajes.length === 0 ? (
        <EmptyState
          icon={<SearchOffIcon />}
          title="No hay viajes con estos filtros"
          description="Prueba con otra fecha, ruta o agencia."
          actionLabel="Quitar filtros"
          onAction={limpiarFiltros}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {viajes.map((viaje) => (
            <Card
              key={viaje.id}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-navy/5 text-navy/60">
                  <BusIcon />
                </span>
                <div>
                  <p className="text-sm font-semibold text-navy">
                    {viaje.origen} → {viaje.destino}
                  </p>
                  <p className="text-xs text-navy/60">
                    {formatHora12(viaje.fechaSalida)} · {formatFechaCorta(viaje.fechaSalida)} · Bus{" "}
                    {viaje.placaBus} · {labelTipoAsiento(viaje.tipoAsiento)}
                  </p>
                  <p className="mt-1 text-xs text-navy/60">
                    {viaje.pasajeros.length}/{viaje.capacidad} vendidos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                <Badge status={viaje.estado} />
                <Button
                  variant="secundario"
                  className="h-10 min-h-0 px-4 text-sm"
                  onClick={() => router.push(rutaPanelViaje(viaje.id))}
                >
                  Ver detalle
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
