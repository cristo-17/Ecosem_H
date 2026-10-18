/**
 * Cliente HTTP de los servicios del backend (Edge Functions de Supabase).
 * Se llama desde el navegador (D-047 del backend). Sin supabase-js: solo
 * hacen falta peticiones `fetch` a `/functions/v1/<servicio>/v1/...`, y una
 * dependencia más no se justifica.
 *
 * Clasifica cada falla para que la pantalla diga qué pasó de verdad: sin
 * conexión, tiempo agotado, servicio ocupado (503, reintentado según el
 * contrato) o un error del servidor con su mensaje.
 */
import {
  RETRY_MAX_ATTEMPTS,
  SERVICE_BUSY_RETRY_AFTER_SECONDS,
  retryDelayMs,
  type ErrorBody,
  type ErrorCode,
} from "@/lib/types/contratos-frontend";

export type TipoFalla = "red" | "tiempo" | "ocupado" | "servidor";

export class ApiError extends Error {
  constructor(
    readonly tipo: TipoFalla,
    message: string,
    readonly codigo: ErrorCode | null = null,
    /** Para que soporte encuentre la petición. No lleva datos personales. */
    readonly correlationId: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface AvisoReintento {
  /** Número de reintento que se hará después de la espera (1, 2, ...). */
  intento: number;
  maximo: number;
  esperaMs: number;
}

export interface OpcionesPeticion {
  signal?: AbortSignal;
  /** Se llama antes de cada espera de un 503, para mostrarla en pantalla. */
  onReintento?: (aviso: AvisoReintento) => void;
}

export type Servicio = "ventas";

// Holgado a propósito: la señal en los terminales de altura es lenta, y
// cortar antes solo cambiaría "lento" por "falló".
const TIEMPO_LIMITE_MS = 15_000;

function urlServicio(servicio: Servicio): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new ApiError("servidor", "El servicio no está configurado. Avisa a soporte.");
  }
  return `${url.replace(/\/+$/, "")}/functions/v1/${servicio}`;
}

function cabeceras(): HeadersInit {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return anonKey ? { apikey: anonKey } : {};
}

function esErrorBody(cuerpo: unknown): cuerpo is ErrorBody {
  return (
    typeof cuerpo === "object" &&
    cuerpo !== null &&
    "error" in cuerpo &&
    typeof (cuerpo as ErrorBody).error?.code === "string"
  );
}

interface Respuesta {
  status: number;
  ok: boolean;
  cuerpo: unknown;
  retryAfterSegundos: number | null;
}

/** Un solo intento. El tiempo límite cubre también la lectura del cuerpo. */
async function intentar(url: string, signal?: AbortSignal): Promise<Respuesta> {
  const controlador = new AbortController();
  let agotado = false;
  const temporizador = setTimeout(() => {
    agotado = true;
    controlador.abort();
  }, TIEMPO_LIMITE_MS);
  const cancelar = () => controlador.abort(signal?.reason);
  signal?.addEventListener("abort", cancelar, { once: true });

  try {
    const respuesta = await fetch(url, {
      headers: cabeceras(),
      signal: controlador.signal,
      cache: "no-store",
    });
    const texto = await respuesta.text();
    let cuerpo: unknown = null;
    try {
      cuerpo = texto ? JSON.parse(texto) : null;
    } catch {
      // Una página del gateway en vez de JSON: se trata según el status.
    }
    const retryAfter = Number(respuesta.headers.get("retry-after"));
    return {
      status: respuesta.status,
      ok: respuesta.ok,
      cuerpo,
      retryAfterSegundos: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null,
    };
  } catch (error) {
    if (agotado) {
      throw new ApiError("tiempo", "El servidor no respondió a tiempo.");
    }
    // Cancelada por quien llamó (p. ej. la pantalla se desmontó): no es una falla.
    if (signal?.aborted) throw error;
    throw new ApiError("red", "No hay conexión con el servidor.");
  } finally {
    clearTimeout(temporizador);
    signal?.removeEventListener("abort", cancelar);
  }
}

function esperar(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const id = setTimeout(() => {
      signal?.removeEventListener("abort", alCancelar);
      resolve();
    }, ms);
    function alCancelar() {
      clearTimeout(id);
      reject(signal?.reason);
    }
    signal?.addEventListener("abort", alCancelar, { once: true });
  });
}

/**
 * GET a un servicio. Un 503 se reintenta hasta `RETRY_MAX_ATTEMPTS` veces,
 * esperando lo que diga `retryDelayMs` con el `retryAfterSeconds` del cuerpo
 * (D-044); nunca de inmediato. Si se agotan, falla como "ocupado".
 */
export async function pedirJson<T>(
  servicio: Servicio,
  ruta: string,
  { signal, onReintento }: OpcionesPeticion = {},
): Promise<T> {
  const url = `${urlServicio(servicio)}${ruta}`;

  for (let reintentos = 0; ; reintentos++) {
    const respuesta = await intentar(url, signal);
    const error = esErrorBody(respuesta.cuerpo) ? respuesta.cuerpo.error : null;

    if (respuesta.ok) {
      if (respuesta.cuerpo === null) {
        throw new ApiError("servidor", "El servidor envió una respuesta que no se pudo leer.");
      }
      return respuesta.cuerpo as T;
    }

    if (respuesta.status === 503) {
      if (reintentos < RETRY_MAX_ATTEMPTS) {
        const base =
          error?.retryAfterSeconds ??
          respuesta.retryAfterSegundos ??
          SERVICE_BUSY_RETRY_AFTER_SECONDS;
        const esperaMs = retryDelayMs(reintentos + 1, base);
        onReintento?.({ intento: reintentos + 1, maximo: RETRY_MAX_ATTEMPTS, esperaMs });
        await esperar(esperaMs, signal);
        continue;
      }
      throw new ApiError(
        "ocupado",
        error?.message ?? "El servicio está ocupado.",
        error?.code ?? null,
        error?.correlationId ?? null,
      );
    }

    throw new ApiError(
      "servidor",
      error?.message ?? "No pudimos completar la operación.",
      error?.code ?? null,
      error?.correlationId ?? null,
    );
  }
}
