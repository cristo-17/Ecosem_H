"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LockIcon,
} from "@/components/ui/icons";

const WEEKDAY_LABELS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

export interface DatePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  helperText?: string;
  errorText?: string;
  /** Mismo significado que en Input/Select: valor ya definido, visible pero no editable. */
  locked?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  /** Solo para documentación/styleguide: monta el calendario ya expandido. */
  initialOpen?: boolean;
  /**
   * Fechas fuera de [minDate, maxDate] se muestran deshabilitadas: no se
   * pueden clickear ni seleccionar con Enter/Espacio. La regla de negocio
   * (no vender pasajes para fechas pasadas) la aplica quien use el
   * componente pasando minDate, no es un default de este primitivo.
   */
  minDate?: Date;
  maxDate?: Date;
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatTriggerLabel(date: Date) {
  // Formato numérico estricto DD/MM/YYYY: un formato con nombre de mes/día
  // de la semana se corta en pantallas móviles angostas.
  const parts = new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(date);
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  return `${day}/${month}/${year}`;
}

function formatMonthHeading(date: Date) {
  return new Intl.DateTimeFormat("es-PE", { month: "long", year: "numeric" })
    .formatToParts(date)
    .map((part) =>
      part.type === "month" ? capitalize(part.value) : part.value,
    )
    .join("");
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function addDays(date: Date, delta: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + delta);
  return next;
}

function isSameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isDateOutOfRange(date: Date, minDate?: Date, maxDate?: Date) {
  const day = startOfDay(date);
  if (minDate && day < startOfDay(minDate)) return true;
  if (maxDate && day > startOfDay(maxDate)) return true;
  return false;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getWeeks(viewMonth: Date): Array<Array<Date | null>> {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = new Date(year, month, 1).getDay();

  const days: Array<Date | null> = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, i) => new Date(year, month, i + 1),
    ),
  ];
  while (days.length % 7 !== 0) days.push(null);

  const weeks: Array<Array<Date | null>> = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

