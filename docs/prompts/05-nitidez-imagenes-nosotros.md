# 05 · Nitidez de las imágenes en `/nosotros`

## Síntoma

Las fotos del carrusel de flota y la del encabezado se ven borrosas o con
pérdida de calidad respecto al archivo original.

## Diagnóstico antes de tocar código

No asumir la causa. Verificar en este orden y anotar el resultado:

1. **Abrir DevTools → Network**, filtrar por `_next/image`, recargar `/nosotros`.
   Mirar el parámetro `w=` de cada petición y compararlo con el ancho real que
   ocupa la imagen en pantalla (inspeccionar el elemento). Si `w=` es mucho menor
   que el ancho renderizado, el problema es el prop `sizes`.
2. **Comprobar la resolución del archivo fuente.** Si el JPG original mide menos
   que el contenedor, hay upscaling y ninguna configuración de Next lo arregla:
   hay que reemplazar el archivo por uno de mayor resolución.
3. **Revisar el `quality`.** Next usa 75 por defecto. Para fotografía de marca en
   un carrusel grande puede quedarse corto.

## Correcciones probables

**`sizes` mal configurado.** Debe describir el ancho real que ocupa la imagen en
cada breakpoint, no un valor genérico. Un `sizes="100vw"` en una imagen que en
escritorio ocupa un contenedor de ancho máximo hace que Next sirva una variante
innecesariamente grande o mal elegida. Declararlo según el layout real del
carrusel.

**`quality`.** Subir a 85–90 solo en las imágenes del carrusel y del encabezado.
No subirlo globalmente: penaliza el peso de página, y el usuario objetivo está en
conexión inestable en Cerro de Pasco o Huancayo.

**Upscaling.** Si el archivo fuente es pequeño, no compensarlo con CSS. Dejar
anotado en `docs/FALLOS.md` qué archivo necesita reemplazo y con qué resolución
mínima.

## Restricción importante

El peso de página importa. El principio rector del skill es mobile-first sobre
conexión inestable. Cualquier mejora de nitidez debe medirse contra el costo en
kilobytes: preferir servir la variante correcta antes que servir una más pesada.

## Verificación

- Volver a Network y confirmar que el `w=` solicitado ahora corresponde al ancho
  renderizado.
- Comparar visualmente antes/después en 360px y en 1440px.
- Anotar en `docs/FALLOS.md` cuál era la causa real (entrada F-003, hoy abierta).
- `npx tsc --noEmit && npx eslint . && npm run build` pasan.
