import { PDFDocument, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import { descargarArchivo } from "@/lib/descargarArchivo";
import { formatFechaLarga, formatHora12, formatPrecio } from "@/lib/format";
import { firmarCodigo } from "@/lib/firma";
import {
  ANCHO_A4,
  ALTO_A4,
  COLOR_BORDER,
  COLOR_PRIMARY,
  COLOR_TEXT_SECONDARY,
  COLOR_WHITE,
  NOTA_FUENTE,
  cargarImagen,
  dibujarEncabezadoSeccion,
  dibujarLineaDivisoria,
  dibujarTexto,
  dibujarTextoCentrado,
  dibujarTextoDerecha,
  type Contexto,
} from "@/lib/pdf/comun";

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

// Aislado en su propia función (pedido explícito del prompt 03). El
// contenido ahora sí lleva el identificador firmado que pide CLAUDE.md
// (regla 4): "codigo|firma", firma = HMAC del código (lib/firma.ts, clave
// mock — ver el pendiente crítico documentado ahí). La app de embarque
// (docs/prompts/10-pwa-embarque.md) verifica esa firma localmente, sin red.
export async function generarContenidoQr(codigo: string): Promise<string> {
  const firma = await firmarCodigo(codigo);
  return `${codigo}|${firma}`;
}

const MARGEN = 50;
const ANCHO_CONTENIDO = ANCHO_A4 - MARGEN * 2;

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

  const ctx: Contexto = {
    page,
    regular,
    bold,
    y: ALTO_A4 - MARGEN - 20,
    margen: MARGEN,
    anchoContenido: ANCHO_CONTENIDO,
  };

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
  const contenidoQr = await generarContenidoQr(datos.codigo);
  const dataUrlQr = await QRCode.toDataURL(contenidoQr, {
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
