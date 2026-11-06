"use client";
import { ScrollRegion } from "@/components/ui/ScrollRegion";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchOffIcon } from "@/components/ui/icons";
import { formatPrecio } from "@/lib/format";
import { mensajePrecios } from "@/lib/api/precios";
import type { FareListResponse, SaveFareRequest } from "@/lib/types/contratos-panel";
export function TablaRutas({ rutas, onGuardar, recargar }: {
  rutas: FareListResponse["fares"];
  onGuardar: (ruta: string, cuerpo: SaveFareRequest) => Promise<void>;
  recargar: () => void;
}) {
  const [editando, setEditando] = useState<FareListResponse["fares"][number] | null>(null);
  const [base, setBase] = useState("");
  const [minimo, setMinimo] = useState("");
  const [maximo, setMaximo] = useState("");
  const [ficticia, setFicticia] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  async function guardar() {
    if (!editando || guardando)
      return;
    const numeros = [base, minimo, maximo].map(Number);
    if ([base, minimo, maximo].some(v => !v.trim()) || numeros.some(n => !Number.isFinite(n) || n <= 0)) {
      setError("Completa tarifa base, mínimo y máximo con importes mayores que cero.");
      return;
    }
    if (numeros[1] > numeros[0] || numeros[0] > numeros[2]) {
      setError("La tarifa base debe estar entre el mínimo y el máximo.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const cuerpo: SaveFareRequest = { baseFare: numeros[0], minFare: numeros[1], maxFare: numeros[2], fictitious: ficticia };
      await onGuardar(editando.route, cuerpo);
      setEditando(null);
    }
    catch (e) {
      setError(mensajePrecios(e).descripcion);
    }
    finally {
      setGuardando(false);
    }
  }
  return <Card className="space-y-4">
    <h2 className="text-base font-semibold text-navy">Tarifas por ruta</h2>
    <p className="text-sm text-text-secondary">El máximo es obligatorio. La marca «Ficticia» identifica importes de prueba; editar un importe no elimina esa marca automáticamente.</p>
    {!rutas.length ? <EmptyState icon={<SearchOffIcon className="size-8" />} title="No hay rutas disponibles" description="Actualiza la consulta o pide que se registre una ruta en el catálogo." actionLabel="Actualizar consulta" onAction={recargar} /> :
      <ScrollRegion label="Tarifas por ruta" className="">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className="p-3">Ruta</th>
              <th className="p-3">Base</th>
              <th className="p-3">Mínimo</th>
              <th className="p-3">Máximo</th>
              <th className="p-3">Datos</th>
              <th className="p-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>{rutas.map(r => <tr key={r.route} className="border-t border-border-default">
            <th scope="row" className="p-3 font-medium">{r.route}</th>
            {[r.baseFare, r.minFare, r.maxFare].map((importe, i) => <td key={i} className="p-3 whitespace-nowrap">{importe === null ? "Sin definir" : formatPrecio(Number(importe))}</td>)}
            <td className="p-3">{r.fictitious ? <span className="rounded-sm bg-warning-fill px-3 py-1 text-warning-text">Ficticia</span> : "Sin marca de prueba"}</td>
            <td className="p-3">
              <Button variant="secundario" onClick={() => {
                setEditando(r);
                setBase(r.baseFare ?? "");
                setMinimo(r.minFare ?? "");
                setMaximo(r.maxFare ?? "");
                setFicticia(r.fictitious);
                setError("");
              }}>{r.baseFare === null ? "Definir tarifa" : "Editar"}</Button>
            </td>
          </tr>)}</tbody>
        </table>
      </ScrollRegion>}
    <Modal open={!!editando} title={`Tarifa · ${editando?.route ?? ""}`} onClose={() => {
      if (!guardando)
        setEditando(null);
    }} footer={<>
      <Button variant="terciario" disabled={guardando} onClick={() => setEditando(null)}>Cancelar</Button>
      <Button isLoading={guardando} onClick={guardar}>Guardar tarifa</Button>
    </>}>
      <div className="space-y-4">
        <Input label="Tarifa base (S/)" inputMode="decimal" value={base} onChange={e => setBase(e.target.value)} />
        <Input label="Tope mínimo (S/)" inputMode="decimal" value={minimo} onChange={e => setMinimo(e.target.value)} />
        <Input label="Tope máximo (S/)" inputMode="decimal" value={maximo} onChange={e => setMaximo(e.target.value)} helperText="Obligatorio para guardar la ruta." />
        <Checkbox label="Tarifa ficticia (de prueba)" checked={ficticia} onChange={e => setFicticia(e.target.checked)} disabled={guardando} />
        {error && <p role="alert" className="text-error-text">{error}</p>}
      </div>
    </Modal>
  </Card>;
}
