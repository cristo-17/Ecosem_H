"use client";

import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { CheckIcon, ClockIcon } from "@/components/ui/icons";
import { OPCIONES_CIUDAD, type Ciudad } from "@/lib/mock/viajes";
import { TURNOS, USUARIOS_COUNTER, buscarArqueo, resumirArqueo, labelMedioPago } from "@/lib/mock/caja";
import { formatPrecio, formatHora12 } from "@/lib/format";

export function CajaView() {
  const [agencia, setAgencia] = useState("Lima");
  const [turno, setTurno] = useState(TURNOS[0].value);
  const [usuario, setUsuario] = useState(USUARIOS_COUNTER[0].value);
  const [cerrado, setCerrado] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  const transacciones = buscarArqueo(agencia as Ciudad, turno, usuario);
  const resumen = resumirArqueo(transacciones);

  function cambiarSeleccion<T>(actualizar: (valor: T) => void) {
    return (valor: T) => {
      actualizar(valor);
      setCerrado(false);
    };
  }

  function confirmarCierre() {
    setCerrado(true);
    setModalAbierto(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-navy sm:text-2xl">Arqueo de caja</h1>
        <p className="mt-1 text-sm text-navy/70">
          Elige agencia, turno y usuario para ver el resumen de ese turno.
        </p>
      </div>

      <Card className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Select
          label="Agencia"
          options={OPCIONES_CIUDAD}
          value={agencia}
          onChange={cambiarSeleccion(setAgencia)}
        />
        <Select label="Turno" options={TURNOS} value={turno} onChange={cambiarSeleccion(setTurno)} />
        <Select
          label="Usuario"
          options={USUARIOS_COUNTER}
          value={usuario}
          onChange={cambiarSeleccion(setUsuario)}
        />
      </Card>

      {cerrado && (
        <div className="flex items-center gap-2 rounded-md bg-success-fill p-4 text-sm text-success-text">
          <CheckIcon className="!size-5 shrink-0" />
          Turno cerrado. El arqueo queda congelado — cambia la selección para ver otro turno.
        </div>
      )}

      {transacciones.length === 0 ? (
        <EmptyState
          icon={<ClockIcon className="!size-12 !text-navy/40" />}
          title="Sin transacciones en este turno"
          description="Prueba con otra combinación de agencia, turno y usuario."
          actionLabel="Ver un turno con movimiento"
          onAction={() => {
            setAgencia("Lima");
            setTurno(TURNOS[0].value);
            setUsuario(USUARIOS_COUNTER[0].value);
            setCerrado(false);
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card>
              <p className="text-xs text-navy/60">Total vendido</p>
              <p className="mt-1 text-xl font-bold text-navy">{formatPrecio(resumen.total)}</p>
            </Card>
            <Card>
              <p className="text-xs text-navy/60">Boletos</p>
              <p className="mt-1 text-xl font-bold text-navy">{resumen.cantidadBoletos}</p>
            </Card>
            <Card>
              <p className="text-xs text-navy/60">Encomiendas</p>
              <p className="mt-1 text-xl font-bold text-navy">{resumen.cantidadEncomiendas}</p>
            </Card>
            <Card>
              <p className="text-xs text-navy/60">Transacciones</p>
              <p className="mt-1 text-xl font-bold text-navy">{transacciones.length}</p>
            </Card>
          </div>

          <Card>
            <h2 className="text-base font-semibold text-navy">Desglose por medio de pago</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {resumen.porMedioPago.map((item) => (
                <li
                  key={item.medio}
                  className="flex items-center justify-between border-b border-navy/10 pb-2 text-sm last:border-0 last:pb-0"
                >
                  <span className="text-navy/70">{labelMedioPago(item.medio)}</span>
                  <span className="font-semibold text-navy">{formatPrecio(item.total)}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-navy">Transacciones del turno</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="text-xs font-medium text-navy/60">
                    <th className="pb-2 font-medium">Hora</th>
                    <th className="pb-2 font-medium">Tipo</th>
                    <th className="pb-2 font-medium">Referencia</th>
                    <th className="pb-2 font-medium">Medio</th>
                    <th className="pb-2 text-right font-medium">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {transacciones.map((transaccion) => (
                    <tr key={transaccion.id} className="border-t border-navy/10">
                      <td className="py-2 text-navy/70">{formatHora12(transaccion.hora)}</td>
                      <td className="py-2 text-navy">
                        {transaccion.tipo === "pasaje" ? "Pasaje" : "Encomienda"}
                      </td>
                      <td className="py-2 text-navy">{transaccion.referencia}</td>
                      <td className="py-2 text-navy/70">{labelMedioPago(transaccion.medioPago)}</td>
                      <td className="py-2 text-right font-medium text-navy">
                        {formatPrecio(transaccion.monto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <div className="flex justify-end">
        <Button
          variant="destructivo"
          disabled={cerrado || transacciones.length === 0}
          onClick={() => setModalAbierto(true)}
        >
          Cerrar turno
        </Button>
      </div>

      <Modal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title="¿Cerrar turno?"
        footer={
          <>
            <Button variant="terciario" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarCierre}>Sí, cerrar turno</Button>
          </>
        }
      >
        <p>
          Se va a congelar el arqueo de este turno: total {formatPrecio(resumen.total)} en{" "}
          {transacciones.length} {transacciones.length === 1 ? "transacción" : "transacciones"}. Sin
          backend todavía, esto solo cambia el estado en pantalla — no queda persistido.
        </p>
      </Modal>
    </div>
  );
}
