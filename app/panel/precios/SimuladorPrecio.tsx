"use client";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchOffIcon } from "@/components/ui/icons";
import { formatPrecio } from "@/lib/format";
import { viajesParaCotizar, cotizarViaje, mensajePrecios } from "@/lib/api/precios";
import type { FareListResponse } from "@/lib/types/contratos-panel";
import type { PriceQuoteResponse, TripListResponse } from "@/lib/types/contratos-frontend";
export function SimuladorPrecio({ rutas }: {
  rutas: FareListResponse["fares"];
}) {
  const [ruta, setRuta] = useState<string | null>(rutas[0]?.route ?? null);
  const [fecha, setFecha] = useState("");
  const [viajes, setViajes] = useState<TripListResponse["trips"] | null>(null);
  const [viaje, setViaje] = useState<string | null>(null);
  const [resultado, setResultado] = useState<PriceQuoteResponse | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  async function buscar() {
    if (!ruta || !fecha || ocupado)
      return;
    setOcupado(true);
    setError("");
    setResultado(null);
    setViajes(null);
    setViaje(null);
    try {
      setViajes((await viajesParaCotizar(ruta, fecha)).trips);
    }
    catch (e) {
      setError(mensajePrecios(e).descripcion);
    }
    finally {
      setOcupado(false);
    }
  }
  async function consultar() {
    if (!viaje || ocupado)
      return;
    setOcupado(true);
    setError("");
    setResultado(null);
    try {
      setResultado(await cotizarViaje(viaje));
    }
    catch (e) {
      setError(mensajePrecios(e).descripcion);
    }
    finally {
      setOcupado(false);
    }
  }
  function limpiar() { setViajes(null); setViaje(null); setResultado(null); setError(""); }
  return <Card className="space-y-4">
    <h2 className="text-base font-semibold text-navy">Simulador · cotización real de un viaje</h2>
    <p className="text-sm text-text-secondary">Consulta el motor del servidor con la ocupación, anticipación y fecha de salida reales. No crea una reserva ni cobra. Vuelve a consultar después de cambiar la configuración.</p>
    <div className="grid gap-4 sm:grid-cols-2">
      <Select label="Ruta" disabled={ocupado} options={rutas.map(r => ({ value: r.route, label: r.route }))} value={ruta} onChange={v => { setRuta(v); limpiar(); }} />
      <Input label="Fecha de salida" type="date" value={fecha} readOnly={ocupado} onChange={e => { setFecha(e.target.value); limpiar(); }} />
    </div>
    <Button variant="secundario" disabled={!ruta || !fecha} isLoading={ocupado} onClick={buscar}>Buscar viajes</Button>
    {viajes && (viajes.length ? <div className="space-y-4">
      <Select label="Viaje" disabled={ocupado} options={viajes.map(v => ({ value: v.id, label: `${new Date(v.departsAt).toLocaleString("es-PE", { timeZone: "America/Lima" })} · ${v.serviceType}` }))} value={viaje} onChange={v => { setViaje(v); setResultado(null); setError(""); }} />
      <Button variant="secundario" disabled={!viaje} isLoading={ocupado} onClick={consultar}>Consultar precio vigente</Button>
    </div> : <EmptyState icon={<SearchOffIcon className="size-8" />} title="Sin viajes para esa fecha" description="Elige otra fecha o ruta para consultar el motor con un viaje programado." actionLabel="Cambiar consulta" onAction={limpiar} />)}
    {error && <p role="alert" className="text-error-text">{error}</p>}
    {resultado && <div className="space-y-4 rounded-md bg-info-fill p-4 text-info-text">
      {resultado.fictitious && <p className="rounded-md bg-warning-fill p-3 font-medium text-warning-text">Cotización ficticia: contiene tarifa o factores de prueba.</p>}
      <dl className="space-y-3">
        <div className="flex justify-between gap-3">
          <dt>Tarifa base</dt>
          <dd>{formatPrecio(Number(resultado.baseFare))}</dd>
        </div>
        {([["Ocupación", resultado.occupancy], ["Anticipación", resultado.advance], ["Temporada", resultado.season]] as const).map(([nombre, f]) => <div key={nombre} className="flex flex-wrap justify-between gap-3">
          <dt>{nombre}: {f.configured ? f.label : "sin factor configurado"}</dt>
          <dd>×{f.factor}</dd>
        </div>)}
        <div>Ocupación: {resultado.occupancy.occupancyPct}% · Anticipación: {resultado.advance.days} días</div>
        <div className="flex justify-between gap-3">
          <dt>Subtotal</dt>
          <dd>{formatPrecio(Number(resultado.subtotal))}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Topes mínimo / máximo</dt>
          <dd>{formatPrecio(Number(resultado.minFare))} / {formatPrecio(Number(resultado.maxFare))}</dd>
        </div>
      </dl>
      {resultado.adjustedTo !== "none" && <p>Ajustado al tope {resultado.adjustedTo === "min" ? "mínimo" : "máximo"}.</p>}
      <p className="text-lg font-semibold">Precio vigente por asiento: {formatPrecio(Number(resultado.unitPrice))}</p>
    </div>}
  </Card>;
}
