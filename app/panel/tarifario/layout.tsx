import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { esSupervisor } from "@/lib/mock/sesion";
import { obtenerRolDemo } from "@/lib/auth/sesion";
import { RUTAS } from "@/lib/routes";

/** Configurar tarifas es cosa de supervisor, no de counter — mismo patrón que app/panel/precios/layout.tsx. */
export default async function PanelTarifarioLayout({ children }: { children: ReactNode }) {
  if (!esSupervisor(await obtenerRolDemo())) {
    redirect(RUTAS.panel);
  }

  return <>{children}</>;
}
