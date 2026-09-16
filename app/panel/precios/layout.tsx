import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { esSupervisor } from "@/lib/mock/sesion";
import { obtenerRolDemo } from "@/lib/auth/sesion";
import { RUTAS } from "@/lib/routes";

/**
 * Restricción explícita del prompt: "Acceso solo para rol supervisor."
 * app/panel/layout.tsx ya exige ser personal (counter o supervisor); este
 * layout anidado agrega el filtro más estricto solo para /panel/precios. Un
 * counter que entre por URL directa vuelve al índice del panel, no a la
 * pantalla pública — sigue siendo personal, solo que no puede tocar
 * tarifas.
 */
export default async function PanelPreciosLayout({ children }: { children: ReactNode }) {
  if (!esSupervisor(await obtenerRolDemo())) {
    redirect(RUTAS.panel);
  }

  return <>{children}</>;
}
