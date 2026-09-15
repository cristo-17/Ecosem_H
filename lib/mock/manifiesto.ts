/**
 * Viajes del día con manifiesto completo (docs/prompts/09-manifiesto-sutran.md).
 * Dataset aparte de `lib/mock/viajes.ts` (esa es la vitrina de horarios para
 * comprar) y de `lib/mock/compras.ts` (historial de un pasajero): acá se
 * simula, para un puñado de salidas concretas, la lista real de pasajeros
 * que el manifiesto necesita — con el documento COMPLETO, nunca enmascarado
 * (ver D-0xx en docs/DECISIONES.md: es un documento de fiscalización, no de
 * cara al pasajero). Placa, conductor(es) y quién ya embarcó son mock fijo
 * por viaje.id, mismo criterio determinístico que `lib/mock/asientos.ts`.
 */
import type { BadgeStatus } from "@/components/ui/Badge";
import { VIAJES, terminalDe, type Ciudad, type TipoAsiento } from "@/lib/mock/viajes";
import { distribucionBus, generarAsientos } from "@/lib/mock/asientos";
import { hashSemilla, mulberry32 } from "@/lib/random";

export type EstadoEmbarquePasajero = "pendiente" | "embarcado";

export interface PasajeroManifiesto {
  /** Ya sin el prefijo de piso ("P1-3A" -> "3A"). */
  asiento: string;
  apellidos: string;
  nombres: string;
  tipoDocumento: string;
  /** Completo — nunca enmascarado. Ver la nota en el encabezado del archivo. */
  numeroDocumento: string;
  origen: Ciudad;
  destino: Ciudad;
  estadoEmbarque: EstadoEmbarquePasajero;
  /**
   * Mismo código que llevaría su boleto ("ECH-XXXXXX", ver
   * lib/pdf/boleto.ts / VentaView). Lo usa la PWA de embarque
   * (docs/prompts/10-pwa-embarque.md) para encontrar al pasajero dentro del
   * manifiesto ya descargado cuando escanea su QR — es el mismo identificador
   * que ese QR trae firmado.
   */
  codigoBoleto: string;
}

export interface ViajeDelDia {
  id: string;
  origen: Ciudad;
  destino: Ciudad;
  terminalOrigen: string;
  /** Agencia que despacha el viaje. En este mock, una agencia por ciudad. */
  agencia: Ciudad;
  fechaSalida: Date;
  tipoAsiento: TipoAsiento;
  capacidad: number;
  placaBus: string;
  conductores: string[];
  estado: BadgeStatus;
  pasajeros: PasajeroManifiesto[];
}

function capacidadBus(tipo: TipoAsiento): number {
  return distribucionBus(tipo).reduce((total, piso) => total + piso.filas * piso.columnas.length, 0);
}

// A diferencia de PurchaseSummary/boleto (donde "3A" alcanza porque el
// boleto es de un solo asiento y el piso ya se ve en el plano), acá se lista
// TODO el bus en una sola tabla: un bus de dos pisos repite "1A", "1B"...
// en cada piso, así que hace falta el número de piso para que cada fila
// identifique un asiento físico único, sin ambigüedad, en el manifiesto.
function etiquetaAsiento(id: string): string {
  return id.replace(/^P(\d)-/, "$1-");
}

function crearRandom(semilla: string): () => number {
  return mulberry32(hashSemilla(semilla));
}

function elegir<T>(random: () => number, opciones: readonly T[]): T {
  return opciones[Math.floor(random() * opciones.length)];
}

const APELLIDOS = [
  "Quispe", "Mamani", "Rojas", "Huamán", "Torres", "Flores", "Vargas", "Gutiérrez",
  "Salazar", "Fernández", "Ramos", "Chávez", "Paredes", "Cárdenas", "Aguilar",
  "Vilca", "Cusi", "Ccoyllo", "Yupanqui", "Alvarado",
] as const;

const NOMBRES = [
  "Carlos", "María", "José", "Rosa", "Luis", "Ana", "Jorge", "Elena", "Pedro",
  "Lucía", "Miguel", "Carmen", "Óscar", "Patricia", "Raúl", "Vanessa", "Franklin",
  "Milagros", "Edwin", "Katherine",
] as const;

const CONDUCTORES = [
  "Manuel Torres Quispe",
  "Wilfredo Salazar Mamani",
  "Julio Cárdenas Rojas",
  "Segundo Huamán Ccoyllo",
  "Fortunato Vilca Cusi",
] as const;

const PLACAS_BUS = ["AGX-921", "B0P-347", "C7W-118", "D2K-560", "F5R-284"] as const;

function generarDni(random: () => number): string {
  return String(10000000 + Math.floor(random() * 90000000));
}

const ALFABETO_CODIGO = "0123456789ABCDEF";

