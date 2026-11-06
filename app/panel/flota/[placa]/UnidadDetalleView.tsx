"use client";
import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { UrgenciaPill } from "@/components/ui/UrgenciaPill";
import { EstadoFlota, useDatosFlota } from "@/components/panel/EstadoFlota";
import { listarUnidades, listarAlertas, guardarUnidad, guardarDocumento, historialDocumento, coberturaDocumentos } from "@/lib/api/flota";
import { mensajeFlota } from "@/lib/api/flota";
import { DOCUMENTOS, nivelDocumento } from "@/lib/flota";
import type { UnitView, UnitDocumentType, SaveUnitRequest, SaveUnitDocumentRequest, UnitDocumentHistoryResponse, UnitDocumentCoverageResponse } from "@/lib/types/contratos-panel";
const cargar = async () => {
  const [unidades, activas, atendidas] = await Promise.all([listarUnidades(), listarAlertas("activa"), listarAlertas("atendida")]);
  return { unidades: unidades.units, alertas: [...activas.alerts, ...atendidas.alerts] };
};
function Documentos({ unidad, recargar }: {
  unidad: UnitView;
  recargar: () => Promise<void>;
}) {
  const [tipo, setTipo] = useState<UnitDocumentType | null>(null);
  const [numero, setNumero] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [motivo, setMotivo] = useState<SaveUnitDocumentRequest["reason"]>("renovacion");
  const [historial, setHistorial] = useState<UnitDocumentHistoryResponse | null>(null);
  const [fecha, setFecha] = useState("");
  const [cobertura, setCobertura] = useState<UnitDocumentCoverageResponse | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  async function ejecutar(accion: () => Promise<void>) {
    if (ocupado)
      return;
    setOcupado(true);
    setError("");
    setAviso("");
    try {
      await accion();
    }
    catch (e) {
      setError(mensajeFlota(e).descripcion);
    }
    finally {
      setOcupado(false);
    }
  }
  async function guardar() {
    if (!tipo || !numero.trim() || !desde || !hasta || hasta < desde) {
      setError("Completa el número y un periodo de vigencia válido.");
      return;
    }
    await ejecutar(async () => {
      const cuerpo: SaveUnitDocumentRequest = { number: numero.trim(), validFrom: desde, expiresOn: hasta, ...(unidad.documents.some(d => d.type === tipo) ? { reason: motivo } : {}) };
      const resultado = await guardarDocumento(unidad.unitId, tipo, cuerpo);
      setTipo(null);
      setHistorial(null);
      setCobertura(null);
      setAviso(resultado.result === "unchanged" ? "Los datos no cambiaron: no se creó una versión." : `Versión ${resultado.version} registrada.`);
      await recargar();
    });
  }
  return <section className="space-y-4">
    <h2 className="text-lg font-semibold">Documentos versionados</h2>
    <p>Renovar registra un documento nuevo. Corregir reemplaza datos mal digitados: la versión reemplazada por corrección no cuenta como cobertura, aunque se hubiera creído vigente ese día.</p>
    {(Object.keys(DOCUMENTOS) as UnitDocumentType[]).map(t => {
      const d = unidad.documents.find(d => d.type === t);
      const nivel = d ? nivelDocumento(d.expiresOn) : null;
      return <Card key={t} className="space-y-3">
        <h3 className="font-semibold">{DOCUMENTOS[t]}</h3>{d ? <>
          <p>{d.number} · versión {d.version} · {d.reason}</p>
          <p>Vigencia: {d.validFrom} al {d.expiresOn}</p>{nivel && <UrgenciaPill urgencia={nivel} />}</> : <p>Sin documento registrado</p>}<div className="flex flex-wrap gap-3">
          <Button variant="secundario" disabled={ocupado} onClick={() => { setTipo(t); setNumero(d?.number ?? ""); setDesde(d?.validFrom ?? ""); setHasta(d?.expiresOn ?? ""); setMotivo("renovacion"); setError(""); }}>{d ? "Renovar o corregir" : "Registrar documento"}</Button>
          <Button variant="terciario" disabled={ocupado} onClick={() => { setHistorial(null); void ejecutar(async () => setHistorial(await historialDocumento(unidad.unitId, t))); }}>Ver historial</Button>
        </div>
      </Card>;
    })}
    {historial && <Card className="space-y-3">
      <h3 className="font-semibold">Historial · {DOCUMENTOS[historial.type]}</h3>{!historial.versions.length && <p>No hay versiones registradas.</p>}{historial.versions.map((v, i) => {
        const corregida = i > 0 && historial.versions[i - 1].reason === "correccion";
        return <div key={v.version} className="border-b border-border-default py-3">
          <p>Versión {v.version} · {v.reason} · {v.number}</p>
          <p>{v.validFrom} al {v.expiresOn}</p>
          <p>Registrada: {new Date(v.registeredAt).toLocaleString("es-PE", { timeZone: "America/Lima" })} · Por: {v.registeredBy ?? "Carga administrativa"}</p>
          <p>{v.replacedAt ? `Reemplazada: ${new Date(v.replacedAt).toLocaleString("es-PE", { timeZone: "America/Lima" })}` : "Versión vigente"}</p>{corregida && <p className="text-error-text">Versión corregida: excluida de cobertura.</p>}</div>;
      })}</Card>}
    <Card className="space-y-4">
      <h3 className="font-semibold">Cobertura para fiscalización</h3>
      <Input label="Fecha que se necesita verificar" type="date" value={fecha} onChange={e => { setFecha(e.target.value); setCobertura(null); }} />
      <Button variant="secundario" isLoading={ocupado} disabled={!fecha} onClick={() => { setCobertura(null); void ejecutar(async () => setCobertura(await coberturaDocumentos(unidad.unitId, fecha))); }}>Consultar cobertura</Button>
      <p>Consulta histórica del servidor. Las versiones corregidas quedan excluidas.</p>{cobertura && <div>
        <p>Cobertura al {cobertura.date}</p>{cobertura.coverage.map(c => <p key={c.type} className={c.covered ? "text-success-text" : "text-error-text"}>{DOCUMENTOS[c.type]}: {c.covered ? `Con cobertura · ${c.document?.number} · versión ${c.document?.version} · ${c.document?.validFrom} al ${c.document?.expiresOn}` : "Sin cobertura"}</p>)}</div>}</Card>
    {aviso && <p role="status">{aviso}</p>}{error && <p role="alert" className="text-error-text">{error}</p>}
    <Modal open={tipo !== null} onClose={() => {
      if (!ocupado)
        setTipo(null);
    }} title={tipo ? DOCUMENTOS[tipo] : "Documento"} footer={<>
      <Button variant="terciario" disabled={ocupado} onClick={() => setTipo(null)}>Cancelar</Button>
      <Button isLoading={ocupado} onClick={guardar}>Registrar versión</Button>
    </>}>
      <div className="space-y-4">
        <Input label="Número de documento" value={numero} maxLength={40} onChange={e => setNumero(e.target.value)} />
        <Input label="Vigente desde" type="date" value={desde} onChange={e => setDesde(e.target.value)} />
        <Input label="Vence el" type="date" value={hasta} onChange={e => setHasta(e.target.value)} />{unidad.documents.some(d => d.type === tipo) && <Select label="Motivo" options={[{ value: "renovacion", label: "Renovación: documento nuevo" }, { value: "correccion", label: "Corrección: datos mal digitados" }]} value={motivo ?? null} onChange={v => setMotivo(v as SaveUnitDocumentRequest["reason"])} />}<p>Una corrección excluye la versión anterior de la cobertura histórica.</p>{error && <p role="alert" className="text-error-text">{error}</p>}</div>
    </Modal>
  </section>;
}
function Umbral({ unidad: u, recargar }: {
  unidad: UnitView;
  recargar: () => Promise<void>;
}) {
  const [valor, setValor] = useState(u.mileageThresholdKm?.toString() ?? "");
  const [marca, setMarca] = useState(u.make ?? "");
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState("");
  async function guardar() {
    if (valor !== "" && (!Number.isSafeInteger(Number(valor)) || Number(valor) <= 0)) {
      setAviso("Ingresa kilómetros enteros mayores que cero o deja vacío.");
      return;
    }
    if (!marca.trim()) {
      setAviso("La unidad no tiene marca registrada. Se necesita completar ese dato en el maestro antes de guardar el umbral.");
      return;
    }
    setOcupado(true);
    setAviso("");
    try {
      const cuerpo: SaveUnitRequest = { plate: u.plate, make: marca.trim(), model: u.model, capacity: u.capacity, serviceType: u.serviceType, authorizationNumber: u.authorizationNumber, mileageThresholdKm: valor === "" ? null : Number(valor) };
      await guardarUnidad(u.unitId, cuerpo);
      setAviso("Umbral guardado en el servidor.");
      await recargar();
    }
    catch (e) {
      setAviso(mensajeFlota(e).descripcion);
    }
    finally {
      setOcupado(false);
    }
  }
  return <Card className="space-y-4">
    <h2 className="font-semibold">Umbral de kilometraje</h2>
    <p>{u.mileageKm.toLocaleString("es-PE")} km acumulados</p>{!u.make && <Input label="Marca de la unidad" value={marca} maxLength={60} onChange={e => setMarca(e.target.value)} helperText="Completa el dato faltante para guardar la unidad." />}<Input label="Alertar desde (km)" type="number" value={valor} onChange={e => setValor(e.target.value)} helperText="Vacío: sin alerta por kilometraje. Persiste al recargar." />
    <Button variant="secundario" isLoading={ocupado} onClick={guardar}>Guardar umbral</Button>{aviso && <p role="status">{aviso}</p>}</Card>;
}
export function UnidadDetalleView({ placa }: {
  placa: string;
}) {
  const estado = useDatosFlota(cargar);
  const unidad = estado.datos?.unidades.find(u => u.plate.toUpperCase() === placa.toUpperCase());
  return <div className="space-y-6">
    <Link className="inline-flex min-h-11 items-center text-secondary" href="/panel/flota">Volver a flota</Link>
    <h1 className="text-xl font-semibold text-navy">Unidad {placa}</h1>{estado.cargando || estado.error || !unidad ? <EstadoFlota {...estado} /> : <>
      <p>{unidad.make} · {unidad.model} · {unidad.capacity} asientos</p>
      <Umbral unidad={unidad} recargar={estado.recargar} />
      <Documentos unidad={unidad} recargar={estado.recargar} />
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Histórico de alertas</h2>{!estado.datos?.alertas.some(a => a.unitId === unidad.unitId) && <p>Sin alertas emitidas para esta unidad.</p>}{estado.datos?.alertas.filter(a => a.unitId === unidad.unitId).map(a => <Card key={a.alertId}>
          <UrgenciaPill urgencia={a.level} />
          <p>{a.description}</p>
          <p>Observado: {a.observedValue} · Emitida: {new Date(a.issuedAt).toLocaleString("es-PE", { timeZone: "America/Lima" })} · {a.status}</p>{a.attention && <p>{a.attention.responsible}: {a.attention.note}</p>}</Card>)}</section>
    </>}</div>;
}
