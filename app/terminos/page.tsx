import { ExclamationIcon } from "@/components/ui/icons";
import { SeccionPendiente } from "@/components/legal/SeccionPendiente";
import { CONDICIONES_CONTRATO_VIAJE } from "./condicionesContratoViaje";

const SECCIONES = [
  {
    titulo: "Objeto y aceptación de los términos",
    descripcion: "Qué cubre este documento y qué implica usar la plataforma de Ecosem H.",
  },
  {
    titulo: "Descripción del servicio",
    descripcion: "Venta de pasajes interprovinciales y envío de encomiendas entre Lima, Cerro de Pasco y Huancayo.",
  },
  {
    titulo: "Registro y cuenta de usuario",
    descripcion: "Condiciones para crear una cuenta y responsabilidad sobre los datos ingresados.",
  },
  {
    titulo: "Precios y medios de pago",
    descripcion: "Cómo se fijan los precios, medios de pago aceptados y el momento en que se confirma una compra.",
  },
  {
    titulo: "Cancelaciones y reembolsos",
    descripcion:
      "El cambio de fecha de un pasaje (postergación) ya está cubierto arriba, en las Condiciones Generales del Contrato de Viaje. Lo que falta: bajo qué condiciones un pasaje o un envío puede cancelarse o reembolsarse.",
  },
  {
    titulo: "Condiciones de transporte de encomiendas",
    descripcion:
      "La franquicia y el exceso de equipaje de pasajero ya están cubiertos arriba, en las Condiciones Generales del Contrato de Viaje. Lo que falta: las condiciones de transporte de encomiendas (qué se puede enviar, responsabilidad de la empresa sobre el envío).",
  },
  {
    titulo: "Responsabilidad de la empresa y del usuario",
    descripcion: "Alcance y límites de la responsabilidad de EMPCOSEM S.A. frente al usuario, y viceversa.",
  },
  {
    titulo: "Modificaciones a estos términos",
    descripcion: "Cómo y cuándo la empresa puede actualizar este documento.",
  },
  {
    titulo: "Ley aplicable y jurisdicción",
    descripcion: "Marco legal peruano bajo el que se rige este documento.",
  },
];

export default function TerminosPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="text-xl font-semibold text-navy sm:text-2xl">Términos y Condiciones</h1>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-navy">Condiciones Generales del Contrato de Viaje</h2>
        <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm text-navy/80">
          {CONDICIONES_CONTRATO_VIAJE.map((condicion, indice) => (
            <li key={indice}>
              {condicion.texto}
              {condicion.subpuntos && (
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {condicion.subpuntos.map((subpunto, subindice) => (
                    <li key={subindice}>{subpunto}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-8 flex items-start gap-2 rounded-md bg-warning-fill p-3 text-sm text-warning-text">
        <ExclamationIcon className="mt-0.5 !size-5 shrink-0" />
        <p>
          El resto de esta página todavía no tiene el texto legal definitivo: muestra la
          estructura de secciones que las condiciones de arriba no cubren, pendientes de
          redacción y aprobación por el área legal antes de publicarse.
        </p>
      </div>

      <div className="mt-2 flex flex-col">
        {SECCIONES.map((seccion) => (
          <SeccionPendiente key={seccion.titulo} titulo={seccion.titulo} descripcion={seccion.descripcion} />
        ))}
      </div>
    </main>
  );
}
