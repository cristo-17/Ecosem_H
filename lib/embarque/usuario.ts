let usuario: string | null = null;
let generacion = 0;
export const CANAL_CIERRE_EMBARQUE = "ecosem-embarque:cerrar-sesion";

/** Conserva IndexedDB; bloquea los consumidores activos de esta sesión. */
export function cerrarDatosEmbarque() {
  seleccionarUsuarioEmbarque(null);
  window.dispatchEvent(new Event(CANAL_CIERRE_EMBARQUE));
  if (typeof BroadcastChannel !== "undefined") {
    const canal = new BroadcastChannel(CANAL_CIERRE_EMBARQUE);
    canal.postMessage("cerrar");
    canal.close();
  } else {
    // Safari anterior a BroadcastChannel: solo señal de cierre, sin pasajeros.
    localStorage.setItem(CANAL_CIERRE_EMBARQUE, crypto.randomUUID());
  }
}

export function seleccionarUsuarioEmbarque(id: string | null) {
  usuario = id;
  generacion++;
}

/** También invalida respuestas de red iniciadas antes de cambiar de sesión. */
export function contextoEmbarque() {
  if (!usuario) throw new Error("No hay una sesión de embarque activa");
  const actual = generacion;
  const id = usuario;
  return {
    id,
    clave: `${id}:${actual}`,
    comprobar() {
      if (actual !== generacion || id !== usuario) throw new Error("La sesión de embarque cambió");
    },
  };
}
