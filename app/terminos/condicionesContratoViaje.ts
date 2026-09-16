/**
 * Condiciones Generales del Contrato de Viaje (docs/prompts/15-condiciones-contratacion.md):
 * texto oficial ya publicado por la empresa, incorporado literal — sin
 * reescribir ni "mejorar" la redacción, rarezas incluidas ("S/. 5.00
 * soles"). No confundir con las 9 secciones de /terminos que siguen
 * pendientes de redacción legal (docs/DECISIONES.md, D-036/D-038): este es
 * un documento operativo distinto (reglas del día de viaje), no la
 * cobertura completa de un contrato de términos y condiciones.
 */
export interface CondicionContratoViaje {
  texto: string;
  subpuntos?: string[];
}

export const CONDICIONES_CONTRATO_VIAJE: CondicionContratoViaje[] = [
  { texto: "El boleto es personal y válido para la fecha de viaje." },
  {
    texto:
      "El pasajero deberá presentarse en la terminal 30 min antes de la salida del bus con su boleta de viaje y DNI.",
  },
  {
    texto:
      "Las postergaciones serán aceptadas únicamente hasta con cuatro (4) horas de anticipación a la hora programada del viaje. Estas estarán sujetas a las siguientes condiciones:",
    subpuntos: [
      "Podrán aplicarse gastos administrativos por la reprogramación.",
      "En caso de que el nuevo pasaje tenga un precio mayor, el pasajero deberá abonar la diferencia correspondiente.",
      "Si el nuevo pasaje tiene un precio menor al originalmente adquirido, no se realizará devolución alguna por la diferencia.",
      "El pasajero tiene derecho a realizar la postergación de su boleto por 15 días hábiles, presencialmente. Por única vez.",
    ],
  },
  {
    texto: "Todo menor de edad que viaja acompañado de un familiar tiene que tener permiso notarial por sus padres.",
  },
  { texto: "Todo niño mayor o igual de 5 años tiene la obligación de pagar su pasaje." },
  {
    texto:
      "En caso de pérdida de boleto el pasajero deberá de pagar la suma de S/. 5.00 soles por el duplicado del boleto.",
  },
  { texto: "Está prohibido el traslado de animales dentro del bus." },
  {
    texto:
      "El pasajero perderá el derecho de viajar y valor del pasaje, cuando se presente bajo la influencia de alcohol, drogadicción y fuera de la hora de embarque.",
  },
  {
    texto:
      "El pasajero tiene derecho a 20 kilos de equipaje, entendiéndose como tal: maletas o maletines; el exceso será admitido cuando la capacidad del bus lo permita, previo pago de la tarifa vigente.",
  },
  {
    texto:
      "La empresa no se responsabiliza por pérdida de equipaje de cabina que no se encuentra declarado y verificado antes de embarcar.",
  },
  {
    texto:
      "Está prohibido transportar como equipaje: joyas, artefactos electrónicos o dinero en efectivo; los cuales deberán de ser declarados para ser transportados como especies valoradas.",
  },
];
