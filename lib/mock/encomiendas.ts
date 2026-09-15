/**
 * Datos y reglas falsas de rastreo del servicio de encomiendas. El
 * tarifario (rangos de peso, montos, recargos) se movió a
 * `lib/mock/tarifario.ts` (docs/prompts/13-tarifario-encomiendas.md): ese
 * módulo es explícitamente sobre precios pendientes de definición
 * comercial, y este archivo es sobre el seguimiento de un envío ya
 * registrado — dos dominios que no tenían por qué compartir archivo.
 */
import type { BadgeStatus } from "@/components/ui/Badge";
import type {
  EstadoEncomienda,
  EventoEncomienda,
} from "@/components/ui/EncomiendaTimeline";
import type { Ciudad } from "@/lib/mock/viajes";

// --- Rastreo ---
// `estadoActual` usa el mismo vocabulario de Badge que pasajes (incluye
// "cancelado", que no tiene lugar fijo en el ciclo de vida). `etapaActual` +
// `eventos` son aparte: los 4 estados fijos de encomienda (CLAUDE.md) que
// dibuja EncomiendaTimeline, con terminal y fecha/hora por cada etapa ya
// alcanzada.

export interface Encomienda {
  guia: string;
  origen: Ciudad;
  destino: Ciudad;
  remitente: string;
  destinatario: string;
  pesoFacturableKg: number;
  estadoActual: BadgeStatus;
  etapaActual: EstadoEncomienda;
  /** Una por cada etapa ya alcanzada, en cualquier orden. */
  eventos: EventoEncomienda[];
}

export const ENCOMIENDAS_MOCK: Encomienda[] = [
  {
    guia: "ECH-000123",
    origen: "Lima",
    destino: "Huancayo",
    remitente: "Comercial Andina SAC",
    destinatario: "Rosa Fernández",
    pesoFacturableKg: 8.5,
    estadoActual: "pendiente",
    etapaActual: "alistando",
    eventos: [
      {
        estado: "registrada",
        fecha: new Date(2026, 7, 29, 9, 0),
        terminal: "Terminal Lima Norte",
      },
      {
        estado: "alistando",
        fecha: new Date(2026, 7, 29, 11, 30),
        terminal: "Terminal Lima Norte",
      },
    ],
  },
  {
    guia: "ECH-000321",
    origen: "Cerro de Pasco",
    destino: "Lima",
    remitente: "Ferretería Andahuaylas",
    destinatario: "Constructora Vilcabamba",
    pesoFacturableKg: 22,
    estadoActual: "en-ruta",
    etapaActual: "en-camino",
    eventos: [
      {
        estado: "registrada",
        fecha: new Date(2026, 7, 30, 7, 0),
        terminal: "Terminal Cerro de Pasco",
      },
      {
        estado: "alistando",
        fecha: new Date(2026, 7, 30, 7, 40),
        terminal: "Terminal Cerro de Pasco",
      },
      {
        estado: "en-camino",
        fecha: new Date(2026, 7, 30, 8, 15),
        terminal: "Terminal Cerro de Pasco",
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
    etapaActual: "despachada",
    eventos: [
      {
        estado: "registrada",
        fecha: new Date(2026, 7, 25, 8, 30),
        terminal: "Terminal Huancayo Centro",
      },
      {
        estado: "alistando",
        fecha: new Date(2026, 7, 25, 9, 15),
        terminal: "Terminal Huancayo Centro",
      },
      {
        estado: "en-camino",
        fecha: new Date(2026, 7, 25, 16, 0),
        terminal: "Terminal Huancayo Centro",
      },
      {
        estado: "despachada",
        fecha: new Date(2026, 7, 25, 22, 45),
        terminal: "Terminal Lima Norte",
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
    etapaActual: "registrada",
    eventos: [
      {
        estado: "registrada",
        fecha: new Date(2026, 7, 27, 11, 0),
        terminal: "Terminal Lima Norte",
      },
    ],
  },
  // Envíos del usuario de la sesión simulada (lib/mock/sesion.ts), para la
  // pestaña "Mis encomiendas" de /mi-perfil.
  {
    guia: "ECH-000654",
    origen: "Lima",
    destino: "Huancayo",
    remitente: "Carlos Mendoza Ruiz",
    destinatario: "María Mendoza Ruiz",
    pesoFacturableKg: 4.2,
    estadoActual: "pendiente",
    etapaActual: "registrada",
    eventos: [
      {
        estado: "registrada",
        fecha: new Date(2026, 8, 1, 10, 15),
        terminal: "Terminal Lima Norte",
      },
    ],
  },
  {
    guia: "ECH-000987",
    origen: "Lima",
    destino: "Cerro de Pasco",
    remitente: "Carlos Mendoza Ruiz",
    destinatario: "Óscar Mendoza Ruiz",
    pesoFacturableKg: 12,
    estadoActual: "completado",
    etapaActual: "despachada",
    eventos: [
      {
        estado: "registrada",
        fecha: new Date(2026, 7, 20, 9, 0),
        terminal: "Terminal Lima Norte",
      },
      {
        estado: "alistando",
        fecha: new Date(2026, 7, 20, 9, 40),
        terminal: "Terminal Lima Norte",
      },
      {
        estado: "en-camino",
        fecha: new Date(2026, 7, 20, 13, 0),
        terminal: "Terminal Lima Norte",
      },
      {
        estado: "despachada",
        fecha: new Date(2026, 7, 20, 19, 30),
        terminal: "Terminal Cerro de Pasco",
      },
    ],
  },
];

export function buscarEncomiendaPorGuia(guia: string): Encomienda | null {
  const normalizada = guia.trim().toUpperCase();
  return ENCOMIENDAS_MOCK.find((encomienda) => encomienda.guia === normalizada) ?? null;
}

/** Envíos hechos por el usuario de la sesión simulada, para "Mis encomiendas". */
export function buscarMisEncomiendas(remitente: string): Encomienda[] {
  return ENCOMIENDAS_MOCK.filter((encomienda) => encomienda.remitente === remitente);
}
