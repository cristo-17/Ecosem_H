/**
 * Datos falsos de viajes, rutas y catálogos asociados. Ecosem H todavía no
 * tiene backend conectado: esta es la única fuente de datos hasta que se
 * integre Supabase. Nada de esto debe copiarse dentro de un componente.
 */
import type { SelectOption } from "@/components/ui/Select";

export const CIUDADES = ["Lima", "Cerro de Pasco", "Huancayo"] as const;
export type Ciudad = (typeof CIUDADES)[number];

export const OPCIONES_CIUDAD: SelectOption[] = CIUDADES.map((ciudad) => ({
  value: ciudad,
  label: ciudad,
}));

export type TipoAsiento = "economico" | "ejecutivo" | "vip";

export const TIPOS_ASIENTO: { value: TipoAsiento; label: string }[] = [
  { value: "economico", label: "Económico" },
  { value: "ejecutivo", label: "Ejecutivo" },
  { value: "vip", label: "VIP" },
];

export function labelTipoAsiento(tipo: TipoAsiento): string {
  return TIPOS_ASIENTO.find((t) => t.value === tipo)?.label ?? tipo;
}

export type FranjaHoraria = "manana" | "tarde" | "noche";

export const FRANJAS_HORARIAS: { value: FranjaHoraria; label: string }[] = [
  { value: "manana", label: "Mañana (5:00 AM – 11:59 AM)" },
  { value: "tarde", label: "Tarde (12:00 PM – 5:59 PM)" },
  { value: "noche", label: "Noche (6:00 PM – 11:59 PM)" },
];

export function franjaHoraria(date: Date): FranjaHoraria {
  const hora = date.getHours();
  if (hora < 12) return "manana";
  if (hora < 18) return "tarde";
  return "noche";
}

export interface Viaje {
  id: string;
  marca: string;
  origen: Ciudad;
  destino: Ciudad;
  terminalOrigen: string;
  horaSalida: Date;
  horaLlegada: Date;
  duracionMinutos: number;
  asientosDisponibles: number;
  tipoAsiento: TipoAsiento;
  precio: number;
}

export interface RutaPopular {
  id: string;
  origen: Ciudad;
  destino: Ciudad;
  precioDesde: number;
}

export const RUTAS_POPULARES: RutaPopular[] = [
  { id: "lima-huancayo", origen: "Lima", destino: "Huancayo", precioDesde: 30 },
  { id: "lima-cerro-de-pasco", origen: "Lima", destino: "Cerro de Pasco", precioDesde: 28 },
  { id: "huancayo-lima", origen: "Huancayo", destino: "Lima", precioDesde: 30 },
  { id: "cerro-de-pasco-lima", origen: "Cerro de Pasco", destino: "Lima", precioDesde: 28 },
];

const TERMINALES: Record<Ciudad, string> = {
  Lima: "Terminal Lima Norte",
  "Cerro de Pasco": "Terminal Cerro de Pasco",
  Huancayo: "Terminal Huancayo Centro",
};

export function terminalDe(ciudad: Ciudad): string {
  return TERMINALES[ciudad];
}

// Fecha de referencia fija (no "hoy"): estos viajes solo se usan para
// mostrar hora/duración, y una referencia fija evita desajustes de
// hidratación entre servidor y cliente.
function hora(h: number, m: number): Date {
  return new Date(2026, 7, 31, h, m);
}

function agregarMinutos(fecha: Date, minutos: number): Date {
  return new Date(fecha.getTime() + minutos * 60_000);
}

function crearViaje(
  id: string,
  origen: Ciudad,
  destino: Ciudad,
  horaSalidaValue: Date,
  duracionMinutos: number,
  tipoAsiento: TipoAsiento,
  asientosDisponibles: number,
  precio: number
): Viaje {
  return {
    id,
    marca: "Ecosem H",
    origen,
    destino,
    terminalOrigen: TERMINALES[origen],
    horaSalida: horaSalidaValue,
    horaLlegada: agregarMinutos(horaSalidaValue, duracionMinutos),
    duracionMinutos,
    asientosDisponibles,
    tipoAsiento,
    precio,
  };
}

export const VIAJES: Viaje[] = [
  // Lima -> Huancayo: set principal, cubre las tres franjas y ambos límites
  // de disponibilidad (4 = ámbar, 5 = verde).
  crearViaje("v1", "Lima", "Huancayo", hora(5, 30), 390, "economico", 14, 35),
  crearViaje("v2", "Lima", "Huancayo", hora(7, 0), 375, "ejecutivo", 3, 55),
  crearViaje("v3", "Lima", "Huancayo", hora(9, 15), 405, "economico", 22, 32),
  crearViaje("v4", "Lima", "Huancayo", hora(13, 0), 370, "vip", 4, 75),
  crearViaje("v5", "Lima", "Huancayo", hora(15, 30), 380, "ejecutivo", 18, 50),
  crearViaje("v6", "Lima", "Huancayo", hora(20, 0), 400, "economico", 1, 30),
  crearViaje("v7", "Lima", "Huancayo", hora(22, 30), 365, "vip", 9, 70),

  // Lima <-> Cerro de Pasco
  crearViaje("v8", "Lima", "Cerro de Pasco", hora(6, 0), 270, "economico", 16, 28),
  crearViaje("v9", "Lima", "Cerro de Pasco", hora(14, 0), 255, "ejecutivo", 2, 42),
  crearViaje("v10", "Cerro de Pasco", "Lima", hora(8, 0), 260, "economico", 20, 28),
  crearViaje("v11", "Cerro de Pasco", "Lima", hora(18, 30), 250, "ejecutivo", 5, 42),

  // Huancayo <-> Lima
  crearViaje("v12", "Huancayo", "Lima", hora(6, 30), 390, "economico", 10, 35),
  crearViaje("v13", "Huancayo", "Lima", hora(16, 0), 370, "vip", 4, 75),

  // Huancayo <-> Cerro de Pasco
  crearViaje("v14", "Huancayo", "Cerro de Pasco", hora(7, 30), 150, "economico", 12, 15),
  crearViaje("v15", "Huancayo", "Cerro de Pasco", hora(17, 0), 140, "ejecutivo", 3, 25),
  crearViaje("v16", "Cerro de Pasco", "Huancayo", hora(9, 0), 150, "economico", 9, 15),
  crearViaje("v17", "Cerro de Pasco", "Huancayo", hora(19, 0), 155, "economico", 2, 15),
];

export function buscarViajes(origen: Ciudad, destino: Ciudad): Viaje[] {
  return VIAJES.filter((viaje) => viaje.origen === origen && viaje.destino === destino);
}

export function esCiudad(valor: string | undefined): valor is Ciudad {
  return CIUDADES.includes(valor as Ciudad);
}
