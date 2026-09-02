"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Viaje } from "@/lib/mock/viajes";

export type MetodoPago = "yape" | "plin" | "tarjeta";
export type TipoDocumento = "dni" | "ce" | "pasaporte";
export type TipoComprobante = "boleta" | "factura";

export interface DatosPasajero {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombres: string;
  correo: string;
  celular: string;
}

export interface DatosComprobante {
  tipo: TipoComprobante;
  ruc: string;
  razonSocial: string;
}

export interface Boleto {
  codigo: string;
  emitidoEn: Date;
  viaje: Viaje;
  asientos: string[];
  pasajeros: DatosPasajero[];
  comprobante: DatosComprobante;
  metodoPago: MetodoPago;
  total: number;
}

interface PurchaseState {
  viaje: Viaje | null;
  pasajerosCount: number;
  asientos: string[];
  datosPasajeros: DatosPasajero[];
  boleto: Boleto | null;
  /** Epoch ms en que expira el apartado temporal de asientos. */
  reservaExpiraEn: number | null;
}

interface PurchaseContextValue extends PurchaseState {
  iniciar: (viaje: Viaje, pasajerosCount: number) => void;
  setAsientos: (ids: string[]) => void;
  setDatosPasajeros: (datos: DatosPasajero[]) => void;
  confirmarCompra: (comprobante: DatosComprobante, metodoPago: MetodoPago) => void;
  reiniciar: () => void;
}

const ESTADO_INICIAL: PurchaseState = {
  viaje: null,
  pasajerosCount: 1,
  asientos: [],
  datosPasajeros: [],
  boleto: null,
  reservaExpiraEn: null,
};

// Regla de negocio real (CLAUDE.md): la reserva temporal de un asiento
// expira a los 10 minutos. Aquí solo se simula la cuenta regresiva en el
// cliente — sin backend no hay un SELECT ... FOR UPDATE que liberar.
const DURACION_RESERVA_MS = 10 * 60 * 1000;

const PurchaseContext = createContext<PurchaseContextValue | null>(null);

/**
 * Estado del flujo de compra en memoria (React state), nunca en
 * localStorage: CLAUDE.md prohíbe persistir el estado de la reserva en el
 * navegador, y los datos de los pasajeros son datos personales que tampoco
 * pueden viajar por la URL (Ley 29733). Vive en un Provider montado en
 * app/pasajes/comprar/layout.tsx, así que sobrevive a la navegación entre
 * pasos (misma instancia de layout) pero se pierde si se recarga la
 * página — cada pantalla del flujo debe poder manejar ese caso.
 */
export function usePurchase() {
  const ctx = useContext(PurchaseContext);
  if (!ctx) throw new Error("usePurchase debe usarse dentro de <PurchaseProvider>");
  return ctx;
}

export function PurchaseProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<PurchaseState>(ESTADO_INICIAL);

  const iniciar = useCallback((viaje: Viaje, pasajerosCount: number) => {
    setEstado((prev) => {
      if (prev.viaje?.id === viaje.id && prev.pasajerosCount === pasajerosCount) return prev;
      return {
        ...ESTADO_INICIAL,
        viaje,
        pasajerosCount,
        reservaExpiraEn: Date.now() + DURACION_RESERVA_MS,
      };
    });
  }, []);

  const setAsientos = useCallback((ids: string[]) => {
    setEstado((prev) => ({ ...prev, asientos: ids }));
  }, []);

  const setDatosPasajeros = useCallback((datos: DatosPasajero[]) => {
    setEstado((prev) => ({ ...prev, datosPasajeros: datos }));
  }, []);

  const confirmarCompra = useCallback((comprobante: DatosComprobante, metodoPago: MetodoPago) => {
    setEstado((prev) => {
      if (!prev.viaje) return prev;
      const boleto: Boleto = {
        codigo: `ECH-${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
        emitidoEn: new Date(),
        viaje: prev.viaje,
        asientos: prev.asientos,
        pasajeros: prev.datosPasajeros,
        comprobante,
        metodoPago,
        total: prev.viaje.precio * prev.pasajerosCount,
      };
      // La reserva ya se resolvió (compra confirmada): se apaga el
      // temporizador para que no siga corriendo en la pantalla de confirmación.
      return { ...prev, boleto, reservaExpiraEn: null };
    });
  }, []);

  const reiniciar = useCallback(() => setEstado(ESTADO_INICIAL), []);

  const value = useMemo<PurchaseContextValue>(
    () => ({ ...estado, iniciar, setAsientos, setDatosPasajeros, confirmarCompra, reiniciar }),
    [estado, iniciar, setAsientos, setDatosPasajeros, confirmarCompra, reiniciar]
  );

  return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>;
}
