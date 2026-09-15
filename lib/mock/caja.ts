/**
 * Datos falsos del arqueo de caja (docs/prompts/08-panel-counter.md). Sin
 * backend todavía: las transacciones de cada turno son fijas por
 * combinación agencia+turno+usuario, mismo criterio que lib/mock/asientos.ts
 * (misma búsqueda, mismo resultado siempre). Independiente de
 * lib/mock/compras.ts: ese historial es lo que ve un pasajero en "Mis
 * viajes", esto es el resumen de caja de un turno de counter — no tienen
 * por qué coincidir mientras ninguno de los dos tenga un backend real
 * detrás.
 */
import type { Ciudad } from "@/lib/mock/viajes";

export type MedioPago = "efectivo" | "yape" | "plin" | "tarjeta";

export const OPCIONES_MEDIO_PAGO: { value: MedioPago; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "yape", label: "Yape" },
  { value: "plin", label: "Plin" },
  { value: "tarjeta", label: "Tarjeta" },
];

export function labelMedioPago(medio: MedioPago): string {
  return OPCIONES_MEDIO_PAGO.find((m) => m.value === medio)?.label ?? medio;
}

export interface OpcionCaja {
  value: string;
  label: string;
}

export const TURNOS: OpcionCaja[] = [
  { value: "manana", label: "Turno mañana (06:00 – 14:00)" },
  { value: "tarde", label: "Turno tarde (14:00 – 22:00)" },
];

export const USUARIOS_COUNTER: OpcionCaja[] = [
  { value: "rfernandez", label: "Rosa Fernández" },
  { value: "jsalazar", label: "Jorge Salazar" },
];

export type TipoTransaccion = "pasaje" | "encomienda";

export interface Transaccion {
  id: string;
  hora: Date;
  tipo: TipoTransaccion;
  /** Código de boleto o número de guía, según `tipo`. */
  referencia: string;
  medioPago: MedioPago;
  monto: number;
}

interface ArqueoTurno {
  agencia: Ciudad;
  turno: string;
  usuario: string;
  transacciones: Transaccion[];
}

const ARQUEOS: ArqueoTurno[] = [
  {
    agencia: "Lima",
    turno: "manana",
    usuario: "rfernandez",
    transacciones: [
      { id: "t1", hora: new Date(2026, 8, 15, 6, 20), tipo: "pasaje", referencia: "ECH-9F21A0", medioPago: "efectivo", monto: 35 },
      { id: "t2", hora: new Date(2026, 8, 15, 7, 5), tipo: "pasaje", referencia: "ECH-4B7C12", medioPago: "yape", monto: 84 },
      { id: "t3", hora: new Date(2026, 8, 15, 8, 40), tipo: "encomienda", referencia: "ECH-000123", medioPago: "efectivo", monto: 25 },
      { id: "t4", hora: new Date(2026, 8, 15, 10, 15), tipo: "pasaje", referencia: "ECH-11A0F3", medioPago: "tarjeta", monto: 75 },
      { id: "t5", hora: new Date(2026, 8, 15, 12, 30), tipo: "encomienda", referencia: "ECH-000321", medioPago: "plin", monto: 40 },
    ],
  },
  {
    agencia: "Lima",
    turno: "tarde",
    usuario: "jsalazar",
    transacciones: [
      { id: "t6", hora: new Date(2026, 8, 15, 14, 10), tipo: "pasaje", referencia: "ECH-77D2E9", medioPago: "yape", monto: 55 },
      { id: "t7", hora: new Date(2026, 8, 15, 16, 50), tipo: "pasaje", referencia: "ECH-2C90B4", medioPago: "efectivo", monto: 42 },
      { id: "t8", hora: new Date(2026, 8, 15, 19, 5), tipo: "encomienda", referencia: "ECH-000456", medioPago: "tarjeta", monto: 15 },
    ],
  },
  {
    agencia: "Huancayo",
    turno: "manana",
    usuario: "jsalazar",
    transacciones: [
      { id: "t9", hora: new Date(2026, 8, 15, 6, 45), tipo: "pasaje", referencia: "ECH-6A19D4", medioPago: "efectivo", monto: 35 },
      { id: "t10", hora: new Date(2026, 8, 15, 9, 30), tipo: "pasaje", referencia: "ECH-3E8801", medioPago: "plin", monto: 35 },
    ],
  },
];

export function buscarArqueo(agencia: Ciudad, turno: string, usuario: string): Transaccion[] {
  return (
    ARQUEOS.find((a) => a.agencia === agencia && a.turno === turno && a.usuario === usuario)
      ?.transacciones ?? []
  );
}

export interface ResumenArqueo {
  total: number;
  cantidadBoletos: number;
  cantidadEncomiendas: number;
  porMedioPago: { medio: MedioPago; total: number }[];
}

export function resumirArqueo(transacciones: Transaccion[]): ResumenArqueo {
  const total = transacciones.reduce((suma, t) => suma + t.monto, 0);
  const cantidadBoletos = transacciones.filter((t) => t.tipo === "pasaje").length;
  const cantidadEncomiendas = transacciones.filter((t) => t.tipo === "encomienda").length;
  const porMedioPago = OPCIONES_MEDIO_PAGO.map(({ value }) => ({
    medio: value,
    total: transacciones.filter((t) => t.medioPago === value).reduce((suma, t) => suma + t.monto, 0),
  })).filter((item) => item.total > 0);

  return { total, cantidadBoletos, cantidadEncomiendas, porMedioPago };
}
