# Imágenes de /nosotros

Archivos esperados por la página "Nosotros" (`app/nosotros/page.tsx`).
Mientras un archivo no exista aquí, la sección que lo usa cae a su
alternativa sólida (skeleton en el carrusel, `--color-navy` sólido en el
encabezado) — nunca a un hueco ni a una imagen rota.

## Carrusel de flota (aspect-ratio 4:3, se recorta con `object-cover`)

- `flota-01.jpg`
- `flota-02.jpg`
- `flota-03.png`
- `personal-01.png`

Resolución recomendada: al menos 1472×1104 px (2x de los ~736×552 px que
ocupa el carrusel en desktop) para que no se sirva una versión escalada
hacia arriba.

## Encabezado ("Conoce Ecosem H")

- `header-bg.jpg` — imagen de fondo a todo el ancho, cubierta por un
  overlay `--color-navy` semitransparente. Si no existe, el encabezado
  se queda con el fondo `--color-navy` sólido actual.

Resolución recomendada: al menos 1600×500 px (ancho completo de
viewport, encabezado de baja altura).
