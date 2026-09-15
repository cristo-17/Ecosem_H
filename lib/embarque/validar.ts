/**
 * Validación de embarque (docs/prompts/10-pwa-embarque.md, CLAUDE.md regla
 * 4). Todo acá es local y síncrono con IndexedDB — ninguna llamada de red,
 * a propósito: es la función que tiene que seguir funcionando con el
 * celular en modo avión.
 */
import { buscarEscaneo, obtenerManifiesto, registrarEscaneo } from "@/lib/embarque/db";
import type { ResultadoEscaneo } from "@/lib/embarque/tipos";
import { verificarFirmaCodigo } from "@/lib/firma";

/** Contenido crudo del QR del boleto: "codigo|firma" (ver lib/pdf/boleto.ts). */
export function parsearContenidoQr(textoCrudo: string): { codigo: string; firma: string } | null {
  const partes = textoCrudo.trim().split("|");
  if (partes.length !== 2) return null;
  const [codigo, firma] = partes;
  if (!codigo || !firma) return null;
  return { codigo, firma };
}

/**
 * `firma` es opcional a propósito: la entrada manual (respaldo cuando falla
 * la cámara) solo tiene el código de reserva legible que el boleto imprime
 * en grande — no la firma, que no está pensada para copiarse a mano. Ese
 * camino se valida solo contra el manifiesto local, no contra el HMAC.
 */
export async function validarEscaneo(
  viajeId: string,
  entrada: { codigo: string; firma?: string },
): Promise<ResultadoEscaneo> {
  const codigo = entrada.codigo.trim().toUpperCase();
  if (!codigo) {
    return { tipo: "invalido", motivo: "Código vacío" };
  }

  if (entrada.firma !== undefined) {
    const firmaValida = await verificarFirmaCodigo(codigo, entrada.firma);
    if (!firmaValida) {
      return {
        tipo: "invalido",
        motivo: "Firma inválida — este código no corresponde a un boleto emitido por Ecosem H",
      };
    }
  }

  const manifiesto = await obtenerManifiesto(viajeId);
  if (!manifiesto) {
    return { tipo: "invalido", motivo: "No hay un manifiesto descargado para este viaje" };
  }

  const pasajero = manifiesto.pasajeros.find((candidato) => candidato.codigoBoleto === codigo);
  if (!pasajero) {
    return { tipo: "invalido", motivo: "No corresponde a este viaje" };
  }

  const registroExistente = await buscarEscaneo(viajeId, codigo);
  if (registroExistente) {
    return { tipo: "ya-embarcado", pasajero, horaPrimerEscaneo: registroExistente.horaEscaneo };
  }

  await registrarEscaneo({
    viajeId,
    codigoBoleto: codigo,
    horaEscaneo: new Date(),
    sincronizado: false,
  });

  return { tipo: "valido", pasajero };
}
