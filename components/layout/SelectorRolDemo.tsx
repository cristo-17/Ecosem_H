"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { entrarComoCuentaDePrueba } from "@/lib/auth/desarrollo";
import type { RolUsuario } from "@/lib/auth/roles";

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
 * Cambio de cuenta de prueba para desarrollo y QA. Ya no "da" un rol: cada
 * botón inicia sesión de verdad con una cuenta de prueba de ese rol
 * (lib/auth/desarrollo.ts), y lo que se ve es el rol que trae su token,
 * verificado en el servidor. Vive fuera de ShellPublico (que oculta el
 * TopBar en /embarque) a propósito: QA también cambia de cuenta dentro de
 * /embarque.
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
  const [error, setError] = useState<string | null>(null);
  const barraRef = useRef<HTMLDivElement>(null);

  // La barra reserva su propio alto en vez de taparle algo a la página: lo
  // publica en --alto-barra-dev, que usan el padding del <body> y las barras
  // fijas de abajo ("Continuar" de resultados y asientos) para apoyarse
  // encima. Se mide en vivo porque en móvil los botones pasan a dos líneas.
  // En producción esta barra no existe y la variable cae a 0px.
  useEffect(() => {
    const barra = barraRef.current;
    if (!barra) return;
    const raiz = document.documentElement;
    const publicar = () =>
      raiz.style.setProperty("--alto-barra-dev", `${barra.getBoundingClientRect().height}px`);
    publicar();
    const observador = new ResizeObserver(publicar);
    observador.observe(barra);
    return () => {
      observador.disconnect();
      raiz.style.removeProperty("--alto-barra-dev");
    };
  }, []);

  function elegir(opcion: EstadoDemo) {
    startTransition(async () => {
      const resultado = await entrarComoCuentaDePrueba(opcion);
      setError(resultado.error ?? null);
      router.refresh();
    });
  }

  return (
    <div
      ref={barraRef}
      id="selector-rol-demo"
      role="group"
      aria-label="Selector de rol (solo desarrollo)"
      className="fixed inset-x-0 bottom-0 z-30 flex flex-wrap items-center justify-center gap-2 border-t border-warning-text/30 bg-warning-fill px-3 py-2"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <span className="text-xs font-semibold text-warning-text">Cuenta de prueba (solo desarrollo):</span>
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
      {error && (
        <p role="alert" className="w-full text-center text-xs font-medium text-error-text">
          {error}
        </p>
      )}
    </div>
  );
}
