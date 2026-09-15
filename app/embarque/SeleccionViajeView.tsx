"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { DatePicker } from "@/components/ui/DatePicker";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { BusIcon, DownloadIcon, CheckIcon, SearchOffIcon } from "@/components/ui/icons";
import { FECHA_VIAJES_DEL_DIA, buscarViajesDelDia, type ViajeDelDia } from "@/lib/mock/manifiesto";
import { formatFechaCorta, formatHora12 } from "@/lib/format";
import { rutaEmbarqueViaje } from "@/lib/routes";
import {
  buscarEscaneo,
  guardarManifiesto,
  listarManifiestosDescargados,
  registrarEscaneo,
} from "@/lib/embarque/db";
import type { ManifiestoLocal } from "@/lib/embarque/tipos";

/** Simula la latencia de red de descargar el manifiesto — mismo criterio que el resto del mock. */
const RETRASO_DESCARGA_MS = 600;

export function SeleccionViajeView() {
  const router = useRouter();
  const { showToast } = useToast();
  const [fecha, setFecha] = useState<Date | null>(FECHA_VIAJES_DEL_DIA);
  const [descargados, setDescargados] = useState<Set<string>>(new Set());
  const [descargando, setDescargando] = useState<string | null>(null);
  const [cargandoDescargados, setCargandoDescargados] = useState(true);

  const viajes = useMemo(() => buscarViajesDelDia({ fecha }), [fecha]);

  useEffect(() => {
    let activo = true;
    listarManifiestosDescargados()
      .then((locales) => {
        if (activo) setDescargados(new Set(locales.map((m) => m.viajeId)));
      })
      .finally(() => {
        if (activo) setCargandoDescargados(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  async function descargarManifiestoDelViaje(viaje: ViajeDelDia): Promise<void> {
    const local: ManifiestoLocal = {
      viajeId: viaje.id,
      origen: viaje.origen,
      destino: viaje.destino,
      fechaSalida: viaje.fechaSalida,
      placaBus: viaje.placaBus,
      conductores: viaje.conductores,
      pasajeros: viaje.pasajeros.map((pasajero) => ({
        codigoBoleto: pasajero.codigoBoleto,
        asiento: pasajero.asiento,
        apellidos: pasajero.apellidos,
        nombres: pasajero.nombres,
        destino: pasajero.destino,
      })),
      descargadoEn: new Date(),
    };
    await guardarManifiesto(local);

    // Los pasajeros que el manifiesto ya marca "embarcado" (mock, ver
    // lib/mock/manifiesto.ts) se siembran como ya escaneados: si el
    // personal escanea su código, tiene que ver "Ya embarcado" desde el
    // primer momento, no "Válido" de nuevo.
    const yaEmbarcados = viaje.pasajeros.filter((pasajero) => pasajero.estadoEmbarque === "embarcado");
    for (const pasajero of yaEmbarcados) {
      const existente = await buscarEscaneo(viaje.id, pasajero.codigoBoleto);
      if (!existente) {
        await registrarEscaneo({
          viajeId: viaje.id,
          codigoBoleto: pasajero.codigoBoleto,
          horaEscaneo: new Date(viaje.fechaSalida.getTime() - 20 * 60 * 1000),
          sincronizado: true,
        });
      }
    }
  }

  async function manejarSeleccion(viaje: ViajeDelDia) {
    const yaDescargado = descargados.has(viaje.id);

    if (!yaDescargado && !navigator.onLine) {
      showToast({
        type: "error",
        title: "Sin conexión",
        description: "Descarga el manifiesto mientras tengas señal, antes de llegar al andén.",
      });
      return;
    }

    if (yaDescargado) {
      router.push(rutaEmbarqueViaje(viaje.id));
      return;
    }

    setDescargando(viaje.id);
    try {
      await new Promise((resolve) => setTimeout(resolve, RETRASO_DESCARGA_MS));
      await descargarManifiestoDelViaje(viaje);
      setDescargados((prev) => new Set(prev).add(viaje.id));
      router.push(rutaEmbarqueViaje(viaje.id));
    } catch {
      showToast({
        type: "error",
        title: "No se pudo descargar el manifiesto",
        description: "Intenta de nuevo.",
      });
    } finally {
      setDescargando(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-navy sm:text-2xl">Elige tu viaje</h1>
        <p className="mt-1 text-sm text-navy/70">
          Descarga el manifiesto antes de ir al andén: la validación de embarque funciona sin señal
          una vez descargado.
        </p>
      </div>

      <Card>
        <DatePicker label="Fecha" value={fecha} onChange={setFecha} />
      </Card>

      <div className="flex flex-col gap-3">
        {viajes.map((viaje) => {
          const yaDescargado = descargados.has(viaje.id);
          return (
            <Card key={viaje.id} className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-navy/5 text-navy/60">
                  <BusIcon />
                </span>
                <div>
                  <p className="text-sm font-semibold text-navy">
                    {viaje.origen} → {viaje.destino}
                  </p>
                  <p className="text-xs text-navy/60">
                    {formatHora12(viaje.fechaSalida)} · {formatFechaCorta(viaje.fechaSalida)} · Bus{" "}
                    {viaje.placaBus}
                  </p>
                  <p className="mt-1 text-xs text-navy/60">{viaje.pasajeros.length} pasajeros</p>
                </div>
              </div>

              <Button
                variant={yaDescargado ? "secundario" : "principal"}
                isLoading={descargando === viaje.id}
                disabled={cargandoDescargados}
                onClick={() => manejarSeleccion(viaje)}
                className="h-10 min-h-0 shrink-0 px-4 text-sm"
              >
                {yaDescargado ? (
                  <>
                    <CheckIcon className="!size-4" />
                    Abrir
                  </>
                ) : (
                  <>
                    <DownloadIcon className="!size-4" />
                    Descargar
                  </>
                )}
              </Button>
            </Card>
          );
        })}
      </div>

      {viajes.length === 0 && (
        <EmptyState
          icon={<SearchOffIcon />}
          title="No hay viajes para esta fecha"
          description="Prueba con otra fecha."
          actionLabel="Ver hoy"
          onAction={() => setFecha(FECHA_VIAJES_DEL_DIA)}
        />
      )}
    </div>
  );
}
