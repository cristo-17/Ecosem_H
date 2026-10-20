import { PDFDocument, StandardFonts, type PDFFont, type PDFImage } from "pdf-lib";
import QRCode from "qrcode";
import { descargarArchivo } from "@/lib/descargarArchivo";
import { formatFechaLarga, formatHora12, formatPrecio } from "@/lib/format";
import type { DocumentKind, TicketsResponse } from "@/lib/types/contratos-frontend";
import { etiquetaAsiento } from "@/lib/asientos";
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
  /**
   * El documento tal como se imprime. En el boleto de una compra real va
   * completo: el artículo 3 de la RS 156-2003/SUNAT lo exige en el boleto de
   * viaje.
   */
  documento: string;
  /** "DNI", "C.E.", "Pasaporte". Sin él se imprime "Doc.". */
  tipoDocumento?: string;
}

const MARGEN = 50;
const ANCHO_CONTENIDO = ANCHO_A4 - MARGEN * 2;

/** Lo que va en una página de boleto, ya listo para dibujar. */
interface PaginaBoleto {
  codigo: string;
  origen: string;
  destino: string;
  /** Línea de terminales bajo la ruta. null si no se conoce. */
  terminales: string | null;
  horaSalida: Date;
  /** "Ejecutivo · Asiento(s) 3A". */
  lineaAsientos: string;
  pasajeros: PasajeroBoletoPdf[];
  etiquetaMonto: string;
  monto: string;
  comprobante: string;
  detalleComprobante: string | null;
  /** Se codifica tal cual en el QR. */
  contenidoQr: string;
  /** Texto bajo el QR, para buscar el boleto si el QR no lee. */
  respaldoQr: string;
}

interface Recursos {
  regular: PDFFont;
  bold: PDFFont;
  marca: PDFImage;
  wordmark: PDFImage;
}

async function crearDocumento(titulo: string): Promise<{ pdfDoc: PDFDocument; recursos: Recursos }> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(titulo);
  pdfDoc.setSubject(NOTA_FUENTE);
  const [regular, bold, marca, wordmark] = await Promise.all([
    pdfDoc.embedFont(StandardFonts.Helvetica),
    pdfDoc.embedFont(StandardFonts.HelveticaBold),
    cargarImagen(pdfDoc, "/ecosemh-mark.png"),
    cargarImagen(pdfDoc, "/ecosemh-wordmark.png"),
  ]);
  return { pdfDoc, recursos: { regular, bold, marca, wordmark } };
}

