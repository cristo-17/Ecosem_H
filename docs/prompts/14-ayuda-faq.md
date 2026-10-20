# 14 · Ayuda, preguntas frecuentes y contenido legal

**Rama:** `feature/ayuda`

Lee primero `CLAUDE.md` y `.claude/skills/ecosem-design-system/SKILL.md`.

## Estado actual

`/ayuda` es una página placeholder. Además el footer referencia contenido legal
que no existe como página propia.

## Alcance

**`/ayuda`** — preguntas frecuentes agrupadas

- _Pasajes:_ cómo comprar, cómo descargar el boleto, qué presentar al embarcar,
  qué pasa si pierdo el bus, cómo cambiar o cancelar.
- _Encomiendas:_ cómo cotizar, cómo rastrear, qué se puede enviar, qué documento
  necesita el destinatario para recoger.
- _Equipaje:_ franquicia de 20 kg, cómo se cobra el exceso, qué no se puede
  llevar.
- _Pagos:_ medios aceptados (Yape, Plin, tarjeta), cuándo se confirma la compra,
  boleta vs factura.
- _Cuenta:_ cómo registrarse, recuperar contraseña, ver historial.

Formato acordeón accesible: `<button>` con `aria-expanded`, contenido asociado
por `aria-controls`, navegable por teclado. No usar `<details>` sin estilar si
eso rompe el lenguaje visual del sistema.

**`/terminos`** — términos y condiciones del servicio
**`/privacidad`** — política de privacidad

Ambas enlazadas desde el footer y desde la casilla de aceptación del registro.

## Advertencia sobre el contenido legal

**No redactar términos y condiciones ni política de privacidad inventados.**
Un texto legal generado sin revisión es un riesgo, no un entregable.

Lo que sí corresponde hacer:

- Construir la estructura de la página con los encabezados de las secciones que
  la Ley 29733 y el Código de Protección al Consumidor exigen cubrir (finalidad
  del tratamiento, datos recabados, plazo de conservación, derechos ARCO y cómo
  ejercerlos, encargados del tratamiento).
- Dejar cada sección con un marcador evidente de "pendiente de redacción legal".
- Anotarlo en `docs/ESTADO.md` como dependencia externa: requiere revisión legal
  antes de publicar.

Las cláusulas de contratación ya publicadas por la empresa (de donde sale la
franquicia de 20 kg) son la base para el área legal, no para el agente.

## Restricciones

- Copy de las FAQ en español peruano, tono claro y directo.
- Las respuestas deben coincidir con las reglas reales del sistema: 20 kg de
  franquicia, volumétrico ÷ 5000, confirmación de pago por webhook, 10 minutos de
  reserva temporal. **No inventar políticas** de cambios, cancelaciones ni
  reembolsos que nadie definió: si no está definida, decir que se consulte en
  counter.
- Enlace al Libro de Reclamaciones desde `/ayuda`.
- Sin `any`.

## Verificación

- Acordeón navegable por teclado, con `aria-expanded` correcto.
- Ningún texto legal inventado; todos los marcadores visibles.
- 360×640, 768×1024 y 1440×900 sin overflow horizontal.
- `npx tsc --noEmit && npx eslint . && npm run build` pasan.
- Registrar en `docs/BITACORA.md`.
