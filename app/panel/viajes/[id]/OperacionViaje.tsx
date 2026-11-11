"use client";

import { useEffect, useRef, useState } from "react";
import type { BoardingPackageResponse, BusListResponse, BusFromFleetRequest, DriversResponse, TripDriversResponse, UnitsResponse, SeatPlan } from "@/lib/types/contratos-panel";
import { paqueteEmbarque } from "@/lib/api/operacion";
import { asignarConductor, cambiarBus, conductoresDelViaje, listarBuses, mensajeOperacionViaje, retirarConductor, traerBusDesdeFlota } from "@/lib/api/viajes";
import { listarConductores, listarUnidades } from "@/lib/api/flota";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { SkeletonShape } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { ExclamationIcon } from "@/components/ui/icons";
import type { MensajeError } from "@/lib/api/compra";

export function OperacionViaje({ viajeId, supervisor, generando, onConductores, onModificable }: { viajeId: string; supervisor: boolean; generando: boolean; onConductores: (datos: TripDriversResponse | null) => void; onModificable: (permitido: boolean) => void }) {
  const [viaje, setViaje] = useState<Pick<BoardingPackageResponse, "status" | "departsAt"> | null>(null);
  const [admiteCambios, setAdmiteCambios] = useState(false);
  const puedeEditar = supervisor && admiteCambios;
  const [datos, setDatos] = useState<TripDriversResponse | null>(null);
  const [flota, setFlota] = useState<DriversResponse | null>(null);
  const [unidades, setUnidades] = useState<UnitsResponse | null>(null);
  const [buses, setBuses] = useState<BusListResponse | null>(null);
  const [errores, setErrores] = useState<MensajeError[]>([]);
  const [intento, setIntento] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [escribiendo, setOcupado] = useState(false);
  const ocupado = escribiendo || generando;
  const bloqueo = useRef(false);
  const [conductor, setConductor] = useState<string | null>(null);
  const [bus, setBus] = useState<string | null>(null);
  const [retiro, setRetiro] = useState<TripDriversResponse["drivers"][number] | null>(null);
  const [motivo, setMotivo] = useState("");
  const [importar, setImportar] = useState(false);
  const [unidadFlota, setUnidadFlota] = useState<string | null>(null);
  const [identificador, setIdentificador] = useState("");
  const [pisos, setPisos] = useState<SeatPlan["pisos"]>([{ piso: 1, filas: 0, columnas: [] }]);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    let vigente = true;
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    let revisarHora = () => {};
    onConductores(null);
    onModificable(false);
    const tareas = [
      conductoresDelViaje(viajeId).then(d => { if (vigente) { setDatos(d); onConductores(d); } }),
      paqueteEmbarque(viajeId).then(paquete => {
        if (!vigente) return;
        setViaje(paquete);
        // El reloj del dispositivo no decide si el viaje ya salió. Se avanza
        // desde issuedAt con un reloj monotónico mientras esta vista está abierta.
        const recibidoEn = performance.now();
        revisarHora = () => {
          if (!vigente) return;
          clearTimeout(temporizador);
          const restante = Date.parse(paquete.departsAt) - (Date.parse(paquete.issuedAt) + performance.now() - recibidoEn);
          const permitido = paquete.status === "programado" && restante > 0;
          setAdmiteCambios(permitido);
          onModificable(permitido);
          if (permitido) temporizador = setTimeout(revisarHora, Math.min(restante, 2_147_483_647));
        };
        revisarHora();
      }),
    ];
    if (supervisor) tareas.push(
      listarConductores().then(d => { if (vigente) setFlota(d); }),
      listarUnidades().then(d => { if (vigente) setUnidades(d); }),
      listarBuses().then(d => { if (vigente) setBuses(d); }),
    );
    Promise.allSettled(tareas).then(resultados => {
      if (!vigente) return;
      setErrores(resultados.flatMap(r => r.status === "rejected" ? [mensajeOperacionViaje(r.reason)] : []));
      setCargando(false);
    });
    const alVolver = () => revisarHora();
    window.addEventListener("focus", alVolver);
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      vigente = false;
      clearTimeout(temporizador);
      window.removeEventListener("focus", alVolver);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [viajeId, supervisor, intento, onConductores, onModificable]);

  function recargar() {
    setCargando(true);
    setDatos(null);
    setFlota(null);
    setUnidades(null);
    setBuses(null);
    setViaje(null);
    setAdmiteCambios(false);
    onModificable(false);
    onConductores(null);
    setIntento(i => i + 1);
  }

  async function ejecutar(accion: () => Promise<unknown>, mensaje: string, descripcion = "Genera una versión nueva del manifiesto para incluir este cambio.") {
    if (bloqueo.current || generando || !puedeEditar) return;
    bloqueo.current = true;
    setOcupado(true);
    onConductores(null);
    try {
      await accion();
      setRetiro(null);
      setMotivo("");
      setConductor(null);
      showToast({ type: "success", title: mensaje, description: descripcion });
    } catch (error) {
      const m = mensajeOperacionViaje(error);
      showToast({ type: "error", title: m.titulo, description: m.descripcion });
    } finally {
      recargar();
      bloqueo.current = false;
      setOcupado(false);
    }
  }

  const unidad = unidades?.units.find(u => u.unitId === unidadFlota);
  const capacidad = pisos.reduce((total, p) => total + p.filas * p.columnas.length - (p.sinAsiento?.length ?? 0), 0);
  const planoValido = pisos.every(p => Number.isInteger(p.filas) && p.filas > 0 && p.filas <= 99 && p.columnas.length > 0 && p.columnas.length <= 6 && p.columnas.every(c => /^[A-Z]$/.test(c)) && new Set(p.columnas).size === p.columnas.length && new Set(p.sinAsiento).size === (p.sinAsiento?.length ?? 0) && (p.sinAsiento ?? []).every(c => {
    const posicion = /^P([12])-(\d+)([A-Z])$/.exec(c);
    return posicion && Number(posicion[1]) === p.piso && Number(posicion[2]) >= 1 && Number(posicion[2]) <= p.filas && p.columnas.includes(posicion[3]);
  }));

  return <Card className="flex flex-col gap-4">
    <h2 ref={tituloRef} tabIndex={-1} className="text-lg font-semibold text-navy">Preparar el viaje</h2>
    {cargando ? <div role="status" aria-label="Cargando conductores y buses"><SkeletonShape variant="card" className="h-32" /></div> : <>
      {errores.map((e, i) => <div key={i} role="alert" className="rounded-field bg-error-fill p-4 text-error-text"><p className="font-semibold">{e.titulo}</p><p>{e.descripcion}</p></div>)}
      {viaje && !admiteCambios && <div role="status" className="rounded-field bg-info-fill p-4 text-info-text">
        <p className="font-semibold">Este viaje ya no admite cambios</p>
        <p>{viaje.status === "cancelado" ? "El viaje está cancelado." : viaje.status === "en_ruta" ? "El viaje ya salió y está en ruta." : viaje.status === "completado" ? "El viaje está completado." : "La hora de salida ya pasó."} Puedes consultar sus conductores y los manifiestos existentes.</p>
      </div>}
      {datos && <>
        <p role="status" className="text-sm text-text-primary">Conductores asignados: {datos.drivers.length} de {datos.required.required} exigidos · turno {datos.required.shift}.</p>
        {!datos.required.ruleConfirmed && <p className="text-sm text-warning-text">La regla de conductores aún no está confirmada por operación. Se muestra el requisito vigente del viaje.</p>}
        {datos.drivers.length === 0 ? <EmptyState icon={<ExclamationIcon className="!size-12 !text-text-muted" />} title="Sin conductores asignados" description={!admiteCambios ? "Consulta las asignaciones registradas. Este viaje ya no permite asignar conductores." : supervisor ? "Elige un conductor de flota para preparar el manifiesto." : "Pide al supervisor que asigne los conductores."} actionLabel="Actualizar asignaciones" onAction={() => { if (!ocupado) recargar(); }} /> : <ul className="flex flex-col gap-2">{datos.drivers.map(d => <li key={d.assignmentId} className="flex flex-wrap items-center justify-between gap-2 border-t border-border-default py-2"><div><p className="font-medium">{d.firstNames} {d.lastNames}</p><p className="text-sm text-text-secondary">Licencia vigente hasta {d.licenseExpiresOn}</p></div>{puedeEditar && <Button variant="destructivo" disabled={ocupado} onClick={() => { setMotivo(""); setRetiro(d); }}>Retirar conductor</Button>}</li>)}</ul>}
      </>}
      {puedeEditar && <>
        {flota && (flota.drivers.length ? <div className="flex flex-col gap-3"><Select label="Conductor de flota" options={flota.drivers.filter(d => !datos?.drivers.some(a => a.driverId === d.driverId)).map(d => ({ value: d.driverId, label: `${d.firstNames} ${d.lastNames}${d.active ? "" : " · Inactivo"}` }))} value={conductor} onChange={setConductor} disabled={ocupado} /><Button variant="secundario" disabled={!conductor || !datos || ocupado} isLoading={ocupado} onClick={() => ejecutar(() => asignarConductor(viajeId, { driverId: conductor! }), "Conductor asignado")}>Asignar conductor</Button></div> : <p className="text-sm text-text-secondary">Flota todavía no tiene conductores registrados. Regístralos en la sección Conductores y actualiza esta consulta.</p>)}
        {buses && <div className="flex flex-col gap-3 border-t border-border-default pt-4"><Select label="Bus para el viaje" value={bus} onChange={setBus} disabled={ocupado} options={buses.buses.map(b => ({ value: b.busId, label: `${b.unit} · ${b.plate} · ${b.capacity} asientos · ${b.serviceType}` }))} helperText="Se comprueban horarios, asientos ocupados y tipo de servicio antes de cambiarlo." /><Button variant="secundario" disabled={!bus || ocupado} isLoading={ocupado} onClick={() => ejecutar(() => cambiarBus(viajeId, { busId: bus! }), "Bus del viaje actualizado")}>Cambiar bus</Button></div>}
        {unidades && <><Button variant="terciario" onClick={() => setImportar(true)} disabled={ocupado || !unidades.units.length}>Traer bus desde flota</Button>{!unidades.units.length && <p className="text-sm text-text-secondary">No hay unidades en flota para traer a ventas.</p>}</>}
      </>}
    </>}
    <Button variant="terciario" onClick={recargar} disabled={ocupado || cargando}>Actualizar conductores y buses</Button>
    <Modal open={!!retiro && puedeEditar} onClose={() => setRetiro(null)} title="Retirar conductor" preventDismiss={ocupado} returnFocusRef={tituloRef} footer={<><Button variant="terciario" disabled={ocupado} onClick={() => setRetiro(null)}>Cancelar</Button><Button variant="destructivo" disabled={!motivo.trim() || ocupado} isLoading={ocupado} onClick={() => retiro && ejecutar(() => retirarConductor(viajeId, retiro.assignmentId, motivo.trim()), "Conductor retirado")}>Confirmar retiro</Button></>}>
      <p className="mb-4">Se retirará a {retiro?.firstNames} {retiro?.lastNames} de este viaje.</p><Input label="Motivo del retiro" value={motivo} maxLength={500} onChange={e => setMotivo(e.target.value)} />
    </Modal>
    <Modal open={importar && puedeEditar} onClose={() => setImportar(false)} title="Traer bus desde flota" preventDismiss={ocupado} returnFocusRef={tituloRef} footer={<><Button variant="terciario" disabled={ocupado} onClick={() => setImportar(false)}>Cancelar</Button><Button variant="secundario" isLoading={ocupado} disabled={ocupado || !unidad || !identificador.trim() || capacidad !== unidad.capacity || !planoValido} onClick={() => ejecutar(async () => {
      const pedido: BusFromFleetRequest = { fleetUnitId: unidadFlota!, unit: identificador.trim(), seatPlan: { pisos } };
      const nuevo = await traerBusDesdeFlota(pedido);
      setBus(nuevo.busId);
      setImportar(false);
    }, "Bus disponible en ventas", "Confirma Cambiar bus para asignarlo al viaje.")}>Traer bus</Button></>}>
      <div className="flex flex-col gap-4"><Select label="Unidad de flota" value={unidadFlota} onChange={setUnidadFlota} options={unidades?.units.filter(u => u.active).map(u => ({ value: u.unitId, label: `${u.plate} · ${u.capacity} asientos` })) ?? []} /><Input label="Identificador de unidad en ventas" maxLength={120} value={identificador} onChange={e => setIdentificador(e.target.value)} />
        <p className="text-sm text-text-secondary">Registra el plano real del bus. No se asignará al viaje hasta que confirmes el cambio de bus.</p>
        {pisos.map((p, i) => <fieldset key={p.piso} className="flex flex-col gap-3 rounded-field border border-border-default p-4"><legend>Piso {p.piso}</legend><Input label={`Filas del piso ${p.piso}`} type="number" min={1} max={99} value={p.filas || ""} onChange={e => setPisos(actual => actual.map((x, j) => j === i ? { ...x, filas: Number(e.target.value) } : x))} /><Input label={`Columnas del piso ${p.piso}`} helperText="Letras separadas por comas, según el plano real." value={p.columnas.join(",")} onChange={e => setPisos(actual => actual.map((x, j) => j === i ? { ...x, columnas: e.target.value.toUpperCase().split(",").map(c => c.trim()) } : x))} /><Input label={`Posiciones sin asiento del piso ${p.piso}`} helperText={`Baños o escaleras: códigos separados por comas, por ejemplo P${p.piso}-1A.`} value={p.sinAsiento?.join(",") ?? ""} onChange={e => setPisos(actual => actual.map((x, j) => j === i ? { ...x, sinAsiento: e.target.value.toUpperCase().split(",").map(c => c.trim()).filter(Boolean) } : x))} /></fieldset>)}
        <Button variant="terciario" onClick={() => setPisos(actual => actual.length === 1 ? [...actual, { piso: 2, filas: 0, columnas: [] }] : actual.slice(0, 1))}>{pisos.length === 1 ? "Agregar segundo piso" : "Quitar segundo piso"}</Button>
        <p role="status" className="text-sm text-text-secondary">Asientos del plano: {capacidad}{unidad ? ` de ${unidad.capacity} en flota` : ""}.</p>
      </div>
    </Modal>
  </Card>;
}
