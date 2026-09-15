"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { formatPrecio } from "@/lib/format";
import type { EscalonEquipaje } from "@/lib/mock/tarifario";

export interface EquipajeCardProps {
  escalones: EscalonEquipaje[];
  onCambiar: (escalones: EscalonEquipaje[]) => void;
}

/**
 * Los límites de kg (20/30/50) son la regla fija de CLAUDE.md/el prompt, no
 * se editan acá — solo el monto de recargo de cada escalón, que arranca en
 * `null` ("pendiente") hasta que comercial lo defina.
 */
export function EquipajeCard({ escalones, onCambiar }: EquipajeCardProps) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [valor, setValor] = useState("");
  const [error, setError] = useState<string | undefined>();

  const editando = escalones.find((e) => e.id === editandoId) ?? null;

  function abrir(escalon: EscalonEquipaje) {
    setEditandoId(escalon.id);
    setValor(escalon.recargo !== null ? String(escalon.recargo) : "");
    setError(undefined);
  }

  function guardar() {
    if (!editando) return;
    const nuevoRecargo = Number(valor);
    if (!valor.trim() || !Number.isFinite(nuevoRecargo) || nuevoRecargo <= 0) {
      setError("Ingresa un recargo válido, mayor que 0");
      return;
    }
    onCambiar(escalones.map((e) => (e.id === editando.id ? { ...e, recargo: nuevoRecargo } : e)));
    setEditandoId(null);
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-navy">Exceso de equipaje</h3>
      <p className="mt-1 text-sm text-navy/70">
        Franquicia de 20 kg por pasajero. Más de 50 kg se tarifica como encomienda, no como exceso.
      </p>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[360px] text-left text-sm">
          <thead>
            <tr className="text-xs font-medium text-navy/60">
              <th className="pb-2 font-medium">Rango</th>
              <th className="pb-2 font-medium">Recargo</th>
              <th className="pb-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-navy/10">
              <td className="py-2 text-navy">Hasta 20 kg</td>
              <td className="py-2 text-navy/70" colSpan={2}>
                Incluido en el pasaje (franquicia)
              </td>
            </tr>
            {escalones.map((escalon) => (
              <tr key={escalon.id} className="border-t border-navy/10">
                <td className="py-2 text-navy">{escalon.etiqueta}</td>
                <td className="py-2 text-navy">
                  {escalon.recargo !== null ? (
                    formatPrecio(escalon.recargo)
                  ) : (
                    <span className="text-warning-text">Pendiente de aprobación comercial</span>
                  )}
                </td>
                <td className="py-2 text-right">
                  <Button variant="secundario" className="h-9 min-h-0 px-3 text-xs" onClick={() => abrir(escalon)}>
                    Editar
                  </Button>
                </td>
              </tr>
            ))}
            <tr className="border-t border-navy/10">
              <td className="py-2 text-navy">Más de 50 kg</td>
              <td className="py-2 text-navy/70" colSpan={2}>
                Se tarifica como encomienda
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Modal
        open={editando !== null}
        onClose={() => setEditandoId(null)}
        title={editando ? `Editar recargo — ${editando.etiqueta}` : "Editar recargo"}
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
          label="Recargo (S/)"
          inputMode="decimal"
          value={valor}
          onChange={(evento) => setValor(evento.target.value)}
          errorText={error}
        />
      </Modal>
    </Card>
  );
}
