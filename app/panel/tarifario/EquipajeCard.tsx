"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ScaleIcon, ExclamationIcon } from "@/components/ui/icons";
import { formatPrecio } from "@/lib/format";
import { leerMonto } from "@/lib/api/caja";
import { leerEquipaje, guardarEquipaje, mensajeTarifario } from "@/lib/api/tarifario";
import type { BaggageRatesResponse, SaveBaggageRatesRequest } from "@/lib/types/contratos-panel";
export function EquipajeCard() {
  const [datos, setDatos] = useState<BaggageRatesResponse | null>(null);
  const [errorCarga, setErrorCarga] = useState<unknown>(null);
  const [cargando, setCargando] = useState(true);
  const [intento, setIntento] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const [borrador, setBorrador] = useState<Array<{
    desde: string;
    hasta: string;
    recargo: string;
  }>>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  useEffect(() => {
    const controlador = new AbortController();
    leerEquipaje({ signal: controlador.signal }).then(respuesta => {
      if (!controlador.signal.aborted)
        setDatos(respuesta);
    }).catch(e => {
      if (!controlador.signal.aborted)
        setErrorCarga(e);
    })
      .finally(() => {
        if (!controlador.signal.aborted)
          setCargando(false);
      });
    return () => controlador.abort();
  }, [intento]);
  function recargar() { setCargando(true); setErrorCarga(null); setAviso(""); setIntento(i => i + 1); }
  function abrir() {
    if (!datos)
      return;
    setBorrador(datos.steps.map(s => ({ desde: s.fromKg, hasta: s.toKg, recargo: s.surcharge ?? "" })));
    setError("");
    setAviso("");
    setAbierto(true);
  }
  function editar(i: number, campo: "desde" | "hasta" | "recargo", valor: string) {
    setBorrador(prev => prev.map((s, j) => i === j ? { ...s, [campo]: valor } : s));
  }
  async function guardar() {
    if (guardando)
      return;
    const steps: SaveBaggageRatesRequest["steps"] = [];
    for (const s of borrador) {
      const fromKg = leerMonto(s.desde), toKg = leerMonto(s.hasta);
      const surcharge = s.recargo.trim() ? leerMonto(s.recargo) : null;
      if (fromKg === null || fromKg <= 0 || toKg === null || toKg <= fromKg || (s.recargo.trim() && (surcharge === null || surcharge <= 0))) {
        setError("Completa límites positivos con inicio menor que fin. El recargo debe ser mayor que cero, o vacío si todavía no está definido. Hasta dos decimales.");
        return;
      }
      steps.push({ fromKg, toKg, surcharge });
    }
    const ordenados = [...steps].sort((a, b) => a.fromKg - b.fromKg);
    if (ordenados.some((s, i) => i > 0 && s.fromKg < ordenados[i - 1].toKg)) {
      setError("Los escalones no pueden superponerse.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      // Incluye todos los escalones del borrador, no solo la fila modificada.
      const pedido: SaveBaggageRatesRequest = { steps };
      setDatos(await guardarEquipaje(pedido));
      setAbierto(false);
      setAviso("Conjunto completo de escalones guardado en el servidor.");
    }
    catch (e) {
      setError(mensajeTarifario(e).descripcion);
    }
    finally {
      setGuardando(false);
    }
  }
  const fallo = errorCarga ? mensajeTarifario(errorCarga) : null;
  return <Card className="space-y-4">
    <h2 className="font-semibold text-navy">Exceso de equipaje</h2>
    <p>Guardar sustituye TODOS los escalones globales. Edita el conjunto completo para conservar los demás.</p>
    {cargando ? <Skeleton variant="card" /> : fallo ? <EmptyState icon={<ExclamationIcon className="size-8" />} title={fallo.titulo} description={fallo.descripcion} actionLabel="Reintentar equipaje" onAction={recargar} /> : datos && <>
      {datos.steps.length ? <>
        <div className="space-y-3">{datos.steps.map(s => <div key={`${s.fromKg}-${s.toKg}`}>
          <p>{s.fromKg}–{s.toKg} kg: {s.surcharge === null ? "Monto todavía sin definir" : formatPrecio(Number(s.surcharge))}</p>{s.fictitious && <p className="text-warning-text">Escalón ficticio de prueba</p>}</div>)}</div>
        <Button variant="secundario" onClick={abrir}>Editar conjunto de escalones</Button>
      </> : <EmptyState icon={<ScaleIcon className="size-8" />} title="La empresa todavía no definió montos" description="El tarifario de equipaje está vacío. Es un estado válido: no se agregan escalones ni recargos de ejemplo." actionLabel="Definir escalones de equipaje" onAction={abrir} />}
      <Button variant="terciario" onClick={recargar}>Actualizar equipaje</Button>
    </>}
    {aviso && <p role="status" className="text-success-text">{aviso}</p>}
    <Modal open={abierto} title="Reemplazar escalones de equipaje" preventDismiss={guardando} onClose={() => {
      if (!guardando)
        setAbierto(false);
    }} footer={<>
      <Button variant="terciario" disabled={guardando} onClick={() => setAbierto(false)}>Cancelar</Button>
      <Button isLoading={guardando} onClick={guardar}>Sustituir todos los escalones</Button>
    </>}>
      <div className="space-y-4">
        <p className="rounded-md bg-warning-fill p-3 text-warning-text">Al guardar se reemplaza el conjunto entero. Los escalones que quites se eliminarán; conserva aquí todos los que deban seguir vigentes. Guardar también quita sus marcas de prueba.</p>
        {borrador.map((s, i) => <fieldset key={i} className="space-y-3 border-b border-border-default pb-4">
          <legend>Escalón {i + 1}</legend>
          <Input label={`Desde (kg) · escalón ${i + 1}`} inputMode="decimal" value={s.desde} readOnly={guardando} onChange={e => editar(i, "desde", e.target.value)} />
          <Input label={`Hasta (kg) · escalón ${i + 1}`} inputMode="decimal" value={s.hasta} readOnly={guardando} onChange={e => editar(i, "hasta", e.target.value)} />
          <Input label={`Recargo (S/) · escalón ${i + 1}`} inputMode="decimal" value={s.recargo} readOnly={guardando} onChange={e => editar(i, "recargo", e.target.value)} helperText="Vacío: monto todavía sin definir." />
          <Button variant="terciario" disabled={guardando} onClick={() => setBorrador(prev => prev.filter((_, j) => j !== i))}>Quitar escalón {i + 1} del conjunto</Button>
        </fieldset>)}
        <Button variant="secundario" disabled={guardando || borrador.length >= 50} onClick={() => setBorrador(prev => [...prev, { desde: "", hasta: "", recargo: "" }])}>Agregar escalón</Button>
        {!borrador.length && <p>El conjunto está vacío. Guardarlo deja el tarifario de equipaje sin definir.</p>}
        {error && <p role="alert" className="text-error-text">{error}</p>}
      </div>
    </Modal>
  </Card>;
}
