import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ROL_MOCK, esPersonal, esSupervisor } from "@/lib/mock/sesion";
import { haySesionActiva } from "@/lib/auth/sesion";
import { RUTAS } from "@/lib/routes";

/**
 * Panel interno: venta en counter, arqueo de caja y manifiesto SUTRAN
 * (docs/prompts/08, 09). El merge de `feature/autenticacion` (sesión real
 * vía cookie, `lib/auth/sesion.ts`) con `feature/panel-counter` y
 * `feature/manifiesto-sutran` (que todavía chequeaban `HAY_SESION_MOCK`,
 * eliminada por la primera) dejó este archivo sin compilar — corregido acá
 * usando la sesión real + el rol, que sigue siendo mock (`ROL_MOCK` en
 * lib/mock/sesion.ts) hasta que exista un rol real por usuario.
 *
 * La comprobación de acceso es de interfaz nomás — corre en un Server
 * Component antes de renderizar nada, pero sin RLS real detrás todavía. La
 * verificación real de acceso al panel va a vivir server-side con RLS.
 */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  if (!(await haySesionActiva()) || !esPersonal(ROL_MOCK)) {
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
            {/* Solo supervisor: el layout de /panel/precios repite este
                mismo chequeo por si alguien llega por URL directa, pero acá
                además evita mostrarle el enlace a quien no puede entrar. */}
            {esSupervisor(ROL_MOCK) && (
              <Link
                href={RUTAS.panelPrecios}
                className="flex min-h-11 items-center rounded-field px-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Precios
              </Link>
            )}
            {/* Flota, Conductores y Alertas: mismo filtro solo-supervisor que Precios (docs/prompts/12-alertas-flota.md). */}
            {esSupervisor(ROL_MOCK) && (
              <Link
                href={RUTAS.panelFlota}
                className="flex min-h-11 items-center rounded-field px-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Flota
              </Link>
            )}
            {esSupervisor(ROL_MOCK) && (
              <Link
                href={RUTAS.panelConductores}
                className="flex min-h-11 items-center rounded-field px-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Conductores
              </Link>
            )}
            {esSupervisor(ROL_MOCK) && (
              <Link
                href={RUTAS.panelAlertas}
                className="flex min-h-11 items-center rounded-field px-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Alertas
              </Link>
            )}
            {/* Tarifario: mismo filtro solo-supervisor (docs/prompts/13-tarifario-encomiendas.md). */}
            {esSupervisor(ROL_MOCK) && (
              <Link
                href={RUTAS.panelTarifario}
                className="flex min-h-11 items-center rounded-field px-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Tarifario
              </Link>
            )}
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8">{children}</div>
    </div>
  );
}
