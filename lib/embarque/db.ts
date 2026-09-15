/**
 * Almacenamiento local de la PWA de embarque, en IndexedDB — NO
 * localStorage. Es la excepción justificada de CLAUDE.md: la regla del
 * proyecto prohíbe `localStorage` para el estado de la reserva (dato
 * transaccional que vive en el servidor); acá el almacenamiento offline es
 * el requisito mismo de la regla 4 ("la app valida localmente y sincroniza
 * después"), no un atajo — ver D-0xx en docs/DECISIONES.md. IndexedDB en vez
 * de `localStorage` también porque el manifiesto de un bus lleno (~56
 * pasajeros con sus datos) y el registro de escaneos son datos
 * estructurados, no un puñado de strings.
 */
import type { ManifiestoLocal, RegistroEscaneo } from "@/lib/embarque/tipos";

const NOMBRE_DB = "ecosem-embarque";
const VERSION_DB = 1;
const ALMACEN_MANIFIESTOS = "manifiestos";
const ALMACEN_ESCANEOS = "escaneos";

function abrirDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const solicitud = indexedDB.open(NOMBRE_DB, VERSION_DB);

    solicitud.onupgradeneeded = () => {
      const db = solicitud.result;
      if (!db.objectStoreNames.contains(ALMACEN_MANIFIESTOS)) {
        db.createObjectStore(ALMACEN_MANIFIESTOS, { keyPath: "viajeId" });
      }
      if (!db.objectStoreNames.contains(ALMACEN_ESCANEOS)) {
        // Clave compuesta: un pasajero no puede quedar embarcado dos veces
        // en el mismo viaje, así que la clave ya garantiza esa unicidad.
        db.createObjectStore(ALMACEN_ESCANEOS, { keyPath: ["viajeId", "codigoBoleto"] });
      }
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

export async function guardarManifiesto(manifiesto: ManifiestoLocal): Promise<void> {
  const db = await abrirDb();
  const tx = db.transaction(ALMACEN_MANIFIESTOS, "readwrite");
  tx.objectStore(ALMACEN_MANIFIESTOS).put(manifiesto);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function obtenerManifiesto(viajeId: string): Promise<ManifiestoLocal | null> {
  const db = await abrirDb();
  const tx = db.transaction(ALMACEN_MANIFIESTOS, "readonly");
  const resultado = await pedido(tx.objectStore(ALMACEN_MANIFIESTOS).get(viajeId));
  db.close();
  return (resultado as ManifiestoLocal | undefined) ?? null;
}

export async function listarManifiestosDescargados(): Promise<ManifiestoLocal[]> {
  const db = await abrirDb();
  const tx = db.transaction(ALMACEN_MANIFIESTOS, "readonly");
  const resultado = await pedido(tx.objectStore(ALMACEN_MANIFIESTOS).getAll());
  db.close();
  return resultado as ManifiestoLocal[];
}

export async function buscarEscaneo(
  viajeId: string,
  codigoBoleto: string,
): Promise<RegistroEscaneo | null> {
  const db = await abrirDb();
  const tx = db.transaction(ALMACEN_ESCANEOS, "readonly");
  const resultado = await pedido(tx.objectStore(ALMACEN_ESCANEOS).get([viajeId, codigoBoleto]));
  db.close();
  return (resultado as RegistroEscaneo | undefined) ?? null;
}

export async function registrarEscaneo(registro: RegistroEscaneo): Promise<void> {
  const db = await abrirDb();
  const tx = db.transaction(ALMACEN_ESCANEOS, "readwrite");
  // add() (no put): si ya existiera esa clave, es un intento de doble
  // embarque que debió detectarse antes con buscarEscaneo() — mejor que
  // truene acá a que un put() lo pise en silencio.
  tx.objectStore(ALMACEN_ESCANEOS).add(registro);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function contarEscaneos(viajeId: string): Promise<number> {
  const db = await abrirDb();
  const tx = db.transaction(ALMACEN_ESCANEOS, "readonly");
  const todos = (await pedido(tx.objectStore(ALMACEN_ESCANEOS).getAll())) as RegistroEscaneo[];
  db.close();
  return todos.filter((registro) => registro.viajeId === viajeId).length;
}

export async function listarEscaneosDeViaje(viajeId: string): Promise<RegistroEscaneo[]> {
  const db = await abrirDb();
  const tx = db.transaction(ALMACEN_ESCANEOS, "readonly");
  const todos = (await pedido(tx.objectStore(ALMACEN_ESCANEOS).getAll())) as RegistroEscaneo[];
  db.close();
  return todos.filter((registro) => registro.viajeId === viajeId);
}

export async function listarPendientesSincronizar(): Promise<RegistroEscaneo[]> {
  const db = await abrirDb();
  const tx = db.transaction(ALMACEN_ESCANEOS, "readonly");
  const todos = (await pedido(tx.objectStore(ALMACEN_ESCANEOS).getAll())) as RegistroEscaneo[];
  db.close();
  return todos.filter((registro) => !registro.sincronizado);
}

export async function marcarSincronizados(claves: Array<[string, string]>): Promise<void> {
  if (claves.length === 0) return;
  const db = await abrirDb();
  const tx = db.transaction(ALMACEN_ESCANEOS, "readwrite");
  const almacen = tx.objectStore(ALMACEN_ESCANEOS);
  for (const clave of claves) {
    const registro = (await pedido(almacen.get(clave))) as RegistroEscaneo | undefined;
    if (registro) almacen.put({ ...registro, sincronizado: true });
  }
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
