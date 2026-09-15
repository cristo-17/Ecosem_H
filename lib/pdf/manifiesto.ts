import { PDFDocument, StandardFonts } from "pdf-lib";
import type { PDFFont } from "pdf-lib";
import { descargarArchivo } from "@/lib/descargarArchivo";
import { formatFechaLarga, formatHora12 } from "@/lib/format";
import {
  ALTO_A4,
  ANCHO_A4,
  COLOR_BORDER,
  COLOR_FILA_ALTERNA,
  COLOR_NAVY,
  COLOR_TEXT_SECONDARY,
  NOTA_FUENTE,
  dibujarLineaDivisoria,
  dibujarTexto,
  dibujarTextoDerecha,
  type Contexto,
} from "@/lib/pdf/comun";

export interface PasajeroManifiestoPdf {
  asiento: string;
  apellidos: string;
  nombres: string;
  tipoDocumento: string;
  /** Completo — el manifiesto es un documento de fiscalización, no se enmascara. */
  numeroDocumento: string;
  origen: string;
  destino: string;
}

export interface ManifiestoPdfData {
  origen: string;
  destino: string;
  terminalOrigen: string;
  fechaSalida: Date;
  placaBus: string;
  conductores: string[];
  pasajeros: PasajeroManifiestoPdf[];
}

// El boleto (lib/pdf/boleto.ts) es A4 vertical; una tabla de 5 columnas
// legible pide más ancho que alto, así que el manifiesto usa el mismo papel
// A4 pero apaisado (ancho y alto intercambiados).
const ANCHO_PAGINA = ALTO_A4;
const ALTO_PAGINA = ANCHO_A4;
const MARGEN = 40;
const ANCHO_CONTENIDO = ANCHO_PAGINA - MARGEN * 2;

const COL_ASIENTO = 55;
const COL_NOMBRE = 240;
const COL_DOCUMENTO = 180;
const COL_ORIGEN = 140;
// El resto del ancho útil es la última columna (Destino): no necesita su
// propio ancho con nombre, nada se dibuja después de ella.

const X_ASIENTO = MARGEN;
const X_NOMBRE = X_ASIENTO + COL_ASIENTO;
const X_DOCUMENTO = X_NOMBRE + COL_NOMBRE;
const X_ORIGEN = X_DOCUMENTO + COL_DOCUMENTO;
const X_DESTINO = X_ORIGEN + COL_ORIGEN;

const ALTO_FILA = 16;
const ALTO_FOOTER = 95;
/** Si no queda al menos esto sobre el margen inferior, se pasa a otra página. */
const MARGEN_INFERIOR = 45;

function nuevaPagina(pdfDoc: PDFDocument, regular: PDFFont, bold: PDFFont): Contexto {
  const page = pdfDoc.addPage([ANCHO_PAGINA, ALTO_PAGINA]);
  return {
    page,
    regular,
    bold,
    y: ALTO_PAGINA - MARGEN - 16,
    margen: MARGEN,
    anchoContenido: ANCHO_CONTENIDO,
  };
}

function dibujarEncabezadoTabla(ctx: Contexto): void {
  const opciones = { tamano: 9, negrita: true, color: COLOR_TEXT_SECONDARY } as const;
  dibujarTexto(ctx, "N.° asiento", { x: X_ASIENTO, ...opciones });
  dibujarTexto(ctx, "Apellidos y nombres", { x: X_NOMBRE, ...opciones });
  dibujarTexto(ctx, "Tipo y N.° de documento", { x: X_DOCUMENTO, ...opciones });
  dibujarTexto(ctx, "Origen", { x: X_ORIGEN, ...opciones });
  dibujarTexto(ctx, "Destino", { x: X_DESTINO, ...opciones });
  ctx.y -= 8;
  dibujarLineaDivisoria(ctx);
  ctx.y -= ALTO_FILA;
}

function dibujarFila(ctx: Contexto, pasajero: PasajeroManifiestoPdf, indice: number): void {
  // Zebra striping: ayuda a seguir la fila en una tabla larga, y sigue
  // legible impreso en blanco y negro (gris muy claro, no un color).
  if (indice % 2 === 1) {
    ctx.page.drawRectangle({
      x: ctx.margen,
      y: ctx.y - 4,
      width: ctx.anchoContenido,
      height: ALTO_FILA,
      color: COLOR_FILA_ALTERNA,
    });
  }
  dibujarTexto(ctx, pasajero.asiento, { x: X_ASIENTO, tamano: 9 });
  dibujarTexto(ctx, `${pasajero.apellidos}, ${pasajero.nombres}`, { x: X_NOMBRE, tamano: 9 });
  dibujarTexto(ctx, `${pasajero.tipoDocumento} ${pasajero.numeroDocumento}`, { x: X_DOCUMENTO, tamano: 9 });
  dibujarTexto(ctx, pasajero.origen, { x: X_ORIGEN, tamano: 9 });
  dibujarTexto(ctx, pasajero.destino, { x: X_DESTINO, tamano: 9 });
  ctx.y -= ALTO_FILA;
}

