/**
 * Búsqueda de viajes contra svc-ventas. Es lo único que reemplaza al mock por
 * ahora: alimenta el buscador y /pasajes/resultados. Asientos, compra y panel
 * siguen con `lib/mock` hasta que les toque.
 */
import type {
  CatalogResponse,
  TripListResponse,
  TripSummary,
} from "@/lib/types/contratos-frontend";
import { pedirJson, type OpcionesPeticion } from "@/lib/api/cliente";

export interface ViajeEncontrado {
  viaje: TripSummary;
  terminalOrigen: string;
}

export interface ResultadoBusqueda {
  /** false si no hay ninguna ruta activa entre esas dos ciudades. */
  existeRuta: boolean;
  viajes: ViajeEncontrado[];
}

// Terminales y rutas cambian muy rara vez: una sola petición por visita. Si
// falla, se olvida para que el siguiente intento la repita.
let catalogo: Promise<CatalogResponse> | null = null;

export function obtenerCatalogo(opciones: OpcionesPeticion = {}): Promise<CatalogResponse> {
  if (!catalogo) {
    // Sin `signal`: la promesa se comparte, y que una pantalla se desmonte no
    // debe cancelarla para las demás.
    catalogo = pedirJson<CatalogResponse>("ventas", "/v1/catalogo", {
      onReintento: opciones.onReintento,
    });
    catalogo.catch(() => {
      catalogo = null;
    });
  }
  return catalogo;
}

export interface CiudadesConRuta {
  /** Ciudades desde las que sale al menos una ruta activa, en orden alfabético. */
  origenes: string[];
  /** Por cada origen, las ciudades a las que llega una ruta activa. */
  destinosDesde: Record<string, string[]>;
}

/**
 * Lo que ofrece el buscador, sacado del catálogo: solo pares de ciudades con
 * una ruta activa. Una ruta nueva en el backend aparece sola.
 */
export function ciudadesConRuta({ terminals, routes }: CatalogResponse): CiudadesConRuta {
  const ciudad = new Map(terminals.map((t) => [t.id, t.city]));
  const destinos = new Map<string, Set<string>>();
  for (const ruta of routes) {
    const origen = ciudad.get(ruta.originId);
    const destino = ciudad.get(ruta.destinationId);
    if (!ruta.active || !origen || !destino || origen === destino) continue;
    destinos.set(origen, (destinos.get(origen) ?? new Set()).add(destino));
  }
  const ordenar = (lista: Iterable<string>) => [...lista].sort((a, b) => a.localeCompare(b, "es"));
  return {
    origenes: ordenar(destinos.keys()),
    destinosDesde: Object.fromEntries(
      [...destinos].map(([origen, lista]) => [origen, ordenar(lista)]),
    ),
  };
}

/**
 * Viajes programados de una ciudad a otra en una fecha (`AAAA-MM-DD`, hora de
 * Perú: el backend filtra así). Una ciudad puede tener más de un terminal,
 * así que se consultan todas las rutas activas entre ambas.
 */
export async function buscarViajes(
  origen: string,
  destino: string,
  fecha: string,
  opciones: OpcionesPeticion = {},
): Promise<ResultadoBusqueda> {
  const { terminals, routes } = await obtenerCatalogo(opciones);
  const terminal = new Map(terminals.map((t) => [t.id, t]));

  const rutas = routes.filter(
    (ruta) =>
      ruta.active &&
      terminal.get(ruta.originId)?.city === origen &&
      terminal.get(ruta.destinationId)?.city === destino,
  );
  if (rutas.length === 0) return { existeRuta: false, viajes: [] };

  const listas = await Promise.all(
    rutas.map(async (ruta) => {
      const params = new URLSearchParams({ ruta: ruta.code, fecha });
      const { trips } = await pedirJson<TripListResponse>(
        "ventas",
        `/v1/viajes?${params.toString()}`,
        opciones,
      );
      const terminalOrigen = terminal.get(ruta.originId)?.name ?? origen;
      return trips.map((viaje) => ({ viaje, terminalOrigen }));
    }),
  );

  return {
    existeRuta: true,
    viajes: listas
      .flat()
      .sort((a, b) => Date.parse(a.viaje.departsAt) - Date.parse(b.viaje.departsAt)),
  };
}

// El buscador espera la respuesta antes de navegar (su botón muestra la carga
// real) y la deja aquí; resultados la toma en vez de pedirla otra vez. Vence
// rápido: la disponibilidad cambia, y una recarga o "Reintentar" siempre
// piden datos nuevos.
const VIGENCIA_ENTREGA_MS = 60_000;
const entregas = new Map<string, { promesa: Promise<ResultadoBusqueda>; creada: number }>();

function claveBusqueda(origen: string, destino: string, fecha: string): string {
  return `${origen}|${destino}|${fecha}`;
}

export function iniciarBusqueda(
  origen: string,
  destino: string,
  fecha: string,
  opciones: OpcionesPeticion = {},
): Promise<ResultadoBusqueda> {
  const promesa = buscarViajes(origen, destino, fecha, opciones);
  entregas.set(claveBusqueda(origen, destino, fecha), { promesa, creada: Date.now() });
  return promesa;
}

export function busquedaEntregada(
  origen: string,
  destino: string,
  fecha: string,
): Promise<ResultadoBusqueda> | null {
  const clave = claveBusqueda(origen, destino, fecha);
  const entrega = entregas.get(clave);
  if (!entrega) return null;
  if (Date.now() - entrega.creada > VIGENCIA_ENTREGA_MS) {
    entregas.delete(clave);
    return null;
  }
  return entrega.promesa;
}

/** `AAAA-MM-DD` del día que el usuario eligió en su calendario. */
export function fechaParaBusqueda(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** Hoy en Perú, como `AAAA-MM-DD`. */
export function hoyEnPeru(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date());
}

/** Mediodía en Perú de esa fecha: no cambia de día en ninguna zona cercana. */
export function fechaDesdeBusqueda(fecha: string): Date {
  return new Date(`${fecha}T12:00:00-05:00`);
}

export function esFechaBusqueda(valor: string | undefined): valor is string {
  return (
    typeof valor === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(valor) &&
    !Number.isNaN(Date.parse(valor))
  );
}
