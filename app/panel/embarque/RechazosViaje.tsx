"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { escaneosRechazados } from "@/lib/api/operacion";
import { mensajeCompra } from "@/lib/api/compra";
import type { BoardingRejectedScansResponse } from "@/lib/types/contratos-panel";
import { MOTIVO_SERVIDOR, fechaHoraEmbarque } from "@/lib/embarque/mensajes";
import { rutaPanelViaje } from "@/lib/routes";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonShape } from "@/components/ui/Skeleton";
import { ExclamationIcon } from "@/components/ui/icons";

export function RechazosViaje({ viajeId }: { viajeId: string }) {
  const router = useRouter();
  const [datos, setDatos] = useState<BoardingRejectedScansResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [cargandoMas, setCargandoMas] = useState(false);
  const controladorRef = useRef<AbortController | null>(null);
  const bloqueo = useRef(false);

  useEffect(() => {
    const controlador = new AbortController();
    controladorRef.current = controlador;
    escaneosRechazados(viajeId, 0, { signal: controlador.signal }).then(
      (res) => { if (!controlador.signal.aborted) setDatos(res); },
      (e: unknown) => { if (!controlador.signal.aborted) setError(mensajeCompra(e).descripcion); },
    );
    return () => controlador.abort();
  }, [viajeId, intento]);

  async function cargarMas() {
    if (!datos || datos.nextOffset === null || bloqueo.current) return;
    bloqueo.current = true; setCargandoMas(true); setError(null);
    const signal = controladorRef.current!.signal;
    try {
      const res = await escaneosRechazados(viajeId, datos.nextOffset, { signal });
      if (!signal.aborted) setDatos(prev => prev ? { ...res, scans: [...prev.scans, ...res.scans.filter(s => !prev.scans.some(p => p.scanId === s.scanId))] } : res);
    } catch (e) { if (!signal.aborted) setError(mensajeCompra(e).descripcion); }
    finally { bloqueo.current = false; if (!signal.aborted) setCargandoMas(false); }
  }

  return <section aria-labelledby="incidencias-viaje" className="flex flex-col gap-4">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h2 id="incidencias-viaje" className="text-lg font-semibold text-navy">Escaneos rechazados del viaje</h2>
      <Button variant="secundario" onClick={() => router.push(rutaPanelViaje(viajeId))}>Volver al viaje</Button>
      <Button variant="terciario" disabled={cargandoMas} onClick={() => { setDatos(null); setError(null); setIntento(i => i + 1); }}>Actualizar incidencias</Button>
    </div>
    <p className="text-sm text-text-secondary">Horas de Perú. Consulta para revisión: los rechazos conservan su resultado original y no cuentan como embarcados.</p>
    {error && <p role="alert" className="text-sm text-error-text">{error}</p>}
    {!datos && !error && <div role="status" aria-label="Cargando incidencias"><SkeletonShape variant="card" className="h-48" /></div>}
    {!datos && error && <Button variant="secundario" className="self-start" onClick={() => { setError(null); setIntento(i => i + 1); }}>Reintentar incidencias</Button>}
    {datos?.scans.length === 0 && <EmptyState icon={<ExclamationIcon />} title="Este viaje no tiene escaneos rechazados" description="Las incidencias aparecerán aquí después de sincronizar los dispositivos." actionLabel="Volver al viaje" onAction={() => router.push(rutaPanelViaje(viajeId))} />}
    {datos && datos.scans.length > 0 && <ul className="flex flex-col gap-4">
      {datos.scans.map(s => <li key={s.scanId}><Card className="space-y-3 break-words text-sm">
        <p className="font-semibold text-error-text">{MOTIVO_SERVIDOR[s.reason]}</p>
        <p>{s.purchaseCode ?? "Sin compra identificada"} · Asiento {s.seat ?? "sin registro"}</p>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div><dt className="text-text-secondary">Hora original del escaneo</dt><dd>{fechaHoraEmbarque(s.scannedAt)}</dd></div>
          <div><dt className="text-text-secondary">Recibido por el servidor</dt><dd>{fechaHoraEmbarque(s.receivedAt)}</dd></div>
          <div><dt className="text-text-secondary">Operador</dt><dd>{s.operatorId}</dd></div>
          <div><dt className="text-text-secondary">Identificador del escaneo</dt><dd>{s.scanId}</dd></div>
          <div><dt className="text-text-secondary">Paquete usado</dt><dd>{s.packageId ?? "Sin referencia"}</dd></div>
          <div><dt className="text-text-secondary">Versión de regla aplicada</dt><dd>{s.boardingRuleVersion ?? "Sin registro"}</dd></div>
          <div><dt className="text-text-secondary">Apertura aplicada</dt><dd>{fechaHoraEmbarque(s.boardingOpensAt)}</dd></div>
          <div><dt className="text-text-secondary">Cierre aplicado</dt><dd>{fechaHoraEmbarque(s.boardingClosesAt)}</dd></div>
        </dl>
      </Card></li>)}
    </ul>}
    {datos?.nextOffset != null && <Button variant="secundario" className="self-start" isLoading={cargandoMas} onClick={cargarMas}>Cargar más incidencias</Button>}
  </section>;
}
