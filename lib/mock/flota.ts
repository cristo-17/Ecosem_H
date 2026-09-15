/**
 * Sistema de alertas de flota (docs/prompts/12-alertas-flota.md). No es
 * gestión integral de flota: el sistema notifica, el área operativa decide y
 * registra la atención. Placas y conductores son los mismos ya usados en
 * lib/mock/manifiesto.ts (PLACAS_BUS / CONDUCTORES) — se repiten acá como
 * literales, con este comentario dejando la fuente explícita, en vez de
 * exportarlos desde manifiesto.ts para no tocar un módulo ya entregado.
 *
 * "Hoy" es una fecha de referencia fija (mismo criterio que
 * FECHA_VIAJES_DEL_DIA en manifiesto.ts): evita que el escalonamiento de
 * alertas cambie de un render a otro por usar `new Date()` en el servidor y
 * en el cliente en momentos distintos.
 */
import { labelTipoAsiento, type TipoAsiento } from "@/lib/mock/viajes";

export const HOY_FLOTA = new Date(2026, 8, 15);

const MS_POR_DIA = 1000 * 60 * 60 * 24;

function sumarDias(base: Date, dias: number): Date {
  return new Date(base.getTime() + dias * MS_POR_DIA);
}

/** Redondeado hacia arriba: a 0.3 días de vencer ya cuenta como "vence hoy", no "ya venció". */
export function diasRestantes(fecha: Date, hoy: Date = HOY_FLOTA): number {
  return Math.ceil((fecha.getTime() - hoy.getTime()) / MS_POR_DIA);
}

export interface DocumentoVencimiento {
  numero: string;
  vencimiento: Date;
}

export interface DocumentosUnidad {
  soat: DocumentoVencimiento;
  revisionTecnica: DocumentoVencimiento;
  tarjetaCirculacion: DocumentoVencimiento;
}

export interface Unidad {
  placa: string;
  modelo: string;
  capacidad: number;
  tipoServicio: TipoAsiento;
  kilometrajeAcumulado: number;
  /** Configurable desde /panel/flota/[placa]: kilometraje a partir del cual se alerta mantenimiento. */
  umbralKilometraje: number;
  documentos: DocumentosUnidad;
}

export interface Conductor {
  id: string;
  nombre: string;
  licencia: string;
  vencimientoLicencia: Date;
  horasConduccionAcumuladas: number;
}

export function labelTipoServicio(tipo: TipoAsiento): string {
  return labelTipoAsiento(tipo);
}

// Modelos y marcas inventados a propósito ("Volnova", "Traxia", "Kondorra",
// "Altiva", "Runacar" no existen): restricción explícita del prompt, datos
// mock claramente ficticios, no una marca real usada sin autorización.
export const UNIDADES: Unidad[] = [
  {
    placa: "AGX-921",
    modelo: "Volnova Andina 360",
    capacidad: 56,
    tipoServicio: "economico",
    kilometrajeAcumulado: 210_000,
    umbralKilometraje: 200_000,
    documentos: {
      // A 20 días de hoy: caso de verificación del prompt (nivel 30 = info).
      soat: { numero: "SOAT-AGX921-26", vencimiento: sumarDias(HOY_FLOTA, 20) },
      revisionTecnica: { numero: "RT-AGX921-26", vencimiento: sumarDias(HOY_FLOTA, 200) },
      tarjetaCirculacion: { numero: "TC-AGX921-19", vencimiento: sumarDias(HOY_FLOTA, 150) },
    },
  },
  {
    placa: "B0P-347",
    modelo: "Traxia Cordillera EX",
    capacidad: 42,
    tipoServicio: "ejecutivo",
    kilometrajeAcumulado: 95_000,
    umbralKilometraje: 180_000,
    documentos: {
      // A 12 días de hoy: caso de verificación del prompt (nivel 15 = warning).
      soat: { numero: "SOAT-B0P347-26", vencimiento: sumarDias(HOY_FLOTA, 12) },
      revisionTecnica: { numero: "RT-B0P347-26", vencimiento: sumarDias(HOY_FLOTA, 10) },
      tarjetaCirculacion: { numero: "TC-B0P347-20", vencimiento: sumarDias(HOY_FLOTA, 300) },
    },
  },
  {
    placa: "C7W-118",
    modelo: "Kondorra Sky VIP",
    capacidad: 30,
    tipoServicio: "vip",
    kilometrajeAcumulado: 160_000,
    umbralKilometraje: 150_000,
    documentos: {
      // A 5 días de hoy: caso de verificación del prompt (nivel 7 = error).
      soat: { numero: "SOAT-C7W118-26", vencimiento: sumarDias(HOY_FLOTA, 5) },
      revisionTecnica: { numero: "RT-C7W118-25", vencimiento: sumarDias(HOY_FLOTA, -10) },
      tarjetaCirculacion: { numero: "TC-C7W118-20", vencimiento: sumarDias(HOY_FLOTA, 60) },
    },
  },
  {
    placa: "D2K-560",
    modelo: "Altiva Pasco 400",
    capacidad: 56,
    tipoServicio: "economico",
    kilometrajeAcumulado: 70_000,
    umbralKilometraje: 200_000,
    documentos: {
      soat: { numero: "SOAT-D2K560-25", vencimiento: sumarDias(HOY_FLOTA, -3) },
      revisionTecnica: { numero: "RT-D2K560-26", vencimiento: sumarDias(HOY_FLOTA, 400) },
      tarjetaCirculacion: { numero: "TC-D2K560-19", vencimiento: sumarDias(HOY_FLOTA, 25) },
    },
  },
  {
    // Unidad sin ninguna alerta activa: para probar el indicador "sin alertas" en /panel/flota.
    placa: "F5R-284",
    modelo: "Runacar Wayra EX",
    capacidad: 42,
    tipoServicio: "ejecutivo",
    kilometrajeAcumulado: 40_000,
    umbralKilometraje: 180_000,
    documentos: {
      soat: { numero: "SOAT-F5R284-26", vencimiento: sumarDias(HOY_FLOTA, 90) },
      revisionTecnica: { numero: "RT-F5R284-26", vencimiento: sumarDias(HOY_FLOTA, 180) },
      tarjetaCirculacion: { numero: "TC-F5R284-20", vencimiento: sumarDias(HOY_FLOTA, 180) },
    },
  },
];

