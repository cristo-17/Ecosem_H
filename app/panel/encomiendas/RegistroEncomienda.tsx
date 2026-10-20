"use client";

import { useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { CheckIcon, ExclamationIcon } from "@/components/ui/icons";
import { ETIQUETA_MEDIO, leerMonto, ventaPudoRegistrarse, type MedioPagoCaja } from "@/lib/api/caja";
import {
  cotizar,
  esCobroSinConfirmar,
  mensajeEncomienda,
  registrarEncomienda,
  reintentarCobro,
  type Cotizacion,
  type DocumentoEncomienda,
  type PedidoCotizacion,
  type Registro,
} from "@/lib/api/encomiendas";
import { formatPrecio } from "@/lib/format";
import type { Agencia } from "./EncomiendasView";

const OPCIONES_DOCUMENTO: SelectOption[] = [
  { value: "dni", label: "DNI" },
  { value: "carne_extranjeria", label: "Carné de Extranjería" },
  { value: "pasaporte", label: "Pasaporte" },
  { value: "ruc", label: "RUC" },
];

const OPCIONES_MEDIO: SelectOption[] = (["efectivo", "yape", "plin", "tarjeta"] as const).map(
  (medio) => ({ value: medio, label: ETIQUETA_MEDIO[medio] }),
);

const OPCIONES_COMPROBANTE: SelectOption[] = [
  { value: "boleta", label: "Boleta" },
  { value: "factura", label: "Factura" },
];

/** Las mismas reglas que valida svc-encomiendas, para avisar antes de enviar. */
export function errorDocumento(tipo: DocumentoEncomienda, numero: string): string | undefined {
  const valor = numero.trim();
  if (!valor) return "Este campo es obligatorio";
  if (tipo === "dni" && !/^\d{8}$/.test(valor)) return "El DNI debe tener 8 dígitos";
  if (tipo === "ruc" && !/^\d{11}$/.test(valor)) return "El RUC debe tener 11 dígitos";
  if ((tipo === "carne_extranjeria" || tipo === "pasaporte") && !/^[A-Za-z0-9]{4,20}$/.test(valor))
    return "Entre 4 y 20 letras o números, sin espacios";
  return undefined;
}

interface Persona {
  nombre: string;
  tipo: DocumentoEncomienda;
  numero: string;
  celular: string;
}

const PERSONA_VACIA: Persona = { nombre: "", tipo: "dni", numero: "", celular: "" };

type Errores = Partial<Record<string, string>>;

type Resultado =
  | { tipo: "registrada"; registro: Registro; medio: MedioPagoCaja }
  | { tipo: "cobro-sin-confirmar"; parcelId: string; guia: string }
  | { tipo: "incierta" };

export interface RegistroEncomiendaProps {
  agencias: Agencia[];
  /** Counter: su agencia, fija. Supervisor: nulo, la elige. */
  agenciaPropia: Agencia | null;
  /** Para ver la encomienda recién registrada en "Buscar por guía". */
  onVerEncomienda: (guia: string) => void;
}

export function RegistroEncomienda({ agencias, agenciaPropia, onVerEncomienda }: RegistroEncomiendaProps) {
  const { showToast } = useToast();
  const [origen, setOrigen] = useState<string | null>(agenciaPropia?.code ?? null);
  const [destino, setDestino] = useState<string | null>(null);
  const [peso, setPeso] = useState("");
  const [largo, setLargo] = useState("");
  const [ancho, setAncho] = useState("");
  const [alto, setAlto] = useState("");
  const [valorDeclarado, setValorDeclarado] = useState("");

  const [cotizacion, setCotizacion] = useState<{ pedido: PedidoCotizacion; resultado: Cotizacion } | null>(null);
  const [cotizando, setCotizando] = useState(false);

  const [remitente, setRemitente] = useState<Persona>(PERSONA_VACIA);
  const [whatsapp, setWhatsapp] = useState(false);
  const [destinatario, setDestinatario] = useState<Persona>(PERSONA_VACIA);
  const [comprobante, setComprobante] = useState<"boleta" | "factura">("boleta");
  const [ruc, setRuc] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [medio, setMedio] = useState<MedioPagoCaja | null>(null);
  const [recibido, setRecibido] = useState("");

  const [errores, setErrores] = useState<Errores>({});
  const [registrando, setRegistrando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const operandoRef = useRef(false);

  const agenciaOrigen = agencias.find((a) => a.code === origen) ?? null;
  const opcionesDestino: SelectOption[] = agencias
    .filter((a) => agenciaOrigen?.destinos.includes(a.id))
    .map((a) => ({ value: a.code, label: a.name }));

  /** Las medidas tal como están escritas, o los errores que impiden cotizar. */
  function leerMedidas(): { pedido: PedidoCotizacion | null; errores: Errores } {
    const e: Errores = {};
    if (!origen) e.origen = "Elige la agencia de origen";
    if (!destino) e.destino = "Elige el destino";
    const kg = leerMonto(peso);
    if (kg === null || kg <= 0) e.peso = "Escribe el peso en kg, por ejemplo 3.5";
    const lados = [largo, ancho, alto].map((v) => (v.trim() ? leerMonto(v) : undefined));
    const escritos = lados.filter((v) => v !== undefined).length;
    if (escritos > 0 && escritos < 3) e.medidas = "Escribe las tres medidas, o ninguna";
    if (lados.some((v) => v === null || v === 0)) e.medidas = "Cada medida en cm, mayor que cero";
    const valor = valorDeclarado.trim() ? leerMonto(valorDeclarado) : undefined;
    if (valor === null) e.valorDeclarado = "Escribe un monto, por ejemplo 200";
    if (Object.keys(e).length > 0 || !origen || !destino || kg === null) return { pedido: null, errores: e };
    const conMedidas = escritos === 3;
    return {
      pedido: {
        origin: origen,
        destination: destino,
        weightKg: kg,
        lengthCm: conMedidas ? (lados[0] as number) : null,
        widthCm: conMedidas ? (lados[1] as number) : null,
        heightCm: conMedidas ? (lados[2] as number) : null,
        declaredValue: valor ?? null,
      },
      errores: e,
    };
  }

  const cotizacionVigente = (() => {
    if (!cotizacion) return null;
    const { pedido } = leerMedidas();
    return pedido && JSON.stringify(pedido) === JSON.stringify(cotizacion.pedido) ? cotizacion.resultado : null;
  })();

  async function handleCotizar() {
    const { pedido, errores: e } = leerMedidas();
    setErrores(e);
    if (!pedido) return;
    setCotizando(true);
    try {
      setCotizacion({ pedido, resultado: await cotizar(pedido) });
    } catch (error) {
      setCotizacion(null);
      const mensaje = mensajeEncomienda(error);
      showToast({ type: "error", title: mensaje.titulo, description: mensaje.descripcion });
    } finally {
      setCotizando(false);
    }
  }

  function validarPersona(p: Persona, prefijo: string, e: Errores) {
    if (!p.nombre.trim()) e[`${prefijo}Nombre`] = "Este campo es obligatorio";
    else if (p.nombre.trim().length > 200) e[`${prefijo}Nombre`] = "Máximo 200 caracteres";
    const doc = errorDocumento(p.tipo, p.numero);
    if (doc) e[`${prefijo}Numero`] = doc;
    if (p.celular.trim() && !/^\d{9}$/.test(p.celular.trim()))
      e[`${prefijo}Celular`] = "Debe contener exactamente 9 dígitos";
  }

  async function handleRegistrar(event: FormEvent) {
    event.preventDefault();
    if (operandoRef.current) return;
    const { pedido, errores: e } = leerMedidas();
    if (pedido && !cotizacionVigente) e.cotizacion = "Cotiza con las medidas actuales antes de cobrar";
    validarPersona(remitente, "remitente", e);
    validarPersona(destinatario, "destinatario", e);
    if (whatsapp && !remitente.celular.trim()) e.remitenteCelular = "Para recibir WhatsApp, indica su celular";
    if (comprobante === "factura") {
      if (!/^\d{11}$/.test(ruc.trim())) e.ruc = "El RUC debe tener 11 dígitos";
      if (!razonSocial.trim()) e.razonSocial = "Este campo es obligatorio";
    }
    if (!medio) e.medio = "Elige el medio de pago";
    const efectivo = medio === "efectivo" ? leerMonto(recibido) : null;
    if (medio === "efectivo") {
      if (efectivo === null || efectivo <= 0) e.recibido = "Escribe el efectivo que recibiste";
      else if (cotizacionVigente && efectivo < Number(cotizacionVigente.total))
        e.recibido = `No alcanza: el total es ${formatPrecio(Number(cotizacionVigente.total))}`;
    }
    setErrores(e);
    if (Object.keys(e).length > 0 || !pedido || !medio) return;

    operandoRef.current = true;
    setRegistrando(true);
    try {
      const registro = await registrarEncomienda({
        ...pedido,
        sender: {
          name: remitente.nombre.trim(),
          documentType: remitente.tipo,
          documentNumber: remitente.numero.trim(),
          ...(remitente.celular.trim() ? { phone: remitente.celular.trim() } : {}),
          whatsappOptIn: whatsapp,
        },
        recipient: {
          name: destinatario.nombre.trim(),
          documentType: destinatario.tipo,
          documentNumber: destinatario.numero.trim(),
          ...(destinatario.celular.trim() ? { phone: destinatario.celular.trim() } : {}),
        },
        receipt:
          comprobante === "factura"
            ? { type: "factura", ruc: ruc.trim(), name: razonSocial.trim() }
            : { type: "boleta" },
        payment: medio === "efectivo" ? { method: medio, cashReceived: efectivo! } : { method: medio },
      });
      setResultado({ tipo: "registrada", registro, medio });
    } catch (error) {
      if (esCobroSinConfirmar(error) && error.detalles?.parcelId && error.detalles.trackingCode) {
        setResultado({
          tipo: "cobro-sin-confirmar",
          parcelId: error.detalles.parcelId,
          guia: error.detalles.trackingCode,
        });
      } else if (ventaPudoRegistrarse(error)) {
        setResultado({ tipo: "incierta" });
      } else {
        const mensaje = mensajeEncomienda(error);
        showToast({ type: "error", title: mensaje.titulo, description: mensaje.descripcion });
      }
    } finally {
      operandoRef.current = false;
      setRegistrando(false);
    }
  }

  async function handleReintentarCobro(parcelId: string) {
    if (operandoRef.current) return;
    operandoRef.current = true;
    setRegistrando(true);
    try {
      const { trackingCode } = await reintentarCobro(parcelId);
      showToast({ type: "success", title: "Cobro confirmado", description: `Guía ${trackingCode}.` });
      onVerEncomienda(trackingCode);
      nuevaEncomienda();
    } catch (error) {
      const mensaje = mensajeEncomienda(error);
      showToast({ type: "error", title: mensaje.titulo, description: mensaje.descripcion });
    } finally {
      operandoRef.current = false;
      setRegistrando(false);
    }
  }

  function nuevaEncomienda() {
    setResultado(null);
    setDestino(null);
    setPeso("");
    setLargo("");
    setAncho("");
    setAlto("");
    setValorDeclarado("");
    setCotizacion(null);
    setRemitente(PERSONA_VACIA);
    setWhatsapp(false);
    setDestinatario(PERSONA_VACIA);
    setComprobante("boleta");
    setRuc("");
    setRazonSocial("");
    setMedio(null);
    setRecibido("");
    setErrores({});
  }

  if (resultado?.tipo === "registrada") {
    const { registro } = resultado;
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success-fill">
          <CheckIcon className="!size-6 text-success-text" />
        </span>
        <h2 className="text-xl font-semibold text-navy">Encomienda registrada</h2>
        <p className="text-sm text-navy/70">Entrega al remitente el número de guía:</p>
        <p className="text-2xl font-bold tracking-wide text-navy">{registro.trackingCode}</p>
        <dl className="mt-2 grid w-full max-w-sm grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-xs text-navy/60">Total ({ETIQUETA_MEDIO[resultado.medio]})</dt>
            <dd className="font-semibold text-navy">{formatPrecio(Number(registro.quote.total))}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy/60">Vuelto</dt>
            <dd className="text-lg font-bold text-navy">
              {registro.change !== null ? formatPrecio(Number(registro.change)) : "—"}
            </dd>
          </div>
        </dl>
        <p className="max-w-sm text-xs text-navy/60">
          El cobro ya está en el arqueo de tu turno. Con la guía, quien recibe puede rastrearla sin
          cuenta y recogerla con su documento.
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Button variant="secundario" onClick={() => onVerEncomienda(registro.trackingCode)}>
            Ver encomienda
          </Button>
          <Button onClick={nuevaEncomienda}>Nueva encomienda</Button>
        </div>
      </Card>
    );
  }

  if (resultado?.tipo === "cobro-sin-confirmar") {
    return (
      <EmptyState
        icon={<ExclamationIcon className="!size-12 !text-primary" />}
        title="El cobro no se pudo confirmar"
        description={`La encomienda ${resultado.guia} quedó pendiente: todavía no existe para nadie. Reintenta el cobro; si el primero había llegado, no se cobra dos veces. No cobres de nuevo por fuera.`}
        actionLabel={registrando ? "Procesando..." : "Reintentar cobro"}
        onAction={() => handleReintentarCobro(resultado.parcelId)}
      />
    );
  }

  if (resultado?.tipo === "incierta") {
    return (
      <EmptyState
        icon={<ExclamationIcon className="!size-12 !text-primary" />}
        title="No sabemos si se registró"
        description="Se cortó la conexión después de enviarla. No cobres de nuevo: revisa en Caja si el número de movimientos subió. Si quedó a medias, el sistema la confirma o la descarta solo en unos minutos."
        actionLabel="Registrar otra"
        onAction={nuevaEncomienda}
      />
    );
  }

  const ruta = (
    <Card className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-navy">Ruta y medidas</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {agenciaPropia ? (
          <Input label="Origen" value={agenciaPropia.name} locked readOnly />
        ) : (
          <Select
            label="Origen"
            options={agencias.map((a) => ({ value: a.code, label: a.name }))}
            value={origen}
            onChange={(valor) => {
              setOrigen(valor);
              setDestino(null);
            }}
            placeholder="Agencia"
            errorText={errores.origen}
          />
        )}
        <Select
          label="Destino"
          options={opcionesDestino}
          value={destino}
          onChange={setDestino}
          placeholder="Agencia"
          errorText={errores.destino}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Peso real (kg)"
          inputMode="decimal"
          value={peso}
          onChange={(evento) => setPeso(evento.target.value)}
          helperText="Pesado en la balanza del counter"
          errorText={errores.peso}
        />
        <Input
          label="Valor declarado (S/, opcional)"
          inputMode="decimal"
          value={valorDeclarado}
          onChange={(evento) => setValorDeclarado(evento.target.value)}
          errorText={errores.valorDeclarado}
        />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-navy">Medidas del paquete (cm, opcional)</legend>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Largo" inputMode="decimal" value={largo} onChange={(e) => setLargo(e.target.value)} />
          <Input label="Ancho" inputMode="decimal" value={ancho} onChange={(e) => setAncho(e.target.value)} />
          <Input label="Alto" inputMode="decimal" value={alto} onChange={(e) => setAlto(e.target.value)} />
        </div>
        {errores.medidas ? (
          <p className="text-sm text-error-text">{errores.medidas}</p>
        ) : (
          <p className="text-xs text-navy/60">
            Con medidas, se factura el mayor entre el peso real y el volumétrico.
          </p>
        )}
      </fieldset>
      <Button type="button" variant="secundario" isLoading={cotizando} onClick={handleCotizar} className="self-start">
        Cotizar
      </Button>
      {cotizacionVigente ? (
        <DesgloseCotizacion cotizacion={cotizacionVigente} />
      ) : (
        errores.cotizacion && <p className="text-sm text-error-text">{errores.cotizacion}</p>
      )}
    </Card>
  );

  return (
    <form onSubmit={handleRegistrar} noValidate className="flex flex-col gap-4">
      {ruta}
      <DatosPersona
        titulo="Remitente"
        prefijo="remitente"
        valor={remitente}
        onChange={setRemitente}
        errores={errores}
      >
        <Checkbox
          label="Acepta recibir por WhatsApp mensajes de ECOSEM H sobre esta encomienda."
          checked={whatsapp}
          onChange={(evento) => setWhatsapp(evento.target.checked)}
        />
      </DatosPersona>
      <DatosPersona
        titulo="Destinatario"
        prefijo="destinatario"
        valor={destinatario}
        onChange={setDestinatario}
        errores={errores}
        ayuda="Su documento es obligatorio: solo con ese documento se entrega la encomienda."
      />

      <Card className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-navy">Comprobante y cobro</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Comprobante"
            options={OPCIONES_COMPROBANTE}
            value={comprobante}
            onChange={(valor) => setComprobante(valor as "boleta" | "factura")}
          />
          <Select
            label="Medio de pago"
            options={OPCIONES_MEDIO}
            value={medio}
            onChange={(valor) => setMedio(valor as MedioPagoCaja)}
            placeholder="Elige un medio"
            errorText={errores.medio}
          />
        </div>
        {comprobante === "factura" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="RUC" inputMode="numeric" value={ruc} onChange={(e) => setRuc(e.target.value)} errorText={errores.ruc} />
            <Input
              label="Razón social"
              value={razonSocial}
              onChange={(e) => setRazonSocial(e.target.value)}
              errorText={errores.razonSocial}
            />
          </div>
        )}
        {medio === "efectivo" && (
          <Input
            label="Efectivo recibido (S/)"
            inputMode="decimal"
            autoComplete="off"
            value={recibido}
            onChange={(evento) => setRecibido(evento.target.value)}
            errorText={errores.recibido}
          />
        )}
        {medio && medio !== "efectivo" && (
          <p className="rounded-md bg-info-fill p-3 text-sm text-info-text">
            Confirma el pago con {ETIQUETA_MEDIO[medio]} antes de registrar. Se concilia con el
            reporte de la pasarela, no con el efectivo de la caja.
          </p>
        )}
      </Card>

      <div className="flex items-center justify-between rounded-modal bg-white p-4 shadow-low">
        <div>
          <p className="text-xs text-navy/60">Total cotizado</p>
          <p className="text-lg font-bold text-navy">
            {cotizacionVigente ? formatPrecio(Number(cotizacionVigente.total)) : "Sin cotizar"}
          </p>
        </div>
        <Button type="submit" isLoading={registrando} className="min-w-40">
          Registrar y cobrar
        </Button>
      </div>
    </form>
  );
}

