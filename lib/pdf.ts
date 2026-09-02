/**
 * Generador de PDF mínimo, sin dependencias: el proyecto evita paquetes no
 * justificados (ver CLAUDE.md) y esta necesidad — un PDF de una página con
 * texto plano para el boleto/comprobante — no amerita una librería completa
 * de maquetado de PDF. Construye a mano los objetos PDF-1.4 (catálogo,
 * páginas, fuente Helvetica estándar, stream de contenido) y su tabla xref.
 *
 * Fuente Helvetica con /Encoding /WinAnsiEncoding: cubre Latin-1 (incluye
 * tildes, ñ, ¿, ¡), suficiente para español peruano sin incrustar una
 * fuente. Los caracteres fuera de ese rango se reemplazan por "?".
 */

export interface LineaPdf {
  texto: string;
  /** Puntos. Default 11. */
  tamano?: number;
  negrita?: boolean;
  /** Espacio vertical extra (puntos) antes de esta línea. */
  espacioAntes?: number;
}

const ANCHO_PAGINA = 612; // Carta (US Letter), en puntos
const ALTO_PAGINA = 792;
const MARGEN_IZQUIERDO = 50;

function textoAPdfLatin1(texto: string): string {
  let salida = "";
  for (const caracter of texto) {
    const codigo = caracter.codePointAt(0) ?? 63;
    salida += codigo < 256 ? String.fromCharCode(codigo) : "?";
  }
  return salida.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** Arma los bytes de un PDF de una página con las líneas dadas, de arriba hacia abajo. */
export function construirPdf(lineas: LineaPdf[]): Uint8Array<ArrayBuffer> {
  let y = ALTO_PAGINA - 60;
  let contenido = "";
  for (const linea of lineas) {
    const tamano = linea.tamano ?? 11;
    y -= linea.espacioAntes ?? 0;
    const fuente = linea.negrita ? "F2" : "F1";
    contenido += `BT /${fuente} ${tamano} Tf ${MARGEN_IZQUIERDO} ${y} Td (${textoAPdfLatin1(linea.texto)}) Tj ET\n`;
    y -= tamano + 6;
  }

  const objetos = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ANCHO_PAGINA} ${ALTO_PAGINA}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Length ${contenido.length} >>\nstream\n${contenido}endstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  objetos.forEach((objeto, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${objeto}\nendobj\n`;
  });

  const inicioXref = pdf.length;
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objetos.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF`;

  // ArrayBuffer explícito (no el ArrayBufferLike que infiere new Uint8Array(n)
  // en este lib.dom): Blob exige BlobPart, que solo acepta ArrayBuffer.
  const buffer = new ArrayBuffer(pdf.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i);
  return bytes;
}

/** Dispara la descarga del PDF en el navegador. Cliente únicamente. */
export function descargarPdf(nombreArchivo: string, lineas: LineaPdf[]): void {
  const bytes = construirPdf(lineas);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
