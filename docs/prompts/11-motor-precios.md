# 11 · Panel del motor de precios dinámicos

**Rama:** `feature/motor-precios`

Lee primero `CLAUDE.md` y `docs/DECISIONES.md` (D-003).

## Regla que gobierna la tarea

Precios por **reglas explícitas**, no por algoritmo de optimización. Auditable y
defendible ante Indecopi. Todos los factores y topes se administran desde el
panel; **no se codifican en el aplicativo**.

```
Precio final = Tarifa base de la ruta
             × Factor de ocupación
             × Factor de anticipación
             × Factor de temporada
```

Acotado por un mínimo y un máximo configurables por ruta.

## Alcance

**`/panel/precios`**

_Tarifas por ruta_

- Tabla de rutas con tarifa base, tope mínimo y tope máximo.
- Edición por ruta.

_Factores de ocupación_ (referenciales de la propuesta, editables)

| Ocupación  | Factor |
| ---------- | ------ |
| 0% – 50%   | 1.00   |
| 51% – 80%  | 1.10   |
| 81% – 100% | 1.20   |

_Factores de anticipación y de temporada_

- Mismo patrón de rangos editables.
- Temporada aplicable a feriados, Fiestas Patrias, fin de año y eventos locales
  de Pasco y Junín.

_Simulador_

- Elegir ruta, ocupación, días de anticipación y temporada → mostrar el precio
  resultante y **el desglose de cómo se llegó a él**, factor por factor.
  Es la herramienta que hace el motor defendible: cualquiera puede ver por qué
  un pasaje cuesta lo que cuesta.

## Reglas de negocio obligatorias

- **Tope máximo por ruta obligatorio.** No se puede guardar una ruta sin él.
  Evita percepción de abuso y exposición ante Indecopi.
- **Todo cambio de tarifa queda registrado** con usuario, fecha y valor anterior.
  Mostrar ese historial en la interfaz, no solo guardarlo.
- **El precio congelado no se toca.** Un carrito en curso jamás cambia de monto
  aunque el motor suba la tarifa. La interfaz debe dejar claro que los cambios
  aplican a reservas nuevas, no a las que están en curso.

## Restricciones

- Ningún factor ni tope hardcodeado en el componente.
- Formato `S/ 00.00`. Copy en español peruano.
- Acceso solo para rol `supervisor`.
- Sin `any`.

## Pendiente explícito (no implementar)

Persistencia real, cálculo server-side en el checkout, auditoría en base de datos.

## Verificación

- El simulador refleja correctamente los factores configurados.
- No se puede guardar una ruta sin tope máximo.
- El historial de cambios muestra usuario, fecha y valor anterior.
- `npx tsc --noEmit && npx eslint . && npm run build` pasan.
- Registrar en `docs/BITACORA.md`.