export const UMBRAL_HORAS_CONDUCCION_DEFAULT = 48;

export const CONDUCTORES_FLOTA: Conductor[] = [
  {
    id: "cond-1",
    nombre: "Manuel Torres Quispe",
    licencia: "A-IIIb 74812345",
    vencimientoLicencia: sumarDias(HOY_FLOTA, 45),
    horasConduccionAcumuladas: 52,
  },
  {
    id: "cond-2",
    nombre: "Wilfredo Salazar Mamani",
    licencia: "A-IIIb 68231190",
    vencimientoLicencia: sumarDias(HOY_FLOTA, 6),
    horasConduccionAcumuladas: 30,
  },
  {
    id: "cond-3",
    nombre: "Julio Cárdenas Rojas",
    licencia: "A-IIIb 71234567",
    vencimientoLicencia: sumarDias(HOY_FLOTA, -15),
    horasConduccionAcumuladas: 20,
  },
  {
    id: "cond-4",
    nombre: "Segundo Huamán Ccoyllo",
    licencia: "A-IIIb 60345678",
    vencimientoLicencia: sumarDias(HOY_FLOTA, 300),
    horasConduccionAcumuladas: 15,
  },
  {
    id: "cond-5",
    nombre: "Fortunato Vilca Cusi",
    licencia: "A-IIIb 65456789",
    vencimientoLicencia: sumarDias(HOY_FLOTA, 29),
    horasConduccionAcumuladas: 40,
  },
];

export function buscarUnidad(placa: string): Unidad | null {
  return UNIDADES.find((unidad) => unidad.placa === placa) ?? null;
}

export function buscarConductor(id: string): Conductor | null {
  return CONDUCTORES_FLOTA.find((conductor) => conductor.id === id) ?? null;
}

/**
 * Escalonamiento (D-0xx en docs/DECISIONES.md): 30/15/7 días antes del
 * vencimiento, con un cuarto estado para documentos ya vencidos. Solo usa
 * los 3 tokens semánticos del skill (info/warning/error) + "vencido", que
 * reutiliza navy sólido igual que "completado" en components/ui/Badge.tsx —
 * no se inventa una escala de color nueva.
 */
export type UrgenciaAlerta = "info" | "warning" | "error" | "vencido";

export function nivelAlertaDocumento(dias: number): UrgenciaAlerta | null {
  if (dias <= 0) return "vencido";
  if (dias <= 7) return "error";
  if (dias <= 15) return "warning";
  if (dias <= 30) return "info";
  return null;
}

const RANGO_URGENCIA: Record<UrgenciaAlerta, number> = {
  vencido: 4,
  error: 3,
  warning: 2,
  info: 1,
};

