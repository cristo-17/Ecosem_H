"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { BotonCerrarSesion } from "@/components/layout/BotonCerrarSesion";
import { useEstadoSincronizacion } from "@/lib/embarque/useEstadoSincronizacion";
import { WifiIcon, WifiOffIcon } from "@/components/ui/icons";
import { RUTAS } from "@/lib/routes";

export function EmbarqueHeader() {
  const { enLinea, pendientes, sincronizando, sesionVencida, sincronizarAhora } =
    useEstadoSincronizacion();

  return (
    <header className="flex items-center justify-between gap-2 bg-navy px-3 py-3 sm:gap-3 sm:px-6">
      <Link href={RUTAS.embarque} className="shrink-0 whitespace-nowrap text-sm font-semibold text-white">
        <span className="hidden sm:inline">Ecosem H · </span>Embarque
      </Link>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <span
          className={cn(
            "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 py-1.5 text-xs font-medium sm:px-3",
            enLinea ? "bg-success-fill text-success-text" : "bg-warning-fill text-warning-text",
          )}
        >
          {enLinea ? <WifiIcon className="!size-4 shrink-0" /> : <WifiOffIcon className="!size-4 shrink-0" />}
          {enLinea ? "En línea" : "Sin conexión"}
        </span>

        {sesionVencida && pendientes > 0 && (
          <Link
            href={`${RUTAS.ingresar}?${new URLSearchParams({ siguiente: RUTAS.embarque, motivo: "sesion-vencida" })}`}
            className="flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-pill bg-warning-fill px-3 py-1.5 text-xs font-medium text-warning-text"
          >
            Ingresa para subir
          </Link>
        )}

        {pendientes > 0 && (
          <button
            type="button"
            onClick={sincronizarAhora}
            disabled={!enLinea || sincronizando}
            className="flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {sincronizando
              ? "Sincronizando..."
              : `${pendientes} ${pendientes === 1 ? "pendiente" : "pendientes"}`}
          </button>
        )}

        <BotonCerrarSesion variante="navy" destino={RUTAS.ingresar} compactoMovil />
      </div>
    </header>
  );
}
