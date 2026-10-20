"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonShape } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { CheckIcon, ClockIcon, ExclamationIcon } from "@/components/ui/icons";
import {
  ETIQUETA_MEDIO,
  abrirTurno,
  arqueoTurnoActual,
  cerrarTurno,
  esSinTurno,
  leerMonto,
  mensajeCaja,
  type ArqueoTurno,
  type CierreTurno,
} from "@/lib/api/caja";
import { esSesionVencida } from "@/lib/api/cuenta";
import { obtenerCatalogo } from "@/lib/api/ventas";
import type { MensajeError } from "@/lib/api/compra";
import { formatFechaCorta, formatHora12, formatPrecio } from "@/lib/format";
import { RUTAS } from "@/lib/routes";

type Estado =
  | { tipo: "cargando" }
  | { tipo: "sesion-vencida" }
  | { tipo: "error"; mensaje: MensajeError }
  | { tipo: "sin-turno"; cierre: CierreTurno | null }
  | { tipo: "abierto"; arqueo: ArqueoTurno };

export interface CajaViewProps {
  /** Un supervisor no tiene agencia propia: elige en cuál abre. Un counter abre en la suya. */
  eligeAgencia: boolean;
}

/**
 * Arqueo del turno abierto de quien inició sesión. No hay selector de agencia,
 * turno ni usuario: svc-ventas devuelve solo el turno del operador, y la base
 * (RLS por operador) no deja leer movimientos de otro aunque se pidan.
 *
 * Toda venta en efectivo del panel entra aquí porque la misma transacción que
 * vende registra el movimiento de caja en el turno del operador.
 */
