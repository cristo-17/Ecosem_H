# 15 · Condiciones generales de contratación (texto real de la empresa)

**Rama:** `feature/condiciones-contratacion`

Lee primero `CLAUDE.md`, `.claude/skills/ecosem-design-system/SKILL.md` y
`docs/DECISIONES.md` (D-036).

## Qué cambia

Hasta ahora `/terminos` era solo estructura con marcadores, porque no había texto
real y CLAUDE.md prohíbe inventarlo. La empresa publicó sus condiciones generales
de contratación y ese texto **sí es oficial**: se incorpora literal.

## Texto a incorporar (literal, no reescribir ni "mejorar")

**CONDICIONES GENERALES DEL CONTRATO DE VIAJE**

1. El boleto es personal y válido para la fecha de viaje.
2. El pasajero deberá presentarse en la terminal 30 min antes de la salida del bus con su boleta de viaje y DNI.
3. Las postergaciones serán aceptadas únicamente hasta con cuatro (4) horas de anticipación a la hora programada del viaje. Estas estarán sujetas a las siguientes condiciones:
   - Podrán aplicarse gastos administrativos por la reprogramación.
   - En caso de que el nuevo pasaje tenga un precio mayor, el pasajero deberá abonar la diferencia correspondiente.
   - Si el nuevo pasaje tiene un precio menor al originalmente adquirido, no se realizará devolución alguna por la diferencia.
   - El pasajero tiene derecho a realizar la postergación de su boleto por 15 días hábiles, presencialmente. Por única vez.
4. Todo menor de edad que viaja acompañado de un familiar tiene que tener permiso notarial por sus padres.
5. Todo niño mayor o igual de 5 años tiene la obligación de pagar su pasaje.
6. En caso de pérdida de boleto el pasajero deberá de pagar la suma de S/. 5.00 soles por el duplicado del boleto.
7. Está prohibido el traslado de animales dentro del bus.
8. El pasajero perderá el derecho de viajar y valor del pasaje, cuando se presente bajo la influencia de alcohol, drogadicción y fuera de la hora de embarque.
9. El pasajero tiene derecho a 20 kilos de equipaje, entendiéndose como tal: maletas o maletines; el exceso será admitido cuando la capacidad del bus lo permita, previo pago de la tarifa vigente.
10. La empresa no se responsabiliza por pérdida de equipaje de cabina que no se encuentra declarado y verificado antes de embarcar.
11. Está prohibido transportar como equipaje: joyas, artefactos electrónicos o dinero en efectivo; los cuales deberán de ser declarados para ser transportados como especies valoradas.

## Alcance

**`/terminos`**

- Reemplazar los marcadores de "pendiente de redacción legal" por esta sección
  con el texto literal, numerada y legible.
- Mantener con marcador **solo** las secciones que estas condiciones no cubren
  (si las hay). No borrar un marcador cuyo contenido siga sin existir.

**`/ayuda` — actualizar las respuestas que hoy remiten a counter**

Estas ya tienen política definida y deben responderse con ella:

- _¿Puedo cambiar la fecha de mi pasaje?_ → postergación hasta 4 horas antes,
  presencial, una sola vez, dentro de 15 días hábiles, con posibles gastos
  administrativos; si el nuevo pasaje cuesta más se paga la diferencia, si cuesta
  menos no hay devolución.
- _¿Qué pasa si pierdo mi boleto?_ → duplicado por S/ 5.00.
- _¿Puedo viajar con mi mascota?_ → no, está prohibido el traslado de animales.
- _¿Qué no puedo llevar en el equipaje?_ → joyas, artefactos electrónicos y
  dinero en efectivo deben declararse como especies valoradas; el equipaje de
  cabina no declarado y verificado no está cubierto.
- _¿Los niños pagan pasaje?_ → desde los 5 años, sí. Menores acompañados
  necesitan permiso notarial de los padres.

Las que **siguen sin política definida** (cancelaciones, reembolsos, qué se puede
enviar como encomienda) se quedan remitiendo a counter. No inventar.

**`/privacidad`** — **no se toca.** Estas condiciones no son política de
privacidad. Sigue bloqueada esperando redacción legal (riesgo abierto en
`docs/ESTADO.md`).

## Fidelidad del texto

- Copiar literal, incluidas las rarezas de redacción ("S/. 5.00 soles").
- En `/ayuda` sí se puede parafrasear para que la respuesta sea clara, pero sin
  cambiar el sentido ni agregar condiciones que el texto no dice.
- Ante duda entre dos lecturas, usar la más restrictiva y anotarla.

## Consistencia a revisar

El punto 2 dice 30 minutos antes con boleta y DNI; el PDF del boleto ya dice lo
mismo. Confirmar que no haya contradicción en ningún otro lado del sitio.

## Verificación

- `/terminos` muestra el texto completo y legible en 360×640.
- Ninguna respuesta de `/ayuda` inventa una política.
- `npx tsc --noEmit && npx eslint . && npm run build` pasan.
- Actualizar `docs/DECISIONES.md` (D-036 queda parcialmente superada: términos
  sí, privacidad no) y `docs/ESTADO.md`.
- Registrar en `docs/BITACORA.md`.

## Anotar como pendiente, no implementar

El punto 5 implica que el contador de pasajeros debería distinguir adultos de
niños desde 5 años, y hoy no lo hace. Anotarlo en `docs/ESTADO.md` como vacío
funcional detectado, sin resolverlo en esta tarea.
