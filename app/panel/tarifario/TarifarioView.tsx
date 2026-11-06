"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExclamationIcon, ScaleIcon } from "@/components/ui/icons";
import { obtenerCatalogo } from "@/lib/api/ventas";
import { leerTarifario, guardarRangos, guardarRecargo, mensajeTarifario } from "@/lib/api/tarifario";
import type { SaveParcelRatesRequest, SaveDeclaredValueSurchargeRequest, ParcelRatesResponse } from "@/lib/types/contratos-panel";
import type { OpcionesPeticion } from "@/lib/api/cliente";
import { RangosEncomiendaCard } from "./RangosEncomiendaCard";
import { RecargoValorDeclaradoCard } from "./RecargoValorDeclaradoCard";
import { EquipajeCard } from "./EquipajeCard";
async function cargar(opciones: OpcionesPeticion = {}) {
  const [tarifario, catalogo] = await Promise.all([leerTarifario(opciones), obtenerCatalogo(opciones)]);
  return { tarifario, catalogo };
}
export function TarifarioView() {
  const [datos, setDatos] = useState<Awaited<ReturnType<typeof cargar>> | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [intento, setIntento] = useState(0);
  const [aviso, setAviso] = useState("");
  useEffect(() => {
    const controlador = new AbortController();
    cargar({ signal: controlador.signal }).then(respuesta => {
      if (!controlador.signal.aborted)
        setDatos(respuesta);
    })
      .catch(e => {
        if (!controlador.signal.aborted)
          setError(e);
      })
      .finally(() => {
        if (!controlador.signal.aborted)
          setCargando(false);
      });
    return () => controlador.abort();
  }, [intento]);
  function recargar() { setCargando(true); setError(null); setAviso(""); setIntento(i => i + 1); }
  async function guardarRuta(pedido: SaveParcelRatesRequest) {
    const tarifario = await guardarRangos(pedido);
    setDatos(prev => prev ? { ...prev, tarifario } : prev);
    setAviso("Rangos de la ruta guardados en el servidor.");
  }
  async function guardarPorcentaje(pedido: SaveDeclaredValueSurchargeRequest) {
    const tarifario = await guardarRecargo(pedido);
    setDatos(prev => prev ? { ...prev, tarifario } : prev);
    setAviso("Porcentaje guardado en el servidor.");
  }
  const rutas = new Map<string, ParcelRatesResponse["routes"][number]>();
  datos?.tarifario.routes.forEach(r => rutas.set(`${r.origin}>${r.destination}`, r));
  for (const r of datos?.catalogo.routes ?? []) {
    if (!r.active)
      continue;
    const origin = datos?.catalogo.terminals.find(t => t.id === r.originId)?.code;
    const destination = datos?.catalogo.terminals.find(t => t.id === r.destinationId)?.code;
    if (origin && destination && !rutas.has(`${origin}>${destination}`))
      rutas.set(`${origin}>${destination}`, { origin, destination, ranges: [], fictitious: false });
  }
  const nombre = (codigo: string) => datos?.catalogo.terminals.find(t => t.code === codigo)?.name ?? codigo;
  const fallo = error ? mensajeTarifario(error) : null;
  return <div className="space-y-6">
    <h1 className="text-xl font-semibold text-navy sm:text-2xl">Tarifario</h1>
    <p>Configuración del servidor para encomiendas, recargo por valor declarado y equipaje. El cotizador público y counter consultan el mismo motor de cotización.</p>
    {aviso && <p role="status" className="rounded-md bg-success-fill p-4 text-success-text">{aviso}</p>}
    {cargando ? <Skeleton variant="card" /> : fallo ? <EmptyState icon={<ExclamationIcon className="size-8" />} title={fallo.titulo} description={fallo.descripcion} actionLabel="Reintentar tarifario" onAction={recargar} /> : datos && <>
      <Button variant="secundario" onClick={recargar}>Actualizar tarifario desde el servidor</Button>
      {(datos.tarifario.routes.some(r => r.fictitious) || datos.tarifario.declaredValueSurchargeFictitious) && <p className="rounded-md bg-warning-fill p-4 text-warning-text">El tarifario contiene datos ficticios de prueba. Revisa las marcas de cada ruta y del recargo antes de considerarlos montos comerciales.</p>}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-navy">Encomiendas por ruta</h2>
        {rutas.size ? [...rutas.values()].map(r => <RangosEncomiendaCard key={`${r.origin}>${r.destination}`} titulo={`${nombre(r.origin)} → ${nombre(r.destination)}`} ruta={r} onGuardar={guardarRuta} />) : <EmptyState icon={<ScaleIcon className="size-8" />} title="No hay rutas para configurar" description="La empresa debe registrar una ruta en el catálogo antes de definir sus montos." actionLabel="Actualizar consulta" onAction={recargar} />}
      </section>
      <RecargoValorDeclaradoCard tarifario={datos.tarifario} onGuardar={guardarPorcentaje} />
    </>}
    <EquipajeCard />
    <p className="text-sm text-text-secondary">Cada encomienda guarda su cotización congelada al registrarse.</p>
  </div>;
}
