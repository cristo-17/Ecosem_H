"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExclamationIcon } from "@/components/ui/icons";
import { listarTarifas, listarFactores, auditoriaPrecios, guardarTarifa, guardarFactor, mensajePrecios } from "@/lib/api/precios";
import type { SaveFareRequest, SavePriceFactorRequest } from "@/lib/types/contratos-panel";
import type { OpcionesPeticion } from "@/lib/api/cliente";
import { TablaRutas } from "./TablaRutas";
import { TablaFactores } from "./TablaFactores";
import { SimuladorPrecio } from "./SimuladorPrecio";
import { HistorialCambios } from "./HistorialCambios";
async function cargar(opciones: OpcionesPeticion = {}) {
  const [tarifas, factores, auditoria] = await Promise.all([listarTarifas(opciones), listarFactores(opciones), auditoriaPrecios(opciones)]);
  return { tarifas, factores, auditoria };
}
type Estado = {
  tipo: "cargando";
} | {
  tipo: "error";
  error: unknown;
} | {
  tipo: "listo";
  datos: Awaited<ReturnType<typeof cargar>>;
};
export function PreciosView() {
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });
  const [aviso, setAviso] = useState("");
  useEffect(() => {
    const controlador = new AbortController();
    cargar({ signal: controlador.signal }).then(datos => {
      if (!controlador.signal.aborted)
        setEstado({ tipo: "listo", datos });
    }).catch(error => {
      if (!controlador.signal.aborted)
        setEstado({ tipo: "error", error });
    });
    return () => controlador.abort();
  }, []);
  async function recargar() {
    setEstado({ tipo: "cargando" });
    try {
      setEstado({ tipo: "listo", datos: await cargar() });
    }
    catch (error) {
      setEstado({ tipo: "error", error });
    }
  }
  async function guardarRuta(ruta: string, cuerpo: SaveFareRequest) {
    await guardarTarifa(ruta, cuerpo);
    setAviso("Tarifa guardada en el servidor. Se actualizan las tarifas, los factores y la auditoría.");
    await recargar();
  }
  async function guardarRegla(id: string | null, cuerpo: SavePriceFactorRequest) {
    await guardarFactor(id, cuerpo);
    setAviso("Factor guardado en el servidor. Se actualizan las tarifas, los factores y la auditoría.");
    await recargar();
  }
  const error = estado.tipo === "error" ? mensajePrecios(estado.error) : null;
  return <div className="space-y-6">
    <h1 className="text-xl font-semibold text-navy sm:text-2xl">Motor de precios</h1>
    <p>Configuración y auditoría del servidor: tarifa base × ocupación × anticipación × temporada, con topes por ruta.</p>
    {aviso && <p role="status" className="rounded-md bg-success-fill p-4 text-success-text">{aviso}</p>}
    {estado.tipo === "cargando" ? <div className="space-y-4">
      <Skeleton variant="card" />
      <Skeleton variant="card" />
      <Skeleton variant="card" />
    </div> : error ? <EmptyState icon={<ExclamationIcon className="size-8" />} title={error.titulo} description={`${error.descripcion} No se están mostrando datos de respaldo. Si acabas de guardar, reintenta solo la consulta.`} actionLabel="Reintentar consulta" onAction={() => { void recargar(); }} /> : estado.tipo === "listo" && <>
      <Button variant="secundario" onClick={() => { setAviso(""); void recargar(); }}>Actualizar desde el servidor</Button>
      {estado.datos.tarifas.fares.some(t => t.fictitious) && <p className="rounded-md bg-warning-fill p-4 text-warning-text">Hay tarifas ficticias de prueba. Cada ruta conserva su marca visible; estos importes no deben interpretarse como tarifas comerciales aprobadas.</p>}
      {!estado.datos.factores.factors.some(f => f.active) && <p className="rounded-md bg-info-fill p-4 text-info-text">No hay factores activos. Es una configuración válida: los multiplicadores son ×1 y el motor usa la tarifa base, respetando los topes de la ruta.</p>}
      <TablaRutas rutas={estado.datos.tarifas.fares} onGuardar={guardarRuta} recargar={() => { void recargar(); }} />
      {(["ocupacion", "anticipacion", "temporada"] as const).map(tipo => <TablaFactores key={tipo} tipo={tipo} factores={estado.datos.factores.factors.filter(f => f.type === tipo)} onGuardar={guardarRegla} />)}
      <SimuladorPrecio rutas={estado.datos.tarifas.fares} />
      <HistorialCambios historial={estado.datos.auditoria.changes} />
    </>}
  </div>;
}
