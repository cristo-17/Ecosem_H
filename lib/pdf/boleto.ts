import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { PDFFont, PDFPage, RGB } from "pdf-lib";
import QRCode from "qrcode";
import { descargarArchivo } from "@/lib/descargarArchivo";
import { formatFechaLarga, formatHora12, formatPrecio } from "@/lib/format";

/**
 * pdf-lib no trae IBM Plex Sans: sus 14 fuentes estándar son Helvetica,
 * Times, Courier (+ negrita/cursiva). Incrustar una fuente TTF propia pide
 * @pdf-lib/fontkit más el archivo de la fuente — de más para un boleto de
 * texto, así que se usa Helvetica (alternativa sans legible) tal como
 * autoriza el prompt 03. Anotado también en docs/DECISIONES.md.
 */
const NOTA_FUENTE = "Helvetica (IBM Plex Sans no disponible en el generador de PDF)";

export interface PasajeroBoletoPdf {
  nombre: string;
  documentoEnmascarado: string;
}

export interface BoletoPdfData {
  codigo: string;
  emitidoEn: Date;
  origen: string;
  destino: string;
  terminalOrigen: string;
  terminalDestino: string;
  horaSalida: Date;
  tipoServicio: string;
  asientos: string[];
  pasajeros: PasajeroBoletoPdf[];
  totalSoles: number;
  comprobante:
    | { tipo: "boleta" }
    | { tipo: "factura"; ruc: string; razonSocial: string };
}

// Aislado en su propia función (pedido explícito del prompt): así, cuando
// exista backend y el QR deba llevar un identificador firmado (HMAC)
// validable sin conexión por la app de embarque, el cambio queda contenido
// acá — el layout del PDF no se toca.
export function generarContenidoQr(codigo: string): string {
  return `ECOSEMH:BOLETO:${codigo}`;
}

const COLOR_NAVY: RGB = rgb(16 / 255, 35 / 255, 63 / 255);
const COLOR_PRIMARY: RGB = rgb(200 / 255, 16 / 255, 46 / 255);
const COLOR_TEXT_SECONDARY: RGB = rgb(90 / 255, 102 / 255, 114 / 255);
const COLOR_BORDER: RGB = rgb(220 / 255, 224 / 255, 230 / 255);
const COLOR_WHITE: RGB = rgb(1, 1, 1);

const ANCHO_A4 = 595.28;
const ALTO_A4 = 841.89;
const MARGEN = 50;
const ANCHO_CONTENIDO = ANCHO_A4 - MARGEN * 2;

interface Contexto {
  page: PDFPage;
  regular: PDFFont;
  bold: PDFFont;
  /** Posición vertical actual (desde abajo). Baja a medida que se dibuja. */
  y: number;
}

function dibujarTexto(
  ctx: Contexto,
  texto: string,
  opciones: { x?: number; tamano?: number; negrita?: boolean; color?: RGB } = {},
): void {
  const { x = MARGEN, tamano = 10, negrita = false, color = COLOR_NAVY } = opciones;
  ctx.page.drawText(texto, {
    x,
    y: ctx.y,
    size: tamano,
    font: negrita ? ctx.bold : ctx.regular,
    color,
  });
}

function anchoTexto(font: PDFFont, texto: string, tamano: number): number {
  return font.widthOfTextAtSize(texto, tamano);
}

