import { ViajesDelDiaView } from "./ViajesDelDiaView";
import { esSupervisor } from "@/lib/auth/roles";
import { obtenerSesion } from "@/lib/auth/sesion";

export default async function PanelViajesPage() {
  // El layout ya exigió personal. Qué viajes se ven lo decide el backend.
  const rol = (await obtenerSesion())?.rol ?? "pasajero";
  return <ViajesDelDiaView eligeAgencia={esSupervisor(rol)} />;
}
