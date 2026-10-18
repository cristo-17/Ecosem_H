import { Select, type SelectOption } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import type { DocumentKind } from "@/lib/types/contratos-frontend";
import type { BorradorPasajero } from "@/components/pasajes/PurchaseProvider";
import { etiquetaAsiento } from "@/lib/asientos";

const OPCIONES_DOCUMENTO: SelectOption[] = [
  { value: "dni", label: "DNI" },
  { value: "carne_extranjeria", label: "Carné de Extranjería" },
  { value: "pasaporte", label: "Pasaporte" },
];

export type ErroresPasajeroReserva = Partial<Record<keyof BorradorPasajero, string>>;

const MAYORIA_DE_EDAD = 18;

/** Edad que tendrá el día del viaje. Solo para mostrar a tiempo los campos del acompañante: decide el backend. */
export function edadAlViaje(fechaNacimiento: string, salida: Date): number | null {
  const [anio, mes, dia] = fechaNacimiento.split("-").map(Number);
  if (!anio || !mes || !dia) return null;
  let edad = salida.getFullYear() - anio;
  const cumpleaniosPasado =
    salida.getMonth() + 1 > mes || (salida.getMonth() + 1 === mes && salida.getDate() >= dia);
  if (!cumpleaniosPasado) edad -= 1;
  return edad;
}

export function esMenorAlViaje(pasajero: BorradorPasajero, salida: Date): boolean {
  const edad = edadAlViaje(pasajero.birthDate, salida);
  return edad !== null && edad < MAYORIA_DE_EDAD;
}

/** Las mismas reglas que valida el backend (pasajeros.ts), para avisar antes de enviar. */
export function validarPasajeroReserva(p: BorradorPasajero, salida: Date): ErroresPasajeroReserva {
  const errores: ErroresPasajeroReserva = {};
  const numero = p.documentNumber.trim();
  if (!numero) errores.documentNumber = "Este campo es obligatorio";
  else if (p.documentType === "dni" && !/^\d{8}$/.test(numero))
    errores.documentNumber = "El DNI debe tener 8 dígitos";
  else if (p.documentType !== "dni" && !/^[A-Za-z0-9]{4,20}$/.test(numero))
    errores.documentNumber = "Entre 4 y 20 letras o números, sin espacios";

  if (!p.firstNames.trim()) errores.firstNames = "Este campo es obligatorio";
  else if (p.firstNames.trim().length > 100) errores.firstNames = "Máximo 100 caracteres";
  if (!p.lastNames.trim()) errores.lastNames = "Este campo es obligatorio";
  else if (p.lastNames.trim().length > 100) errores.lastNames = "Máximo 100 caracteres";

  const edad = edadAlViaje(p.birthDate, salida);
  if (!p.birthDate) errores.birthDate = "Este campo es obligatorio";
  else if (edad === null || edad < 0 || new Date(p.birthDate) > new Date())
    errores.birthDate = "Revisa la fecha de nacimiento";

  if (edad !== null && edad >= 0 && edad < MAYORIA_DE_EDAD) {
    if (!p.companionName.trim()) errores.companionName = "Obligatorio para un menor de edad";
    if (!p.companionRelationship.trim())
      errores.companionRelationship = "Obligatorio para un menor de edad";
  }
  return errores;
}

export interface PasajeroReservaFormProps {
  /** 0-based, solo para el rótulo "Pasajero 1". */
  indice: number;
  asiento: string;
  valor: BorradorPasajero;
  errores?: ErroresPasajeroReserva;
  /** Salida del viaje: la mayoría de edad se cuenta a esa fecha. */
  salida: Date;
  onChange: (valor: BorradorPasajero) => void;
}

export function PasajeroReservaForm({
  indice,
  asiento,
  valor,
  errores,
  salida,
  onChange,
}: PasajeroReservaFormProps) {
  function actualizar<K extends keyof BorradorPasajero>(campo: K, siguiente: BorradorPasajero[K]) {
    onChange({ ...valor, [campo]: siguiente });
  }

  const menor = esMenorAlViaje(valor, salida);

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-navy">Pasajero {indice + 1}</h2>
        <span className="text-xs font-medium text-navy/50">Asiento {etiquetaAsiento(asiento)}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Tipo de documento"
          options={OPCIONES_DOCUMENTO}
          value={valor.documentType}
          onChange={(nuevo) => actualizar("documentType", nuevo as DocumentKind)}
          errorText={errores?.documentType}
        />
        <Input
          label="N.° de documento"
          value={valor.documentNumber}
          inputMode={valor.documentType === "dni" ? "numeric" : "text"}
          autoComplete="off"
          onChange={(evento) => actualizar("documentNumber", evento.target.value)}
          helperText="Tal como figura en el documento"
          errorText={errores?.documentNumber}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Nombres"
          value={valor.firstNames}
          autoComplete="off"
          onChange={(evento) => actualizar("firstNames", evento.target.value)}
          errorText={errores?.firstNames}
        />
        <Input
          label="Apellidos"
          value={valor.lastNames}
          autoComplete="off"
          onChange={(evento) => actualizar("lastNames", evento.target.value)}
          errorText={errores?.lastNames}
        />
      </div>

      <Input
        label="Fecha de nacimiento"
        type="date"
        value={valor.birthDate}
        onChange={(evento) => actualizar("birthDate", evento.target.value)}
        helperText="La edad se cuenta al día del viaje"
        errorText={errores?.birthDate}
      />

      {menor && (
        <div className="flex flex-col gap-4 rounded-field bg-info-fill p-4">
          <p className="text-sm text-info-text">
            Es menor de edad el día del viaje: indica quién lo acompaña. Necesita además el
            permiso notarial que piden las Condiciones Generales (punto 4).
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nombre del acompañante"
              value={valor.companionName}
              autoComplete="off"
              onChange={(evento) => actualizar("companionName", evento.target.value)}
              errorText={errores?.companionName}
            />
            <Input
              label="Parentesco"
              placeholder="Madre, padre, tío…"
              value={valor.companionRelationship}
              onChange={(evento) => actualizar("companionRelationship", evento.target.value)}
              errorText={errores?.companionRelationship}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
