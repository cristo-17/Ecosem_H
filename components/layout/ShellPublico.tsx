"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import type { RolUsuario } from "@/lib/mock/sesion";

export interface ShellPublicoProps {
  haySesion: boolean;
  rol: RolUsuario;
  children: ReactNode;
}

/**
 * `/embarque` es una PWA instalable pensada para abrirse sola en la
 * pantalla de inicio de un celular en el andén (docs/prompts/10-pwa-embarque.md):
 * el TopBar de "Comprar Pasajes / Nosotros / Ayuda" y el Footer
 * institucional no tienen sentido ahí, y el manifest de la PWA declara
 * `start_url`/`display: standalone` esperando una pantalla propia, no el
 * sitio completo. app/layout.tsx es el único root layout del proyecto
 * (D-017: no se migró a route groups todavía), así que no hay forma de que
 * un layout anidado bajo /embarque saque al TopBar/Footer que ya renderizó
 * un layout ancestro — de ahí este componente cliente: decide con
 * `usePathname()` si los muestra o no. `/panel` sigue mostrando el chrome
 * público a propósito (D-017): es una app de escritorio para counter, no
 * una PWA instalable de pantalla completa.
 */
export function ShellPublico({ haySesion, rol, children }: ShellPublicoProps) {
  const pathname = usePathname();
  const esEmbarque = pathname?.startsWith("/embarque") ?? false;

  return (
    <>
      {!esEmbarque && <TopBar haySesion={haySesion} rol={rol} />}
      <div className="flex-1">{children}</div>
      {!esEmbarque && <Footer />}
    </>
  );
}
