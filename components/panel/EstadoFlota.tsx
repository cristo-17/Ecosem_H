"use client";
import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { SearchOffIcon } from "@/components/ui/icons";
import { mensajeFlota } from "@/lib/api/flota";
export function useDatosFlota<T>(cargar: () => Promise<T>) {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [cargando, setCargando] = useState(true);
  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setDatos(await cargar());
    }
    catch (e) {
      setError(e);
    }
    finally {
      setCargando(false);
    }
  }, [cargar]);
  useEffect(() => {
    let activo = true;
    cargar().then(resultado => {
      if (activo)
        setDatos(resultado);
    })
      .catch(e => {
        if (activo)
          setError(e);
      })
      .finally(() => {
        if (activo)
          setCargando(false);
      });
    return () => { activo = false; };
  }, [cargar]);
  return { datos, error, cargando, recargar };
}
export function EstadoFlota({ cargando, error, recargar }: {
  cargando: boolean;
  error: unknown;
  recargar: () => void;
}) {
  if (cargando)
    return <div className="space-y-4">
      <Skeleton variant="card" />
      <Skeleton variant="card" />
    </div>;
  const mensaje = error ? mensajeFlota(error) : null;
  return <EmptyState icon={<SearchOffIcon className="size-8" />} title={mensaje?.titulo ?? "Sin registros"} description={mensaje?.descripcion ?? "Actualiza la consulta o vuelve al panel para revisar otra sección."} actionLabel="Actualizar consulta" onAction={recargar} />;
}
