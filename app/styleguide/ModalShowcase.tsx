"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// Componente cliente separado porque Modal es controlado (open/onClose) y
// app/styleguide/page.tsx es un Server Component sin estado propio.
export function ModalShowcase() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="secundario" onClick={() => setConfirmOpen(true)}>
        Abrir confirmación
      </Button>
      <Button variant="secundario" onClick={() => setFormOpen(true)}>
        Abrir registro de pasajero
      </Button>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="¿Cancelar la reserva?"
        footer={
          <>
            <Button variant="destructivo" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button variant="principal" onClick={() => setConfirmOpen(false)}>
              Confirmar
            </Button>
          </>
        }
      >
        <p>
          Perderás el asiento reservado en el viaje Lima – Huancayo de mañana a las
          8:00 AM. Esta acción no se puede deshacer.
        </p>
      </Modal>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Registrar pasajero"
        footer={
          <>
            <Button variant="terciario" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button variant="principal" onClick={() => setFormOpen(false)}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input label="Nombre completo" placeholder="Nombres y apellidos" />
          <Input
            label="Documento de identidad"
            placeholder="DNI"
            helperText="Ingrese tal como figura en su DNI"
          />
          <Input
            label="Número celular"
            placeholder="987654321"
            inputMode="numeric"
            helperText="Debe contener exactamente 9 dígitos"
          />
        </div>
      </Modal>
    </div>
  );
}
