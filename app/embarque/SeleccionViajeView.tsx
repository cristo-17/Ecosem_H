"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { DatePicker } from "@/components/ui/DatePicker";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonShape } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { BusIcon, CheckIcon, DownloadIcon, ExclamationIcon, SearchOffIcon } from "@/components/ui/icons";
import type { CatalogResponse } from "@/lib/types/contratos-frontend";
import type { ViajesOperacion } from "@/lib/embarque/contrato";
import { listarViajesDescargados, type ViajeDescargado } from "@/lib/embarque/db";
import { paqueteVencido } from "@/lib/embarque/decidir";
import { descargarViaje } from "@/lib/embarque/escanear";
import { ciudadesDeRuta, viajesDelDia } from "@/lib/api/operacion";
import { fechaDesdeBusqueda, fechaParaBusqueda, hoyEnPeru, obtenerCatalogo } from "@/lib/api/ventas";
import { esSesionVencida } from "@/lib/api/cuenta";
import { mensajeCompra, type MensajeError } from "@/lib/api/compra";
import { formatFechaCorta, formatHora12 } from "@/lib/format";
import { RUTAS, rutaEmbarqueViaje } from "@/lib/routes";

type Viaje = ViajesOperacion["trips"][number];

type Lista =
  | { tipo: "cargando" }
  | { tipo: "sin-conexion" }
  | { tipo: "sesion-vencida" }
  | { tipo: "error"; mensaje: MensajeError }
  | { tipo: "lista"; viajes: Viaje[]; catalogo: CatalogResponse };

/**
 * Con señal: los viajes del día de la agencia (el backend decide cuáles ve
 * cada quien) y el botón para bajar el paquete de cada uno. Sin señal: solo los
 * ya descargados, que es con lo que se embarca en el andén.
 */
