import fs from "node:fs";

/**
 * Lee el ancho/alto real de un PNG o JPEG desde sus cabeceras, sin decodificar
 * los píxeles. Solo para Server Components (usa `node:fs`).
 *
 * Por qué a mano y no una librería: la única necesidad es esta (mostrar cada
 * foto de /nosotros a su tamaño real, nunca escalada hacia arriba — ver
 * docs/DECISIONES.md). Node ya trae todo lo necesario para leer un puñado de
 * bytes fijos de la cabecera; un `import` estático de la imagen no sirve
 * porque estos archivos pueden no existir todavía (ver
 * public/images/nosotros/README.md) y un import estático rompe el build si
 * falta el archivo, en vez de caer al placeholder como ya hace
 * `archivoExiste()`. `image-size` (paquete dedicado) es zero-dependency y
 * más robusto para JPEG progresivo o EXIF con orientación, pero decodifica
 * ~10 formatos que acá no hacen falta (solo se suben .jpg/.png); se deja
 * anotado como alternativa si algún archivo real rompe este parser.
 *
 * Detecta el formato por firma de bytes, no por extensión: ya hubo un
 * archivo `.jpg` que en realidad era un PNG (ver F-001 en docs/FALLOS.md).
 *
 * Limitación conocida: no lee el tag EXIF de orientación. Si una foto viene
 * rotada 90°/270° por metadata (en vez de por los píxeles), el ancho/alto
 * que devuelve esta función queda intercambiado respecto a cómo el
 * navegador la termina mostrando.
 */
export interface DimensionesImagen {
  width: number;
  height: number;
}

const FIRMA_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function leerPng(buffer: Buffer): DimensionesImagen | null {
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(FIRMA_PNG)) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

// Marcadores JPEG con SOF (Start Of Frame) que llevan ancho/alto: C0-CF
// salvo C4 (DHT), C8 (JPG, reservado) y CC (DAC).
const MARCADORES_SOF = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);
// Marcadores sin segmento de longitud (no llevan bytes de datos detrás).
const MARCADORES_SIN_LONGITUD = new Set([0xd8, 0x01, 0xd0, 0xd1, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7]);

function leerJpeg(buffer: Buffer): DimensionesImagen | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  let posicion = 2;
  while (posicion + 4 <= buffer.length) {
    if (buffer[posicion] !== 0xff) {
      posicion += 1;
      continue;
    }
    const marcador = buffer[posicion + 1];
    if (marcador === 0xd9) return null; // EOI: se acabó el archivo sin encontrar SOF.
    if (MARCADORES_SIN_LONGITUD.has(marcador)) {
      posicion += 2;
      continue;
    }
    const longitud = buffer.readUInt16BE(posicion + 2);
    if (MARCADORES_SOF.has(marcador)) {
      if (posicion + 9 > buffer.length) return null;
      return { height: buffer.readUInt16BE(posicion + 5), width: buffer.readUInt16BE(posicion + 7) };
    }
    posicion += 2 + longitud;
  }
  return null;
}

/** null si el archivo no existe o no se pudo leer como PNG/JPEG. */
export function leerDimensionesImagen(rutaAbsoluta: string): DimensionesImagen | null {
  let buffer: Buffer;
  try {
    buffer = fs.readFileSync(rutaAbsoluta);
  } catch {
    return null;
  }
  return leerPng(buffer) ?? leerJpeg(buffer);
}
