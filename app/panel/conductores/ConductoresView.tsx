"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { UrgenciaPill } from "@/components/ui/UrgenciaPill";
import { UserIcon } from "@/components/ui/icons";
import { formatFechaCorta } from "@/lib/format";
import {
  CONDUCTORES_FLOTA,
  UMBRAL_HORAS_CONDUCCION_DEFAULT,
  diasRestantes,
  nivelAlertaDocumento,
  generarAlertasActivas,
  alertasDeConductor,
  ordenarPorUrgencia,
} from "@/lib/mock/flota";

export function ConductoresView() {
  const [umbralHoras, setUmbralHoras] = useState(UMBRAL_HORAS_CONDUCCION_DEFAULT);
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState("");
  const [error, setError] = useState<string | undefined>();

  const alertasActivas = generarAlertasActivas(undefined, undefined, umbralHoras);

  function abrirEdicion() {
    setValor(String(umbralHoras));
    setError(undefined);
    setEditando(true);
  }

  function guardar() {
    const nuevo = Number(valor);
    if (!valor.trim() || !Number.isFinite(nuevo) || nuevo <= 0) {
      setError("Ingresa un límite válido, mayor que 0");
      return;
    }
    setUmbralHoras(nuevo);
    setEditando(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-navy sm:text-2xl">Conductores</h1>
        <p className="mt-1 text-sm text-navy/70">
          Licencia, vencimiento y horas de conducción acumuladas frente al límite vigente.
        </p>
      </div>

      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-navy">Límite de horas de conducción</h2>
          <p className="mt-1 text-sm text-navy/70">
            Parámetro configurable: hoy está en {umbralHoras} h acumuladas.
          </p>
        </div>
        <Button variant="secundario" className="h-10 min-h-0 px-4 text-sm" onClick={abrirEdicion}>
          Editar límite
        </Button>
      </Card>

      <div className="flex flex-col gap-3">
        {CONDUCTORES_FLOTA.map((conductor) => {
          const dias = diasRestantes(conductor.vencimientoLicencia);
          const urgenciaLicencia = nivelAlertaDocumento(dias);
          const propias = ordenarPorUrgencia(alertasDeConductor(conductor.id, alertasActivas));
          const alertaHoras = propias.find((alerta) => alerta.tipo === "horas-conduccion");

          return (
            <Card
              key={conductor.id}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-navy/5 text-navy/60">
                  <UserIcon className="size-6" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-navy">{conductor.nombre}</p>
                  <p className="text-xs text-navy/60">
                    Licencia {conductor.licencia} · vence {formatFechaCorta(conductor.vencimientoLicencia)}
                  </p>
                  <p className="mt-1 text-xs text-navy/60">
                    {conductor.horasConduccionAcumuladas} h de conducción acumuladas
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1 sm:items-end">
                {urgenciaLicencia && <UrgenciaPill urgencia={urgenciaLicencia} />}
                {alertaHoras && <UrgenciaPill urgencia={alertaHoras.urgencia} />}
                {!urgenciaLicencia && !alertaHoras && <span className="text-xs text-navy/50">Sin alertas activas</span>}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal
        open={editando}
        onClose={() => setEditando(false)}
        title="Editar límite de horas de conducción"
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
          label="Límite de horas acumuladas"
          inputMode="numeric"
          value={valor}
          onChange={(evento) => setValor(evento.target.value)}
          errorText={error}
          helperText="A partir de este límite, el conductor aparece en la bandeja de alertas."
        />
      </Modal>
    </div>
  );
}