function dibujarEncabezadoPrincipal(ctx: Contexto, datos: ManifiestoPdfData): void {
  dibujarTextoDerecha(ctx, "EMPCOSEM S.A.", { tamano: 10, negrita: true });
  ctx.y -= 13;
  // RUC real confirmado (ver docs/DECISIONES.md D-012, supersede D-011).
  dibujarTextoDerecha(ctx, "RUC: 20573328168", { tamano: 8, color: COLOR_TEXT_SECONDARY });
  ctx.y -= 6;
  dibujarTexto(ctx, "MANIFIESTO DE PASAJEROS", { tamano: 16, negrita: true, color: COLOR_NAVY });
  ctx.y -= 22;
  dibujarLineaDivisoria(ctx);
  ctx.y -= 18;

  dibujarTexto(ctx, `${datos.origen} - ${datos.destino}`, { tamano: 13, negrita: true });
  dibujarTextoDerecha(ctx, `${formatFechaLarga(datos.fechaSalida)}, ${formatHora12(datos.fechaSalida)}`, {
    tamano: 11,
  });
  ctx.y -= 16;
  dibujarTexto(ctx, `Salida: ${datos.terminalOrigen}`, { tamano: 9, color: COLOR_TEXT_SECONDARY });
  ctx.y -= 18;
  dibujarTexto(ctx, `Placa de la unidad: ${datos.placaBus}`, { tamano: 10, negrita: true });
  dibujarTextoDerecha(
    ctx,
    `Conductor${datos.conductores.length > 1 ? "es" : ""}: ${datos.conductores.join(" / ")}`,
    { tamano: 10 },
  );
  ctx.y -= 24;
}

/** Construye el PDF del manifiesto, paginando la tabla si no entra en una hoja. No dispara la descarga. */
export async function generarManifiestoPdf(datos: ManifiestoPdfData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Manifiesto ${datos.origen}-${datos.destino}`);
  pdfDoc.setSubject(NOTA_FUENTE);

  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let ctx = nuevaPagina(pdfDoc, regular, bold);
  let pagina = 1;
  dibujarEncabezadoPrincipal(ctx, datos);
  dibujarEncabezadoTabla(ctx);

  datos.pasajeros.forEach((pasajero, indice) => {
    if (ctx.y - ALTO_FILA < MARGEN_INFERIOR) {
      pagina += 1;
      ctx = nuevaPagina(pdfDoc, regular, bold);
      dibujarTextoDerecha(ctx, `Página ${pagina}`, { tamano: 8, color: COLOR_TEXT_SECONDARY });
      dibujarTexto(ctx, `${datos.origen} - ${datos.destino} (continuación)`, {
        tamano: 10,
        negrita: true,
        color: COLOR_TEXT_SECONDARY,
      });
      ctx.y -= 16;
      dibujarEncabezadoTabla(ctx);
    }
    dibujarFila(ctx, pasajero, indice);
  });

  // --- Total + firma y sello: si no entra debajo de la tabla, van en una
  // página aparte en vez de encimarse con la última fila. ---
  if (ctx.y - ALTO_FOOTER < MARGEN_INFERIOR) {
    pagina += 1;
    ctx = nuevaPagina(pdfDoc, regular, bold);
  } else {
    ctx.y -= 8;
    dibujarLineaDivisoria(ctx);
    ctx.y -= 20;
  }

  dibujarTexto(ctx, "Total de pasajeros", { tamano: 10, color: COLOR_TEXT_SECONDARY });
  dibujarTextoDerecha(ctx, String(datos.pasajeros.length), { tamano: 14, negrita: true });
  ctx.y -= 50;

  const anchoFirma = (ctx.anchoContenido - 40) / 2;
  ctx.page.drawLine({
    start: { x: ctx.margen, y: ctx.y },
    end: { x: ctx.margen + anchoFirma, y: ctx.y },
    thickness: 0.75,
    color: COLOR_BORDER,
  });
  ctx.page.drawLine({
    start: { x: ctx.margen + ctx.anchoContenido - anchoFirma, y: ctx.y },
    end: { x: ctx.margen + ctx.anchoContenido, y: ctx.y },
    thickness: 0.75,
    color: COLOR_BORDER,
  });
  ctx.y -= 12;
  dibujarTexto(ctx, "Firma del conductor", { x: ctx.margen, tamano: 8, color: COLOR_TEXT_SECONDARY });
  dibujarTexto(ctx, "Sello de la agencia", {
    x: ctx.margen + ctx.anchoContenido - anchoFirma,
    tamano: 8,
    color: COLOR_TEXT_SECONDARY,
  });

  return pdfDoc.save();
}

export async function descargarManifiestoPdf(datos: ManifiestoPdfData): Promise<void> {
  const bytes = await generarManifiestoPdf(datos);
  const slug = `${datos.origen}-${datos.destino}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-");
  // La hora de salida entra al nombre del archivo porque dos salidas de la
  // misma ruta el mismo día (como v1 y v4 en el mock, ambas Lima-Huancayo)
  // no deben pisarse el archivo descargado una a la otra.
  const hora = String(datos.fechaSalida.getHours()).padStart(2, "0");
  const minutos = String(datos.fechaSalida.getMinutes()).padStart(2, "0");
  descargarArchivo(`manifiesto-${slug}-${hora}${minutos}.pdf`, bytes, "application/pdf");
}
