# Fallos y soluciones

Registro de problemas encontrados y cómo se resolvieron, para no repetir el
diagnóstico. Lo más reciente arriba.

Formato: síntoma · causa real · solución · cómo detectarlo la próxima vez.

---

## F-006 · "Sin conexión" en el servidor y error de hidratación en /embarque
**Estado:** resuelto (19/10/2026)
**Síntoma:** al abrir `/embarque`, error de hidratación en consola: el
servidor pintaba "Sin conexión" y el navegador "En línea".
**Causa real:** `useState(() => typeof navigator === "undefined" ||
navigator.onLine)`. Node 21 y posteriores tienen un `navigator` global sin
`onLine`, así que en el servidor daba `false`.
**Solución:** `useSyncExternalStore` con `getServerSnapshot = () => true` y
suscripción a `online`/`offline` (`lib/embarque/useEstadoSincronizacion.ts`).
**Cómo detectarlo:** cualquier lectura de `navigator`/`window` para el primer
render de un componente cliente; revisar la consola al recargar.

## F-005 · La suite del backend corrió contra la base de otra sesión
**Estado:** resuelto (19/10/2026)
**Síntoma:** al relanzar el Postgres desechable en el puerto 55432, `pg_ctl`
falló y la suite de encomiendas cayó con `relation "ventas.terminales" does
not exist`.
**Causa real:** otra sesión, que trabaja en `backend-ecosemh`, había levantado
su propio Postgres desechable en el mismo puerto. La suite se conectó a esa
base, que también está marcada como desechable, y al prepararse borró sus
esquemas. Pudo romper pruebas que esa sesión tuviera en curso.
**Solución:** el clúster propio se arranca en otro puerto (55491) y, antes de
correr la suite, se confirma con `current_setting('data_directory')` que la
base es la propia.
**Cómo detectarlo:** si `pg_ctl start` falla, no se corre nada. Revisar quién
escucha en el puerto (`netstat -ano`) y verificar el `data_directory`.

## F-004 · Las ventas de counter no aparecían en el arqueo
**Estado:** resuelto (19/10/2026)
**Síntoma (QA):** una venta hecha en `/panel/venta` no figuraba en
`/panel/caja`.
**Causa real:** eran dos datasets mock sin relación (`VentaView` no escribía
nada; `CajaView` leía `lib/mock/caja.ts`).
**Solución:** las dos pantallas usan svc-ventas. `ventas.vender_en_efectivo`
bloquea el turno del operador e inserta el movimiento de caja en la misma
transacción que vende; el arqueo es la vista `ventas.arqueo_turnos` sobre
esos movimientos. `lib/mock/caja.ts` se borró.
**Cómo detectarlo:** escenario de base desechable que vende y cuadra (ver
BITACORA 19/10/2026) y `caja_concurrencia_test.ts` del backend.

## F-003 · Imágenes del carrusel de `/nosotros` sin nitidez
**Estado:** resuelto (14/09/2026)
**Síntoma:** las fotos del carrusel se ven borrosas o con pérdida de calidad.
**Causa descartada:** el prop `sizes` — ya estaba bien calculado
(`(min-width: 768px) 736px, calc(100vw - 32px)`, coincide con el ancho real
del contenedor). El request a `/_next/image` pedía `w=750`, correcto para un
contenedor de 736px.
**Causa real (verificada con `naturalWidth`/`clientWidth` en el navegador):**
upscaling genuino. Tres de los cuatro archivos fuente miden solo 337×427px,
muy por debajo de los ~736×552px que ocupaba el carrusel en escritorio. El
navegador recibía la imagen a ~330×419px y la estiraba por CSS hasta
736×552px vía `fill` + `object-cover`. Ningún ajuste de `sizes` o `quality`
corregía esto.
- `flota-01.jpg` (808×1024): resolución suficiente para el ancho del
  contenedor, no tenía upscaling.
- `flota-02.jpg` (337×427): además, el archivo es en realidad un PNG (firma
  de bytes `89 50 4E 47...`) guardado con extensión `.jpg` — funciona porque
  Next detecta el formato real por contenido, no por extensión.
- `flota-03.png` (337×427) y `personal-01.png` (337×427): mismo caso.
- `header-bg.jpg`: no era causa de este fallo — el archivo no existe en el
  repo y el encabezado cae a su alternativa sólida navy por diseño.
**Solución adoptada:** en vez de exigir archivos de 1472×1104px (2× del
contenedor) antes de publicar, se cambió el criterio de visualización
(D-013 en `docs/DECISIONES.md`): el carrusel ya no recorta/estira
(`object-cover`) — cada foto se muestra completa, nunca por encima de su
resolución nativa, reducida solo si es más grande que el contenedor
(`object-contain` + `width`/`height` = tamaño real del archivo, leído en el
servidor con `lib/imagenNatural.ts`). Con eso, una foto de 337px de ancho se
ve nítida a 337px en vez de borrosa estirada a 736px — foto chica y nítida
en vez de grande y borrosa. El contenedor pasó a una altura fija
(`ALTO_CONTENEDOR` en `FleetCarousel.tsx`) con fondo `bg-navy/5` para que no
haya salto de layout entre slides de distinta proporción. `quality={90}` (F-003,
sesión anterior) se mantiene — sigue ayudando en los casos donde la foto sí
llena el contenedor (ej. `flota-01.jpg`). El encabezado (`header-bg.jpg`)
se queda con `fill` + `object-cover` a propósito: es una banda decorativa de
fondo, no una foto que se mira de cerca (D-014).
**Verificación:** en DevTools → Network, mirar el parámetro `w=` de la URL
`/_next/image` y compararlo con el ancho real renderizado; comparar
`img.naturalWidth`/`naturalHeight` contra `img.clientWidth`/`clientHeight`
en consola — con el criterio nuevo, `natural` debe ser siempre `>= cliente`
en ambos ejes.

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
