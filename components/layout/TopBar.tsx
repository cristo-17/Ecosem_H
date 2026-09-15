"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { useIsMounted } from "@/lib/useIsMounted";
import { RUTAS } from "@/lib/routes";
import { cerrarSesion } from "@/lib/auth/acciones";
import { CloseIcon, MenuIcon, UserIcon } from "@/components/ui/icons";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  );
}

// "Mi perfil" reemplaza a "Mis Viajes"/"Mis compras" como entrada de
// navegación: el historial de viajes y de encomiendas ahora vive junto,
// dentro del perfil (docs/prompts/02-perfil-usuario.md). Solo aparece con
// sesión iniciada.
function entradasMenu(haySesion: boolean) {
  return [
    { href: RUTAS.inicio, label: "Comprar Pasajes" },
    ...(haySesion ? [{ href: RUTAS.miPerfil, label: "Mi Perfil" }] : []),
    { href: RUTAS.enviarEncomienda, label: "Enviar Encomienda" },
    { href: RUTAS.rastrearEncomienda, label: "Rastrear Encomienda" },
    { href: RUTAS.nosotros, label: "Nosotros" },
    { href: RUTAS.ayuda, label: "Ayuda" },
  ];
}

export interface TopBarProps {
  /** Viene de la cookie de sesión (lib/auth/sesion.ts), leída en app/layout.tsx. */
  haySesion: boolean;
}

