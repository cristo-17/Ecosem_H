"use client";
import { useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { UrgenciaPill } from "@/components/ui/UrgenciaPill";
import { EstadoFlota, useDatosFlota } from "@/components/panel/EstadoFlota";
import { listarAlertas, atenderAlerta } from "@/lib/api/flota";
import { mensajeFlota } from "@/lib/api/flota";
import type { AlertView, AttendAlertRequest } from "@/lib/types/contratos-panel";
const cargar = async () => {
  const [activas, atendidas] = await Promise.all([listarAlertas("activa"), listarAlertas("atendida")]);
  return [...activas.alerts, ...atendidas.alerts];
};
export function AlertasView() {
  const focoLista = useRef<HTMLHeadingElement>(null);
  const [anuncio, setAnuncio] = useState("");
  const estado = useDatosFlota(cargar);
  const [atendiendo, setAtendiendo] = useState<AlertView | null>(null);
  const [responsable, setResponsable] = useState("");
  const [nota, setNota] = useState("");
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  async function confirmar() {
    if (!atendiendo || ocupado)
      return;
    if (!responsable.trim() || !nota.trim()) {
      setError("Ingresa responsable y nota.");
      return;
    }
    setOcupado(true);
    setError("");
    try {
      const cuerpo: AttendAlertRequest = { responsible: responsable.trim(), note: nota.trim() };
      await atenderAlerta(atendiendo.alertId, cuerpo);
      await estado.recargar();
      setAnuncio("Atención registrada. Lista de alertas actualizada.");
      setAtendiendo(null);
    }
    catch (e) {
      setError(mensajeFlota(e).descripcion);
    }
    finally {
      setOcupado(false);
    }
  }
  return <div className="space-y-6">
    <h1 ref={focoLista} tabIndex={-1} className="text-xl font-semibold text-navy focus-visible:outline-2 focus-visible:outline-secondary">Alertas</h1>
    <p role="status" className="sr-only">{anuncio}</p>
    <p>El proceso diario emite alertas fijas: tipo, nivel, valor observado y fecha de emisión no cambian. No se pueden editar ni borrar, tampoco por un administrador.</p>
    <p className="rounded-md bg-info-fill p-4 text-info-text">La atención se registra una sola vez con responsable y nota. No resuelve el problema ni silencia avisos: el siguiente umbral emite otra alerta.</p>
    {estado.cargando || estado.error || !estado.datos?.length ? <EstadoFlota {...estado} /> : (["activa", "atendida"] as const).map(status => <section key={status} className="space-y-4">
      <h2 className="text-lg font-semibold">{status === "activa" ? "Activas" : "Atendidas"}</h2>{!estado.datos?.some(a => a.status === status) && <p>No hay alertas {status === "activa" ? "activas" : "atendidas"}.</p>}{estado.datos?.filter(a => a.status === status).map(a => <Card key={a.alertId} className="space-y-3">
        <UrgenciaPill urgencia={a.level} />
        <h3 className="font-semibold">{a.description}</h3>
        <p>Tipo: {a.type} · Concepto: {a.subject}</p>
        <p>Observado al emitir: {a.observedValue} · Emisión: {new Date(a.issuedAt).toLocaleString("es-PE", { timeZone: "America/Lima" })}</p>
        <p>{a.unitId ? `Unidad: ${a.unitId}` : `Conductor: ${a.driverId}`}</p>{a.attention ? <p>Atendida el {new Date(a.attention.at).toLocaleString("es-PE", { timeZone: "America/Lima" })} · Responsable: {a.attention.responsible} · Registrada por: {a.attention.by}<br />Nota: {a.attention.note}</p> : a.status === "activa" && <Button variant="secundario" onClick={() => { setAtendiendo(a); setResponsable(""); setNota(""); setError(""); }}>Marcar como atendida</Button>}</Card>)}</section>)}
    <Modal open={!!atendiendo} returnFocusRef={focoLista} onClose={() => {
      if (!ocupado)
        setAtendiendo(null);
    }} title="Registrar atención única" footer={<>
      <Button variant="terciario" disabled={ocupado} onClick={() => setAtendiendo(null)}>Cancelar</Button>
      <Button isLoading={ocupado} onClick={confirmar}>Guardar atención</Button>
    </>}>
      <div className="space-y-4">
        <p>Esta atención queda fija y no silencia alertas futuras.</p>
        <Input label="Responsable" value={responsable} onChange={e => setResponsable(e.target.value)} maxLength={120} />
        <Textarea label="Nota de atención" value={nota} onChange={e => setNota(e.target.value)} maxLength={500} />{error && <p role="alert" className="text-error-text">{error}</p>}</div>
    </Modal>
  </div>;
}
