import { EncomiendasView } from "./EncomiendasView";
import { esSupervisor } from "@/lib/auth/roles";
import { obtenerSesion } from "@/lib/auth/sesion";

export default async function PanelEncomiendasPage() {
  // El layout ya exigió personal. La agencia y el rol solo deciden qué se
  // muestra; svc-encomiendas vuelve a tomarlos del token y de la base.
  const sesion = await obtenerSesion();
  return (
    <EncomiendasView
      terminalId={sesion?.terminalId ?? null}
      eligeAgencia={esSupervisor(sesion?.rol ?? "pasajero")}
    />
  );
}
