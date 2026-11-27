"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { LogOutIcon } from "@/components/ui/icons";
import { cerrarSesion } from "@/lib/auth/acciones";
import { cerrarDatosEmbarque } from "@/lib/embarque/usuario";
import { olvidarSesionCompra } from "@/lib/api/compra";
import { RUTAS } from "@/lib/routes";

export interface BotonCerrarSesionProps {
  /**
   * "claro": para cabeceras sobre superficie blanca/base (ej. /mi-perfil).
   * "navy": para barras operativas sobre fondo --color-navy (ej. /panel y /embarque).
   */
  variante?: "claro" | "navy";
  /** Ruta a la que redirigir tras cerrar la sesión (por defecto "/"). */
  destino?: string;
  /** Si es true, se oculta en móvil (< 768px) y solo se muestra en escritorio (md:inline-flex). */
  soloEscritorio?: boolean;
  /** Si es true, en móvil (< 640px) muestra "Salir" compacto y en escritorio "Cerrar sesión". */
  compactoMovil?: boolean;
  className?: string;
}

/**
 * Ejecuta la secuencia completa de salida:
 * 1. Invalida la sesión local de Supabase Auth en cookies SSR.
 * 2. Desmonta el contexto activo de IndexedDB de embarque y avisa a otras pestañas.
 * 3. Limpia los identificadores de compra anónima de sessionStorage en la pestaña.
 */
export async function ejecutarCierreSesion(): Promise<void> {
  await cerrarSesion();
  cerrarDatosEmbarque();
  olvidarSesionCompra();
}

export function BotonCerrarSesion({
  variante = "claro",
  destino = RUTAS.inicio,
  soloEscritorio = false,
  compactoMovil = false,
  className,
}: BotonCerrarSesionProps) {
  const router = useRouter();
  const [cerrando, setCerrando] = useState(false);

  async function handleClick() {
    if (cerrando) return;
    setCerrando(true);
    try {
      await ejecutarCierreSesion();
      router.push(destino);
      router.refresh();
    } finally {
      setCerrando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={cerrando}
      aria-busy={cerrando}
      aria-label="Cerrar sesión"
      className={cn(
        soloEscritorio ? "hidden md:inline-flex" : "inline-flex",
        "shrink-0 items-center justify-center whitespace-nowrap font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        compactoMovil
          ? "min-h-9 gap-1.5 rounded-pill px-3 py-1.5 text-xs sm:min-h-11 sm:gap-2 sm:px-4 sm:text-sm"
          : "min-h-11 gap-2 rounded-pill px-4 text-sm",
        variante === "navy"
          ? "border border-primary/70 bg-primary text-white shadow-low hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          : "border border-error-text/30 bg-error-fill text-error-text hover:border-primary hover:bg-primary hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary",
        className,
      )}
    >
      <LogOutIcon className="shrink-0" />
      {cerrando ? (
        <span>Procesando...</span>
      ) : compactoMovil ? (
        <>
          <span className="sm:hidden">Salir</span>
          <span className="hidden sm:inline">Cerrar sesión</span>
        </>
      ) : (
        <span>Cerrar sesión</span>
      )}
    </button>
  );
}
