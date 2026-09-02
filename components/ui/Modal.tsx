"use client";

import { useEffect, useId, useRef } from "react";
import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { useIsMounted } from "@/lib/useIsMounted";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Botones del pie (p. ej. Cancelar + Confirmar). */
  footer?: ReactNode;
  /**
   * Bloquea el cierre por Escape y por clic en el fondo oscurecido. Para
   * modales donde un clic accidental no debe cancelar la operación (pago).
   */
  preventDismiss?: boolean;
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  preventDismiss = false,
  className,
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Refs en vez de dependencias del efecto: onClose suele ser un arrow
  // function nuevo en cada render del padre. Si el efecto dependiera de él,
  // se reiniciaría (limpieza + setup) en cada render mientras el modal está
  // abierto, y la limpieza devolvería el foco de más, rompiendo la trampa.
  // Se sincronizan en un efecto (no durante el render) porque mutar un ref
  // en el cuerpo del componente ya no lo acepta el linter de hooks.
  const onCloseRef = useRef(onClose);
  const preventDismissRef = useRef(preventDismiss);
  useEffect(() => {
    onCloseRef.current = onClose;
    preventDismissRef.current = preventDismiss;
  });

  const mounted = useIsMounted();

  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const container = dialogRef.current;
    const [firstFocusable] = container ? getFocusableElements(container) : [];
    (firstFocusable ?? container)?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (!preventDismissRef.current) {
          event.preventDefault();
          onCloseRef.current();
        }
        return;
      }

      if (event.key !== "Tab" || !container) return;
      const focusable = getFocusableElements(container);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [open]);

  if (!open || !mounted) return null;

  function handleBackdropClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (preventDismiss) return;
    if (event.target === event.currentTarget) onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/50" aria-hidden="true" onClick={handleBackdropClick} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "relative w-full max-w-md rounded-modal bg-white p-6 shadow-high focus:outline-none",
          className
        )}
      >
        <h2 id={titleId} className="text-lg font-semibold text-navy">
          {title}
        </h2>
        <div className="mt-3 text-sm text-navy/80">{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
