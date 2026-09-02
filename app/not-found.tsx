import Link from "next/link";
import { SignpostIcon } from "@/components/ui/icons";
import { RUTAS } from "@/lib/routes";

// TopBar y Footer ya se montan en app/layout.tsx, que envuelve a not-found.tsx
// como a cualquier otra página del segmento raíz.
export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-16 text-center">
      <SignpostIcon />
      <h1 className="text-xl font-semibold text-navy sm:text-2xl">Esta página no existe</h1>
      <p className="text-sm text-navy/70">
        Puede que el enlace esté roto o que la dirección haya cambiado. Volvamos a un camino
        conocido.
      </p>
      <Link
        href={RUTAS.inicio}
        className="mt-2 inline-flex h-12 items-center justify-center rounded-field bg-primary px-6 text-base font-medium text-white transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
