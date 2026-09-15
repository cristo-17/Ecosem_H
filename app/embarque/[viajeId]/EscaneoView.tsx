"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonShape } from "@/components/ui/Skeleton";
import { CheckIcon, ChevronLeftIcon, CloseIcon, ExclamationIcon, SearchOffIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { formatHora12 } from "@/lib/format";
import { RUTAS } from "@/lib/routes";
import { contarEscaneos, obtenerManifiesto } from "@/lib/embarque/db";
import { parsearContenidoQr, validarEscaneo } from "@/lib/embarque/validar";
import { EVENTO_NUEVO_ESCANEO } from "@/lib/embarque/useEstadoSincronizacion";
import type { ManifiestoLocal, ResultadoEscaneo } from "@/lib/embarque/tipos";
import type { DetectorDeCodigos } from "@/lib/embarque/tiposNavegador";

type Estado = "cargando" | "sin-manifiesto" | "listo";
type EstadoCamara = "verificando" | "activa" | "no-disponible";

const ENFRIAMIENTO_MISMO_CODIGO_MS = 2500;

export interface EscaneoViewProps {
  viajeId: string;
}

export function EscaneoView({ viajeId }: EscaneoViewProps) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>("cargando");
  const [manifiesto, setManifiesto] = useState<ManifiestoLocal | null>(null);
  const [totalEmbarcados, setTotalEmbarcados] = useState(0);
  const [resultado, setResultado] = useState<ResultadoEscaneo | null>(null);
  const [codigoManual, setCodigoManual] = useState("");
  const [errorManual, setErrorManual] = useState<string | undefined>();
  const [estadoCamara, setEstadoCamara] = useState<EstadoCamara>("verificando");
  const [mensajeCamara, setMensajeCamara] = useState<string | undefined>();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ultimoCodigoRef = useRef<string | null>(null);
  const procesandoRef = useRef(false);

  // Carga inicial: el manifiesto tiene que estar ya descargado (paso
  // anterior en /embarque) — esta pantalla nunca pide red.
  useEffect(() => {
    let activo = true;
    (async () => {
      const local = await obtenerManifiesto(viajeId);
      if (!activo) return;
      if (!local) {
        setEstado("sin-manifiesto");
        return;
      }
      setManifiesto(local);
      setTotalEmbarcados(await contarEscaneos(viajeId));
      setEstado("listo");
    })();
    return () => {
      activo = false;
    };
  }, [viajeId]);

  async function aplicarResultado(res: ResultadoEscaneo) {
    setResultado(res);
    if (res.tipo === "valido") {
      setTotalEmbarcados((total) => total + 1);
      window.dispatchEvent(new Event(EVENTO_NUEVO_ESCANEO));
    }
  }

  async function procesarTextoDetectado(texto: string) {
    if (procesandoRef.current) return;
    procesandoRef.current = true;
    try {
      const parsed = parsearContenidoQr(texto);
      if (!parsed) {
        await aplicarResultado({ tipo: "invalido", motivo: "Código QR con formato desconocido" });
        return;
      }
      const res = await validarEscaneo(viajeId, parsed);
      await aplicarResultado(res);
    } finally {
      procesandoRef.current = false;
    }
  }

  // Cámara: BarcodeDetector nativo (Chrome/Android — el runtime real de
  // esta PWA instalada). Si el navegador no lo soporta, o si getUserMedia
  // falla o se niega el permiso, se cae a "no-disponible" y queda la
  // entrada manual como único camino — pedido explícito del prompt ("como
  // respaldo si la cámara falla"), no algo que solo pasa en el peor caso.
  useEffect(() => {
    if (estado !== "listo") return;
    let activo = true;
    let cuadro: number;

    async function iniciar() {
      if (typeof window === "undefined" || !window.BarcodeDetector) {
        setEstadoCamara("no-disponible");
        setMensajeCamara("Este navegador no puede leer QR por cámara. Usa el código manual.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (!activo) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        setEstadoCamara("activa");
        bucle(detector);
      } catch {
        setEstadoCamara("no-disponible");
        setMensajeCamara("No se pudo usar la cámara. Usa el código manual.");
      }
    }

    function bucle(detector: DetectorDeCodigos) {
      cuadro = requestAnimationFrame(async () => {
        if (!activo) return;
        const video = videoRef.current;
        if (video && video.readyState >= 2) {
          try {
            const codigos = await detector.detect(video);
            const valor = codigos[0]?.rawValue;
            if (valor && valor !== ultimoCodigoRef.current) {
              ultimoCodigoRef.current = valor;
              await procesarTextoDetectado(valor);
              setTimeout(() => {
                ultimoCodigoRef.current = null;
              }, ENFRIAMIENTO_MISMO_CODIGO_MS);
            }
          } catch {
            // detect() puede fallar cuadro a cuadro sin que sea un error real
            // (video todavía no tiene frame listo, etc.) — se reintenta solo.
          }
        }
        bucle(detector);
      });
    }

    iniciar();
    return () => {
      activo = false;
      cancelAnimationFrame(cuadro);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, viajeId]);

  function handleSubmitManual(event: FormEvent) {
    event.preventDefault();
    const codigo = codigoManual.trim();
    if (!codigo) {
      setErrorManual("Ingresa el código de reserva");
      return;
    }
    setErrorManual(undefined);
    validarEscaneo(viajeId, { codigo }).then(aplicarResultado);
    setCodigoManual("");
  }

  if (estado === "cargando") {
    return (
      <div role="status" aria-label="Cargando manifiesto" className="flex flex-col gap-4">
        <SkeletonShape variant="text" lines={2} className="max-w-sm" />
        <SkeletonShape variant="card" className="h-64" />
      </div>
    );
  }

  if (estado === "sin-manifiesto" || !manifiesto) {
    return (
      <EmptyState
        icon={<SearchOffIcon />}
        title="No hay un manifiesto descargado para este viaje"
        description="Vuelve a la lista de viajes y descárgalo mientras tengas señal."
        actionLabel="Volver a viajes"
        onAction={() => router.push(RUTAS.embarque)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Button variant="terciario" className="w-fit" onClick={() => router.push(RUTAS.embarque)}>
        <ChevronLeftIcon />
        Cambiar de viaje
      </Button>

      <Card className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-navy">
            {manifiesto.origen} → {manifiesto.destino}
          </p>
          <p className="text-xs text-navy/60">Bus {manifiesto.placaBus}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-navy">
            {totalEmbarcados}/{manifiesto.pasajeros.length}
          </p>
          <p className="text-xs text-navy/60">embarcados</p>
        </div>
      </Card>

      {estadoCamara === "activa" && (
        <div className="relative overflow-hidden rounded-modal bg-navy">
          <video ref={videoRef} muted playsInline className="aspect-square w-full object-cover" />
        </div>
      )}

      {estadoCamara !== "activa" && (
        <div className="rounded-modal bg-navy/5 p-4 text-center text-sm text-navy/70">
          {mensajeCamara ?? "Activando la cámara..."}
        </div>
      )}

      {resultado && <BannerResultado resultado={resultado} onCerrar={() => setResultado(null)} />}

      <Card>
        <h2 className="text-sm font-semibold text-navy">Entrada manual</h2>
        <p className="mt-1 text-xs text-navy/60">
          Respaldo si la cámara falla: escribe el código de reserva que aparece impreso en el boleto.
        </p>
        <form onSubmit={handleSubmitManual} noValidate className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            label="Código de reserva"
            placeholder="ECH-XXXXXX"
            value={codigoManual}
            onChange={(evento) => setCodigoManual(evento.target.value)}
            errorText={errorManual}
            className="uppercase"
          />
          <Button type="submit" className="h-12 shrink-0 sm:mt-6">
            Validar
          </Button>
        </form>
      </Card>
    </div>
  );
}

function BannerResultado({
  resultado,
  onCerrar,
}: {
  resultado: ResultadoEscaneo;
  onCerrar: () => void;
}) {
  if (resultado.tipo === "valido") {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-2 rounded-modal bg-success-fill p-8 text-center"
      >
        <CheckIcon className="!size-16 text-success-text" />
        <p className="text-3xl font-bold text-success-text">VÁLIDO</p>
        <p className="text-xl font-semibold text-success-text">
          {resultado.pasajero.apellidos}, {resultado.pasajero.nombres}
        </p>
        <p className="text-lg text-success-text">Asiento {resultado.pasajero.asiento}</p>
        <button type="button" onClick={onCerrar} className="mt-2 text-sm font-medium text-success-text underline">
          Listo, siguiente
        </button>
      </div>
    );
  }

  if (resultado.tipo === "ya-embarcado") {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-2 rounded-modal bg-warning-fill p-8 text-center"
      >
        <ExclamationIcon className="!size-16 text-warning-text" />
        <p className="text-3xl font-bold text-warning-text">YA EMBARCADO</p>
        <p className="text-xl font-semibold text-warning-text">
          {resultado.pasajero.apellidos}, {resultado.pasajero.nombres}
        </p>
        <p className="text-lg text-warning-text">
          Primer escaneo: {formatHora12(resultado.horaPrimerEscaneo)}
        </p>
        <button type="button" onClick={onCerrar} className="mt-2 text-sm font-medium text-warning-text underline">
          Listo, siguiente
        </button>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center gap-2 rounded-modal bg-error-fill p-8 text-center")}
    >
      <CloseIcon className="!size-16 text-error-text" />
      <p className="text-3xl font-bold text-error-text">INVÁLIDO</p>
      <p className="text-lg text-error-text">{resultado.motivo}</p>
      <button type="button" onClick={onCerrar} className="mt-2 text-sm font-medium text-error-text underline">
        Listo, siguiente
      </button>
    </div>
  );
}
