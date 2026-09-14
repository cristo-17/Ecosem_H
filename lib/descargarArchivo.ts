/** Dispara la descarga de un archivo ya generado en memoria. Cliente únicamente. */
export function descargarArchivo(nombreArchivo: string, bytes: Uint8Array, tipoMime: string): void {
  // Copia a un ArrayBuffer concreto: pdf-lib tipa su salida como
  // Uint8Array<ArrayBufferLike> (podría ser SharedArrayBuffer), y Blob solo
  // acepta ArrayBufferView<ArrayBuffer>.
  const copia = new Uint8Array(bytes);
  const blob = new Blob([copia], { type: tipoMime });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
