"use client";
import { useRef, useState } from "react";
import { imprimirVenta, historialImpresiones, mensajePersonal } from "@/lib/api/personal";
import type { TicketPrintResponse, TicketPrintLogResponse } from "@/lib/types/contratos-panel";
import { descargarBoletosCompraPdf } from "@/lib/pdf/boleto";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ApiError } from "@/lib/api/cliente";
import { etiquetaImpresion, fechaImpresion } from "@/lib/impresiones";

export default function ImpresionesView({ supervisor }: { supervisor: boolean }) {
  const [codigo, setCodigo] = useState("");
  const [boletos, setBoletos] = useState<TicketPrintResponse | null>(null);
  const [historial, setHistorial] = useState<TicketPrintLogResponse | null>(null);
  const [error, setError] = useState<ReturnType<typeof mensajePersonal> | null>(null);
  const [errorHistorial, setErrorHistorial] = useState<ReturnType<typeof mensajePersonal> | null>(null);
  const [pdfError, setPdfError] = useState(false);
  const [imprimiendo, setImprimiendo] = useState(false);
  const [consultando, setConsultando] = useState(false);
  const bloqueo = useRef(false);
  const bloqueoHistorial = useRef(false);
  async function imprimir() {
    if (bloqueo.current) return;
    if (!codigo.trim()) { setError({ titulo: "Falta el código de compra", descripcion: "Ingresa el código entregado al vender." }); return; }
    bloqueo.current = true; setImprimiendo(true); setError(null); setPdfError(false); setBoletos(null); setHistorial(null);
    try {
      const respuesta = await imprimirVenta(codigo.trim());
      setBoletos(respuesta);
      try { await descargarBoletosCompraPdf(respuesta); } catch { setPdfError(true); }
    } catch (e) {
      setError(e instanceof ApiError && (e.tipo === "red" || e.tipo === "tiempo")
        ? { titulo: "No sabemos si la impresión quedó registrada", descripcion: "Se perdió la respuesta. Pide a un supervisor revisar el historial antes de solicitar otra impresión; una nueva solicitud dejará otro registro." }
        : mensajePersonal(e));
    }
    finally { bloqueo.current = false; setImprimiendo(false); }
  }
  async function consultar() {
    if (bloqueoHistorial.current) return;
    if (!codigo.trim()) { setErrorHistorial({ titulo: "Falta el código de compra", descripcion: "Ingresa el código para consultar su historial." }); return; }
    bloqueoHistorial.current = true; setConsultando(true); setErrorHistorial(null); setHistorial(null);
    try { setHistorial(await historialImpresiones(codigo.trim())); }
    catch (e) { setErrorHistorial(mensajePersonal(e)); }
    finally { bloqueoHistorial.current = false; setConsultando(false); }
  }
  async function recuperarPdf() {
    if (!boletos || bloqueo.current) return;
    bloqueo.current = true; setImprimiendo(true);
    try { await descargarBoletosCompraPdf(boletos); setPdfError(false); }
    catch { setPdfError(true); }
    finally { bloqueo.current = false; setImprimiendo(false); }
  }
  return <div className="flex flex-col gap-6">
    <div><h1 className="text-2xl font-semibold text-navy">Impresión de boletos</h1><p className="mt-1 text-sm text-text-secondary">El vendedor puede imprimir mientras el turno de esa venta siga abierto. Un supervisor puede hacerlo también después del cierre. Cada solicitud registra quién imprime, su rol, camino y hora.</p></div>
    <Card className="flex flex-col gap-4">
      <form onSubmit={e => { e.preventDefault(); void imprimir(); }} className="flex flex-col gap-4">
        <Input label="Código de compra" value={codigo} readOnly={imprimiendo || consultando} onChange={e => { setCodigo(e.target.value); setBoletos(null); setHistorial(null); setError(null); setErrorHistorial(null); setPdfError(false); }} autoComplete="off" />
        <div className="flex flex-wrap gap-4"><Button type="submit" isLoading={imprimiendo} disabled={consultando}>Registrar impresión y descargar PDF</Button>{supervisor && <Button type="button" variant="secundario" isLoading={consultando} disabled={imprimiendo} onClick={consultar}>Ver historial</Button>}</div>
      </form>
      {error && <div role="alert" className="text-error-text"><h2>{error.titulo}</h2><p>{error.descripcion}</p></div>}
      {boletos && <div className="flex flex-col gap-3"><p role="status">{etiquetaImpresion(boletos.printNumber)} registrada para {boletos.purchaseCode}.</p>
        {boletos.tickets.map(t => <p key={t.seat} className="text-sm">Asiento {t.seat} · {t.passenger ? `${t.passenger.firstNames} ${t.passenger.lastNames} · ${"•".repeat(Math.max(4, t.passenger.documentNumber.length - 3))}${t.passenger.documentNumber.slice(-3)}` : "Sin datos de pasajero"}</p>)}
        {pdfError && <div role="alert"><p>No se pudo generar el PDF. La impresión ya quedó registrada; recupera este mismo archivo sin enviar otra solicitud.</p><Button variant="secundario" isLoading={imprimiendo} onClick={recuperarPdf}>Recuperar PDF registrado</Button></div>}
      </div>}
    </Card>
    {supervisor && <Card className="flex flex-col gap-4"><h2 className="font-semibold text-navy">Historial de impresiones</h2>
      {consultando && <p role="status">Consultando historial…</p>}
      {errorHistorial && <div role="alert" className="text-error-text"><h3>{errorHistorial.titulo}</h3><p>{errorHistorial.descripcion}</p></div>}
      {!historial && !consultando && !errorHistorial && <p className="text-sm text-text-secondary">Ingresa un código y elige Ver historial.</p>}
      {historial && <><p>Compra {historial.purchaseCode}</p>{historial.prints.length === 0 && <p>No tiene impresiones registradas. Puedes registrar la primera impresión con el botón superior.</p>}{historial.prints.map(p => <div key={p.printNumber} className="border-t border-border-default pt-4 text-sm"><p>{etiquetaImpresion(p.printNumber)} · <time dateTime={p.printedAt}>{fechaImpresion(p.printedAt)}</time></p><p>{[p.printedBy.firstName, p.printedBy.lastName].filter(Boolean).join(" ") || p.printedBy.userId} · Rol: {p.role} · Camino: {p.via}</p></div>)}</>}
    </Card>}
  </div>;
}
