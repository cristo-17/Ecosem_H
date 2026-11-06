"use client";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScaleIcon } from "@/components/ui/icons";
import { formatPrecio } from "@/lib/format";
import { leerMonto } from "@/lib/api/caja";
import { mensajeTarifario } from "@/lib/api/tarifario";
import type { ParcelRatesResponse, SaveParcelRatesRequest } from "@/lib/types/contratos-panel";
export function RangosEncomiendaCard({ titulo, ruta, onGuardar }: {
  titulo: string;
  ruta: ParcelRatesResponse["routes"][number];
  onGuardar: (pedido: SaveParcelRatesRequest) => Promise<void>;
}) {
  const [abierto, setAbierto] = useState(false);
  const [borrador, setBorrador] = useState<Array<{
    hasta: string;
    precio: string;
  }>>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  function abrir() {
    setBorrador(ruta.ranges.map(r => ({ hasta: r.toKg, precio: r.price })));
    setError("");
    setAbierto(true);
  }
  function editar(i: number, campo: "hasta" | "precio", valor: string) {
    setBorrador(prev => prev.map((r, j) => i === j ? { ...r, [campo]: valor } : r));
  }
  async function guardar() {
    if (guardando)
      return;
    const ranges: SaveParcelRatesRequest["ranges"] = [];
    for (const r of borrador) {
      const toKg = leerMonto(r.hasta), price = leerMonto(r.precio);
      if (toKg === null || toKg <= 0 || price === null || price <= 0 || (ranges.length > 0 && toKg <= ranges[ranges.length - 1].toKg)) {
        setError("Ingresa topes de peso mayores que cero, en orden creciente y sin repetir, y precios mayores que cero (hasta dos decimales).");
        return;
      }
      ranges.push({ toKg, price });
    }
    setGuardando(true);
    setError("");
    try {
      await onGuardar({ origin: ruta.origin, destination: ruta.destination, ranges });
      setAbierto(false);
    }
    catch (e) {
      setError(mensajeTarifario(e).descripcion);
    }
    finally {
      setGuardando(false);
    }
  }
  return <Card className="space-y-4">
    <h3 className="font-semibold text-navy">{titulo}</h3>
    {ruta.fictitious && <p className="rounded-md bg-warning-fill p-3 text-warning-text">Tarifario ficticio de prueba. No es una tarifa comercial aprobada.</p>}
    {ruta.ranges.length ? <>
      <div className="space-y-2">{ruta.ranges.map(r => <p key={r.toKg}>Desde {r.fromKg} hasta {r.toKg} kg · {formatPrecio(Number(r.price))}</p>)}</div>
      <Button variant="secundario" onClick={abrir}>Editar rangos de ruta</Button>
    </> : <EmptyState icon={<ScaleIcon className="size-8" />} title="La empresa todavía no definió montos" description="Sin tarifa no se puede cotizar ni registrar una encomienda para esta ruta. No se cobra a ojo." actionLabel="Definir rangos de ruta" onAction={abrir} />}
    <Modal open={abierto} title={`Rangos · ${titulo}`} preventDismiss={guardando} onClose={() => {
      if (!guardando)
        setAbierto(false);
    }} footer={<>
      <Button variant="terciario" disabled={guardando} onClick={() => setAbierto(false)}>Cancelar</Button>
      <Button isLoading={guardando} onClick={guardar}>{borrador.length ? "Guardar conjunto de rangos" : "Guardar ruta sin rangos"}</Button>
    </>}>
      <div className="space-y-4">
        <p>Guardar reemplaza todos los rangos de esta ruta. El primer rango comienza en 0 kg; cada tope es inclusivo. Los siguientes comienzan por encima del tope anterior.</p>
        {ruta.fictitious && <p className="rounded-md bg-warning-fill p-3 text-warning-text">Guardar estos montos los configura como definidos por la empresa y quita su marca de prueba.</p>}
        {borrador.map((r, i) => <fieldset key={i} className="space-y-3 border-b border-border-default pb-4">
          <legend className="font-medium">Rango {i + 1}</legend>
          <Input label={`Hasta (kg) · rango ${i + 1}`} inputMode="decimal" value={r.hasta} readOnly={guardando} onChange={e => editar(i, "hasta", e.target.value)} />
          <Input label={`Precio (S/) · rango ${i + 1}`} inputMode="decimal" value={r.precio} readOnly={guardando} onChange={e => editar(i, "precio", e.target.value)} />
          <Button variant="terciario" disabled={guardando} onClick={() => setBorrador(prev => prev.filter((_, j) => j !== i))}>Quitar rango {i + 1} del conjunto</Button>
        </fieldset>)}
        <Button variant="secundario" disabled={guardando || borrador.length >= 50} onClick={() => setBorrador(prev => [...prev, { hasta: "", precio: "" }])}>Agregar rango</Button>
        {!borrador.length && <p className="rounded-md bg-warning-fill p-3 text-warning-text">Se eliminarán todos los rangos de esta ruta. Sin tarifa no se puede cotizar ni registrar.</p>}
        {error && <p role="alert" className="text-error-text">{error}</p>}
      </div>
    </Modal>
  </Card>;
}
