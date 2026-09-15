"use client";

import { RUTAS_ENCOMIENDA, etiquetaRutaEncomienda } from "@/lib/mock/tarifario";
import { useTarifarioStore, actualizarRangosRuta, actualizarEscalonesEquipaje, actualizarPorcentajeRecargo } from "@/lib/mock/tarifarioStore";
import { RangosEncomiendaCard } from "./RangosEncomiendaCard";
import { EquipajeCard } from "./EquipajeCard";
import { RecargoValorDeclaradoCard } from "./RecargoValorDeclaradoCard";

export function TarifarioView() {
  const { tarifario, escalonesEquipaje, porcentajeRecargoValorDeclarado } = useTarifarioStore();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-navy sm:text-2xl">Tarifario</h1>
        <p className="mt-1 text-sm text-navy/70">
          Rangos de peso por ruta, exceso de equipaje y recargo por valor declarado. El cotizador de
          encomiendas lee esta misma configuración.
        </p>
      </div>

      <div>
        <h2 className="text-base font-semibold text-navy">Encomiendas por ruta</h2>
        <p className="mt-1 text-sm text-navy/70">
          Se cobra por rango de peso, no por kilo exacto — el mayor entre peso real y volumétrico.
        </p>
        <div className="mt-3 flex flex-col gap-3">
          {RUTAS_ENCOMIENDA.map((ruta) => {
            const tarifarioRuta = tarifario.find((t) => t.rutaId === ruta.id);
            return (
              <RangosEncomiendaCard
                key={ruta.id}
                titulo={etiquetaRutaEncomienda(ruta)}
                rangos={tarifarioRuta?.rangos ?? []}
                onCambiar={(rangos) => actualizarRangosRuta(ruta.id, rangos)}
              />
            );
          })}
        </div>
      </div>

      <EquipajeCard escalones={escalonesEquipaje} onCambiar={actualizarEscalonesEquipaje} />

      <RecargoValorDeclaradoCard
        porcentaje={porcentajeRecargoValorDeclarado}
        onCambiar={actualizarPorcentajeRecargo}
      />
    </div>
  );
}
