"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/ui/Stepper";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PassengerForm, type ErroresPasajero } from "@/components/pasajes/PassengerForm";
import { ReservationTimer } from "@/components/pasajes/ReservationTimer";
import { usePurchase } from "@/components/pasajes/PurchaseProvider";
import type { DatosPasajero } from "@/components/pasajes/PurchaseProvider";
import { useToast } from "@/components/ui/Toast";
import { SearchOffIcon } from "@/components/ui/icons";
import { RUTAS } from "@/lib/routes";

const PASAJERO_VACIO: DatosPasajero = {
  tipoDocumento: "dni",
  numeroDocumento: "",
  nombres: "",
  correo: "",
  celular: "",
  equipajeKg: "",
};

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarPasajero(datos: DatosPasajero): ErroresPasajero {
  const errores: ErroresPasajero = {};

  if (!datos.numeroDocumento) {
    errores.numeroDocumento = "Este campo es obligatorio";
  } else if (datos.tipoDocumento === "dni" && !/^\d{8}$/.test(datos.numeroDocumento)) {
    errores.numeroDocumento = "El DNI debe tener 8 dígitos";
  }

  if (!datos.nombres) errores.nombres = "Este campo es obligatorio";

  if (!datos.correo) {
    errores.correo = "Este campo es obligatorio";
  } else if (!REGEX_CORREO.test(datos.correo)) {
    errores.correo = "Ingrese un correo electrónico válido";
  }

  if (!datos.celular) {
    errores.celular = "Este campo es obligatorio";
  } else if (!/^\d{9}$/.test(datos.celular)) {
    errores.celular = "Debe contener exactamente 9 dígitos";
  }

  return errores;
}

export function DatosView() {
  const router = useRouter();
  const purchase = usePurchase();
  const { showToast } = useToast();

  const [pasajeros, setPasajeros] = useState<DatosPasajero[]>(() =>
    Array.from(
      { length: purchase.pasajerosCount },
      (_, i) => purchase.datosPasajeros[i] ?? PASAJERO_VACIO
    )
  );
  const [errores, setErrores] = useState<ErroresPasajero[]>([]);

  // Si se llegó directo a esta URL (o se recargó) sin haber completado la
  // selección de asientos, se vuelve a esa pantalla en vez de mostrar un
  // formulario sin base.
  useEffect(() => {
    if (!purchase.viaje) return;
    if (purchase.asientos.length !== purchase.pasajerosCount) {
      router.replace(
        `${RUTAS.compraAsientos}?viajeId=${encodeURIComponent(purchase.viaje.id)}&pasajeros=${purchase.pasajerosCount}`
      );
    }
  }, [purchase.viaje, purchase.asientos.length, purchase.pasajerosCount, router]);

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

  if (purchase.asientos.length !== purchase.pasajerosCount) {
    // El efecto de arriba ya está redirigiendo a la selección de asientos.
    return null;
  }

  function actualizarPasajero(indice: number, valor: DatosPasajero) {
    setPasajeros((prev) => prev.map((p, i) => (i === indice ? valor : p)));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nuevosErrores = pasajeros.map(validarPasajero);
    setErrores(nuevosErrores);
    if (nuevosErrores.some((error) => Object.keys(error).length > 0)) return;

    purchase.setDatosPasajeros(pasajeros);
    router.push(RUTAS.compraPago);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <Stepper currentStep={3} className="mb-6" />

      <h1 className="text-xl font-semibold text-navy sm:text-2xl">Datos de los pasajeros</h1>
      <p className="mt-1 text-sm text-navy/70">
        {purchase.viaje.origen} → {purchase.viaje.destino} · Ingresa los datos de cada pasajero tal
        como figuran en su documento.
      </p>

      <ReservationTimer expiraEn={purchase.reservaExpiraEn} onExpire={manejarExpiracion} className="mt-4" />

      <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-4">
        {pasajeros.map((pasajero, indice) => (
          <PassengerForm
            key={purchase.asientos[indice]}
            indice={indice}
            asientoId={purchase.asientos[indice]}
            valor={pasajero}
            errores={errores[indice]}
            onChange={(valor) => actualizarPasajero(indice, valor)}
          />
        ))}

        <Button type="submit" className="min-w-40 self-end">
          Continuar
        </Button>
      </form>
    </main>
  );
}
