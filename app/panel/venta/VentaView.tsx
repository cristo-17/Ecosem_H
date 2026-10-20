"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Select, type SelectOption } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { TripCard } from "@/components/ui/TripCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonShape } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { SeatMap } from "@/components/pasajes/SeatMap";
import {
  PasajeroReservaForm,
  validarPasajeroReserva,
  type ErroresPasajeroReserva,
} from "@/components/pasajes/PasajeroReservaForm";
import { PASAJERO_VACIO, type BorradorPasajero } from "@/components/pasajes/PurchaseProvider";
import { PassengerStepper } from "@/components/home/PassengerStepper";
import { CheckIcon, ClockIcon, ExclamationIcon, SearchOffIcon } from "@/components/ui/icons";
import { ApiError } from "@/lib/api/cliente";
import { esSesionVencida } from "@/lib/api/cuenta";
import { obtenerPlano, type MensajeError } from "@/lib/api/compra";
import {
  arqueoTurnoActual,
  esSinTurno,
  leerMonto,
  mensajeCaja,
  venderEnEfectivo,
  ventaPudoRegistrarse,
  type VentaEfectivo,
} from "@/lib/api/caja";
import {
  buscarViajes,
  ciudadesConRuta,
  fechaParaBusqueda,
  obtenerCatalogo,
  type CiudadesConRuta,
  type ViajeEncontrado,
} from "@/lib/api/ventas";
import { etiquetaAsiento, planoDesdeApi, type Asiento, type DistribucionPiso } from "@/lib/asientos";
import { labelTipoAsiento } from "@/lib/mock/viajes";
import { formatFechaLarga, formatHora12, formatPrecio } from "@/lib/format";
import { RUTAS } from "@/lib/routes";

const MARCA = "Ecosem H";

type Turno =
  | { tipo: "cargando" }
  | { tipo: "abierto" }
  | { tipo: "sin-turno" }
  | { tipo: "sesion-vencida" }
  | { tipo: "error"; mensaje: MensajeError };

type Paso =
  | { tipo: "buscar" }
  | { tipo: "resultados"; carga: "cargando" | "listo" | "error"; viajes: ViajeEncontrado[]; existeRuta: boolean }
  | { tipo: "asientos" }
  | { tipo: "datos" }
  | { tipo: "incierta" }
  | { tipo: "confirmado"; venta: VentaEfectivo; recibido: number };

type Plano =
  | { tipo: "cargando" }
  | { tipo: "error" }
  | { tipo: "listo"; distribucion: DistribucionPiso[]; asientos: Asiento[] };

interface ErroresCobro {
  recibido?: string;
  autorizacion?: string;
  ruc?: string;
  nombre?: string;
}

const sinErrores = (errores: object) => Object.keys(errores).length === 0;
const aOpciones = (ciudades: string[]): SelectOption[] => ciudades.map((c) => ({ value: c, label: c }));
const hoy = new Date();

/**
 * Venta presencial con cobro en efectivo contra svc-ventas.
 *
 * No hay reserva previa ni temporizador: el asiento, el cobro y la compra se
 * confirman en una sola transacción del backend (`POST /v1/caja/ventas`), que
 * además bloquea el turno del operador para que la venta entre a su arqueo.
 * Por eso no se envía nada hasta "Cobrar y vender", y si alguien toma el
 * asiento mientras tanto la venta se rechaza entera.
 */
