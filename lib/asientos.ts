/**
 * Forma del plano de asientos que dibuja `SeatMap`. La usan el flujo web (con
 * datos del backend, `planoDesdeApi`) y el panel de venta (todavía con
 * `lib/mock/asientos`).
 */
import type { Seat, SeatStatus } from "@/lib/types/contratos-frontend";

export type EstadoAsiento = "libre" | "ocupado" | "reservado";

export interface Asiento {
  /** Código del backend, p. ej. `P1-3A`. */
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

const ESTADO_DESDE_API: Record<SeatStatus, EstadoAsiento> = {
  libre: "libre",
  reservado: "reservado",
  vendido: "ocupado",
};

/**
 * El plano tal como lo devuelve el backend, que es la única fuente de verdad
 * de la disponibilidad. La API no dice dónde está el pasillo: se dibuja en la
 * mitad (2+2, 2+1), igual que los buses que conocemos.
 */
export function planoDesdeApi(seats: Seat[]): {
  distribucion: DistribucionPiso[];
  asientos: Asiento[];
} {
  const asientos: Asiento[] = seats
    .filter((seat) => seat.deck === 1 || seat.deck === 2)
    .map((seat) => ({
      id: seat.code,
      piso: seat.deck as 1 | 2,
      fila: seat.row,
      columna: seat.column,
      estado: ESTADO_DESDE_API[seat.status],
    }));

  const pisos = [...new Set(asientos.map((a) => a.piso))].sort();
  const distribucion = pisos.map((piso): DistribucionPiso => {
    const delPiso = asientos.filter((a) => a.piso === piso);
    const columnas = [...new Set(delPiso.map((a) => a.columna))].sort();
    return {
      piso,
      nombre: piso === 1 ? "Primer piso" : "Segundo piso",
      filas: Math.max(...delPiso.map((a) => a.fila)),
      columnas,
      pasilloTrasIndice: Math.ceil(columnas.length / 2) - 1,
    };
  });

  return { distribucion, asientos };
}

/** `P1-3A` → `3A`, para mostrar. */
export function etiquetaAsiento(codigo: string): string {
  return codigo.replace(/^P\d-/, "");
}
