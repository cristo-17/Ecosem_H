# Plan de pruebas

## Obligatorio antes de cada commit

```bash
npx tsc --noEmit
npx eslint .
npm run build
```

Sin `any` en el código nuevo.

## Verificación visual

`resize_window` no afecta el viewport real en este entorno (confirmar con
`window.innerWidth`). Usar el CLI de Playwright para renderizar en:

- **360 × 640** (mínimo objetivo, Android de gama media)
- **768 × 1024**
- **1440 × 900**

En cada ruta, asertar `scrollWidth === clientWidth` para detectar desbordamiento
horizontal.

Medir altura del DOM a ancho de escritorio e inferir que se mantiene a 360px
**no es verificación**: una grilla de dos columnas sin breakpoints tiene la
misma altura a ambos anchos y sigue rota en móvil.

## Checklist por componente

- Altura de botón 48px, radio pill.
- Área táctil mínima 44 × 44 px en todo elemento interactivo.
- Los cinco estados presentes: default, hover, pressed, disabled, loading.
- Foco visible en todo elemento enfocable.
- Contraste AA en todo par texto/fondo, incluido texto sobre imagen.
- Campos bloqueados con `readOnly`, no `disabled`.
- Copy en español peruano, sin inglés en la interfaz.

## Checklist por ruta

| Ruta | Qué verificar |
|---|---|
| `/` | Tarjeta de búsqueda entra sin scroll a 360×640 |
| `/nosotros` | Copy de Misión/Visión no desborda; carrusel sin overflow; contraste del H1 sobre la imagen |
| `/encomiendas/rastrear` | Estado actual distinguible del resto de la línea de tiempo |
| `/libro-de-reclamaciones` | Formulario funcional, nunca un ancla vacía |
| `/mis-viajes` | Badges de estado legibles; descarga de PDF funciona |
| Cualquier ruta sin pantalla | Página de "en construcción", nunca un 404 |

## Casos de borde conocidos

- DatePicker: primera y última semana alineadas a las columnas. Probar meses que
  empiezan domingo, meses que empiezan sábado, y febrero.
- Toasts: los de error no deben auto-cerrarse. El temporizador pausa en hover y
  en foco.
- Skeletons: `role="status"` va en el contenedor de la lista, no en cada
  skeleton, para no anunciar "Cargando" una vez por ítem.
- Modal: el foco no debe escapar; al cerrar vuelve al elemento que lo abrió.

## Casos añadidos tras el QA integral (docs/prompts/17-qa-integral.md, docs/QA-HALLAZGOS.md)

- **Contraste real, no solo a ojo**: correr `@axe-core/playwright` (regla
  `color-contrast`, tags `wcag2a`/`wcag2aa`) sobre cada ruta nueva, no solo
  mirar la pantalla — encontró fallas sistemáticas en `text-navy/60` y
  `text-navy/40` que a simple vista parecían legibles (H-002).
- **Foco por teclado en regiones con scroll horizontal**: cualquier
  `overflow-x-auto` (tablas, carruseles) necesita ser alcanzable con Tab —
  `axe-core` lo marca como `scrollable-region-focusable` (H-003).
- **Checks de SSR con `navigator`**: nunca usar
  `typeof navigator === "undefined"` para detectar servidor — Node 21+ trae
  un `navigator` global sin `.onLine`, así que esa condición es `false` en
  SSR y produce hydration mismatch. Usar `typeof window === "undefined"`
  (H-001).
- **`next/image` con `width`/`height` fijos**: si el componente no le agrega
  también una clase Tailwind de alto/ancho fijo (p. ej. `h-9 w-10`), el
  Preflight de Tailwind (`img { height: auto }`) gana la cascada y Next
  advierte el mismatch en cada carga (H-006). Verificar además que toda
  `quality` usada en un `<Image>` esté declarada en
  `next.config.ts` → `images.qualities` antes de usarla (H-007).
- **Coherencia de datos de contacto entre módulos**: buscar el mismo dato
  (teléfono, correo, dirección) en todas las pantallas que lo repiten —
  encontró dos números de central distintos entre el footer/`/ayuda` y el
  estado de error de `/pasajes/resultados` (H-004).
- **`/panel/*` con scroll en 360×640**: confirmar que el header propio del
  panel (navegación Inicio/Viajes/Venta/Caja) siga siendo alcanzable tras
  hacer scroll, no solo que no haya overflow horizontal — el TopBar público
  `sticky` puede tapar permanentemente la navegación interna en pantallas
  chicas (H-005).
- **Embarque offline, de verdad**: probar el escaneo con
  `context.setOffline(true)` (o desconectando la red real), no solo revisando
  que el código no llame a `fetch`. Así se confirmó que valida sin red y
  sincroniza sola al reconectar.
- **Precio congelado, medido**: capturar el precio mostrado en cada paso del
  flujo de compra (lista → asientos → datos → pago → confirmación) y
  comparar los strings, no asumir por el código que no cambia.
- **La fecha del buscador debe filtrar de verdad**: elegir dos fechas
  distintas en el DatePicker de `/` o `/panel/venta` y confirmar que la
  lista de viajes cambia (o al menos que la fecha viaja hasta el boleto
  final). Un buscador que ignora la fecha elegida y siempre devuelve los
  mismos horarios es un hallazgo, no un detalle (H-005).
- **Disponibilidad de asientos cruzada entre pantallas**: para el mismo id
  de viaje, comparar los asientos/cupo libre que muestran `/pasajes/resultados`
  o `/panel/venta` contra lo que muestra `/panel/viajes/[id]` (manifiesto).
  Que un viaje aparezca con asientos libres en una pantalla y lleno en la
  otra es una contradicción real, no una desconexión esperada entre
  datasets mock (H-006).
- **Retorno de foco cuando el modal borra su propio disparador**: si cerrar
  un modal (por ejemplo al confirmar una acción) elimina del DOM el botón
  que lo abrió, `previouslyFocusedRef.current?.focus()` no hace nada y el
  foco cae a `<body>`. Probar el retorno de foco específicamente en modales
  que remueven su fila/tarjeta al cerrar (no solo en modales de
  `/styleguide` donde el disparador sigue existiendo) (H-004).
- **Tablas `overflow-x-auto` a 360px, con affordance visible**: que
  `scrollWidth === clientWidth` a nivel de documento no basta si una tabla
  interna tiene su propio scroll horizontal — confirmar además que ninguna
  columna/botón de acción relevante queda cortado por el borde de la
  tarjeta sin ninguna señal visual de que hay más contenido a la derecha, y
  que el contenedor es alcanzable con teclado (`tabindex`, ver regla de
  contraste/foco de axe-core arriba) (H-003, H-013, H-014).

## Pendiente de definir

Pruebas automatizadas de la lógica de negocio (sobreventa, idempotencia del
webhook, precio congelado) cuando exista backend.
