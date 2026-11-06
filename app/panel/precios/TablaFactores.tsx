"use client";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchOffIcon } from "@/components/ui/icons";
import { mensajePrecios } from "@/lib/api/precios";
import type { PriceFactorConfig, PriceFactorType, SavePriceFactorRequest } from "@/lib/types/contratos-panel";
const TITULOS: Record<PriceFactorType, string> = { ocupacion: "Factores de ocupación", anticipacion: "Factores de anticipación", temporada: "Temporadas por fecha" };
export function TablaFactores({ tipo, factores, onGuardar }: {
  tipo: PriceFactorType;
  factores: PriceFactorConfig[];
  onGuardar: (id: string | null, cuerpo: SavePriceFactorRequest) => Promise<void>;
}) {
  const [abierto, setAbierto] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [etiqueta, setEtiqueta] = useState("");
  const [multiplicador, setMultiplicador] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [activo, setActivo] = useState(true);
  const [ficticio, setFicticio] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  function abrir(f?: PriceFactorConfig) {
    setId(f?.id ?? null);
    setEtiqueta(f?.label ?? "");
    setMultiplicador(f?.multiplier.toString() ?? "");
    setDesde(tipo === "temporada" ? f?.dateFrom ?? "" : f?.rangeFrom?.toString() ?? "");
    setHasta(tipo === "temporada" ? f?.dateTo ?? "" : f?.rangeTo?.toString() ?? "");
    setActivo(f?.active ?? true);
    setFicticio(f?.fictitious ?? false);
    setError("");
    setAbierto(true);
  }
  async function guardar() {
    if (guardando)
      return;
    const factor = Number(multiplicador);
    if (!etiqueta.trim() || !multiplicador.trim() || !Number.isFinite(factor) || factor <= 0) {
      setError("Completa el nombre y un multiplicador mayor que cero.");
      return;
    }
    if (tipo === "temporada" ? (!desde || !hasta || hasta < desde) :
      (!desde.trim() || !Number.isFinite(Number(desde)) || Number(desde) < 0 || (hasta.trim() !== "" && (!Number.isFinite(Number(hasta)) || Number(hasta) <= Number(desde))))) {
      setError(tipo === "temporada" ? "Completa ambas fechas. El fin no puede ser anterior al inicio." : "El inicio debe ser cero o mayor; el límite excluido debe ser mayor que el inicio, o vacío para indicar sin límite.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const cuerpo: SavePriceFactorRequest = {
        type: tipo, label: etiqueta.trim(), multiplier: factor, active: activo, fictitious: ficticio,
        rangeFrom: tipo === "temporada" ? null : Number(desde),
        rangeTo: tipo === "temporada" || !hasta.trim() ? null : Number(hasta),
        dateFrom: tipo === "temporada" ? desde : null, dateTo: tipo === "temporada" ? hasta : null,
      };
      await onGuardar(id, cuerpo);
      setAbierto(false);
    }
    catch (e) {
      setError(mensajePrecios(e).descripcion);
    }
    finally {
      setGuardando(false);
    }
  }
  return <Card className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h2 className="text-base font-semibold text-navy">{TITULOS[tipo]}</h2>
      <Button variant="secundario" onClick={() => abrir()}>Agregar factor</Button>
    </div>
    <p className="text-sm text-text-secondary">{tipo === "temporada" ? "Se aplica según la fecha de salida. Ambas fechas están incluidas." : `Rangos [desde, hasta): el inicio se incluye y el final se excluye. Unidad: ${tipo === "ocupacion" ? "porcentaje de ocupación" : "días de anticipación"}. Vacío en hasta significa sin límite superior.`}</p>
    {!factores.length ? <EmptyState icon={<SearchOffIcon className="size-8" />} title="Sin factores configurados" description="Es un estado válido. Este componente del precio usa ×1; si no hay ningún factor, el motor parte de la tarifa base y respeta los topes." actionLabel="Configurar primer factor" onAction={() => abrir()} /> :
      <div className="space-y-3">{factores.map(f => <div key={f.id} className="flex flex-wrap items-center justify-between gap-4 border-t border-border-default py-4">
        <div>
          <p className="font-medium">{f.label} · ×{f.multiplier}</p>
          <p>{tipo === "temporada" ? `${f.dateFrom} al ${f.dateTo} (ambos incluidos)` : `[${f.rangeFrom}, ${f.rangeTo ?? "sin límite"})`}</p>
          <p className="text-sm">{f.active ? "Activo" : "Inactivo"}</p>{f.fictitious && <span className="rounded-sm bg-warning-fill px-3 py-1 text-warning-text">Factor ficticio</span>}</div>
        <Button variant="secundario" onClick={() => abrir(f)}>Editar</Button>
      </div>)}</div>}
    <Modal open={abierto} title={`${id ? "Editar" : "Agregar"} factor`} onClose={() => {
      if (!guardando)
        setAbierto(false);
    }} footer={<>
      <Button variant="terciario" disabled={guardando} onClick={() => setAbierto(false)}>Cancelar</Button>
      <Button isLoading={guardando} onClick={guardar}>Guardar factor</Button>
    </>}>
      <div className="space-y-4">
        <Input label="Nombre" value={etiqueta} onChange={e => setEtiqueta(e.target.value)} />
        <Input label="Multiplicador" inputMode="decimal" value={multiplicador} onChange={e => setMultiplicador(e.target.value)} helperText="1.10 multiplica la tarifa por 1.10 (+10%)." />
        <Input label={tipo === "temporada" ? "Fecha de inicio (incluida)" : "Desde (incluido)"} type={tipo === "temporada" ? "date" : "number"} value={desde} onChange={e => setDesde(e.target.value)} />
        <Input label={tipo === "temporada" ? "Fecha de fin (incluida)" : "Hasta (excluido)"} type={tipo === "temporada" ? "date" : "number"} value={hasta} onChange={e => setHasta(e.target.value)} helperText={tipo === "temporada" ? "Fecha de salida del viaje, no fecha de compra." : "No restes ni sumes uno al límite. Vacío: sin límite superior."} />
        <Checkbox label="Activo" checked={activo} onChange={e => setActivo(e.target.checked)} disabled={guardando} />
        <Checkbox label="Factor ficticio (de prueba)" checked={ficticio} onChange={e => setFicticio(e.target.checked)} disabled={guardando} />
        {error && <p role="alert" className="text-error-text">{error}</p>}
      </div>
    </Modal>
  </Card>;
}
