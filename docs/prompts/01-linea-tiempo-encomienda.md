# 01 · Línea de tiempo de rastreo de encomienda

Lee primero `.claude/skills/ecosem-design-system/SKILL.md` y revisa
`/app/styleguide` para reusar patrones existentes.

## Objetivo

En `/encomiendas/rastrear`, la línea de tiempo hoy muestra solo dos eventos
genéricos. Debe mostrar los cuatro estados del ciclo de vida de una encomienda,
con el punto actual claramente distinguible de los ya cumplidos y de los
pendientes.

## Estados (fijos, en este orden)

1. **Encomienda registrada** — recibida en counter de origen
2. **Alistando encomienda** — preparada para subir al bus o camión
3. **Encomienda en camino** — en tránsito hacia el destino
4. **Encomienda despachada** — entregada al destinatario

No agregar, quitar ni renombrar estados.

## Datos por evento

Cada estado cumplido muestra terminal y fecha/hora, con el formato del skill:
fecha larga "Sábado, 29 de Agosto" y hora en 12 horas con AM/PM.
Los estados aún no alcanzados no muestran fecha ni terminal.

## Diferenciación visual

Tres tratamientos distintos, no dos:

- **Cumplido:** punto relleno, texto en `--color-text-primary`, línea conectora
  en color de acento.
- **Actual:** el más destacado de los tres. Punto más grande con anillo alrededor
  (mismo recurso de "anillo vs relleno" que ya usa el DatePicker para distinguir
  hoy de seleccionado), etiqueta en negrita, y el Badge de estado de la encomienda
  alineado a este punto.
- **Pendiente:** punto vacío con borde, texto en `--color-text-secondary`, línea
  conectora atenuada.

El estado actual debe identificarse de un vistazo en un móvil de gama media a
360px de ancho. Que se distinga por forma y peso tipográfico, no solo por matiz
de color.

## Accesibilidad

- La lista es un `<ol>`; cada evento un `<li>`.
- El evento actual lleva `aria-current="step"`.
- No comunicar el estado únicamente por color: el texto ya nombra cada etapa,
  y el punto actual cambia de forma además de color.
- Contraste AA en todos los pares texto/fondo.

## Datos mock

Extender `lib/mock/` para que el rastreo devuelva los cuatro estados con
diferentes grados de avance, e incluir al menos tres guías de ejemplo:
una en `alistando`, una en `en_camino` y una `despachada`, para poder revisar
los tres casos sin tocar código.

## Restricciones

- Solo tokens de `globals.css`, nada de hex sueltos.
- Copy en español peruano.
- Sin `any`.

## Verificación

- 360×640, 768×1024 y 1440×900 sin overflow horizontal.
- `npx tsc --noEmit && npx eslint . && npm run build` pasan.
- Si se crea un componente reutilizable de línea de tiempo, agregarlo a
  `/styleguide` con los tres estados visibles.
