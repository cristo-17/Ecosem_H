/**
 * Contenido de /ayuda (docs/prompts/14-ayuda-faq.md, actualizado por
 * docs/prompts/15-condiciones-contratacion.md). Las respuestas describen
 * únicamente reglas que existen de verdad en el sistema o en las
 * Condiciones Generales del Contrato de Viaje ya publicadas por la empresa
 * (ver /terminos): franquicia de 20 kg, peso volumétrico ÷ 5000,
 * confirmación de pago por webhook, reserva temporal de 10 minutos,
 * postergación, duplicado de boleto, mascotas, menores de edad, equipaje no
 * declarado. Donde ni el sistema ni esas condiciones definen una política
 * (perder el bus, cancelaciones, reembolsos, qué se puede enviar como
 * encomienda, qué documento pide el destinatario), la respuesta remite a
 * counter en vez de inventar una regla.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { RUTAS } from "@/lib/routes";
import { formatPrecio } from "@/lib/format";

export interface PreguntaFrecuente {
  id: string;
  pregunta: string;
  respuesta: ReactNode;
}

export interface CategoriaFaq {
  id: string;
  titulo: string;
  preguntas: PreguntaFrecuente[];
}

export const CATEGORIAS_FAQ: CategoriaFaq[] = [
  {
    id: "pasajes",
    titulo: "Pasajes",
    preguntas: [
      {
        id: "comprar",
        pregunta: "¿Cómo compro un pasaje?",
        respuesta:
          "Busca tu ruta desde el inicio, elige el viaje y el asiento, ingresa los datos de cada pasajero y paga con Yape, Plin o tarjeta. Tu asiento queda apartado por 10 minutos mientras completas esos pasos.",
      },
      {
        id: "descargar-boleto",
        pregunta: "¿Cómo descargo mi boleto?",
        respuesta: (
          <>
            Al confirmarse el pago se genera un boleto en PDF con un código QR, disponible para
            descargar desde la pantalla de confirmación. También puedes volver a descargarlo
            desde{" "}
            <Link href={RUTAS.miPerfil} className="text-secondary underline">
              Mi perfil → Mis viajes
            </Link>
            .
          </>
        ),
      },
      {
        id: "que-presentar",
        pregunta: "¿Qué debo presentar al embarcar?",
        respuesta:
          "El código QR de tu boleto (o el código de reserva impreso como respaldo si no tienes cobertura) y tu documento de identidad.",
      },
      {
        id: "perder-boleto",
        pregunta: "¿Qué pasa si pierdo mi boleto?",
        respuesta: (
          <>Puedes solicitar un duplicado en counter, pagando {formatPrecio(5)} por el trámite.</>
        ),
      },
      {
        id: "perder-bus",
        pregunta: "¿Qué pasa si pierdo el bus?",
        respuesta: "Todavía no tenemos una política publicada para este caso: consulta directamente en counter.",
      },
      {
        id: "cambiar-fecha",
        pregunta: "¿Puedo cambiar la fecha de mi pasaje?",
        respuesta:
          "Sí, mediante una postergación: se solicita presencialmente hasta 4 horas antes de la hora programada del viaje, por única vez, con la nueva fecha dentro de los 15 días hábiles siguientes al viaje original. Puede aplicarse un gasto administrativo. Si el nuevo pasaje cuesta más, pagas la diferencia; si cuesta menos, no hay devolución.",
      },
      {
        id: "cancelar",
        pregunta: "¿Puedo cancelar mi pasaje?",
        respuesta: "Todavía no tenemos una política publicada de cancelaciones ni reembolsos: consulta en counter.",
      },
      {
        id: "mascotas",
        pregunta: "¿Puedo viajar con mi mascota?",
        respuesta: "No, está prohibido el traslado de animales dentro del bus.",
      },
      {
        id: "ninos",
        pregunta: "¿Los niños pagan pasaje?",
        respuesta:
          "Sí, desde los 5 años. Si el menor de edad viaja acompañado de un familiar, necesita permiso notarial de sus padres.",
      },
    ],
  },
  {
    id: "encomiendas",
    titulo: "Encomiendas",
    preguntas: [
      {
        id: "cotizar",
        pregunta: "¿Cómo cotizo un envío?",
        respuesta: (
          <>
            Desde{" "}
            <Link href={RUTAS.enviarEncomienda} className="text-secondary underline">
              Enviar Encomienda
            </Link>
            , indicando origen, destino, peso y dimensiones del paquete. El sistema calcula el
            peso a facturar (el mayor entre el peso real y el volumétrico, que es largo × ancho ×
            alto en cm ÷ 5000) y te muestra el costo si la ruta ya tiene tarifa definida.
          </>
        ),
      },
      {
        id: "rastrear",
        pregunta: "¿Cómo rastreo mi encomienda?",
        respuesta: (
          <>
            Desde{" "}
            <Link href={RUTAS.rastrearEncomienda} className="text-secondary underline">
              Rastrear Encomienda
            </Link>{" "}
            con el número de guía que te dieron al registrar el envío.
          </>
        ),
      },
      {
        id: "que-enviar",
        pregunta: "¿Qué puedo enviar?",
        respuesta:
          "Todavía no tenemos publicada una lista de artículos permitidos o prohibidos: consulta en counter antes de enviar algo fraccionable, perecible o de alto valor.",
      },
      {
        id: "documento-destinatario",
        pregunta: "¿Qué documento necesita el destinatario para recoger?",
        respuesta: "Todavía no está definido: consulta en counter antes de coordinar la recogida.",
      },
    ],
  },
  {
    id: "equipaje",
    titulo: "Equipaje",
    preguntas: [
      {
        id: "franquicia",
        pregunta: "¿Cuánto equipaje puedo llevar sin costo?",
        respuesta: "20 kg por pasajero (maletas o maletines), incluidos en el precio del pasaje.",
      },
      {
        id: "exceso",
        pregunta: "¿Cómo se cobra el exceso de equipaje?",
        respuesta:
          "Por escalones de peso, no por kilo exacto: de 21 a 30 kg y de 31 a 50 kg. El exceso se admite solo si la capacidad del bus lo permite, previo pago de la tarifa vigente — los montos de cada escalón todavía no están definidos: consulta en counter. Más de 50 kg se cobra como una encomienda, no como exceso de equipaje.",
      },
      {
        id: "no-llevar",
        pregunta: "¿Qué no puedo llevar en el equipaje?",
        respuesta:
          "Joyas, artefactos electrónicos y dinero en efectivo deben declararse para transportarse como especies valoradas. El equipaje de cabina que no se declara y verifica antes de embarcar no está cubierto por la empresa si se pierde.",
      },
    ],
  },
  {
    id: "pagos",
    titulo: "Pagos",
    preguntas: [
      {
        id: "medios",
        pregunta: "¿Qué medios de pago aceptan?",
        respuesta: "Yape, Plin y tarjeta.",
      },
      {
        id: "confirmacion",
        pregunta: "¿Cuándo se confirma mi compra?",
        respuesta:
          "Solo cuando la pasarela de pago confirma que el cobro se realizó. Nunca antes: si cierras la ventana justo después de pagar, tu compra igual se confirma apenas llegue esa confirmación.",
      },
      {
        id: "boleta-factura",
        pregunta: "¿Boleta o factura?",
        respuesta: "Puedes elegir entre boleta o factura al momento de pagar.",
      },
      {
        id: "reserva-temporal",
        pregunta: "¿Por cuánto tiempo se reserva mi asiento mientras pago?",
        respuesta:
          "10 minutos desde que eliges el asiento. Si ese tiempo se agota sin completar el pago, el asiento se libera y deberás elegirlo de nuevo.",
      },
    ],
  },
  {
    id: "cuenta",
    titulo: "Cuenta",
    preguntas: [
      {
        id: "registrarse",
        pregunta: "¿Cómo me registro?",
        respuesta: (
          <>
            Desde{" "}
            <Link href={RUTAS.registro} className="text-secondary underline">
              Regístrate
            </Link>{" "}
            en la pantalla de ingreso, con tus datos y una contraseña.
          </>
        ),
      },
      {
        id: "recuperar-clave",
        pregunta: "¿Cómo recupero mi contraseña?",
        respuesta: (
          <>
            Desde{" "}
            <Link href={RUTAS.recuperarClave} className="text-secondary underline">
              ¿Olvidaste tu contraseña?
            </Link>{" "}
            en la pantalla de ingreso.
          </>
        ),
      },
      {
        id: "historial",
        pregunta: "¿Cómo veo mi historial de viajes y encomiendas?",
        respuesta: (
          <>
            Desde{" "}
            <Link href={RUTAS.miPerfil} className="text-secondary underline">
              Mi perfil
            </Link>
            , en las pestañas &quot;Mis viajes&quot; y &quot;Mis encomiendas&quot;.
          </>
        ),
      },
    ],
  },
];
