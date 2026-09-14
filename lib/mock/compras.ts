/**
 * Historial de compras falso para "Mis Viajes". Independiente del flujo de
 * compra en vivo (components/pasajes/PurchaseProvider): ese estado vive
 * solo en memoria durante la sesión de compra y se pierde al terminarla
 * (CLAUDE.md prohíbe guardar la reserva en localStorage), así que esta
 * pantalla necesita su propia fuente de datos, igual que VIAJES.
 */
import type { BadgeStatus } from "@/components/ui/Badge";
import type { Ciudad, TipoAsiento } from "@/lib/mock/viajes";
import type { PasajeroBoletoPdf } from "@/lib/pdf/boleto";

export type ComprobanteCompra =
  | { tipo: "boleta" }
  | { tipo: "factura"; ruc: string; razonSocial: string };

export interface CompraPasaje {
  id: string;
  codigo: string;
  estado: BadgeStatus;
  marca: string;
  origen: Ciudad;
  destino: Ciudad;
  fechaSalida: Date;
  tipoAsiento: TipoAsiento;
  asientos: string[];
  // Ya enmascarados acá mismo: el historial de compras no guarda el DNI
  // completo de nadie (Ley 29733), igual que lib/mock/sesion.ts.
  pasajeros: PasajeroBoletoPdf[];
  total: number;
  comprobante: ComprobanteCompra;
}

export const MIS_COMPRAS: CompraPasaje[] = [
  {
    id: "c1",
    codigo: "ECH-9F21A0",
    estado: "en-ruta",
    marca: "Ecosem H",
    origen: "Lima",
    destino: "Huancayo",
    fechaSalida: new Date(2026, 7, 31, 5, 30),
    tipoAsiento: "economico",
    asientos: ["P1-3A"],
    pasajeros: [{ nombre: "Carlos Mendoza Ruiz", documentoEnmascarado: "******13" }],
    total: 35,
    comprobante: { tipo: "boleta" },
  },
  {
    id: "c2",
    codigo: "ECH-4B7C12",
    estado: "confirmado",
    marca: "Ecosem H",
    origen: "Lima",
    destino: "Cerro de Pasco",
    fechaSalida: new Date(2026, 8, 6, 14, 0),
    tipoAsiento: "ejecutivo",
    asientos: ["P1-2A", "P1-2B"],
    pasajeros: [
      { nombre: "Carlos Mendoza Ruiz", documentoEnmascarado: "******13" },
      { nombre: "María Mendoza Ruiz", documentoEnmascarado: "******47" },
    ],
    total: 84,
    comprobante: { tipo: "factura", ruc: "20601234567", razonSocial: "Comercial Andina SAC" },
  },
  {
    id: "c3",
    codigo: "ECH-11A0F3",
    estado: "pendiente",
    marca: "Ecosem H",
    origen: "Huancayo",
    destino: "Lima",
    fechaSalida: new Date(2026, 8, 12, 16, 0),
    tipoAsiento: "vip",
    asientos: ["P2-1A"],
    pasajeros: [{ nombre: "Carlos Mendoza Ruiz", documentoEnmascarado: "******13" }],
    total: 75,
    comprobante: { tipo: "boleta" },
  },
  {
    id: "c4",
    codigo: "ECH-77D2E9",
    estado: "completado",
    marca: "Ecosem H",
    origen: "Lima",
    destino: "Huancayo",
    fechaSalida: new Date(2026, 6, 18, 7, 0),
    tipoAsiento: "ejecutivo",
    asientos: ["P1-4C"],
    pasajeros: [{ nombre: "Carlos Mendoza Ruiz", documentoEnmascarado: "******13" }],
    total: 55,
    comprobante: { tipo: "boleta" },
  },
  {
    id: "c5",
    codigo: "ECH-2C90B4",
    estado: "cancelado",
    marca: "Ecosem H",
    origen: "Cerro de Pasco",
    destino: "Lima",
    fechaSalida: new Date(2026, 6, 2, 18, 30),
    tipoAsiento: "ejecutivo",
    asientos: ["P1-1D"],
    pasajeros: [{ nombre: "Carlos Mendoza Ruiz", documentoEnmascarado: "******13" }],
    total: 42,
    comprobante: { tipo: "boleta" },
  },
];
