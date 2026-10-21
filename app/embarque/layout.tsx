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
 * (`exigirAcceso`). Entran counter, supervisor y el rol `embarque`
 * (`puedeEmbarcar`), que es solo para esto: elegir viaje, bajar el paquete,
 * escanear y sincronizar. Embarque no entra al panel, y el backend le niega
 * venta, caja, tarifas, personal y manifiesto (D-XXX-rol-embarque).
 */
export default async function EmbarqueLayout({ children }: { children: ReactNode }) {
  const acceso = await exigirAcceso("embarque", RUTAS.embarque);
  if (acceso.tipo === "denegado") return <AccesoDenegado />;

  return (
    <div className="flex min-h-screen flex-col bg-surface-base">
      <RegistrarServiceWorker />
      <EmbarqueHeader />
      <div className="flex-1 px-4 py-4 sm:px-6">{children}</div>
    </div>
  );
}
