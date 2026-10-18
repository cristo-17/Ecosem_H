import type { ReactNode } from "react";
import { AccesoDenegado } from "@/components/layout/AccesoDenegado";
import { exigirAcceso } from "@/lib/auth/sesion";
import { RUTAS } from "@/lib/routes";

/**
 * Restricción explícita del prompt: "Acceso solo para rol supervisor."
 * Mismo patrón que app/panel/precios/layout.tsx: app/panel/layout.tsx ya
 * exige ser personal, esto agrega el filtro estricto para toda la sección
 * de flota (listado, detalle de unidad).
 */
export default async function PanelFlotaLayout({ children }: { children: ReactNode }) {
  // Rol verificado en el servidor (token firmado). Un counter que llega por
  // URL ve "acceso denegado" y nada de la sección.
  const acceso = await exigirAcceso("supervisor", RUTAS.panelFlota);
  if (acceso.tipo === "denegado") {
    return <AccesoDenegado volverA={RUTAS.panel} etiquetaVolver="Volver al panel" />;
  }

  return <>{children}</>;
}
