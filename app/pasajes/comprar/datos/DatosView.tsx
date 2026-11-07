"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/ui/Stepper";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import {
  PasajeroReservaForm,
  validarPasajeroReserva,
  type ErroresPasajeroReserva,
} from "@/components/pasajes/PasajeroReservaForm";
import { ReservationTimer } from "@/components/pasajes/ReservationTimer";
import {
  CompraInterrumpida,
  ReservaVencida,
  SinCompraEnCurso,
} from "@/components/pasajes/EstadosReserva";
import { useVigenciaReserva } from "@/components/pasajes/useVigenciaReserva";
import {
  PASAJERO_VACIO,
  usePurchase,
  type BorradorContacto,
  type BorradorPasajero,
} from "@/components/pasajes/PurchaseProvider";
import { useToast } from "@/components/ui/Toast";
import {
  esReservaNoVigente,
  guardarContacto,
  guardarPasajero,
  mensajeCompra,
} from "@/lib/api/compra";
import { RUTAS, rutaCompraConfirmacion, rutaCompraPago } from "@/lib/routes";
import { etiquetaAsiento } from "@/lib/asientos";

type ErroresContacto = Partial<Record<keyof BorradorContacto, string>>;

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarContacto(c: BorradorContacto): ErroresContacto {
  const errores: ErroresContacto = {};
  const correo = c.email.trim();
  const celular = c.phone.trim();
  if (!correo && !celular) errores.email = "Indica un correo o un celular para enviarte tus boletos";
  if (correo && !REGEX_CORREO.test(correo)) errores.email = "Ingresa un correo electrónico válido";
  if (celular && !/^\d{9}$/.test(celular)) errores.phone = "Debe contener exactamente 9 dígitos";
  if (c.whatsappOptIn && !celular) errores.phone = "Para recibir WhatsApp, indica tu celular";
  if (!c.dataAuthorization) errores.dataAuthorization = "Necesitamos esta declaración para emitir los boletos";
  return errores;
}

const sinErrores = (errores: object) => Object.keys(errores).length === 0;

