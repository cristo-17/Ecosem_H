"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { useIsMounted } from "@/lib/useIsMounted";
import { CheckIcon, CloseIcon, ExclamationIcon, InfoIcon } from "@/components/ui/icons";

export type ToastType = "success" | "warning" | "error" | "info";

export interface ToastInput {
  type: ToastType;
  title: string;
  description: string;
  /**
   * Milisegundos antes de autocerrar. null = no autocierra. Default 5000.
   * Se ignora en type="error": un pago rechazado no debe autocerrarse aunque
   * se pida un valor explícito, el usuario necesita poder leerlo con calma.
   */
  duration?: number | null;
}

interface ToastItem extends ToastInput {
  id: string;
}

interface ToastContextValue {
  showToast: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}

const TYPE_STYLES: Record<
  ToastType,
  { border: string; role: "status" | "alert"; iconBg: string; iconFg: string; Icon: typeof CheckIcon }
> = {
  success: {
    border: "border-l-success-fill",
    role: "status",
    iconBg: "bg-success-fill",
    iconFg: "!text-white",
    Icon: CheckIcon,
  },
  info: {
    border: "border-l-info-fill",
    role: "status",
    iconBg: "bg-info-fill",
    iconFg: "!text-white",
    Icon: InfoIcon,
  },
  warning: {
    border: "border-l-warning-fill",
    role: "alert",
    iconBg: "bg-warning-fill",
    // Mismo caso que el badge Pendiente y el botón warning: texto/ícono navy
    // sobre ámbar, es la única combinación que pasa AA (ver skill).
    iconFg: "!text-warning-fill-foreground",
    Icon: ExclamationIcon,
  },
  error: {
    border: "border-l-error-fill",
    role: "alert",
    iconBg: "bg-error-fill",
    iconFg: "!text-white",
    Icon: CloseIcon,
  },
};

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  // El de error nunca autocierra, sin importar lo que se haya pedido.
  const duration = toast.type === "error" ? null : (toast.duration ?? 5000);

  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  const remainingRef = useRef(duration ?? 0);
  const startedAtRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hoverRef = useRef(false);
  const focusRef = useRef(false);

  const startTimer = useCallback(() => {
    if (duration == null) return;
    startedAtRef.current = Date.now();
    timeoutRef.current = setTimeout(() => onDismissRef.current(), remainingRef.current);
  }, [duration]);

  const pauseTimer = useCallback(() => {
    if (duration == null) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    remainingRef.current -= Date.now() - startedAtRef.current;
  }, [duration]);

  useEffect(() => {
    startTimer();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [startTimer]);

  function handlePointerEnter() {
    hoverRef.current = true;
    pauseTimer();
  }
  function handlePointerLeave() {
    hoverRef.current = false;
    if (!focusRef.current) startTimer();
  }
  function handleFocus() {
    focusRef.current = true;
    pauseTimer();
  }
  function handleBlur() {
    focusRef.current = false;
    if (!hoverRef.current) startTimer();
  }

  const { border, role, iconBg, iconFg, Icon } = TYPE_STYLES[toast.type];

  return (
    <div
      role={role}
      onMouseEnter={handlePointerEnter}
      onMouseLeave={handlePointerLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn(
        "flex w-full max-w-sm items-start gap-3 rounded-field border-l-4 bg-white p-4 shadow-medium",
        border
      )}
    >
      <span
        aria-hidden="true"
        className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", iconBg)}
      >
        <Icon className={iconFg} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-navy">{toast.title}</p>
        <p className="mt-0.5 truncate text-sm text-navy/70">{toast.description}</p>
      </div>
      <button
        type="button"
        aria-label="Cerrar notificación"
        onClick={onDismiss}
        className="flex size-11 shrink-0 items-center justify-center rounded-field text-navy/50 transition hover:bg-navy/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

export interface ToastProviderProps {
  children: ReactNode;
  /** Cuántos toasts se muestran a la vez. El resto espera en cola. Default 4. */
  maxVisible?: number;
}

export function ToastProvider({ children, maxVisible = 4 }: ToastProviderProps) {
  const [visible, setVisible] = useState<ToastItem[]>([]);
  const queueRef = useRef<ToastItem[]>([]);
  const mounted = useIsMounted();

  const showToast = useCallback(
    (input: ToastInput) => {
      const toast: ToastItem = { ...input, id: crypto.randomUUID() };
      setVisible((prev) => {
        if (prev.length < maxVisible) return [...prev, toast];
        queueRef.current.push(toast);
        return prev;
      });
    },
    [maxVisible]
  );

  const dismissToast = useCallback((id: string) => {
    setVisible((prev) => {
      const next = prev.filter((toast) => toast.id !== id);
      const queued = queueRef.current.shift();
      return queued ? [...next, queued] : next;
    });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
            {visible.map((toast) => (
              <ToastCard key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
