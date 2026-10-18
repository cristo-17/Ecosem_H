"use client";

import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { LockIcon } from "@/components/ui/icons";
import { RUTAS } from "@/lib/routes";

export interface AccesoDenegadoProps {
  /** A dónde volver: el inicio para un pasajero, el panel para un counter. */
  volverA?: string;
  etiquetaVolver?: string;
}

/**
 * Lo que ve quien tiene sesión pero no el rol de la sección. El layout lo
 * renderiza EN LUGAR de la sección: nada de lo protegido llega al navegador.
 */
export function AccesoDenegado({
  volverA = RUTAS.inicio,
  etiquetaVolver = "Ir al inicio",
}: AccesoDenegadoProps) {
  const router = useRouter();
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <EmptyState
        icon={<LockIcon className="!size-12" />}
        title="No tienes acceso a esta sección"
        description="Tu cuenta no tiene permiso para ver esta página. Si crees que es un error, pide a un supervisor que revise tu rol."
        actionLabel={etiquetaVolver}
        onAction={() => router.push(volverA)}
      />
    </main>
  );
}
