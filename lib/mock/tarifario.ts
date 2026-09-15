/**
 * Tarifario de encomiendas y exceso de equipaje (docs/prompts/13-tarifario-encomiendas.md).
 * A diferencia de otros mocks de este proyecto (p. ej. `lib/mock/precios.ts`,
 * que sí trae valores placeholder editables), acá el prompt es explícito:
 * "mientras comercial no defina los montos, los campos quedan vacíos... no
 * rellenar con cifras inventadas". Por eso `TARIFARIO_ENCOMIENDA_INICIAL`
 * arranca sin rangos y los recargos empiezan en `null` — el supervisor los
 * construye desde cero en /panel/tarifario, y hasta que eso pase, el
 * cotizador debe mostrar "consulta la tarifa en counter" en vez de un total.
 */
import type { Ciudad } from "@/lib/mock/viajes";

export interface RutaEncomienda {
  id: string;
  origen: Ciudad;
  destino: Ciudad;
}

// Mismos 3 pares que ya existen para pasajes (lib/mock/precios.ts): las
// únicas combinaciones posibles entre las 3 ciudades que cubre la empresa.
export const RUTAS_ENCOMIENDA: RutaEncomienda[] = [
  { id: "lima-huancayo", origen: "Lima", destino: "Huancayo" },
  { id: "lima-cerro-de-pasco", origen: "Lima", destino: "Cerro de Pasco" },
  { id: "huancayo-cerro-de-pasco", origen: "Huancayo", destino: "Cerro de Pasco" },
];

export function etiquetaRutaEncomienda(ruta: Pick<RutaEncomienda, "origen" | "destino">): string {
  return `${ruta.origen} ↔ ${ruta.destino}`;
}

export function buscarRutaEncomienda(origen: Ciudad, destino: Ciudad): RutaEncomienda | null {
  return (
    RUTAS_ENCOMIENDA.find(
      (ruta) => (ruta.origen === origen && ruta.destino === destino) || (ruta.origen === destino && ruta.destino === origen),
    ) ?? null
  );
}

/** Un rango de peso con su precio, siempre completo: no existe un rango "a medio definir". */
export interface RangoTarifaEncomienda {
  id: string;
  /** Límite superior del rango en kg (inclusive). */
  hastaKg: number;
  precio: number;
}

export interface TarifarioRuta {
  rutaId: string;
  rangos: RangoTarifaEncomienda[];
}

/** Vacío a propósito: comercial todavía no define ni los rangos ni los montos (docs/INFORME-AVANCE.md). */
export const TARIFARIO_ENCOMIENDA_INICIAL: TarifarioRuta[] = RUTAS_ENCOMIENDA.map((ruta) => ({
  rutaId: ruta.id,
  rangos: [],
}));

/** El rango con el `hastaKg` más chico que todavía cubre ese peso. `null` si ninguno lo cubre (sin definir para ese peso). */
export function buscarRangoTarifa(rangos: RangoTarifaEncomienda[], pesoKg: number): RangoTarifaEncomienda | null {
  const cubren = rangos.filter((rango) => pesoKg <= rango.hastaKg);
  if (cubren.length === 0) return null;
  return cubren.reduce((menor, actual) => (actual.hastaKg < menor.hastaKg ? actual : menor));
}

const DIVISOR_PESO_VOLUMETRICO = 5000;

/** (largo × ancho × alto en cm) ÷ 5000: fórmula estándar de peso volumétrico. */
export function calcularPesoVolumetrico(largoCm: number, anchoCm: number, altoCm: number): number {
  return (largoCm * anchoCm * altoCm) / DIVISOR_PESO_VOLUMETRICO;
}

export interface PesoFacturable {
  pesoFacturableKg: number;
  facturaPor: "real" | "volumetrico";
}

/** Se cobra el mayor entre peso real y peso volumétrico. */
export function calcularPesoFacturable(pesoRealKg: number, pesoVolumetricoKg: number): PesoFacturable {
  return pesoVolumetricoKg > pesoRealKg
    ? { pesoFacturableKg: pesoVolumetricoKg, facturaPor: "volumetrico" }
    : { pesoFacturableKg: pesoRealKg, facturaPor: "real" };
}