export function CajaView({ eligeAgencia }: CajaViewProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });
  const [intento, setIntento] = useState(0);
  const [agencias, setAgencias] = useState<SelectOption[]>([]);
  const [agencia, setAgencia] = useState<string | null>(null);
  const [errorAgencia, setErrorAgencia] = useState<string | undefined>();
  const [abriendo, setAbriendo] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [contado, setContado] = useState("");
  const [nota, setNota] = useState("");
  const [errorContado, setErrorContado] = useState<string | undefined>();
  const [cerrando, setCerrando] = useState(false);
  const operandoRef = useRef(false);

  useEffect(() => {
    const controlador = new AbortController();
    arqueoTurnoActual({ signal: controlador.signal }).then(
      (arqueo) => {
        if (!controlador.signal.aborted) setEstado({ tipo: "abierto", arqueo });
      },
      (error: unknown) => {
        if (controlador.signal.aborted) return;
        if (esSinTurno(error)) {
          setEstado((previo) => ({
            tipo: "sin-turno",
            cierre: previo.tipo === "sin-turno" ? previo.cierre : null,
          }));
        } else if (esSesionVencida(error)) {
          setEstado({ tipo: "sesion-vencida" });
        } else {
          setEstado({ tipo: "error", mensaje: mensajeCaja(error) });
        }
      },
    );
    return () => controlador.abort();
  }, [intento]);

  // Nombres de agencia: el arqueo trae el código. Sin catálogo se muestra el código.
  useEffect(() => {
    obtenerCatalogo().then(
      ({ terminals }) =>
        setAgencias(
          terminals
            .map((t) => ({ value: t.code, label: t.name }))
            .sort((a, b) => a.label.localeCompare(b.label, "es")),
        ),
      () => setAgencias([]),
    );
  }, []);

  function recargar() {
    setEstado({ tipo: "cargando" });
    setIntento((valor) => valor + 1);
  }

  function nombreAgencia(codigo: string): string {
    return agencias.find((a) => a.value === codigo)?.label ?? codigo;
  }

  async function handleAbrir() {
    if (operandoRef.current) return;
    if (eligeAgencia && !agencia) {
      setErrorAgencia("Elige la agencia del turno");
      return;
    }
    operandoRef.current = true;
    setAbriendo(true);
    try {
      await abrirTurno(eligeAgencia ? agencia : null);
      recargar();
    } catch (error) {
      const mensaje = mensajeCaja(error);
      showToast({ type: "error", title: mensaje.titulo, description: mensaje.descripcion });
    } finally {
      operandoRef.current = false;
      setAbriendo(false);
    }
  }

  function abrirModalCierre() {
    setContado("");
    setNota("");
    setErrorContado(undefined);
    setModalAbierto(true);
  }

  async function handleCerrar(event?: FormEvent) {
    event?.preventDefault();
    if (operandoRef.current) return;
    const monto = leerMonto(contado);
    if (monto === null) {
      setErrorContado("Escribe el efectivo que contaste, por ejemplo 250.50");
      return;
    }
    operandoRef.current = true;
    setCerrando(true);
    try {
      // Lo esperado lo calcula la base al cerrar, con el turno bloqueado: un
      // cobro simultáneo o entra al arqueo o es rechazado, nunca queda fuera.
      const cierre = await cerrarTurno(monto, nota.trim() || null);
      setModalAbierto(false);
      setEstado({ tipo: "sin-turno", cierre });
    } catch (error) {
      if (esSinTurno(error)) {
        setModalAbierto(false);
        recargar();
      } else {
        const mensaje = mensajeCaja(error);
        showToast({ type: "error", title: mensaje.titulo, description: mensaje.descripcion });
      }
    } finally {
      operandoRef.current = false;
      setCerrando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-navy sm:text-2xl">Arqueo de caja</h1>
        <p className="mt-1 text-sm text-navy/70">
          Tu turno: lo que cobraste, por medio de pago. Al cerrar, cuenta el efectivo de la caja.
        </p>
      </div>

      {estado.tipo === "cargando" && (
        <div role="status" aria-label="Cargando el arqueo" className="flex flex-col gap-4">
          <SkeletonShape variant="card" />
          <SkeletonShape variant="card" />
        </div>
      )}

      {estado.tipo === "sesion-vencida" && (
        <EmptyState
          icon={<ExclamationIcon className="!size-12 !text-primary" />}
          title="Tu sesión terminó"
          description="Vuelve a ingresar para ver tu caja. Tu turno sigue abierto."
          actionLabel="Ingresar"
          onAction={() =>
            router.push(
              `${RUTAS.ingresar}?${new URLSearchParams({ siguiente: RUTAS.panelCaja, motivo: "sesion-vencida" })}`,
            )
          }
        />
      )}

      {estado.tipo === "error" && (
        <EmptyState
          icon={<ExclamationIcon className="!size-12 !text-primary" />}
          title={estado.mensaje.titulo}
          description={estado.mensaje.descripcion}
          actionLabel="Reintentar"
          onAction={recargar}
        />
      )}

      {estado.tipo === "sin-turno" && estado.cierre && (
        <ResultadoCierre cierre={estado.cierre} />
      )}

      {estado.tipo === "sin-turno" && (
        <Card className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary/10">
              <ClockIcon className="!text-secondary" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-navy">No tienes un turno abierto</h2>
              <p className="mt-1 text-sm text-navy/70">
                Para vender en efectivo abre tu turno. Cada cobro entra al arqueo de ese turno.
              </p>
            </div>
          </div>
          {eligeAgencia && (
            <Select
              label="Agencia del turno"
              options={agencias}
              value={agencia}
              onChange={(valor) => {
                setAgencia(valor);
                setErrorAgencia(undefined);
              }}
              placeholder="Elige una agencia"
              errorText={errorAgencia}
            />
          )}
          <Button isLoading={abriendo} onClick={handleAbrir} className="self-start">
            Abrir turno
          </Button>
        </Card>
      )}

      {estado.tipo === "abierto" && (
        <TurnoAbierto
          arqueo={estado.arqueo}
          agencia={nombreAgencia(estado.arqueo.terminal)}
          onActualizar={recargar}
          onCerrar={abrirModalCierre}
        />
      )}

      <Modal
        open={modalAbierto}
        onClose={() => !cerrando && setModalAbierto(false)}
        title="Cerrar turno"
        preventDismiss={cerrando}
        footer={
          <>
            <Button variant="terciario" disabled={cerrando} onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button isLoading={cerrando} onClick={() => handleCerrar()}>
              Cerrar turno
            </Button>
          </>
        }
      >
        <form onSubmit={handleCerrar} noValidate className="flex flex-col gap-4">
          <p>
            Cuenta el efectivo de la caja y escribe el total. El sistema lo compara con lo que
            registraron tus ventas. Después de cerrar no se puede cobrar en este turno.
          </p>
          <Input
            label="Efectivo contado (S/)"
            inputMode="decimal"
            autoComplete="off"
            value={contado}
            onChange={(evento) => {
              setContado(evento.target.value);
              setErrorContado(undefined);
            }}
            errorText={errorContado}
          />
          <Textarea
            label="Nota (opcional)"
            value={nota}
            maxLength={500}
            onChange={(evento) => setNota(evento.target.value)}
            helperText="Por ejemplo, el motivo de una diferencia"
          />
        </form>
      </Modal>
    </div>
  );
}