function dibujarTextoCentrado(
  ctx: Contexto,
  texto: string,
  opciones: { tamano?: number; negrita?: boolean; color?: RGB; espaciado?: number } = {},
): void {
  const { tamano = 10, negrita = false, color = COLOR_NAVY, espaciado = 0 } = opciones;
  const font = negrita ? ctx.bold : ctx.regular;

  if (espaciado === 0) {
    const x = MARGEN + (ANCHO_CONTENIDO - anchoTexto(font, texto, tamano)) / 2;
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
  let x = MARGEN + (ANCHO_CONTENIDO - anchoTotal) / 2;
  for (const caracter of caracteres) {
    ctx.page.drawText(caracter, { x, y: ctx.y, size: tamano, font, color });
    x += anchoTexto(font, caracter, tamano) + espaciado;
  }
}

function dibujarTextoDerecha(
  ctx: Contexto,
  texto: string,
  opciones: { tamano?: number; negrita?: boolean; color?: RGB } = {},
): void {
  const { tamano = 10, negrita = false, color = COLOR_NAVY } = opciones;
  const font = negrita ? ctx.bold : ctx.regular;
  const x = MARGEN + ANCHO_CONTENIDO - anchoTexto(font, texto, tamano);
  ctx.page.drawText(texto, { x, y: ctx.y, size: tamano, font, color });
}

function dibujarLineaDivisoria(ctx: Contexto): void {
  ctx.page.drawLine({
    start: { x: MARGEN, y: ctx.y },
    end: { x: MARGEN + ANCHO_CONTENIDO, y: ctx.y },
    thickness: 0.75,
    color: COLOR_BORDER,
  });
}

function dibujarEncabezadoSeccion(ctx: Contexto, titulo: string): void {
  dibujarTexto(ctx, titulo.toUpperCase(), { tamano: 9, negrita: true, color: COLOR_TEXT_SECONDARY });
  ctx.y -= 14;
  dibujarLineaDivisoria(ctx);
  ctx.y -= 16;
}

async function cargarImagen(pdfDoc: PDFDocument, ruta: string) {
  const respuesta = await fetch(ruta);
  const bytes = await respuesta.arrayBuffer();
  return pdfDoc.embedPng(bytes);
}

/** Construye el PDF de una página del boleto. No dispara la descarga. */
export async function generarBoletoPdf(datos: BoletoPdfData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Boleto ${datos.codigo}`);
  pdfDoc.setSubject(NOTA_FUENTE);

  const page = pdfDoc.addPage([ANCHO_A4, ALTO_A4]);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const [marca, wordmark] = await Promise.all([
    cargarImagen(pdfDoc, "/ecosemh-mark.png"),
    cargarImagen(pdfDoc, "/ecosemh-wordmark.png"),
  ]);

  const ctx: Contexto = { page, regular, bold, y: ALTO_A4 - MARGEN - 20 };

  // --- Cabecera: logotipo + razón social/RUC ---
  const altoMarca = 26;
  const anchoMarca = (altoMarca * marca.width) / marca.height;
  const altoWordmark = 18;
  const anchoWordmark = (altoWordmark * wordmark.width) / wordmark.height;
  page.drawImage(marca, { x: MARGEN, y: ctx.y - altoMarca + 4, width: anchoMarca, height: altoMarca });
  page.drawImage(wordmark, {
    x: MARGEN + anchoMarca + 8,
    y: ctx.y - altoWordmark + 4,
    width: anchoWordmark,
    height: altoWordmark,
  });

  dibujarTextoDerecha(ctx, "EMPCOSEM S.A.", { tamano: 9, negrita: true });
  ctx.y -= 12;
  // RUC real confirmado (ver docs/DECISIONES.md D-012, supersede D-011).
  dibujarTextoDerecha(ctx, "RUC: 20573328168", {
    tamano: 8,
    color: COLOR_TEXT_SECONDARY,
  });

  ctx.y -= 22;
  dibujarLineaDivisoria(ctx);
  ctx.y -= 28;

  // --- Título + código de reserva (el dato que más se busca) ---
  dibujarTextoCentrado(ctx, "BOLETO DE VIAJE", { tamano: 10, negrita: true, color: COLOR_TEXT_SECONDARY });
  ctx.y -= 30;
  dibujarTextoCentrado(ctx, datos.codigo, {
    tamano: 26,
    negrita: true,
    color: COLOR_PRIMARY,
    espaciado: 1.5,
  });
  ctx.y -= 30;

  // --- Datos del viaje ---
  dibujarEncabezadoSeccion(ctx, "Datos del viaje");
  dibujarTexto(ctx, `${datos.origen} - ${datos.destino}`, { tamano: 14, negrita: true });
  ctx.y -= 16;
  dibujarTexto(ctx, `${datos.terminalOrigen} - ${datos.terminalDestino}`, {
    tamano: 9,
    color: COLOR_TEXT_SECONDARY,
  });
  ctx.y -= 20;
  dibujarTexto(ctx, `${formatFechaLarga(datos.horaSalida)}, ${formatHora12(datos.horaSalida)}`, {
    tamano: 11,
  });
  ctx.y -= 18;
  dibujarTexto(ctx, `${datos.tipoServicio} · Asiento(s) ${datos.asientos.join(", ")}`, { tamano: 11 });
  ctx.y -= 18;
  const textoPasajerosCount =
    datos.pasajeros.length === 1 ? "1 pasajero" : `${datos.pasajeros.length} pasajeros`;
  dibujarTexto(ctx, textoPasajerosCount, { tamano: 10, color: COLOR_TEXT_SECONDARY });
  ctx.y -= 26;

  // --- Datos del/los pasajero(s) ---
  dibujarEncabezadoSeccion(ctx, "Pasajero(s)");
  datos.pasajeros.forEach((pasajero, indice) => {
    dibujarTexto(ctx, `${indice + 1}. ${pasajero.nombre}`, { tamano: 10.5, negrita: true });
    dibujarTextoDerecha(ctx, `Doc. ${pasajero.documentoEnmascarado}`, {
      tamano: 10,
      color: COLOR_TEXT_SECONDARY,
    });
    ctx.y -= 18;
  });
  ctx.y -= 8;

  // --- Pago ---
  dibujarEncabezadoSeccion(ctx, "Pago");
  dibujarTexto(ctx, "Total pagado", { tamano: 10, color: COLOR_TEXT_SECONDARY });
  dibujarTextoDerecha(ctx, formatPrecio(datos.totalSoles), { tamano: 16, negrita: true });
  ctx.y -= 20;
  dibujarTexto(ctx, "Comprobante", { tamano: 10, color: COLOR_TEXT_SECONDARY });
  dibujarTextoDerecha(ctx, datos.comprobante.tipo === "factura" ? "Factura" : "Boleta", {
    tamano: 10,
    negrita: true,
  });
  ctx.y -= 16;
  if (datos.comprobante.tipo === "factura") {
    dibujarTextoDerecha(ctx, `RUC ${datos.comprobante.ruc} · ${datos.comprobante.razonSocial}`, {
      tamano: 9,
      color: COLOR_TEXT_SECONDARY,
    });
    ctx.y -= 16;
  }
  ctx.y -= 14;

  // --- Código QR: mismo dato del código, en formato escaneable ---
  const tamanoQr = 130;
  const dataUrlQr = await QRCode.toDataURL(generarContenidoQr(datos.codigo), {
    margin: 1,
    width: tamanoQr,
    color: { dark: "#10233F", light: "#FFFFFF" },
  });
  const bytesQr = Uint8Array.from(atob(dataUrlQr.split(",")[1]), (caracter) => caracter.charCodeAt(0));
  const imagenQr = await pdfDoc.embedPng(bytesQr);

  // Caja con margen generoso alrededor: debe poder escanearse desde una
  // pantalla de celular, no solo verse impreso.
  const altoCajaQr = tamanoQr + 56;
  page.drawRectangle({
    x: MARGEN,
    y: ctx.y - altoCajaQr,
    width: ANCHO_CONTENIDO,
    height: altoCajaQr,
    borderColor: COLOR_BORDER,
    borderWidth: 1,
    color: COLOR_WHITE,
  });
  ctx.y -= 20;
  dibujarTextoCentrado(ctx, "Muestra este código al personal de embarque", {
    tamano: 8,
    color: COLOR_TEXT_SECONDARY,
  });
  ctx.y -= 12;
  page.drawImage(imagenQr, {
    x: MARGEN + (ANCHO_CONTENIDO - tamanoQr) / 2,
    y: ctx.y - tamanoQr,
    width: tamanoQr,
    height: tamanoQr,
  });
  ctx.y -= tamanoQr + 16;
  // Respaldo en texto si el QR no lee.
  dibujarTextoCentrado(ctx, datos.codigo, { tamano: 12, negrita: true });
  ctx.y -= 30;

  // --- Pie ---
  dibujarLineaDivisoria(ctx);
  ctx.y -= 16;
  dibujarTextoCentrado(ctx, "Preséntate 30 minutos antes de tu viaje con tu DNI físico.", {
    tamano: 8,
    color: COLOR_TEXT_SECONDARY,
  });
  ctx.y -= 12;
  dibujarTextoCentrado(ctx, "Franquicia de equipaje: 20 kg por pasajero. El exceso se cobra por rangos.", {
    tamano: 8,
    color: COLOR_TEXT_SECONDARY,
  });
  ctx.y -= 12;
  dibujarTextoCentrado(ctx, "Libro de Reclamaciones: ecosemh.pe/libro-de-reclamaciones", {
    tamano: 8,
    color: COLOR_TEXT_SECONDARY,
  });

  return pdfDoc.save();
}

export async function descargarBoletoPdf(datos: BoletoPdfData): Promise<void> {
  const bytes = await generarBoletoPdf(datos);
  descargarArchivo(`boleto-${datos.codigo}.pdf`, bytes, "application/pdf");
}
