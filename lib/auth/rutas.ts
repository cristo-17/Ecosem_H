/** Solo rutas internas: evita usar el ingreso como redirección abierta. */
export function rutaInterna(siguiente: unknown, porDefecto: string): string {
  return typeof siguiente === "string" &&
    siguiente.startsWith("/") &&
    !siguiente.startsWith("//") &&
    !siguiente.startsWith("/\\")
    ? siguiente
    : porDefecto;
}
