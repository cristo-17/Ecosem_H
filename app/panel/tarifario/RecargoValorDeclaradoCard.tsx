"use client";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { mensajeTarifario } from "@/lib/api/tarifario";
import { leerMonto } from "@/lib/api/caja";
import type { ParcelRatesResponse, SaveDeclaredValueSurchargeRequest } from "@/lib/types/contratos-panel";
export function RecargoValorDeclaradoCard({ tarifario, onGuardar }: {
  tarifario: ParcelRatesResponse;
  onGuardar: (pedido: SaveDeclaredValueSurchargeRequest) => Promise<void>;
}) {
  const [abierto, setAbierto] = useState(false);
  const [valor, setValor] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  async function guardar() {
    if (guardando)
      return;
    const percent = leerMonto(valor);
    if (percent === null || percent < 0 || percent > 100) {
      setError("Ingresa un porcentaje de 0 a 100, con hasta dos decimales.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      await onGuardar({ percent });
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
    <h2 className="font-semibold text-navy">Recargo por valor declarado</h2>
    <p>{tarifario.declaredValueSurchargePercent === null ? "La empresa todavía no definió el porcentaje. No se puede cotizar con valor declarado." : `${tarifario.declaredValueSurchargePercent}% del valor declarado`}</p>
    {tarifario.declaredValueSurchargeFictitious && <p className="rounded-md bg-warning-fill p-3 text-warning-text">Porcentaje ficticio de prueba.</p>}
    <Button variant="secundario" onClick={() => { setValor(tarifario.declaredValueSurchargePercent ?? ""); setError(""); setAbierto(true); }}>Editar porcentaje</Button>
    <Modal open={abierto} title="Recargo por valor declarado" preventDismiss={guardando} onClose={() => {
      if (!guardando)
        setAbierto(false);
    }} footer={<>
      <Button variant="terciario" disabled={guardando} onClick={() => setAbierto(false)}>Cancelar</Button>
      <Button isLoading={guardando} onClick={guardar}>Guardar porcentaje</Button>
    </>}>
      <div className="space-y-4">
        <Input label="Porcentaje (%)" inputMode="decimal" value={valor} readOnly={guardando} onChange={e => setValor(e.target.value)} helperText="0 es válido: sin recargo. El porcentaje se guarda en el servidor." />
        {tarifario.declaredValueSurchargeFictitious && <p className="text-warning-text">Guardar confirma el porcentaje como definido por la empresa y quita la marca de prueba.</p>}
        {error && <p role="alert" className="text-error-text">{error}</p>}
      </div>
    </Modal>
  </Card>;
}