export function ordenarPorUrgencia(alertas: Alerta[]): Alerta[] {
  return [...alertas].sort((a, b) => RANGO_URGENCIA[b.urgencia] - RANGO_URGENCIA[a.urgencia]);
}

export type TipoAlerta = "documento" | "kilometraje" | "horas-conduccion";

export type EntidadAlerta = { tipo: "unidad"; placa: string } | { tipo: "conductor"; id: string };

/**
 * El histórico (emitidas + atendidas) es el punto de esta versión: modelado
 * desde el inicio con lo que pide el prompt (tipo, unidad o conductor, fecha
 * de emisión, fecha de atención, responsable, nota) para poder evolucionar a
 * mantenimiento preventivo real después, sin rehacer esta tabla.
 */
export interface Alerta {
  id: string;
  tipo: TipoAlerta;
  urgencia: UrgenciaAlerta;
  entidad: EntidadAlerta;
  descripcion: string;
  fechaEmision: Date;
  estado: "activa" | "atendida";
  fechaAtencion?: Date;
  responsableAtencion?: string;
  notaAtencion?: string;
}

function descripcionVencimiento(sujeto: string, dias: number): string {
  if (dias <= 0) {
    const vencidoHace = Math.abs(dias);
    return `${sujeto} vencido hace ${vencidoHace} día${vencidoHace === 1 ? "" : "s"}.`;
  }
  return `${sujeto} vence en ${dias} día${dias === 1 ? "" : "s"}.`;
}

/** Día en que ese nivel de alerta empezó a regir (30/15/7 días antes del vencimiento; el día mismo si ya venció). */
function fechaEmisionDocumento(vencimiento: Date, urgencia: UrgenciaAlerta): Date {
  const diasAntes = urgencia === "vencido" ? 0 : urgencia === "error" ? 7 : urgencia === "warning" ? 15 : 30;
  return sumarDias(vencimiento, -diasAntes);
}

const NOMBRES_DOCUMENTO: Record<keyof DocumentosUnidad, string> = {
  soat: "SOAT",
  revisionTecnica: "Revisión técnica",
  tarjetaCirculacion: "Tarjeta de circulación",
};

function alertasDocumentosUnidad(unidad: Unidad, hoy: Date): Alerta[] {
  const claves = Object.keys(unidad.documentos) as (keyof DocumentosUnidad)[];
  const alertas: Alerta[] = [];
  for (const clave of claves) {
    const documento = unidad.documentos[clave];
    const dias = diasRestantes(documento.vencimiento, hoy);
    const urgencia = nivelAlertaDocumento(dias);
    if (!urgencia) continue;
    const nombre = NOMBRES_DOCUMENTO[clave];
    alertas.push({
      id: `doc-${unidad.placa}-${clave}`,
      tipo: "documento",
      urgencia,
      entidad: { tipo: "unidad", placa: unidad.placa },
      descripcion: `${nombre} de ${unidad.placa}: ${descripcionVencimiento(nombre, dias)}`,
      fechaEmision: fechaEmisionDocumento(documento.vencimiento, urgencia),
      estado: "activa",
    });
  }
  return alertas;
}

function alertaKilometraje(unidad: Unidad, hoy: Date): Alerta | null {
  if (unidad.kilometrajeAcumulado < unidad.umbralKilometraje) return null;
  return {
    id: `km-${unidad.placa}`,
    tipo: "kilometraje",
    urgencia: "warning",
    entidad: { tipo: "unidad", placa: unidad.placa },
    descripcion: `${unidad.placa}: kilometraje acumulado (${unidad.kilometrajeAcumulado.toLocaleString("es-PE")} km) superó el umbral de mantenimiento (${unidad.umbralKilometraje.toLocaleString("es-PE")} km).`,
    fechaEmision: hoy,
    estado: "activa",
  };
}

function alertaLicenciaConductor(conductor: Conductor, hoy: Date): Alerta | null {
  const dias = diasRestantes(conductor.vencimientoLicencia, hoy);
  const urgencia = nivelAlertaDocumento(dias);
  if (!urgencia) return null;
  return {
    id: `licencia-${conductor.id}`,
    tipo: "documento",
    urgencia,
    entidad: { tipo: "conductor", id: conductor.id },
    descripcion: `Licencia de conducir de ${conductor.nombre}: ${descripcionVencimiento("La licencia", dias)}`,
    fechaEmision: fechaEmisionDocumento(conductor.vencimientoLicencia, urgencia),
    estado: "activa",
  };
}