function TurnoAbierto({
  arqueo,
  agencia,
  onActualizar,
  onCerrar,
}: {
  arqueo: ArqueoTurno;
  agencia: string;
  onActualizar: () => void;
  onCerrar: () => void;
}) {
  const abierto = new Date(arqueo.openedAt);
  const ventas = arqueo.breakdown.reduce((total, fila) => total + fila.movements, 0);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs text-navy/60">Agencia</p>
          <p className="mt-1 text-lg font-semibold text-navy">{agencia}</p>
        </Card>
        <Card>
          <p className="text-xs text-navy/60">Turno abierto desde</p>
          <p className="mt-1 text-lg font-semibold text-navy">
            {formatHora12(abierto)} · {formatFechaCorta(abierto)}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-navy/60">Efectivo que debe haber en caja</p>
          <p className="mt-1 text-xl font-bold text-navy">
            {formatPrecio(Number(arqueo.expectedCash))}
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="text-base font-semibold text-navy">Por medio de pago</h2>
        <p className="mt-1 text-sm text-navy/70">
          El efectivo se cuenta al cerrar. Yape, Plin y tarjeta se concilian con el reporte de la
          pasarela: no se suman al efectivo.
        </p>
        {arqueo.breakdown.length === 0 ? (
          <p className="mt-3 text-sm text-navy/70">Todavía no hay cobros en este turno.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="text-xs font-medium text-navy/60">
                  <th className="pb-2 font-medium">Medio</th>
                  <th className="pb-2 font-medium">Control</th>
                  <th className="pb-2 text-right font-medium">Movimientos</th>
                  <th className="pb-2 text-right font-medium">Ingresos</th>
                  <th className="pb-2 text-right font-medium">Egresos</th>
                  <th className="pb-2 text-right font-medium">Neto</th>
                </tr>
              </thead>
              <tbody>
                {arqueo.breakdown.map((fila) => (
                  <tr key={fila.method} className="border-t border-navy/10">
                    <td className="py-2 font-medium text-navy">{ETIQUETA_MEDIO[fila.method]}</td>
                    <td className="py-2 text-navy/70">
                      {fila.control === "cash_count" ? "Conteo en caja" : "Conciliación"}
                    </td>
                    <td className="py-2 text-right text-navy">{fila.movements}</td>
                    <td className="py-2 text-right text-navy">{formatPrecio(Number(fila.income))}</td>
                    <td className="py-2 text-right text-navy">{formatPrecio(Number(fila.outflow))}</td>
                    <td className="py-2 text-right font-semibold text-navy">
                      {formatPrecio(Number(fila.net))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-navy/60">
          {ventas === 1 ? "1 movimiento" : `${ventas} movimientos`} en este turno, entre pasajes y
          encomiendas.
        </p>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secundario" onClick={onActualizar}>
          Actualizar
        </Button>
        <Button variant="destructivo" onClick={onCerrar}>
          Cerrar turno
        </Button>
      </div>
    </>
  );
}

function ResultadoCierre({ cierre }: { cierre: CierreTurno }) {
  const diferencia = Number(cierre.difference);
  const cuadra = diferencia === 0;
  return (
    <div
      role="status"
      className={`flex flex-col gap-3 rounded-md p-4 text-sm ${cuadra ? "bg-success-fill text-success-text" : "bg-warning-fill text-warning-text"}`}
    >
      <p className="flex items-center gap-2 font-semibold">
        {cuadra ? (
          <CheckIcon className="!size-5 shrink-0" />
        ) : (
          <ExclamationIcon className="!size-5 shrink-0" />
        )}
        {cuadra
          ? "Turno cerrado. La caja cuadra."
          : diferencia > 0
            ? `Turno cerrado con un sobrante de ${formatPrecio(diferencia)}.`
            : `Turno cerrado con un faltante de ${formatPrecio(-diferencia)}.`}
      </p>
      <dl className="grid grid-cols-3 gap-2">
        <div>
          <dt className="text-xs">Esperado</dt>
          <dd className="font-semibold">{formatPrecio(Number(cierre.expectedCash))}</dd>
        </div>
        <div>
          <dt className="text-xs">Contado</dt>
          <dd className="font-semibold">{formatPrecio(Number(cierre.countedCash))}</dd>
        </div>
        <div>
          <dt className="text-xs">Diferencia</dt>
          <dd className="font-semibold">{formatPrecio(diferencia)}</dd>
        </div>
      </dl>
    </div>
  );
}
