# Fallos y soluciones

Registro de problemas encontrados y cómo se resolvieron, para no repetir el
diagnóstico. Lo más reciente arriba.

Formato: síntoma · causa real · solución · cómo detectarlo la próxima vez.

---

## F-003 · Imágenes del carrusel de `/nosotros` sin nitidez
**Estado:** parcialmente resuelto (13/09/2026) — queda pendiente de reemplazo de archivos
**Síntoma:** las fotos del carrusel se ven borrosas o con pérdida de calidad.
**Causa descartada:** el prop `sizes` — ya estaba bien calculado
(`(min-width: 768px) 736px, calc(100vw - 32px)`, coincide con el ancho real
del contenedor). El request a `/_next/image` pedía `w=750`, correcto para un
contenedor de 736px.
**Causa real (verificada con `naturalWidth`/`clientWidth` en el navegador):**
upscaling genuino. Tres de los cuatro archivos fuente miden solo 337×427px,
muy por debajo de los ~736×552px que ocupa el carrusel en escritorio (la
resolución mínima recomendada, documentada en
`public/images/nosotros/README.md`, es 1472×1104px = 2×). El navegador recibe
la imagen a ~330×419px y la estira por CSS hasta 736×552px vía `fill` +
`object-cover`. Ningún ajuste de `sizes` o `quality` corrige esto — hay que
reemplazar el archivo.
- `flota-01.jpg` (808×1024): resolución suficiente, se sirve completa, sin upscaling.
- `flota-02.jpg` (337×427): **necesita reemplazo**, mínimo 1472×1104px. Además
  el archivo es en realidad un PNG (firma de bytes `89 50 4E 47...`) guardado
  con extensión `.jpg` — funciona porque Next detecta el formato real por
  contenido, no por extensión, pero conviene renombrarlo a `.png` al
  reemplazarlo para evitar confusión futura.
- `flota-03.png` (337×427): **necesita reemplazo**, mínimo 1472×1104px.
- `personal-01.png` (337×427): **necesita reemplazo**, mínimo 1472×1104px.
- `header-bg.jpg`: no es causa de este fallo — el archivo no existe en el
  repo y el encabezado cae a su alternativa sólida navy por diseño (ver
  `public/images/nosotros/README.md`). Cuando se entregue el archivo real,
  mínimo 1600×500px.
**Solución aplicada:** `quality` de 75 a 90 en el `Image` del carrusel
(`components/nosotros/FleetCarousel.tsx`) y del encabezado
(`app/nosotros/page.tsx`), y `images.qualities: [75, 90]` en
`next.config.ts` (Next 16 exige declarar cada `quality` distinto del default
75, si no la sirve igual a 75 pese al prop). Esto mejora la compresión pero
no corrige el upscaling de los tres archivos por debajo de resolución.
**Verificación:** en DevTools → Network, mirar el parámetro `w=` de la URL
`/_next/image` y compararlo con el ancho real renderizado; comparar
`img.naturalWidth`/`naturalHeight` contra `img.clientWidth`/`clientHeight`
en consola para confirmar si hay upscaling real.

---

## F-002 · Encabezado de `/nosotros` se veía "plomo", sin la foto
**Estado:** resuelto
**Síntoma:** la sección mostraba un bloque gris azulado en vez de la imagen.
**Diagnóstico inicial equivocado:** se sospechó 404 del archivo.
**Causa real:** la imagen sí cargaba (la petición devolvía 304 Not Modified).
El overlay `bg-navy/75` era demasiado opaco para esa foto y aplanaba todo el
contraste hasta parecer un color sólido.
**Solución:** degradado en vez de overlay plano, siguiendo el patrón de
`Hero.tsx`.
**Aprendizaje:** un 304 significa que el recurso se sirvió desde caché, es
éxito, no error. Antes de tocar código, mirar el status real en Network.

---

## F-001 · Archivos de galería con extensión distinta a la esperada
**Estado:** cerrado (verificado 13/09/2026)
**Síntoma:** algunos slots del carrusel mostraban el placeholder pese a que el
archivo estaba en la carpeta.
**Causa:** `GALERIA` espera `.jpg` y los archivos subidos eran `.png`; además
faltaba `flota-01.jpg`.
**Solución:** alinear cada entrada de `GALERIA` con la extensión real de su
archivo en `public/images/nosotros/` — no una conversión uniforme a un solo
formato. Estado verificado en `app/nosotros/page.tsx`: `flota-01.jpg` y
`flota-02.jpg` en `.jpg`, `flota-03.png` en `.png`, cada uno coincide con el
archivo presente en disco.
**Aprendizaje:** el chequeo es sensible a mayúsculas y extensión exacta. En
Cloudflare Pages (Linux) el sistema de archivos es case-sensitive aunque en
Windows local no lo parezca.
