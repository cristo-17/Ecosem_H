"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/ui/Stepper";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, type SelectOption } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { PurchaseSummary } from "@/components/pasajes/PurchaseSummary";
import { PaymentMethodPicker } from "@/components/pasajes/PaymentMethodPicker";
import { QrPlaceholder } from "@/components/pasajes/QrPlaceholder";
import { ReservationTimer } from "@/components/pasajes/ReservationTimer";
import { usePurchase } from "@/components/pasajes/PurchaseProvider";
import type { MetodoPago, TipoComprobante } from "@/components/pasajes/PurchaseProvider";
import { useToast } from "@/components/ui/Toast";
import { SearchOffIcon } from "@/components/ui/icons";
import { formatPrecio } from "@/lib/format";
import { RUTAS } from "@/lib/routes";

const OPCIONES_COMPROBANTE: SelectOption[] = [
  { value: "boleta", label: "Boleta" },
  { value: "factura", label: "Factura" },
];

interface ErroresPago {
  comprobante?: string;
  ruc?: string;
  razonSocial?: string;
  metodo?: string;
  numeroTarjeta?: string;
  vencimiento?: string;
  cvv?: string;
  titular?: string;
}

export interface PagoViewProps {
  simularError: boolean;
}

export function PagoView({ simularError }: PagoViewProps) {
  const router = useRouter();
  const purchase = usePurchase();
  const { showToast } = useToast();

  const [tipoComprobante, setTipoComprobante] = useState<TipoComprobante>("boleta");
  const [ruc, setRuc] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [metodo, setMetodo] = useState<MetodoPago | null>(null);
  const [numeroTarjeta, setNumeroTarjeta] = useState("");
  const [vencimiento, setVencimiento] = useState("");
  const [cvv, setCvv] = useState("");
  const [titular, setTitular] = useState("");
  const [errores, setErrores] = useState<ErroresPago>({});
  const [procesando, setProcesando] = useState(false);

  // Si falta el paso anterior (datos de pasajeros incompletos, o se
  // recargó la página), se vuelve a ese paso en vez de mostrar un pago
  // sin datos que cobrar.
  useEffect(() => {
    if (!purchase.viaje) return;
    if (
      purchase.asientos.length !== purchase.pasajerosCount ||
      purchase.datosPasajeros.length !== purchase.pasajerosCount
    ) {
      router.replace(RUTAS.compraDatos);
    }
  }, [purchase.viaje, purchase.asientos.length, purchase.datosPasajeros.length, purchase.pasajerosCount, router]);

  function manejarExpiracion() {
    const viaje = purchase.viaje;
    const rutaVuelta = viaje
      ? `${RUTAS.resultadosPasajes}?origen=${encodeURIComponent(viaje.origen)}&destino=${encodeURIComponent(viaje.destino)}`
      : RUTAS.inicio;
    showToast({
      type: "error",
      title: "Tu reserva expiró",
      description: "Los asientos que elegiste fueron liberados. Vuelve a intentarlo.",
    });
    purchase.reiniciar();
    router.push(rutaVuelta);
  }

  if (!purchase.viaje) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          icon={<SearchOffIcon />}
          title="No hay una compra en curso"
          description="Busca un viaje para empezar a reservar tus pasajes."
          actionLabel="Buscar pasajes"
          onAction={() => router.push(RUTAS.inicio)}
        />
      </main>
    );
  }

  if (
    purchase.asientos.length !== purchase.pasajerosCount ||
    purchase.datosPasajeros.length !== purchase.pasajerosCount
  ) {
    return null;
  }

  const total = purchase.viaje.precio * purchase.pasajerosCount;

  function validar(): ErroresPago {
    const nuevosErrores: ErroresPago = {};
    if (tipoComprobante === "factura") {
      if (!ruc) nuevosErrores.ruc = "Este campo es obligatorio";
      else if (!/^\d{11}$/.test(ruc)) nuevosErrores.ruc = "El RUC debe tener 11 dígitos";
      if (!razonSocial) nuevosErrores.razonSocial = "Este campo es obligatorio";
    }
    if (!metodo) {
      nuevosErrores.metodo = "Elige un método de pago";
    } else if (metodo === "tarjeta") {
      if (!/^\d{16}$/.test(numeroTarjeta)) nuevosErrores.numeroTarjeta = "Ingresa los 16 dígitos de la tarjeta";
      if (!/^\d{2}\/\d{2}$/.test(vencimiento)) nuevosErrores.vencimiento = "Formato MM/AA";
      if (!/^\d{3}$/.test(cvv)) nuevosErrores.cvv = "3 dígitos";
      if (!titular) nuevosErrores.titular = "Este campo es obligatorio";
    }
    return nuevosErrores;
  }

  function confirmarPago() {
    const nuevosErrores = validar();
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0 || !metodo) return;

    setProcesando(true);
    // La compra nunca se confirma desde la respuesta del navegador
    // (CLAUDE.md): en producción esto espera el webhook de la pasarela.
    // Sin pasarela real, se simula esa espera con un timeout.
    setTimeout(() => {
      if (simularError) {
        setProcesando(false);
        showToast({
          type: "error",
          title: "Pago rechazado",
          description: "Tu banco o billetera rechazó la operación. Intenta con otro método.",
        });
        return;
      }
      purchase.confirmarCompra(
        { tipo: tipoComprobante, ruc: tipoComprobante === "factura" ? ruc : "", razonSocial: tipoComprobante === "factura" ? razonSocial : "" },
        metodo
      );
      router.push(RUTAS.compraConfirmacion);
    }, 1200);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <Stepper currentStep={4} className="mb-6" />

      <h1 className="text-xl font-semibold text-navy sm:text-2xl">Pago</h1>
      <p className="mt-1 text-sm text-navy/70">Revisa tu compra y elige cómo quieres pagar.</p>

      <ReservationTimer expiraEn={purchase.reservaExpiraEn} onExpire={manejarExpiracion} className="mt-4" />

      <PurchaseSummary
        viaje={purchase.viaje}
        asientos={purchase.asientos}
        pasajeros={purchase.datosPasajeros}
        className="mt-4"
      />

      <div className="mt-4 flex flex-col gap-4 rounded-modal bg-white p-4 shadow-low sm:p-6">
        <h2 className="text-base font-semibold text-navy">Comprobante</h2>
        <Select
          label="Tipo de comprobante"
          options={OPCIONES_COMPROBANTE}
          value={tipoComprobante}
          onChange={(valor) => setTipoComprobante(valor as TipoComprobante)}
        />
        {tipoComprobante === "factura" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="RUC"
              inputMode="numeric"
              value={ruc}
              onChange={(evento) => setRuc(evento.target.value)}
              errorText={errores.ruc}
            />
            <Input
              label="Razón social"
              value={razonSocial}
              onChange={(evento) => setRazonSocial(evento.target.value)}
              errorText={errores.razonSocial}
            />
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-4 rounded-modal bg-white p-4 shadow-low sm:p-6">
        <PaymentMethodPicker value={metodo} onChange={setMetodo} errorText={errores.metodo} />

        {(metodo === "yape" || metodo === "plin") && (
          <div className="flex flex-col items-center gap-3 border-t border-navy/10 pt-4 text-center">
            <QrPlaceholder semilla={`${metodo}-${purchase.viaje.id}-${total}`} />
            <p className="max-w-xs text-sm text-navy/70">
              Escanea el código con tu app {metodo === "yape" ? "Yape" : "Plin"} y confirma el pago de{" "}
              <span className="font-semibold text-navy">{formatPrecio(total)}</span>.
            </p>
            <Button isLoading={procesando} onClick={confirmarPago} className="w-full sm:w-auto">
              Ya pagué
            </Button>
          </div>
        )}

        {metodo === "tarjeta" && (
          <div className="flex flex-col gap-4 border-t border-navy/10 pt-4">
            <Input
              label="Número de tarjeta"
              inputMode="numeric"
              value={numeroTarjeta}
              onChange={(evento) => setNumeroTarjeta(evento.target.value)}
              errorText={errores.numeroTarjeta}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Vencimiento (MM/AA)"
                placeholder="MM/AA"
                value={vencimiento}
                onChange={(evento) => setVencimiento(evento.target.value)}
                errorText={errores.vencimiento}
              />
              <Input
                label="CVV"
                inputMode="numeric"
                value={cvv}
                onChange={(evento) => setCvv(evento.target.value)}
                errorText={errores.cvv}
              />
            </div>
            <Input
              label="Nombre del titular"
              value={titular}
              onChange={(evento) => setTitular(evento.target.value)}
              errorText={errores.titular}
            />
            <Button isLoading={procesando} onClick={confirmarPago} className="self-end min-w-40">
              Pagar {formatPrecio(total)}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
