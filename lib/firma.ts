/**
 * Firma HMAC del identificador del boleto (CLAUDE.md, regla 4: "El QR del
 * boleto contiene un identificador firmado (HMAC). La app de embarque debe
 * poder validarlo sin conexión"). Aislado en su propio módulo — lo usan
 * `lib/pdf/boleto.ts` (firma al generar el QR) y `lib/embarque/validar.ts`
 * (verifica al escanear) — para que cambiar la clave real del backend sea
 * un solo lugar, sin tocar ninguna de las dos interfaces.
 *
 * PENDIENTE CRÍTICO: `CLAVE_MOCK` es de desarrollo, vive en el bundle del
 * cliente y CUALQUIERA puede leerla con las herramientas de desarrollador
 * del navegador. En producción la firma tiene que calcularse del lado del
 * servidor (al emitir el boleto) con una clave que nunca llegue al cliente;
 * la app de embarque seguiría verificando local y sin conexión, pero contra
 * una clave pública derivada (HMAC de clave simétrica no sirve para eso —
 * hace falta firma asimétrica, p. ej. Ed25519, para que el cliente pueda
 * verificar sin poder firmar). Ver docs/DECISIONES.md.
 */
const CLAVE_MOCK = "ecosem-h-clave-mock-DEV-NO-USAR-EN-PRODUCCION";

async function hmacSha256Hex(clave: string, mensaje: string): Promise<string> {
  const bytes = new TextEncoder();
  const clavePrivada = await crypto.subtle.importKey(
    "raw",
    bytes.encode(clave),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const firma = await crypto.subtle.sign("HMAC", clavePrivada, bytes.encode(mensaje));
  return Array.from(new Uint8Array(firma))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Firma corta (16 caracteres hex) — alcanza para el propósito del mock y mantiene el QR compacto. */
const LARGO_FIRMA = 16;

export async function firmarCodigo(codigo: string): Promise<string> {
  const firma = await hmacSha256Hex(CLAVE_MOCK, codigo);
  return firma.slice(0, LARGO_FIRMA);
}

export async function verificarFirmaCodigo(codigo: string, firma: string): Promise<boolean> {
  const firmaEsperada = await firmarCodigo(codigo);
  return firma.length === firmaEsperada.length && firma === firmaEsperada;
}
