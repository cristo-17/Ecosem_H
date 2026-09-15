/**
 * Sincronización de escaneos pendientes (docs/prompts/10-pwa-embarque.md).
 * Sin backend todavía: esto simula el envío (delay de red, sin llamada
 * real) y marca los registros como sincronizados. Cuando exista el
 * endpoint real, solo cambia el cuerpo de esta función — la firma
 * (ninguna entrada, cuántos se sincronizaron de salida) no debería tener
 * que cambiar.
 */
import { listarPendientesSincronizar, marcarSincronizados } from "@/lib/embarque/db";

export async function sincronizarEscaneosPendientes(): Promise<number> {
  const pendientes = await listarPendientesSincronizar();
  if (pendientes.length === 0) return 0;

  // Simula la latencia real de un POST al backend — mismo criterio que el
  // resto del mock del proyecto (ver ResultadosView, PagoView).
  await new Promise((resolve) => setTimeout(resolve, 800));

  await marcarSincronizados(pendientes.map((registro) => [registro.viajeId, registro.codigoBoleto]));
  return pendientes.length;
}
