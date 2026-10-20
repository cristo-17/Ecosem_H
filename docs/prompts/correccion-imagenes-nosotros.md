Cambia el criterio de visualización de las imágenes de /nosotros.

DECISIÓN
Hoy el carrusel usa fill + object-cover, que recorta la foto y la estira
hasta llenar el contenedor. Con material de baja resolución eso produce
upscaling y la foto se ve borrosa (F-003). Nuevo criterio: cada imagen se
muestra completa y nunca por encima de su resolución nativa. Preferimos una
foto pequeña pero nítida antes que una grande y borrosa.

QUÉ HACER

- Quitar el recorte: la imagen se ve entera, no se corta ningún borde.
- Nunca escalar por encima del tamaño natural del archivo. Si la foto mide
  337px de ancho, se muestra a 337px como máximo, centrada.
- Si la foto es más grande que el contenedor, sí puede reducirse hasta el
  ancho del contenedor.

Para saber el tamaño natural necesitas leerlo en el servidor, donde ya se
hace el fs.existsSync de app/nosotros/page.tsx. Elige la vía que prefieras
(import estático de next/image, lectura de cabeceras del archivo, o una
dependencia mínima) y justifícala en docs/DECISIONES.md — CLAUDE.md exige
justificar toda dependencia nueva.

ALTURA DEL CARRUSEL
Sin object-cover, fotos de distinta proporción dan distinta altura y el
carrusel "salta" al cambiar de slide. Resuélvelo fijando una altura de
contenedor estable para todos los slides y centrando la imagen dentro,
con el espacio sobrante en un color de fondo del sistema (no blanco puro:
usa --color-surface-base o navy suave, lo que se vea intencional contra
la tarjeta). El salto de altura no es aceptable.

LO QUE NO CAMBIA

- El quality={90} y images.qualities de next.config.ts se quedan.
- El comportamiento del carrusel (auto-avance, pausa en hover/focus,
  prefers-reduced-motion) no se toca.
- El placeholder para archivos ausentes sigue igual.
- El encabezado de /nosotros: evalúa si aplica el mismo criterio o si ahí
  conviene mantener el recorte por ser una banda decorativa de fondo.
  Dime qué decidiste y por qué.

VERIFICACIÓN

- Confirmar en consola que naturalWidth >= clientWidth en todas las
  imágenes del carrusel (ya no hay upscaling).
- Revisar visualmente a 360px y 1440px: ninguna foto recortada, sin
  overflow horizontal, sin cambio de altura al pasar de slide.
- Actualizar F-003 en docs/FALLOS.md: la causa era material de baja
  resolución, y la solución adoptada es no escalar en vez de exigir
  archivos de 1472×1104.
- npx tsc --noEmit && npx eslint . && npm run build pasan.
- Registrar en docs/BITACORA.md.
