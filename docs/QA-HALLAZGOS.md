# QA integral — Hallazgos

Ejecutado: 15/09/2026. Rama: `feature/qa-integral`.

## Método

Recorrido real con Playwright (clics, no solo `goto` de URLs) contra `npm run dev`,
en los 4 roles del selector dev-only (sin sesión, pasajero, counter, supervisor) y
en 360×640 / 768×1024 / 1440×900. El trabajo se dividió en cuatro pasadas en
paralelo (una por rol/área) más un crawl y una revisión visual propios,
consolidados todos en este documento:

- Un crawl automatizado de 36 rutas × 3 viewports (108 combinaciones) verificando
  `scrollWidth === clientWidth`, consola (errores/advertencias) y código HTTP,
  más revisión manual de las capturas de pantalla resultantes.
- Flujo real de punta a punta como pasajero: registro → búsqueda → selección de
  asiento → datos → pago (Yape) → confirmación → descarga de boleto en PDF →
  Mi perfil → cotizar y rastrear encomienda → ayuda → libro de reclamaciones.
- Flujo real como counter: venta presencial completa (buscar, elegir asiento,
  cobrar, generar boleto), arqueo de caja, viajes del día, generación de
  manifiesto (PDF) para un bus lleno (v1, 56/56, pagina a 3 hojas) y uno casi
  vacío (v4, 4 pasajeros, 1 hoja). Cruce de cifras entre `/panel/venta`,
  `/panel/viajes` y `/pasajes/resultados` buscando contradicciones (no solo
  desconexión esperada entre datasets mock).
- Flujo real como supervisor: simulador de precios y tope máximo, tarifario,
  flota, conductores, alertas (marcar una como atendida, con retorno de foco).
- Embarque: descarga de manifiesto, escaneo válido/repetido/inválido, **red
  desconectada de verdad** (`context.setOffline(true)`) durante el escaneo, y
  reconexión con verificación de sincronización.
- `@axe-core/playwright` (WCAG2A/AA) sobre rutas representativas de cada área
  (pasajero, panel, embarque).
- Lectura de código para las reglas que se verifican mejor en la fuente que
  clic a clic: `localStorage`, enmascarado de DNI, HMAC del QR, focus trap del
  modal, alineación de semanas del DatePicker, `role="status"` de skeletons,
  auto-cierre de toasts — cada una confirmada además en vivo, no solo leída.

No se encontró ningún hallazgo **bloqueante**: los tres flujos completos
(pasajero, counter, supervisor) y el escaneo de embarque offline se completaron
sin errores que impidieran terminar la tarea.

---

## H-001 · Indicador "En línea / Sin conexión" de Embarque parpadea mal en cada carga (hydration mismatch)
`/embarque` y `/embarque/[viajeId]` · Counter y Supervisor · Los 3 viewports

Al cargar cualquiera de estas dos rutas, la consola muestra un error real de
React (no una advertencia): *"Hydration failed because the server rendered HTML
didn't match the client"*, acompañado de *"Encountered a script tag while
rendering React component"*. El indicador de conexión del header
(`components/layout` vía `lib/embarque/useEstadoSincronizacion.ts`) decide su
estado inicial con:

```ts
const [enLinea, setEnLinea] = useState(() => typeof navigator === "undefined" || navigator.onLine);
```

La intención es "en SSR no existe `navigator`, asumir en línea". Pero Node.js
21+ ya trae un `navigator` global (para compatibilidad, con `userAgent` y
`language`, sin `.onLine`), así que `typeof navigator === "undefined"` es
`false` en el servidor, y `navigator.onLine` se evalúa como `undefined`
(falsy) → SSR renderiza **"Sin conexión"**. En el cliente, `navigator.onLine`
es `true` → React re-renderiza a **"En línea"** y descarta el árbol SSR —
justo el escenario que este componente existe para comunicar con confianza a
un operador en el andén. Debería pasar sin errores de consola (inicializar
`enLinea` en `false` hasta que un `useEffect` confirme el valor real en el
cliente, o usar `typeof window === "undefined"` como check de SSR, que sí es
seguro).
Severidad: alta

## H-002 · Contraste insuficiente en texto secundario (`text-navy/60`, `text-navy/40`)
`/`, `/pasajes/resultados`, `/panel/alertas`, `/embarque` (patrón compartido en
34 archivos de `app/` y `components/`, probablemente todo el sitio) · Todos los
roles · Los 3 viewports

