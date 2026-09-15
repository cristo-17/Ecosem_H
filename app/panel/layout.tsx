import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HAY_SESION_MOCK, ROL_MOCK, esPersonal } from "@/lib/mock/sesion";
import { RUTAS } from "@/lib/routes";

/**
 * Panel interno: por ahora solo `/panel/viajes` (manifiesto —
 * docs/prompts/09-manifiesto-sutran.md). Esta rama viene de `main` y no
 * incluye todavía `feature/08-panel-counter` (ya en `origin`, sin
 * mergear), así que el layout del panel se rehace acá con el mismo mock
 * de rol de esa rama en vez de asumir que existe: cuando se mergeen ambas,
 * este archivo va a chocar con el de esa rama y hay que quedarse con uno
 * solo (mismo contenido, ver docs/DECISIONES.md).
 *
 * La comprobación de acceso es de interfaz nomás — corre en un Server
 * Component antes de renderizar nada, pero sin backend real detrás. La
 * verificación real de acceso al panel va a vivir server-side con RLS.
 */
export default function PanelLayout({ children }: { children: ReactNode }) {
  if (!HAY_SESION_MOCK || !esPersonal(ROL_MOCK)) {
    redirect(RUTAS.inicio);
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col">
      <header className="bg-navy px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-white/60">Panel interno · Personal</p>
            <h1 className="text-lg font-semibold text-white">Ecosem H · Counter</h1>
          </div>
          <nav aria-label="Secciones del panel" className="flex flex-wrap gap-1">
            <Link
              href={RUTAS.panel}
              className="flex min-h-11 items-center rounded-field px-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Inicio
            </Link>
             <Link
              href={RUTAS.panelViajes}
              className="flex min-h-11 items-center rounded-field px-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Viajes
            </Link>
            <Link
              href={RUTAS.panelVenta}
              className="flex min-h-11 items-center rounded-field px-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Venta
            </Link>
            <Link
              href={RUTAS.panelCaja}
              className="flex min-h-11 items-center rounded-field px-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Caja
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8">{children}</div>
    </div>
  );
}
