import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { ROL_MOCK, esSupervisor } from "@/lib/mock/sesion";
import { RUTAS } from "@/lib/routes";

/** Configurar tarifas es cosa de supervisor, no de counter — mismo patrón que app/panel/precios/layout.tsx. */
export default function PanelTarifarioLayout({ children }: { children: ReactNode }) {
  if (!esSupervisor(ROL_MOCK)) {
    redirect(RUTAS.panel);
  }

  return <>{children}</>;
}
