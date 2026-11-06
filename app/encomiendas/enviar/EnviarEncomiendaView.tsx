"use client";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { PinIcon, ExclamationIcon, SearchOffIcon } from "@/components/ui/icons";
import { DesgloseCotizacion } from "@/components/encomiendas/DesgloseCotizacion";
import { obtenerCatalogo } from "@/lib/api/ventas";
import { cotizar, mensajeEncomienda } from "@/lib/api/encomiendas";
import { leerMonto } from "@/lib/api/caja";
import type { CatalogResponse } from "@/lib/types/contratos-frontend";
import type { ParcelQuoteRequest, ParcelQuote } from "@/lib/types/contratos-panel";
export function EnviarEncomiendaView() {
  const [catalogo, setCatalogo] = useState<CatalogResponse | null>(null);
  const [errorCatalogo, setErrorCatalogo] = useState<unknown>(null);
  const [intento, setIntento] = useState(0);
  const [origen, setOrigen] = useState<string | null>(null);
  const [destino, setDestino] = useState<string | null>(null);
  const [medidas, setMedidas] = useState({ peso: "", largo: "", ancho: "", alto: "", valor: "" });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [cotizando, setCotizando] = useState(false);
  const [resultado, setResultado] = useState<ParcelQuote | null>(null);
  const [errorCotizacion, setErrorCotizacion] = useState<unknown>(null);
  useEffect(() => {
    let activo = true;
    obtenerCatalogo().then(datos => {
      if (activo)
        setCatalogo(datos);
    })
      .catch(e => {
        if (activo)
          setErrorCatalogo(e);
      });
    return () => { activo = false; };
  }, [intento]);
  function recargar() { setCatalogo(null); setErrorCatalogo(null); setIntento(i => i + 1); }
  function limpiarCotizacion() { setResultado(null); setErrorCotizacion(null); setErrores({}); }
  function actualizar(campo: keyof typeof medidas, valor: string) {
    setMedidas(prev => ({ ...prev, [campo]: valor }));
    limpiarCotizacion();
  }
  const agenciaOrigen = catalogo?.terminals.find(t => t.code === origen);
  const origenes = catalogo?.terminals.filter(t => catalogo.routes.some(r => r.active && r.originId === t.id)) ?? [];
  const destinos = catalogo?.terminals.filter(t => catalogo.routes.some(r => r.active && r.originId === agenciaOrigen?.id && r.destinationId === t.id)) ?? [];
  async function solicitar(evento: FormEvent) {
    evento.preventDefault();
    if (cotizando)
      return;
    const e: Record<string, string> = {};
    if (!origen)
      e.origen = "Elige la agencia de origen";
    if (!destino || !destinos.some(t => t.code === destino))
      e.destino = "Elige una agencia de destino disponible";
    const weightKg = leerMonto(medidas.peso);
    if (weightKg === null || weightKg <= 0)
      e.peso = "Ingresa el peso en kg, mayor que cero y con hasta dos decimales";
    const lados = [medidas.largo, medidas.ancho, medidas.alto].map(v => v.trim() ? leerMonto(v) : null);
    const conMedidas = [medidas.largo, medidas.ancho, medidas.alto].some(v => v.trim());
    if (conMedidas && lados.some(v => v === null || v <= 0))
      e.medidas = "Ingresa las tres medidas en cm, mayores que cero, o deja las tres vacías";
    const declaredValue = medidas.valor.trim() ? leerMonto(medidas.valor) : null;
    if (medidas.valor.trim() && declaredValue === null)
      e.valor = "Ingresa un valor en soles de cero o mayor, con hasta dos decimales";
    setErrores(e);
    setResultado(null);
    setErrorCotizacion(null);
    if (Object.keys(e).length || !origen || !destino || weightKg === null)
      return;
    const pedido: ParcelQuoteRequest = {
      origin: origen, destination: destino, weightKg,
      lengthCm: conMedidas ? lados[0] : null, widthCm: conMedidas ? lados[1] : null, heightCm: conMedidas ? lados[2] : null,
      declaredValue,
    };
    setCotizando(true);
    try {
      setResultado(await cotizar(pedido));
    }
    catch (error) {
      setErrorCotizacion(error);
    }
    finally {
      setCotizando(false);
    }
  }
  const falloCatalogo = errorCatalogo ? mensajeEncomienda(errorCatalogo) : null;
  const falloCotizacion = errorCotizacion ? mensajeEncomienda(errorCotizacion) : null;
  return <main className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:py-12">
    <h1 className="text-xl font-semibold text-navy sm:text-2xl">Enviar encomienda</h1>
    <p>Consulta el precio de tu paquete con el mismo tarifario que usa counter. El servicio calcula el peso facturable, el rango y el recargo. Sin tarifa definida no se puede cotizar ni registrar: no se cobra a ojo.</p>
    {falloCatalogo ? <EmptyState icon={<ExclamationIcon className="size-8" />} title={falloCatalogo.titulo} description={falloCatalogo.descripcion} actionLabel="Reintentar agencias" onAction={recargar} /> : !catalogo ? <Skeleton variant="card" /> : !origenes.length ? <EmptyState icon={<SearchOffIcon className="size-8" />} title="No hay rutas disponibles" description="No encontramos agencias con rutas activas. Actualiza la consulta o consulta en counter." actionLabel="Actualizar agencias" onAction={recargar} /> : <form onSubmit={solicitar} noValidate>
      <Card className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Agencia de origen" options={origenes.map(t => ({ value: t.code, label: t.name }))} value={origen} disabled={cotizando} onChange={v => { setOrigen(v); setDestino(null); limpiarCotizacion(); }} icon={<PinIcon />} errorText={errores.origen} />
          <Select label="Agencia de destino" options={destinos.map(t => ({ value: t.code, label: t.name }))} value={destino} disabled={cotizando || !origen} onChange={v => { setDestino(v); limpiarCotizacion(); }} icon={<PinIcon />} errorText={errores.destino} />
        </div>
        <Input label="Peso real (kg)" inputMode="decimal" value={medidas.peso} readOnly={cotizando} onChange={e => actualizar("peso", e.target.value)} errorText={errores.peso} />
        <fieldset className="space-y-3">
          <legend className="font-medium">Dimensiones opcionales</legend>
          <p className="text-sm text-text-secondary">Completa las tres o ninguna. El servidor determina el mayor entre peso real y volumétrico.</p>
          <div className="grid gap-4 sm:grid-cols-3">{(["largo", "ancho", "alto"] as const).map(c => <Input key={c} label={`${c === "largo" ? "Largo" : c === "ancho" ? "Ancho" : "Alto"} (cm)`} inputMode="decimal" value={medidas[c]} readOnly={cotizando} onChange={e => actualizar(c, e.target.value)} />)}</div>
          {errores.medidas && <p role="alert" className="text-error-text">{errores.medidas}</p>}
        </fieldset>
        <Input label="Valor declarado (S/)" inputMode="decimal" value={medidas.valor} readOnly={cotizando} onChange={e => actualizar("valor", e.target.value)} errorText={errores.valor} helperText="Opcional. El servidor aplica el porcentaje de recargo vigente si corresponde." />
        <Button type="submit" isLoading={cotizando}>Cotizar</Button>
      </Card>
    </form>}
    {falloCotizacion && <div role="alert" className="space-y-2 rounded-md bg-error-fill p-4 text-error-text">
      <h2 className="font-semibold">{falloCotizacion.titulo}</h2>
      <p>{falloCotizacion.descripcion}</p>
      <p>No se confirmó una cotización. Revisa los datos o vuelve a consultar cuando la empresa haya definido la tarifa.</p>
    </div>}
    {resultado && <Card className="space-y-4">
      <h2 className="font-semibold text-navy">Cotización del servidor</h2>
      <DesgloseCotizacion cotizacion={resultado} />
      <p className="text-sm text-text-secondary">Al registrar una encomienda, su cotización queda guardada y congelada. Si cambias los datos de este paquete, debes volver a cotizar.</p>
    </Card>}
  </main>;
}
