import { ExclamationIcon } from "@/components/ui/icons";
import { SeccionPendiente } from "@/components/legal/SeccionPendiente";

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
    titulo: "Cambios, cancelaciones y reembolsos",
    descripcion: "Condiciones bajo las que un pasaje o un envío puede cambiarse, cancelarse o reembolsarse.",
  },
  {
    titulo: "Equipaje y encomiendas",
    descripcion: "Franquicia de equipaje, exceso de equipaje, y condiciones de transporte de encomiendas.",
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

      <div className="mt-4 flex items-start gap-2 rounded-md bg-warning-fill p-3 text-sm text-warning-text">
        <ExclamationIcon className="mt-0.5 !size-5 shrink-0" />
        <p>
          Esta página todavía no tiene el texto legal definitivo: muestra la estructura de
          secciones a cubrir, pendiente de redacción y aprobación por el área legal antes de
          publicarse.
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
