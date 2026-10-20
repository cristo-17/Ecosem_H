import { PDFDocument, StandardFonts } from "pdf-lib";
import type { PDFFont } from "pdf-lib";
import { descargarArchivo } from "@/lib/descargarArchivo";
import { formatFechaCorta, formatFechaLarga, formatHora12 } from "@/lib/format";
import { etiquetaAsiento } from "@/lib/asientos";
import type { Manifiesto, TipoDocumento } from "@/lib/embarque/contrato";
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

type Contenido = Manifiesto["content"];
type PasajeroManifiesto = Contenido["passengers"][number];

const TIPO_DOCUMENTO: Record<TipoDocumento, string> = {
  dni: "DNI",
  carne_extranjeria: "C.E.",
  pasaporte: "Pasaporte",
};

// El boleto (lib/pdf/boleto.ts) es A4 vertical; una tabla de 5 columnas
// legible pide más ancho que alto, así que el manifiesto usa el mismo papel
// A4 pero apaisado (ancho y alto intercambiados).
const ANCHO_PAGINA = ALTO_A4;
const ALTO_PAGINA = ANCHO_A4;
const MARGEN = 40;
const ANCHO_CONTENIDO = ANCHO_PAGINA - MARGEN * 2;

const COL_ASIENTO = 45;
const COL_NOMBRE = 200;
const COL_DOCUMENTO = 130;
const COL_BOLETO = 90;
const COL_ORIGEN = 80;
const COL_DESTINO = 80;
// El resto del ancho útil es la última columna (Observaciones).

const X_ASIENTO = MARGEN;
const X_NOMBRE = X_ASIENTO + COL_ASIENTO;
const X_DOCUMENTO = X_NOMBRE + COL_NOMBRE;
const X_BOLETO = X_DOCUMENTO + COL_DOCUMENTO;
const X_ORIGEN = X_BOLETO + COL_BOLETO;
const X_DESTINO = X_ORIGEN + COL_ORIGEN;
const X_OBSERVACIONES = X_DESTINO + COL_DESTINO;

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
  dibujarTexto(ctx, "Asiento", { x: X_ASIENTO, ...opciones });
  dibujarTexto(ctx, "Apellidos y nombres", { x: X_NOMBRE, ...opciones });
  dibujarTexto(ctx, "Tipo y N.° de documento", { x: X_DOCUMENTO, ...opciones });
  dibujarTexto(ctx, "Boleto", { x: X_BOLETO, ...opciones });
  dibujarTexto(ctx, "Origen", { x: X_ORIGEN, ...opciones });
  dibujarTexto(ctx, "Destino", { x: X_DESTINO, ...opciones });
  dibujarTexto(ctx, "Observaciones", { x: X_OBSERVACIONES, ...opciones });
  ctx.y -= 8;
  dibujarLineaDivisoria(ctx);
  ctx.y -= ALTO_FILA;
}

/** Menor de edad y menor en brazos: el control de permisos en el andén. */
function observaciones(pasajero: PasajeroManifiesto, contenido: Contenido): string {
  const notas: string[] = [];
  if (pasajero.minor) {
    const acompanante = pasajero.companion ? `, acomp.: ${pasajero.companion.relationship}` : "";
    notas.push(`Menor (${pasajero.ageAtTrip})${acompanante}`);
  }
  if (contenido.infantsInArms.some((m) => m.carrierSeat === pasajero.seat)) {
    notas.push("Lleva menor en brazos");
  }
  return notas.join(" · ");
}

function dibujarFila(
  ctx: Contexto,
  pasajero: PasajeroManifiesto,
  contenido: Contenido,
  indice: number,
): void {
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
  dibujarTexto(ctx, etiquetaAsiento(pasajero.seat), { x: X_ASIENTO, tamano: 9 });
  dibujarTexto(ctx, `${pasajero.lastNames}, ${pasajero.firstNames}`, { x: X_NOMBRE, tamano: 9 });
  // Completo: es el documento de fiscalización (D-052). En pantalla, enmascarado.
  dibujarTexto(ctx, `${TIPO_DOCUMENTO[pasajero.documentType]} ${pasajero.documentNumber}`, {
    x: X_DOCUMENTO,
    tamano: 9,
  });
  const boleto = pasajero.ticket ? `${pasajero.ticket.series}-${pasajero.ticket.number}` : "Sin número";
  dibujarTexto(ctx, boleto, { x: X_BOLETO, tamano: 9 });
  dibujarTexto(ctx, pasajero.origin, { x: X_ORIGEN, tamano: 9 });
  dibujarTexto(ctx, pasajero.destination, { x: X_DESTINO, tamano: 9 });
  dibujarTexto(ctx, observaciones(pasajero, contenido), { x: X_OBSERVACIONES, tamano: 8 });
  ctx.y -= ALTO_FILA;
}

