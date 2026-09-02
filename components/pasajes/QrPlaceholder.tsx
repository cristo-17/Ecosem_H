import { cn } from "@/lib/cn";
import { hashSemilla, mulberry32 } from "@/lib/random";

export interface QrPlaceholderProps {
  /** Texto que determina el patrón (p. ej. el código del boleto): mismo texto, mismo QR. */
  semilla: string;
  className?: string;
}

const MODULOS = 25;
const TAMANO_BUSCADOR = 7;
const ESQUINAS_BUSCADOR: Array<[number, number]> = [
  [0, 0],
  [MODULOS - TAMANO_BUSCADOR, 0],
  [0, MODULOS - TAMANO_BUSCADOR],
];

function enZonaBuscador(x: number, y: number): [number, number] | null {
  for (const [zx, zy] of ESQUINAS_BUSCADOR) {
    if (x >= zx && x < zx + TAMANO_BUSCADOR && y >= zy && y < zy + TAMANO_BUSCADOR) return [zx, zy];
  }
  return null;
}

function moduloBuscador(x: number, y: number, zx: number, zy: number): boolean {
  const lx = x - zx;
  const ly = y - zy;
  const enBorde = lx === 0 || lx === TAMANO_BUSCADOR - 1 || ly === 0 || ly === TAMANO_BUSCADOR - 1;
  const enCentro = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4;
  return enBorde || enCentro;
}

/**
 * No hay integración con un backend que emita boletos reales todavía, así
 * que no hay nada válido que codificar en un QR de verdad (ver CLAUDE.md:
 * el boleto lleva un identificador firmado HMAC que solo puede emitir el
 * servidor). Este patrón es puramente visual — determinístico por semilla,
 * con los tres cuadros buscadores de un QR real — para representar "aquí va
 * el código" hasta que exista esa integración.
 */
export function QrPlaceholder({ semilla, className }: QrPlaceholderProps) {
  const random = mulberry32(hashSemilla(semilla));
  const celdas: Array<{ x: number; y: number }> = [];

  for (let y = 0; y < MODULOS; y++) {
    for (let x = 0; x < MODULOS; x++) {
      const zona = enZonaBuscador(x, y);
      let encendido: boolean;
      if (zona) {
        encendido = moduloBuscador(x, y, zona[0], zona[1]);
      } else if (x < 1 || x >= MODULOS - 1 || y < 1 || y >= MODULOS - 1) {
        encendido = false;
      } else {
        encendido = random() < 0.46;
      }
      if (encendido) celdas.push({ x, y });
    }
  }

  return (
    <svg
      role="img"
      aria-label={`Código QR de referencia ${semilla}`}
      viewBox={`0 0 ${MODULOS} ${MODULOS}`}
      shapeRendering="crispEdges"
      className={cn("size-40 text-navy", className)}
    >
      <rect x={0} y={0} width={MODULOS} height={MODULOS} fill="white" />
      {celdas.map(({ x, y }) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />
      ))}
    </svg>
  );
}
