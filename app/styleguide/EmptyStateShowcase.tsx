"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchOffIcon } from "@/components/ui/icons";

// Componente cliente separado porque EmptyState necesita un onAction real
// (no un no-op) para poder probarlo en el navegador; app/styleguide/page.tsx
// es un Server Component y no puede pasar funciones a elementos interactivos.
export function EmptyStateShowcase() {
  const [wentBack, setWentBack] = useState(false);

  return (
    <div className="rounded-modal border border-navy/10">
      <EmptyState
        icon={<SearchOffIcon />}
        title="No encontramos viajes"
        description="Prueba con otra fecha o revisa que el destino esté bien escrito."
        actionLabel="Volver a la búsqueda"
        onAction={() => setWentBack(true)}
      />
      {wentBack && (
        <p className="pb-4 text-center text-sm text-success-text">
          onAction se disparó: volviste al paso anterior.
        </p>
      )}
    </div>
  );
}
