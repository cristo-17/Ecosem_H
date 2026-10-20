"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonShape } from "@/components/ui/Skeleton";
import { CheckIcon, ChevronLeftIcon, CloseIcon, ExclamationIcon, SearchOffIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { etiquetaAsiento } from "@/lib/asientos";
import { formatHora12 } from "@/lib/format";
import { RUTAS } from "@/lib/routes";
import { escaneosDeViaje, obtenerViaje, type EscaneoLocal, type ViajeDescargado } from "@/lib/embarque/db";
import { paqueteVencido, type Decision, type MotivoRechazoLocal } from "@/lib/embarque/decidir";
import {
  EVENTO_EMBARQUE,
  actualizarPaquete,
  contarEmbarcados,
  procesarEscaneo,
} from "@/lib/embarque/escanear";
import { estadoFinal } from "@/lib/embarque/sync";
import type { MotivoRechazoServidor } from "@/lib/embarque/contrato";
import type { DetectorDeCodigos } from "@/lib/embarque/tiposNavegador";

type Carga = { tipo: "cargando" } | { tipo: "sin-descargar" } | { tipo: "listo"; descargado: ViajeDescargado };
type EstadoCamara = "verificando" | "activa" | "no-disponible";

const ENFRIAMIENTO_MISMO_CODIGO_MS = 2500;
/** Con señal, se trae cada tanto lo que embarcaron los otros dispositivos. */
const INTERVALO_PAQUETE_MS = 30_000;

const MOTIVO_LOCAL: Record<MotivoRechazoLocal, string> = {
  formato: "No es un boleto de Ecosem H",
  paquete_vencido: "El paquete del viaje venció: actualízalo con señal antes de seguir",
  otro_viaje: "El boleto es de otro viaje",
  viaje_cancelado: "Este viaje está cancelado",
  clave_desconocida: "El boleto no se puede verificar con este paquete: actualízalo con señal",
  firma_invalida: "La firma no es válida: el boleto fue alterado o no lo emitió Ecosem H",
  boleto_anulado: "La compra de este boleto fue anulada",
};

const MOTIVO_SERVIDOR: Record<MotivoRechazoServidor, string> = {
  firma_invalida: "firma no válida",
  clave_desconocida: "clave desconocida",
  clave_revocada: "clave revocada",
  clave_retirada: "clave retirada",
  otro_viaje: "boleto de otro viaje",
  viaje_cancelado: "viaje cancelado",
  boleto_desconocido: "boleto inexistente",
  boleto_anulado: "compra anulada",
};

export interface EscaneoViewProps {
  viajeId: string;
}

/**
 * Embarque de un viaje ya descargado. La validación no usa la red: firma
 * ECDSA del QR con la clave pública del paquete, anulaciones y embarcados del
 * paquete, y los escaneos de este dispositivo. Con señal, sincroniza y trae lo
 * que embarcaron los demás dispositivos.
 */
export function EscaneoView({ viajeId }: EscaneoViewProps) {
  const router = useRouter();
  const [carga, setCarga] = useState<Carga>({ tipo: "cargando" });
  const [escaneos, setEscaneos] = useState<EscaneoLocal[]>([]);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [textoManual, setTextoManual] = useState("");
  const [errorManual, setErrorManual] = useState<string | undefined>();
  const [estadoCamara, setEstadoCamara] = useState<EstadoCamara>("verificando");
  const [mensajeCamara, setMensajeCamara] = useState<string | undefined>();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ultimoCodigoRef = useRef<string | null>(null);
  const procesandoRef = useRef(false);

  const leerLocal = useCallback(() => {
    Promise.all([obtenerViaje(viajeId), escaneosDeViaje(viajeId)]).then(([descargado, lista]) => {
      setCarga(descargado ? { tipo: "listo", descargado } : { tipo: "sin-descargar" });
      setEscaneos(lista);
    });
  }, [viajeId]);

  // Esta pantalla abre sin red: todo sale de IndexedDB.
  useEffect(() => {
    leerLocal();
    window.addEventListener(EVENTO_EMBARQUE, leerLocal);
    return () => window.removeEventListener(EVENTO_EMBARQUE, leerLocal);
  }, [leerLocal]);

  // Con señal, el paquete se renueva: embarcados de otros dispositivos,
  // anulaciones y claves nuevas. Sin señal falla en silencio y queda el que había.
  useEffect(() => {
    const renovar = () => {
      if (!navigator.onLine) return;
      actualizarPaquete(viajeId).then(
        (nuevo) => nuevo && window.dispatchEvent(new Event(EVENTO_EMBARQUE)),
        () => undefined,
      );
    };
    renovar();
    const intervalo = window.setInterval(renovar, INTERVALO_PAQUETE_MS);
    window.addEventListener("online", renovar);
    return () => {
      window.clearInterval(intervalo);
      window.removeEventListener("online", renovar);
    };
  }, [viajeId]);

  async function procesar(texto: string) {
    if (procesandoRef.current) return;
    procesandoRef.current = true;
    try {
      setDecision(await procesarEscaneo(viajeId, texto));
    } finally {
      procesandoRef.current = false;
    }
  }

  const listo = carga.tipo === "listo";

  // Cámara con `BarcodeDetector` nativo (Chrome en Android, el runtime de la
  // PWA instalada). Sin él, o sin permiso, queda el lector externo.
  useEffect(() => {
    if (!listo) return;
    let activo = true;
    let cuadro = 0;

    async function iniciar() {
      if (!window.BarcodeDetector) {
        setEstadoCamara("no-disponible");
        setMensajeCamara("Este navegador no lee QR con la cámara. Usa un lector externo.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (!activo) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        setEstadoCamara("activa");
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
        bucle(new window.BarcodeDetector({ formats: ["qr_code"] }));
      } catch {
        setEstadoCamara("no-disponible");
        setMensajeCamara("No se pudo usar la cámara. Usa un lector externo.");
      }
    }

    function bucle(detector: DetectorDeCodigos) {
      cuadro = requestAnimationFrame(async () => {
        if (!activo) return;
        const video = videoRef.current;
        if (video && video.readyState >= 2) {
          try {
            const valor = (await detector.detect(video))[0]?.rawValue;
            if (valor && valor !== ultimoCodigoRef.current) {
              ultimoCodigoRef.current = valor;
              await procesar(valor);
              setTimeout(() => {
                ultimoCodigoRef.current = null;
              }, ENFRIAMIENTO_MISMO_CODIGO_MS);
            }
          } catch {
            // Un cuadro sin imagen lista: se reintenta en el siguiente.
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
  }, [listo, viajeId]);

  function handleManual(event: FormEvent) {
    event.preventDefault();
    if (!textoManual.trim()) {
      setErrorManual("Escanea con el lector o pega el contenido del QR");
      return;
    }
    setErrorManual(undefined);
    void procesar(textoManual);
    setTextoManual("");
  }

  if (carga.tipo === "cargando") {
    return (
      <div role="status" aria-label="Cargando el viaje" className="flex flex-col gap-4">
        <SkeletonShape variant="text" lines={2} className="max-w-sm" />
        <SkeletonShape variant="card" className="h-64" />
      </div>
    );
  }

  if (carga.tipo === "sin-descargar") {
    return (
      <EmptyState
        icon={<SearchOffIcon />}
        title="Este viaje no está descargado en el dispositivo"
        description="Vuelve a la lista de viajes y descárgalo mientras tengas señal."
        actionLabel="Volver a viajes"
        onAction={() => router.push(RUTAS.embarque)}
      />
    );
  }

  const { descargado } = carga;
  const salida = new Date(descargado.viaje.departsAt);
  const vencido = paqueteVencido(descargado.paquete, new Date());
  const conflictos = escaneos.filter((e) => {
    const final = estadoFinal(e);
    return final === "conflicto" || final === "rechazado-servidor";
  }).length;

  return (
    <div className="flex flex-col gap-4">
      <Button variant="terciario" className="w-fit" onClick={() => router.push(RUTAS.embarque)}>
        <ChevronLeftIcon />
        Cambiar de viaje
      </Button>

      <Card className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-navy">
            {descargado.origen} → {descargado.destino}
          </p>
          <p className="text-xs text-navy/60">
            {formatHora12(salida)}
            {descargado.viaje.bus ? ` · Bus ${descargado.viaje.bus.plate}` : ""}
          </p>
          <p className="mt-1 text-xs text-navy/60">
            Paquete del {formatHora12(new Date(descargado.descargadoEn))}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-navy">
            {contarEmbarcados(descargado, escaneos)}/{descargado.viaje.seats.sold}
          </p>
          <p className="text-xs text-navy/60">embarcados</p>
        </div>
      </Card>

      {vencido && (
        <p role="alert" className="rounded-md bg-error-fill p-3 text-sm text-error-text">
          El paquete de este viaje venció. Actualízalo con señal desde la lista de viajes: sin eso no
          se valida ningún boleto.
        </p>
      )}

      {conflictos > 0 && (
        <p role="alert" className="rounded-md bg-warning-fill p-3 text-sm text-warning-text">
          {conflictos === 1 ? "Un embarque de este dispositivo" : `${conflictos} embarques de este dispositivo`}{" "}
          no coincide con el servidor. Revisa la lista de escaneos.
        </p>
      )}

      {/* Siempre montado: la cámara se conecta a esta referencia antes de mostrarse. */}
      <div className={cn("relative overflow-hidden rounded-modal bg-navy", estadoCamara !== "activa" && "hidden")}>
        <video ref={videoRef} muted playsInline className="aspect-square w-full object-cover" />
      </div>
      {estadoCamara !== "activa" && (
        <div className="rounded-modal bg-navy/5 p-4 text-center text-sm text-navy/70">
          {mensajeCamara ?? "Activando la cámara..."}
        </div>
      )}

      {decision && <BannerDecision decision={decision} onCerrar={() => setDecision(null)} />}

      <Card>
        <h2 className="text-sm font-semibold text-navy">Lector externo</h2>
        <p className="mt-1 text-xs text-navy/60">
          Si la cámara falla: escanea con un lector conectado al teléfono, o pega el contenido del QR.
          Se verifica igual, con la firma.
        </p>
        <form onSubmit={handleManual} noValidate className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            label="Contenido del QR"
            placeholder="EH1...."
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={textoManual}
            onChange={(evento) => setTextoManual(evento.target.value)}
            errorText={errorManual}
          />
          <Button type="submit" className="shrink-0 sm:mt-6">
            Validar
          </Button>
        </form>
      </Card>

      <HistorialEscaneos escaneos={escaneos} />
    </div>
  );
}

function BannerDecision({ decision, onCerrar }: { decision: Decision; onCerrar: () => void }) {
  const cerrar = (clase: string) => (
    <button type="button" onClick={onCerrar} className={cn("mt-2 min-h-11 text-sm font-medium underline", clase)}>
      Listo, siguiente
    </button>
  );

  if (decision.tipo === "embarcar") {
    return (
      <div role="status" className="flex flex-col items-center gap-2 rounded-modal bg-success-fill p-8 text-center">
        <CheckIcon className="!size-16 text-success-text" />
        <p className="text-3xl font-bold text-success-text">VÁLIDO</p>
        <p className="text-xl font-semibold text-success-text">
          Asiento {etiquetaAsiento(decision.qr.seat)}
        </p>
        <p className="text-sm text-success-text">Compra {decision.qr.purchaseCode}</p>
        {decision.menor !== null && (
          <p className="mt-2 rounded-md bg-warning-fill p-3 text-sm font-medium text-warning-text">
            Menor de edad ({decision.menor} años): pide el permiso notarial y verifica quién lo
            acompaña.
          </p>
        )}
        {decision.enBrazos !== null && (
          <p className="mt-2 rounded-md bg-warning-fill p-3 text-sm font-medium text-warning-text">
            Lleva un menor en brazos ({decision.enBrazos} {decision.enBrazos === 1 ? "año" : "años"}):
            pide el documento y el permiso del menor.
          </p>
        )}
        {cerrar("text-success-text")}
      </div>
    );
  }

  if (decision.tipo === "ya-embarcado") {
    return (
      <div role="status" className="flex flex-col items-center gap-2 rounded-modal bg-warning-fill p-8 text-center">
        <ExclamationIcon className="!size-16 text-warning-text" />
        <p className="text-3xl font-bold text-warning-text">YA EMBARCADO</p>
        <p className="text-xl font-semibold text-warning-text">
          Asiento {etiquetaAsiento(decision.qr.seat)}
        </p>
        <p className="text-sm text-warning-text">
          {decision.embarcadoAqui
            ? `Lo embarcaste en este dispositivo a las ${formatHora12(new Date(decision.embarcadoAqui))}.`
            : "Lo embarcó otro dispositivo."}
        </p>
        {cerrar("text-warning-text")}
      </div>
    );
  }

  return (
    <div role="alert" className="flex flex-col items-center gap-2 rounded-modal bg-error-fill p-8 text-center">
      <CloseIcon className="!size-16 text-error-text" />
      <p className="text-3xl font-bold text-error-text">NO EMBARCA</p>
      <p className="text-lg text-error-text">{MOTIVO_LOCAL[decision.motivo]}</p>
      {cerrar("text-error-text")}
    </div>
  );
}

function HistorialEscaneos({ escaneos }: { escaneos: EscaneoLocal[] }) {
  const recientes = [...escaneos].reverse().slice(0, 30);
  if (recientes.length === 0) return null;

  const etiqueta = (e: EscaneoLocal): { texto: string; clase: string } => {
    switch (estadoFinal(e)) {
      case "pendiente":
        return { texto: "Embarcado · falta subirlo", clase: "text-navy/70" };
      case "embarcado":
        return { texto: "Embarcado · confirmado", clase: "text-success-text" };
      case "conflicto":
        return { texto: "Otro dispositivo ya lo había embarcado", clase: "text-warning-text" };
      case "rechazado-servidor":
        return {
          texto: `El servidor lo rechazó: ${e.servidor?.reason ? MOTIVO_SERVIDOR[e.servidor.reason] : "sin motivo"}`,
          clase: "text-error-text",
        };
      case "ya-embarcado":
        return { texto: "Ya estaba embarcado", clase: "text-navy/60" };
      default:
        return { texto: e.motivo ? MOTIVO_LOCAL[e.motivo] : "No embarcó", clase: "text-error-text" };
    }
  };

  return (
    <Card>
      <h2 className="text-sm font-semibold text-navy">Escaneos de este dispositivo</h2>
      <ul className="mt-3 flex flex-col">
        {recientes.map((e) => {
          const { texto, clase } = etiqueta(e);
          return (
            <li key={e.scanId} className="flex items-start justify-between gap-3 border-t border-navy/10 py-2 text-sm first:border-0">
              <div>
                <p className="font-medium text-navy">
                  {e.seat ? `Asiento ${etiquetaAsiento(e.seat)}` : "QR no válido"}
                  {e.purchaseCode ? ` · ${e.purchaseCode}` : ""}
                </p>
                <p className={cn("text-xs", clase)}>{texto}</p>
              </div>
              <span className="shrink-0 text-xs text-navy/60">{formatHora12(new Date(e.scannedAt))}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
