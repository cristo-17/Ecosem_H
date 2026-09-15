"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

/** Forma mínima compartida por RangoFactor y FactorTemporada (lib/mock/precios.ts). */
export interface FilaFactor {
  id: string;
  etiqueta: string;
  factor: number;
}

export interface TablaFactoresProps {
  titulo: string;
  descripcion?: string;
  columnaEtiqueta: string;
  factores: FilaFactor[];
  onGuardar: (id: string, factorAnterior: number, factorNuevo: number) => void;
}

/** Reusada para ocupación, anticipación y temporada: mismo patrón de rango + factor editable. */
export function TablaFactores({ titulo, descripcion, columnaEtiqueta, factores, onGuardar }: TablaFactoresProps) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [valor, setValor] = useState("");
  const [error, setError] = useState<string | undefined>();

  const editando = factores.find((factor) => factor.id === editandoId) ?? null;

  function abrir(fila: FilaFactor) {
    setEditandoId(fila.id);
    setValor(String(fila.factor));
    setError(undefined);
  }

  function guardar() {
    if (!editando) return;
    const nuevoFactor = Number(valor);
    if (!valor.trim() || !Number.isFinite(nuevoFactor) || nuevoFactor <= 0) {
      setError("Ingresa un factor válido, mayor que 0");
      return;
    }
    onGuardar(editando.id, editando.factor, nuevoFactor);
    setEditandoId(null);
  }

  return (
    <Card>
      <h2 className="text-base font-semibold text-navy">{titulo}</h2>
      {descripcion && <p className="mt-1 text-sm text-navy/70">{descripcion}</p>}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead>
            <tr className="text-xs font-medium text-navy/60">
              <th className="pb-2 font-medium">{columnaEtiqueta}</th>
              <th className="pb-2 font-medium">Factor</th>
              <th className="pb-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {factores.map((fila) => (
              <tr key={fila.id} className="border-t border-navy/10">
                <td className="py-2 text-navy">{fila.etiqueta}</td>
                <td className="py-2 text-navy">×{fila.factor.toFixed(2)}</td>
                <td className="py-2 text-right">
                  <Button variant="secundario" className="h-9 min-h-0 px-3 text-xs" onClick={() => abrir(fila)}>
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
        onClose={() => setEditandoId(null)}
        title={editando ? `Editar factor — ${editando.etiqueta}` : "Editar factor"}
        footer={
          <>
            <Button variant="terciario" onClick={() => setEditandoId(null)}>
              Cancelar
            </Button>
            <Button onClick={guardar}>Guardar</Button>
          </>
        }
      >
        <Input
          label="Factor"
          inputMode="decimal"
          value={valor}
          onChange={(evento) => setValor(evento.target.value)}
          errorText={error}
          helperText="Ej. 1.10 multiplica la tarifa por 1.10 (+10%)."
        />
      </Modal>
    </Card>
  );
}