/** Mismo formato "ECH-XXXXXX" que genera VentaView, pero determinístico (semilla propia). */
function generarCodigoBoleto(random: () => number): string {
  let sufijo = "";
  for (let i = 0; i < 6; i++) {
    sufijo += ALFABETO_CODIGO[Math.floor(random() * ALFABETO_CODIGO.length)];
  }
  return `ECH-${sufijo}`;
}

function generarPasajero(
  random: () => number,
  origen: Ciudad,
  destino: Ciudad,
  asientoId: string,
  indice: number,
): PasajeroManifiesto {
  const esDni = random() < 0.85;
  const tipoDocumento = esDni ? "DNI" : random() < 0.5 ? "Carné de Extranjería" : "Pasaporte";
  const numeroDocumento = esDni
    ? generarDni(random)
    : `X${String(1000000 + Math.floor(random() * 9000000))}`;

  return {
    asiento: etiquetaAsiento(asientoId),
    apellidos: `${elegir(random, APELLIDOS)} ${elegir(random, APELLIDOS)}`,
    nombres: elegir(random, NOMBRES),
    tipoDocumento,
    numeroDocumento,
    origen,
    destino,
    // Determinístico (no aleatorio): 1 de cada 3, en orden de asiento, para
    // mostrar la mezcla pendiente/embarcado ya al descargar el manifiesto en
    // la PWA de embarque (docs/prompts/10-pwa-embarque.md) — esos pasajeros
    // se siembran ahí como ya escaneados, antes de que el personal escanee
    // ninguno de verdad.
    estadoEmbarque: indice % 3 === 0 ? "embarcado" : "pendiente",
    codigoBoleto: generarCodigoBoleto(random),
  };
}

function generarViajeDelDia(
  viajeId: string,
  vendidos: number,
  estado: BadgeStatus,
): ViajeDelDia {
  const base = VIAJES.find((v) => v.id === viajeId);
  if (!base) throw new Error(`Viaje mock ${viajeId} no existe en lib/mock/viajes.ts`);

  const random = crearRandom(viajeId);
  const capacidad = capacidadBus(base.tipoAsiento);
  const asientosOrdenados = generarAsientos(base);
  const conteoPasajeros = Math.min(vendidos, capacidad);

  const pasajeros = asientosOrdenados
    .slice(0, conteoPasajeros)
    .map((asiento, indice) => generarPasajero(random, base.origen, base.destino, asiento.id, indice));

  return {
    id: base.id,
    origen: base.origen,
    destino: base.destino,
    terminalOrigen: terminalDe(base.origen),
    agencia: base.origen,
    fechaSalida: base.horaSalida,
    tipoAsiento: base.tipoAsiento,
    capacidad,
    placaBus: elegir(random, PLACAS_BUS),
    // Turno largo (más de 5h): dos conductores por relevo, exigencia real de
    // SUTRAN para viajes largos que este mock sí refleja.
    conductores: base.duracionMinutos > 300 ? [CONDUCTORES[0], CONDUCTORES[1]] : [elegir(random, CONDUCTORES)],
    estado,
    pasajeros,
  };
}

/**
 * "Hoy" para este mock: el mismo día de referencia fijo que usa
 * lib/mock/viajes.ts (evita desajustes de hidratación servidor/cliente por
 * usar `new Date()`).
 */
export const FECHA_VIAJES_DEL_DIA = new Date(2026, 7, 31);

// v1 (económico, 2 pisos, capacidad 56) casi lleno a propósito: es el caso
// de prueba explícito del prompt ("bus de dos pisos lleno" -> el manifiesto
// debe paginar). v4 (VIP, pocos pasajeros) es el otro caso explícito.
export const VIAJES_DEL_DIA: ViajeDelDia[] = [
  generarViajeDelDia("v1", 56, "en-ruta"),
  generarViajeDelDia("v2", 39, "confirmado"),
  generarViajeDelDia("v4", 4, "confirmado"),
  generarViajeDelDia("v6", 0, "cancelado"),
  generarViajeDelDia("v8", 16, "completado"),
  generarViajeDelDia("v12", 10, "pendiente"),
];

export interface FiltroViajesDelDia {
  fecha?: Date | null;
  origen?: Ciudad | null;
  destino?: Ciudad | null;
  agencia?: Ciudad | null;
}

function esMismoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function buscarViajesDelDia(filtro: FiltroViajesDelDia = {}): ViajeDelDia[] {
  return VIAJES_DEL_DIA.filter((viaje) => {
    if (filtro.fecha && !esMismoDia(viaje.fechaSalida, filtro.fecha)) return false;
    if (filtro.origen && viaje.origen !== filtro.origen) return false;
    if (filtro.destino && viaje.destino !== filtro.destino) return false;
    if (filtro.agencia && viaje.agencia !== filtro.agencia) return false;
    return true;
  });
}

export function buscarViajeDelDiaPorId(id: string): ViajeDelDia | null {
  return VIAJES_DEL_DIA.find((viaje) => viaje.id === id) ?? null;
}
