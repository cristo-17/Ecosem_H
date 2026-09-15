"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TripCard } from "@/components/ui/TripCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SeatMap } from "@/components/pasajes/SeatMap";
import { PassengerForm, type ErroresPasajero } from "@/components/pasajes/PassengerForm";
import { PassengerStepper } from "@/components/home/PassengerStepper";
import { CheckIcon, SearchOffIcon, TicketIcon } from "@/components/ui/icons";
import {
  OPCIONES_CIUDAD,
  buscarViajes,
  labelTipoAsiento,
  terminalDe,
  type Ciudad,
  type Viaje,
} from "@/lib/mock/viajes";
import { distribucionBus, generarAsientos, type Asiento } from "@/lib/mock/asientos";
import { OPCIONES_MEDIO_PAGO, type MedioPago } from "@/lib/mock/caja";
import type { DatosPasajero, TipoComprobante } from "@/components/pasajes/PurchaseProvider";
import { descargarBoletoPdf, type BoletoPdfData } from "@/lib/pdf/boleto";
import { maskDocumento, formatPrecio, formatHora12, formatDuracion } from "@/lib/format";

type Paso = "buscar" | "resultados" | "asientos" | "datos" | "confirmado";

const OPCIONES_COMPROBANTE = [
  { value: "boleta", label: "Boleta" },
  { value: "factura", label: "Factura" },
];

