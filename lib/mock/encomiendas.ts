/**
 * Datos y reglas falsas del servicio de encomiendas. Los montos por rango
 * son un placeholder: comercial todavía no define la tarifa real, así que
 * quedan como constantes fáciles de editar acá cuando se definan.
 */
import type { BadgeStatus } from "@/components/ui/Badge";
import type { Ciudad } from "@/lib/mock/viajes";

export interface RangoTarifa {
  /** Límite superior del rango en kg (inclusive). */
  hastaKg: number;
  precio: number;
}

export const RANGOS_TARIFA_ENCOMIENDA: RangoTarifa[] = [
  { hastaKg: 5, precio: 15 },
  { hastaKg: 10, precio: 25 },
  { hastaKg: 20, precio: 40 },
  { hastaKg: 30, precio: 55 },
  { hastaKg: 50, precio: 80 },
  { hastaKg: Infinity, precio: 120 },
];

const DIVISOR_PESO_VOLUMETRICO = 5000;

/** (largo × ancho × alto en cm) ÷ 5000: fórmula estándar de peso volumétrico. */
export function calcularPesoVolumetrico(largoCm: number, anchoCm: number, altoCm: number): number {
  return (largoCm * anchoCm * altoCm) / DIVISOR_PESO_VOLUMETRICO;
}

/** Se cobra el mayor entre peso real y peso volumétrico. */
export function calcularPesoFacturable(pesoRealKg: number, pesoVolumetricoKg: number): number {
  return Math.max(pesoRealKg, pesoVolumetricoKg);
}

export function calcularTarifa(pesoFacturableKg: number): number {
  const rango = RANGOS_TARIFA_ENCOMIENDA.find((r) => pesoFacturableKg <= r.hastaKg);
  return (rango ?? RANGOS_TARIFA_ENCOMIENDA[RANGOS_TARIFA_ENCOMIENDA.length - 1]).precio;
}

// --- Rastreo ---
// Los mismos cinco estados de Badge (skill: "se usan tanto en pasajes como
// en encomiendas"), reutilizados también para cada evento de la línea de
// tiempo en vez de inventar un vocabulario de estados aparte.

export interface EventoRastreo {
  estado: BadgeStatus;
  fecha: Date;
  ubicacion: string;
  descripcion: string;
}

export interface Encomienda {
  guia: string;
  origen: Ciudad;
  destino: Ciudad;
  remitente: string;
  destinatario: string;
  pesoFacturableKg: number;
  estadoActual: BadgeStatus;
  /** De más antiguo a más reciente. */
  eventos: EventoRastreo[];
}

export const ENCOMIENDAS_MOCK: Encomienda[] = [
  {
    guia: "ECH-000123",
    origen: "Lima",
    destino: "Huancayo",
    remitente: "Comercial Andina SAC",
    destinatario: "Rosa Fernández",
    pesoFacturableKg: 8.5,
    estadoActual: "en-ruta",
    eventos: [
      {
        estado: "pendiente",
        fecha: new Date(2026, 7, 29, 9, 0),
        ubicacion: "Terminal Lima Norte",
        descripcion: "Encomienda registrada",
      },
      {
        estado: "en-ruta",
        fecha: new Date(2026, 7, 30, 6, 0),
        ubicacion: "Terminal Lima Norte",
        descripcion: "Despachada hacia Huancayo",
      },
    ],
  },
  {
    guia: "ECH-000456",
    origen: "Huancayo",
    destino: "Lima",
    remitente: "Panadería El Trigal",
    destinatario: "Jorge Salazar",
    pesoFacturableKg: 3,
    estadoActual: "completado",
    eventos: [
      {
        estado: "pendiente",
        fecha: new Date(2026, 7, 25, 8, 30),
        ubicacion: "Terminal Huancayo Centro",
        descripcion: "Encomienda registrada",
      },
      {
        estado: "en-ruta",
        fecha: new Date(2026, 7, 25, 16, 0),
        ubicacion: "Terminal Huancayo Centro",
        descripcion: "Despachada hacia Lima",
      },
      {
        estado: "completado",
        fecha: new Date(2026, 7, 25, 22, 45),
        ubicacion: "Terminal Lima Norte",
        descripcion: "Entregada al destinatario",
      },
    ],
  },
  {
    guia: "ECH-000789",
    origen: "Lima",
    destino: "Cerro de Pasco",
    remitente: "Botica San Rafael",
    destinatario: "Municipalidad de Cerro de Pasco",
    pesoFacturableKg: 15,
    estadoActual: "cancelado",
    eventos: [
      {
        estado: "pendiente",
        fecha: new Date(2026, 7, 27, 11, 0),
        ubicacion: "Terminal Lima Norte",
        descripcion: "Encomienda registrada",
      },
      {
        estado: "cancelado",
        fecha: new Date(2026, 7, 27, 15, 20),
        ubicacion: "Terminal Lima Norte",
        descripcion: "Envío cancelado a pedido del remitente",
      },
    ],
  },
];

export function buscarEncomiendaPorGuia(guia: string): Encomienda | null {
  const normalizada = guia.trim().toUpperCase();
  return ENCOMIENDAS_MOCK.find((encomienda) => encomienda.guia === normalizada) ?? null;
}
