import { ExclamationIcon } from "@/components/ui/icons";
import { SeccionPendiente } from "@/components/legal/SeccionPendiente";

// Los 5 encabezados que exige cubrir la Ley 29733 (pedido explícito del
// prompt) van primero; los últimos dos son estructura estándar de una
// política de privacidad, no una exigencia legal citada por el prompt.
const SECCIONES = [
  {
    titulo: "Finalidad del tratamiento de datos personales",
    descripcion: "Para qué se usan los datos personales que se recaban en la plataforma.",
  },
  {
    titulo: "Datos personales recabados",
    descripcion: "Qué datos se piden (por ejemplo DNI, nombres, correo, celular) y en qué momentos.",
  },
  {
    titulo: "Plazo de conservación de los datos",
    descripcion: "Por cuánto tiempo se conservan los datos personales una vez recabados.",
  },
  {
    titulo: "Encargados del tratamiento",
    descripcion:
      "Terceros que procesan datos personales por encargo de la empresa (por ejemplo la pasarela de pagos y el proveedor de facturación electrónica).",
  },
  {
    titulo: "Derechos ARCO y cómo ejercerlos",
    descripcion:
      "Cómo acceder, rectificar, cancelar u oponerte al tratamiento de tus datos personales, conforme a la Ley N.° 29733.",
  },
  {
    titulo: "Medidas de seguridad",
    descripcion: "Medidas técnicas y organizativas para proteger los datos personales.",
  },
  {
    titulo: "Cambios a esta política",
    descripcion: "Cómo y cuándo se puede actualizar este documento.",
  },
];

export default function PrivacidadPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="text-xl font-semibold text-navy sm:text-2xl">Política de Privacidad</h1>

      <div className="mt-4 flex items-start gap-2 rounded-md bg-warning-fill p-3 text-sm text-warning-text">
        <ExclamationIcon className="mt-0.5 !size-5 shrink-0" />
        <p>
          Esta página todavía no tiene el texto legal definitivo: muestra la estructura de
          secciones que exige cubrir la Ley N.° 29733 (Ley de Protección de Datos Personales),
          pendiente de redacción y aprobación por el área legal antes de publicarse.
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
