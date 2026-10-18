import { obtenerSesion } from "@/lib/auth/sesion";
import { NuevaClaveView } from "./NuevaClaveView";

/**
 * Se llega desde el enlace de recuperación (app/auth/confirmar), que abre una
 * sesión. Sin ella, el enlace venció o ya se usó.
 */
export default async function NuevaClavePage() {
  return <NuevaClaveView conSesion={(await obtenerSesion()) !== null} />;
}
