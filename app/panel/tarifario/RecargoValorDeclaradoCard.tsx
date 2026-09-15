"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

export interface RecargoValorDeclaradoCardProps {
  porcentaje: number | null;
  onCambiar: (porcentaje: number) => void;
}

/** Recargo opcional por valor declarado (RNAT), un solo porcentaje global, pendiente hasta que comercial lo defina. */
export function RecargoValorDeclaradoCard({ porcentaje, onCambiar }: RecargoValorDeclaradoCardProps) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState("");
  const [error, setError] = useState<string | undefined>();

  function abrir() {
    setValor(porcentaje !== null ? String(porcentaje) : "");
    setError(undefined);
    setEditando(true);
  }

  function guardar() {
    const nuevo = Number(valor);
    if (!valor.trim() || !Number.isFinite(nuevo) || nuevo <= 0 || nuevo > 100) {
      setError("Ingresa un porcentaje válido entre 0 y 100");
      return;
    }
    onCambiar(nuevo);
    setEditando(false);
  }

  return (
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-sm font-semibold text-navy">Recargo por valor declarado</h3>
        <p className="mt-1 text-sm text-navy/70">
          Opcional, alineado con el Reglamento Nacional de Administración de Transporte.
        </p>
        <p className="mt-1 text-sm">
          {porcentaje !== null ? (
            <span className="text-navy">{porcentaje}% del valor declarado</span>
          ) : (
            <span className="text-warning-text">Pendiente de aprobación comercial</span>
          )}
        </p>
      </div>
      <Button variant="secundario" className="h-10 min-h-0 shrink-0 px-4 text-sm" onClick={abrir}>
        Editar porcentaje
      </Button>

      <Modal
        open={editando}
        onClose={() => setEditando(false)}
        title="Editar recargo por valor declarado"
        footer={
          <>
            <Button variant="terciario" onClick={() => setEditando(false)}>
              Cancelar
            </Button>
            <Button onClick={guardar}>Guardar</Button>
          </>
        }
      >
        <Input
          label="Porcentaje (%)"
          inputMode="decimal"
          value={valor}
          onChange={(evento) => setValor(evento.target.value)}
          errorText={error}
          helperText="Se aplica sobre el valor declarado del envío."
        />
      </Modal>
    </Card>
  );
}
