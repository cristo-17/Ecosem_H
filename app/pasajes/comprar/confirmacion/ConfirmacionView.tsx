"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonShape } from "@/components/ui/Skeleton";
import { QrBoleto } from "@/components/pasajes/QrBoleto";
import { ReservationTimer } from "@/components/pasajes/ReservationTimer";
import { SinCompraEnCurso } from "@/components/pasajes/EstadosReserva";
import { usePurchase } from "@/components/pasajes/PurchaseProvider";
import {
  CheckIcon,
  ClockIcon,
  DownloadIcon,
  ExclamationIcon,
  InfoIcon,
} from "@/components/ui/icons";
import type { TicketsResponse } from "@/lib/types/contratos-frontend";
import { ahoraServidor } from "@/lib/api/cliente";
import {
  consultarReserva,
  haySesionCompra,
  mensajeCompra,
  obtenerBoletos,
  type MensajeError,
} from "@/lib/api/compra";
import { vincularComprasDeEstaPestana } from "@/lib/api/cuenta";
import { etiquetaAsiento } from "@/lib/asientos";
import { formatFechaLarga, formatHora12, formatPrecio, maskDocumento } from "@/lib/format";
import { labelTipoAsiento } from "@/lib/mock/viajes";
import { descargarBoletosCompraPdf } from "@/lib/pdf/boleto";
import { RUTAS } from "@/lib/routes";
import { useIsMounted } from "@/lib/useIsMounted";

type Estado =
  | { tipo: "consultando" }
  | { tipo: "esperando"; expiresAt: string }
  | { tipo: "vencida" }
  | { tipo: "comprada"; boletos: TicketsResponse | null }
  | { tipo: "error"; mensaje: MensajeError };

// Mientras se espera el webhook: cada 3 s el primer minuto, luego cada 10 s.
const CONSULTA_RAPIDA_MS = 3_000;
const CONSULTA_LENTA_MS = 10_000;
const DURACION_RAPIDA_MS = 60_000;

const RECEIPT_STATUS: Record<string, string> = {
  pending: "En emisión",
  issued: "Emitido",
  failed: "En revisión",
  voided: "Anulado",
};

/**
 * Confirmación de la compra, y también la página de retorno de la pasarela.
 *
 * Volver de la pasarela significa que el usuario volvió, no que pagó. La
 * compra la confirma solo el webhook en el backend (regla 2 de CLAUDE.md):
 * aquí se consulta el estado real de la reserva hasta que el backend diga
 * `purchased`, y solo entonces se muestra "confirmada".
 */
