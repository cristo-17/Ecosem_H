/**
 * Helpers de dibujo compartidos por los generadores de PDF (boleto y
 * manifiesto — docs/prompts/09-manifiesto-sutran.md pide reusarlos en vez
 * de duplicar el layout). Cada helper trabaja en términos de `ctx.margen` /
 * `ctx.anchoContenido`, no de un tamaño de página fijo: el boleto es A4
 * vertical y el manifiesto es A4 horizontal, así que no hay una sola
 * geometría que asumir acá.
 */
import type { PDFDocument, PDFFont, PDFPage, RGB } from "pdf-lib";
import { rgb } from "pdf-lib";

/**
 * pdf-lib no trae IBM Plex Sans: sus 14 fuentes estándar son Helvetica,
 * Times, Courier (+ negrita/cursiva). Incrustar una fuente TTF propia pide
 * @pdf-lib/fontkit más el archivo de la fuente — de más para estos
 * documentos, así que se usa Helvetica (alternativa sans legible) tal como
 * autoriza el prompt 03. Anotado también en docs/DECISIONES.md.
 */
export const NOTA_FUENTE = "Helvetica (IBM Plex Sans no disponible en el generador de PDF)";

export const COLOR_NAVY: RGB = rgb(16 / 255, 35 / 255, 63 / 255);
export const COLOR_PRIMARY: RGB = rgb(200 / 255, 16 / 255, 46 / 255);
export const COLOR_TEXT_SECONDARY: RGB = rgb(90 / 255, 102 / 255, 114 / 255);
export const COLOR_BORDER: RGB = rgb(220 / 255, 224 / 255, 230 / 255);
export const COLOR_WHITE: RGB = rgb(1, 1, 1);
/** Gris muy claro para zebra-striping de tablas: legible impreso en blanco y negro. */
export const COLOR_FILA_ALTERNA: RGB = rgb(0.96, 0.965, 0.97);

export const ANCHO_A4 = 595.28;
export const ALTO_A4 = 841.89;

export interface Contexto {
  page: PDFPage;
  regular: PDFFont;
  bold: PDFFont;
  /** Posición vertical actual (desde abajo). Baja a medida que se dibuja. */
  y: number;
  /** Margen izquierdo/derecho de la página actual. */
  margen: number;
  /** Ancho útil de contenido = ancho de página − 2×margen. */
  anchoContenido: number;
}

export function dibujarTexto(
  ctx: Contexto,
  texto: string,
  opciones: { x?: number; tamano?: number; negrita?: boolean; color?: RGB } = {},
): void {
  const { x = ctx.margen, tamano = 10, negrita = false, color = COLOR_NAVY } = opciones;
  ctx.page.drawText(texto, {
    x,
    y: ctx.y,
    size: tamano,
    font: negrita ? ctx.bold : ctx.regular,
    color,
  });
}

export function anchoTexto(font: PDFFont, texto: string, tamano: number): number {
  return font.widthOfTextAtSize(texto, tamano);
}

export function dibujarTextoCentrado(
  ctx: Contexto,
  texto: string,
  opciones: { tamano?: number; negrita?: boolean; color?: RGB; espaciado?: number } = {},
): void {
  const { tamano = 10, negrita = false, color = COLOR_NAVY, espaciado = 0 } = opciones;
  const font = negrita ? ctx.bold : ctx.regular;

  if (espaciado === 0) {
    const x = ctx.margen + (ctx.anchoContenido - anchoTexto(font, texto, tamano)) / 2;
    ctx.page.drawText(texto, { x, y: ctx.y, size: tamano, font, color });
    return;
  }

  // pdf-lib no expone letter-spacing en drawText ni aplica kerning entre
  // pares (cada carácter se coloca por su ancho de avance nomás): en
  // "ECH-4B7C12" a 26pt eso hace que el dígito después del guion se vea
  // pegado. Se dibuja carácter por carácter con un espaciado uniforme —no
  // solo alrededor del guion— para que no se rompa con otro código que no
  // tenga un dígito justo ahí.
  const caracteres = [...texto];
  const anchoTotal =
    caracteres.reduce((suma, caracter) => suma + anchoTexto(font, caracter, tamano), 0) +
    espaciado * (caracteres.length - 1);
  let x = ctx.margen + (ctx.anchoContenido - anchoTotal) / 2;
  for (const caracter of caracteres) {
    ctx.page.drawText(caracter, { x, y: ctx.y, size: tamano, font, color });
    x += anchoTexto(font, caracter, tamano) + espaciado;
  }
}

export function dibujarTextoDerecha(
  ctx: Contexto,
  texto: string,
  opciones: { tamano?: number; negrita?: boolean; color?: RGB } = {},
): void {
  const { tamano = 10, negrita = false, color = COLOR_NAVY } = opciones;
  const font = negrita ? ctx.bold : ctx.regular;
  const x = ctx.margen + ctx.anchoContenido - anchoTexto(font, texto, tamano);
  ctx.page.drawText(texto, { x, y: ctx.y, size: tamano, font, color });
}

export function dibujarLineaDivisoria(ctx: Contexto): void {
  ctx.page.drawLine({
    start: { x: ctx.margen, y: ctx.y },
    end: { x: ctx.margen + ctx.anchoContenido, y: ctx.y },
    thickness: 0.75,
    color: COLOR_BORDER,
  });
}

export function dibujarEncabezadoSeccion(ctx: Contexto, titulo: string): void {
  dibujarTexto(ctx, titulo.toUpperCase(), { tamano: 9, negrita: true, color: COLOR_TEXT_SECONDARY });
  ctx.y -= 14;
  dibujarLineaDivisoria(ctx);
  ctx.y -= 16;
}

export async function cargarImagen(pdfDoc: PDFDocument, ruta: string) {
  const respuesta = await fetch(ruta);
  const bytes = await respuesta.arrayBuffer();
  return pdfDoc.embedPng(bytes);
}