export function VentaView() {
  const router = useRouter();
  const { showToast } = useToast();

  const [turno, setTurno] = useState<Turno>({ tipo: "cargando" });
  const [intentoTurno, setIntentoTurno] = useState(0);
  const [ciudades, setCiudades] = useState<CiudadesConRuta | null>(null);

  const [paso, setPaso] = useState<Paso>({ tipo: "buscar" });
  const [origen, setOrigen] = useState<string | null>(null);
  const [destino, setDestino] = useState<string | null>(null);
  const [fecha, setFecha] = useState<Date | null>(null);
  const [pasajerosCount, setPasajerosCount] = useState(1);
  const [erroresBusqueda, setErroresBusqueda] = useState<{ origen?: string; destino?: string; fecha?: string }>({});

  const [viaje, setViaje] = useState<ViajeEncontrado | null>(null);
  const [plano, setPlano] = useState<Plano>({ tipo: "cargando" });
  const [intentoPlano, setIntentoPlano] = useState(0);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);

  const [borradores, setBorradores] = useState<BorradorPasajero[]>([]);
  const [erroresPasajeros, setErroresPasajeros] = useState<ErroresPasajeroReserva[]>([]);
  const [autorizacion, setAutorizacion] = useState(false);
  const [sustentarGasto, setSustentarGasto] = useState(false);
  const [ruc, setRuc] = useState("");
  const [nombreRuc, setNombreRuc] = useState("");
  const [recibido, setRecibido] = useState("");
  const [erroresCobro, setErroresCobro] = useState<ErroresCobro>({});
  const [vendiendo, setVendiendo] = useState(false);
  const vendiendoRef = useRef(false);

  // Sin turno abierto el backend rechaza el cobro: se avisa antes de empezar.
  useEffect(() => {
    const controlador = new AbortController();
    arqueoTurnoActual({ signal: controlador.signal }).then(
      () => !controlador.signal.aborted && setTurno({ tipo: "abierto" }),
      (error: unknown) => {
        if (controlador.signal.aborted) return;
        if (esSinTurno(error)) setTurno({ tipo: "sin-turno" });
        else if (esSesionVencida(error)) setTurno({ tipo: "sesion-vencida" });
        else setTurno({ tipo: "error", mensaje: mensajeCaja(error) });
      },
    );
    return () => controlador.abort();
  }, [intentoTurno]);

  useEffect(() => {
    obtenerCatalogo().then(
      (catalogo) => setCiudades(ciudadesConRuta(catalogo)),
      () => setCiudades(null),
    );
  }, []);

  // El plano se pide al entrar a asientos y de nuevo tras un asiento tomado.
  useEffect(() => {
    if (paso.tipo !== "asientos" || !viaje) return;
    const controlador = new AbortController();
    obtenerPlano(viaje.viaje.id, { signal: controlador.signal }).then(
      ({ seats }) => !controlador.signal.aborted && setPlano({ tipo: "listo", ...planoDesdeApi(seats) }),
      () => !controlador.signal.aborted && setPlano({ tipo: "error" }),
    );
    return () => controlador.abort();
  }, [paso.tipo, viaje, intentoPlano]);

  const opcionesDestino = aOpciones((origen && ciudades?.destinosDesde[origen]) || []);

  async function buscar(event: FormEvent) {
    event.preventDefault();
    const errores: typeof erroresBusqueda = {};
    if (!origen) errores.origen = "Elige el origen";
    if (!destino) errores.destino = "Elige el destino";
    if (!fecha) errores.fecha = "Elige una fecha";
    setErroresBusqueda(errores);
    if (!sinErrores(errores) || !origen || !destino || !fecha) return;

    setPaso({ tipo: "resultados", carga: "cargando", viajes: [], existeRuta: true });
    try {
      const resultado = await buscarViajes(origen, destino, fechaParaBusqueda(fecha));
      setPaso({ tipo: "resultados", carga: "listo", ...resultado });
    } catch {
      setPaso({ tipo: "resultados", carga: "error", viajes: [], existeRuta: true });
    }
  }

  function elegirViaje(elegido: ViajeEncontrado) {
    setViaje(elegido);
    setSeleccionados([]);
    setPlano({ tipo: "cargando" });
    setPaso({ tipo: "asientos" });
  }

  function alternarAsiento(asiento: Asiento) {
    if (seleccionados.includes(asiento.id)) {
      setSeleccionados((prev) => prev.filter((id) => id !== asiento.id));
      return;
    }
    if (asiento.estado !== "libre" || seleccionados.length >= pasajerosCount) return;
    setSeleccionados((prev) => [...prev, asiento.id]);
  }

  function irADatos() {
    // Lo ya escrito se conserva si se vuelve a cambiar de asiento.
    setBorradores((prev) => seleccionados.map((_, i) => prev[i] ?? PASAJERO_VACIO));
    setErroresPasajeros([]);
    setPaso({ tipo: "datos" });
  }

  function volverAlPlano() {
    setPlano({ tipo: "cargando" });
    setIntentoPlano((v) => v + 1);
    setPaso({ tipo: "asientos" });
  }

  const precioAsiento = viaje?.viaje.unitPrice != null ? Number(viaje.viaje.unitPrice) : null;
  const totalEstimado = precioAsiento !== null ? precioAsiento * seleccionados.length : null;
  const montoRecibido = leerMonto(recibido);

  async function cobrar(event: FormEvent) {
    event.preventDefault();
    if (vendiendoRef.current || !viaje) return;
    const salida = new Date(viaje.viaje.departsAt);

    const nuevosPasajeros = borradores.map((p) => validarPasajeroReserva(p, salida));
    const nuevosCobro: ErroresCobro = {};
    if (montoRecibido === null) nuevosCobro.recibido = "Escribe el efectivo que recibiste, por ejemplo 50";
    else if (totalEstimado !== null && montoRecibido < totalEstimado)
      nuevosCobro.recibido = `No alcanza: el total es ${formatPrecio(totalEstimado)}`;
    if (!autorizacion) nuevosCobro.autorizacion = "El pasajero tiene que autorizar el registro de sus datos";
    if (sustentarGasto) {
      if (!/^\d{11}$/.test(ruc.trim())) nuevosCobro.ruc = "El RUC debe tener 11 dígitos";
      if (!nombreRuc.trim()) nuevosCobro.nombre = "Este campo es obligatorio";
      else if (nombreRuc.trim().length > 120) nuevosCobro.nombre = "Máximo 120 caracteres";
    }
    setErroresPasajeros(nuevosPasajeros);
    setErroresCobro(nuevosCobro);
    if (!nuevosPasajeros.every(sinErrores) || !sinErrores(nuevosCobro) || montoRecibido === null) return;

    vendiendoRef.current = true;
    setVendiendo(true);
    try {
      const venta = await venderEnEfectivo({
        tripId: viaje.viaje.id,
        seats: seleccionados,
        cashReceived: montoRecibido,
        passengers: seleccionados.map((seat, i) => {
          const p = borradores[i];
          const conAcompanante = p.companionName.trim() || p.companionRelationship.trim();
          return {
            seat,
            documentType: p.documentType,
            documentNumber: p.documentNumber.trim(),
            firstNames: p.firstNames.trim(),
            lastNames: p.lastNames.trim(),
            birthDate: p.birthDate,
            companion: conAcompanante
              ? { name: p.companionName.trim(), relationship: p.companionRelationship.trim() }
              : null,
          };
        }),
        dataAuthorization: true,
        billTo: sustentarGasto ? { ruc: ruc.trim(), name: nombreRuc.trim() } : null,
      });
      setPaso({ tipo: "confirmado", venta, recibido: montoRecibido });
    } catch (error) {
      if (ventaPudoRegistrarse(error)) {
        // No se sabe si se vendió. Volver a enviar podría cobrar dos veces.
        setPaso({ tipo: "incierta" });
      } else if (esSinTurno(error)) {
        setTurno({ tipo: "sin-turno" });
      } else if (esSesionVencida(error)) {
        setTurno({ tipo: "sesion-vencida" });
      } else {
        const mensaje = mensajeCaja(error);
        showToast({ type: "error", title: mensaje.titulo, description: mensaje.descripcion });
        if (error instanceof ApiError && error.codigo === "SEAT_UNAVAILABLE") {
          const tomados = error.detalles?.unavailableSeats ?? [];
          setSeleccionados((prev) => prev.filter((s) => !tomados.includes(s)));
          volverAlPlano();
        }
      }
    } finally {
      vendiendoRef.current = false;
      setVendiendo(false);
    }
  }

  function nuevaVenta() {
    setPaso({ tipo: "buscar" });
    setViaje(null);
    setSeleccionados([]);
    setBorradores([]);
    setErroresPasajeros([]);
    setAutorizacion(false);
    setSustentarGasto(false);
    setRuc("");
    setNombreRuc("");
    setRecibido("");
    setErroresCobro({});
  }

  const encabezado = (
    <div>
      <h1 className="text-xl font-semibold text-navy sm:text-2xl">Venta en counter</h1>
      <p className="mt-1 text-sm text-navy/70">
        Busca el viaje, elige asientos y cobra en efectivo. La venta entra al arqueo de tu turno.
      </p>
    </div>
  );

  if (turno.tipo !== "abierto") {
    return (
      <div className="flex flex-col gap-6">
        {encabezado}
        {turno.tipo === "cargando" && (
          <div role="status" aria-label="Verificando tu turno">
            <SkeletonShape variant="card" />
          </div>
        )}
        {turno.tipo === "sin-turno" && (
          <EmptyState
            icon={<ClockIcon className="!size-12 !text-navy/40" />}
            title="Abre tu turno para vender"
            description="Cada cobro en efectivo entra al arqueo de un turno. Ábrelo en Caja y vuelve aquí."
            actionLabel="Ir a Caja"
            onAction={() => router.push(RUTAS.panelCaja)}
          />
        )}
        {turno.tipo === "sesion-vencida" && (
          <EmptyState
            icon={<ExclamationIcon className="!size-12 !text-primary" />}
            title="Tu sesión terminó"
            description="Vuelve a ingresar para seguir vendiendo."
            actionLabel="Ingresar"
            onAction={() =>
              router.push(
                `${RUTAS.ingresar}?${new URLSearchParams({ siguiente: RUTAS.panelVenta, motivo: "sesion-vencida" })}`,
              )
            }
          />
        )}
        {turno.tipo === "error" && (
          <EmptyState
            icon={<ExclamationIcon className="!size-12 !text-primary" />}
            title={turno.mensaje.titulo}
            description={turno.mensaje.descripcion}
            actionLabel="Reintentar"
            onAction={() => {
              setTurno({ tipo: "cargando" });
              setIntentoTurno((v) => v + 1);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {encabezado}

      {paso.tipo === "buscar" && (
        <form onSubmit={buscar} noValidate>
          <Card className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Origen"
                options={aOpciones(ciudades?.origenes ?? [])}
                value={origen}
                onChange={(valor) => {
                  setOrigen(valor);
                  if (destino && !ciudades?.destinosDesde[valor]?.includes(destino)) setDestino(null);
                }}
                placeholder={ciudades ? "Ciudad" : "Cargando…"}
                disabled={!ciudades}
                errorText={erroresBusqueda.origen}
              />
              <Select
                label="Destino"
                options={opcionesDestino}
                value={destino}
                onChange={setDestino}
                placeholder="Ciudad"
                disabled={!ciudades}
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

      {paso.tipo === "resultados" && (
        <div className="flex flex-col gap-4">
          <Button variant="terciario" className="self-start" onClick={() => setPaso({ tipo: "buscar" })}>
            ← Modificar búsqueda
          </Button>
          {paso.carga === "cargando" && (
            <div role="status" aria-label="Buscando viajes" className="flex flex-col gap-4">
              <SkeletonShape variant="card" />
              <SkeletonShape variant="card" />
            </div>
          )}
          {paso.carga === "error" && (
            <EmptyState
              icon={<ExclamationIcon className="!size-12 !text-primary" />}
              title="No pudimos buscar los viajes"
              description="Revisa la conexión e intenta nuevamente."
              actionLabel="Modificar búsqueda"
              onAction={() => setPaso({ tipo: "buscar" })}
            />
          )}
          {paso.carga === "listo" && paso.viajes.length === 0 && (
            <EmptyState
              icon={<SearchOffIcon />}
              title={paso.existeRuta ? "No hay salidas ese día" : "No hay una ruta entre esas ciudades"}
              description="Prueba con otra fecha, origen o destino."
              actionLabel="Modificar búsqueda"
              onAction={() => setPaso({ tipo: "buscar" })}
            />
          )}
          {paso.carga === "listo" &&
            paso.viajes.map((encontrado) => {
              const salida = new Date(encontrado.viaje.departsAt);
              const llegada = encontrado.viaje.arrivesAt ? new Date(encontrado.viaje.arrivesAt) : null;
              return (
                <TripCard
                  key={encontrado.viaje.id}
                  marca={MARCA}
                  terminalOrigen={encontrado.terminalOrigen}
                  destino={destino ?? ""}
                  horaSalida={salida}
                  horaLlegada={llegada}
                  duracionMinutos={
                    llegada ? Math.round((llegada.getTime() - salida.getTime()) / 60_000) : null
                  }
                  llegadaAproximada={encontrado.viaje.arrivalProvisional}
                  asientosDisponibles={encontrado.viaje.availableSeats}
                  tipoAsiento={labelTipoAsiento(encontrado.viaje.serviceType)}
                  precio={encontrado.viaje.unitPrice !== null ? Number(encontrado.viaje.unitPrice) : null}
                  selected={viaje?.viaje.id === encontrado.viaje.id}
                  onSeleccionar={() => elegirViaje(encontrado)}
                />
              );
            })}
        </div>
      )}

      {paso.tipo === "asientos" && viaje && (
        <div className="flex flex-col gap-4">
          <Button
            variant="terciario"
            className="self-start"
            onClick={() => setPaso({ tipo: "buscar" })}
          >
            ← Nueva búsqueda
          </Button>
          <p className="text-sm text-navy/70">
            {viaje.terminalOrigen} → {destino} · {formatFechaLarga(new Date(viaje.viaje.departsAt))} ·{" "}
            {formatHora12(new Date(viaje.viaje.departsAt))} · Elige{" "}
            {pasajerosCount === 1 ? "1 asiento" : `${pasajerosCount} asientos`} ({seleccionados.length}/
            {pasajerosCount})
          </p>

          {plano.tipo === "cargando" && (
            <div role="status" aria-label="Cargando plano de asientos">
              <SkeletonShape variant="card" />
            </div>
          )}
          {plano.tipo === "error" && (
            <EmptyState
              icon={<ExclamationIcon className="!size-12 !text-primary" />}
              title="No pudimos cargar el plano"
              description="Revisa la conexión e intenta nuevamente."
              actionLabel="Reintentar"
              onAction={volverAlPlano}
            />
          )}
          {plano.tipo === "listo" && (
            <SeatMap
              distribucion={plano.distribucion}
              asientos={plano.asientos}
              seleccionados={seleccionados}
              onToggle={alternarAsiento}
            />
          )}

          <div className="flex items-center justify-between rounded-modal bg-white p-4 shadow-low">
            <div>
              <p className="text-xs text-navy/60">Total a precio de ahora</p>
              <p className="text-lg font-bold text-navy">
                {totalEstimado !== null ? formatPrecio(totalEstimado) : "Sin tarifa"}
              </p>
            </div>
            <Button
              disabled={seleccionados.length !== pasajerosCount || precioAsiento === null}
              onClick={irADatos}
              className="min-w-40"
            >
              Continuar
            </Button>
          </div>
        </div>
      )}

      {paso.tipo === "datos" && viaje && (
        <form onSubmit={cobrar} noValidate className="flex flex-col gap-4">
          <Button variant="terciario" type="button" className="self-start" onClick={volverAlPlano}>
            ← Cambiar asientos
          </Button>

          {seleccionados.map((seat, indice) => (
            <PasajeroReservaForm
              key={seat}
              indice={indice}
              asiento={seat}
              valor={borradores[indice] ?? PASAJERO_VACIO}
              errores={erroresPasajeros[indice]}
              salida={new Date(viaje.viaje.departsAt)}
              onChange={(valor) =>
                setBorradores((prev) => prev.map((p, i) => (i === indice ? valor : p)))
              }
            />
          ))}

          <Card className="flex flex-col gap-4">
            <Checkbox
              label={
                <>
                  Cada pasajero me autorizó a registrar sus datos personales para este viaje,
                  conforme a la Ley 29733 y la{" "}
                  <Link href={RUTAS.privacidad} className="font-medium text-secondary underline">
                    Política de privacidad
                  </Link>
                  .
                </>
              }
              checked={autorizacion}
              onChange={(evento) => setAutorizacion(evento.target.checked)}
              errorText={erroresCobro.autorizacion}
            />
            <Checkbox
              label="El boleto sustenta el gasto de una empresa o persona con RUC"
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
                  errorText={erroresCobro.ruc}
                />
                <Input
                  label="Razón social o nombre"
                  value={nombreRuc}
                  onChange={(evento) => setNombreRuc(evento.target.value)}
                  errorText={erroresCobro.nombre}
                />
              </div>
            )}
          </Card>

          <Card className="flex flex-col gap-4">
            <div>
              <h2 className="text-base font-semibold text-navy">Cobro en efectivo</h2>
              <p className="text-sm text-navy/70">
                El total se fija al vender. Si la tarifa cambió desde que buscaste, el sistema te
                dirá el total nuevo y no vende nada hasta que alcance.
              </p>
            </div>
            <Input
              label="Efectivo recibido (S/)"
              inputMode="decimal"
              autoComplete="off"
              value={recibido}
              onChange={(evento) => setRecibido(evento.target.value)}
              helperText={
                montoRecibido !== null && totalEstimado !== null && montoRecibido >= totalEstimado
                  ? `Vuelto aproximado: ${formatPrecio(montoRecibido - totalEstimado)}`
                  : undefined
              }
              errorText={erroresCobro.recibido}
            />
          </Card>

          <div className="flex items-center justify-between rounded-modal bg-white p-4 shadow-low">
            <div>
              <p className="text-xs text-navy/60">Total a precio de ahora</p>
              <p className="text-lg font-bold text-navy">
                {totalEstimado !== null ? formatPrecio(totalEstimado) : "Sin tarifa"}
              </p>
            </div>
            <Button type="submit" isLoading={vendiendo} className="min-w-40">
              Cobrar y vender
            </Button>
          </div>
        </form>
      )}

      {paso.tipo === "incierta" && (
        <EmptyState
          icon={<ExclamationIcon className="!size-12 !text-primary" />}
          title="No sabemos si la venta se registró"
          description="Se cortó la conexión después de enviarla. No cobres de nuevo: revisa en Caja si el número de movimientos subió, o mira el plano: si los asientos figuran vendidos, la venta se hizo."
          actionLabel="Revisar en Caja"
          onAction={() => router.push(RUTAS.panelCaja)}
          footer={
            <Button variant="terciario" onClick={volverAlPlano}>
              Ver el plano del viaje
            </Button>
          }
        />
      )}

      {paso.tipo === "confirmado" && (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-success-fill">
            <CheckIcon className="!size-6 text-success-text" />
          </span>
          <h2 className="text-xl font-semibold text-navy">Venta registrada</h2>
          <p className="text-sm text-navy/70">
            Código de compra{" "}
            <span className="font-semibold text-navy">{paso.venta.purchaseCode}</span> · Asientos{" "}
            {paso.venta.seats.map(etiquetaAsiento).join(", ")}
          </p>
          <dl className="mt-2 grid w-full max-w-sm grid-cols-3 gap-2 text-sm">
            <div>
              <dt className="text-xs text-navy/60">Total</dt>
              <dd className="font-semibold text-navy">{formatPrecio(Number(paso.venta.totalAmount))}</dd>
            </div>
            <div>
              <dt className="text-xs text-navy/60">Recibido</dt>
              <dd className="font-semibold text-navy">{formatPrecio(paso.recibido)}</dd>
            </div>
            <div>
              <dt className="text-xs text-navy/60">Vuelto</dt>
              <dd className="text-lg font-bold text-navy">{formatPrecio(Number(paso.venta.change))}</dd>
            </div>
          </dl>
          <p className="max-w-sm text-xs text-navy/60">
            El cobro ya está en el arqueo de tu turno. La impresión del boleto con QR desde el panel
            todavía no está disponible: entrega al pasajero el código de compra.
          </p>
          <Button onClick={nuevaVenta} className="mt-2">
            Nueva venta
          </Button>
        </Card>
      )}
    </div>
  );
}
