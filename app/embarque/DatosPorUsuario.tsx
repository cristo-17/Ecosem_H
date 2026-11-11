"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { CANAL_CIERRE_EMBARQUE, seleccionarUsuarioEmbarque } from "@/lib/embarque/usuario";
import { clienteSupabaseNavegador } from "@/lib/supabase/navegador";

/** No monta lectores ni sincronizadores hasta seleccionar la base del usuario. */
export function DatosPorUsuario({ userId, children }: { userId: string; children: ReactNode }) {
  const [listo, setListo] = useState(false);
  useEffect(() => {
    seleccionarUsuarioEmbarque(userId);
    const bloquear = () => {
      seleccionarUsuarioEmbarque(null);
      setListo(false);
      window.location.replace("/ingresar?siguiente=%2Fembarque");
    };
    const canal = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CANAL_CIERRE_EMBARQUE) : null;
    if (canal) canal.onmessage = bloquear;
    const alAlmacenar = (evento: StorageEvent) => {
      if (evento.key === CANAL_CIERRE_EMBARQUE) bloquear();
    };
    window.addEventListener("storage", alAlmacenar);
    window.addEventListener(CANAL_CIERRE_EMBARQUE, bloquear);
    const { data } = clienteSupabaseNavegador().auth.onAuthStateChange((evento: AuthChangeEvent, sesion: Session | null) => {
      // Un shell offline puede pertenecer a la sesión anterior. No mostrarlo
      // hasta contrastarlo con la sesión local actual (también entre pestañas).
      if (evento === "INITIAL_SESSION" && sesion?.user.id === userId) setListo(true);
      if (evento === "SIGNED_OUT" || (evento === "INITIAL_SESSION" && !sesion) || (sesion && sesion.user.id !== userId)) {
        bloquear();
      }
    });
    return () => {
      data.subscription.unsubscribe();
      canal?.close();
      window.removeEventListener("storage", alAlmacenar);
      window.removeEventListener(CANAL_CIERRE_EMBARQUE, bloquear);
      seleccionarUsuarioEmbarque(null);
    };
  }, [userId]);
  return listo ? children : <p role="status">Preparando los datos de embarque...</p>;
}
