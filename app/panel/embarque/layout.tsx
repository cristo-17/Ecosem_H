import type { ReactNode } from "react";
import { exigirAcceso } from "@/lib/auth/sesion";
import { AccesoDenegado } from "@/components/layout/AccesoDenegado";
import { RUTAS } from "@/lib/routes";

export default async function PanelEmbarqueLayout({ children }: { children: ReactNode }) {
  const acceso = await exigirAcceso("supervisor", RUTAS.panelEmbarque);
  if (acceso.tipo === "denegado") return <AccesoDenegado volverA={RUTAS.panel} etiquetaVolver="Volver al panel" />;
  return children;
}
