/**
 * Contenido de /ayuda (docs/prompts/14-ayuda-faq.md). Las respuestas
 * describen únicamente reglas que existen de verdad en el sistema (20 kg de
 * franquicia, peso volumétrico ÷ 5000, confirmación de pago por webhook,
 * reserva temporal de 10 minutos). Donde el prompt lista un tema sin que
 * exista una política definida (qué pasa si pierdes el bus, cambios,
 * cancelaciones, reembolsos, qué se puede enviar, qué no se puede llevar),
 * la respuesta remite a counter en vez de inventar una regla.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { RUTAS } from "@/lib/routes";

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
        id: "perder-bus",
        pregunta: "¿Qué pasa si pierdo el bus?",
        respuesta: "Todavía no tenemos una política publicada para este caso: consulta directamente en counter.",
      },
      {
        id: "cambiar-cancelar",
        pregunta: "¿Cómo cambio o cancelo mi pasaje?",
        respuesta: "Todavía no tenemos una política publicada de cambios ni cancelaciones: consulta en counter.",
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
        respuesta: "20 kg por pasajero, incluidos en el precio del pasaje.",
      },
      {
        id: "exceso",
        pregunta: "¿Cómo se cobra el exceso de equipaje?",
        respuesta:
          "Por escalones de peso, no por kilo exacto: de 21 a 30 kg y de 31 a 50 kg. Más de 50 kg se cobra como una encomienda, no como exceso de equipaje. Los montos de cada escalón todavía no están definidos: consulta en counter.",
      },
      {
        id: "no-llevar",
        pregunta: "¿Qué no puedo llevar?",
        respuesta: "Todavía no tenemos publicada una lista de artículos restringidos: consulta en counter.",
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
