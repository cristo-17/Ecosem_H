"use client";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { EstadoFlota, useDatosFlota } from "@/components/panel/EstadoFlota";
import { listarUnidades } from "@/lib/api/flota";
import { rutaPanelUnidad } from "@/lib/routes";
export function FlotaView() {
  const estado = useDatosFlota(listarUnidades);
  return <div className="space-y-6">
    <h1 className="text-xl font-semibold text-navy">Flota</h1>
    {estado.cargando || estado.error || !estado.datos?.units.length ? <EstadoFlota {...estado} /> : estado.datos.units.map(u => <Link className="block" key={u.unitId} href={rutaPanelUnidad(u.plate)}>
      <Card>
        <h2 className="font-semibold">{u.plate} · {u.model}</h2>
        <p>{u.serviceType} · {u.capacity} asientos · {u.active ? "Activa" : "Inactiva"}</p>
        <p>{u.mileageKm.toLocaleString("es-PE")} km · {u.activeAlerts} alertas activas</p>
      </Card>
    </Link>)}
  </div>;
}
