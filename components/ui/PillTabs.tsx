import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface PillTabItem<Value extends string> {
  value: Value;
  label: string;
  Icon: (props: { className?: string }) => ReactNode;
}

export interface PillTabsProps<Value extends string> {
  tabs: PillTabItem<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  "aria-label": string;
  /**
   * Namespace de ids compartido con los `<div role="tabpanel">` que
   * controla cada pestaña (ver `pillTabPanelProps`). El caller lo genera
   * con `useId()` una sola vez y lo pasa a ambos lados — así los ids de
   * botón/panel coinciden sin que PillTabs conozca el contenido del panel.
   */
  baseId: string;
  className?: string;
}

// El skill no define tokens propios para pestañas: se reutiliza el rojo
// primario (acento de la acción principal del sitio) para el estado activo,
// sin inventar un color nuevo. Mismo patrón que ya usaba ServiceTabs en el
// home para Pasajes/Encomiendas, extraído acá para no duplicarlo.
export function PillTabs<Value extends string>({
  tabs,
  value,
  onChange,
  "aria-label": ariaLabel,
  baseId,
  className,
}: PillTabsProps<Value>) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn("flex gap-2", className)}>
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            id={`${baseId}-tab-${tab.value}`}
            aria-selected={selected}
            aria-controls={`${baseId}-panel-${tab.value}`}
            onClick={() => onChange(tab.value)}
            className={cn(
              "flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary",
              selected ? "bg-primary text-white" : "bg-navy/5 text-navy/60 hover:text-navy",
            )}
          >
            <tab.Icon />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/** Ids consistentes con los que genera PillTabs, para el panel asociado a cada tab. */
export function pillTabPanelProps<Value extends string>(baseId: string, value: Value) {
  return {
    role: "tabpanel",
    id: `${baseId}-panel-${value}`,
    "aria-labelledby": `${baseId}-tab-${value}`,
  } as const;
}
