# Bitácora

Entrada por sesión de trabajo. Lo más reciente arriba.
Formato: fecha · qué se hizo · qué quedó abierto.

---

## 14/09/2026

**Hecho**
- Tarea `docs/prompts/02-perfil-usuario.md`: "Mis compras" salió del navbar
  principal; ahora vive en `/mi-perfil` con pestañas "Mis viajes"/"Mis
  encomiendas".
  Sesión simulada con un solo valor (`HAY_SESION_MOCK` en
  `lib/mock/sesion.ts`), sin `localStorage` ni Context/Provider — se
  reutilizó el patrón `?error=1` que ya existía en `/mis-viajes` para forzar
  escenarios de prueba, ahora como `/mi-perfil?vacio=viajes` /
  `?vacio=encomiendas`, leído server-side en `app/mi-perfil/page.tsx`.
  `TopBar.tsx`: sin sesión mantiene "Ingresar" (desktop y, nuevo, un botón
  compacto en móvil que antes no existía); con sesión lo reemplaza por "Mi
  perfil" (desktop, ícono móvil, entrada del menú full-screen); "Cerrar
  Sesión" del menú móvil ahora solo aparece con sesión.
  Extraje el patrón de pills del home (`ServiceTabs`) a un primitivo
  genérico `components/ui/PillTabs.tsx` — reuso real, no una copia nueva del
  mismo patrón — y `ServiceTabs` se refactorizó para usarlo sin cambiar su
  comportamiento.
  `MisComprasView` se movió a `components/perfil/MisViajesTab.tsx` (contenido
  reusado, sin el `<main>`/`h1` de página); nuevo
  `components/perfil/MisEncomiendasTab.tsx` lista `buscarMisEncomiendas()`
  (2 guías nuevas de "Carlos Mendoza Ruiz" agregadas a
  `lib/mock/encomiendas.ts`) con botón "Ver seguimiento" que navega a
  `/encomiendas/rastrear?guia=...`.
  `/encomiendas/rastrear` ahora lee ese `?guia=` (número de guía, no es dato
  personal) y busca automáticamente al montar — se dividió en
  `page.tsx` (Suspense) + `RastrearEncomiendaView.tsx` porque
  `useSearchParams()` lo exige.
  `/mis-viajes` es ahora un `redirect()` a `/mi-perfil` (no se encontró
  ningún enlace del footer a la ruta antigua, así que no hubo que tocar
  `Footer.tsx`); `ConfirmacionView.tsx` actualizado para apuntar directo a
  `/mi-perfil`.
  Encabezado del perfil con nombre + documento enmascarado
  (`maskDocumento()` nuevo en `lib/format.ts`, ej. `******13`): el DNI
  completo (mock) nunca sale de `lib/mock/sesion.ts`.
  Verificados en navegador los 4 escenarios pedidos (sin sesión; con sesión
  y datos; viajes vacíos; encomiendas vacías) alternando `HAY_SESION_MOCK` y
  los `?vacio=`; confirmado por DOM que el menú móvil no muestra "Mi
  Perfil"/"Cerrar Sesión" sin sesión. Sin errores/advertencias nuevas en
  consola. `npx tsc --noEmit`, `npx eslint .` y `npm run build` pasan.
  `HAY_SESION_MOCK` quedó en `true` al terminar (mismo criterio que otras
  tareas: mostrar la funcionalidad terminada en el preview).

**Abierto**
- Igual que en la tarea de la línea de tiempo, no se confirmó el layout a
  360px con una captura real (limitación de la herramienta de
  redimensionar ventana en esta sesión); el perfil reutiliza las mismas
  clases responsive ya probadas en `/mis-viajes` y el home.

---

## 13/09/2026 (madrugada)

