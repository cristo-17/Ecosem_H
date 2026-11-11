import { DetalleViajeView } from "./DetalleViajeView";
import { obtenerSesion } from "@/lib/auth/sesion";
import { esSupervisor } from "@/lib/auth/roles";

export default async function PanelViajeDetallePage(props: PageProps<"/panel/viajes/[id]">) {
  const { id } = await props.params;

  const sesion = await obtenerSesion();
  return <DetalleViajeView key={id} viajeId={id} supervisor={!!sesion && esSupervisor(sesion.rol)} />;
}
