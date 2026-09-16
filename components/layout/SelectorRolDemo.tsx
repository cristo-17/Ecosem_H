"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { cambiarRolDemo } from "@/lib/auth/acciones";
import type { RolUsuario } from "@/lib/mock/sesion";

export type EstadoDemo = "sin-sesion" | RolUsuario;

const OPCIONES: { valor: EstadoDemo; etiqueta: string }[] = [
  { valor: "sin-sesion", etiqueta: "Sin sesión" },
  { valor: "pasajero", etiqueta: "Pasajero" },
  { valor: "counter", etiqueta: "Counter" },
  { valor: "supervisor", etiqueta: "Supervisor" },
];

export interface SelectorRolDemoProps {
  estadoActual: EstadoDemo;
}

/**
 * Selector de rol para demo y QA (docs/prompts/16-navbar-por-rol.md): sin
 * Supabase Auth todavía, esta es la única forma de probar los 4 estados sin
 * editar código. Vive fuera de ShellPublico (que oculta el TopBar en
 * /embarque) a propósito — la tarea 17 de QA también necesita cambiar de
 * rol dentro de /embarque.
 *
 * SOLO development: el padre (app/layout.tsx) lo renderiza detrás de un
 * `process.env.NODE_ENV === "development"`, evaluado en un Server
 * Component — en producción ese `if` nunca es verdadero y Next lo elimina
 * del bundle (mismo mecanismo que usa React para su propio código de
 * desarrollo), no es solo un `hidden` de CSS. Verificado con
 * `npm run build` + grep sobre `.next/` buscando el id de este componente.
 */
export function SelectorRolDemo({ estadoActual }: SelectorRolDemoProps) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();

  function elegir(opcion: EstadoDemo) {
    startTransition(async () => {
      await cambiarRolDemo(opcion);
      router.refresh();
    });
  }

  return (
    <div
      id="selector-rol-demo"
      role="group"
      aria-label="Selector de rol (solo desarrollo)"
      className="fixed inset-x-0 bottom-0 z-30 flex flex-wrap items-center justify-center gap-2 border-t border-warning-text/30 bg-warning-fill px-3 py-2"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <span className="text-xs font-semibold text-warning-text">Rol (solo desarrollo):</span>
      {OPCIONES.map((opcion) => (
        <button
          key={opcion.valor}
          type="button"
          disabled={pendiente}
          aria-pressed={estadoActual === opcion.valor}
          onClick={() => elegir(opcion.valor)}
          className={cn(
            "flex min-h-11 min-w-11 items-center justify-center rounded-pill px-3 text-xs font-medium transition disabled:opacity-60",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary",
            estadoActual === opcion.valor
              ? "bg-warning-text text-white"
              : "bg-white text-warning-text hover:bg-white/70",
          )}
        >
          {opcion.etiqueta}
        </button>
      ))}
    </div>
  );
}
