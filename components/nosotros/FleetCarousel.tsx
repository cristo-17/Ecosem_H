"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { ChevronLeftIcon, ChevronRightIcon, ImagePlaceholderIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import type { DimensionesImagen } from "@/lib/imagenNatural";

export interface FleetSlide {
  filename: string;
  alt: string;
  /**
   * Ancho/alto reales leídos en el servidor (lib/imagenNatural.ts), o null
   * si el archivo no existe — muestra placeholder sin romper el layout.
   */
  dimensiones: DimensionesImagen | null;
}

export interface FleetCarouselProps {
  slides: FleetSlide[];
}

// Mismo timing que el auto-dismiss de Toast — consistencia de producto.
const AUTO_ADVANCE_MS = 5000;

/**
 * Devuelve el offset circular más corto entre la slide `i` y la activa.
 * Con 4 slides y activa=0: slide-3 → offset -1 (anterior, no +3).
 * Garantiza que siempre haya como máximo una slide "anterior" y una
 * "siguiente" visibles, sin importar cuántas slides haya en total.
 */
function offsetCircular(i: number, activo: number, total: number): number {
  let diff = i - activo;
  if (diff > total / 2) diff -= total;
  if (diff < -total / 2) diff += total;
  return diff;
}

/**
 * Devuelve las clases Tailwind de posición, escala, opacidad y z-index para
 * una slide según su offset respecto a la activa. Los strings son literales
 * completos para que el scanner de Tailwind los detecte en build time.
 */
function clasesSlide(offset: number): string {
  if (offset === 0) {
    // Activa: centro, frente, escala completa, sombra pronunciada.
    return "z-30 scale-100 opacity-100 translate-x-0 shadow-2xl";
  }
  if (offset === -1) {
    // Anterior: detrás a la izquierda, semitransparente, clickeable.
    return "z-20 scale-[0.85] opacity-75 -translate-x-[65%] md:-translate-x-[55%] cursor-pointer";
  }
  if (offset === 1) {
    // Siguiente: detrás a la derecha, semitransparente, clickeable.
    return "z-20 scale-[0.85] opacity-75 translate-x-[65%] md:translate-x-[55%] cursor-pointer";
  }
  // Resto: completamente ocultas detrás, sin interacción.
  return "z-10 scale-75 opacity-0 pointer-events-none";
}

export function FleetCarousel({ slides }: FleetCarouselProps) {
  const [index, setIndex] = useState(0);
  const total = slides.length;

  function ir(siguiente: number) {
    setIndex(((siguiente % total) + total) % total);
  }

  // ── Auto-avance ──────────────────────────────────────────────────────────
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const hoverRef = useRef(false);
  const focusRef = useRef(false);
  const reducedMotionRef = useRef(false);

  const stopAuto = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const startAuto = useCallback(() => {
    if (reducedMotionRef.current || total <= 1) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setIndex((actual) => (actual + 1) % total);
    }, AUTO_ADVANCE_MS);
  }, [total]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = media.matches;

    function handleMotionChange(event: MediaQueryListEvent) {
      reducedMotionRef.current = event.matches;
      if (event.matches) {
        stopAuto();
      } else if (!hoverRef.current && !focusRef.current) {
        startAuto();
      }
    }

    media.addEventListener("change", handleMotionChange);
    startAuto();
    return () => {
      media.removeEventListener("change", handleMotionChange);
      stopAuto();
    };
  }, [startAuto, stopAuto]);

  function handlePointerEnter() { hoverRef.current = true; stopAuto(); }
  function handlePointerLeave() { hoverRef.current = false; if (!focusRef.current) startAuto(); }
  function handleFocus() { focusRef.current = true; stopAuto(); }
  function handleBlur() { focusRef.current = false; if (!hoverRef.current) startAuto(); }

  return (
    <div
      className="relative z-0 w-full overflow-hidden py-4"
      onMouseEnter={handlePointerEnter}
      onMouseLeave={handlePointerLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {/* Accesibilidad: anuncia el cambio de imagen a lectores de pantalla
          de forma no intrusiva; sr-only lo mantiene invisible visualmente. */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Imagen {index + 1} de {total} visible
      </div>

      {/*
        Contenedor Cover Flow: posicionamiento relativo con altura fija.
        Cada slide es absolute dentro de este contenedor y recibe su
        propio transform calculado por offsetCircular().
        overflow-hidden oculta las slides que quedan fuera del área visible.
      */}
      <div className="relative flex h-[360px] w-full items-center justify-center overflow-hidden sm:h-[440px] md:h-[500px]">
        {slides.map((slide, i) => {
          const offset = offsetCircular(i, index, total);

          // onClick: la slide anterior navega hacia atrás, la siguiente
          // hacia adelante. La activa y las ocultas no tienen handler.
          const clickHandler =
            offset === -1 ? () => ir(index - 1) :
              offset === 1 ? () => ir(index + 1) :
                undefined;

          return (
            <div
              key={slide.filename}
              onClick={clickHandler}
              /*
               * w-[75%] md:w-[60%]: ancho relativo para que las slides
               * adyacentes asomen por detrás de la activa.
               * origin-center: la escala se aplica desde el centro del
               * elemento (no desde la esquina superior izquierda).
               * transition-all duration-500 ease-in-out: animación suave
               * en todas las propiedades al cambiar de slide.
               */
              className={cn(
                "absolute h-full w-[75%] origin-center overflow-hidden rounded-3xl shadow-xl transition-all duration-500 ease-in-out transform-gpu md:w-[60%]",
                clasesSlide(offset),
              )}
              aria-hidden={offset !== 0}
            >
              {slide.dimensiones ? (
                <Image
                  src={`/images/nosotros/${slide.filename}`}
                  alt={offset === 0 ? slide.alt : ""}
                  fill
                  /*
                   * object-cover w-full h-full: rellena el contenedor
                   * completamente recortando bordes si es necesario.
                   */
                  className="h-full w-full object-cover rounded-3xl"
                  quality={90}
                  sizes="(max-width: 768px) 75vw, 60vw"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-3xl bg-skeleton px-4 text-center">
                  <ImagePlaceholderIcon />
                  <span className="text-xs font-medium text-text-secondary">
                    Reemplazar: {slide.filename}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Controles: flechas y dots de paginación */}
      <div className="mt-4 flex items-center justify-between">
        <Button
          type="button"
          variant="terciario"
          aria-label="Imagen anterior"
          onClick={() => ir(index - 1)}
        >
          <ChevronLeftIcon />
        </Button>

        <div className="flex gap-1" role="tablist" aria-label="Seleccionar imagen">
          {slides.map((slide, i) => (
            <button
              key={slide.filename}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Imagen ${i + 1} de ${total}`}
              onClick={() => ir(i)}
              className="flex size-11 items-center justify-center"
            >
              <span
                className={cn(
                  "size-2 rounded-full transition-all duration-300",
                  i === index ? "scale-125 bg-secondary" : "bg-navy/20",
                )}
              />
            </button>
          ))}
        </div>

        <Button
          type="button"
          variant="terciario"
          aria-label="Siguiente imagen"
          onClick={() => ir(index + 1)}
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}