function dibujarEncabezadoPrincipal(ctx: Contexto, manifiesto: Manifiesto): void {
  const { trip, bus, drivers } = manifiesto.content;
  const salida = new Date(trip.departsAt);
  const generado = new Date(manifiesto.generatedAt);
  dibujarTextoDerecha(ctx, "EMPCOSEM S.A.", { tamano: 10, negrita: true });
  ctx.y -= 13;
  // RUC real confirmado (ver docs/DECISIONES.md D-012, supersede D-011).
  dibujarTextoDerecha(ctx, "RUC: 20573328168", { tamano: 8, color: COLOR_TEXT_SECONDARY });
  ctx.y -= 6;
  dibujarTexto(ctx, "MANIFIESTO DE PASAJEROS", { tamano: 16, negrita: true, color: COLOR_NAVY });
  ctx.y -= 22;
  dibujarLineaDivisoria(ctx);
  ctx.y -= 18;

  dibujarTexto(ctx, `${trip.origin} - ${trip.destination}`, { tamano: 13, negrita: true });
  dibujarTextoDerecha(ctx, `${formatFechaLarga(salida)}, ${formatHora12(salida)}`, { tamano: 11 });
  ctx.y -= 18;
  const autorizacion = bus.authorizationNumber ? ` · Autorización ${bus.authorizationNumber}` : "";
  dibujarTexto(ctx, `Unidad ${bus.unit} · Placa ${bus.plate} · ${bus.make} ${bus.model}${autorizacion}`, {
    tamano: 10,
    negrita: true,
  });
  ctx.y -= 16;
  const conductores = drivers.length
    ? drivers.map((d) => `${d.lastNames}, ${d.firstNames} (lic. ${d.licenseNumber})`).join(" / ")
    : "Sin conductor asignado";
  dibujarTexto(ctx, `Conductor${drivers.length > 1 ? "es" : ""}: ${conductores}`, { tamano: 9 });
  ctx.y -= 14;
  // Qué versión se imprimió, y su huella: con eso se puede comprobar después.
  const huella = manifiesto.fingerprint ? ` · huella ${manifiesto.fingerprint.slice(0, 16)}` : "";
  dibujarTexto(
    ctx,
    `Versión ${manifiesto.version} · generada el ${formatFechaCorta(generado)} a las ${formatHora12(generado)}${huella}`,
    { tamano: 8, color: COLOR_TEXT_SECONDARY },
  );
  ctx.y -= 22;
}

/** Los menores en brazos: no ocupan asiento, pero van en el manifiesto. */
function dibujarMenoresEnBrazos(ctx: Contexto, contenido: Contenido): void {
  dibujarTexto(ctx, "Menores en brazos", { tamano: 10, negrita: true });
  ctx.y -= ALTO_FILA;
  for (const menor of contenido.infantsInArms) {
    dibujarTexto(
      ctx,
      `Asiento ${etiquetaAsiento(menor.carrierSeat)} · ${menor.lastNames}, ${menor.firstNames} · ` +
        `${TIPO_DOCUMENTO[menor.documentType]} ${menor.documentNumber} · ${menor.ageAtTrip} años · ` +
        `en brazos de ${menor.carrierLastNames}, ${menor.carrierFirstNames} (${menor.relationship})`,
      { tamano: 8.5 },
    );
    ctx.y -= ALTO_FILA;
  }
}

/** Construye el PDF del manifiesto, paginando la tabla si no entra en una hoja. No dispara la descarga. */
export async function generarManifiestoPdf(manifiesto: Manifiesto): Promise<Uint8Array> {
  const contenido = manifiesto.content;
  const { origin, destination } = contenido.trip;
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Manifiesto ${origin}-${destination} v${manifiesto.version}`);
  pdfDoc.setSubject(NOTA_FUENTE);

  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let ctx = nuevaPagina(pdfDoc, regular, bold);
  let pagina = 1;
  dibujarEncabezadoPrincipal(ctx, manifiesto);
  dibujarEncabezadoTabla(ctx);

  contenido.passengers.forEach((pasajero, indice) => {
    if (ctx.y - ALTO_FILA < MARGEN_INFERIOR) {
      pagina += 1;
      ctx = nuevaPagina(pdfDoc, regular, bold);
      dibujarTextoDerecha(ctx, `Página ${pagina}`, { tamano: 8, color: COLOR_TEXT_SECONDARY });
      dibujarTexto(ctx, `${origin} - ${destination} (continuación)`, {
        tamano: 10,
        negrita: true,
        color: COLOR_TEXT_SECONDARY,
      });
      ctx.y -= 16;
      dibujarEncabezadoTabla(ctx);
    }
    dibujarFila(ctx, pasajero, contenido, indice);
  });

  if (contenido.infantsInArms.length > 0) {
    if (ctx.y - ALTO_FILA * (contenido.infantsInArms.length + 2) < MARGEN_INFERIOR) {
      pagina += 1;
      ctx = nuevaPagina(pdfDoc, regular, bold);
    } else {
      ctx.y -= 10;
    }
    dibujarMenoresEnBrazos(ctx, contenido);
  }

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

  const enBrazos = contenido.infantsInArms.length;
  dibujarTexto(
    ctx,
    enBrazos
      ? `Total de pasajeros (${contenido.passengers.length} con asiento y ${enBrazos} en brazos)`
      : "Total de pasajeros",
    { tamano: 10, color: COLOR_TEXT_SECONDARY },
  );
  dibujarTextoDerecha(ctx, String(contenido.passengers.length + enBrazos), {
    tamano: 14,
    negrita: true,
  });
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

export async function descargarManifiestoPdf(manifiesto: Manifiesto): Promise<void> {
  const bytes = await generarManifiestoPdf(manifiesto);
  const { origin, destination, departsAt } = manifiesto.content.trip;
  const slug = `${origin}-${destination}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
  // Hora y versión en el nombre: dos salidas de la misma ruta el mismo día, o
  // dos versiones del mismo viaje, no se pisan el archivo.
  const salida = new Date(departsAt);
  const hora = `${String(salida.getHours()).padStart(2, "0")}${String(salida.getMinutes()).padStart(2, "0")}`;
  descargarArchivo(`manifiesto-${slug}-${hora}-v${manifiesto.version}.pdf`, bytes, "application/pdf");
}
