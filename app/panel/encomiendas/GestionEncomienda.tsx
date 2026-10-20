"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonShape } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { EncomiendaTimeline, badgeDeEncomienda } from "@/components/ui/EncomiendaTimeline";
import { ExclamationIcon, SearchOffIcon, TrackIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api/cliente";
import type { MensajeError } from "@/lib/api/compra";
import { ETIQUETA_MEDIO } from "@/lib/api/caja";
import {
  ETIQUETA_ESTADO,
  buscarPorGuia,
  entregarEncomienda,
  marcarEstado,
  mensajeEncomienda,
  siguienteEstado,
  type DetalleEncomienda,
  type DocumentoEncomienda,
} from "@/lib/api/encomiendas";
import { formatFechaCorta, formatHora12, formatPrecio, maskDocumento } from "@/lib/format";
import { errorDocumento } from "./RegistroEncomienda";
import type { Agencia } from "./EncomiendasView";

const OPCIONES_DOCUMENTO: SelectOption[] = [
  { value: "dni", label: "DNI" },
  { value: "carne_extranjeria", label: "Carné de Extranjería" },
  { value: "pasaporte", label: "Pasaporte" },
  { value: "ruc", label: "RUC" },
];

const ETIQUETA_DOCUMENTO: Record<DocumentoEncomienda, string> = {
  dni: "DNI",
  carne_extranjeria: "C.E.",
  pasaporte: "Pasaporte",
  ruc: "RUC",
};

type Carga =
  | { tipo: "inicial" }
  | { tipo: "cargando" }
  | { tipo: "no-encontrada"; mensaje: MensajeError }
  | { tipo: "error"; mensaje: MensajeError }
  | { tipo: "lista"; encomienda: DetalleEncomienda };

export interface GestionEncomiendaProps {
  agencias: Agencia[];
  /** El supervisor no tiene agencia fija: elige dónde marca o entrega. */
  eligeAgencia: boolean;
  /** Guía para abrir directamente (tras registrar). */
  guiaInicial: string | null;
}

/**
 * Lo que trae quien envía o quien recoge es la guía. Con ella el personal ve
 * el detalle (solo de su agencia de origen o destino: RLS), avanza el estado
 * y entrega. En pantalla los documentos van enmascarados: para entregar no
 * hace falta verlos, se escribe el que muestra quien recoge y el backend lo
 * compara con el del destinatario.
 */
export function GestionEncomienda({ agencias, eligeAgencia, guiaInicial }: GestionEncomiendaProps) {
  const { showToast } = useToast();
  const [guia, setGuia] = useState(guiaInicial ?? "");
  const [carga, setCarga] = useState<Carga>(guiaInicial ? { tipo: "cargando" } : { tipo: "inicial" });
  const [agencia, setAgencia] = useState<string | null>(null);
  const [errorAgencia, setErrorAgencia] = useState<string | undefined>();
  const [operando, setOperando] = useState(false);
  const operandoRef = useRef(false);
  const controladorRef = useRef<AbortController | null>(null);

  const [docTipo, setDocTipo] = useState<DocumentoEncomienda>("dni");
  const [docNumero, setDocNumero] = useState("");
  const [errorDoc, setErrorDoc] = useState<string | undefined>();

  /** Pide la encomienda; solo cambia el estado cuando llega la respuesta. */
  function consultar(valor: string) {
    controladorRef.current?.abort();
    const controlador = new AbortController();
    controladorRef.current = controlador;
    return buscarPorGuia(valor, { signal: controlador.signal }).then(
      (encomienda) => {
        if (!controlador.signal.aborted) setCarga({ tipo: "lista", encomienda });
      },
      (error: unknown) => {
        if (controlador.signal.aborted) return;
        const noEncontrada =
          error instanceof ApiError &&
          (error.codigo === "NOT_FOUND" || error.codigo === "TRACKING_CODE_INVALID");
        setCarga({ tipo: noEncontrada ? "no-encontrada" : "error", mensaje: mensajeEncomienda(error) });
      },
    );
  }

  function buscar(valor: string) {
    setCarga({ tipo: "cargando" });
    return consultar(valor);
  }

  useEffect(() => {
    // Con guía inicial el estado ya arranca en "cargando".
    if (guiaInicial) void consultar(guiaInicial);
    return () => controladorRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleBuscar(event: FormEvent) {
    event.preventDefault();
    if (guia.trim()) void buscar(guia);
  }

  /** La agencia donde se actúa: la del counter la pone el backend; el supervisor la elige. */
  function agenciaParaOperar(): string | null | false {
    if (!eligeAgencia) return null;
    if (!agencia) {
      setErrorAgencia("Elige en qué agencia estás");
      return false;
    }
    return agencia;
  }

  async function operar(accion: () => Promise<unknown>, exito: string) {
    if (operandoRef.current || carga.tipo !== "lista") return;
    operandoRef.current = true;
    setOperando(true);
    try {
      await accion();
      showToast({ type: "success", title: exito, description: `Guía ${carga.encomienda.trackingCode}.` });
      setDocNumero("");
    } catch (error) {
      const mensaje = mensajeEncomienda(error);
      showToast({ type: "error", title: mensaje.titulo, description: mensaje.descripcion });
    } finally {
      operandoRef.current = false;
      setOperando(false);
      // Siempre el estado real después de actuar, haya salido bien o no.
      await buscar(carga.encomienda.trackingCode);
    }
  }

  function handleAvanzar(encomienda: DetalleEncomienda) {
    const siguiente = siguienteEstado(encomienda.status);
    const terminal = agenciaParaOperar();
    if (!siguiente || terminal === false) return;
    void operar(
      () => marcarEstado(encomienda.parcelId, siguiente, terminal),
      `Marcada: ${ETIQUETA_ESTADO[siguiente]}`,
    );
  }

  function handleEntregar(event: FormEvent, encomienda: DetalleEncomienda) {
    event.preventDefault();
    const error = errorDocumento(docTipo, docNumero);
    setErrorDoc(error);
    const terminal = agenciaParaOperar();
    if (error || terminal === false) return;
    void operar(
      () => entregarEncomienda(encomienda.parcelId, { documentType: docTipo, documentNumber: docNumero.trim() }, terminal),
      "Encomienda entregada",
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleBuscar} noValidate className="flex items-end gap-3">
        <Input
          label="Número de guía"
          placeholder="Ej: EH-7K3M-Q9TB"
          autoComplete="off"
          autoCapitalize="characters"
          value={guia}
          onChange={(evento) => setGuia(evento.target.value)}
          className="flex-1"
        />
        <Button type="submit" isLoading={carga.tipo === "cargando"}>
          Buscar
        </Button>
      </form>

      {eligeAgencia && (
        <Select
          label="Agencia donde estás"
          options={agencias.map((a) => ({ value: a.code, label: a.name }))}
          value={agencia}
          onChange={(valor) => {
            setAgencia(valor);
            setErrorAgencia(undefined);
          }}
          placeholder="Elige una agencia"
          helperText="Los cambios de estado y la entrega quedan registrados en esta agencia"
          errorText={errorAgencia}
        />
      )}

      {carga.tipo === "inicial" && (
        <div className="flex flex-col items-center gap-2 py-10 text-center text-navy/50">
          <TrackIcon />
          <p className="max-w-xs text-sm">
            Escribe la guía que trae el remitente o quien viene a recoger. Ves las encomiendas que
            salen de tu agencia o llegan a ella.
          </p>
        </div>
      )}

      {carga.tipo === "cargando" && (
        <div role="status" aria-label="Buscando la encomienda">
          <SkeletonShape variant="card" className="h-48" />
        </div>
      )}

      {carga.tipo === "no-encontrada" && (
        <EmptyState
          icon={<SearchOffIcon />}
          title={carga.mensaje.titulo}
          description={carga.mensaje.descripcion}
          actionLabel="Buscar otra"
          onAction={() => setCarga({ tipo: "inicial" })}
        />
      )}

      {carga.tipo === "error" && (
        <EmptyState
          icon={<ExclamationIcon className="!size-12 !text-primary" />}
          title={carga.mensaje.titulo}
          description={carga.mensaje.descripcion}
          actionLabel="Reintentar"
          onAction={() => void buscar(guia)}
        />
      )}

      {carga.tipo === "lista" && (
        <DetalleVista
          encomienda={carga.encomienda}
          operando={operando}
          onAvanzar={() => handleAvanzar(carga.encomienda)}
          entrega={
            carga.encomienda.status === "en_destino" && (
              <form
                onSubmit={(evento) => handleEntregar(evento, carga.encomienda)}
                noValidate
                className="flex flex-col gap-4 border-t border-navy/10 pt-4"
              >
                <div>
                  <h3 className="text-base font-semibold text-navy">Entregar</h3>
                  <p className="text-sm text-navy/70">
                    Pide el documento a quien recoge y escríbelo tal como figura. Solo se entrega si
                    es el del destinatario registrado.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Select
                    label="Tipo de documento"
                    options={OPCIONES_DOCUMENTO}
                    value={docTipo}
                    onChange={(valor) => setDocTipo(valor as DocumentoEncomienda)}
                  />
                  <Input
                    label="N.° de documento de quien recoge"
                    autoComplete="off"
                    inputMode={docTipo === "dni" || docTipo === "ruc" ? "numeric" : "text"}
                    value={docNumero}
                    onChange={(evento) => setDocNumero(evento.target.value)}
                    errorText={errorDoc}
                  />
                </div>
                <Button type="submit" isLoading={operando} className="self-start">
                  Entregar encomienda
                </Button>
              </form>
            )
          }
        />
      )}
    </div>
  );
}

function DetalleVista({
  encomienda,
  operando,
  onAvanzar,
  entrega,
}: {
  encomienda: DetalleEncomienda;
  operando: boolean;
  onAvanzar: () => void;
  entrega: ReactNode;
}) {
  const siguiente = siguienteEstado(encomienda.status);
  const documento = (tipo: DocumentoEncomienda | null, numero: string | null) =>
    tipo && numero ? `${ETIQUETA_DOCUMENTO[tipo]} ${maskDocumento(numero)}` : "Sin documento";
  const comprobante = encomienda.receipt;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-navy/60">Guía {encomienda.trackingCode}</p>
          <p className="text-base font-semibold text-navy">
            {encomienda.origin} → {encomienda.destination}
          </p>
          <p className="mt-0.5 text-xs text-navy/60">
            Peso facturable: {encomienda.quote.billableWeightKg} kg
          </p>
        </div>
        <Badge status={badgeDeEncomienda(encomienda.status)} />
      </div>

      <dl className="grid grid-cols-1 gap-3 border-t border-navy/10 pt-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-navy/60">Remitente</dt>
          <dd className="text-navy">{encomienda.sender.name}</dd>
          <dd className="text-xs text-navy/60">
            {documento(encomienda.sender.documentType, encomienda.sender.documentNumber)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-navy/60">Destinatario</dt>
          <dd className="text-navy">{encomienda.recipient.name}</dd>
          <dd className="text-xs text-navy/60">
            {documento(encomienda.recipient.documentType, encomienda.recipient.documentNumber)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-navy/60">Cobro</dt>
          <dd className="text-navy">
            {formatPrecio(Number(encomienda.quote.total))} · {ETIQUETA_MEDIO[encomienda.payment.method]}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-navy/60">Comprobante</dt>
          <dd className="text-navy">
            {comprobante.type === "factura" ? "Factura" : "Boleta"}{" "}
            {comprobante.series && comprobante.number
              ? `${comprobante.series}-${comprobante.number}`
              : `(${comprobante.status})`}
          </dd>
        </div>
      </dl>

      {encomienda.cancellation && (
        <p className="rounded-md bg-error-fill p-3 text-sm text-error-text">
          Cancelada el {formatFechaCorta(new Date(encomienda.cancellation.at))}:{" "}
          {encomienda.cancellation.reason}
          {encomienda.cancellation.refundResolved ? " · Devolución resuelta" : " · Devolución pendiente"}
        </p>
      )}
      {encomienda.delivery && (
        <p className="rounded-md bg-success-fill p-3 text-sm text-success-text">
          Entregada el {formatFechaCorta(new Date(encomienda.delivery.at))} a las{" "}
          {formatHora12(new Date(encomienda.delivery.at))}, verificada con{" "}
          {ETIQUETA_DOCUMENTO[encomienda.delivery.documentType]}.
        </p>
      )}

      <div className="border-t border-navy/10 pt-4">
        <EncomiendaTimeline estado={encomienda.status} eventos={encomienda.events} />
      </div>

      {siguiente && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-navy/10 pt-4">
          <p className="text-sm text-navy/70">
            Siguiente paso: <span className="font-medium text-navy">{ETIQUETA_ESTADO[siguiente]}</span>
          </p>
          <Button variant="secundario" isLoading={operando} onClick={onAvanzar}>
            Marcar: {ETIQUETA_ESTADO[siguiente]}
          </Button>
        </div>
      )}

      {entrega}
    </Card>
  );
}
