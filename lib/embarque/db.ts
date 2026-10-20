/**
 * Almacenamiento local de la app de embarque, en IndexedDB (no localStorage):
 * es la excepción justificada de CLAUDE.md (D-024). Sin señal en la carretera,
 * el paquete del viaje y los escaneos tienen que sobrevivir a una recarga, a la
 * falta de batería y a horas sin conexión. Nada de esto es dato personal: el
 * paquete y el QR traen asientos, códigos de compra y claves públicas.
 *
 * Versión 2: la versión 1 era la del mock (manifiesto con nombres, firma HMAC).
 * Al abrirla se borran sus almacenes: esos datos no sirven con el QR real.
 */
import type { PaqueteEmbarque, RespuestaSincronizacion, ViajesOperacion } from "./contrato";
import type { MotivoRechazoLocal } from "./decidir";

const NOMBRE_DB = "ecosem-embarque";
const VERSION_DB = 2;
const PAQUETES = "paquetes";
const ESCANEOS = "escaneos";

/** El paquete del viaje y lo que la pantalla necesita mostrar sin red. */
export interface ViajeDescargado {
  tripId: string;
  paquete: PaqueteEmbarque;
  /** Del listado de operación al descargar: ruta, bus y vendidos. */
  viaje: ViajesOperacion["trips"][number];
  origen: string;
  destino: string;
  descargadoEn: string;
}

export interface EscaneoLocal {
  /** Lo genera el dispositivo y no cambia: reenviarlo al servidor no duplica. */
  scanId: string;
  tripId: string;
  /** Solo si tenía la forma de un boleto: un QR cualquiera no se guarda ni se envía. */
  qr: string | null;
  purchaseCode: string | null;
  seat: string | null;
  scannedAt: string;
  local: "embarcado" | "ya-embarcado" | "rechazado";
  motivo: MotivoRechazoLocal | null;
  sincronizado: boolean;
  /** Lo que decidió el servidor al sincronizar. Manda sobre lo local. */
  servidor: Omit<RespuestaSincronizacion["results"][number], "scanId"> | null;
}

function abrirDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const solicitud = indexedDB.open(NOMBRE_DB, VERSION_DB);
    solicitud.onupgradeneeded = () => {
      const db = solicitud.result;
      for (const viejo of ["manifiestos", "escaneos"]) {
        if (db.objectStoreNames.contains(viejo)) db.deleteObjectStore(viejo);
      }
      db.createObjectStore(PAQUETES, { keyPath: "tripId" });
      const escaneos = db.createObjectStore(ESCANEOS, { keyPath: "scanId" });
      escaneos.createIndex("tripId", "tripId");
    };
    solicitud.onsuccess = () => resolve(solicitud.result);
    solicitud.onerror = () => reject(solicitud.error);
  });
}

function pedido<T>(solicitud: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    solicitud.onsuccess = () => resolve(solicitud.result);
    solicitud.onerror = () => reject(solicitud.error);
  });
}

async function conAlmacen<T>(
  nombre: string,
  modo: IDBTransactionMode,
  fn: (almacen: IDBObjectStore) => Promise<T>,
): Promise<T> {
  const db = await abrirDb();
  try {
    const tx = db.transaction(nombre, modo);
    // Se engancha antes de operar: si no, la transacción podría terminar
    // antes de escuchar y la promesa no se resolvería nunca.
    const terminada = new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    const resultado = await fn(tx.objectStore(nombre));
    await terminada;
    return resultado;
  } finally {
    db.close();
  }
}

export const guardarViaje = (viaje: ViajeDescargado) =>
  conAlmacen(PAQUETES, "readwrite", async (a) => void (await pedido(a.put(viaje))));

export const obtenerViaje = (tripId: string) =>
  conAlmacen(PAQUETES, "readonly", async (a) => ((await pedido(a.get(tripId))) as ViajeDescargado | undefined) ?? null);

export const listarViajesDescargados = () =>
  conAlmacen(PAQUETES, "readonly", async (a) => (await pedido(a.getAll())) as ViajeDescargado[]);

export const guardarEscaneo = (escaneo: EscaneoLocal) =>
  conAlmacen(ESCANEOS, "readwrite", async (a) => void (await pedido(a.put(escaneo))));

export const escaneosDeViaje = (tripId: string) =>
  conAlmacen(ESCANEOS, "readonly", async (a) =>
    ((await pedido(a.index("tripId").getAll(tripId))) as EscaneoLocal[]).sort((x, y) =>
      x.scannedAt.localeCompare(y.scannedAt),
    ),
  );

export const escaneosPendientes = () =>
  conAlmacen(ESCANEOS, "readonly", async (a) =>
    ((await pedido(a.getAll())) as EscaneoLocal[]).filter((e) => !e.sincronizado),
  );

/** Guarda lo que respondió el servidor, escaneo por escaneo. */
export const aplicarRespuesta = (respuesta: RespuestaSincronizacion) =>
  conAlmacen(ESCANEOS, "readwrite", async (a) => {
    for (const { scanId, ...servidor } of respuesta.results) {
      const escaneo = (await pedido(a.get(scanId))) as EscaneoLocal | undefined;
      if (escaneo) await pedido(a.put({ ...escaneo, sincronizado: true, servidor }));
    }
  });
