# 12 · Módulo de flota: alertas

**Rama:** `feature/alertas-flota`

Lee primero `CLAUDE.md` y la sección 4.3 de la propuesta técnica.

## Alcance acordado

**Sistema de alertas, no gestión integral de flota.** El sistema notifica; la
decisión y el registro de la acción quedan en el área operativa. No construir un
módulo de mantenimiento preventivo: eso viene después, apoyado en el histórico
que esta versión empieza a acumular.

## Alcance

**`/panel/flota`** — listado de unidades

- Ficha por unidad: placa, modelo, capacidad, tipo de servicio, kilometraje
  acumulado.
- Indicador visual de si tiene alertas activas.

**`/panel/flota/[placa]`** — detalle

- Datos de la unidad.
- Documentos con fecha de vencimiento: SOAT, revisión técnica, tarjeta de
  circulación.
- Umbrales configurables: kilometraje para mantenimiento.
- Histórico de alertas emitidas y atendidas.

**`/panel/conductores`**

- Ficha por conductor, licencia y su vencimiento.
- Horas de conducción acumuladas según parámetros configurables.

**`/panel/alertas`** — bandeja

- Todas las alertas activas, ordenadas por urgencia.
- Tres tipos: documento por vencer, kilometraje sobre umbral, horas de conducción
  acumuladas.
- Acción "Marcar como atendida" con nota y responsable. Eso alimenta el histórico.

## Escalonamiento

Las alertas de vencimiento de documentos se emiten a **30, 15 y 7 días** del
vencimiento, con responsable notificado. Reflejar esos tres niveles con distinta
urgencia visual, y un cuarto estado para documentos ya vencidos.

Usar los estados semánticos del skill (info / warning / error), no inventar una
escala de color nueva.

## El histórico es el punto

El valor de esta versión no son las alertas en pantalla: es que el histórico de
alertas emitidas y atendidas quede estructurado desde el inicio. Ese registro es
lo que permite evolucionar a mantenimiento preventivo real más adelante **sin
rehacer el módulo**. Modelar `alertas` con tipo, unidad o conductor, fecha de
emisión, fecha de atención, responsable y nota.

## Restricciones

- Acceso solo para rol `supervisor`.
- No inventar placas, modelos ni fechas reales: datos mock claramente ficticios.
- Copy en español peruano. Sin `any`.

## Verificación

- Una unidad con SOAT a 20 días muestra la alerta de nivel 30; a 12 días
  muestra la de 15; a 5 días muestra la de 7.
- Marcar una alerta como atendida la mueve al histórico con responsable y fecha.
- `npx tsc --noEmit && npx eslint . && npm run build` pasan.
- Registrar en `docs/BITACORA.md` y actualizar `docs/MODELO-DATOS.md` con la
  estructura final de `alertas`.
