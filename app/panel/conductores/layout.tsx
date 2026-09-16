import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { esSupervisor } from "@/lib/mock/sesion";
import { obtenerRolDemo } from "@/lib/auth/sesion";
import { RUTAS } from "@/lib/routes";

/** Restricción explícita del prompt: "Acceso solo para rol supervisor." Mismo patrón que app/panel/precios/layout.tsx. */
export default async function PanelConductoresLayout({ children }: { children: ReactNode }) {
  if (!esSupervisor(await obtenerRolDemo())) {
    redirect(RUTAS.panel);
  }

  return <>{children}</>;
}
