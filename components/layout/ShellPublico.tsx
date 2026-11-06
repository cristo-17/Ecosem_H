"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import type { RolUsuario } from "@/lib/auth/roles";

export interface ShellPublicoProps {
  haySesion: boolean;
  rol: RolUsuario;
  children: ReactNode;
}

/** Las herramientas internas tienen navegación propia, sin chrome público. */
export function ShellPublico({ haySesion, rol, children }: ShellPublicoProps) {
  const pathname = usePathname();
  const esInterna = ["/embarque", "/panel"].some((ruta) => pathname === ruta || pathname?.startsWith(`${ruta}/`));

  return (
    <>
      {!esInterna && <TopBar haySesion={haySesion} rol={rol} />}
      <div className="flex-1">{children}</div>
      {!esInterna && <Footer />}
    </>
  );
}
