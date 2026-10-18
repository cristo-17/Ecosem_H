import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { AccesoDenegado } from "@/components/layout/AccesoDenegado";
import { exigirAcceso } from "@/lib/auth/sesion";
import { RUTAS } from "@/lib/routes";
import { RegistrarServiceWorker } from "./RegistrarServiceWorker";
import { EmbarqueHeader } from "./EmbarqueHeader";

export const metadata: Metadata = {
  title: "Embarque · Ecosem H",
  description: "Validación de embarque por QR, sin conexión.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Embarque",
  },
};

export const viewport: Viewport = {
  themeColor: "#10233F",
};

/**
 * Igual que /panel: rol verificado en el servidor desde el token firmado
 * (`exigirAcceso`). Acá además decide qué usuario puede instalar y usar
 * la PWA de embarque; por ahora el mismo rol de personal que el panel
 * (`esPersonal`), sin un rol "embarque" propio — no se justifica todavía
 * separar counter/embarque cuando ninguno de los dos tiene permisos reales
 * distintos.
 */
export default async function EmbarqueLayout({ children }: { children: ReactNode }) {
  const acceso = await exigirAcceso("personal", RUTAS.embarque);
  if (acceso.tipo === "denegado") return <AccesoDenegado />;

  return (
    <div className="flex min-h-screen flex-col bg-surface-base">
      <RegistrarServiceWorker />
      <EmbarqueHeader />
      <div className="flex-1 px-4 py-4 sm:px-6">{children}</div>
    </div>
  );
}
