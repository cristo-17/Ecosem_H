# Imágenes de /nosotros

Archivos esperados por la página "Nosotros" (`app/nosotros/page.tsx`).
Mientras un archivo no exista aquí, la sección que lo usa cae a su
alternativa sólida (skeleton en el carrusel, `--color-navy` sólido en el
encabezado) — nunca a un hueco ni a una imagen rota.

## Carrusel de flota (se muestra completa, sin recortar)

- `flota-01.jpg`
- `flota-02.jpg`
- `flota-03.png`
- `personal-01.png`

Sin resolución mínima obligatoria (D-013 en `docs/DECISIONES.md`): cada foto
se muestra completa y nunca por encima de su tamaño real, así que una foto
chica simplemente se ve más chica dentro del carrusel, nunca borrosa. Si se
quiere que se vea grande, conviene subirla a un ancho cercano a 736px (el
contenedor en desktop) — pero no es obligatorio.

## Encabezado ("Conoce Ecosem H")

- `header-bg.jpg` — imagen de fondo a todo el ancho, cubierta por un
  overlay `--color-navy` semitransparente. Si no existe, el encabezado
  se queda con el fondo `--color-navy` sólido actual.

Resolución recomendada: al menos 1600×500 px (ancho completo de
viewport, encabezado de baja altura).
