"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { useEstadoSincronizacion } from "@/lib/embarque/useEstadoSincronizacion";
import { WifiIcon, WifiOffIcon } from "@/components/ui/icons";
import { RUTAS } from "@/lib/routes";

export function EmbarqueHeader() {
  const { enLinea, pendientes, sincronizando, sincronizarAhora } = useEstadoSincronizacion();

  return (
    <header className="flex items-center justify-between gap-3 bg-navy px-4 py-3 sm:px-6">
      <Link href={RUTAS.embarque} className="text-sm font-semibold text-white">
        Ecosem H · Embarque
      </Link>

      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-medium",
            enLinea ? "bg-success-fill text-success-text" : "bg-warning-fill text-warning-text",
          )}
        >
          {enLinea ? <WifiIcon className="!size-4" /> : <WifiOffIcon className="!size-4" />}
          {enLinea ? "En línea" : "Sin conexión"}
        </span>

        {pendientes > 0 && (
          <button
            type="button"
            onClick={sincronizarAhora}
            disabled={!enLinea || sincronizando}
            className="flex min-h-9 items-center gap-1.5 rounded-pill bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {sincronizando
              ? "Sincronizando..."
              : `${pendientes} ${pendientes === 1 ? "pendiente" : "pendientes"}`}
          </button>
        )}
      </div>
    </header>
  );
}