const PASAJERO_VACIO: DatosPasajero = {
  tipoDocumento: "dni",
  numeroDocumento: "",
  nombres: "",
  correo: "",
  celular: "",
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

function generarCodigoBoleto(): string {
  return `ECH-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
}

function etiquetaAsiento(id: string): string {
  return id.replace(/^P\d-/, "");
}

interface ErroresBusqueda {
  origen?: string;
  destino?: string;
  fecha?: string;
}

interface ErroresPago {
  ruc?: string;
  razonSocial?: string;
  medioPago?: string;
}

const hoy = new Date();

export function VentaView() {
  const [paso, setPaso] = useState<Paso>("buscar");

  // Paso 1: búsqueda
  const [origen, setOrigen] = useState<string | null>(null);
  const [destino, setDestino] = useState<string | null>(null);
  const [fecha, setFecha] = useState<Date | null>(null);
  const [pasajerosCount, setPasajerosCount] = useState(1);
  const [erroresBusqueda, setErroresBusqueda] = useState<ErroresBusqueda>({});
  const [resultados, setResultados] = useState<Viaje[]>([]);

  // Paso 2/3: viaje + asientos
  const [viaje, setViaje] = useState<Viaje | null>(null);
  const [asientosSeleccionados, setAsientosSeleccionados] = useState<string[]>([]);

  // Paso 4: datos, comprobante y pago
  const [pasajeros, setPasajeros] = useState<DatosPasajero[]>([]);
  const [erroresPasajeros, setErroresPasajeros] = useState<ErroresPasajero[]>([]);
  const [tipoComprobante, setTipoComprobante] = useState<TipoComprobante>("boleta");
  const [ruc, setRuc] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [medioPago, setMedioPago] = useState<MedioPago | null>(null);
  const [erroresPago, setErroresPago] = useState<ErroresPago>({});
  const [procesando, setProcesando] = useState(false);

  // Paso 5: confirmación
  const [codigo, setCodigo] = useState("");
  const [boletoPdf, setBoletoPdf] = useState<BoletoPdfData | null>(null);

  const opcionesDestino = OPCIONES_CIUDAD.filter((opcion) => opcion.value !== origen);
  const distribucion = useMemo(() => (viaje ? distribucionBus(viaje.tipoAsiento) : []), [viaje]);
  const asientosViaje = useMemo(() => (viaje ? generarAsientos(viaje) : []), [viaje]);

  function buscar(event: FormEvent) {
    event.preventDefault();

    const errores: ErroresBusqueda = {};
    if (!origen) errores.origen = "Elige una agencia de origen";
    if (!destino) errores.destino = "Elige un destino";
    if (origen && destino && origen === destino) {
      errores.destino = "El destino debe ser distinto al origen";
    }
    if (!fecha) errores.fecha = "Elige una fecha";

    setErroresBusqueda(errores);
    if (Object.keys(errores).length > 0) return;

    setResultados(buscarViajes(origen as Ciudad, destino as Ciudad));
    setPaso("resultados");
  }

  function elegirViaje(viajeElegido: Viaje) {
    setViaje(viajeElegido);
    setAsientosSeleccionados([]);
    setPasajeros(Array.from({ length: pasajerosCount }, () => PASAJERO_VACIO));
    setErroresPasajeros([]);
    setPaso("asientos");
  }

  function alternarAsiento(asiento: Asiento) {
    const yaElegido = asientosSeleccionados.includes(asiento.id);
    if (yaElegido) {
      setAsientosSeleccionados((prev) => prev.filter((id) => id !== asiento.id));
      return;
    }
    if (asiento.estado !== "libre") return;
    if (asientosSeleccionados.length >= pasajerosCount) return;
    setAsientosSeleccionados((prev) => [...prev, asiento.id]);
  }

  function actualizarPasajero(indice: number, valor: DatosPasajero) {
    setPasajeros((prev) => prev.map((p, i) => (i === indice ? valor : p)));
  }

  async function confirmarVenta() {
    if (!viaje) return;

    const nuevosErroresPasajeros = pasajeros.map(validarPasajero);
    const nuevosErroresPago: ErroresPago = {};
    if (tipoComprobante === "factura") {
      if (!ruc) nuevosErroresPago.ruc = "Este campo es obligatorio";
      else if (!/^\d{11}$/.test(ruc)) nuevosErroresPago.ruc = "El RUC debe tener 11 dígitos";
      if (!razonSocial) nuevosErroresPago.razonSocial = "Este campo es obligatorio";
    }
    if (!medioPago) nuevosErroresPago.medioPago = "Elige un medio de pago";

    setErroresPasajeros(nuevosErroresPasajeros);
    setErroresPago(nuevosErroresPago);
    const hayErrorPasajeros = nuevosErroresPasajeros.some((error) => Object.keys(error).length > 0);
    if (hayErrorPasajeros || Object.keys(nuevosErroresPago).length > 0 || !medioPago) return;

    const nuevoCodigo = generarCodigoBoleto();
    const datosPdf: BoletoPdfData = {
      codigo: nuevoCodigo,
      emitidoEn: new Date(),
      origen: viaje.origen,
      destino: viaje.destino,
      terminalOrigen: viaje.terminalOrigen,
      terminalDestino: terminalDe(viaje.destino),
      horaSalida: viaje.horaSalida,
      tipoServicio: labelTipoAsiento(viaje.tipoAsiento),
      asientos: asientosSeleccionados.map(etiquetaAsiento),
      pasajeros: pasajeros.map((pasajero) => ({
        nombre: pasajero.nombres,
        documentoEnmascarado: maskDocumento(pasajero.numeroDocumento),
      })),
      totalSoles: viaje.precio * pasajerosCount,
      comprobante:
        tipoComprobante === "factura" ? { tipo: "factura", ruc, razonSocial } : { tipo: "boleta" },
    };

    setProcesando(true);
    try {
      // Mismo generador que la venta web (lib/pdf/boleto.ts): un solo PDF,
      // no dos implementaciones distintas para el mismo boleto.
      await descargarBoletoPdf(datosPdf);
      setCodigo(nuevoCodigo);
      setBoletoPdf(datosPdf);
      setPaso("confirmado");
    } finally {
      setProcesando(false);
    }
  }

  function nuevaVenta() {
    setPaso("buscar");
    setOrigen(null);
    setDestino(null);
    setFecha(null);
    setPasajerosCount(1);
    setErroresBusqueda({});
    setResultados([]);
    setViaje(null);
    setAsientosSeleccionados([]);
    setPasajeros([]);
    setErroresPasajeros([]);
    setTipoComprobante("boleta");
    setRuc("");
    setRazonSocial("");
    setMedioPago(null);
    setErroresPago({});
    setCodigo("");
    setBoletoPdf(null);
  }

  const listoParaContinuarAsientos = asientosSeleccionados.length === pasajerosCount;
  const total = viaje ? viaje.precio * pasajerosCount : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-navy sm:text-2xl">Venta en counter</h1>
        <p className="mt-1 text-sm text-navy/70">
          Busca el viaje, elige asiento y cobra un pasaje presencial. Genera el mismo boleto en PDF
          que la venta web.
        </p>
      </div>

      {paso === "buscar" && (
        <form onSubmit={buscar} noValidate>
          <Card className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Origen"
                options={OPCIONES_CIUDAD}
                value={origen}
                onChange={(valor) => {
                  setOrigen(valor);
                  if (destino === valor) setDestino(null);
                }}
                placeholder="Ciudad"
                errorText={erroresBusqueda.origen}
              />
              <Select
                label="Destino"
                options={opcionesDestino}
                value={destino}
                onChange={setDestino}
                placeholder="Ciudad"
                errorText={erroresBusqueda.destino}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DatePicker
                label="Fecha de viaje"
                value={fecha}
                onChange={setFecha}
                minDate={hoy}
                errorText={erroresBusqueda.fecha}
              />
              <PassengerStepper value={pasajerosCount} onChange={setPasajerosCount} />
            </div>

            <Button type="submit" className="self-start">
              Buscar
            </Button>
          </Card>
        </form>
      )}

      {paso === "resultados" && (
        <div className="flex flex-col gap-4">
          <Button variant="terciario" className="self-start" onClick={() => setPaso("buscar")}>
            ← Modificar búsqueda
          </Button>

          {resultados.length === 0 ? (
            <EmptyState
              icon={<SearchOffIcon />}
              title="No hay viajes para esta ruta"
              description="Prueba con otro origen o destino."
              actionLabel="Modificar búsqueda"
              onAction={() => setPaso("buscar")}
            />
          ) : (
            resultados.map((viajeResultado) => (
              <TripCard
                key={viajeResultado.id}
                marca={viajeResultado.marca}
                terminalOrigen={viajeResultado.terminalOrigen}
                destino={viajeResultado.destino}
                horaSalida={viajeResultado.horaSalida}
                horaLlegada={viajeResultado.horaLlegada}
                duracionMinutos={viajeResultado.duracionMinutos}
                asientosDisponibles={viajeResultado.asientosDisponibles}
                tipoAsiento={labelTipoAsiento(viajeResultado.tipoAsiento)}
                precio={viajeResultado.precio}
                selected={viaje?.id === viajeResultado.id}
                onSeleccionar={() => elegirViaje(viajeResultado)}
              />
            ))
          )}
        </div>
      )}

      {paso === "asientos" && viaje && (
        <div className="flex flex-col gap-4">
          <Button variant="terciario" className="self-start" onClick={() => setPaso("resultados")}>
            ← Cambiar viaje
          </Button>

          <p className="text-sm text-navy/70">
            {viaje.origen} → {viaje.destino} · {formatHora12(viaje.horaSalida)} ·{" "}
            {formatDuracion(viaje.duracionMinutos)} · Elige{" "}
            {pasajerosCount === 1 ? "1 asiento" : `${pasajerosCount} asientos`} (
            {asientosSeleccionados.length}/{pasajerosCount})
          </p>

          <SeatMap
            distribucion={distribucion}
            asientos={asientosViaje}
            seleccionados={asientosSeleccionados}
            onToggle={alternarAsiento}
          />

          <div className="flex items-center justify-between rounded-modal bg-white p-4 shadow-low">
            <div>
              <p className="text-xs text-navy/60">Total</p>
              <p className="text-lg font-bold text-navy">{formatPrecio(total)}</p>
            </div>
            <Button
              disabled={!listoParaContinuarAsientos}
              onClick={() => setPaso("datos")}
              className="min-w-40"
            >
              Continuar
            </Button>
          </div>
        </div>
      )}

      {paso === "datos" && viaje && (
        <div className="flex flex-col gap-4">
          <Button variant="terciario" className="self-start" onClick={() => setPaso("asientos")}>
            ← Cambiar asientos
          </Button>

          {pasajeros.map((pasajero, indice) => (
            <PassengerForm
              key={asientosSeleccionados[indice]}
              indice={indice}
              asientoId={asientosSeleccionados[indice]}
              valor={pasajero}
              errores={erroresPasajeros[indice]}
              onChange={(valor) => actualizarPasajero(indice, valor)}
            />
          ))}

          <Card className="flex flex-col gap-4">
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
                  errorText={erroresPago.ruc}
                />
                <Input
                  label="Razón social"
                  value={razonSocial}
                  onChange={(evento) => setRazonSocial(evento.target.value)}
                  errorText={erroresPago.razonSocial}
                />
              </div>
            )}
          </Card>

          <Card className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-navy">Medio de pago</h2>
            <Select
              label="Medio de pago"
              options={OPCIONES_MEDIO_PAGO}
              value={medioPago}
              onChange={(valor) => setMedioPago(valor as MedioPago)}
              placeholder="Elige un medio de pago"
              errorText={erroresPago.medioPago}
            />
          </Card>

          <div className="flex items-center justify-between rounded-modal bg-white p-4 shadow-low">
            <div>
              <p className="text-xs text-navy/60">Total a cobrar</p>
              <p className="text-lg font-bold text-navy">{formatPrecio(total)}</p>
            </div>
            <Button isLoading={procesando} onClick={confirmarVenta} className="min-w-40">
              Confirmar venta
            </Button>
          </div>
        </div>
      )}

      {paso === "confirmado" && boletoPdf && (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-success-fill">
            <CheckIcon className="!size-6 text-success-text" />
          </span>
          <h2 className="text-xl font-semibold text-navy">Venta registrada</h2>
          <p className="max-w-sm text-sm text-navy/70">
            Código <span className="font-semibold text-navy">{codigo}</span>. El PDF del boleto se
            descargó automáticamente.
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Button variant="secundario" onClick={() => descargarBoletoPdf(boletoPdf)}>
              <TicketIcon />
              Volver a descargar PDF
            </Button>
            <Button onClick={nuevaVenta}>Nueva venta</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
