# 08 · Panel de counter: venta presencial y arqueo de caja

**Rama:** `feature/panel-counter`

Lee primero `CLAUDE.md` y `.claude/skills/ecosem-design-system/SKILL.md`.

## Por qué existe

La propuesta técnica identifica dos problemas operativos: la sobreventa por falta
de sincronización counter–web, y el cuadre de caja manual propenso a descuadres.
El primero se resuelve con inventario único; el segundo necesita que la venta
presencial pase por el mismo sistema.

Esta tarea construye la interfaz. La lógica transaccional llega con el backend.

## Alcance

Rutas bajo `/panel`, separadas de la experiencia pública.

**`/panel/venta`** — venta en counter

- Buscar viaje por ruta y fecha.
- Seleccionar asiento reusando el `SeatMap` que ya existe en
  `components/pasajes/`. **No crear un segundo mapa de asientos.**
- Datos del pasajero, tipo de comprobante (boleta o factura), medio de pago
  (efectivo, Yape, Plin, tarjeta).
- Confirmar venta → genera el mismo boleto PDF que la venta web
  (`lib/pdf/boleto.ts`). Un solo generador, no dos.

**`/panel/caja`** — arqueo por turno

- Selector de turno, agencia y usuario.
- Resumen: total vendido, desglose por medio de pago, cantidad de boletos,
  cantidad de encomiendas.
- Listado de transacciones del turno.
- Botón "Cerrar turno" que congela el arqueo (mock: solo cambia el estado).

**`/panel`** — índice con acceso a ambas secciones.

## Roles

El acceso al panel es para personal, no para pasajeros. Con la autenticación aún
en mock, agregar un rol simulado en `lib/mock/sesion.ts` (`pasajero` |
`counter` | `supervisor`) y ocultar `/panel` a quien no sea personal.
Dejar anotado que la verificación real va server-side con RLS, no en el cliente.

## Layout

El panel es para uso en escritorio en el counter, pero el skill exige 44×44 px de
área táctil y foco visible igual que el resto. No introducir un sistema de diseño
paralelo: mismos tokens, mismos componentes de `components/ui/`.

## Restricciones

- Reusar `SeatMap`, `Button`, `Input`, `Select`, `Badge`, `Card`, `Modal`.
- Formato de moneda `S/ 00.00`, fechas y horas según el skill.
- Copy en español peruano.
- Sin `localStorage`, sin `any`.

## Pendiente explícito (no implementar)

Bloqueo transaccional del asiento, cierre de caja persistido, permisos reales.

## Verificación

- Vender un pasaje en `/panel/venta` produce un PDF idéntico al de la web.
- El arqueo suma correctamente con los datos mock.
- Un usuario con rol `pasajero` no ve `/panel`.
- `npx tsc --noEmit && npx eslint . && npm run build` pasan.
- Registrar en `docs/BITACORA.md` y `docs/DECISIONES.md`.