export function SeleccionViajeView() {
  const router = useRouter();
  const { showToast } = useToast();
  const [fecha, setFecha] = useState<Date>(() => fechaDesdeBusqueda(hoyEnPeru()));
  const [lista, setLista] = useState<Lista>({ tipo: "cargando" });
  const [intento, setIntento] = useState(0);
  const [descargados, setDescargados] = useState<ViajeDescargado[]>([]);
  const [descargando, setDescargando] = useState<string | null>(null);

  useEffect(() => {
    listarViajesDescargados().then(setDescargados, () => setDescargados([]));
  }, []);

  useEffect(() => {
    const controlador = new AbortController();
    Promise.all([
      viajesDelDia(fechaParaBusqueda(fecha), null, { signal: controlador.signal }),
      obtenerCatalogo(),
    ]).then(
      ([{ trips }, catalogo]) => {
        if (controlador.signal.aborted) return;
        const viajes = [...trips].sort((a, b) => a.departsAt.localeCompare(b.departsAt));
        setLista({ tipo: "lista", viajes, catalogo });
      },
      (error: unknown) => {
        if (controlador.signal.aborted) return;
        if (!navigator.onLine) setLista({ tipo: "sin-conexion" });
        else if (esSesionVencida(error)) setLista({ tipo: "sesion-vencida" });
        else setLista({ tipo: "error", mensaje: mensajeCompra(error) });
      },
    );
    return () => controlador.abort();
  }, [fecha, intento]);

  function cambiarFecha(nueva: Date) {
    setLista({ tipo: "cargando" });
    setFecha(nueva);
  }

  async function descargar(viaje: Viaje, catalogo: CatalogResponse) {
    setDescargando(viaje.tripId);
    try {
      const nuevo = await descargarViaje(viaje, ciudadesDeRuta(catalogo, viaje.route));
      setDescargados((previos) => [...previos.filter((d) => d.tripId !== nuevo.tripId), nuevo]);
      router.push(rutaEmbarqueViaje(viaje.tripId));
    } catch (error) {
      const mensaje = mensajeCompra(error);
      showToast({ type: "error", title: "No se pudo descargar el viaje", description: mensaje.descripcion });
    } finally {
      setDescargando(null);
    }
  }

  const descargado = (tripId: string) => descargados.find((d) => d.tripId === tripId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-navy sm:text-2xl">Elige tu viaje</h1>
        <p className="mt-1 text-sm text-navy/70">
          Descarga el viaje mientras tengas señal: después el embarque se valida sin conexión.
        </p>
      </div>

      {descargados.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="titulo-descargados">
          <h2 id="titulo-descargados" className="text-sm font-semibold text-navy">
            En este dispositivo
          </h2>
          {[...descargados]
            .sort((a, b) => a.viaje.departsAt.localeCompare(b.viaje.departsAt))
            .map((d) => (
              <TarjetaViaje
                key={d.tripId}
                origen={d.origen}
                destino={d.destino}
                viaje={d.viaje}
                aviso={paqueteVencido(d.paquete, new Date()) ? "El paquete venció: actualízalo con señal" : null}
                accion={
                  <Button variant="secundario" onClick={() => router.push(rutaEmbarqueViaje(d.tripId))} className="shrink-0">
                    <CheckIcon className="!size-4" />
                    Abrir
                  </Button>
                }
              />
            ))}
        </section>
      )}

      <section className="flex flex-col gap-3" aria-labelledby="titulo-del-dia">
        <h2 id="titulo-del-dia" className="text-sm font-semibold text-navy">
          Viajes del día
        </h2>
        <Card>
          <DatePicker label="Fecha" value={fecha} onChange={cambiarFecha} />
        </Card>

        {lista.tipo === "cargando" && (
          <div role="status" aria-label="Cargando viajes" className="flex flex-col gap-3">
            <SkeletonShape variant="card" />
            <SkeletonShape variant="card" />
          </div>
        )}

        {lista.tipo === "sin-conexion" && (
          <EmptyState
            icon={<ExclamationIcon className="!size-12 !text-primary" />}
            title="Sin conexión"
            description="Para descargar un viaje necesitas señal. Con los ya descargados puedes embarcar igual."
            actionLabel="Reintentar"
            onAction={() => {
              setLista({ tipo: "cargando" });
              setIntento((v) => v + 1);
            }}
          />
        )}

        {lista.tipo === "sesion-vencida" && (
          <EmptyState
            icon={<ExclamationIcon className="!size-12 !text-primary" />}
            title="Tu sesión terminó"
            description="Vuelve a ingresar para descargar viajes. Los escaneos guardados no se pierden."
            actionLabel="Ingresar"
            onAction={() =>
              router.push(`${RUTAS.ingresar}?${new URLSearchParams({ siguiente: RUTAS.embarque, motivo: "sesion-vencida" })}`)
            }
          />
        )}

        {lista.tipo === "error" && (
          <EmptyState
            icon={<ExclamationIcon className="!size-12 !text-primary" />}
            title={lista.mensaje.titulo}
            description={lista.mensaje.descripcion}
            actionLabel="Reintentar"
            onAction={() => {
              setLista({ tipo: "cargando" });
              setIntento((v) => v + 1);
            }}
          />
        )}

        {lista.tipo === "lista" && lista.viajes.length === 0 && (
          <EmptyState
            icon={<SearchOffIcon />}
            title="No hay viajes en esta fecha"
            description="Prueba con otra fecha. Solo ves los viajes de tu agencia."
            actionLabel="Ver hoy"
            onAction={() => cambiarFecha(fechaDesdeBusqueda(hoyEnPeru()))}
          />
        )}

        {lista.tipo === "lista" &&
          lista.viajes.map((viaje) => {
            const ciudades = ciudadesDeRuta(lista.catalogo, viaje.route);
            const yaDescargado = descargado(viaje.tripId) !== null;
            return (
              <TarjetaViaje
                key={viaje.tripId}
                origen={ciudades.origen}
                destino={ciudades.destino}
                viaje={viaje}
                aviso={viaje.status === "cancelado" ? "Viaje cancelado" : null}
                accion={
                  <Button
                    variant={yaDescargado ? "secundario" : "principal"}
                    isLoading={descargando === viaje.tripId}
                    disabled={viaje.status === "cancelado"}
                    onClick={() => descargar(viaje, lista.catalogo)}
                    className="shrink-0"
                  >
                    <DownloadIcon className="!size-4" />
                    {yaDescargado ? "Actualizar" : "Descargar"}
                  </Button>
                }
              />
            );
          })}
      </section>
    </div>
  );
}

function TarjetaViaje({
  origen,
  destino,
  viaje,
  aviso,
  accion,
}: {
  origen: string;
  destino: string;
  viaje: Viaje;
  aviso: string | null;
  accion: ReactNode;
}) {
  const salida = new Date(viaje.departsAt);
  return (
    <Card className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-navy/5 text-navy/60">
          <BusIcon />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-navy">
            {origen} → {destino}
          </p>
          <p className="text-xs text-navy/60">
            {formatHora12(salida)} · {formatFechaCorta(salida)}
            {viaje.bus ? ` · Bus ${viaje.bus.plate}` : ""}
          </p>
          <p className="mt-1 text-xs text-navy/60">{viaje.seats.sold} pasajeros vendidos</p>
          {aviso && <p className="mt-1 text-xs font-medium text-error-text">{aviso}</p>}
        </div>
      </div>
      {accion}
    </Card>
  );
}
