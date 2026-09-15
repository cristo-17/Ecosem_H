"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { UrgenciaPill } from "@/components/ui/UrgenciaPill";
import { ChevronLeftIcon, SearchOffIcon } from "@/components/ui/icons";
import { formatFechaCorta } from "@/lib/format";
import {
  buscarUnidad,
  labelTipoServicio,
  diasRestantes,
  nivelAlertaDocumento,
  generarAlertasActivas,
  alertasDeUnidad,
  HISTORIAL_ATENDIDO_SEED,
  type DocumentosUnidad,
} from "@/lib/mock/flota";
import { RUTAS } from "@/lib/routes";

const NOMBRES_DOCUMENTO: Record<keyof DocumentosUnidad, string> = {
  soat: "SOAT",
  revisionTecnica: "Revisión técnica",
  tarjetaCirculacion: "Tarjeta de circulación",
};

export function UnidadDetalleView({ placa }: { placa: string }) {
  const router = useRouter();
  const unidad = buscarUnidad(placa);

  const [umbralKilometraje, setUmbralKilometraje] = useState(unidad?.umbralKilometraje ?? 0);
  const [editandoUmbral, setEditandoUmbral] = useState(false);
  const [valorUmbral, setValorUmbral] = useState("");
  const [error, setError] = useState<string | undefined>();

  if (!unidad) {
    return (
      <EmptyState
        icon={<SearchOffIcon />}
        title="Unidad no encontrada"
        description={`No existe ninguna unidad registrada con la placa ${placa}.`}
        actionLabel="Volver a Flota"
        onAction={() => router.push(RUTAS.panelFlota)}
      />
    );
  }

  const documentos = Object.entries(unidad.documentos) as [keyof DocumentosUnidad, DocumentosUnidad[keyof DocumentosUnidad]][];

  const sobreUmbral = unidad.kilometrajeAcumulado >= umbralKilometraje;

  const historicoUnidad = [
    ...alertasDeUnidad(unidad.placa, generarAlertasActivas()),
    ...alertasDeUnidad(unidad.placa, HISTORIAL_ATENDIDO_SEED),
  ].sort((a, b) => b.fechaEmision.getTime() - a.fechaEmision.getTime());

  function abrirEdicionUmbral() {
    setValorUmbral(String(umbralKilometraje));
    setError(undefined);
    setEditandoUmbral(true);
  }

  function guardarUmbral() {
    const nuevo = Number(valorUmbral);
    if (!valorUmbral.trim() || !Number.isFinite(nuevo) || nuevo <= 0) {
      setError("Ingresa un kilometraje válido, mayor que 0");
      return;
    }
    setUmbralKilometraje(nuevo);
    setEditandoUmbral(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <Button variant="terciario" className="w-fit" onClick={() => router.push(RUTAS.panelFlota)}>
        <ChevronLeftIcon />
        Volver a Flota
      </Button>

      <div>
        <h1 className="text-xl font-semibold text-navy sm:text-2xl">
          {unidad.placa} · {unidad.modelo}
        </h1>
        <p className="mt-1 text-sm text-navy/70">
          {labelTipoServicio(unidad.tipoServicio)} · {unidad.capacidad} asientos
        </p>
      </div>

      <Card>
        <h2 className="text-base font-semibold text-navy">Documentos</h2>
        <p className="mt-1 text-sm text-navy/70">
          SOAT, revisión técnica y tarjeta de circulación, con su fecha de vencimiento.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="text-xs font-medium text-navy/60">
                <th className="pb-2 font-medium">Documento</th>
                <th className="pb-2 font-medium">Número</th>
                <th className="pb-2 font-medium">Vencimiento</th>
                <th className="pb-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map(([clave, documento]) => {
                const dias = diasRestantes(documento.vencimiento);
                const urgencia = nivelAlertaDocumento(dias);
                return (
                  <tr key={clave} className="border-t border-navy/10">
                    <td className="py-2 text-navy">{NOMBRES_DOCUMENTO[clave]}</td>
                    <td className="py-2 text-navy/70">{documento.numero}</td>
                    <td className="py-2 text-navy/70">{formatFechaCorta(documento.vencimiento)}</td>
                    <td className="py-2">
                      {urgencia ? <UrgenciaPill urgencia={urgencia} /> : <span className="text-navy/50">Vigente</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-navy">Umbral de mantenimiento</h2>
          <p className="mt-1 text-sm text-navy/70">
            {unidad.kilometrajeAcumulado.toLocaleString("es-PE")} km acumulados de un umbral de{" "}
            {umbralKilometraje.toLocaleString("es-PE")} km
            {sobreUmbral ? " — superado." : "."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {sobreUmbral && <UrgenciaPill urgencia="warning" />}
          <Button variant="secundario" className="h-10 min-h-0 px-4 text-sm" onClick={abrirEdicionUmbral}>
            Editar umbral
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-navy">Histórico de alertas</h2>
        <p className="mt-1 text-sm text-navy/70">Emitidas y atendidas para esta unidad.</p>

        {historicoUnidad.length === 0 ? (
          <p className="mt-4 text-sm text-navy/60">Esta unidad no tiene alertas registradas.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="text-xs font-medium text-navy/60">
                  <th className="pb-2 font-medium">Descripción</th>
                  <th className="pb-2 font-medium">Emitida</th>
                  <th className="pb-2 font-medium">Estado</th>
                  <th className="pb-2 font-medium">Atendida por</th>
                </tr>
              </thead>
              <tbody>
                {historicoUnidad.map((alerta) => (
                  <tr key={alerta.id} className="border-t border-navy/10 align-top">
                    <td className="py-2 text-navy">{alerta.descripcion}</td>
                    <td className="py-2 whitespace-nowrap text-navy/70">{formatFechaCorta(alerta.fechaEmision)}</td>
                    <td className="py-2">
                      {alerta.estado === "activa" ? (
                        <UrgenciaPill urgencia={alerta.urgencia} />
                      ) : (
                        <span className="text-success-text">Atendida</span>
                      )}
                    </td>
                    <td className="py-2 text-navy/70">
                      {alerta.estado === "atendida" ? (
                        <>
                          <p>{alerta.responsableAtencion}</p>
                          <p className="text-xs text-navy/50">
                            {alerta.fechaAtencion && formatFechaCorta(alerta.fechaAtencion)} · {alerta.notaAtencion}
                          </p>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={editandoUmbral}
        onClose={() => setEditandoUmbral(false)}
        title="Editar umbral de kilometraje"
        footer={
          <>
            <Button variant="terciario" onClick={() => setEditandoUmbral(false)}>
              Cancelar
            </Button>
            <Button onClick={guardarUmbral}>Guardar</Button>
          </>
        }
      >
        <Input
          label="Kilometraje para mantenimiento"
          inputMode="numeric"
          value={valorUmbral}
          onChange={(evento) => setValorUmbral(evento.target.value)}
          errorText={error}
          helperText="A partir de este kilometraje, la unidad aparece en la bandeja de alertas."
        />
      </Modal>
    </div>
  );
}