export function ConfirmacionView({ reservationId }: { reservationId: string }) {
  const router = useRouter();
  const purchase = usePurchase();
  const [estado, setEstado] = useState<Estado>({ tipo: "consultando" });
  const [intento, setIntento] = useState(0);
  const [ahora, setAhora] = useState(() => ahoraServidor());
  const [generandoPdf, setGenerandoPdf] = useState(false);
  // sessionStorage no existe en el servidor: se lee recién montado en el
  // cliente, para no romper la hidratación.
  const montado = useIsMounted();
  const sesion = montado && reservationId ? haySesionCompra() : false;

  useEffect(() => {
    if (!reservationId || !sesion) return;
    let vigente = true;
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    const inicio = Date.now();

    async function consultar() {
      try {
        const { status, expiresAt } = await consultarReserva(reservationId);
        if (!vigente) return;
        if (status === "purchased") {
          setEstado({ tipo: "comprada", boletos: null });
          // Con la sesión iniciada, la compra pasa a la cuenta (D-048). Sin
          // sesión no hace nada. Nunca bloquea mostrar los boletos.
          vincularComprasDeEstaPestana();
          const boletos = await obtenerBoletos(reservationId).catch(() => null);
          if (vigente) setEstado({ tipo: "comprada", boletos });
          return;
        }
        if (status === "expired") return setEstado({ tipo: "vencida" });
        setEstado({ tipo: "esperando", expiresAt });
      } catch (error) {
        if (!vigente) return;
        // Sin red mientras se espera: se sigue intentando sin decidir nada.
        setEstado((anterior) =>
          anterior.tipo === "esperando" ? anterior : { tipo: "error", mensaje: mensajeCompra(error) },
        );
      }
      if (vigente) {
        const espera = Date.now() - inicio < DURACION_RAPIDA_MS ? CONSULTA_RAPIDA_MS : CONSULTA_LENTA_MS;
        temporizador = setTimeout(consultar, espera);
      }
    }

    consultar();
    return () => {
      vigente = false;
      clearTimeout(temporizador);
    };
  }, [reservationId, sesion, intento]);

  useEffect(() => {
    if (estado.tipo !== "esperando") return;
    const id = setInterval(() => setAhora(ahoraServidor()), 1000);
    return () => clearInterval(id);
  }, [estado.tipo]);

  if (!reservationId) return <Pantalla><SinCompraEnCurso /></Pantalla>;

  if (!montado) return <Pantalla><Consultando /></Pantalla>;

  if (!sesion) {
    return (
      <Pantalla>
        <EmptyState
          icon={<ExclamationIcon className="!size-12 !text-primary" />}
          title="No podemos consultar esta compra aquí"
          description="El estado de una compra solo se puede ver en la misma pestaña del navegador donde se hizo. Si pagaste, conserva el comprobante de tu pago y llama a la central."
          actionLabel="Ir al inicio"
          onAction={() => router.push(RUTAS.inicio)}
          footer={<p className="text-sm text-navy/70">Central: +51 959 366 710</p>}
        />
      </Pantalla>
    );
  }

  const referencia = reservationId.slice(0, 8).toUpperCase();

  if (estado.tipo === "consultando") return <Pantalla><Consultando /></Pantalla>;

  if (estado.tipo === "error") {
    return (
      <Pantalla>
        <EmptyState
          icon={<ExclamationIcon className="!size-12 !text-primary" />}
          title={estado.mensaje.titulo}
          description={estado.mensaje.descripcion}
          actionLabel="Reintentar"
          onAction={() => {
            setEstado({ tipo: "consultando" });
            setIntento((valor) => valor + 1);
          }}
          footer={<p className="text-sm text-navy/70">Referencia de tu reserva: {referencia}</p>}
        />
      </Pantalla>
    );
  }

  if (estado.tipo === "esperando") {
    return (
      <Pantalla>
        <div role="status" className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-info-fill">
            <ClockIcon className="!size-6 text-info-text" />
          </span>
          <h1 className="text-xl font-semibold text-navy sm:text-2xl">Esperando la confirmación del pago</h1>
          <p className="max-w-md text-sm text-navy/70">
            Tu compra todavía no está confirmada. Se confirma cuando la pasarela nos avisa que el
            pago se aprobó. Esta página se actualiza sola.
          </p>
        </div>
        <ReservationTimer
          restanteMs={Math.max(0, Date.parse(estado.expiresAt) - ahora)}
          className="mt-4"
        />
        <p className="mt-4 text-center text-xs text-navy/60">Referencia de tu reserva: {referencia}</p>
      </Pantalla>
    );
  }

  if (estado.tipo === "vencida") {
    return (
      <Pantalla>
        <EmptyState
          icon={<ClockIcon className="!size-12 !text-warning-text" />}
          title="No se confirmó el pago a tiempo"
          description="La reserva venció sin que la pasarela confirmara el pago, y los asientos se liberaron. Tu compra no está confirmada. Si se hizo un cargo en tu cuenta, llama a la central con la referencia de abajo."
          actionLabel="Buscar pasajes"
          onAction={() => router.push(RUTAS.inicio)}
          footer={
            <div className="flex flex-col gap-1 text-sm text-navy/70">
              <p>Central: +51 959 366 710</p>
              <p>Referencia de tu reserva: {referencia}</p>
            </div>
          }
        />
      </Pantalla>
    );
  }

  // Comprada: lo dijo el backend.
  const { boletos } = estado;

  async function descargarPdf() {
    if (!boletos) return;
    // Terminal y tipo de servicio no vienen en los boletos: se agregan si esta
    // pestaña todavía tiene el viaje elegido.
    const elegido =
      purchase.viaje?.viaje.id === boletos.tickets[0]?.trip.tripId ? purchase.viaje : null;
    setGenerandoPdf(true);
    try {
      await descargarBoletosCompraPdf(boletos, {
        terminalOrigen: elegido?.terminalOrigen,
        tipoServicio: elegido ? labelTipoAsiento(elegido.viaje.serviceType) : undefined,
      });
    } finally {
      setGenerandoPdf(false);
    }
  }
  const total =
    purchase.reserva?.reservationId === reservationId ? purchase.reserva.totalAmount : null;
  const viaje = boletos?.tickets[0]?.trip;

  return (
    <Pantalla>
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success-fill">
          <CheckIcon className="!size-6 text-success-text" />
        </span>
        <h1 className="text-xl font-semibold text-navy sm:text-2xl">¡Compra confirmada!</h1>
        {boletos && (
          <p className="max-w-sm text-sm text-navy/70">
            Tu código de compra es{" "}
            <span className="font-semibold text-navy">{boletos.purchaseCode}</span>.
          </p>
        )}
      </div>

      {!boletos ? (
        <Card className="mt-4 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-navy">
            Tu compra está confirmada, pero no pudimos cargar tus boletos en este momento.
          </p>
          <Button
            variant="secundario"
            onClick={() => {
              setEstado({ tipo: "consultando" });
              setIntento((valor) => valor + 1);
            }}
          >
            Volver a cargar
          </Button>
        </Card>
      ) : (
        <>
          {viaje && (
            <Card className="mt-4 text-sm text-navy">
              <p className="text-base font-semibold">
                {viaje.origin} → {viaje.destination}
              </p>
              <p className="text-navy/70">
                {formatFechaLarga(new Date(viaje.departsAt))} · {formatHora12(new Date(viaje.departsAt))}
              </p>
              {viaje.cancelled && (
                <p className="mt-2 font-medium text-error-text">
                  Este viaje fue cancelado. Llama a la central para tu devolución o cambio.
                </p>
              )}
              {total && (
                <p className="mt-2">
                  Total pagado: <span className="font-semibold">{formatPrecio(Number(total))}</span>
                </p>
              )}
            </Card>
          )}

          <div className="mt-4 flex items-start gap-2 rounded-md bg-info-fill p-4 text-left text-sm text-info-text">
            <InfoIcon className="mt-0.5 !size-5 shrink-0" />
            <p>Muestra el código QR de cada pasajero al embarcar, con su documento de identidad.</p>
          </div>

          <ul className="mt-4 flex flex-col gap-4">
            {boletos.tickets.map((ticket) => (
              <li key={ticket.seat}>
                <Card className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
                  <QrBoleto contenido={ticket.qr} asiento={etiquetaAsiento(ticket.seat)} />
                  <div className="flex flex-col gap-1 text-sm text-navy">
                    <p className="text-base font-semibold">Asiento {etiquetaAsiento(ticket.seat)}</p>
                    {ticket.passenger && (
                      <>
                        <p>
                          {ticket.passenger.firstNames} {ticket.passenger.lastNames}
                        </p>
                        {/* El número completo va en el boleto; en pantalla, enmascarado. */}
                        <p className="text-navy/60">
                          Documento {maskDocumento(ticket.passenger.documentNumber)}
                        </p>
                      </>
                    )}
                    <p className="text-navy/60">
                      Boleto de viaje:{" "}
                      {ticket.receipt.series && ticket.receipt.number
                        ? `${ticket.receipt.series}-${ticket.receipt.number}`
                        : (RECEIPT_STATUS[ticket.receipt.status] ?? ticket.receipt.status)}
                    </p>
                    <p className="font-medium">{formatPrecio(Number(ticket.amount))}</p>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {boletos && (
          <Button onClick={descargarPdf} disabled={generandoPdf} className="w-full sm:w-auto">
            <DownloadIcon className="!text-white" />
            {generandoPdf ? "Generando..." : "Descargar boletos (PDF)"}
          </Button>
        )}
        <Button variant="terciario" onClick={() => router.push(RUTAS.inicio)} className="w-full sm:w-auto">
          Volver al inicio
        </Button>
      </div>
    </Pantalla>
  );
}

function Consultando() {
  return (
    <div role="status" aria-label="Consultando el estado de tu compra" className="flex flex-col gap-4">
      <SkeletonShape variant="text" lines={2} className="max-w-sm" />
      <SkeletonShape variant="card" className="h-64" />
    </div>
  );
}

function Pantalla({ children }: { children: ReactNode }) {
  return <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">{children}</main>;
}
