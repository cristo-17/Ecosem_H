import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { BoxIcon } from "@/components/ui/icons";
import { RUTAS } from "@/lib/routes";

export function EncomiendaPromo() {
  return (
    <Card className="flex flex-col items-start gap-3">
      <div className="flex w-full items-start justify-between">
        <span className="flex size-12 items-center justify-center rounded-full bg-secondary/10">
          <BoxIcon />
        </span>
        {/*
          "Nuevo" no es una placa de estado de Badge (esas son
          confirmado/pendiente/cancelado/en-ruta/completado): es una
          etiqueta promocional, así que reutiliza el rojo primario como
          acento sin forzarla dentro del vocabulario de Badge.
        */}
        <span className="rounded-field bg-primary px-2.5 py-1 text-xs font-semibold text-white">
          Nuevo
        </span>
      </div>
      <div>
        <h2 className="text-base font-semibold text-navy">Envía tu encomienda con nosotros</h2>
        <p className="mt-1 text-sm text-navy/70">
          20 kg de franquicia por envío. El exceso se cobra por rangos, y si el paquete es
          voluminoso, comparamos su peso real contra el volumétrico y cobramos el mayor.
        </p>
      </div>
      {/*
        Secundario, no principal: la acción principal de esta pantalla es
        "Buscar" pasajes (skill: una sola acción principal por pantalla).
      */}
      <Link
        href={RUTAS.enviarEncomienda}
        className="inline-flex h-12 items-center justify-center rounded-field bg-secondary px-6 text-base font-medium text-white transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
      >
        Enviar Encomienda
      </Link>
    </Card>
  );
}