export function TopBar({ haySesion }: TopBarProps) {
  const router = useRouter();
  const openRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const mounted = useIsMounted();

  const [open, setOpenState] = useState(false);
  const entradas = entradasMenu(haySesion);

  useEffect(() => {
    if (!open) return;

    const trigger = openRef.current;
    document.body.style.overflow = "hidden";
    const container = dialogRef.current;
    const [firstFocusable] = container ? getFocusableElements(container) : [];
    firstFocusable?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpenState(false);
        return;
      }
      if (event.key !== "Tab" || !container) return;
      const focusable = getFocusableElements(container);
      if (focusable.length === 0) return;
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
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
      trigger?.focus();
    };
  }, [open, setOpenState]);

  function closeMenu() {
    setOpenState(false);
  }

  async function handleCerrarSesion() {
    closeMenu();
    await cerrarSesion();
    router.push(RUTAS.inicio);
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 md:h-[72px] items-center gap-1 md:gap-0 border-b border-border-default bg-white px-2 md:px-12">
      {/* 1. BOTÓN HAMBURGUESA (MÓVIL) - Oculto en escritorio con 'md:hidden' */}
      <button
        ref={openRef}
        type="button"
        aria-label="Abrir menú"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpenState(true)}
        className="flex size-11 items-center justify-center rounded-md transition hover:bg-navy/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary md:hidden"
      >
        <MenuIcon />
      </button>

      {/* 2. LOGO (MÓVIL Y ESCRITORIO) - Actualizado con flex y gap */}
      <Link
        href={RUTAS.inicio}
        aria-label="Ir al inicio"
        className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-md md:mr-8 ml-auto md:ml-0"
      >
        <Image
          src="/ecosemh-mark.png"
          alt=""
          width={40}
          height={36}
          className="object-contain"
          priority
        />
        <Image
          src="/ecosemh-wordmark.png"
          alt="Ecosem H"
          width={130}
          height={20}
          className="object-contain"
          priority
        />
      </Link>

      {/* 3. NAVEGACIÓN DE ESCRITORIO - Oculta en móvil con 'hidden md:flex' */}
      <div className="hidden md:flex items-center gap-6">
        <Link
          href={RUTAS.inicio}
          className="text-sm font-semibold text-text-primary hover:text-primary transition"
        >
          Pasajes
        </Link>
        <Link
          href={RUTAS.enviarEncomienda}
          className="text-sm font-semibold text-text-primary hover:text-primary transition"
        >
          Encomiendas
        </Link>
        <Link
          href={RUTAS.rastrearEncomienda}
          className="text-sm font-semibold text-text-primary hover:text-primary transition"
        >
          Rastreo
        </Link>
        <Link
          href={RUTAS.nosotros}
          className="text-sm font-semibold text-text-primary hover:text-primary transition"
        >
          Nosotros
        </Link>
      </div>

      {/* Espaciador flexible para empujar las acciones a la derecha en escritorio */}
      <div className="hidden md:flex flex-1" />

      {/* 4. ACCIONES DE ESCRITORIO A LA DERECHA */}
      <div className="hidden md:flex items-center gap-6 ml-auto">
        {haySesion ? (
          <Link
            href={RUTAS.miPerfil}
            className="flex h-10 items-center gap-2 rounded-pill px-4 text-sm font-semibold text-text-primary transition hover:bg-navy/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
          >
            <UserIcon />
            Mi perfil
          </Link>
        ) : (
          <Button
            variant="principal"
            className="h-10 px-6 min-h-0 text-sm"
            onClick={() => router.push(RUTAS.ingresar)}
          >
            Ingresar
          </Button>
        )}
      </div>

      {/* 5. ÍCONO USUARIO (MÓVIL) - Oculto en escritorio con 'md:hidden' */}
      {haySesion ? (
        <Link
          href={RUTAS.miPerfil}
          aria-label="Mi perfil"
          className="flex size-11 items-center justify-center rounded-md transition hover:bg-navy/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary md:hidden ml-auto"
        >
          <UserIcon />
        </Link>
      ) : (
        <Button
          variant="principal"
          className="h-9 px-4 min-h-0 text-xs md:hidden ml-auto"
          onClick={() => router.push(RUTAS.ingresar)}
        >
          Ingresar
        </Button>
      )}

      {/* === MENÚ MÓVIL A PANTALLA COMPLETA (PORTAL) === */}
      {open &&
        mounted &&
        createPortal(
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menú principal"
            className="fixed inset-0 z-40 flex flex-col bg-navy p-4"
          >
            <div className="flex h-14 items-center justify-end">
              <button
                type="button"
                aria-label="Cerrar menú"
                onClick={closeMenu}
                className="flex size-11 items-center justify-center rounded-field transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <CloseIcon className="!size-6 !text-white" />
              </button>
            </div>

            <nav
              aria-label="Menú principal"
              className="mt-4 flex flex-1 flex-col"
            >
              <ul className="flex flex-col gap-1">
                {entradas.map((entrada) => (
                  <li key={entrada.href}>
                    <Link
                      href={entrada.href}
                      onClick={closeMenu}
                      className="flex min-h-11 items-center rounded-field px-3 text-lg font-medium text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      {entrada.label}
                    </Link>
                  </li>
                ))}
              </ul>

              {/*
                Separado abajo en color de advertencia (skill). Se usa
                text-warning-fill (el ámbar más claro), no text-warning-text:
                ese tono más oscuro está pensado para texto sobre blanco, y
                aquí el fondo es navy oscuro — el ámbar claro es el que
                mantiene buen contraste sobre navy.

                pb-8 (en vez de pb-2): con poco padding, "Cerrar Sesión"
                quedaba pegado al borde inferior de la pantalla y la barra
                de gestos/navegador de Android lo tapaba. safe-area-inset
                cubre además los equipos con home indicator.

                Solo con sesión iniciada: sin sesión no hay nada que cerrar.
              */}
              {haySesion && (
                <div
                  className="mt-auto border-t border-white/10 pt-4 pb-8"
                  style={{
                    paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleCerrarSesion}
                    className={cn(
                      "flex min-h-11 w-full items-center rounded-field px-3 text-left text-lg font-medium transition",
                      "text-warning-fill hover:bg-white/10",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                    )}
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </nav>
          </div>,
          document.body,
        )}
    </header>
  );
}
