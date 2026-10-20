# 02 · Mi perfil con historial de viajes y encomiendas

Lee primero `.claude/skills/ecosem-design-system/SKILL.md` y revisa
`/app/styleguide`.

## Objetivo

Hoy "Mis compras" es un ítem suelto del navbar visible siempre. Debe pasar a
vivir dentro de un perfil de usuario: cuando la persona inicia sesión, el navbar
muestra "Mi perfil", y dentro está el historial de viajes **y** el de encomiendas.

## Comportamiento del navbar

- **Sin sesión:** se mantiene el botón "Ingresar". No se muestra "Mi perfil" ni
  "Mis compras".
- **Con sesión:** el botón "Ingresar" se reemplaza por el acceso a "Mi perfil".
  Quitar "Mis compras" del navbar principal.
- Como todavía no hay autenticación real, simular el estado de sesión con un
  valor en `lib/mock/`. **No usar `localStorage`** — es regla del proyecto.

## Estructura del perfil

Ruta `/mi-perfil` con dos secciones en pestañas:

1. **Mis viajes** — el listado que hoy vive en `/mis-viajes`, con sus badges de
   estado y descarga de PDF.
2. **Mis encomiendas** — listado equivalente: número de guía, ruta, peso
   facturable, badge de estado y acceso al detalle de rastreo.

Las pestañas siguen el patrón de pills con icono que ya usa el home para
Pasajes / Encomiendas. Reusar ese componente, no crear uno nuevo.

Encabezado del perfil con el nombre de la persona y su documento parcialmente
enmascarado (ej. `********13`). No mostrar el DNI completo en pantalla.

## Rutas

- `/mi-perfil` → redirige a la pestaña de viajes por defecto.
- `/mis-viajes` → se mantiene como redirección a `/mi-perfil` para no romper
  enlaces existentes, incluidos los del footer.
- Actualizar el enlace del footer si apunta a la ruta antigua.

## Estado vacío

Si la persona no tiene viajes o no tiene encomiendas, usar el EmptyState del
sistema: icono, título, texto que explique qué hacer y un botón que lleve a
buscar pasajes o a enviar una encomienda según la pestaña. Nunca una lista vacía
sin salida.

## Datos personales

Los datos del pasajero están bajo Ley 29733: no ponerlos en la URL, no
registrarlos en logs, no enviarlos a terceros.

## Restricciones

- Solo tokens de `globals.css`.
- Copy en español peruano.
- Sin `localStorage`, sin `any`.

## Verificación

- Probar los cuatro escenarios: sin sesión, con sesión y datos, con sesión y
  viajes vacíos, con sesión y encomiendas vacías.
- 360×640, 768×1024 y 1440×900 sin overflow horizontal.
- `npx tsc --noEmit && npx eslint . && npm run build` pasan.
