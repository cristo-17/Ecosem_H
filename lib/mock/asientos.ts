/**
 * Plano de asientos falso. Sin backend todavía: la distribución del bus y
 * qué asientos están ocupados/reservados se derivan de forma determinística
 * del id del viaje, para que la misma búsqueda muestre siempre el mismo
 * plano (útil para probar la pantalla sin que cambie en cada render).
 */
import type { TipoAsiento, Viaje } from "@/lib/mock/viajes";
import { hashSemilla, mulberry32 } from "@/lib/random";

export type EstadoAsiento = "libre" | "ocupado" | "reservado";

export interface Asiento {
  id: string;
  piso: 1 | 2;
  fila: number;
  columna: string;
  estado: EstadoAsiento;
}

export interface DistribucionPiso {
  piso: 1 | 2;
  nombre: string;
  filas: number;
  /** Letras de izquierda a derecha; el pasillo va después del índice indicado. */
  columnas: string[];
  pasilloTrasIndice: number;
}

// Buses de dos pisos con distribución distinta según la clase: económico
// (2+2 ambos pisos, más asientos), ejecutivo (2+1 en el segundo piso, más
// espacio para las piernas) y vip (2+1 ambos pisos, tipo cama, el bus
// completo tiene menos butacas).
const DISTRIBUCION_POR_TIPO: Record<TipoAsiento, DistribucionPiso[]> = {
  economico: [
    { piso: 1, nombre: "Primer piso", filas: 8, columnas: ["A", "B", "C", "D"], pasilloTrasIndice: 1 },
    { piso: 2, nombre: "Segundo piso", filas: 6, columnas: ["A", "B", "C", "D"], pasilloTrasIndice: 1 },
  ],
  ejecutivo: [
    { piso: 1, nombre: "Primer piso", filas: 6, columnas: ["A", "B", "C", "D"], pasilloTrasIndice: 1 },
    { piso: 2, nombre: "Segundo piso", filas: 6, columnas: ["A", "B", "C"], pasilloTrasIndice: 1 },
  ],
  vip: [
    { piso: 1, nombre: "Primer piso", filas: 5, columnas: ["A", "B", "C"], pasilloTrasIndice: 1 },
    { piso: 2, nombre: "Segundo piso", filas: 5, columnas: ["A", "B", "C"], pasilloTrasIndice: 1 },
  ],
};

export function distribucionBus(tipo: TipoAsiento): DistribucionPiso[] {
  return DISTRIBUCION_POR_TIPO[tipo];
}

function capacidadTotal(distribucion: DistribucionPiso[]): number {
  return distribucion.reduce((total, piso) => total + piso.filas * piso.columnas.length, 0);
}

/** Genera el plano completo del viaje: todos los asientos con su estado. */
export function generarAsientos(viaje: Viaje): Asiento[] {
  const distribucion = distribucionBus(viaje.tipoAsiento);
  const total = capacidadTotal(distribucion);

  const asientos: Asiento[] = [];
  for (const piso of distribucion) {
    for (let fila = 1; fila <= piso.filas; fila++) {
      for (const columna of piso.columnas) {
        asientos.push({ id: `P${piso.piso}-${fila}${columna}`, piso: piso.piso, fila, columna, estado: "libre" });
      }
    }
  }

  const noDisponibles = Math.max(0, Math.min(total, total - viaje.asientosDisponibles));
  // Una porción de los no disponibles queda "reservado" (apartado temporal
  // de otro comprador, aún sin pagar) en vez de "ocupado" (venta
  // confirmada), para que la leyenda completa se vea en pantalla.
  const reservados = noDisponibles > 0 ? Math.max(1, Math.round(noDisponibles * 0.2)) : 0;
  const ocupados = noDisponibles - reservados;

  const random = mulberry32(hashSemilla(viaje.id));
  const indices = asientos.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  indices.slice(0, ocupados).forEach((i) => {
    asientos[i].estado = "ocupado";
  });
  indices.slice(ocupados, ocupados + reservados).forEach((i) => {
    asientos[i].estado = "reservado";
  });

  return asientos;
}
