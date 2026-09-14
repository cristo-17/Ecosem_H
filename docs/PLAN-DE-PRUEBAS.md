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

## Pendiente de definir

Pruebas automatizadas de la lógica de negocio (sobreventa, idempotencia del
webhook, precio congelado) cuando exista backend.