`axe-core` (WCAG2AA) marca `color-contrast` como **serious** en cada ruta
auditada — entre 3 y 15 nodos por ruta. En vez del token
`--color-text-secondary` (`#5A6672`, definido en el skill para texto muteado y
captions, ≈4.6:1 sobre blanco — sí pasa AA), muchos componentes usan opacidad
ad-hoc sobre `--color-navy` (`#10233F`): `text-navy/60` ≈ 4.29:1 (no llega a
4.5:1 para texto normal) y `text-navy/40` ≈ 2.43:1 (ni siquiera llega a 3:1
para texto grande). Afecta subtítulos de tarjetas de viaje, hora/duración en
resultados, descripciones de alertas, metadata en `/embarque` — texto que el
usuario necesita leer, no decorativo. El skill exige "Contraste AA en todo par
texto/fondo, incluido texto sobre imagen".
Severidad: alta

## H-003 · Región con scroll horizontal sin acceso por teclado
`/panel/alertas` (se repite en cualquier tabla `overflow-x-auto` del panel,
ver H-013/H-014) · Supervisor · 360×640, reproducible también en desktop

`axe-core` marca `scrollable-region-focusable` (serious): un contenedor con
`.overflow-x-auto` no tiene `tabindex="0"`, así que no es alcanzable ni
operable con Tab/flechas. Un usuario que navega solo con teclado no puede
desplazar ese contenido para leerlo completo.
Severidad: alta

## H-004 · El foco no vuelve al botón "Marcar como atendida" tras cerrar el modal (se pierde en `<body>`)
`/panel/alertas` · Supervisor · 360×640 y 1440×900

`components/ui/Modal.tsx` guarda `previouslyFocusedRef` al abrir y llama
`.focus()` sobre esa referencia al cerrar — el patrón general es correcto, y
funciona en casos donde el disparador sigue en el DOM (confirmado en
`/styleguide`). Pero al confirmar "Marcar como atendida" en `/panel/alertas`,
la fila entera —con su botón— se elimina del DOM porque la alerta ya se
resolvió. El `ref` queda apuntando a un nodo desconectado; `.focus()` sobre un
nodo desconectado no hace nada, y el foco cae a `<body>`. Confirmado
programáticamente en ambos viewports: `document.activeElement` antes de abrir
= el botón; después de cerrar = `<body>`. Es el único flujo real de la app
donde cerrar el modal borra su propio disparador, y ahí rompe la regla
explícita "el foco vuelve al elemento que lo abrió al cerrar" — un supervisor
que trabaja con teclado pierde su posición después de atender cada alerta.
Severidad: alta

## H-005 · La fecha elegida en el buscador no filtra ningún resultado
`/panel/venta`, `/pasajes/resultados`, `/` · Todos los roles y viewports

`buscarViajes(origen, destino)` en `lib/mock/viajes.ts` no recibe fecha como
parámetro, y `Viaje` no tiene un campo de fecha calendario propio — solo una
hora del día. Buscando con distintas fechas en `/` y en `/panel/venta` se
obtienen siempre los mismos 7 viajes/horarios/precios, sin importar la fecha
elegida en el DatePicker. No está en la lista de pendientes de
`docs/ESTADO.md`: es un vacío funcional nuevo, no una limitación ya conocida
de mock. Relacionado: H-006 y H-010 son consecuencias del mismo vacío.
Severidad: alta

## H-006 · El mismo viaje (`v1`) aparece "14 Libres" en búsqueda/venta y lleno (56/56) en el manifiesto
`/pasajes/resultados`, `/panel/venta` vs. `/panel/viajes/v1` · Counter y
Supervisor

`lib/mock/viajes.ts` define `v1` con `asientosDisponibles: 14` — así se ve en
la búsqueda pública y en venta de counter (`crearViaje("v1", "Lima",
"Huancayo", hora(5, 30), 390, "economico", 14, 35)`). `lib/mock/manifiesto.ts`
genera el mismo id a propósito con 56 pasajeros vendidos sobre una capacidad
de 56 (`generarViajeDelDia("v1", 56, "en-ruta")`) — es el caso de prueba
explícito de paginación del manifiesto. El resultado: el mismo viaje se
muestra simultáneamente con 14 asientos libres (se puede seleccionar y cobrar
un asiento más en `/panel/venta`) y como bus completamente lleno en el
manifiesto de `/panel/viajes/v1`. No es solo que los datasets "no se hablen"
(esperado sin backend, documentado en `docs/ESTADO.md`) — muestran cifras de
disponibilidad directamente **contradictorias** para el mismo viaje, el tipo
de hallazgo que este QA pedía buscar explícitamente. Especialmente sensible:
CLAUDE.md dice que "la sobreventa es el problema que este proyecto existe para
resolver".
Severidad: alta