function DesgloseCotizacion({ cotizacion }: { cotizacion: Cotizacion }) {
  const filas: Array<[string, string]> = [
    ["Peso real", `${cotizacion.realWeightKg} kg`],
    ...(cotizacion.volumetricWeightKg
      ? ([[`Peso volumétrico (÷ ${cotizacion.volumetricDivisor})`, `${cotizacion.volumetricWeightKg} kg`]] as Array<[string, string]>)
      : []),
    [
      `Peso facturable (por ${cotizacion.billedBy === "real" ? "peso real" : "volumen"})`,
      `${cotizacion.billableWeightKg} kg`,
    ],
    [
      `Rango ${cotizacion.range.fromKg}–${cotizacion.range.toKg} kg`,
      formatPrecio(Number(cotizacion.range.price)),
    ],
    ...(cotizacion.declaredValue
      ? ([[`Recargo ${cotizacion.surchargePercent ?? "0"}% sobre S/ ${cotizacion.declaredValue}`, formatPrecio(Number(cotizacion.surcharge))]] as Array<[string, string]>)
      : []),
  ];
  return (
    <dl className="flex flex-col gap-1 rounded-md bg-navy/5 p-4 text-sm">
      {filas.map(([etiqueta, valor]) => (
        <div key={etiqueta} className="flex justify-between gap-3">
          <dt className="text-navy/70">{etiqueta}</dt>
          <dd className="font-medium text-navy">{valor}</dd>
        </div>
      ))}
      <div className="mt-1 flex justify-between gap-3 border-t border-navy/10 pt-2">
        <dt className="font-semibold text-navy">Total</dt>
        <dd className="text-base font-bold text-navy">{formatPrecio(Number(cotizacion.total))}</dd>
      </div>
    </dl>
  );
}

