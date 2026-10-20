# 16 · Navegación por rol: que todas las rutas sean alcanzables

**Rama:** `feature/navbar-por-rol`

Lee primero `CLAUDE.md`, `docs/DECISIONES.md` (D-016, D-026, D-029) y
`.claude/skills/ecosem-design-system/SKILL.md`.

## Problema

Hay rutas construidas y funcionando que **nadie puede alcanzar navegando**:
`/panel`, `/panel/venta`, `/panel/caja`, `/panel/viajes`, `/panel/precios`,
`/panel/flota`, `/panel/conductores`, `/panel/alertas`, `/panel/tarifario`,
`/embarque`. Solo se llega escribiendo la URL.

El TopBar hoy distingue con sesión / sin sesión, pero no distingue rol. Una
plataforma real muestra al personal sus herramientas y al pasajero las suyas.

## Roles

Los que ya existen en `lib/mock/sesion.ts`: `pasajero`, `counter`, `supervisor`.
Si el embarque necesita uno propio, evaluarlo y justificarlo (hoy D-016 dice que
basta con `esPersonal`).

## Qué ve cada rol

**Sin sesión** — igual que hoy: Pasajes, Encomiendas, Rastreo, Nosotros, Ayuda,
botón "Ingresar".

**`pasajero`** — lo mismo, más "Mi perfil" en lugar de "Ingresar".
Nunca ve enlaces al panel ni a embarque.

**`counter`** — además del acceso público, un grupo de personal con:
Venta, Caja, Viajes del día, Embarque.

**`supervisor`** — todo lo de counter, más: Precios, Tarifario, Flota,
Conductores, Alertas.

## Cómo mostrarlo

- El personal necesita distinguir de un vistazo "sitio público" de "herramientas
  internas". Agruparlas visualmente separadas, no mezcladas en la misma fila de
  enlaces.
- Con muchos enlaces internos, un menú desplegable "Panel" es preferible a diez
  ítems en la barra. Decidir y justificar en `docs/DECISIONES.md`.
- En móvil, el menú full-screen debe reflejar los mismos grupos, con el foco
  trap y el `safe-area-inset-bottom` que ya exige el skill.
- `/embarque` no monta el TopBar público (D-026) — eso no cambia. El enlace lleva
  ahí, pero la PWA mantiene su propio shell.

## Protección de rutas

Hoy el acceso al panel se restringe por rol mock. Revisar que **toda** ruta
interna esté protegida, no solo las que se acordaron en su tarea original. Un
`pasajero` que escriba `/panel/precios` no debe ver la pantalla.

Dejar anotado que la verificación real va server-side con RLS. Ocultar un enlace
en el cliente no es seguridad.

## Selector de rol para demo y QA

Mientras no exista Supabase Auth, hace falta poder cambiar de rol sin editar
código: un selector visible **solo en desarrollo** (`process.env.NODE_ENV`) que
permita alternar entre sin sesión, pasajero, counter y supervisor.

Esto es para demostrar el sistema y para la tarea 17 de QA. **No debe aparecer en
el build de producción** — verificarlo, no solo asumirlo.

## Restricciones

- Reusar `components/ui/`. No crear un sistema de navegación paralelo.
- 44×44 px de área táctil, foco visible, copy en español peruano.
- Sin `localStorage`, sin `any`.

## Verificación

- Recorrer los cuatro estados con el selector y confirmar que cada uno ve
  exactamente lo que le corresponde, ni más ni menos.
- Desde cada rol, intentar entrar por URL directa a una ruta que no le toca.
- Confirmar que el selector no existe en `npm run build` de producción.
- 360×640, 768×1024 y 1440×900 sin overflow.
- `npx tsc --noEmit && npx eslint . && npm run build` pasan.
- Registrar en `docs/BITACORA.md` y `docs/DECISIONES.md`.
