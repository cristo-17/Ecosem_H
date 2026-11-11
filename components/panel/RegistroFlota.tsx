"use client";

import { useId, useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { mensajeFlota, registrarConductor, registrarUnidad } from "@/lib/api/flota";
import type { MensajeError } from "@/lib/api/compra";
import type { SaveDriverRequest, SaveUnitRequest } from "@/lib/types/contratos-panel";
import { TIPOS_SERVICIO } from "@/lib/servicios";
import { validarNombre } from "@/lib/validacion";

interface RegistroProps {
  onClose: () => void;
  onRegistered: () => Promise<void>;
  returnFocusRef: RefObject<HTMLElement | null>;
}

/** Los campos sensibles solo viajan en el cuerpo del POST autenticado. */
function FormularioRegistro({ titulo, guardar, validar, children, onClose, onRegistered, returnFocusRef, puedeGuardar = true }: RegistroProps & {
  titulo: string;
  guardar: (datos: FormData) => Promise<unknown>;
  validar?: (datos: FormData) => boolean;
  children: ReactNode;
  puedeGuardar?: boolean;
}) {
  const formId = useId();
  const bloqueo = useRef(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<MensajeError | null>(null);
  const { showToast } = useToast();

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (bloqueo.current) return;
    const datos = new FormData(event.currentTarget);
    if (validar && !validar(datos)) return;
    if (validar && !event.currentTarget.reportValidity()) return;
    bloqueo.current = true;
    setGuardando(true);
    setError(null);
    try {
      await guardar(datos);
      showToast({ type: "success", title: "Registro guardado", description: "Ya está disponible en flota para preparar los viajes." });
      await onRegistered();
      onClose();
    } catch (e) {
      setError(mensajeFlota(e));
    } finally {
      bloqueo.current = false;
      setGuardando(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={titulo} preventDismiss={guardando} returnFocusRef={returnFocusRef}
      className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
      footer={<>
        <Button variant="terciario" disabled={guardando} onClick={onClose}>Cancelar</Button>
        <Button type="submit" form={formId} isLoading={guardando} disabled={!puedeGuardar}>Guardar registro</Button>
      </>}
    >
      <form id={formId} onSubmit={enviar} noValidate={Boolean(validar)} className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">Los campos indicados como opcionales se pueden dejar vacíos.</p>
        {error && <div role="alert" className="rounded-field bg-error-fill p-4 text-error-text"><p className="font-semibold">{error.titulo}</p><p>{error.descripcion}</p></div>}
        <fieldset disabled={guardando} className="flex min-w-0 flex-col gap-4">{children}</fieldset>
      </form>
    </Modal>
  );
}

const texto = (datos: FormData, campo: string) => String(datos.get(campo) ?? "").trim();
const numeroOpcional = (datos: FormData, campo: string) => texto(datos, campo) === "" ? null : Number(texto(datos, campo));

export function RegistroUnidad(props: RegistroProps) {
  const [servicio, setServicio] = useState<SaveUnitRequest["serviceType"] | null>(null);
  return (
    <FormularioRegistro {...props} titulo="Registrar unidad" puedeGuardar={servicio !== null} guardar={async datos => {
      if (!servicio) throw new Error("Selecciona el tipo de servicio.");
      const cuerpo: SaveUnitRequest = {
        plate: texto(datos, "plate").toUpperCase(),
        make: texto(datos, "make"),
        model: texto(datos, "model"),
        capacity: Number(texto(datos, "capacity")),
        serviceType: servicio,
        authorizationNumber: texto(datos, "authorizationNumber") || null,
        mileageThresholdKm: numeroOpcional(datos, "mileageThresholdKm"),
      };
      return registrarUnidad(cuerpo);
    }}>
      <Input label="Placa" name="plate" required minLength={3} maxLength={10} pattern="[A-Za-z0-9\-]{3,10}" autoComplete="off" helperText="De 3 a 10 letras, números o guiones." />
      <Input label="Marca" name="make" required maxLength={60} />
      <Input label="Modelo" name="model" required maxLength={60} />
      <Input label="Capacidad de asientos" name="capacity" required type="number" min={1} max={120} step={1} />
      <Select label="Tipo de servicio" value={servicio} options={TIPOS_SERVICIO} onChange={valor => setServicio(TIPOS_SERVICIO.find(s => s.value === valor)?.value ?? null)} />
      <Input label="Número de habilitación (opcional)" name="authorizationNumber" maxLength={40} />
      <Input label="Umbral de kilometraje (opcional)" name="mileageThresholdKm" type="number" min={1} max={10000000} step={1} helperText="Kilometraje a partir del cual se alerta. Vacío: sin alerta por kilometraje." />
    </FormularioRegistro>
  );
}

export function RegistroConductor(props: RegistroProps) {
  const [errores, setErrores] = useState<{ firstNames?: string; lastNames?: string }>({});
  return (
    <FormularioRegistro {...props} titulo="Registrar conductor" validar={datos => {
      const firstNames = validarNombre(texto(datos, "firstNames"), 100);
      const lastNames = validarNombre(texto(datos, "lastNames"), 100);
      setErrores({ firstNames, lastNames });
      return !firstNames && !lastNames;
    }} guardar={datos => {
      const cuerpo: SaveDriverRequest = {
        firstNames: texto(datos, "firstNames"),
        lastNames: texto(datos, "lastNames"),
        licenseNumber: texto(datos, "licenseNumber"),
        licenseExpiresOn: texto(datos, "licenseExpiresOn"),
        drivingHoursLimit: numeroOpcional(datos, "drivingHoursLimit"),
      };
      return registrarConductor(cuerpo);
    }}>
      <Input label="Nombres" name="firstNames" required maxLength={100} autoComplete="off" errorText={errores.firstNames} />
      <Input label="Apellidos" name="lastNames" required maxLength={100} autoComplete="off" errorText={errores.lastNames} />
      <Input label="Número de licencia" name="licenseNumber" required minLength={5} maxLength={20} pattern="[A-Za-z0-9\-]{5,20}" autoComplete="off" helperText="De 5 a 20 letras, números o guiones." />
      <Input label="Vencimiento de la licencia" name="licenseExpiresOn" type="date" required />
      <Input label="Límite de horas de conducción (opcional)" name="drivingHoursLimit" type="number" min={0} max={100000} step="any" onInput={e => e.currentTarget.setCustomValidity(e.currentTarget.value !== "" && Number(e.currentTarget.value) <= 0 ? "Ingresa un límite mayor que cero o déjalo vacío." : "")} helperText="Horas acumuladas a partir de las cuales se alerta. Vacío: sin alerta por horas." />
    </FormularioRegistro>
  );
}
