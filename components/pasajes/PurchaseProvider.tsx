"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type {
  DocumentKind,
  ReservationResponse,
  TripSummary,
} from "@/lib/types/contratos-frontend";
import { liberarReserva } from "@/lib/api/compra";

/** El viaje elegido en resultados, con lo necesario para volver a esa búsqueda. */
export interface ViajeCompra {
  viaje: TripSummary;
  terminalOrigen: string;
  origen: string;
  destino: string;
  /** `AAAA-MM-DD` de la búsqueda. */
  fecha: string;
}

/** Lo que se va escribiendo de un pasajero. Solo en memoria. */
export interface BorradorPasajero {
  documentType: DocumentKind;
  documentNumber: string;
  firstNames: string;
  lastNames: string;
  /** `AAAA-MM-DD`. */
  birthDate: string;
  companionName: string;
  companionRelationship: string;
}

export interface BorradorContacto {
  email: string;
  phone: string;
  whatsappOptIn: boolean;
  dataAuthorization: boolean;
}

export const PASAJERO_VACIO: BorradorPasajero = {
  documentType: "dni",
  documentNumber: "",
  firstNames: "",
  lastNames: "",
  birthDate: "",
  companionName: "",
  companionRelationship: "",
};

const CONTACTO_VACIO: BorradorContacto = {
  email: "",
  phone: "",
  whatsappOptIn: false,
  dataAuthorization: false,
};

interface PurchaseState {
  viaje: ViajeCompra | null;
  pasajerosCount: number;
  /**
   * La reserva tal como la devolvió el backend: asientos, vencimiento y precio
   * congelado. Nunca se recalcula ni se modifica en el cliente.
   */
  reserva: ReservationResponse | null;
  /**
   * Ya se pidió el cobro a la pasarela. Desde aquí la reserva no se libera
   * desde el navegador: el usuario puede estar pagando en Yape.
   */
  pagoIniciado: boolean;
  borradores: BorradorPasajero[];
  contacto: BorradorContacto;
}

interface PurchaseContextValue extends PurchaseState {
  iniciar: (viaje: ViajeCompra, pasajerosCount: number) => void;
  fijarReserva: (reserva: ReservationResponse) => void;
  /** Libera la reserva actual (si no se inició el pago) y la olvida. */
  soltarReserva: () => void;
  /** La reserva venció o ya no existe en el backend: se olvida sin liberar. */
  olvidarReserva: () => void;
  marcarPagoIniciado: () => void;
  setBorradores: (borradores: BorradorPasajero[]) => void;
  setContacto: (contacto: BorradorContacto) => void;
}

const ESTADO_INICIAL: PurchaseState = {
  viaje: null,
  pasajerosCount: 1,
  reserva: null,
  pagoIniciado: false,
  borradores: [],
  contacto: CONTACTO_VACIO,
};

const PurchaseContext = createContext<PurchaseContextValue | null>(null);

/**
 * Estado del flujo de compra en memoria (React state), nunca en
 * localStorage: la reserva vive en el servidor (CLAUDE.md), y los datos de
 * los pasajeros son datos personales que no se guardan en el navegador ni
 * viajan por la URL (Ley 29733). Vive en el layout de /pasajes/comprar, así
 * que sobrevive a la navegación entre pasos y se pierde al recargar: cada
 * pantalla maneja ese caso consultando el estado real al backend.
 *
 * Qué pasa con una reserva viva (docs/BITACORA.md, 17/10/2026):
 * - Retroceder dentro del flujo (pago → datos → asientos): se conserva.
 * - Salir del flujo (volver a resultados, ir a otra sección): se libera, si
 *   no se inició el pago. Retener asientos que nadie va a pagar los bloquea
 *   para otros y cuenta contra el tope de 8 por sesión.
 * - Cerrar la pestaña o recargar: no se envía nada. Un aviso al cerrar no
 *   llega de forma confiable en móviles, y recargar no es abandonar. La
 *   reserva vence a su hora y el proceso programado del backend la libera.
 */
export function usePurchase() {
  const ctx = useContext(PurchaseContext);
  if (!ctx) throw new Error("usePurchase debe usarse dentro de <PurchaseProvider>");
  return ctx;
}

function liberarSinEsperar(reservationId: string) {
  // Si falla (sin red), la reserva vence sola a su hora.
  liberarReserva(reservationId, { keepalive: true }).catch(() => {});
}

export function PurchaseProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<PurchaseState>(ESTADO_INICIAL);

  // Al salir del flujo (se desmonta el layout) se libera lo que siga
  // retenido. El ref deja leer el estado más reciente desde la limpieza.
  const estadoRef = useRef(estado);
  useEffect(() => {
    estadoRef.current = estado;
  });
  useEffect(
    () => () => {
      const { reserva, pagoIniciado } = estadoRef.current;
      if (reserva && !pagoIniciado) liberarSinEsperar(reserva.reservationId);
    },
    [],
  );

  // Liberar es un efecto de red: va fuera del actualizador de setState, que
  // React puede ejecutar dos veces.
  const liberarActual = useCallback(() => {
    const { reserva, pagoIniciado } = estadoRef.current;
    if (reserva && !pagoIniciado) liberarSinEsperar(reserva.reservationId);
  }, []);

  const iniciar = useCallback((viaje: ViajeCompra, pasajerosCount: number) => {
    const actual = estadoRef.current;
    const mismo =
      actual.viaje?.viaje.id === viaje.viaje.id && actual.pasajerosCount === pasajerosCount;
    if (!mismo) liberarActual();
    setEstado((prev) => {
      if (prev.viaje?.viaje.id === viaje.viaje.id && prev.pasajerosCount === pasajerosCount) {
        return prev;
      }
      return {
        ...ESTADO_INICIAL,
        viaje,
        pasajerosCount,
        // Lo escrito se conserva si solo cambió el viaje: no se vuelve a pedir.
        borradores: prev.borradores,
        contacto: prev.contacto,
      };
    });
  }, [liberarActual]);

  const fijarReserva = useCallback((reserva: ReservationResponse) => {
    setEstado((prev) => ({ ...prev, reserva, pagoIniciado: false }));
  }, []);

  const soltarReserva = useCallback(() => {
    liberarActual();
    estadoRef.current = { ...estadoRef.current, reserva: null };
    setEstado((prev) => ({ ...prev, reserva: null, pagoIniciado: false }));
  }, [liberarActual]);

  const olvidarReserva = useCallback(() => {
    setEstado((prev) => ({ ...prev, reserva: null, pagoIniciado: false }));
  }, []);

  const marcarPagoIniciado = useCallback(() => {
    // Al instante, sin esperar al render: si el usuario sale justo después de
    // pagar, la limpieza no debe liberar la reserva.
    estadoRef.current = { ...estadoRef.current, pagoIniciado: true };
    setEstado((prev) => ({ ...prev, pagoIniciado: true }));
  }, []);

  const setBorradores = useCallback((borradores: BorradorPasajero[]) => {
    setEstado((prev) => ({ ...prev, borradores }));
  }, []);

  const setContacto = useCallback((contacto: BorradorContacto) => {
    setEstado((prev) => ({ ...prev, contacto }));
  }, []);

  const value = useMemo<PurchaseContextValue>(
    () => ({
      ...estado,
      iniciar,
      fijarReserva,
      soltarReserva,
      olvidarReserva,
      marcarPagoIniciado,
      setBorradores,
      setContacto,
    }),
    [
      estado,
      iniciar,
      fijarReserva,
      soltarReserva,
      olvidarReserva,
      marcarPagoIniciado,
      setBorradores,
      setContacto,
    ],
  );

  return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>;
}
