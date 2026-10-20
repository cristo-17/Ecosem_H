"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonShape } from "@/components/ui/Skeleton";
import { EncomiendaTimeline, badgeDeEncomienda } from "@/components/ui/EncomiendaTimeline";
import { ExclamationIcon, SearchOffIcon, TrackIcon } from "@/components/ui/icons";
import type { ParcelTrackingResponse } from "@/lib/types/contratos-frontend";
import { ApiError } from "@/lib/api/cliente";
import type { MensajeError } from "@/lib/api/compra";
import { mensajeEncomienda, rastrear } from "@/lib/api/encomiendas";

type Estado =
  | { tipo: "inicial" }
  | { tipo: "cargando" }
  | { tipo: "no-encontrado"; mensaje: MensajeError }
  | { tipo: "error"; mensaje: MensajeError }
  | { tipo: "listo"; encomienda: ParcelTrackingResponse };

/**
 * Rastreo público por número de guía: sin cuenta, para quien envía y para
 * quien recibe. svc-encomiendas devuelve solo ruta, estado, peso facturable y
 * eventos; ni nombres, ni documentos, ni teléfonos. La guía puede ir en la
 * URL (?guia=): no es un dato personal.
 */
export function RastrearEncomiendaView() {
  const guiaInicial = useSearchParams().get("guia") ?? "";
  const [guia, setGuia] = useState(guiaInicial);
  const [estado, setEstado] = useState<Estado>(
    guiaInicial ? { tipo: "cargando" } : { tipo: "inicial" },
  );
  const [errorGuia, setErrorGuia] = useState<string | undefined>();
  const controladorRef = useRef<AbortController | null>(null);

  /** Pide la guía; solo cambia el estado cuando llega la respuesta. */
  function consultar(valor: string) {
    controladorRef.current?.abort();
    const controlador = new AbortController();
    controladorRef.current = controlador;
    return rastrear(valor, { signal: controlador.signal }).then(
      (encomienda) => {
        if (!controlador.signal.aborted) setEstado({ tipo: "listo", encomienda });
      },
      (error: unknown) => {
        if (controlador.signal.aborted) return;
        const noEncontrada =
          error instanceof ApiError &&
          (error.codigo === "NOT_FOUND" || error.codigo === "TRACKING_CODE_INVALID");
        setEstado({
          tipo: noEncontrada ? "no-encontrado" : "error",
          mensaje: mensajeEncomienda(error),
        });
      },
    );
  }

  function buscar(valor: string) {
    setEstado({ tipo: "cargando" });
    return consultar(valor);
  }

  useEffect(() => {
    // Solo al montar, con la guía de la URL: editar el campo no vuelve a buscar.
    // Con guía en la URL el estado ya arranca en "cargando".
    if (guiaInicial) void consultar(guiaInicial);
    return () => controladorRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!guia.trim()) {
      setErrorGuia("Escribe el número de guía");
      return;
    }
    setErrorGuia(undefined);
    void buscar(guia);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="text-xl font-semibold text-navy sm:text-2xl">Rastrear Encomienda</h1>
      <p className="mt-2 text-sm text-navy/70">
        Ingresa tu número de guía para ver en qué punto de la ruta se encuentra.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 flex items-end gap-3">
        <Input
          label="Número de guía"
          placeholder="Ej: EH-7K3M-Q9TB"
          autoComplete="off"
          autoCapitalize="characters"
          value={guia}
          onChange={(evento) => setGuia(evento.target.value)}
          errorText={errorGuia}
          className="flex-1"
        />
        <Button type="submit" isLoading={estado.tipo === "cargando"}>
          Rastrear
        </Button>
      </form>

      <div className="mt-6">
        {estado.tipo === "inicial" && (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-navy/50">
            <TrackIcon />
            <p className="max-w-xs text-sm">
              Ingresa el número de guía de tu comprobante de envío. Puedes escribirlo con o sin
              guiones.
            </p>
          </div>
        )}

        {estado.tipo === "cargando" && (
          <div role="status" aria-label="Buscando tu encomienda">
            <SkeletonShape variant="card" className="h-40" />
          </div>
        )}

        {estado.tipo === "no-encontrado" && (
          <EmptyState
            icon={<SearchOffIcon />}
            title={estado.mensaje.titulo}
            description="Revisa que el número esté bien escrito, tal como figura en tu comprobante de envío."
            actionLabel="Intentar de nuevo"
            onAction={() => setEstado({ tipo: "inicial" })}
          />
        )}

        {estado.tipo === "error" && (
          <EmptyState
            icon={<ExclamationIcon className="!size-12 !text-primary" />}
            title="No pudimos consultar tu encomienda"
            description={estado.mensaje.descripcion}
            actionLabel="Reintentar"
            onAction={() => void buscar(guia)}
          />
        )}

        {estado.tipo === "listo" && (
          <Card className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-navy/60">
                  Guía {estado.encomienda.trackingCode}
                </p>
                <p className="text-base font-semibold text-navy">
                  {estado.encomienda.origin} → {estado.encomienda.destination}
                </p>
                <p className="mt-0.5 text-xs text-navy/60">
                  Peso facturable: {estado.encomienda.billableWeightKg} kg
                </p>
              </div>
              <Badge status={badgeDeEncomienda(estado.encomienda.status)} />
            </div>

            <div className="border-t border-navy/10 pt-4">
              <EncomiendaTimeline
                estado={estado.encomienda.status}
                eventos={estado.encomienda.events}
              />
            </div>

            {estado.encomienda.status === "en_destino" && (
              <p className="rounded-md bg-info-fill p-3 text-sm text-info-text">
                Ya está en la agencia de destino. Solo puede recogerla la persona registrada como
                destinataria, con su documento de identidad.
              </p>
            )}
          </Card>
        )}
      </div>
    </main>
  );
}
