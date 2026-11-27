import type { ReactNode } from "react";
import { AccesoDenegado } from "@/components/layout/AccesoDenegado";
import { PanelHeader } from "@/components/layout/PanelHeader";
import { puedeEmbarcar } from "@/lib/auth/roles";
import { exigirAcceso } from "@/lib/auth/sesion";
import { RUTAS } from "@/lib/routes";

/**
 * Panel interno: venta en counter, arqueo de caja y manifiesto SUTRAN
 * (docs/prompts/08, 09).
 *
 * El rol sale del token de Supabase Auth verificado en el servidor
 * (`exigirAcceso`, lib/auth/sesion.ts): sin sesión, al ingreso; con sesión de
 * pasajero o de embarque, "acceso denegado" y nada del panel se renderiza
 * (embarque solo usa /embarque). Editar cookies o
 * el HTML en el navegador no cambia el rol: rompe la firma del token. Los
 * datos reales del panel los entregan los servicios, que vuelven a verificar
 * el token y que el personal siga activo en la base (D-015 del backend).
 */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const acceso = await exigirAcceso("panel", RUTAS.panel);
  if (acceso.tipo === "denegado") {
    // Embarque escribió /panel a mano: su único lugar es /embarque.
    return puedeEmbarcar(acceso.sesion.rol) ? (
      <AccesoDenegado volverA={RUTAS.embarque} etiquetaVolver="Ir a embarque" />
    ) : (
      <AccesoDenegado />
    );
  }
  const { rol } = acceso.sesion;

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col">
      <PanelHeader rol={rol} />
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8">{children}</div>
    </div>
  );
}
