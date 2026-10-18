import { cn } from "@/lib/cn";
import { ClockIcon } from "@/components/ui/icons";

export interface ReservationTimerProps {
  /** Lo que queda según `expiresAt` del backend (useVigenciaReserva). null = sin reserva. */
  restanteMs: number | null;
  /** El contador llegó a cero y se está confirmando con el backend. */
  verificando?: boolean;
  className?: string;
}

function formatearRestante(ms: number): string {
  const totalSegundos = Math.max(0, Math.ceil(ms / 1000));
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

const UMBRAL_CRITICO_MS = 2 * 60 * 1000;

/**
 * Temporizador visible de la reserva. Solo muestra: el tiempo lo calcula
 * useVigenciaReserva desde la hora de vencimiento del backend, y que la
 * reserva venció lo decide el backend, no este contador.
 *
 * Sin role="status"/aria-live propio: un contador que cambia cada segundo
 * anunciaría "expira en 09:58", "09:57"... a cada tick, que es ruido para
 * lectores de pantalla. La expiración se anuncia aparte, con su pantalla.
 */
export function ReservationTimer({ restanteMs, verificando = false, className }: ReservationTimerProps) {
  if (restanteMs == null) return null;

  const critico = restanteMs <= UMBRAL_CRITICO_MS;

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 rounded-field px-3 py-2 text-sm font-semibold",
        critico ? "bg-warning-fill text-warning-text" : "bg-secondary/10 text-secondary",
        className
      )}
    >
      <ClockIcon className={critico ? "text-warning-text" : "text-secondary"} />
      <span>
        {verificando
          ? "Confirmando si tu reserva sigue vigente…"
          : `Tu reserva expira en ${formatearRestante(restanteMs)}`}
      </span>
    </div>
  );
}
