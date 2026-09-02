"use client";

import { Button } from "@/components/ui/Button";
import { ToastProvider, useToast } from "@/components/ui/Toast";

function ToastButtons() {
  const { showToast } = useToast();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="secundario"
        onClick={() =>
          showToast({
            type: "success",
            title: "Reserva confirmada",
            description: "Tu asiento en el viaje de mañana quedó reservado.",
          })
        }
      >
        Éxito
      </Button>
      <Button
        variant="secundario"
        onClick={() =>
          showToast({
            type: "warning",
            title: "Pocos asientos",
            description: "Solo quedan 4 asientos en este horario.",
          })
        }
      >
        Advertencia
      </Button>
      <Button
        variant="secundario"
        onClick={() =>
          showToast({
            type: "error",
            title: "Pago rechazado",
            description: "Tu banco rechazó el cargo. Intenta con otro método.",
          })
        }
      >
        Error (no autocierra)
      </Button>
      <Button
        variant="secundario"
        onClick={() =>
          showToast({
            type: "info",
            title: "Nuevo horario",
            description: "Se agregó una salida a las 6:00 PM.",
          })
        }
      >
        Informativo
      </Button>
      <Button
        variant="terciario"
        onClick={() => {
          for (let i = 1; i <= 5; i++) {
            showToast({
              type: "success",
              title: `Notificación ${i}`,
              description: "Demuestra el límite visible + cola.",
            });
          }
        }}
      >
        Disparar 5 (límite visible = 3)
      </Button>
    </div>
  );
}

// Componente cliente separado porque Toast usa contexto (useToast) y
// app/styleguide/page.tsx es un Server Component. maxVisible=3 aquí para
// que el botón "Disparar 5" muestre la cola sin necesitar más ejemplos.
export function ToastShowcase() {
  return (
    <ToastProvider maxVisible={3}>
      <ToastButtons />
    </ToastProvider>
  );
}
