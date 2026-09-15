"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { formatPrecio } from "@/lib/format";
import type { RangoTarifaEncomienda } from "@/lib/mock/tarifario";

export interface RangosEncomiendaCardProps {
  titulo: string;
  rangos: RangoTarifaEncomienda[];
  onCambiar: (rangos: RangoTarifaEncomienda[]) => void;
}

function nuevoId(): string {
  return typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

/**
 * Rangos de peso editables para una ruta de encomiendas. Arranca vacío
 * (docs/prompts/13-tarifario-encomiendas.md: "no rellenar con cifras
 * inventadas") — el supervisor agrega cada rango con su hasta-kg y precio,
 * en vez de editar valores ya puestos como en TablaFactores (precios.ts).
 */
export function RangosEncomiendaCard({ titulo, rangos, onCambiar }: RangosEncomiendaCardProps) {
  const [editandoId, setEditandoId] = useState<string | null | "nuevo">(null);
  const [hastaKg, setHastaKg] = useState("");
  const [precio, setPrecio] = useState("");
  const [error, setError] = useState<string | undefined>();

  const rangosOrdenados = [...rangos].sort((a, b) => a.hastaKg - b.hastaKg);
  const editando = editandoId && editandoId !== "nuevo" ? rangos.find((r) => r.id === editandoId) ?? null : null;

  function abrirNuevo() {
    setEditandoId("nuevo");
    setHastaKg("");
    setPrecio("");
    setError(undefined);
  }

  function abrirEditar(rango: RangoTarifaEncomienda) {
    setEditandoId(rango.id);
    setHastaKg(String(rango.hastaKg));
    setPrecio(String(rango.precio));
    setError(undefined);
  }

  function cerrar() {
    setEditandoId(null);
  }

  function quitar(id: string) {
    onCambiar(rangos.filter((rango) => rango.id !== id));
  }

  function guardar() {
    const nuevoHastaKg = Number(hastaKg);
    const nuevoPrecio = Number(precio);

    if (!hastaKg.trim() || !Number.isFinite(nuevoHastaKg) || nuevoHastaKg <= 0) {
      setError("Ingresa un límite de peso válido, mayor que 0");
      return;
    }
    if (!precio.trim() || !Number.isFinite(nuevoPrecio) || nuevoPrecio <= 0) {
      setError("Ingresa un precio válido, mayor que 0");
      return;
    }
    const yaExiste = rangos.some((r) => r.hastaKg === nuevoHastaKg && r.id !== editandoId);
    if (yaExiste) {
      setError("Ya existe un rango con ese límite de peso");
      return;
    }

    if (editandoId === "nuevo") {
      onCambiar([...rangos, { id: nuevoId(), hastaKg: nuevoHastaKg, precio: nuevoPrecio }]);
    } else if (editandoId) {
      onCambiar(rangos.map((r) => (r.id === editandoId ? { ...r, hastaKg: nuevoHastaKg, precio: nuevoPrecio } : r)));
    }
    cerrar();
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-navy">{titulo}</h3>
        <Button variant="secundario" className="h-9 min-h-0 px-3 text-xs" onClick={abrirNuevo}>
          Agregar rango
        </Button>
      </div>

      {rangosOrdenados.length === 0 ? (
        <div className="mt-3 rounded-md bg-warning-fill p-3 text-sm text-warning-text">
          Pendiente de aprobación comercial: todavía no hay rangos de peso definidos para esta ruta.
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[360px] text-left text-sm">
            <thead>
              <tr className="text-xs font-medium text-navy/60">
                <th className="pb-2 font-medium">Hasta</th>
                <th className="pb-2 font-medium">Precio</th>
                <th className="pb-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rangosOrdenados.map((rango) => (
                <tr key={rango.id} className="border-t border-navy/10">
                  <td className="py-2 text-navy">{rango.hastaKg} kg</td>
                  <td className="py-2 text-navy">{formatPrecio(rango.precio)}</td>
                  <td className="py-2 text-right whitespace-nowrap">
                    <Button variant="secundario" className="h-9 min-h-0 px-3 text-xs" onClick={() => abrirEditar(rango)}>
                      Editar
                    </Button>{" "}
                    <Button variant="terciario" className="h-9 min-h-0 px-3 text-xs" onClick={() => quitar(rango.id)}>
                      Quitar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={editandoId !== null}
        onClose={cerrar}
        title={editando ? `Editar rango — hasta ${editando.hastaKg} kg` : "Agregar rango"}
        footer={
          <>
            <Button variant="terciario" onClick={cerrar}>
              Cancelar
            </Button>
            <Button onClick={guardar}>Guardar</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Hasta (kg)"
            inputMode="decimal"
            value={hastaKg}
            onChange={(evento) => setHastaKg(evento.target.value)}
            helperText="Límite superior del rango, inclusive."
          />
          <Input
            label="Precio (S/)"
            inputMode="decimal"
            value={precio}
            onChange={(evento) => setPrecio(evento.target.value)}
            errorText={error}
          />
        </div>
      </Modal>
    </Card>
  );
}