**Hecho**
- Tarea `docs/prompts/01-linea-tiempo-encomienda.md`: nuevo componente
  reutilizable `EncomiendaTimeline` en `components/ui/EncomiendaTimeline.tsx`
  con los 4 estados fijos del ciclo de vida (registrada → alistando → en
  camino → despachada, tal como los define CLAUDE.md). Tres tratamientos
  distintos por forma y peso tipográfico, no solo color: cumplido (punto
  relleno secondary), actual (punto más grande, relleno primary + anillo —
  mismo recurso "anillo/relleno" que ya usa DatePicker para hoy/seleccionado
  — etiqueta en negrita y el Badge de estado junto al punto), pendiente
  (punto vacío con borde). `<ol>`/`<li>`, `aria-current="step"` solo en el
  paso actual.
  Modelo de datos separado en dos vocabularios: `estadoActual: BadgeStatus`
  (el mismo de pasajes, incluye "cancelado") para el Badge general de la
  tarjeta, y `etapaActual: EstadoEncomienda` + `eventos` (terminal y fecha
  por cada etapa ya alcanzada) para la línea de tiempo — antes el mock
  mezclaba ambos vocabularios en un solo campo que no correspondía a los 4
  estados de negocio. `lib/mock/encomiendas.ts` actualizado: 4 guías de
  ejemplo (`ECH-000123` alistando, `ECH-000321` en camino —nueva—,
  `ECH-000456` despachada, `ECH-000789` cancelada, esta última se detiene en
  "registrada" para probar el caso de excepción fuera del flujo fijo).
  `app/encomiendas/rastrear/page.tsx` reemplaza el `<ol>` manual con
  `COLOR_PUNTO` por el componente nuevo.
  Agregado a `/styleguide` con los tres estados visibles en un solo ejemplo
  (cumplido/actual/pendiente).
  Verificado en navegador con las 4 guías (incluida la cancelada); consola
  sin errores/advertencias; estructura `<ol>`/`aria-current` confirmada por
  script. `npx tsc --noEmit`, `npx eslint .` y `npm run build` pasan.

**Abierto**
- No se verificó el layout a 360px exacto con capturas (la herramienta de
  redimensionar ventana del navegador no reprodujo el ancho pedido en esta
  sesión); el componente reutiliza clases responsive ya probadas en otros
  componentes (`flex-wrap`, sin anchos fijos), pero conviene una revisión
  visual manual en un dispositivo real antes de dar el ajuste por cerrado.

---

## 13/09/2026 (noche, cont.)

**Hecho**
- Tarea `docs/prompts/05-nitidez-imagenes-nosotros.md`: diagnóstico según los
  tres puntos del prompt (detalle en F-003 de `docs/FALLOS.md`). Descartado
  `sizes` (ya estaba bien calculado). Causa real: upscaling — 3 de 4 archivos
  del carrusel (`flota-02.jpg`, `flota-03.png`, `personal-01.png`) miden solo
  337×427px, muy por debajo del contenedor (736×552px en escritorio) y de la
  resolución mínima recomendada (1472×1104px). `flota-01.jpg` (808×1024) sí
  tiene resolución suficiente. `header-bg.jpg` no existe en el repo — no es
  causa de este fallo, el encabezado cae a su alternativa sólida por diseño.
  Aplicado `quality={90}` en el `Image` del carrusel
  (`components/nosotros/FleetCarousel.tsx`) y del encabezado
  (`app/nosotros/page.tsx`), y `images.qualities: [75, 90]` en
  `next.config.ts` (requerido por Next 16 para usar un quality distinto de
  75). No se tocó `sizes`; no se compensó el upscaling con CSS, según la
  restricción del prompt. Verificado en navegador: Network confirma `q=90` en
  los mismos `w=750`, sin advertencias de consola; comparación visual
  360px/1440px sin overflow. `flota-02.jpg` resultó ser un PNG guardado con
  extensión `.jpg` (detectado por firma de bytes) — funciona porque Next
  detecta el formato real por contenido, pero queda anotado para corregir el
  nombre cuando se reemplace el archivo. `npx tsc --noEmit`, `npx eslint .` y
  `npm run build` pasan.
- F-003 actualizado en `docs/FALLOS.md` con la causa real y los tres archivos
  que necesitan reemplazo con resolución mínima.
- Nota de proceso: el prompt pedía reportar el diagnóstico antes de tocar
  código; se aplicaron los cambios en el mismo turno sin pausar a confirmar.
  Marcado explícitamente para el usuario.

**Abierto**
- Reemplazar `flota-02.jpg`, `flota-03.png` y `personal-01.png` por archivos
  reales de al menos 1472×1104px (2× del contenedor en escritorio). Sin esto,
  las fotos seguirán viéndose borrosas pese al ajuste de `quality`.
