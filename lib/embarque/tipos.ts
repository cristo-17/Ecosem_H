/**
 * Formas de datos de la PWA de embarque (docs/prompts/10-pwa-embarque.md).
 * Todo lo que vive acá se guarda en IndexedDB (lib/embarque/db.ts), no en
 * memoria: el celular en el andén puede recargar la página, perder señal o
 * quedarse sin batería y volver a abrir la app sin perder el manifiesto ni
 * los escaneos ya hechos.
 */

export interface PasajeroEmbarque {
  codigoBoleto: string;
  asiento: string;
  apellidos: string;
  nombres: string;
  destino: string;
}

/** Manifiesto descargado de un viaje, guardado localmente para operar sin conexión. */
export interface ManifiestoLocal {
  viajeId: string;
  origen: string;
  destino: string;
  fechaSalida: Date;
  placaBus: string;
  conductores: string[];
  pasajeros: PasajeroEmbarque[];
  descargadoEn: Date;
}

export type ResultadoEscaneo =
  | { tipo: "valido"; pasajero: PasajeroEmbarque }
  | { tipo: "ya-embarcado"; pasajero: PasajeroEmbarque; horaPrimerEscaneo: Date }
  | { tipo: "invalido"; motivo: string };

/**
 * Un embarque ya confirmado (resultado "valido"), pendiente o no de
 * sincronizar. Clave natural `[viajeId, codigoBoleto]` en IndexedDB (ver
 * lib/embarque/db.ts) — un mismo pasajero no puede quedar embarcado dos
 * veces en el mismo viaje, así que no hace falta un id autoincremental
 * aparte.
 */
export interface RegistroEscaneo {
  viajeId: string;
  codigoBoleto: string;
  horaEscaneo: Date;
  sincronizado: boolean;
}
