import type { ReactNode } from "react";
import { AccesoDenegado } from "@/components/layout/AccesoDenegado";
import { exigirAcceso } from "@/lib/auth/sesion";
import { RUTAS } from "@/lib/routes";

/**
 * Restricción explícita del prompt: "Acceso solo para rol supervisor."
 * app/panel/layout.tsx ya exige ser personal (counter o supervisor); este
 * layout anidado agrega el filtro más estricto solo para /panel/precios. Un
 * counter que entre por URL directa ve "acceso denegado" con un enlace al
 * panel: sigue siendo personal, solo que no puede tocar tarifas.
 */
export default async function PanelPreciosLayout({ children }: { children: ReactNode }) {
  // Rol verificado en el servidor (token firmado). Un counter que llega por
  // URL ve "acceso denegado" y nada de la sección.
  const acceso = await exigirAcceso("supervisor", RUTAS.panelPrecios);
  if (acceso.tipo === "denegado") {
    return <AccesoDenegado volverA={RUTAS.panel} etiquetaVolver="Volver al panel" />;
  }

  return <>{children}</>;
}
