import { CajaView } from "./CajaView";
import { esSupervisor } from "@/lib/auth/roles";
import { obtenerSesion } from "@/lib/auth/sesion";

export default async function PanelCajaPage() {
  // El layout ya exigió personal. El rol solo decide si se pide la agencia al
  // abrir el turno; qué turno y qué cobros se ven lo decide el backend.
  const rol = (await obtenerSesion())?.rol ?? "pasajero";
  return <CajaView eligeAgencia={esSupervisor(rol)} />;
}
