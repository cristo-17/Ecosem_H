"use client";

/**
 * Único puesto en memoria compartido entre /panel/tarifario (quien lo
 * configura) y /encomiendas/enviar (quien lo lee) — a diferencia de
 * /panel/precios, que el prompt de esa tarea explícitamente deja
 * desconectado del checkout (docs/ESTADO.md), este prompt sí pide que el
 * cotizador "lea el tarifario configurado". Sin backend, un módulo
 * singleton con `useSyncExternalStore` es lo mínimo que permite eso: vive
 * mientras dure la pestaña (sobrevive a la navegación entre rutas de
 * Next.js), y se reinicia a los valores vacíos de `lib/mock/tarifario.ts`
 * si se recarga la página — igual que cualquier otro estado en memoria de
 * este proyecto (ver D-030 y notas de "Abierto" en docs/ESTADO.md).
 */
import { useSyncExternalStore } from "react";
import {
  TARIFARIO_ENCOMIENDA_INICIAL,
  ESCALONES_EQUIPAJE,
  type TarifarioRuta,
  type RangoTarifaEncomienda,
  type EscalonEquipaje,
} from "@/lib/mock/tarifario";

interface EstadoTarifario {
  tarifario: TarifarioRuta[];
  escalonesEquipaje: EscalonEquipaje[];
  porcentajeRecargoValorDeclarado: number | null;
}

let estado: EstadoTarifario = {
  tarifario: TARIFARIO_ENCOMIENDA_INICIAL,
  escalonesEquipaje: ESCALONES_EQUIPAJE,
  porcentajeRecargoValorDeclarado: null,
};

const listeners = new Set<() => void>();

function emitir() {
  listeners.forEach((listener) => listener());
}

function suscribirse(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function obtenerEstado(): EstadoTarifario {
  return estado;
}

export function useTarifarioStore(): EstadoTarifario {
  return useSyncExternalStore(suscribirse, obtenerEstado, obtenerEstado);
}

export function actualizarRangosRuta(rutaId: string, rangos: RangoTarifaEncomienda[]): void {
  estado = { ...estado, tarifario: estado.tarifario.map((t) => (t.rutaId === rutaId ? { ...t, rangos } : t)) };
  emitir();
}

export function actualizarEscalonesEquipaje(escalones: EscalonEquipaje[]): void {
  estado = { ...estado, escalonesEquipaje: escalones };
  emitir();
}

export function actualizarPorcentajeRecargo(porcentaje: number): void {
  estado = { ...estado, porcentajeRecargoValorDeclarado: porcentaje };
  emitir();
}
