"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { ChevronLeftIcon, ChevronRightIcon, ImagePlaceholderIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export interface FleetSlide {
  filename: string;
  alt: string;
  /** true si el archivo ya existe en public/images/nosotros (chequeo del server). */
  exists: boolean;
}

export interface FleetCarouselProps {
  slides: FleetSlide[];
}

// Mismo timing que el auto-dismiss de Toast (ver components/ui/Toast.tsx) —
// consistencia de producto, no un valor nuevo inventado para el carrusel.
const AUTO_ADVANCE_MS = 5000;

// Slide por transform (no next/image onError): con imágenes locales en
// public/ el evento onError del lado del cliente no es confiable para
// decidir si el archivo existe, así que la existencia ya llega resuelta
// desde el Server Component padre (fs.existsSync) vía la prop `exists`.
export function FleetCarousel({ slides }: FleetCarouselProps) {
  const [index, setIndex] = useState(0);
  const total = slides.length;

  function ir(siguiente: number) {
    setIndex(((siguiente % total) + total) % total);
  }

  // Auto-avance: mismo criterio de pausa que Toast (hover y foco, con dos
  // refs separados para que soltar el hover mientras sigue con foco -o
  // viceversa- no reanude de más). Los dots ya reflejan `index`, así que el
  // modo automático los mantiene sincronizados sin lógica adicional.
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const hoverRef = useRef(false);
  const focusRef = useRef(false);
  const reducedMotionRef = useRef(false);

  const startAuto = useCallback(() => {
    if (reducedMotionRef.current || total <= 1) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setIndex((actual) => (actual + 1) % total);
    }, AUTO_ADVANCE_MS);
  }, [total]);

  const stopAuto = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

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

  function handlePointerEnter() {
    hoverRef.current = true;
    stopAuto();
  }
  function handlePointerLeave() {
    hoverRef.current = false;
    if (!focusRef.current) startAuto();
  }
  function handleFocus() {
    focusRef.current = true;
    stopAuto();
  }
  function handleBlur() {
    focusRef.current = false;
    if (!hoverRef.current) startAuto();
  }

  return (
    <div
      className="w-full"
      onMouseEnter={handlePointerEnter}
      onMouseLeave={handlePointerLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <div className="relative overflow-hidden rounded-md">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide) => (
            <div key={slide.filename} className="w-full shrink-0">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md">
                {slide.exists ? (
                  <Image
                    src={`/images/nosotros/${slide.filename}`}
                    alt={slide.alt}
                    fill
                    // Ancho real del contenedor: full-bleed hasta el
                    // breakpoint sm (max-w-3xl = 768px con px-4 de la
                    // sección => 32px de margen), y fijo en 736px desde ahí
                    // en adelante (el contenedor deja de crecer con el
                    // viewport). Un "100vw" genérico serviría una imagen
                    // más chica de lo necesario en desktop.
                    sizes="(min-width: 768px) 736px, calc(100vw - 32px)"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-skeleton px-4 text-center">
                    <ImagePlaceholderIcon />
                    <span className="text-xs font-medium text-text-secondary">
                      Reemplazar: {slide.filename}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
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
                  "size-2 rounded-full transition",
                  i === index ? "bg-secondary" : "bg-navy/20",
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
