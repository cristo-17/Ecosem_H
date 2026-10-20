/**
 * El QR del boleto y su firma, verificados en el dispositivo (CLAUDE.md,
 * regla 4). Sin red: WebCrypto del navegador y la clave pública que trae el
 * paquete del viaje. Mismas reglas que `parseTicket` y `verifyTicket` de
 * `ventas/embarque.ts` en el backend:
 *
 *   EH1.<kid>.<viaje>.<código de compra>.<asiento>.<firma>
 *
 * Firma ECDSA P-256 con SHA-256, r||s de 64 bytes en base64url, sobre todo lo
 * que va antes del último punto. El QR no lleva datos personales.
 *
 * Sin imports con alias: se prueba también fuera de Next, con Deno.
 */

const PREFIJO = "EH1";
const KID = /^[a-z0-9]{1,16}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const CODIGO = /^ECH-[0-9A-F]{6}$/;
const ASIENTO = /^P[12]-\d{1,2}[A-Z]$/;
const FIRMA = /^[A-Za-z0-9_-]{86}$/;

export interface QrBoleto {
  kid: string;
  tripId: string;
  purchaseCode: string;
  seat: string;
  firma: string;
  /** Lo que se firmó: todo lo anterior al último punto. */
  firmado: string;
}

/** Lee un QR sin verificarlo. Nulo si no tiene la forma de un boleto de Ecosem H. */
export function leerQr(texto: string): QrBoleto | null {
  const qr = texto.trim();
  if (qr.length > 300) return null;
  const partes = qr.split(".");
  if (partes.length !== 6 || partes[0] !== PREFIJO) return null;
  const [, kid, tripId, purchaseCode, seat, firma] = partes;
  if (
    !KID.test(kid) ||
    !UUID.test(tripId) ||
    !CODIGO.test(purchaseCode) ||
    !ASIENTO.test(seat) ||
    !FIRMA.test(firma)
  ) {
    return null;
  }
  return { kid, tripId, purchaseCode, seat, firma, firmado: qr.slice(0, qr.lastIndexOf(".")) };
}

function desdeBase64url(texto: string): Uint8Array<ArrayBuffer> {
  const base64 = texto.replace(/-/g, "+").replace(/_/g, "/");
  const binario = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return Uint8Array.from(binario, (c) => c.charCodeAt(0));
}

const codificador = new TextEncoder();

/** Verifica la firma con la clave pública (JWK). Nunca lanza: una clave rota es firma inválida. */
export async function verificarFirma(qr: QrBoleto, clavePublica: JsonWebKey): Promise<boolean> {
  try {
    const clave = await crypto.subtle.importKey(
      "jwk",
      { kty: "EC", crv: "P-256", x: clavePublica.x, y: clavePublica.y },
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );
    return await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      clave,
      desdeBase64url(qr.firma),
      codificador.encode(qr.firmado),
    );
  } catch {
    return false;
  }
}
