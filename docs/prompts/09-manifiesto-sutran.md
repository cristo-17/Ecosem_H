# 09 · Manifiesto SUTRAN automático

**Rama:** `feature/manifiesto-sutran`

Lee primero `CLAUDE.md` y `.claude/skills/ecosem-design-system/SKILL.md`.

## Por qué existe

Hoy los manifiestos se digitan a mano minutos antes de la salida, con riesgo de
multa por errores de digitación de DNI. El sistema ya tiene los datos capturados
en la compra: el manifiesto debe generarse solo.

## Alcance

**`/panel/viajes`** — listado de viajes del día

- Filtro por fecha, ruta y agencia.
- Por viaje: ruta, hora de salida, bus, ocupación (vendidos / capacidad),
  estado, y acceso al detalle.

**`/panel/viajes/[id]`** — detalle del viaje

- Datos del viaje y de la unidad.
- Lista de pasajeros: asiento, nombre completo, documento, destino.
- Estado de embarque por pasajero (pendiente / embarcado), preparado para que la
  PWA de embarque lo actualice.
- Botón "Generar manifiesto".

**Manifiesto en PDF**

- Cabecera: razón social, RUC, ruta, fecha y hora de salida, placa de la unidad,
  conductor(es).
- Tabla de pasajeros: n.º de asiento, apellidos y nombres, tipo y número de
  documento, origen, destino.
- Total de pasajeros.
- Espacio para firma y sello.

## Documento completo, no enmascarado

**Diferencia importante con el boleto:** el manifiesto es un documento de
fiscalización que exige el número de documento completo. Aquí **no** se enmascara.
Esto no contradice la Ley 29733: el dato es necesario para la finalidad
declarada. Lo que sí aplica: el manifiesto no se expone en rutas públicas, no se
envía a terceros y su acceso se limita a personal autorizado.

Dejar esta distinción documentada en `docs/DECISIONES.md`.

## Formato

- Generar con el mismo stack que el boleto (`pdf-lib`), en un módulo aparte
  (`lib/pdf/manifiesto.ts`), reusando helpers comunes.
- Orientación y tamaño pensados para imprimir: una tabla legible en blanco y
  negro, con paginación si el bus supera los pasajeros que caben en una página.
  Probar el caso de un bus de dos pisos lleno.

## Restricciones

- No inventar campos que SUTRAN no pida ni omitir los que la propuesta lista.
  Si un dato no está en el mock, dejar marcador evidente y anotarlo.
- Copy en español peruano. Sin `any`.

## Verificación

- Generar el manifiesto de un viaje con pocos pasajeros y de uno lleno.
- Abrir ambos PDF y revisar que la tabla no se corte ni desborde.
- `npx tsc --noEmit && npx eslint . && npm run build` pasan.
- Registrar en `docs/BITACORA.md` y `docs/DECISIONES.md`.
