# 07 · Autenticación: login y registro

**Rama:** `feature/autenticacion`

Lee primero `CLAUDE.md`, `.claude/skills/ecosem-design-system/SKILL.md` y
revisa `/app/styleguide`.

## Objetivo

Hoy el botón "Ingresar" del TopBar no lleva a ninguna parte y la sesión se
simula con `HAY_SESION_MOCK`. Construir las pantallas de acceso y registro, aún
sin backend, dejando la puerta lista para Supabase Auth.

## Alcance

**`/ingresar`**

- Documento (DNI, 8 dígitos) o correo, y contraseña.
- Enlace "¿Olvidaste tu contraseña?" → `/recuperar-clave`.
- Enlace a `/registro`.
- Botón principal "Ingresar" con estado `loading`.

**`/registro`**

- Nombres y apellidos, tipo y número de documento, correo, celular (9 dígitos),
  contraseña y confirmación.
- Helper text literal del skill: "Ingrese tal como figura en su DNI" y
  "Debe contener exactamente 9 dígitos".
- Casilla de aceptación de términos y política de privacidad, obligatoria, con
  mención expresa al tratamiento de datos personales bajo Ley 29733.
- Botón principal "Crear cuenta".

**`/recuperar-clave`**

- Un campo de correo y confirmación de envío. Sin backend, solo el flujo visual.

## Validación

- DNI: 8 dígitos. Celular: 9 dígitos, sin prefijo `(01)` (ese es fijo de Lima).
- Correo con formato válido.
- Contraseña: mínimo razonable y confirmación coincidente.
- Errores por campo bajo el input, siguiendo la estructura del skill
  (label arriba, campo, helper o error abajo). No usar `alert()` ni toasts para
  errores de validación de formulario.

## Sesión

- Al "ingresar" correctamente, activar el mismo mecanismo que hoy usa
  `lib/mock/sesion.ts` y redirigir a `/mi-perfil`.
- Al "cerrar sesión" desde el menú, volver al estado sin sesión y redirigir a `/`.
- **Sin `localStorage`.** Es regla del proyecto.
- Aislar la lógica en `lib/auth/` con funciones (`iniciarSesion`, `registrar`,
  `cerrarSesion`) que hoy son mock pero cuya firma no cambie cuando entre
  Supabase Auth.

## Datos personales

DNI, nombre, correo y celular están bajo Ley 29733: no en URLs, no en logs, no a
terceros. La contraseña nunca se registra en ningún lado, ni en desarrollo.

## Pendiente explícito (no implementar)

Supabase Auth, verificación de correo real, hash de contraseña, RLS. Dejar
anotado en `docs/ESTADO.md` qué falta del lado backend.

## Verificación

- Los tres formularios validan y muestran errores por campo.
- Ingresar → `/mi-perfil` con sesión activa. Cerrar sesión → estado sin sesión.
- 360×640, 768×1024 y 1440×900 sin overflow horizontal.
- `npx tsc --noEmit && npx eslint . && npm run build` pasan.
- Registrar en `docs/BITACORA.md` y las decisiones en `docs/DECISIONES.md`.