function DatosPersona({
  titulo,
  prefijo,
  valor,
  onChange,
  errores,
  ayuda,
  children,
}: {
  titulo: string;
  prefijo: string;
  valor: Persona;
  onChange: (valor: Persona) => void;
  errores: Errores;
  ayuda?: string;
  children?: ReactNode;
}) {
  const actualizar = <K extends keyof Persona>(campo: K, siguiente: Persona[K]) =>
    onChange({ ...valor, [campo]: siguiente });
  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-navy">{titulo}</h2>
        {ayuda && <p className="text-sm text-navy/70">{ayuda}</p>}
      </div>
      <Input
        label="Nombre completo o razón social"
        autoComplete="off"
        value={valor.nombre}
        onChange={(e) => actualizar("nombre", e.target.value)}
        errorText={errores[`${prefijo}Nombre`]}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Select
          label="Tipo de documento"
          options={OPCIONES_DOCUMENTO}
          value={valor.tipo}
          onChange={(nuevo) => actualizar("tipo", nuevo as DocumentoEncomienda)}
        />
        <Input
          label="N.° de documento"
          autoComplete="off"
          inputMode={valor.tipo === "dni" || valor.tipo === "ruc" ? "numeric" : "text"}
          value={valor.numero}
          onChange={(e) => actualizar("numero", e.target.value)}
          errorText={errores[`${prefijo}Numero`]}
        />
        <Input
          label="Celular (opcional)"
          inputMode="numeric"
          autoComplete="off"
          value={valor.celular}
          onChange={(e) => actualizar("celular", e.target.value)}
          helperText="9 dígitos"
          errorText={errores[`${prefijo}Celular`]}
        />
      </div>
      {children}
    </Card>
  );
}
