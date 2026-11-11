"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SteeringWheelIcon } from "@/components/ui/icons";
import { RegistroUnidad } from "@/components/panel/RegistroFlota";
import { EstadoFlota, useDatosFlota } from "@/components/panel/EstadoFlota";
import { listarUnidades } from "@/lib/api/flota";
import { rutaPanelUnidad } from "@/lib/routes";
export function FlotaView() {
  const estado = useDatosFlota(listarUnidades);
  const [registrando, setRegistrando] = useState(false);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 ref={tituloRef} tabIndex={-1} className="text-xl font-semibold text-navy">Flota</h1>
      <Button onClick={() => setRegistrando(true)}>Registrar unidad</Button>
    </div>
    {estado.cargando || estado.error ? <EstadoFlota {...estado} /> : !estado.datos?.units.length ? <EmptyState
      icon={<SteeringWheelIcon className="!size-12 !text-text-muted" />}
      title="Aún no hay unidades registradas"
      description="Registra la primera unidad con su placa, capacidad y tipo de servicio para preparar tus viajes."
      actionLabel="Registrar unidad" onAction={() => setRegistrando(true)}
    /> : estado.datos.units.map(u => <Link className="block" key={u.unitId} href={rutaPanelUnidad(u.plate)}>
      <Card>
        <h2 className="font-semibold">{u.plate} · {u.model}</h2>
        <p>{u.serviceType} · {u.capacity} asientos · {u.active ? "Activa" : "Inactiva"}</p>
        <p>{u.mileageKm.toLocaleString("es-PE")} km · {u.activeAlerts} alertas activas</p>
      </Card>
    </Link>)}
    {registrando && <RegistroUnidad onClose={() => setRegistrando(false)} onRegistered={estado.recargar} returnFocusRef={tituloRef} />}
  </div>;
}
