import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y condiciones — Ecosem H",
  description: "Consulta las condiciones de compra de pasajes y contratación de encomiendas de Ecosem H, y los derechos y obligaciones del servicio.",
};

import Link from "next/link";
import { CONDICIONES_CONTRATO_VIAJE } from "./condicionesContratoViaje";
import { TIPOS_SERVICIO } from "@/lib/servicios";

const SECCIONES = [
  {
    "titulo": "Objeto y aceptación de los términos",
    "texto": "Estos términos regulan la compra de pasajes y la contratación de encomiendas de Ecosem H. Antes de confirmar una operación, revisa los datos, la ruta, la fecha, el horario, la clase y el importe. La contratación no supone renunciar a tus derechos como consumidor."
  },
  {
    "titulo": "Empresa y contacto",
    "texto": "Ecosem H es el nombre comercial de la empresa constituida en noviembre de 2015. Casa matriz: Jr. Luna Pizarro N°338, La Victoria, Lima. Para consultas o solicitudes escribe a ventas@ecosemh.com o llama al 953 249 763."
  },
  {
    "titulo": "Descripción del servicio",
    "texto": "Prestamos servicios de transporte interprovincial de pasajeros y encomiendas. Nuestros destinos incluyen Lima, Cerro de Pasco, Huancayo, Carhuamayo, Junín y Concepción. Las rutas, horarios, asientos y clases disponibles para contratar son los que se muestran en la búsqueda de tu fecha; esta relación de destinos no implica que existan viajes directos entre todos ellos."
  },
  {
    "titulo": "Registro y datos de la compra",
    "texto": "Ingresa datos completos y correctos del pasajero y un medio de contacto válido. Si compras para otra persona, debes contar con su autorización para proporcionar sus datos. Mantén tus credenciales de cuenta bajo tu control. El documento de identidad debe corresponder al pasajero que embarca."
  },
  {
    "titulo": "Precios y medios de pago",
    "texto": "El importe se informa antes del pago y queda fijado al iniciar la reserva. La reserva temporal de asiento dura 10 minutos; no equivale a una compra confirmada. Usa los medios habilitados en la pantalla de pago. La confirmación depende de la validación del pago por la pasarela; una redirección del navegador por sí sola no acredita la compra. Conserva el boleto y la constancia de pago."
  },
  {
    "titulo": "Cancelaciones y reembolsos",
    "texto": "Puedes solicitar la cancelación de tu pasaje hasta 24 horas antes de la salida programada. Comunícate con ventas@ecosemh.com, al 953 249 763 o en el punto de venta, indicando el código de reserva y el viaje. La atención es por estos canales: no se realiza una devolución automática desde esta página. Solicita la confirmación de la cancelación y la información sobre el importe y medio de devolución que correspondan a tu compra. No se establece aquí un porcentaje de retención ni un plazo de abono no confirmado. Esta política no limita los remedios legales ante un incumplimiento atribuible a la empresa. La postergación se rige por las condiciones de viaje indicadas arriba."
  },
  {
    "titulo": "Equipaje, niños y mascotas",
    "texto": "Cada pasajero puede llevar hasta 20 kg de equipaje sin recargo; el exceso está sujeto a capacidad y a la tarifa informada antes de aceptarlo. Desde los 5 años se paga el pasaje completo. No se admiten mascotas. Consulta las condiciones de embarque y documentación de menores antes de viajar."
  },
  {
    "titulo": "Condiciones de transporte de encomiendas",
    "texto": "Declara el contenido, peso, dimensiones y datos del remitente y destinatario. El precio se determina por el mayor entre el peso real y el volumétrico (largo × ancho × alto en centímetros ÷ 5000); la franquicia de equipaje no se aplica a encomiendas. Consulta la admisión del contenido y las condiciones de entrega antes de pagar. No entregues bienes ilícitos ni mercancías peligrosas cuya recepción no está autorizada. Conserva la guía para identificar el envío y comunicar cualquier incidencia. Para cancelar un envío aún no despachado, solicita la evaluación en el punto de venta; la regla de 24 horas de pasajes no se extiende a encomiendas."
  },
  {
    "titulo": "Responsabilidad de la empresa y del usuario",
    "texto": "Ecosem H responde por la idoneidad del servicio contratado y por los incumplimientos que le sean atribuibles conforme a la legislación peruana. El usuario debe proporcionar información veraz, cumplir las indicaciones de seguridad y presentar la documentación necesaria para viajar o recoger un envío. Una incidencia o alteración del servicio debe comunicarse por los canales de contacto para evaluar la solución que corresponda. Ninguna condición excluye responsabilidades que la ley impone a la empresa."
  },
  {
    "titulo": "Reclamos y ley aplicable",
    "texto": "Se aplican la Ley N.° 29571, Código de Protección y Defensa del Consumidor; el DS N.° 011-2011-PCM, Reglamento del Libro de Reclamaciones y sus modificatorias; el DS N.° 017-2009-MTC, Reglamento Nacional de Administración de Transporte (RENAT), y la RS N.° 156-2003/SUNAT, sobre boleto de viaje y manifiesto de pasajeros, en lo que corresponda. Puedes presentar un reclamo en el Libro de Reclamaciones enlazado en este sitio, sin perjuicio de acudir a Indecopi o a la autoridad competente. No se impone una jurisdicción exclusiva que restrinja tus derechos."
  },
  {
    "titulo": "Modificaciones a estos términos",
    "texto": "Las actualizaciones se publicarán en esta página con su fecha. Las condiciones de una compra ya realizada no se modifican retroactivamente en perjuicio del consumidor. Última actualización: 6 de noviembre de 2026."
  }
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

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-navy">Clases de servicio</h2>
        <ul className="mt-3 space-y-3 text-sm text-text-secondary">
          {TIPOS_SERVICIO.map((servicio) => (
            <li key={servicio.value}><strong>{servicio.label}:</strong> {servicio.descripcion}</li>
          ))}
        </ul>
      </section>
      <div className="mt-6 space-y-6">
        {SECCIONES.map((seccion) => (
          <section key={seccion.titulo}>
            <h2 className="text-lg font-semibold text-navy">{seccion.titulo}</h2>
            <p className="mt-3 text-sm text-text-secondary">{seccion.texto}</p>
          </section>
        ))}
      </div>
      <p className="mt-6 text-sm text-text-secondary">
        <a href="mailto:ventas@ecosemh.com" className="text-secondary underline">ventas@ecosemh.com</a>
        {" · "}<a href="tel:+51953249763" className="text-secondary underline">953 249 763</a>
        {" · "}<Link href="/libro-de-reclamaciones" className="text-secondary underline">Libro de Reclamaciones</Link>
      </p>
    </main>
  );
}
