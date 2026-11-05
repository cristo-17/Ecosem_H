import { exigirAcceso } from "@/lib/auth/sesion";
import { AccesoDenegado } from "@/components/layout/AccesoDenegado";
import PersonalView from "./PersonalView";

export default async function Page() {
  const acceso = await exigirAcceso("supervisor", "/panel/personal");
  if (acceso.tipo === "denegado") return <AccesoDenegado volverA="/panel" etiquetaVolver="Volver al panel" />;
  return <PersonalView />;
}
