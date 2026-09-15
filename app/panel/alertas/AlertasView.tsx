"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { UrgenciaPill } from "@/components/ui/UrgenciaPill";
import { SearchOffIcon } from "@/components/ui/icons";
import { formatFechaCorta } from "@/lib/format";
import { USUARIO_MOCK } from "@/lib/mock/sesion";
import { RUTAS } from "@/lib/routes";
import {
  generarAlertasActivas,
  HISTORIAL_ATENDIDO_SEED,
  ordenarPorUrgencia,
  buscarConductor,
  type Alerta,
} from "@/lib/mock/flota";

const LABEL_TIPO: Record<Alerta["tipo"], string> = {
  documento: "Documento por vencer",
  kilometraje: "Kilometraje",
  "horas-conduccion": "Horas de conducción",
};

function etiquetaEntidad(alerta: Alerta): string {
  if (alerta.entidad.tipo === "unidad") return `Unidad ${alerta.entidad.placa}`;
  return buscarConductor(alerta.entidad.id)?.nombre ?? "Conductor";
}

export function AlertasView() {
  const router = useRouter();
  const [alertas, setAlertas] = useState<Alerta[]>(() => [
    ...generarAlertasActivas(),
    ...HISTORIAL_ATENDIDO_SEED,
  ]);
  const [atendiendo, setAtendiendo] = useState<Alerta | null>(null);
  const [responsable, setResponsable] = useState(USUARIO_MOCK.nombre);
  const [nota, setNota] = useState("");
  const [error, setError] = useState<string | undefined>();

  const activas = ordenarPorUrgencia(alertas.filter((alerta) => alerta.estado === "activa"));
  const atendidas = [...alertas.filter((alerta) => alerta.estado === "atendida")].sort(
    (a, b) => (b.fechaAtencion?.getTime() ?? 0) - (a.fechaAtencion?.getTime() ?? 0),
  );

  function abrirAtender(alerta: Alerta) {
    setAtendiendo(alerta);
    setResponsable(USUARIO_MOCK.nombre);
    setNota("");
    setError(undefined);
  }

  function confirmarAtencion() {
    if (!atendiendo) return;
    if (!responsable.trim() || !nota.trim()) {
      setError("Completa responsable y nota antes de guardar.");
      return;
    }
    const idAtendida = atendiendo.id;
    const fechaAtencion = new Date();
    const responsableFinal = responsable.trim();
    const notaFinal = nota.trim();
    setAlertas((prev) =>
      prev.map((alerta) =>
        alerta.id === idAtendida
          ? {
              ...alerta,
              estado: "atendida",
              fechaAtencion,
              responsableAtencion: responsableFinal,
              notaAtencion: notaFinal,
            }
          : alerta,
      ),
    );
    setAtendiendo(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-navy sm:text-2xl">Alertas</h1>
        <p className="mt-1 text-sm text-navy/70">
          Documentos por vencer, kilometraje sobre el umbral y horas de conducción acumuladas,
          ordenadas por urgencia.
        </p>
      </div>

      {activas.length === 0 ? (
        <EmptyState
          icon={<SearchOffIcon />}
          title="No hay alertas activas"
          description="Todas las unidades y conductores están dentro de sus umbrales."
          actionLabel="Ir a Flota"
          onAction={() => router.push(RUTAS.panelFlota)}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {activas.map((alerta) => (
            <Card
              key={alerta.id}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <UrgenciaPill urgencia={alerta.urgencia} className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-navy">{etiquetaEntidad(alerta)}</p>
                  <p className="text-xs text-navy/60">{LABEL_TIPO[alerta.tipo]}</p>
                  <p className="mt-1 text-sm text-navy/80">{alerta.descripcion}</p>
                </div>
              </div>
              <Button
                variant="secundario"
                className="h-10 min-h-0 shrink-0 px-4 text-sm"
                onClick={() => abrirAtender(alerta)}
              >
                Marcar como atendida
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <h2 className="text-base font-semibold text-navy">Atendidas</h2>
        <p className="mt-1 text-sm text-navy/70">Historial de alertas ya resueltas, con responsable y nota.</p>

        {atendidas.length === 0 ? (
          <p className="mt-4 text-sm text-navy/60">Todavía no se atendió ninguna alerta.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="text-xs font-medium text-navy/60">
                  <th className="pb-2 font-medium">Alerta</th>
                  <th className="pb-2 font-medium">Atendida</th>
                  <th className="pb-2 font-medium">Responsable</th>
                  <th className="pb-2 font-medium">Nota</th>
                </tr>
              </thead>
              <tbody>
                {atendidas.map((alerta) => (
                  <tr key={alerta.id} className="border-t border-navy/10 align-top">
                    <td className="py-2 text-navy">
                      {etiquetaEntidad(alerta)} — {alerta.descripcion}
                    </td>
                    <td className="py-2 whitespace-nowrap text-navy/70">
                      {alerta.fechaAtencion && formatFechaCorta(alerta.fechaAtencion)}
                    </td>
                    <td className="py-2 text-navy/70">{alerta.responsableAtencion}</td>
                    <td className="py-2 text-navy/70">{alerta.notaAtencion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={atendiendo !== null}
        onClose={() => setAtendiendo(null)}
        title="Marcar como atendida"
        footer={
          <>
            <Button variant="terciario" onClick={() => setAtendiendo(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmarAtencion}>Guardar</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {atendiendo && <p className="text-sm text-navy/80">{atendiendo.descripcion}</p>}
          <Input label="Responsable" value={responsable} onChange={(evento) => setResponsable(evento.target.value)} />
          <Textarea
            label="Nota"
            value={nota}
            onChange={(evento) => setNota(evento.target.value)}
            placeholder="Qué se hizo para resolver esta alerta"
            errorText={error}
          />
        </div>
      </Modal>
    </div>
  );
}
