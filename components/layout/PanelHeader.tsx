"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useIsMounted } from "@/lib/useIsMounted";
import { CloseIcon, LogOutIcon, MenuIcon } from "@/components/ui/icons";
import { BotonCerrarSesion, ejecutarCierreSesion } from "@/components/layout/BotonCerrarSesion";
import { esSupervisor, type RolUsuario } from "@/lib/auth/roles";
import { RUTAS } from "@/lib/routes";

const ETIQUETA_ROL: Record<RolUsuario, string> = {
  pasajero: "Pasajero",
  counter: "Counter",
  supervisor: "Supervisor",
  embarque: "Embarque",
};

interface EnlaceSeccion {
  href: string;
  label: string;
}

const ENLACES_OPERACION: EnlaceSeccion[] = [
  { href: RUTAS.panel, label: "Inicio" },
  { href: RUTAS.panelViajes, label: "Viajes" },
  { href: RUTAS.panelVenta, label: "Venta" },
  { href: RUTAS.panelCaja, label: "Caja" },
  { href: RUTAS.panelEncomiendas, label: "Encomiendas" },
  { href: RUTAS.panelImpresiones, label: "Impresiones" },
];

const ENLACES_SUPERVISION: EnlaceSeccion[] = [
  { href: RUTAS.panelPrecios, label: "Precios" },
  { href: RUTAS.panelFlota, label: "Flota" },
  { href: RUTAS.panelConductores, label: "Conductores" },
  { href: RUTAS.panelAlertas, label: "Alertas" },
  { href: RUTAS.panelEmbarque, label: "Regla de embarque" },
  { href: RUTAS.panelTarifario, label: "Tarifario" },
  { href: RUTAS.panelPersonal, label: "Personal" },
];

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

export function PanelHeader({ rol }: { rol: RolUsuario }) {
  const router = useRouter();
  const mounted = useIsMounted();
  const [open, setOpen] = useState(false);
  const [cerrandoMovil, setCerrandoMovil] = useState(false);
  const openRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const supervisor = esSupervisor(rol);
  const enlacesEscritorio = supervisor
    ? [...ENLACES_OPERACION, ...ENLACES_SUPERVISION]
    : ENLACES_OPERACION;

  useEffect(() => {
    if (!open) return;

    const trigger = openRef.current;
    document.body.style.overflow = "hidden";
    const container = dialogRef.current;
    const [firstFocusable] = container ? getFocusableElements(container) : [];
    firstFocusable?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !container) return;
      const focusable = getFocusableElements(container);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
      trigger?.focus();
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  async function handleCerrarSesionMovil() {
    if (cerrandoMovil) return;
    setCerrandoMovil(true);
    try {
      closeMenu();
      await ejecutarCierreSesion();
      router.push(RUTAS.ingresar);
      router.refresh();
    } finally {
      setCerrandoMovil(false);
    }
  }

  return (
    <header className="bg-navy px-4 py-3.5 sm:px-8 sm:py-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 md:flex-wrap">
        <div>
          <p className="text-xs font-medium text-white/60">Panel interno · Personal</p>
          <h1 className="text-lg font-semibold text-white">Ecosem H · {ETIQUETA_ROL[rol]}</h1>
        </div>

        {/* BOTÓN HAMBURGUESA EN MÓVIL (< 768px) */}
        <button
          ref={openRef}
          type="button"
          aria-label="Abrir menú del panel"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="flex size-11 items-center justify-center rounded-field text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:hidden"
        >
          <MenuIcon className="!text-white" />
        </button>

        {/* NAVEGACIÓN HORIZONTAL EN ESCRITORIO (>= 768px) */}
        <nav aria-label="Secciones del panel" className="hidden md:flex md:flex-wrap md:items-center md:gap-1">
          {enlacesEscritorio.map((enlace) => (
            <Link
              key={enlace.href}
              href={enlace.href}
              className="flex min-h-11 items-center rounded-field px-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {enlace.label}
            </Link>
          ))}
          <span aria-hidden="true" className="mx-1 h-6 w-px self-center bg-white/15" />
          <BotonCerrarSesion variante="navy" destino={RUTAS.ingresar} />
        </nav>
      </div>

      {/* MENÚ MÓVIL DEL PANEL INTERNO (ORGANIZADO POR SECCIONES) */}
      {open &&
        mounted &&
        createPortal(
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menú del panel interno"
            className="fixed inset-0 z-50 flex flex-col bg-navy p-4 md:hidden"
          >
            <div className="flex h-14 items-center justify-between border-b border-white/10 pb-3">
              <div>
                <p className="text-xs font-medium text-white/60">Panel interno · Personal</p>
                <p className="text-base font-semibold text-white">Ecosem H · {ETIQUETA_ROL[rol]}</p>
              </div>
              <button
                type="button"
                aria-label="Cerrar menú del panel"
                onClick={closeMenu}
                className="flex size-11 items-center justify-center rounded-field transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <CloseIcon className="!size-6 !text-white" />
              </button>
            </div>

            <nav
              aria-label="Secciones del panel interno"
              className="mt-4 flex min-h-0 flex-1 flex-col overflow-y-auto"
            >
              <div>
                <p className="mb-2 px-3 text-xs font-semibold tracking-wider text-white/50 uppercase">
                  Operación diaria
                </p>
                <ul className="flex flex-col gap-1">
                  {ENLACES_OPERACION.map((enlace) => (
                    <li key={enlace.href}>
                      <Link
                        href={enlace.href}
                        onClick={closeMenu}
                        className="flex min-h-11 items-center rounded-field px-3 text-base font-medium text-white/90 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        {enlace.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {supervisor && (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <p className="mb-2 px-3 text-xs font-semibold tracking-wider text-white/50 uppercase">
                    Supervisión y configuración
                  </p>
                  <ul className="flex flex-col gap-1">
                    {ENLACES_SUPERVISION.map((enlace) => (
                      <li key={enlace.href}>
                        <Link
                          href={enlace.href}
                          onClick={closeMenu}
                          className="flex min-h-11 items-center rounded-field px-3 text-base font-medium text-white/90 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        >
                          {enlace.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-auto border-t border-white/10 pt-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
                <Link
                  href={RUTAS.inicio}
                  onClick={closeMenu}
                  className="mb-2 flex min-h-11 items-center rounded-field px-3 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  ← Ir al portal público
                </Link>
                <button
                  type="button"
                  onClick={handleCerrarSesionMovil}
                  disabled={cerrandoMovil}
                  aria-busy={cerrandoMovil}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-pill bg-primary px-4 text-base font-semibold text-white shadow-low transition hover:bg-primary/90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <LogOutIcon />
                  <span>{cerrandoMovil ? "Procesando..." : "Cerrar sesión"}</span>
                </button>
              </div>
            </nav>
          </div>,
          document.body,
        )}
    </header>
  );
}