## H-007 · Dos números de teléfono de contacto distintos
`/pasajes/resultados` (estado de error) vs. `Footer` / `/ayuda` · Cualquier rol
· Los 3 viewports

El footer y `/ayuda` muestran **987 654 321** como central telefónica
(`components/layout/Footer.tsx`, `app/ayuda/AyudaView.tsx`). El estado de
error de la búsqueda de pasajes ("Sin conexión a internet", forzable con
`/pasajes/resultados?error=1`) muestra en cambio **+51 959 366 710**
(`app/pasajes/resultados/ResultadosView.tsx`). Es justo el momento en que un
pasajero frustrado por un error necesita llamar — y ve un número distinto al
que aparece en todo el resto del sitio.
Severidad: media

## H-008 · El TopBar público permanece fijo (`sticky`) sobre las herramientas internas y les come pantalla
`/panel/venta` (mapa de asientos), y por extensión cualquier `/panel/*` con
contenido largo · Counter y Supervisor · 360×640 especialmente

El TopBar público (`sticky top-0 z-50`, con el logo, el menú hamburguesa y
"Mi perfil") queda fijo al hacer scroll dentro de una pantalla del panel
interno, mientras que el header propio del panel (`Ecosem H · Counter` con la
navegación Inicio/Viajes/Venta/Caja, `position: static`) se desplaza y
desaparece con el primer scroll. En 360×640, el counter que está eligiendo
asientos en `/panel/venta` pierde permanentemente ~56px de una pantalla ya
pequeña a manos de una barra de navegación pública que no usa en su turno, y
la navegación interna (a la que sí necesita volver seguido) deja de estar
visible. Confirmado con Playwright: 2 `<header>` en el DOM, uno `sticky`
(TopBar) y otro `static` (panel) apilados.
Severidad: media

## H-009 · Advertencia de consola sistemática: logo sin dimensión "auto"
Prácticamente toda ruta (TopBar global) · Todos los roles · Los 3 viewports

En cada carga de página, Next.js registra: *"Image with src
'/ecosemh-mark.png' has either width or height modified, but not the other."*
Causa: Tailwind v4 Preflight aplica `img { height: auto }` por defecto; el
`<Image width={40} height={36}>` de `components/layout/TopBar.tsx` declara
ambas dimensiones pero no las protege con clases Tailwind de alto/ancho fijo
(p. ej. `h-9 w-10`) que tengan prioridad sobre esa regla base, así que la
altura efectiva queda gobernada por `auto` mientras el ancho se mantiene fijo.
Severidad: media

## H-010 · El boleto imprime siempre la misma fecha fija (31/08/2026), nunca la fecha elegida por el pasajero o el counter
`/pasajes/comprar/confirmacion` y boleto de `/panel/venta` · Pasajero y Counter
· Los 3 viewports

Consecuencia directa de H-005: `hora(h, m)` en `lib/mock/viajes.ts` construye
cada horario con `new Date(2026, 7, 31, h, m)` — la fecha (31 de agosto de
2026) es una constante de referencia del mock, igual para todos los viajes,
sin relación con la fecha que el usuario eligió en el DatePicker del
buscador. El boleto en PDF (`lib/pdf/boleto.ts`, campo `horaSalida`) sí
imprime una fecha (vía `formatFechaLarga`), pero es siempre esa misma fecha
fija, nunca la real. Un boleto emitido "para" cualquier fecha futura muestra
igual "lunes, 31 de agosto de 2026".
Severidad: media

## H-011 · `/embarque` no tiene ancho máximo en escritorio
`/embarque` y `/embarque/[viajeId]` · Counter y Supervisor · 1440×900

La lista de viajes y la pantalla de escaneo ocupan el ancho completo de
1440px sin `max-width` (tarjetas y formulario estirados borde a borde). Sin
overflow horizontal, pero inconsistente con `/panel/layout.tsx` (`max-w-5xl`)
y el resto del sitio. `app/embarque/layout.tsx` envuelve el contenido en
`<div className="flex-1 px-4 py-4 sm:px-6">`, sin ninguna clase de
ancho máximo.
Severidad: media

## H-012 · La lista "Elige tu viaje" de Embarque no distingue un viaje cancelado
`/embarque` · Counter y Supervisor · Los 3 viewports

