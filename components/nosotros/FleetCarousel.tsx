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
   * si el archivo no existe o no se pudo leer — en ambos casos se muestra
   * el placeholder, nunca una imagen escalada a ciegas.
   */
  dimensiones: DimensionesImagen | null;
}

// Altura fija del carrusel, igual para las 4 fotos: sin ella, cada slide
// tendría una altura distinta (ya no hay object-cover que las fuerce a
// llenar el contenedor) y el carrusel "saltaría" al cambiar de imagen. El
// espacio sobrante alrededor de cada foto (pillarbox/letterbox según su
// proporción) se rellena con un fondo, no queda vacío. Es una altura
// elegida, no calculada desde ninguna foto: con el criterio de "nunca
// escalar hacia arriba", fotos angostas (como las actuales, todas
// verticales de 337 a 808px de ancho) se ven pequeñas dentro, a propósito.
const ALTO_CONTENEDOR = "h-64 sm:h-[420px]";

export interface FleetCarouselProps {
  slides: FleetSlide[];
}

// Mismo timing que el auto-dismiss de Toast (ver components/ui/Toast.tsx) —
// consistencia de producto, no un valor nuevo inventado para el carrusel.
const AUTO_ADVANCE_MS = 5000;

// Slide por transform (no next/image onError): con imágenes locales en
// public/ el evento onError del lado del cliente no es confiable para
// decidir si el archivo existe, así que la existencia y el tamaño real ya
// llegan resueltos desde el Server Component padre vía `slide.dimensiones`.
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
      {/* Tarea 1 — Accesibilidad: anuncia el cambio de imagen a lectores de
          pantalla de forma no intrusiva (aria-live="polite" solo habla cuando
          el usuario no está haciendo otra cosa; sr-only lo mantiene invisible
          al resto de usuarios). */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Imagen {index + 1} de {total} visible
      </div>

      <div className="relative overflow-hidden rounded-md">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide) => (
            <div key={slide.filename} className="w-full shrink-0">
              {/*
                Tarea 2 — Fondo desenfocado cinemático: si existe la imagen,
                se pone una copia suya en absolute inset-0 con object-cover,
                blur-2xl, opacity-40 y scale-110 (el scale evita franjas
                blancas por el blur en los bordes). La imagen principal va
                encima (relative z-10) con object-contain y quality={100}
                para máxima nitidez — sin upscaling (F-003, D-013).

                Si no existe la imagen, se sigue mostrando el placeholder
                sin fondo desenfocado.
              */}
              <div
                className={cn(
                  "relative flex items-center justify-center overflow-hidden rounded-md",
                  ALTO_CONTENEDOR,
                  slide.dimensiones ? "bg-black/5" : "bg-skeleton",
                )}
              >
                {slide.dimensiones ? (
                  <>
                    {/* Capa de fondo desenfocado */}
                    <Image
                      src={`/images/nosotros/${slide.filename}`}
                      alt=""
                      aria-hidden="true"
                      width={slide.dimensiones.width}
                      height={slide.dimensiones.height}
                      quality={60}
                      className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
                    />
                    {/* Imagen principal al frente, nítida y sin recorte */}
                    <Image
                      src={`/images/nosotros/${slide.filename}`}
                      alt={slide.alt}
                      width={slide.dimensiones.width}
                      height={slide.dimensiones.height}
                      quality={100}
                      // relative z-10 para quedar sobre el fondo.
                      // h-auto + max-h-full garantizan que nunca se expanda
                      // más allá de su resolución nativa (F-003).
                      className="relative z-10 h-auto max-h-full w-auto max-w-full object-contain"
                    />
                  </>
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center">
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
