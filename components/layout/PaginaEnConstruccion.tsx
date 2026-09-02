"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { RUTAS } from "@/lib/routes";

export interface PaginaEnConstruccionProps {
  titulo: string;
  icon: ReactNode;
  descripcion: string;
}

/**
 * Pantalla compartida por las secciones que todavía no tienen su propia
 * implementación (Mis Viajes, Ayuda, Enviar/Rastrear Encomienda). Evita que
 * esos enlaces del menú caigan en la página negra 404 por defecto de
 * Next.js mientras se construyen.
 */
export function PaginaEnConstruccion({ titulo, icon, descripcion }: PaginaEnConstruccionProps) {
  const router = useRouter();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="text-xl font-semibold text-navy sm:text-2xl">{titulo}</h1>
      <EmptyState
        icon={icon}
        title="Todavía estamos construyendo esta sección"
        description={descripcion}
        actionLabel="Volver al inicio"
        onAction={() => router.push(RUTAS.inicio)}
        className="mt-6"
      />
    </main>
  );
}
