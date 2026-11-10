# Imágenes de /nosotros

Las fotos se importan estáticamente desde `app/nosotros/page.tsx`.
Su existencia y dimensiones se verifican al compilar; no se lee el sistema
de archivos durante las peticiones en Cloudflare Workers.

## Carrusel de flota

- `flota-01.jpg`
- `flota-02.png`
- `flota-03.png`
- `personal-01.png`

Cada foto se muestra completa, sin recortar y sin superar su tamaño real.
Al reemplazarla, conserva el formato real y actualiza el import si cambia
el nombre. Una foto requerida ausente hace fallar la compilación.

El encabezado usa fondo navy sólido; no hay `header-bg.jpg` en el proyecto.
Para incorporar una foto de encabezado, agrégala mediante un import estático.
