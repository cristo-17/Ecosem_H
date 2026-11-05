import { obtenerSesion } from "@/lib/auth/sesion";
import ImpresionesView from "./ImpresionesView";

export default async function Page() {
  return <ImpresionesView supervisor={(await obtenerSesion())?.rol === "supervisor"} />;
}