function alertaHorasConduccion(conductor: Conductor, umbralHoras: number, hoy: Date): Alerta | null {
  if (conductor.horasConduccionAcumuladas < umbralHoras) return null;
  return {
    id: `horas-${conductor.id}`,
    tipo: "horas-conduccion",
    urgencia: "warning",
    entidad: { tipo: "conductor", id: conductor.id },
    descripcion: `${conductor.nombre}: ${conductor.horasConduccionAcumuladas} h de conducción acumuladas superan el límite de ${umbralHoras} h.`,
    fechaEmision: hoy,
    estado: "activa",
  };
}

/**
 * Recalcula las alertas activas a partir del estado actual de unidades y
 * conductores. Determinístico y sin estado propio: cada pantalla (flota,
 * conductores, bandeja de alertas) la llama con sus propios umbrales
 * editados en sesión — igual que /panel/precios, donde editar un factor solo
 * cambia lo que ve esa pantalla, no un backend compartido.
 */
export function generarAlertasActivas(
  unidades: Unidad[] = UNIDADES,
  conductores: Conductor[] = CONDUCTORES_FLOTA,
  umbralHorasConduccion: number = UMBRAL_HORAS_CONDUCCION_DEFAULT,
  hoy: Date = HOY_FLOTA,
): Alerta[] {
  const alertas: Alerta[] = [];
  for (const unidad of unidades) {
    alertas.push(...alertasDocumentosUnidad(unidad, hoy));
    const km = alertaKilometraje(unidad, hoy);
    if (km) alertas.push(km);
  }
  for (const conductor of conductores) {
    const licencia = alertaLicenciaConductor(conductor, hoy);
    if (licencia) alertas.push(licencia);
    const horas = alertaHorasConduccion(conductor, umbralHorasConduccion, hoy);
    if (horas) alertas.push(horas);
  }
  return alertas;
}

// Histórico ya atendido (ciclos anteriores, no relacionados a las alertas
// activas de arriba): demuestra que el histórico acumula entre ciclos, no
// solo lo que está activo hoy. Responsable "Carlos Mendoza Ruiz" porque es
// quien figura como sesión de personal en lib/mock/sesion.ts (USUARIO_MOCK).
export const HISTORIAL_ATENDIDO_SEED: Alerta[] = [
  {
    id: "hist-1",
    tipo: "documento",
    urgencia: "error",
    entidad: { tipo: "unidad", placa: "AGX-921" },
    descripcion: "Revisión técnica de AGX-921: venció y fue renovada a tiempo.",
    fechaEmision: sumarDias(HOY_FLOTA, -95),
    estado: "atendida",
    fechaAtencion: sumarDias(HOY_FLOTA, -90),
    responsableAtencion: "Carlos Mendoza Ruiz",
    notaAtencion: "Se coordinó con el taller y se renovó el documento antes de la fecha límite.",
  },
  {
    id: "hist-2",
    tipo: "horas-conduccion",
    urgencia: "warning",
    entidad: { tipo: "conductor", id: "cond-3" },
    descripcion: "Julio Cárdenas Rojas superó el límite de horas de conducción acumuladas.",
    fechaEmision: sumarDias(HOY_FLOTA, -20),
    estado: "atendida",
    fechaAtencion: sumarDias(HOY_FLOTA, -18),
    responsableAtencion: "Carlos Mendoza Ruiz",
    notaAtencion: "Se le asignó una ruta más corta la semana siguiente para bajar sus horas acumuladas.",
  },
  {
    id: "hist-3",
    tipo: "kilometraje",
    urgencia: "warning",
    entidad: { tipo: "unidad", placa: "D2K-560" },
    descripcion: "D2K-560 superó el umbral de kilometraje vigente en ese momento.",
    fechaEmision: sumarDias(HOY_FLOTA, -60),
    estado: "atendida",
    fechaAtencion: sumarDias(HOY_FLOTA, -55),
    responsableAtencion: "Carlos Mendoza Ruiz",
    notaAtencion: "Mantenimiento preventivo realizado en el taller de Huancayo.",
  },
];

export function alertasDeUnidad(placa: string, alertas: Alerta[]): Alerta[] {
  return alertas.filter((alerta) => alerta.entidad.tipo === "unidad" && alerta.entidad.placa === placa);
}

export function alertasDeConductor(id: string, alertas: Alerta[]): Alerta[] {
  return alertas.filter((alerta) => alerta.entidad.tipo === "conductor" && alerta.entidad.id === id);
}
