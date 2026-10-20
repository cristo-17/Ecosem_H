"use client";

import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrackIcon } from "@/components/ui/icons";
import { RUTAS } from "@/lib/routes";

/**
 * Hoy ninguna encomienda queda asociada a una cuenta: las registra el counter
 * y svc-encomiendas no tiene una consulta de "mis encomiendas" (D-050). Antes
 * esta pestaña mostraba guías inventadas de un mock a cualquier
 * cuenta real. No se buscan por documento ni por correo, por la misma razón
 * que las compras (D-048): el seguimiento es con el número de guía.
 */
export function MisEncomiendasTab() {
  const router = useRouter();
  return (
    <EmptyState
      icon={<TrackIcon className="!size-12 !text-secondary" />}
      title="Sigue tus encomiendas con su número de guía"
      description="Por ahora las encomiendas que envías en counter no quedan guardadas en tu cuenta. Con el número de guía de tu comprobante puedes ver en qué estado está."
      actionLabel="Rastrear encomienda"
      onAction={() => router.push(RUTAS.rastrearEncomienda)}
    />
  );
}
