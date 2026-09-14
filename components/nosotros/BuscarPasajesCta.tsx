"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { RUTAS } from "@/lib/routes";

export function BuscarPasajesCta() {
  const router = useRouter();

  return (
    <Button variant="principal" onClick={() => router.push(RUTAS.inicio)}>
      Buscar pasajes
    </Button>
  );
}