`SeleccionViajeView.tsx` no muestra `viaje.estado` en absoluto (sí existe en
el mock y sí se ve con badges de color en `/panel/viajes`). Un viaje cancelado
(`v6`) aparece con el mismo botón rojo "Descargar" que uno vigente,
distinguible solo por "0 pasajeros" en letra chica de bajo contraste (ver
H-002). Riesgo de que el personal de embarque descargue o intente validar un
viaje que ya no sale, en un momento —el andén, apurado— donde ese error es
más probable y más costoso.
Severidad: media

## H-013 · La columna "Tope máximo" de la tabla de tarifas queda cortada a 360×640, sin indicio visual de que se puede desplazar
`/panel/precios` · Supervisor · 360×640

`TablaRutas.tsx` envuelve la tabla en `overflow-x-auto` con
`min-w-[520px]` — un ancho mínimo mayor que el disponible dentro de la
tarjeta a 360px (~328px de contenido tras el padding). El resultado: la
columna "Tope máximo", que es exactamente el valor que esta pantalla existe
para hacer visible y editable (tope obligatorio, regla explícita del
prompt de motor de precios), queda parcialmente tapada por el borde de la
tarjeta sin ninguna sombra, flecha o scrollbar visible que sugiera que hay
más contenido a la derecha. El usuario tiene que descubrir por accidente que
puede arrastrar el dedo para verla completa.
Severidad: media

## H-014 · El botón "Editar" de exceso de equipaje queda cortado a 360×640 por el mismo patrón
`/panel/tarifario` · Supervisor · 360×640

Mismo patrón que H-013: `EquipajeCard.tsx` usa `overflow-x-auto` con
`min-w-[360px]` para una tabla de solo 3 columnas (Rango, Recargo, Editar)
que cabría sin scroll si no se le forzara ese mínimo — a diferencia de la
tabla de H-013, que sí tiene 5 columnas de datos reales. El botón "Editar"
(la única acción de esta tarjeta) queda parcialmente oculto tras el borde
de la tarjeta a 360px, con el mismo problema de falta de affordance visual.
Severidad: media

## H-015 · Advertencia de consola: `quality={100}` no está en `images.qualities`
`/` (Hero) · Todos los roles con acceso a home · Los 3 viewports

`components/home/Hero.tsx` pide `quality={100}` para `/servicebanner.png`,
pero `next.config.ts` solo declara `qualities: [75, 90]`. Next.js 16 exige
declarar cada calidad usada explícitamente y lo advierte en cada carga.
Severidad: baja

## H-016 · Claim "10+ años de experiencia" aún sin confirmación comercial (ya trackeado)
`/` (TrustRow) · Todos los roles · Los 3 viewports

`components/home/TrustRow.tsx` muestra "10+ años de experiencia" a todo
visitante. Con inicio de operaciones en abril 2016 y la fecha de hoy
(15/09/2026), el número es matemáticamente correcto (10 años y 5 meses), pero
`docs/ESTADO.md` ya deja anotado que la redacción exacta **no está confirmada
por el área comercial** — una cifra publicitaria sin ese respaldo es
exactamente lo que la regla 6 de `CLAUDE.md` (Indecopi) pide evitar. No es un
hallazgo nuevo; se incluye aquí para que quede en el mismo documento que el
resto del recorrido de QA.
Severidad: baja

---

## Verificado y funcionando (sin hallazgo, dejado por escrito para no repetir la prueba)

- **Sobreventa / precio congelado**: en el flujo de compra real (Lima→Huancayo,
  asiento 1B), el precio mostrado fue **S/ 35.00** en la lista de resultados,
  en selección de asiento, en pago y en confirmación — sin variación.
- **Temporizador de reserva**: "Tu reserva expira en 10:00" aparece al entrar a
  selección de asiento y baja consistentemente (09:59, 09:58…) a través de
  selección → datos → pago.
- **`localStorage`**: verificado con `JSON.stringify(localStorage)` en vivo
  (no solo leyendo código) en cada paso de compra (asientos, datos, pago,
  confirmación) y en venta de counter: siempre `{}`. Cero usos reales de
  `localStorage`/`sessionStorage` en todo el repo (solo comentarios que citan
  la regla). El único storage real del navegador es IndexedDB para el
  manifiesto offline de Embarque — uso justificado y distinto.
