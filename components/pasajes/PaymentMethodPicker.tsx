import { cn } from "@/lib/cn";
import { CreditCardIcon, PhoneIcon } from "@/components/ui/icons";
import type { MetodoPago } from "@/components/pasajes/PurchaseProvider";

const METODOS: { value: MetodoPago; label: string; Icon: typeof PhoneIcon }[] = [
  { value: "yape", label: "Yape", Icon: PhoneIcon },
  { value: "plin", label: "Plin", Icon: PhoneIcon },
  { value: "tarjeta", label: "Tarjeta", Icon: CreditCardIcon },
];

export interface PaymentMethodPickerProps {
  value: MetodoPago | null;
  onChange: (metodo: MetodoPago) => void;
  errorText?: string;
}

// Sin colores de marca para Yape/Plin: el skill no define tokens propios
// para pasarelas de pago, y reproducir el morado/turquesa exacto de cada
// app sería inventar un valor de diseño. Las tres opciones comparten el
// mismo tratamiento (azul secundario al seleccionar) y se distinguen por
// ícono y etiqueta, no por color de marca.
export function PaymentMethodPicker({ value, onChange, errorText }: PaymentMethodPickerProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-navy">Método de pago</span>
      <div role="radiogroup" aria-label="Método de pago" className="grid grid-cols-3 gap-2">
        {METODOS.map((metodo) => {
          const selected = value === metodo.value;
          return (
            <button
              key={metodo.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(metodo.value)}
              className={cn(
                "flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-field border-2 px-2 py-3 text-sm font-semibold transition",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary",
                selected
                  ? "border-secondary bg-secondary/5 text-secondary"
                  : "border-navy/15 text-navy/70 hover:border-navy/30"
              )}
            >
              <metodo.Icon />
              {metodo.label}
            </button>
          );
        })}
      </div>
      {errorText && <p className="text-sm text-error-text">{errorText}</p>}
    </div>
  );
}
