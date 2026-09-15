import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { ROL_MOCK, esSupervisor } from "@/lib/mock/sesion";
import { RUTAS } from "@/lib/routes";

/** Restricción explícita del prompt: "Acceso solo para rol supervisor." Mismo patrón que app/panel/precios/layout.tsx. */
export default function PanelAlertasLayout({ children }: { children: ReactNode }) {
  if (!esSupervisor(ROL_MOCK)) {
    redirect(RUTAS.panel);
  }

  return <>{children}</>;
}
