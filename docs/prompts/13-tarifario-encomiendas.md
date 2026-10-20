# 13 · Tarifario de encomiendas y exceso de equipaje

**Rama:** `feature/tarifario-encomiendas`

Lee primero `CLAUDE.md` y la sección 4.2 de la propuesta técnica.

## Estado actual

El cotizador de `/encomiendas/enviar` calcula peso volumétrico pero los montos son
placeholder. El área comercial aún no define las cifras. Esta tarea **no inventa
los montos**: construye la estructura para que se configuren y se apliquen.

## Reglas de negocio

**Equipaje de pasajero**

| Rango        | Cobro                                      |
| ------------ | ------------------------------------------ |
| Hasta 20 kg  | Incluido en el pasaje (franquicia vigente) |
| 21 – 30 kg   | Recargo escalón 1                          |
| 31 – 50 kg   | Recargo escalón 2                          |
| Más de 50 kg | Se tarifica como encomienda                |

**Encomiendas**

- Se cobra **por rangos de peso, no por kilo exacto**. Evita discusiones en
  counter y errores de digitación.
- Peso volumétrico = (largo × ancho × alto en cm) ÷ 5000.
- Se factura **el mayor** entre peso real y volumétrico.
- El tarifario se define **por par origen–destino**.
- Recargo opcional por valor declarado, alineado con el Reglamento Nacional de
  Administración de Transporte.
- **Sin franquicia**: la de 20 kg es por pasajero, no aplica a envíos.

## Alcance

**`/panel/tarifario`**

- Rangos de peso para encomiendas, editables, por par origen–destino.
- Escalones de exceso de equipaje.
- Porcentaje o tabla de recargo por valor declarado.
- Mientras comercial no defina los montos, los campos quedan vacíos con un aviso
  visible de "pendiente de aprobación comercial". **No rellenar con cifras
  inventadas.**

**`/encomiendas/enviar`** — actualizar el cotizador

- Que lea el tarifario configurado en vez de sus placeholders.
- Mostrar el desglose: peso real, peso volumétrico, cuál se factura y por qué,
  rango aplicado, recargo por valor declarado, total.
  El desglose visible es lo que evita la discusión en counter.
- Si el tarifario aún no está definido para esa ruta, mostrar un estado claro
  ("Consulta la tarifa en counter") en vez de un monto falso.

**Paso de equipaje en la compra de pasaje**

- Si el flujo de compra lo permite, agregar la declaración de equipaje con el
  cálculo del escalón correspondiente.

## Requisito operativo a documentar

El módulo depende de que haya **balanza digital en cada counter**. Sin dato
confiable de peso, el tarifario pierde sentido. Anotarlo en `docs/ESTADO.md`
como dependencia externa.

## Restricciones

- Formato `S/ 00.00`. Copy en español peruano.
- No inventar montos ni rangos que la propuesta no define.
- Sin `any`.

## Verificación

- Un paquete liviano y voluminoso factura por volumétrico; uno pesado y compacto
  por peso real. Probar ambos.
- Con tarifario sin definir, el cotizador no muestra un monto inventado.
- `npx tsc --noEmit && npx eslint . && npm run build` pasan.
- Registrar en `docs/BITACORA.md`.
