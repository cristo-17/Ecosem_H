"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { formatPrecio } from "@/lib/format";
import { etiquetaRuta, type TarifaRuta } from "@/lib/mock/precios";

export interface TablaRutasProps {
  rutas: TarifaRuta[];
  onGuardar: (rutaActualizada: TarifaRuta, rutaAnterior: TarifaRuta) => void;
}

interface Borrador {
  tarifaBase: string;
  topeMinimo: string;
  topeMaximo: string;
}

function aBorrador(ruta: TarifaRuta): Borrador {
  return {
    tarifaBase: String(ruta.tarifaBase),
    topeMinimo: String(ruta.topeMinimo),
    topeMaximo: String(ruta.topeMaximo),
  };
}

export function TablaRutas({ rutas, onGuardar }: TablaRutasProps) {
  const [editando, setEditando] = useState<TarifaRuta | null>(null);
  const [borrador, setBorrador] = useState<Borrador>({ tarifaBase: "", topeMinimo: "", topeMaximo: "" });
  const [errores, setErrores] = useState<Partial<Record<keyof Borrador, string>>>({});

  function abrirEdicion(ruta: TarifaRuta) {
    setEditando(ruta);
    setBorrador(aBorrador(ruta));
    setErrores({});
  }

  function guardar() {
    if (!editando) return;

    const tarifaBase = Number(borrador.tarifaBase);
    const topeMinimo = Number(borrador.topeMinimo);
    const topeMaximo = Number(borrador.topeMaximo);
    const nuevosErrores: Partial<Record<keyof Borrador, string>> = {};

    if (!borrador.tarifaBase.trim() || !Number.isFinite(tarifaBase) || tarifaBase <= 0) {
      nuevosErrores.tarifaBase = "Ingresa una tarifa base válida";
    }
    if (!borrador.topeMinimo.trim() || !Number.isFinite(topeMinimo) || topeMinimo <= 0) {
      nuevosErrores.topeMinimo = "Ingresa un tope mínimo válido";
    }
    // Regla obligatoria del prompt: ninguna ruta se guarda sin tope máximo.
    if (!borrador.topeMaximo.trim() || !Number.isFinite(topeMaximo) || topeMaximo <= 0) {
      nuevosErrores.topeMaximo = "El tope máximo es obligatorio";
    } else if (Number.isFinite(topeMinimo) && topeMaximo < topeMinimo) {
      nuevosErrores.topeMaximo = "Debe ser mayor o igual al tope mínimo";
    }

    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    onGuardar({ ...editando, tarifaBase, topeMinimo, topeMaximo }, editando);
    setEditando(null);
  }

  return (
    <Card>
      <h2 className="text-base font-semibold text-navy">Tarifas por ruta</h2>
      <p className="mt-1 text-sm text-navy/70">
        El tope máximo es obligatorio: sin él, la ruta no se puede guardar.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="text-xs font-medium text-navy/60">
              <th className="pb-2 font-medium">Ruta</th>
              <th className="pb-2 font-medium">Tarifa base</th>
              <th className="pb-2 font-medium">Tope mínimo</th>
              <th className="pb-2 font-medium">Tope máximo</th>
              <th className="pb-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rutas.map((ruta) => (
              <tr key={ruta.id} className="border-t border-navy/10">
                <td className="py-2 text-navy">{etiquetaRuta(ruta)}</td>
                <td className="py-2 text-navy">{formatPrecio(ruta.tarifaBase)}</td>
                <td className="py-2 text-navy/70">{formatPrecio(ruta.topeMinimo)}</td>
                <td className="py-2 text-navy/70">{formatPrecio(ruta.topeMaximo)}</td>
                <td className="py-2 text-right">
                  <Button
                    variant="secundario"
                    className="h-9 min-h-0 px-3 text-xs"
                    onClick={() => abrirEdicion(ruta)}
                  >
                    Editar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={editando !== null}
        onClose={() => setEditando(null)}
        title={editando ? `Editar ${etiquetaRuta(editando)}` : "Editar ruta"}
        footer={
          <>
            <Button variant="terciario" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button onClick={guardar}>Guardar</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 text-left">
          <Input
            label="Tarifa base (S/)"
            inputMode="decimal"
            value={borrador.tarifaBase}
            onChange={(evento) => setBorrador((prev) => ({ ...prev, tarifaBase: evento.target.value }))}
            errorText={errores.tarifaBase}
          />
          <Input
            label="Tope mínimo (S/)"
            inputMode="decimal"
            value={borrador.topeMinimo}
            onChange={(evento) => setBorrador((prev) => ({ ...prev, topeMinimo: evento.target.value }))}
            errorText={errores.topeMinimo}
          />
          <Input
            label="Tope máximo (S/)"
            inputMode="decimal"
            value={borrador.topeMaximo}
            onChange={(evento) => setBorrador((prev) => ({ ...prev, topeMaximo: evento.target.value }))}
            errorText={errores.topeMaximo}
            helperText="Obligatorio: evita exponer a la empresa ante Indecopi por abuso de precio."
          />
        </div>
      </Modal>
    </Card>
  );
}
