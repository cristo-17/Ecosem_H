/**
 * Motor de precios (docs/prompts/11-motor-precios.md, D-003 en
 * docs/DECISIONES.md): reglas explícitas, no un algoritmo de optimización.
 *
 * Precio final = tarifa base de la ruta × factor de ocupación
 *              × factor de anticipación × factor de temporada,
 * acotado por el tope mínimo y máximo de la ruta.
 *
 * Los valores semilla (tarifa base, topes, factores) son placeholder: según
 * `docs/INFORME-AVANCE.md`, "factores del motor de precios" está listado
 * explícitamente como una definición pendiente del cliente — mismo
 * hallazgo que "tarifario de equipaje y encomiendas". Ese otro módulo
 * (`lib/mock/tarifario.ts`, docs/prompts/13-tarifario-encomiendas.md) deja
 * los montos vacíos en vez de un número placeholder como el de acá: ese
 * prompt fue explícito en "no rellenar con cifras inventadas", una
 * restricción más estricta que la de este. Todo lo de acá es editable
 * desde /panel/precios; nada queda hardcodeado en un componente
 * (restricción explícita del prompt).
 */
import type { Ciudad } from "@/lib/mock/viajes";

export interface TarifaRuta {
  id: string;
  origen: Ciudad;
  destino: Ciudad;
  tarifaBase: number;
  topeMinimo: number;
  topeMaximo: number;
}

export function etiquetaRuta(ruta: Pick<TarifaRuta, "origen" | "destino">): string {
  return `${ruta.origen} ↔ ${ruta.destino}`;
}

/**
 * Semilla de tarifa base: el precio económico más bajo que ya existe para
 * cada ruta en lib/mock/viajes.ts (VIAJES), no un número nuevo inventado.
 * Tope mínimo = la misma tarifa base (el motor no descuenta por debajo del
 * pasaje más económico publicado); tope máximo = +40% como margen de
 * ejemplo — ambos, placeholder editable, igual que la tarifa base.
 */
export const TARIFAS_RUTA: TarifaRuta[] = [
  { id: "lima-huancayo", origen: "Lima", destino: "Huancayo", tarifaBase: 35, topeMinimo: 35, topeMaximo: 49 },
  {
    id: "lima-cerro-de-pasco",
    origen: "Lima",
    destino: "Cerro de Pasco",
    tarifaBase: 28,
    topeMinimo: 28,
    topeMaximo: 39,
  },
  {
    id: "huancayo-cerro-de-pasco",
    origen: "Huancayo",
    destino: "Cerro de Pasco",
    tarifaBase: 15,
    topeMinimo: 15,
    topeMaximo: 21,
  },
];

/** Rango numérico con un factor asociado — mismo patrón para ocupación y anticipación. */
export interface RangoFactor {
  id: string;
  etiqueta: string;
  minimo: number;
  /** `Infinity` para el último rango, abierto hacia arriba. */
  maximo: number;
  factor: number;
}

export const FACTORES_OCUPACION: RangoFactor[] = [
  { id: "ocup-baja", etiqueta: "0% – 50%", minimo: 0, maximo: 50, factor: 1.0 },
  { id: "ocup-media", etiqueta: "51% – 80%", minimo: 51, maximo: 80, factor: 1.1 },
  { id: "ocup-alta", etiqueta: "81% – 100%", minimo: 81, maximo: 100, factor: 1.2 },
];

// Placeholder: a más anticipación, más barato (incentiva compra temprana);
// de último minuto, más caro. Rangos y factores, editables desde el panel.
export const FACTORES_ANTICIPACION: RangoFactor[] = [
  { id: "antic-ultimo-minuto", etiqueta: "0 – 2 días", minimo: 0, maximo: 2, factor: 1.15 },
  { id: "antic-corta", etiqueta: "3 – 7 días", minimo: 3, maximo: 7, factor: 1.05 },
  { id: "antic-media", etiqueta: "8 – 14 días", minimo: 8, maximo: 14, factor: 1.0 },
  { id: "antic-larga", etiqueta: "15+ días", minimo: 15, maximo: Infinity, factor: 0.95 },
];

/** Temporada: categorías con nombre, no un rango numérico — se elige, no se calcula. */
export interface FactorTemporada {
  id: string;
  etiqueta: string;
  factor: number;
}

export const FACTORES_TEMPORADA: FactorTemporada[] = [
  { id: "temporada-baja", etiqueta: "Temporada baja", factor: 1.0 },
  { id: "feriados-largos", etiqueta: "Feriados largos", factor: 1.1 },
  { id: "fiestas-patrias", etiqueta: "Fiestas Patrias", factor: 1.25 },
  { id: "fin-de-anio", etiqueta: "Navidad y Año Nuevo", factor: 1.25 },
  { id: "eventos-locales", etiqueta: "Eventos locales (Pasco / Junín)", factor: 1.15 },
];

export function buscarRango(rangos: RangoFactor[], valor: number): RangoFactor | undefined {
  return rangos.find((rango) => valor >= rango.minimo && valor <= rango.maximo);
}

export interface DesglosePrecio {
  tarifaBase: number;
  factorOcupacion: number;
  factorAnticipacion: number;
  factorTemporada: number;
  subtotal: number;
  precioFinal: number;
  /** Si el subtotal quedó fuera del rango [topeMinimo, topeMaximo] de la ruta. */
  ajustadoPor: "ninguno" | "minimo" | "maximo";
}

export function calcularPrecio(
  ruta: TarifaRuta,
  factorOcupacion: number,
  factorAnticipacion: number,
  factorTemporada: number,
): DesglosePrecio {
  const subtotal = ruta.tarifaBase * factorOcupacion * factorAnticipacion * factorTemporada;

  let precioFinal = subtotal;
  let ajustadoPor: DesglosePrecio["ajustadoPor"] = "ninguno";
  if (subtotal < ruta.topeMinimo) {
    precioFinal = ruta.topeMinimo;
    ajustadoPor = "minimo";
  } else if (subtotal > ruta.topeMaximo) {
    precioFinal = ruta.topeMaximo;
    ajustadoPor = "maximo";
  }

  return { tarifaBase: ruta.tarifaBase, factorOcupacion, factorAnticipacion, factorTemporada, subtotal, precioFinal, ajustadoPor };
}

/** Un cambio de tarifa o factor, para el historial de auditoría (pedido explícito del prompt). */
export interface CambioTarifa {
  id: string;
  fecha: Date;
  usuario: string;
  campo: string;
  valorAnterior: string;
  valorNuevo: string;
}
