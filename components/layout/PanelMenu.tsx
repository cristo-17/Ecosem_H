"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { RUTAS } from "@/lib/routes";
import { esSupervisor, type RolUsuario } from "@/lib/mock/sesion";

interface EnlacePanel {
  href: string;
  label: string;
}

const ENLACES_COUNTER: EnlacePanel[] = [
  { href: RUTAS.panel, label: "Inicio del panel" },
  { href: RUTAS.panelVenta, label: "Venta" },
  { href: RUTAS.panelCaja, label: "Caja" },
  { href: RUTAS.panelViajes, label: "Viajes del día" },
  { href: RUTAS.embarque, label: "Embarque" },
];

const ENLACES_SUPERVISOR_EXTRA: EnlacePanel[] = [
  { href: RUTAS.panelPrecios, label: "Precios" },
  { href: RUTAS.panelTarifario, label: "Tarifario" },
  { href: RUTAS.panelFlota, label: "Flota" },
  { href: RUTAS.panelConductores, label: "Conductores" },
  { href: RUTAS.panelAlertas, label: "Alertas" },
];

export function enlacesPanel(rol: RolUsuario): EnlacePanel[] {
  return esSupervisor(rol) ? [...ENLACES_COUNTER, ...ENLACES_SUPERVISOR_EXTRA] : ENLACES_COUNTER;
}

export interface PanelMenuProps {
  rol: RolUsuario;
}

/**
 * Menú desplegable "Panel" para el TopBar de escritorio
 * (docs/prompts/16-navbar-por-rol.md, D-041): con hasta 10 enlaces internos
 * (counter + supervisor), meterlos todos sueltos en la barra los mezclaría
 * con la navegación pública — el prompt pide agruparlos, no mezclarlos.
 * Mismo patrón de disclosure que components/ui/Accordion.tsx (`<button
 * aria-expanded aria-controls>` + panel asociado), no un `role="menu"` con
 * roving tabindex: es una lista de enlaces de navegación, no una lista de
 * acciones — un disclosure simple es un patrón accesible más robusto acá.
 */
export function PanelMenu({ rol }: PanelMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const enlaces = enlacesPanel(rol);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function cerrar() {
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((valor) => !valor)}
        className="flex h-10 items-center gap-1 rounded-pill px-4 text-sm font-semibold text-text-primary transition hover:bg-navy/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
      >
        Panel
        <ChevronDownIcon className={cn("!size-4", open && "rotate-180")} />
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute top-full left-0 z-20 mt-1 min-w-48 rounded-md border border-border-default bg-white py-1 shadow-medium"
        >
          {enlaces.map((enlace) => (
            <Link
              key={enlace.href}
              href={enlace.href}
              onClick={cerrar}
              className="flex min-h-11 items-center px-4 text-sm font-medium text-text-primary transition hover:bg-navy/5"
            >
              {enlace.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
