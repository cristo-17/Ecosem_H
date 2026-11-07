"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type {
  DocumentKind,
  ReservationResponse,
  TripSummary,
} from "@/lib/types/contratos-frontend";
import { liberarReserva, recuperarReserva, recordarReserva, reservaRecordada, mensajeCompra, type MensajeError } from "@/lib/api/compra";
import { useRouter } from "next/navigation";
import { SkeletonShape } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClockIcon, ExclamationIcon } from "@/components/ui/icons";
import { RUTAS, rutaCompraConfirmacion } from "@/lib/routes";

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
 * que sobrevive a la navegación entre pasos. Al recargar se reconstruye con
 * la reserva del backend y el token original, nunca con un carrito local.
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
  const estadoRef = useRef(estado);
  const router = useRouter();
  const [recuperacion, setRecuperacion] = useState<"cargando" | "lista" | "vencida" | MensajeError>("cargando");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const seleccion = window.location.pathname.endsWith("/asientos");
    const id = query.get("reserva") || (seleccion ? reservaRecordada() : null);
    // Confirmación ya consulta el backend, incluso mientras espera el webhook.
    if (!id || window.location.pathname.endsWith("/confirmacion")) {
      // La URL y sessionStorage solo están disponibles después de hidratar.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecuperacion("lista");
      return;
    }
    const controller = new AbortController();
    recuperarReserva(id, { signal: controller.signal }).then((datos) => {
      if (controller.signal.aborted) return;
      if (seleccion && datos.reservation.tripId !== query.get("viajeId")) {
        setRecuperacion("lista");
        return;
      }
      if (datos.status === "purchased") {
        router.replace(rutaCompraConfirmacion(id));
        setRecuperacion("lista");
        return;
      }
      if (datos.status === "expired") {
        recordarReserva(null);
        setRecuperacion("vencida");
        return;
      }
      const restaurado: PurchaseState = {
        viaje: { viaje: datos.trip, origen: datos.origin, destino: datos.destination,
          terminalOrigen: datos.originTerminal, fecha: datos.date },
        pasajerosCount: datos.reservation.seats.length,
        reserva: datos.reservation,
        pagoIniciado: datos.paymentStarted,
        borradores: datos.reservation.seats.map((seat) => {
          const p = datos.passengers.find((p) => p.seat === seat);
          return p ? { ...p, companionName: p.companion?.name ?? "",
            companionRelationship: p.companion?.relationship ?? "" } : { ...PASAJERO_VACIO };
        }),
        contacto: { email: datos.contact?.email ?? "", phone: datos.contact?.phone ?? "",
          whatsappOptIn: datos.contact?.whatsappOptIn ?? false, dataAuthorization: false },
      };
      estadoRef.current = restaurado;
      setEstado(restaurado);
      recordarReserva(id);
      setRecuperacion("lista");
    }, (error: unknown) => {
      if (!controller.signal.aborted) setRecuperacion(mensajeCompra(error));
    });
    return () => controller.abort();
  }, [router, intento]);

  // Al salir del flujo (se desmonta el layout) se libera lo que siga
  // retenido. El ref deja leer el estado más reciente desde la limpieza.
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
    recordarReserva(reserva.reservationId);
    setEstado((prev) => ({ ...prev, reserva, pagoIniciado: false }));
  }, []);

  const soltarReserva = useCallback(() => {
    recordarReserva(null);
    liberarActual();
    estadoRef.current = { ...estadoRef.current, reserva: null };
    setEstado((prev) => ({ ...prev, reserva: null, pagoIniciado: false }));
  }, [liberarActual]);

  const olvidarReserva = useCallback(() => {
    recordarReserva(null);
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

  if (recuperacion === "cargando") return <div role="status" aria-label="Recuperando tu compra" className="mx-auto max-w-3xl p-4"><SkeletonShape variant="card" className="h-48" /></div>;
  if (recuperacion === "vencida") return <EmptyState icon={<ClockIcon />} title="Tu reserva venció" description="Se acabó el tiempo para completar la compra y los asientos se liberaron. Busca un viaje para volver a reservar." actionLabel="Buscar pasajes" onAction={() => router.push(RUTAS.inicio)} />;
  if (typeof recuperacion === "object") return <EmptyState icon={<ExclamationIcon />} title={recuperacion.titulo} description={recuperacion.descripcion} actionLabel="Reintentar" onAction={() => { setRecuperacion("cargando"); setIntento((n) => n + 1); }} />;
  return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>;
}