- **DNI enmascarado**: no aparece un DNI completo en la URL, la consola ni el
  boleto PDF descargado (`boleto-ECH-21F35E.pdf`); en `/mis-viajes` se ve
  `Documento ******13`. El manifiesto de `/panel/viajes/[id]` sí trae el
  documento completo — es la excepción documentada, no un hallazgo. El
  manifiesto local que Embarque guarda en IndexedDB **tampoco** incluye el
  número de documento del pasajero (solo código de boleto, asiento, nombre y
  destino) — la PWA nunca expone el DNI ni en pantalla ni en el dispositivo.
- **Embarque 100% offline**: con la red realmente cortada
  (`context.setOffline(true)`), el escaneo manual valida correctamente los
  casos VÁLIDO, YA EMBARCADO/repetido e INVÁLIDO usando solo IndexedDB local.
  Al reconectar, la cola pendiente sincroniza sola y el contador de
  pendientes vuelve a 0. `/embarque` no lleva el TopBar/Footer público (D-026).
- **Manifiesto SUTRAN**: pagina a 3 hojas A4 horizontal para un bus de 56
  pasajeros (v1) y a 1 hoja para uno de 4 (v4).
- **Motor de precios**: el simulador desglosa tarifa base × ocupación ×
  anticipación × temporada correctamente (ej. S/ 35 × 1.20 × 1.15 × 1.00 =
  S/ 48.30) y valida ocupación > 100%. El tope máximo es obligatorio para
  guardar una ruta y el simulador avisa cuando el precio se ajusta a un tope.
- **DatePicker**: probado en varios meses que empiezan en distintos días de
  semana (incluido uno que empieza sábado) y en febrero — primera y última
  semana alineadas a la columna correcta, sin celdas corridas, confirmado
  tanto por inspección visual como por conteo de filas en el DOM.
- **Modal**: el focus trap en sí (10+ repeticiones de Tab/Shift+Tab) nunca
  escapa del diálogo en ningún uso de `/panel/*` ni en `/styleguide`. El
  retorno de foco al cerrar funciona en todos los casos donde el disparador
  sigue en el DOM — la única excepción real es H-004.
- **Toasts de error**: `duration` se fija a `null` incondicionalmente para
  `type="error"` en `components/ui/Toast.tsx`, sin importar lo que pida el
  llamador; los demás pausan con hover y con foco, y reanudan correctamente.
  Verificado en código y en vivo.
- **`role="status"` de skeletons**: en las 5+ pantallas con listas cargando
  (resultados, mis viajes, detalle de viaje, rastreo, asientos, escaneo de
  embarque) el rol va una sola vez en el contenedor, nunca por ítem.
- **Guardas de acceso**: `/panel` con rol `sin sesión` o `pasajero` redirige a
  `/` (código 200 con `<title>Ecosem H</title>`, no una pantalla de panel) en
  los 3 viewports; ninguna de las 10 rutas de `/panel/*` + `/embarque` quedó
  sin proteger.
- **Cotizador de encomiendas**: peso real (10 kg) vs. volumétrico
  (40×30×20/5000 = 4.8 kg) calculado correctamente, factura el mayor, y
  muestra el aviso de "consulta la tarifa en counter" cuando la ruta no tiene
  tarifa definida — consistente con que `/panel/tarifario` arranca vacío a
  propósito (D-033).
- **Libro de Reclamaciones**: enviar el formulario vacío muestra errores en
  cada campo obligatorio sin navegar a una URL con ancla vacía.
- **Franquicia de 20 kg**: mismo número y mismo criterio (por escalón, no por
  kilo exacto) en `/ayuda`, `/terminos` y `/encomiendas/enviar`.
- **Botones de red**: "Procesando..." (con el copy exacto del skill) visible
  en pago y en rastreo de encomienda mientras la operación está en curso.
- **RUC**: idéntico y documentado (D-012) entre boleto y manifiesto.
- **Ruta inexistente**: `app/not-found.tsx` muestra una pantalla propia
  ("Esta página no existe" + botón "Volver al inicio"), nunca un 404 crudo de
  Next, aunque el código de estado HTTP siga siendo 404 (correcto).
- **`/mis-viajes`**: es un redirect server-side a `/mi-perfil` (no una página
  duplicada) — no hay dos fuentes de verdad para la misma pantalla.

## No probado en esta sesión

- Comparación píxel a píxel del boleto generado por `/panel/venta` contra el
  de `/pasajes/comprar/confirmacion` (ambos se generaron y descargaron sin
  error; no se diffearon binarios).
