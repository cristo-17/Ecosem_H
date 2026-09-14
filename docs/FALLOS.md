# Fallos y soluciones

Registro de problemas encontrados y cómo se resolvieron, para no repetir el
diagnóstico. Lo más reciente arriba.

Formato: síntoma · causa real · solución · cómo detectarlo la próxima vez.

---

## F-003 · Imágenes del carrusel de `/nosotros` sin nitidez
**Estado:** abierto
**Síntoma:** las fotos del carrusel se ven borrosas o con pérdida de calidad.
**Causa probable:** `sizes` de `next/image` no coincide con el ancho real del
contenedor por breakpoint, lo que hace que Next sirva una variante de menor
resolución de la necesaria. También puede haber upscaling si el archivo fuente
es más pequeño que el contenedor.
**Verificación:** en DevTools → Network, mirar el parámetro `w=` de la URL
`/_next/image` y compararlo con el ancho real renderizado.

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
