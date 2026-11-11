"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonShape } from "@/components/ui/Skeleton";
import { ExclamationIcon } from "@/components/ui/icons";
import { obtenerReglaEmbarque, guardarReglaEmbarque } from "@/lib/api/operacion";
import { mensajeCompra } from "@/lib/api/compra";
import type { BoardingRulesRequest, BoardingRulesResponse } from "@/lib/types/contratos-panel";
import { validarReglaEmbarque, type BorradorReglaEmbarque } from "@/lib/embarque/regla";
import { fechaHoraEmbarque } from "@/lib/embarque/mensajes";
import { RUTAS } from "@/lib/routes";
import { RechazosViaje } from "./RechazosViaje";

export function EmbarqueView({ viajeId }: { viajeId?: string }) {
  const router = useRouter();
  const [respuesta, setRespuesta] = useState<BoardingRulesResponse | null>(null);
  const [form, setForm] = useState<BorradorReglaEmbarque>({ opensBeforeMinutes: "", closesAfterMinutes: "", source: "" });
  const [errores, setErrores] = useState<Partial<Record<keyof BoardingRulesRequest, string>>>({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  const [intento, setIntento] = useState(0);
  const bloqueo = useRef(false);

  function aplicar(res: BoardingRulesResponse) {
    setRespuesta(res);
    setForm({
      opensBeforeMinutes: res.rule ? String(res.rule.opensBeforeMinutes) : "",
      closesAfterMinutes: res.rule ? String(res.rule.closesAfterMinutes) : "",
      source: res.rule?.source ?? "",
    });
  }

  useEffect(() => {
    const controlador = new AbortController();
    obtenerReglaEmbarque({ signal: controlador.signal }).then(
      (res) => { if (!controlador.signal.aborted) aplicar(res); },
      (e: unknown) => { if (!controlador.signal.aborted) setError(mensajeCompra(e).descripcion); },
    ).finally(() => { if (!controlador.signal.aborted) setCargando(false); });
    return () => controlador.abort();
  }, [intento]);

  async function guardar(event: FormEvent) {
    event.preventDefault();
    if (bloqueo.current || !respuesta) return;
    const nuevos = validarReglaEmbarque(form);
    setErrores(nuevos); setError(null); setAviso("");
    if (Object.keys(nuevos).length) return;
    const regla: BoardingRulesRequest = {
      opensBeforeMinutes: Number(form.opensBeforeMinutes),
      closesAfterMinutes: Number(form.closesAfterMinutes),
      source: form.source.trim(),
    };
    bloqueo.current = true; setGuardando(true);
    try {
      const res = await guardarReglaEmbarque(regla);
      aplicar(res);
      setAviso("Regla guardada. Los dispositivos deben descargar otro paquete para usar esta versión.");
    } catch (e) { setError(mensajeCompra(e).descripcion); }
    finally { bloqueo.current = false; setGuardando(false); }
  }

  return <div className="flex flex-col gap-6">
    <div><h1 className="text-2xl font-semibold text-navy">Regla e incidencias de embarque</h1>
      <p className="mt-2 text-sm text-text-secondary">Solo supervisor. La regla se aplica a los paquetes que se descarguen después de guardarla.</p></div>
    {cargando ? <div role="status" aria-label="Cargando regla de embarque"><SkeletonShape variant="card" className="h-64" /></div> : !respuesta ?
      <EmptyState icon={<ExclamationIcon />} title="No se pudo consultar la regla" description={error ?? "Vuelve a intentarlo con conexión."} actionLabel="Reintentar" onAction={() => { setCargando(true); setError(null); setIntento(i => i + 1); }} /> :
      <Card>
        <h2 className="text-lg font-semibold text-navy">Ventana de embarque</h2>
        {!respuesta.rule && <p role="alert" className="mt-3 rounded-md bg-warning-fill p-4 text-sm text-warning-text">Ventana de embarque sin configurar. No se aceptan embarques hasta guardar una regla y descargar paquetes nuevos.</p>}
        {respuesta.rule && <div className="mt-3 space-y-2 break-words text-sm text-text-secondary">
          <p>Versión vigente: {respuesta.rule.version}</p>
          <p>Guardada por {respuesta.rule.updatedBy} el {fechaHoraEmbarque(respuesta.rule.updatedAt)} (Perú).</p>
        </div>}
        <form onSubmit={guardar} noValidate className="mt-4 flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Abre antes de la salida (minutos)" type="number" inputMode="numeric" min={0} step={1} value={form.opensBeforeMinutes} readOnly={guardando} onChange={e => setForm({ ...form, opensBeforeMinutes: e.target.value })} errorText={errores.opensBeforeMinutes} helperText="Entero no negativo. Cero: abre a la hora de salida." />
            <Input label="Cierra después de la salida (minutos)" type="number" inputMode="numeric" min={0} step={1} value={form.closesAfterMinutes} readOnly={guardando} onChange={e => setForm({ ...form, closesAfterMinutes: e.target.value })} errorText={errores.closesAfterMinutes} helperText="Entero no negativo. Cero: cierra a la hora de salida." />
          </div>
          <Input label="Fuente de la regla" value={form.source} readOnly={guardando} onChange={e => setForm({ ...form, source: e.target.value })} errorText={errores.source} helperText="Documento o decisión operativa verificada. Obligatorio." />
          <p className="text-sm text-text-secondary">La apertura y el cierre son inclusivos. Guardar crea una versión nueva y no modifica los paquetes ya emitidos.</p>
          {error && <p role="alert" className="text-sm text-error-text">{error}</p>}
          {aviso && <p role="status" className="text-sm text-success-text">{aviso}</p>}
          <Button type="submit" isLoading={guardando} className="self-start">Guardar regla de embarque</Button>
        </form>
      </Card>}
    {viajeId ? <RechazosViaje key={viajeId} viajeId={viajeId} /> : <EmptyState icon={<ExclamationIcon />} title="Elige un viaje para revisar sus incidencias" description="Abre el detalle de un viaje y selecciona «Ver incidencias de embarque»." actionLabel="Ir a viajes del día" onAction={() => router.push(RUTAS.panelViajes)} />}
  </div>;
}