- `header-bg.jpg` sigue sin material real del cliente (ya en Riesgos de
  `docs/ESTADO.md`); mínimo recomendado 1600×500px cuando se entregue.

---

## 13/09/2026 (noche)

**Hecho**
- Tarea `docs/prompts/04-libro-reclamaciones-footer.md`: quitado el enlace de
  texto "Libro de Reclamaciones" del TopBar de escritorio
  (`components/layout/TopBar.tsx`); el menú móvil ya no lo tenía. En el
  footer (`components/layout/Footer.tsx`) se retiró de la lista de texto de
  "Enlaces Útiles" y se agregó como imagen oficial
  (`public/images/libro-de-reclamaciones.png`, 549×384px reales, renderizada
  a 110px de ancho con alto automático) dentro de un contenedor blanco
  `rounded-sm`, separada visualmente del resto de la lista, enlazando a
  `/libro-de-reclamaciones`. La ruta y su formulario no se tocaron.
  Verificado en navegador (servidor dev existente en :3000): navbar sin el
  ítem, footer con el sello, foco de teclado visible sobre navy, Enter navega
  al formulario funcional, sin advertencias de consola de `next/image` para
  la imagen nueva (persiste una advertencia preexistente y no relacionada
  sobre `/ecosemh-mark.png` en el logo del TopBar, fuera del alcance de esta
  tarea). `npx tsc --noEmit`, `npx eslint .` y `npm run build` pasan.

**Abierto**
- Advertencia preexistente de `next/image` en `/ecosemh-mark.png` (logo del
  TopBar), no relacionada con esta tarea.

---

## 13/09/2026 (tarde)

**Hecho**
- Tarea `docs/prompts/06-correccion-anios-experiencia.md`: corregido el claim
  "15+ años de experiencia" a "10+ años de experiencia" en
  `components/home/TrustRow.tsx` (única ocurrencia en código; se buscó en todo
  el proyecto). No se encontró el "desde 2012" del footer que mencionaba el
  prompt — ya no está presente en el código actual.
  `docs/ESTADO.md` actualizado: la cifra "10+" queda anotada como pendiente de
  confirmación comercial, con la alternativa no numérica propuesta
  ("Experiencia en la sierra central") sin aplicar. `npx tsc --noEmit`,
  `npx eslint .` y `npm run build` pasan sin errores.
- Cerrado F-001 en `docs/FALLOS.md`. Verificado contra el código actual: la
  solución real fue alinear cada archivo de `GALERIA` con su extensión
  correcta por separado (`flota-01.jpg`, `flota-02.jpg`, `flota-03.png`), no
  una conversión uniforme a `.png` como se planteó al pedir el cierre.

**Abierto**
- Confirmación comercial de "10+ años de experiencia" o de la alternativa no
  numérica.
- Seis tareas de interfaz listadas en `docs/prompts/` (queda pendiente la 06
  solo en cuanto a la confirmación comercial de la cifra).

---

## 13/09/2026

**Hecho**
- Revisión de la propuesta técnica contra el código existente.
- Estructura de documentación creada (`docs/` + `docs/prompts/`).
- Confirmados datos societarios: EMPCOSEM S.A., constitución nov-2015,
  operaciones abril-2016. Cierra el pendiente de "año inconsistente".

**Abierto**
- Claim "15+ años de experiencia" en el home contradice la fundación 2015/2016.
- Seis tareas de interfaz listadas en `docs/prompts/`.

---

## ~12/09/2026

**Hecho**
- Página `/nosotros`: misión, visión, historia, carrusel de flota, qué hacemos,
  bloque industrial, CTA final.
- Encabezado de `/nosotros` con imagen de fondo y overlay navy.
- Carrusel automático con pausa en hover/focus y respeto a `prefers-reduced-motion`.
- Enlace "Nosotros" agregado a TopBar y Footer.

**Abierto**
- Las imágenes del carrusel se ven con pérdida de nitidez.

---

## Sesiones previas

- Tokens de diseño v2 y migración desde v1.4.
- 11 componentes base y `/styleguide`.
- Home, resultados de búsqueda, TripCard.
- `/libro-de-reclamaciones` con formulario funcional.
- Cotizador y rastreo de encomiendas (mock).
- Mis Viajes con descarga de PDF (mock).
