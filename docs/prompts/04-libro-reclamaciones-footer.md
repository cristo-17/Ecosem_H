# 04 · Libro de Reclamaciones: solo en el footer, con la imagen oficial

Lee primero `.claude/skills/ecosem-design-system/SKILL.md`.

## Objetivo

En Perú la convención es que el Libro de Reclamaciones se acceda desde el pie de
página mediante la imagen del libro, no como un ítem del menú principal
compitiendo con las acciones comerciales. Sigue siendo obligatorio y accesible
(Ley 29571), solo cambia dónde vive.

## Cambios

1. **Quitar "Libro de Reclamaciones" del TopBar**, tanto del menú de escritorio
   como del menú móvil full-screen.
2. **En el footer**, reemplazar el enlace de texto de la columna "Enlaces Útiles"
   por la imagen oficial del libro, enlazada a `/libro-de-reclamaciones`.
3. La ruta `/libro-de-reclamaciones` y su formulario **no cambian**. Sigue siendo
   un formulario funcional, nunca un ancla vacía.

## Imagen

- Archivo: `public/images/libro-de-reclamaciones.png` (ya provisto).
- Usar `next/image` con **ancho y alto explícitos**. No fijar solo una de las dos
  dimensiones: eso dispara la advertencia de aspect ratio de Next y deforma la
  imagen. Si el tamaño se controla por CSS, agregar `width: auto` o
  `height: auto` según corresponda.
- `alt="Libro de Reclamaciones"`.
- Área táctil mínima 44 × 44 px, incluyendo el padding alrededor de la imagen.
- Foco visible al navegar con teclado: el enlace debe tener un indicador de foco
  claro contra el fondo navy del footer.
- La imagen tiene fondo blanco y va sobre navy; asegurar que se vea intencional
  (por ejemplo con un contenedor blanco de radio `--radius-sm`), no como un
  recorte pegado.

## Ubicación dentro del footer

Colocarla en la columna "Enlaces Útiles", al final de la lista, visualmente
separada de los enlaces de texto para que se lea como un sello y no como un
ítem más.

## Restricciones

- Solo tokens de `globals.css`.
- Copy en español peruano.
- No alterar el contenido del formulario de reclamaciones.

## Verificación

- Confirmar que el enlace sigue llegando a un formulario que funciona.
- Revisar el menú móvil: el ítem debe haber desaparecido también ahí.
- 360×640, 768×1024 y 1440×900 sin overflow horizontal.
- Consola sin advertencias de `next/image` sobre aspect ratio.
- `npx tsc --noEmit && npx eslint . && npm run build` pasan.
