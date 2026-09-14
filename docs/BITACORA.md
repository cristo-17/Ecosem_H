# Bitácora

Entrada por sesión de trabajo. Lo más reciente arriba.
Formato: fecha · qué se hizo · qué quedó abierto.

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