export function DatosView({ reservationId }: { reservationId: string }) {
  const router = useRouter();
  const purchase = usePurchase();
  const { showToast } = useToast();
  const reserva = purchase.reserva?.reservationId === reservationId ? purchase.reserva : null;
  const viaje = purchase.viaje;
  const { restanteMs, vigencia } = useVigenciaReserva(
    reserva?.reservationId ?? null,
    reserva?.expiresAt ?? null,
  );

  const [erroresPasajeros, setErroresPasajeros] = useState<ErroresPasajeroReserva[]>([]);
  const [erroresContacto, setErroresContacto] = useState<ErroresContacto>({});
  const [enviando, setEnviando] = useState(false);
  const [editando, setEditando] = useState<string[]>([]);
  const [editandoContacto, setEditandoContacto] = useState(false);
  // Un guardado devolvió "reserva no vigente" antes de que la consulta
  // periódica lo notara: se trata igual que vencida.
  const [vencidaAlGuardar, setVencidaAlGuardar] = useState(false);
  const enviandoRef = useRef(false);

  useEffect(() => {
    if (vigencia === "comprada") router.replace(rutaCompraConfirmacion(reservationId));
  }, [vigencia, reservationId, router]);

  if (!reservationId) return <Pantalla><SinCompraEnCurso /></Pantalla>;
  if (!reserva || !viaje) return <Pantalla><CompraInterrumpida reservationId={reservationId} /></Pantalla>;

  const salida = new Date(viaje.viaje.departsAt);
  const borradores = reserva.seats.map((_, i) => purchase.borradores[i] ?? PASAJERO_VACIO);
  const necesitaPasajero = (seat: string) => editando.includes(seat) || !purchase.pasajerosGuardados.some((p) => p.seat === seat);
  const necesitaContacto = !purchase.contactoGuardado || editandoContacto;
  const hayCambios = necesitaContacto || reserva.seats.some(necesitaPasajero);

  function volverAEmpezar() {
    // Lo escrito queda en memoria y vuelve a aparecer con la nueva reserva.
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

  if (vigencia === "vencida" || vencidaAlGuardar) {
    return (
      <Pantalla>
        <ReservaVencida asientos={reserva.seats} onVolverAEmpezar={volverAEmpezar} />
      </Pantalla>
    );
  }

  function actualizarPasajero(indice: number, valor: BorradorPasajero) {
    purchase.setBorradores(borradores.map((p, i) => (i === indice ? valor : p)));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (enviandoRef.current) return;

    const nuevosErroresPasajeros = borradores.map((p, i) => necesitaPasajero(reserva!.seats[i]) ? validarPasajeroReserva(p, salida) : {});
    const nuevosErroresContacto = necesitaContacto ? validarContacto(purchase.contacto)
      : hayCambios && !purchase.contacto.dataAuthorization ? { dataAuthorization: "Necesitamos esta declaración para guardar los datos" } : {};
    setErroresPasajeros(nuevosErroresPasajeros);
    setErroresContacto(nuevosErroresContacto);
    if (!nuevosErroresPasajeros.every(sinErrores) || !sinErrores(nuevosErroresContacto)) return;

    enviandoRef.current = true;
    setEnviando(true);
    try {
      // Un PUT por asiento: el backend guarda y valida cada pasajero contra la
      // fecha del viaje. Ningún dato personal va en la URL, solo el asiento.
      const respuestas = await Promise.all(
        reserva!.seats.flatMap((seat, i) => {
          if (!necesitaPasajero(seat)) return [];
          const p = borradores[i];
          const menor = p.companionName.trim() || p.companionRelationship.trim();
          return guardarPasajero(reserva!.reservationId, seat, {
            documentType: p.documentType,
            documentNumber: p.documentNumber.trim(),
            firstNames: p.firstNames.trim(),
            lastNames: p.lastNames.trim(),
            birthDate: p.birthDate,
            companion: menor
              ? { name: p.companionName.trim(), relationship: p.companionRelationship.trim() }
              : null,
            dataAuthorization: true,
          });
        }),
      );
      const { email, phone, whatsappOptIn } = purchase.contacto;
      if (necesitaContacto) await guardarContacto(reserva!.reservationId, {
        email: email.trim() || null,
        phone: phone.trim() || null,
        whatsappOptIn,
      });
      // Son las vistas enmascaradas devueltas por los PUT, no documentos de un borrador.
      const guardados = new Map(purchase.pasajerosGuardados.map((p) => [p.seat, p]));
      const asientosEditados = reserva!.seats.filter(necesitaPasajero);
      respuestas.forEach((respuesta, i) => {
        const pasajero = respuesta.passengers.find((p) => p.seat === asientosEditados[i]);
        if (pasajero) guardados.set(pasajero.seat, pasajero);
      });
      purchase.registrarDatosGuardados([...guardados.values()], true);
      setEditando([]);
      setEditandoContacto(false);
      router.push(rutaCompraPago(reserva!.reservationId));
    } catch (error) {
      if (esReservaNoVigente(error)) {
        setVencidaAlGuardar(true);
      } else {
        const mensaje = mensajeCompra(error);
        showToast({ type: "error", title: mensaje.titulo, description: mensaje.descripcion });
      }
      enviandoRef.current = false;
      setEnviando(false);
    }
  }

  const contacto = purchase.contacto;
  function actualizarContacto<K extends keyof BorradorContacto>(campo: K, valor: BorradorContacto[K]) {
    purchase.setContacto({ ...contacto, [campo]: valor });
  }

  return (
    <Pantalla>
      <h1 className="text-xl font-semibold text-navy sm:text-2xl">Datos de los pasajeros</h1>
      <p className="mt-1 text-sm text-navy/70">
        {viaje.origen} → {viaje.destino} · Completa los pasajeros pendientes tal como figuran en su documento. Los datos guardados se conservan en el servidor; lo que aún no enviaste debe ingresarse de nuevo al recargar.
      </p>

      <ReservationTimer
        restanteMs={restanteMs}
        verificando={vigencia === "verificando"}
        className="mt-4"
      />

      <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-4">
        {reserva.seats.map((seat, indice) => {
          const guardado = purchase.pasajerosGuardados.find((p) => p.seat === seat);
          if (guardado && !necesitaPasajero(seat)) return (
            <Card key={seat} className="flex flex-col gap-3">
              <h2 className="text-base font-semibold text-navy">Pasajero · Asiento {etiquetaAsiento(seat)}</h2>
              <p className="text-sm text-navy">{guardado.firstNames} {guardado.lastNames} · {guardado.documentType.toUpperCase()} {guardado.documentNumberMasked}</p>
              <p className="text-sm text-text-secondary">Datos guardados. Por privacidad, el documento completo, nacimiento y acompañante no se muestran al volver. Puedes continuar con los datos del servidor.</p>
              {guardado.infantInArms && <p className="text-sm text-text-secondary">Incluye un menor en brazos con datos guardados.</p>}
              <Button type="button" variant="secundario" className="self-start" onClick={() => {
                actualizarPasajero(indice, { ...PASAJERO_VACIO });
                setEditando((actual) => [...actual, seat]);
              }}>Cambiar datos del asiento {etiquetaAsiento(seat)}</Button>
            </Card>
          );
          return <div key={seat} className="flex flex-col gap-3">
          {guardado && <p className="text-sm text-text-secondary">Para reemplazar los datos guardados, ingresa nuevamente todos los campos del pasajero.</p>}
          <PasajeroReservaForm
            indice={indice}
            asiento={seat}
            valor={borradores[indice]}
            errores={erroresPasajeros[indice]}
            salida={salida}
            onChange={(valor) => actualizarPasajero(indice, valor)}
          />
          {guardado && <Button type="button" variant="terciario" className="self-start" onClick={() => setEditando((actual) => actual.filter((s) => s !== seat))}>Conservar datos guardados</Button>}
          </div>;
        })}

        <Card className="flex flex-col gap-4">
          {!necesitaContacto ? <>
            <h2 className="text-base font-semibold text-navy">Contacto guardado</h2>
            <p className="text-sm text-text-secondary">Tus boletos se enviarán al contacto registrado. Por privacidad, no se muestra al volver.</p>
            <Button type="button" variant="secundario" className="self-start" onClick={() => setEditandoContacto(true)}>Cambiar contacto</Button>
          </> : <>
          <div>
            <h2 className="text-base font-semibold text-navy">¿A dónde te enviamos los boletos?</h2>
            <p className="text-sm text-navy/70">Un correo, un celular o ambos.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Correo electrónico"
              type="email"
              autoComplete="email"
              value={contacto.email}
              onChange={(evento) => actualizarContacto("email", evento.target.value)}
              errorText={erroresContacto.email}
            />
            <Input
              label="Celular"
              inputMode="numeric"
              autoComplete="tel-national"
              value={contacto.phone}
              onChange={(evento) => actualizarContacto("phone", evento.target.value)}
              helperText="9 dígitos"
              errorText={erroresContacto.phone}
            />
          </div>
          <Checkbox
            label="Acepto recibir por WhatsApp mensajes de Ecosem H sobre esta compra y este viaje."
            checked={contacto.whatsappOptIn}
            onChange={(evento) => actualizarContacto("whatsappOptIn", evento.target.checked)}
          />
          {purchase.contactoGuardado && <Button type="button" variant="terciario" className="self-start" onClick={() => setEditandoContacto(false)}>Conservar contacto guardado</Button>}
          </>}
          {hayCambios && <Checkbox
            label={
              <>
                Declaro que tengo autorización de cada pasajero para registrar sus datos personales
                para este viaje, conforme a la Ley 29733 y la{" "}
                <Link href={RUTAS.privacidad} className="font-medium text-secondary underline">
                  Política de privacidad
                </Link>
                .
              </>
            }
            checked={contacto.dataAuthorization}
            onChange={(evento) => actualizarContacto("dataAuthorization", evento.target.checked)}
            errorText={erroresContacto.dataAuthorization}
          />}
        </Card>

        <Button type="submit" isLoading={enviando} className="min-w-40 self-end">
          Continuar
        </Button>
      </form>
    </Pantalla>
  );
}

function Pantalla({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <Stepper currentStep={3} className="mb-6" />
      {children}
    </main>
  );
}
