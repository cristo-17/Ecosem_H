import type { ReactNode } from "react";
import { AccesoDenegado } from "@/components/layout/AccesoDenegado";
import { exigirAcceso } from "@/lib/auth/sesion";
import { RUTAS } from "@/lib/routes";

/** Configurar tarifas es cosa de supervisor, no de counter — mismo patrón que app/panel/precios/layout.tsx. */
export default async function PanelTarifarioLayout({ children }: { children: ReactNode }) {
  // Rol verificado en el servidor (token firmado). Un counter que llega por
  // URL ve "acceso denegado" y nada de la sección.
  const acceso = await exigirAcceso("supervisor", RUTAS.panelTarifario);
  if (acceso.tipo === "denegado") {
    return <AccesoDenegado volverA={RUTAS.panel} etiquetaVolver="Volver al panel" />;
  }

  return <>{children}</>;
}
