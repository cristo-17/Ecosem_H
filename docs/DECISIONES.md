# Decisiones

Registro de decisiones tomadas y por qué. Si una decisión se revierte, no se
borra: se agrega una entrada nueva que la supersede.

## D-001 · Reconstruir en vez de evolucionar WordPress
**Fecha:** agosto 2026 · **Estado:** vigente
El alcance (inventario transaccional, pasarela, facturación, panel, app de
embarque) excede lo razonable sobre un CMS de contenido. Se conserva dominio,
marca y textos institucionales.

## D-002 · Inventario único de asientos
**Estado:** vigente
Un solo inventario, sin excepción. Dos inventarios independientes reproducen
exactamente la sobreventa que el proyecto existe para eliminar. Bloquea la
definición sobre la app móvil previa de Google Play.

## D-003 · Precios por reglas explícitas, no algoritmo
**Estado:** vigente
Precio = tarifa base × factor ocupación × factor anticipación × factor temporada,
acotado por mínimo y máximo por ruta. Auditable y defendible ante Indecopi.
Un algoritmo de optimización queda fuera de la primera versión.

## D-004 · Sistema de diseño v2 (Rounded / IBM Plex Sans)
**Estado:** vigente · **Supersede:** v1.4 (Inter, radios 8/16px)
Botones con radio pill, campos y cards a 12px, badges a 6px. Estados semánticos
con fondo pastel y texto de la misma familia, lo que elimina la excepción de
contraste que tenía el amber en v1.

## D-005 · Sin Redis en la primera versión
**Estado:** vigente
PostgreSQL está disponible desde el inicio y soporta el bloqueo de fila y la
expiración de reservas. Introducir Redis sería una dependencia sin justificar.

## D-006 · Campos bloqueados con `readOnly`, nunca `disabled`
**Estado:** vigente
Un campo `disabled` no envía su valor y los lectores de pantalla lo anuncian
distinto. Origen y destino ya elegidos deben seguir siendo legibles y parte del
formulario.

## D-007 · Bloque industrial/minero con jerarquía visual reducida
**Fecha:** septiembre 2026 · **Estado:** vigente
En `/nosotros`, el servicio minero e industrial se muestra sin CTA y con fondo
plano, deliberadamente por debajo de las secciones de pasajes y encomiendas.
No se vende desde esta plataforma y no debe confundirse con lo que sí se vende.
Por eso tampoco lleva imagen de fondo.

## D-008 · Libro de Reclamaciones solo en el footer
**Fecha:** septiembre 2026 · **Estado:** vigente
Es obligatorio por Ley 29571 y debe ser accesible, pero la convención peruana es
el enlace con la imagen oficial del libro en el pie de página, no un ítem del
navbar principal que compita con las acciones comerciales.

## D-009 · Chequeo de existencia de imagen en servidor
**Fecha:** septiembre 2026 · **Estado:** vigente
Para los placeholders de `/nosotros` se usa `fs.existsSync` en Server Component,
no `onError` de `next/image` en cliente: con archivos locales en `public/` ese
evento no es confiable para decidir si el archivo existe.
