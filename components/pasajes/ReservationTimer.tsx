"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { ClockIcon } from "@/components/ui/icons";

export interface ReservationTimerProps {
  /** Epoch ms en que expira la reserva temporal. null = no hay reserva activa. */
  expiraEn: number | null;
  onExpire: () => void;
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
 * Temporizador visible de la reserva temporal de asientos (CLAUDE.md: la
 * reserva expira a los 10 minutos y un proceso programado la libera — aquí
 * solo se simula esa cuenta regresiva en el cliente, sin backend real).
 *
 * Sin role="status"/aria-live propio: un contador que cambia cada segundo
 * anunciaría "expira en 09:58", "09:57"... a cada tick, que es ruido para
 * lectores de pantalla. El único momento que sí necesita anunciarse (la
 * expiración) se comunica aparte, con un toast de error puntual.
 */
export function ReservationTimer({ expiraEn, onExpire, className }: ReservationTimerProps) {
  const [ahora, setAhora] = useState(() => Date.now());
  const yaExpiroRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    if (expiraEn == null) return;
    yaExpiroRef.current = false;
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiraEn]);

  useEffect(() => {
    if (expiraEn == null || yaExpiroRef.current) return;
    if (ahora >= expiraEn) {
      yaExpiroRef.current = true;
      onExpireRef.current();
    }
  }, [ahora, expiraEn]);

  if (expiraEn == null) return null;

  const restanteMs = expiraEn - ahora;
  const critico = restanteMs <= UMBRAL_CRITICO_MS;

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 rounded-field px-3 py-2 text-sm font-semibold",
        critico ? "bg-warning-fill text-warning-fill-foreground" : "bg-secondary/10 text-secondary",
        className
      )}
    >
      <ClockIcon className={critico ? "text-warning-fill-foreground" : "text-secondary"} />
      <span>Tu reserva expira en {formatearRestante(restanteMs)}</span>
    </div>
  );
}
