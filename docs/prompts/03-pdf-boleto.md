# 03 · Rediseño del PDF del boleto

Lee primero `.claude/skills/ecosem-design-system/SKILL.md`.

## Objetivo

El PDF actual es texto plano sin estructura ni identidad. Debe verse como un
boleto real de la empresa, legible en pantalla de celular y al imprimirse en
blanco y negro.

## Contenido obligatorio

**Cabecera**
- Logotipo Ecosem H
- Razón social EMPCOSEM S.A. y RUC
- Título "Boleto de viaje"
- Código de reserva en grande, es el dato que más se busca

**Datos del viaje**
- Ruta origen → destino con terminal de cada extremo
- Fecha y hora de salida (fecha larga, hora 12h con AM/PM)
- Tipo de servicio y asiento(s)
- Cantidad de pasajeros

**Datos del pasajero**
- Nombre completo
- Documento **parcialmente enmascarado** (ej. `********13`), nunca completo:
  el PDF se reenvía por WhatsApp y queda fuera de nuestro control

**Pago**
- Monto total en formato `S/ 00.00`
- Tipo de comprobante (boleta o factura)

**Código QR**
- Ocupando un espacio claro y con margen suficiente para escanearse desde
  pantalla de celular
- Debajo, el código de reserva en texto como respaldo si el QR no lee

**Pie**
- Indicación de presentarse con anticipación
- Franquicia de equipaje: 20 kg por pasajero, el exceso se cobra por rangos
- Enlace al Libro de Reclamaciones

## Diseño

- Una sola página A4.
- Paleta y tipografía del sistema. Si IBM Plex Sans no está disponible en el
  generador de PDF, usar una alternativa sans legible y dejarlo anotado, sin
  inventar una fuente de marca.
- Debe seguir siendo legible impreso en blanco y negro: la jerarquía se sostiene
  con tamaño y peso tipográfico, no solo con color.
- Nada de degradados ni fondos oscuros a página completa: gasto de tinta y
  peor legibilidad al imprimir.

## Nota sobre el QR

En esta etapa el contenido del QR puede ser un valor mock. Cuando exista backend,
debe contener un identificador firmado (HMAC) validable **sin conexión** por la
app de embarque. Dejar la generación aislada en una función propia para que
cambiar el contenido no implique rehacer el layout.

## Restricciones

- Copy en español peruano.
- No inventar RUC, direcciones ni datos societarios: si un dato no está
  disponible, dejar un marcador evidente y anotarlo.
- Sin `any`.

## Verificación

- Generar un PDF de ejemplo y abrirlo para revisarlo, no solo compilar.
- Probar con el caso de dos pasajeros y dos asientos, que es donde el layout
  suele romperse.
- `npx tsc --noEmit && npx eslint . && npm run build` pasan.