/** `null` = recargo no definido todavía (no aplica el % porque comercial no lo fijó, no porque el envío no declaró valor). */
export function calcularRecargoValorDeclarado(valorDeclaradoSoles: number, porcentajeRecargo: number | null): number | null {
  if (porcentajeRecargo === null) return null;
  return valorDeclaradoSoles * (porcentajeRecargo / 100);
}

export interface CotizacionEncomienda {
  pesoRealKg: number;
  pesoVolumetricoKg: number;
  pesoFacturableKg: number;
  facturaPor: "real" | "volumetrico";
  /** `null`: no hay rango de tarifario que cubra ese peso en esa ruta todavía. */
  rango: RangoTarifaEncomienda | null;
  /** Lo que se declaró en el formulario, para distinguir "no declaró valor" de "declaró pero el % no está definido". */
  valorDeclaradoSoles: number | null;
  porcentajeRecargo: number | null;
  /** `null`: no se declaró valor, o el % de recargo no está definido. */
  recargoValorDeclarado: number | null;
  /** `null` si `rango` es `null`: no se puede totalizar sin una tarifa definida. */
  total: number | null;
}

export function cotizarEncomienda(params: {
  pesoRealKg: number;
  largoCm: number;
  anchoCm: number;
  altoCm: number;
  rangos: RangoTarifaEncomienda[];
  valorDeclaradoSoles: number | null;
  porcentajeRecargo: number | null;
}): CotizacionEncomienda {
  const pesoVolumetricoKg = calcularPesoVolumetrico(params.largoCm, params.anchoCm, params.altoCm);
  const { pesoFacturableKg, facturaPor } = calcularPesoFacturable(params.pesoRealKg, pesoVolumetricoKg);
  const rango = buscarRangoTarifa(params.rangos, pesoFacturableKg);
  const recargoValorDeclarado =
    params.valorDeclaradoSoles !== null
      ? calcularRecargoValorDeclarado(params.valorDeclaradoSoles, params.porcentajeRecargo)
      : null;

  return {
    pesoRealKg: params.pesoRealKg,
    pesoVolumetricoKg,
    pesoFacturableKg,
    facturaPor,
    rango,
    valorDeclaradoSoles: params.valorDeclaradoSoles,
    porcentajeRecargo: params.porcentajeRecargo,
    recargoValorDeclarado,
    total: rango ? rango.precio + (recargoValorDeclarado ?? 0) : null,
  };
}

/**
 * Exceso de equipaje de pasajero (CLAUDE.md: franquicia de 20 kg, por rangos
 * no por kilo exacto). Los límites de kg (20/30/50) sí los da el prompt de
 * forma explícita — no son un rango inventado, a diferencia de los de
 * encomiendas — así que van fijos; solo el monto de recargo queda pendiente.
 */
export interface EscalonEquipaje {
  id: string;
  etiqueta: string;
  desdeKg: number;
  hastaKg: number;
  recargo: number | null;
}

export const ESCALONES_EQUIPAJE: EscalonEquipaje[] = [
  { id: "escalon-1", etiqueta: "21 – 30 kg", desdeKg: 21, hastaKg: 30, recargo: null },
  { id: "escalon-2", etiqueta: "31 – 50 kg", desdeKg: 31, hastaKg: 50, recargo: null },
];

export type ResultadoEquipaje =
  | { tipo: "incluido" }
  | { tipo: "escalon"; escalon: EscalonEquipaje }
  | { tipo: "encomienda" };

/** Más de 50 kg no es un escalón de equipaje: a partir de ahí se tarifica como encomienda (regla del prompt). */
export function calcularEscalonEquipaje(kilosDeclarados: number, escalones: EscalonEquipaje[] = ESCALONES_EQUIPAJE): ResultadoEquipaje {
  if (kilosDeclarados <= 20) return { tipo: "incluido" };
  if (kilosDeclarados <= 50) {
    const escalon = escalones.find((e) => kilosDeclarados >= e.desdeKg && kilosDeclarados <= e.hastaKg);
    return escalon ? { tipo: "escalon", escalon } : { tipo: "incluido" };
  }
  return { tipo: "encomienda" };
}
