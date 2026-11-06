"use client";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UrgenciaPill } from "@/components/ui/UrgenciaPill";
import { EstadoFlota, useDatosFlota } from "@/components/panel/EstadoFlota";
import { listarConductores, guardarConductor } from "@/lib/api/flota";
import { nivelDocumento } from "@/lib/flota";
import type { DriverView, SaveDriverRequest } from "@/lib/types/contratos-panel";
import { mensajeFlota } from "@/lib/api/flota";
function Conductor({ conductor: c, recargar }: {
  conductor: DriverView;
  recargar: () => Promise<void>;
}) {
  const [limite, setLimite] = useState(c.drivingHoursLimit ?? "");
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState("");
  const nivel = nivelDocumento(c.licenseExpiresOn);
  async function guardar() {
    if (limite !== "" && (!Number.isFinite(Number(limite)) || Number(limite) <= 0)) {
      setAviso("Ingresa un límite mayor que cero o déjalo vacío.");
      return;
    }
    setOcupado(true);
    setAviso("");
    try {
      const cuerpo: SaveDriverRequest = { firstNames: c.firstNames, lastNames: c.lastNames, licenseNumber: c.licenseNumber, licenseExpiresOn: c.licenseExpiresOn, drivingHoursLimit: limite === "" ? null : Number(limite) };
      await guardarConductor(c.driverId, cuerpo);
      setAviso("Límite guardado.");
      await recargar();
    }
    catch (e) {
      setAviso(mensajeFlota(e).descripcion);
    }
    finally {
      setOcupado(false);
    }
  }
  return <Card className="space-y-4">
    <h2 className="font-semibold">{c.firstNames} {c.lastNames}</h2>{`${c.firstNames}${c.lastNames}`.includes("\uFFFD") && <p role="alert" className="text-error-text">El nombre contiene un carácter de reemplazo en los datos del servicio. Reportar el dato dañado para su corrección en la base.</p>}<p>Licencia {c.licenseNumber} · vence {c.licenseExpiresOn}</p>{nivel && <UrgenciaPill urgencia={nivel} />}<p>{c.drivingHours} h acumuladas · {c.activeAlerts} alertas activas</p>
    <Input label="Límite de horas de este conductor" type="number" value={limite} onChange={e => setLimite(e.target.value)} helperText="Vacío: sin alerta por horas. El límite se guarda en el servidor." />
    <Button variant="secundario" isLoading={ocupado} onClick={guardar}>Guardar límite</Button>{aviso && <p role="status">{aviso}</p>}</Card>;
}
export function ConductoresView() {
  const estado = useDatosFlota(listarConductores);
  return <div className="space-y-6">
    <h1 className="text-xl font-semibold text-navy">Conductores</h1>{estado.cargando || estado.error || !estado.datos?.drivers.length ? <EstadoFlota {...estado} /> : estado.datos.drivers.map(c => <Conductor key={c.driverId} conductor={c} recargar={estado.recargar} />)}</div>;
}
