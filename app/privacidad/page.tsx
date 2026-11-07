import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de privacidad — Ecosem H",
  description: "Conoce cómo Ecosem H trata tus datos personales, para qué los utiliza y cómo ejercer tus derechos de protección de datos.",
};

import Link from "next/link";

const SECCIONES = [
  {
    "titulo": "Responsable y contacto",
    "texto": "Ecosem H trata los datos necesarios para prestar sus servicios. Casa matriz: Jr. Luna Pizarro N°338, La Victoria, Lima. Contacto para privacidad y solicitudes sobre tus datos: ventas@ecosemh.com; teléfono: 953 249 763."
  },
  {
    "titulo": "Datos personales recabados y finalidades",
    "texto": "Para reservar y emitir pasajes se solicitan nombres, apellidos, tipo y número de documento y fecha de nacimiento del pasajero. Para menores se recogen también los datos de acompañamiento o parentesco requeridos en el formulario. Se usan para identificar al viajero, verificar las condiciones de viaje y preparar el boleto y el manifiesto. El correo y el celular de contacto permiten comunicar el estado de la compra y atender incidencias. En encomiendas se recogen datos de identificación y contacto del remitente y destinatario, así como los datos del envío, para registrarlo y entregarlo. Si creas una cuenta, sus datos permiten autenticarte y consultar tus compras. Los datos de facturación y referencias de pago se utilizan para comprobar el pago y sustentar la operación; los datos que introduces directamente en la pasarela se tratan también bajo su propia política."
  },
  {
    "titulo": "Documento del pasajero y base legal",
    "texto": "El documento de identidad no se pide solo por conveniencia comercial: es necesario por obligación legal para identificar al pasajero en el boleto de viaje y en el manifiesto de pasajeros, conforme a la RS N.° 156-2003/SUNAT y al DS N.° 017-2009-MTC (RENAT), según corresponda. Sin los datos obligatorios no puede completarse la emisión. El tratamiento necesario para ejecutar la compra o cumplir estas obligaciones se distingue de los usos que requieren consentimiento. Cuando el formulario solicita autorización para mensajes por WhatsApp, se refiere a esa compra o envío; no autoriza publicidad general."
  },
  {
    "titulo": "Destinatarios y proveedores",
    "texto": "Los datos del boleto, manifiesto y comprobantes se comparten con SUNAT y con la autoridad de transporte cuando lo exige la normativa o un requerimiento válido. Los proveedores que intervienen en alojamiento, autenticación, procesamiento de pagos, facturación o comunicaciones pueden tratar los datos necesarios para su función. Esto incluye el número y el mensaje cuando se utiliza WhatsApp para una comunicación autorizada. El uso de infraestructura de proveedores puede implicar tratamiento fuera del Perú y está sujeto a las garantías exigidas por la legislación de datos personales. No se autoriza con esta política la venta de datos ni su uso publicitario por terceros."
  },
  {
    "titulo": "Plazo de conservación",
    "texto": "Los documentos y antecedentes sujetos a obligaciones tributarias se conservan cinco años o durante el plazo de prescripción del tributo, el que resulte mayor (artículo 87, numeral 7, del Código Tributario). El cómputo de los cinco años comienza el 1 de enero del año siguiente al vencimiento de la declaración correspondiente. Para otros datos de cuenta, contacto y atención se considera la duración de la relación y el tiempo necesario para resolver obligaciones, reclamos o responsabilidades aplicables; no se fija aquí un plazo único para registros con finalidades distintas. Puedes solicitar información sobre el plazo aplicable a tu caso al correo indicado. No hay un borrado automático de pasajeros disponible en la web: una solicitud de cancelación de datos requiere evaluación, y los registros de conservación obligatoria no se eliminan por el solo hecho de pedirlo."
  },
  {
    "titulo": "Derechos ARCO y cómo ejercerlos",
    "texto": "Puedes solicitar acceso a tus datos y a la información sobre su tratamiento, rectificación de datos inexactos, cancelación cuando proceda y oposición por los motivos previstos en la ley. Escribe a ventas@ecosemh.com con el asunto «Solicitud ARCO», indicando tu nombre, el derecho que deseas ejercer, los datos o la operación a los que se refiere y un medio para responderte. La empresa deberá verificar tu identidad o representación antes de entregar o modificar información; evita adjuntar documentos innecesarios en el primer mensaje. La solicitud se evalúa conforme a los requisitos y plazos legales, incluidas las limitaciones por conservación obligatoria. Si no obtienes atención o discrepas de la respuesta, puedes acudir a la Autoridad Nacional de Protección de Datos Personales."
  },
  {
    "titulo": "Seguridad y almacenamiento de sesión",
    "texto": "El acceso a la cuenta requiere autenticación y los servicios verifican los permisos para consultar información. El navegador conserva identificadores de sesión para mantener el acceso y la continuidad de la compra. Cerrar sesión en un equipo compartido ayuda a proteger tus datos. Si detectas un acceso indebido, comunícalo a ventas@ecosemh.com. Ningún medio de transmisión o almacenamiento permite asegurar ausencia absoluta de incidentes."
  },
  {
    "titulo": "Marco normativo y cambios",
    "texto": "Esta política se rige por la Ley N.° 29733, Ley de Protección de Datos Personales, y su reglamento vigente, aprobado por DS N.° 016-2024-JUS. El DS N.° 003-2013-JUS fue el reglamento anterior y quedó derogado por el nuevo; se menciona como antecedente, no como norma vigente. Las actualizaciones se publicarán aquí y los nuevos usos que requieran consentimiento deberán solicitarlo. Última actualización: 6 de noviembre de 2026."
  }
];

export default function PrivacidadPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="text-xl font-semibold text-navy sm:text-2xl">Política de Privacidad</h1>
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