export function DatePicker({
  label,
  value,
  onChange,
  helperText,
  errorText,
  locked = false,
  disabled = false,
  id,
  className,
  initialOpen = false,
  minDate,
  maxDate,
}: DatePickerProps) {
  const reactId = useId();
  const triggerId = id ?? reactId;
  const dialogId = `${triggerId}-dialog`;
  const helperId = `${triggerId}-helper`;
  const hasError = Boolean(errorText);
  const isInteractive = !disabled && !locked;

  const today = new Date();
  const [open, setOpen] = useState(initialOpen);
  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(value ?? today),
  );
  const [focusedDate, setFocusedDate] = useState(() => value ?? today);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const button = gridRef.current?.querySelector<HTMLButtonElement>(
      `[data-date="${dateKey(focusedDate)}"]`,
    );
    button?.focus();
  }, [open, focusedDate, viewMonth]);

  function openCalendar() {
    if (!isInteractive) return;
    const base = value ?? today;
    setViewMonth(startOfMonth(base));
    setFocusedDate(base);
    setOpen(true);
  }

  function closeCalendar() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function selectDate(date: Date) {
    if (isDateOutOfRange(date, minDate, maxDate)) return;
    onChange(date);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function moveFocus(date: Date) {
    if (
      date.getMonth() !== viewMonth.getMonth() ||
      date.getFullYear() !== viewMonth.getFullYear()
    ) {
      setViewMonth(startOfMonth(date));
    }
    setFocusedDate(date);
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!isInteractive || open) return;
    if (["ArrowDown", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      openCalendar();
    }
  }

  function handleDayKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    date: Date,
  ) {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        moveFocus(addDays(date, 1));
        break;
      case "ArrowLeft":
        event.preventDefault();
        moveFocus(addDays(date, -1));
        break;
      case "ArrowDown":
        event.preventDefault();
        moveFocus(addDays(date, 7));
        break;
      case "ArrowUp":
        event.preventDefault();
        moveFocus(addDays(date, -7));
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        selectDate(date);
        break;
      case "Escape":
        event.preventDefault();
        closeCalendar();
        break;
    }
  }

  const weeks = getWeeks(viewMonth);

  return (
    <div className="flex w-full flex-col gap-1" ref={rootRef}>
      <label
        htmlFor={triggerId}
        className="text-sm font-medium text-text-primary"
      >
        {label}
      </label>
      <div className="relative">
        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          role="combobox"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={dialogId}
          aria-invalid={hasError}
          aria-describedby={helperText || errorText ? helperId : undefined}
          disabled={disabled}
          onClick={() => (open ? closeCalendar() : openCalendar())}
          onKeyDown={handleTriggerKeyDown}
          className={cn(
            "flex h-12 w-full items-center justify-between gap-2 rounded-md border bg-white px-3 text-left text-sm sm:text-base text-text-primary transition",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary",
            "disabled:cursor-not-allowed disabled:opacity-40",
            locked &&
              "cursor-default border-transparent bg-navy/5 pr-11 text-text-secondary",
            !locked && hasError && "border-primary",
            !locked && !hasError && "border-border-default",
            className,
          )}
        >
          <span className={cn("truncate", !value && "text-text-secondary")}>
            {value ? formatTriggerLabel(value) : "Selecciona una fecha"}
          </span>
          {locked ? (
            <LockIcon className="absolute top-1/2 right-4 -translate-y-1/2" />
          ) : (
            <CalendarIcon />
          )}
        </button>

        {/*
          z-20: capa de popups de campo (comparte nivel con el listbox de
          Select). No empuja layout porque es position:absolute — flota sobre
          lo que tenga debajo o al costado dentro de su propio contenedor.
          Reservar z-40+ para Modal/Toast cuando se construyan.
        */}
        {open && (
          <div
            id={dialogId}
            role="dialog"
            aria-label="Elegir fecha"
            className="absolute z-20 mt-1 w-max rounded-md border border-border-default bg-white p-3 shadow-medium"
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                aria-label="Mes anterior"
                onClick={() => setViewMonth((m) => addMonths(m, -1))}
                className="flex size-11 items-center justify-center rounded-md hover:bg-navy/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
              >
                <ChevronLeftIcon />
              </button>
              <p className="text-sm font-semibold text-text-primary">
                {formatMonthHeading(viewMonth)}
              </p>
              <button
                type="button"
                aria-label="Mes siguiente"
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
                className="flex size-11 items-center justify-center rounded-md hover:bg-navy/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
              >
                <ChevronRightIcon />
              </button>
            </div>

            <table ref={gridRef} className="w-full border-collapse">
              <thead>
                <tr>
                  {WEEKDAY_LABELS.map((weekday) => (
                    <th
                      key={weekday}
                      scope="col"
                      className="pb-1 text-center text-xs font-medium text-text-secondary"
                    >
                      {weekday}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((week, weekIndex) => (
                  <tr key={weekIndex}>
                    {week.map((date, dayIndex) => {
                      if (!date) return <td key={dayIndex} className="p-0.5" />;
                      const isToday = isSameDay(date, today);
                      const isSelected = isSameDay(date, value ?? null);
                      const isFocusTarget = isSameDay(date, focusedDate);
                      const isOutOfRange = isDateOutOfRange(
                        date,
                        minDate,
                        maxDate,
                      );
                      return (
                        <td key={dayIndex} className="p-0.5 text-center">
                          <button
                            type="button"
                            data-date={dateKey(date)}
                            aria-pressed={isSelected}
                            aria-current={isToday ? "date" : undefined}
                            aria-disabled={isOutOfRange}
                            tabIndex={isFocusTarget ? 0 : -1}
                            onClick={() => selectDate(date)}
                            onKeyDown={(event) => handleDayKeyDown(event, date)}
                            className={cn(
                              "mx-auto flex size-11 items-center justify-center rounded-full text-sm text-text-primary transition",
                              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary",
                              isOutOfRange && "cursor-not-allowed text-navy/30",
                              !isOutOfRange &&
                                !isSelected &&
                                isToday &&
                                "ring-2 ring-secondary font-semibold",
                              !isOutOfRange &&
                                isSelected &&
                                "bg-secondary text-white font-semibold",
                              !isOutOfRange && !isSelected && "hover:bg-navy/5",
                            )}
                          >
                            {date.getDate()}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {hasError ? (
        <p id={helperId} className="text-sm text-error-text">
          {errorText}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-sm text-text-secondary">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
