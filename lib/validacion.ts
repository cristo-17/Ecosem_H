/** Reglas compartidas por formularios y Server Actions. Sin dependencias del navegador. */
export const LARGO_MINIMO_CONTRASENA = 8;
export const REGEX_CORREO = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// Las marcas combinantes permiten alfabetos que las necesitan (p. ej., devanagari).
// Cada palabra comienza por una letra; los separadores solo se admiten entre palabras.
const REGEX_NOMBRE = /^\p{L}[\p{L}\p{M}]*(?:[ '’\-]\p{L}[\p{L}\p{M}]*)*$/u;

export const MENSAJES_VALIDACION = {
  obligatorio: "Este campo es obligatorio",
  nombre: "El nombre solo debe contener letras",
  correo: "Ingresa un correo electrónico válido",
  contrasena: `La contraseña debe tener al menos ${LARGO_MINIMO_CONTRASENA} caracteres`,
  contrasenaLarga: "La contraseña debe tener como máximo 72 caracteres",
} as const;

export function validarNombre(valor: unknown, maximo = Infinity): string | undefined {
  const nombre = typeof valor === "string" ? valor.trim().normalize("NFC") : "";
  if (!nombre) return MENSAJES_VALIDACION.obligatorio;
  if (!REGEX_NOMBRE.test(nombre)) return MENSAJES_VALIDACION.nombre;
  if (nombre.length > maximo) return `Máximo ${maximo} caracteres`;
}

export function validarCorreo(valor: unknown, obligatorio = true): string | undefined {
  const correo = typeof valor === "string" ? valor.trim() : "";
  if (!correo) return obligatorio ? MENSAJES_VALIDACION.obligatorio : undefined;
  if (correo.length > 254 || !REGEX_CORREO.test(correo)) return MENSAJES_VALIDACION.correo;
}

/** No recortar la contraseña: los espacios también forman parte de ella. */
export function validarContrasena(valor: unknown): string | undefined {
  if (typeof valor !== "string" || valor.length < LARGO_MINIMO_CONTRASENA) return MENSAJES_VALIDACION.contrasena;
  if (valor.length > 72) return MENSAJES_VALIDACION.contrasenaLarga;
}
