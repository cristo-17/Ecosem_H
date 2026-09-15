import { Select, type SelectOption } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import type { DatosPasajero, TipoDocumento } from "@/components/pasajes/PurchaseProvider";
import { calcularEscalonEquipaje } from "@/lib/mock/tarifario";
import { formatPrecio } from "@/lib/format";

export const OPCIONES_TIPO_DOCUMENTO: SelectOption[] = [
  { value: "dni", label: "DNI" },
  { value: "ce", label: "Carné de Extranjería" },
  { value: "pasaporte", label: "Pasaporte" },
];

export interface ErroresPasajero {
  tipoDocumento?: string;
  numeroDocumento?: string;
  nombres?: string;
  correo?: string;
  celular?: string;
}

export interface PassengerFormProps {
  /** 0-based, solo para el rótulo "Pasajero 1". */
  indice: number;
  asientoId: string;
  valor: DatosPasajero;
  errores?: ErroresPasajero;
  onChange: (valor: DatosPasajero) => void;
}

function mensajeEquipaje(kilos: number): { texto: string; esAdvertencia: boolean } {
  const resultado = calcularEscalonEquipaje(kilos);
  if (resultado.tipo === "incluido") {
    return { texto: "Dentro de la franquicia de 20 kg, sin recargo.", esAdvertencia: false };
  }
  if (resultado.tipo === "encomienda") {
    return { texto: "Más de 50 kg: se tarifica como encomienda, no como exceso de equipaje.", esAdvertencia: true };
  }
  const { escalon } = resultado;
  return {
    texto:
      escalon.recargo !== null
        ? `Escalón ${escalon.etiqueta}: recargo de ${formatPrecio(escalon.recargo)}.`
        : `Escalón ${escalon.etiqueta}: recargo pendiente de aprobación comercial.`,
    esAdvertencia: true,
  };
}

export function PassengerForm({ indice, asientoId, valor, errores, onChange }: PassengerFormProps) {
  function actualizar<K extends keyof DatosPasajero>(campo: K, siguiente: DatosPasajero[K]) {
    onChange({ ...valor, [campo]: siguiente });
  }

  const kilosEquipaje = Number(valor.equipajeKg);
  const equipajeValido = valor.equipajeKg.trim() !== "" && Number.isFinite(kilosEquipaje) && kilosEquipaje > 0;
  const infoEquipaje = equipajeValido ? mensajeEquipaje(kilosEquipaje) : null;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-navy">Pasajero {indice + 1}</h2>
        <span className="text-xs font-medium text-navy/50">Asiento {asientoId.replace(/^P\d-/, "")}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Tipo de documento"
          options={OPCIONES_TIPO_DOCUMENTO}
          value={valor.tipoDocumento}
          onChange={(nuevoValor) => actualizar("tipoDocumento", nuevoValor as TipoDocumento)}
          errorText={errores?.tipoDocumento}
        />
        <Input
          label="N.° de documento"
          value={valor.numeroDocumento}
          inputMode="numeric"
          onChange={(evento) => actualizar("numeroDocumento", evento.target.value)}
          helperText={
            valor.tipoDocumento === "dni" ? "Ingrese tal como figura en su DNI" : "Ingrese tal como figura en su documento"
          }
          errorText={errores?.numeroDocumento}
        />
      </div>

      <Input
        label="Nombres y apellidos"
        value={valor.nombres}
        onChange={(evento) => actualizar("nombres", evento.target.value)}
        errorText={errores?.nombres}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Correo electrónico"
          type="email"
          value={valor.correo}
          onChange={(evento) => actualizar("correo", evento.target.value)}
          errorText={errores?.correo}
        />
        <Input
          label="Celular"
          inputMode="numeric"
          value={valor.celular}
          onChange={(evento) => actualizar("celular", evento.target.value)}
          helperText="Debe contener exactamente 9 dígitos"
          errorText={errores?.celular}
        />
      </div>

      <div>
        <Input
          label="Equipaje declarado (kg)"
          inputMode="decimal"
          value={valor.equipajeKg}
          onChange={(evento) => actualizar("equipajeKg", evento.target.value)}
          helperText="Opcional. Franquicia de 20 kg incluida; más de eso paga un recargo por escalón."
        />
        {infoEquipaje && (
          <p className={`mt-1 text-sm ${infoEquipaje.esAdvertencia ? "text-warning-text" : "text-navy/60"}`}>
            {infoEquipaje.texto}
          </p>
        )}
      </div>
    </Card>
  );
}
