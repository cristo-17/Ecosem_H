"use client";

import { useId, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export interface AccordionItemProps {
  pregunta: string;
  children: ReactNode;
  /** Abierta por defecto — típicamente solo la primera de cada grupo. */
  defaultOpen?: boolean;
}

/**
 * `<button aria-expanded>` + panel asociado por `aria-controls`/`id`, no
 * `<details>`: el prompt pide explícitamente ese patrón para que el
 * acordeón use el lenguaje visual del skill (radios, tipografía, foco) en
 * vez del control nativo sin estilar. Cada botón es focuseable y
 * activable con Enter/Espacio de forma nativa, así que "navegable por
 * teclado" no necesita manejo propio de flechas.
 */
export function AccordionItem({ pregunta, children, defaultOpen = false }: AccordionItemProps) {
  const [abierto, setAbierto] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className="border-b border-navy/10 last:border-b-0">
      <h3>
        <button
          type="button"
          aria-expanded={abierto}
          aria-controls={panelId}
          onClick={() => setAbierto((valor) => !valor)}
          className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium text-navy transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary sm:text-base"
        >
          <span>{pregunta}</span>
          <ChevronDownIcon className={cn("shrink-0", abierto && "rotate-180")} />
        </button>
      </h3>
      <div id={panelId} hidden={!abierto} className="pb-4 text-sm text-navy/70">
        {children}
      </div>
    </div>
  );
}
