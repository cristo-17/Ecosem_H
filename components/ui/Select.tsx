"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CheckIcon, ChevronDownIcon, LockIcon } from "@/components/ui/icons";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label: string;
  options: SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  errorText?: string;
  /** Mismo significado que en Input: valor ya definido, visible pero no editable. */
  locked?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  /** Solo para documentación/styleguide: monta el listado ya expandido. */
  initialOpen?: boolean;
  /** Ícono decorativo a la izquierda del texto (p. ej. pin de ubicación). */
  icon?: ReactNode;
}

export function Select({
  label,
  options,
  value,
  onChange,
  placeholder = "Selecciona una opción",
  helperText,
  errorText,
  locked = false,
  disabled = false,
  id,
  className,
  initialOpen = false,
  icon,
}: SelectProps) {
  const reactId = useId();
  const triggerId = id ?? reactId;
  const listboxId = `${triggerId}-listbox`;
  const helperId = `${triggerId}-helper`;
  const optionId = (index: number) => `${listboxId}-option-${index}`;
  const hasError = Boolean(errorText);
  const isInteractive = !disabled && !locked;

  const [open, setOpen] = useState(initialOpen);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      0,
      options.findIndex((option) => option.value === value),
    ),
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);

  const selected = options.find((option) => option.value === value) ?? null;

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (open)
      optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function openList() {
    if (!isInteractive || options.length === 0) return;
    const currentIndex = options.findIndex((option) => option.value === value);
    setActiveIndex(currentIndex >= 0 ? currentIndex : 0);
    setOpen(true);
  }

  function closeList() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function selectOption(option: SelectOption) {
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!isInteractive) return;

    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openList();
      }
      return;
    }

    switch (event.key) {
      case "Escape":
        event.preventDefault();
        closeList();
        break;
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((i) => Math.min(options.length - 1, i + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case "Enter":
      case " ": {
        event.preventDefault();
        const option = options[activeIndex];
        if (option) selectOption(option);
        break;
      }
    }
  }

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
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={open ? optionId(activeIndex) : undefined}
          aria-invalid={hasError}
          aria-describedby={helperText || errorText ? helperId : undefined}
          disabled={disabled}
          onClick={() => (open ? closeList() : openList())}
          onKeyDown={handleTriggerKeyDown}
          className={cn(
            "flex h-12 w-full items-center justify-between gap-2 rounded-md border bg-white text-left text-base text-text-primary transition",
            icon ? "pr-4 pl-11" : "px-4",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary",
            "disabled:cursor-not-allowed disabled:opacity-40",
            locked &&
              "cursor-default border-transparent bg-navy/5 pr-11 text-text-secondary",
            !locked && hasError && "border-primary",
            !locked && !hasError && "border-border-default",
            className,
          )}
        >
          {icon && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
            >
              {icon}
            </span>
          )}
          <span className={cn("truncate", !selected && "text-text-secondary")}>
            {selected ? selected.label : placeholder}
          </span>
          {locked ? (
            <LockIcon className="absolute top-1/2 right-4 -translate-y-1/2" />
          ) : (
            <ChevronDownIcon className={open ? "rotate-180" : undefined} />
          )}
        </button>

        {open && (
          <ul
            id={listboxId}
            role="listbox"
            aria-labelledby={triggerId}
            className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border-default bg-white py-1 shadow-medium"
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;
              return (
                <li
                  key={option.value}
                  id={optionId(index)}
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option)}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center justify-between gap-2 px-4 text-base text-text-primary",
                    isActive && "bg-navy/5",
                    isSelected && "font-medium",
                  )}
                >
                  {option.label}
                  {isSelected && <CheckIcon />}
                </li>
              );
            })}
          </ul>
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