async function dibujarPagina(pdfDoc: PDFDocument, recursos: Recursos, datos: PaginaBoleto) {
  const page = pdfDoc.addPage([ANCHO_A4, ALTO_A4]);
  const { regular, bold, marca, wordmark } = recursos;

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
  if (datos.terminales) {
    dibujarTexto(ctx, datos.terminales, { tamano: 9, color: COLOR_TEXT_SECONDARY });
    ctx.y -= 20;
  } else {
    ctx.y -= 4;
  }
  dibujarTexto(ctx, `${formatFechaLarga(datos.horaSalida)}, ${formatHora12(datos.horaSalida)}`, {
    tamano: 11,
  });
  ctx.y -= 18;
  dibujarTexto(ctx, datos.lineaAsientos, { tamano: 11 });
  ctx.y -= 18;
  const textoPasajerosCount =
    datos.pasajeros.length === 1 ? "1 pasajero" : `${datos.pasajeros.length} pasajeros`;
  dibujarTexto(ctx, textoPasajerosCount, { tamano: 10, color: COLOR_TEXT_SECONDARY });
  ctx.y -= 26;

  // --- Datos del/los pasajero(s) ---
  dibujarEncabezadoSeccion(ctx, "Pasajero(s)");
  datos.pasajeros.forEach((pasajero, indice) => {
    dibujarTexto(ctx, `${indice + 1}. ${pasajero.nombre}`, { tamano: 10.5, negrita: true });
    dibujarTextoDerecha(ctx, `${pasajero.tipoDocumento ?? "Doc."} ${pasajero.documento}`, {
      tamano: 10,
      color: COLOR_TEXT_SECONDARY,
    });
    ctx.y -= 18;
  });
  ctx.y -= 8;

  // --- Pago ---
  dibujarEncabezadoSeccion(ctx, "Pago");
  dibujarTexto(ctx, datos.etiquetaMonto, { tamano: 10, color: COLOR_TEXT_SECONDARY });
  dibujarTextoDerecha(ctx, datos.monto, { tamano: 16, negrita: true });
  ctx.y -= 20;
  dibujarTexto(ctx, "Comprobante", { tamano: 10, color: COLOR_TEXT_SECONDARY });
  dibujarTextoDerecha(ctx, datos.comprobante, { tamano: 10, negrita: true });
  ctx.y -= 16;
  if (datos.detalleComprobante) {
    dibujarTextoDerecha(ctx, datos.detalleComprobante, { tamano: 9, color: COLOR_TEXT_SECONDARY });
    ctx.y -= 16;
  }
  ctx.y -= 14;

  // --- Código QR ---
  const tamanoQr = 130;
  const dataUrlQr = await QRCode.toDataURL(datos.contenidoQr, {
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
  dibujarTextoCentrado(ctx, datos.respaldoQr, { tamano: 12, negrita: true });
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
}

const ESTADO_COMPROBANTE: Record<string, string> = {
  pending: "En emisión",
  issued: "Emitido",
  failed: "En revisión",
  voided: "Anulado",
};

const TIPO_DOCUMENTO: Record<DocumentKind, string> = {
  dni: "DNI",
  carne_extranjeria: "C.E.",
  pasaporte: "Pasaporte",
};

export interface BoletosCompraPdfExtra {
  /** Del viaje elegido, si esta pestaña lo conoce: la API de boletos no los trae. */
  terminalOrigen?: string;
  tipoServicio?: string;
}

/**
 * Los boletos de una compra real: una página por pasajero, cada una con el
 * QR que firmó el backend para ese asiento, sin tocar su contenido. La app de
 * embarque lo valida sin conexión con la clave publicada (regla 4).
 *
 * El PDF es la representación del boleto de viaje (RS 156-2003/SUNAT), no
 * una copia de cortesía: el artículo 3 exige el documento completo del
 * pasajero, así que va sin enmascarar. Lo que protege los datos es el diseño:
 * una página por pasajero, cada una solo con su propio documento. El
 * enmascarado queda para las listas en pantalla y en el panel.
 */
export async function generarBoletosCompraPdf(
  { purchaseCode, tickets }: TicketsResponse,
  extra: BoletosCompraPdfExtra = {},
): Promise<Uint8Array> {
  const { pdfDoc, recursos } = await crearDocumento(`Boletos ${purchaseCode}`);
  for (const ticket of tickets) {
    const asiento = etiquetaAsiento(ticket.seat);
    const { series, number, status } = ticket.receipt;
    await dibujarPagina(pdfDoc, recursos, {
      codigo: purchaseCode,
      origen: ticket.trip.origin,
      destino: ticket.trip.destination,
      terminales: extra.terminalOrigen ? `Sale de ${extra.terminalOrigen}` : null,
      horaSalida: new Date(ticket.trip.departsAt),
      lineaAsientos: `${extra.tipoServicio ? `${extra.tipoServicio} · ` : ""}Asiento ${asiento}`,
      pasajeros: ticket.passenger
        ? [
            {
              nombre: `${ticket.passenger.firstNames} ${ticket.passenger.lastNames}`,
              documento: ticket.passenger.documentNumber,
              tipoDocumento: TIPO_DOCUMENTO[ticket.passenger.documentType],
            },
          ]
        : [],
      // El importe de este boleto tal como lo devuelve el backend; aquí no se
      // suma ni se reparte nada.
      etiquetaMonto: "Importe de este boleto",
      monto: formatPrecio(Number(ticket.amount)),
      comprobante: "Boleto de viaje",
      detalleComprobante:
        series && number ? `${series}-${number}` : (ESTADO_COMPROBANTE[status] ?? status),
      contenidoQr: ticket.qr,
      respaldoQr: `${purchaseCode} · ${asiento}`,
    });
  }
  return pdfDoc.save();
}

export async function descargarBoletosCompraPdf(
  boletos: TicketsResponse,
  extra: BoletosCompraPdfExtra = {},
): Promise<void> {
  const bytes = await generarBoletosCompraPdf(boletos, extra);
  descargarArchivo(`boletos-${boletos.purchaseCode}.pdf`, bytes, "application/pdf");
}