- Recorrido con lector de pantalla real (solo se verificó semántica ARIA y
  orden de foco con Tab).
- `/registro`, `/ingresar` y `/recuperar-clave` más allá de confirmar campos y
  ausencia de `localStorage` — son flujos solo visuales según `docs/ESTADO.md`
  (sin Supabase Auth todavía), con validación limitada por revisar.
- Escaneo real por cámara (`BarcodeDetector`) en Embarque — sin cámara en
  entorno headless; se probó el fallback de entrada manual, que es el camino
  de respaldo documentado.
- Instalación real como PWA / arranque 100% offline sin carga previa de la
  página (solo se probó offline con la página ya cargada, que es lo que pide
  el prompt).
- Contraste/axe-core solo corrió sobre rutas de muestra en un viewport, no
  las ~30 rutas × 3 viewports — dado que H-002 es un problema de clase CSS
  compartida (34 archivos), es muy probable que se repita ampliamente fuera
  de las rutas auditadas. Contraste de texto sobre imagen en `/nosotros`
  (pedido explícito del plan de pruebas) no confirmado con axe, solo a ojo.
- Área táctil 44×44 no verificada sistemáticamente (fuera de alcance de
  axe-core).
- La contradicción de disponibilidad de H-006 se confirmó puntualmente para
  `v1`; no se revisó uno por uno si `v2`/`v6`/`v8`/`v12` tienen el mismo
  problema, aunque por venir del mismo patrón de datos es muy probable.

---

## Resumen

| Severidad | Cantidad | IDs |
|---|---|---|
| Bloqueante | 0 | — |
| Alta | 6 | H-001, H-002, H-003, H-004, H-005, H-006 |
| Media | 8 | H-007, H-008, H-009, H-010, H-011, H-012, H-013, H-014 |
| Baja | 2 | H-015, H-016 |

**Recomendación de orden de ataque:**

1. **H-006** (asientos contradictorios entre búsqueda y manifiesto para el
   mismo viaje) — toca directamente la regla no negociable #1 de CLAUDE.md
   (sobreventa). Antes de decidir el fix, vale confirmar si es solo un dato
   de ejemplo mal armado en `lib/mock/viajes.ts`/`lib/mock/manifiesto.ts` (fix
   de una línea) o si expone que el mock necesita una sola fuente de verdad
   de disponibilidad por viaje.
2. **H-005 y H-010** (la fecha no filtra nada, y el boleto imprime una fecha
   fija) — mismo vacío funcional de fondo: `Viaje` no modela una fecha de
   calendario real. Vale decidir juntos si esto se corrige ahora (agregar
   fecha real al modelo mock) o se registra como pendiente de backend, dado
   que toca `lib/mock/viajes.ts` y se propaga a varias pantallas.
3. **H-001** (hydration de `/embarque`) — fix acotado a
   `lib/embarque/useEstadoSincronizacion.ts` (cambiar el check de
   `navigator`), es la herramienta que el personal usa sin cobertura de red.
4. **H-002 y H-003** (contraste y foco por teclado) — accesibilidad real, no
   cosmética, y tocan clases/patrones utilitarios compartidos
   (`text-navy/60`, `text-navy/40`, `.overflow-x-auto`) que se repiten en
   todo el sitio: un arreglo en el token/patrón corrige muchas pantallas a
   la vez.
5. **H-004** (foco perdido tras atender una alerta) — acotado a
   `AlertasView`/`Modal.tsx`: guardar el foco en un elemento estable (el
   contenedor de la lista, o el siguiente botón disponible) en vez de en el
   nodo que el propio cierre va a eliminar.
6. **H-013 y H-014** (tablas cortadas a 360px sin affordance de scroll) —
   mismo patrón en dos pantallas de supervisor; vale decidir un criterio
   único (¿scroll con sombra/gradiente visible, o rediseño a tarjetas
   apiladas en mobile?) en vez de arreglarlas por separado.
7. **H-007** (teléfono de contacto) — una línea, alto impacto si alguien
   realmente marca el número equivocado en un momento de error.
8. **H-008, H-011, H-012** (TopBar sticky sobre el panel, ancho máximo de
   Embarque, viaje cancelado no distinguible) — decisiones de diseño más que
   bugs de una línea; conviene decidir juntos el criterio para cada una.
9. **H-009 y H-015** — un-liners de configuración de `next/image`, sin
   urgencia.
10. **H-016** — no es una tarea de código: requiere que el área comercial
    confirme la redacción (ya está en el radar en `docs/ESTADO.md`).
