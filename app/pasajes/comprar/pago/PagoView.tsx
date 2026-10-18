"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/ui/Stepper";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { PurchaseSummary } from "@/components/pasajes/PurchaseSummary";
import { PaymentMethodPicker } from "@/components/pasajes/PaymentMethodPicker";
import { ReservationTimer } from "@/components/pasajes/ReservationTimer";
import {
  CompraInterrumpida,
  ReservaVencida,
  SinCompraEnCurso,
} from "@/components/pasajes/EstadosReserva";
import { useVigenciaReserva } from "@/components/pasajes/useVigenciaReserva";
import { usePurchase } from "@/components/pasajes/PurchaseProvider";
import { useToast } from "@/components/ui/Toast";
import type { ElectronicPaymentMethod } from "@/lib/types/contratos-frontend";
import { ApiError } from "@/lib/api/cliente";
import { esReservaNoVigente, iniciarPago, mensajeCompra } from "@/lib/api/compra";
import { formatPrecio } from "@/lib/format";
import { RUTAS, rutaCompraConfirmacion, rutaCompraDatos } from "@/lib/routes";

interface ErroresPago {
  metodo?: string;
  ruc?: string;
  nombre?: string;
}

export function PagoView({ reservationId }: { reservationId: string }) {
  const router = useRouter();
  const purchase = usePurchase();
  const { showToast } = useToast();
  const reserva = purchase.reserva?.reservationId === reservationId ? purchase.reserva : null;
  const viaje = purchase.viaje;
  const { restanteMs, vigencia } = useVigenciaReserva(
    reserva?.reservationId ?? null,
    reserva?.expiresAt ?? null,
  );

  const [metodo, setMetodo] = useState<ElectronicPaymentMethod | null>(null);
  const [sustentarGasto, setSustentarGasto] = useState(false);
  const [ruc, setRuc] = useState("");
  const [nombre, setNombre] = useState("");
  const [errores, setErrores] = useState<ErroresPago>({});
  const [procesando, setProcesando] = useState(false);
  const [vencidaAlPagar, setVencidaAlPagar] = useState(false);
  // El estado de React no alcanza para bloquear un doble clic: dos clics en el
  // mismo instante leen `procesando` en false antes del siguiente render.
  const pagandoRef = useRef(false);

  useEffect(() => {
    if (vigencia === "comprada") router.replace(rutaCompraConfirmacion(reservationId));
  }, [vigencia, reservationId, router]);

  if (!reservationId) return <Pantalla><SinCompraEnCurso /></Pantalla>;
  if (!reserva || !viaje) return <Pantalla><CompraInterrumpida reservationId={reservationId} /></Pantalla>;

  function volverAEmpezar() {
    purchase.olvidarReserva();
    router.push(
      `${RUTAS.compraAsientos}?${new URLSearchParams({
        viajeId: viaje!.viaje.id,
        pasajeros: String(purchase.pasajerosCount),
        origen: viaje!.origen,
        destino: viaje!.destino,
        fecha: viaje!.fecha,
      }).toString()}`,
    );
  }

  if (!purchase.pagoIniciado && (vigencia === "vencida" || vencidaAlPagar)) {
    return (
      <Pantalla>
        <ReservaVencida asientos={reserva.seats} onVolverAEmpezar={volverAEmpezar} />
      </Pantalla>
    );
  }

  function validar(): ErroresPago {
    const nuevos: ErroresPago = {};
    if (!metodo) nuevos.metodo = "Elige un método de pago";
    if (sustentarGasto) {
      if (!/^\d{11}$/.test(ruc.trim())) nuevos.ruc = "El RUC debe tener 11 dígitos";
      if (!nombre.trim()) nuevos.nombre = "Este campo es obligatorio";
      else if (nombre.trim().length > 120) nuevos.nombre = "Máximo 120 caracteres";
    }
    return nuevos;
  }

  async function pagar() {
    if (pagandoRef.current || purchase.pagoIniciado) return;
    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0 || !metodo) return;

    pagandoRef.current = true;
    setProcesando(true);
    try {
      await iniciarPago(reserva!.reservationId, {
        method: metodo,
        billTo: sustentarGasto ? { ruc: ruc.trim(), name: nombre.trim() } : null,
      });
      // Iniciar el pago NO confirma la compra: la confirma solo el webhook de
      // la pasarela en el backend. Desde aquí la pantalla de confirmación
      // espera y consulta el estado real.
      purchase.marcarPagoIniciado();
      router.push(rutaCompraConfirmacion(reserva!.reservationId));
    } catch (error) {
      pagandoRef.current = false;
      setProcesando(false);
      if (esReservaNoVigente(error)) return setVencidaAlPagar(true);
      const mensaje = mensajeCompra(error);
      showToast({ type: "error", title: mensaje.titulo, description: mensaje.descripcion });
      if (error instanceof ApiError && error.codigo === "PASSENGERS_REQUIRED") {
        router.push(rutaCompraDatos(reserva!.reservationId));
      }
    }
  }

  const salida = new Date(viaje.viaje.departsAt);
  const nombres = reserva.seats.map((_, i) => {
    const p = purchase.borradores[i];
    return p ? `${p.firstNames} ${p.lastNames}`.trim() : "";
  });

  return (
    <Pantalla>
      <h1 className="text-xl font-semibold text-navy sm:text-2xl">Pago</h1>
      <p className="mt-1 text-sm text-navy/70">Revisa tu compra y elige cómo quieres pagar.</p>

      <ReservationTimer
        restanteMs={restanteMs}
        verificando={vigencia === "verificando"}
        className="mt-4"
      />

      <PurchaseSummary
        origen={viaje.origen}
        destino={viaje.destino}
        terminalOrigen={viaje.terminalOrigen}
        salida={salida}
        asientos={reserva.seats}
        pasajeros={nombres}
        precioAsiento={reserva.priceBreakdown.unitPrice}
        total={reserva.totalAmount}
        className="mt-4"
      />

      {purchase.pagoIniciado ? (
        <div className="mt-4 flex flex-col gap-3 rounded-modal bg-white p-4 shadow-low sm:p-6">
          <p className="text-sm text-navy">
            Ya iniciaste el pago de esta reserva. Para no cobrarte dos veces, no se puede volver a
            pagar desde aquí.
          </p>
          <Button
            variant="secundario"
            onClick={() => router.push(rutaCompraConfirmacion(reserva.reservationId))}
            className="self-start"
          >
            Ver el estado de mi compra
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-col gap-4 rounded-modal bg-white p-4 shadow-low sm:p-6">
            <div>
              <h2 className="text-base font-semibold text-navy">Comprobante</h2>
              <p className="text-sm text-navy/70">
                El pasaje se emite como boleto de viaje, que es el comprobante del transporte de
                pasajeros. No se emite factura por un pasaje.
              </p>
            </div>
            <Checkbox
              label="Quiero que el boleto sustente el gasto de una empresa o persona con RUC"
              checked={sustentarGasto}
              onChange={(evento) => setSustentarGasto(evento.target.checked)}
            />
            {sustentarGasto && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="RUC"
                  inputMode="numeric"
                  value={ruc}
                  onChange={(evento) => setRuc(evento.target.value)}
                  errorText={errores.ruc}
                />
                <Input
                  label="Razón social o nombre"
                  value={nombre}
                  onChange={(evento) => setNombre(evento.target.value)}
                  errorText={errores.nombre}
                />
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-4 rounded-modal bg-white p-4 shadow-low sm:p-6">
            <PaymentMethodPicker value={metodo} onChange={setMetodo} errorText={errores.metodo} />
            <p className="text-sm text-navy/70">
              El pago se completa en la pasarela. Tu compra queda confirmada cuando la pasarela nos
              avisa que el pago se aprobó, no antes.
            </p>
            <Button isLoading={procesando} onClick={pagar} className="w-full sm:w-auto sm:self-end">
              Pagar {formatPrecio(Number(reserva.totalAmount))}
            </Button>
          </div>
        </>
      )}
    </Pantalla>
  );
}

function Pantalla({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <Stepper currentStep={4} className="mb-6" />
      {children}
    </main>
  );
}
