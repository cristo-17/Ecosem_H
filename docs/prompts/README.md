# Prompts

Tareas para el agente de código. Un archivo por tarea, una rama por archivo
(ver `docs/GIT.md`).

Todo prompt asume que el agente primero:
1. Lee `CLAUDE.md`.
2. Lee `.claude/skills/ecosem-design-system/SKILL.md`.
3. Revisa `/app/styleguide` para reusar patrones existentes.

Y que antes de dar la tarea por terminada corre:
`npx tsc --noEmit && npx eslint . && npm run build`.

## Completadas

| Archivo | Tarea |
|---|---|
| `01-linea-tiempo-encomienda.md` | Estados de rastreo con punto actual destacado |
| `02-perfil-usuario.md` | Mi perfil con historial de viajes y encomiendas |
| `03-pdf-boleto.md` | Rediseño del PDF del boleto |
| `04-libro-reclamaciones-footer.md` | Quitar del navbar, imagen oficial en footer |
| `05-nitidez-imagenes-nosotros.md` | Corregir calidad de imágenes del carrusel |
| `06-correccion-anios-experiencia.md` | Corregir el claim de años de experiencia |
| `07-autenticacion.md` | Pantallas de `/ingresar`, `/registro`, `/recuperar-clave` (sin backend) |
| `08-panel-counter.md` | `/panel`, `/panel/venta`, `/panel/caja` — venta presencial y arqueo (sin backend) |
| `09-manifiesto-sutran.md` | `/panel/viajes`, `/panel/viajes/[id]` y manifiesto en PDF paginado |
| `10-pwa-embarque.md` | `/embarque`, `/embarque/[viajeId]` — PWA offline con lector QR |
| `11-motor-precios.md` | `/panel/precios` — tarifas, factores, simulador e historial (solo supervisor) |
| `12-alertas-flota.md` | `/panel/flota`, `/panel/conductores`, `/panel/alertas` — alertas de documentos/kilometraje/horas con histórico (solo supervisor) |
| `13-tarifario-encomiendas.md` | `/panel/tarifario` — rangos de peso, exceso de equipaje y recargo por valor declarado; `/encomiendas/enviar` actualizado para leerlo |
| `14-ayuda-faq.md` | `/ayuda` (FAQ en acordeón accesible), `/terminos` y `/privacidad` (estructura legal pendiente de redacción) |
| `15-condiciones-contratacion.md` | Condiciones Generales del Contrato de Viaje (texto real) en `/terminos`; respuestas de `/ayuda` actualizadas con esa política |
| `16-navbar-por-rol.md` | Navegación agrupada por rol (menú "Panel" en escritorio, sección en el móvil), rol simulado movido a cookie de servidor, selector de rol solo-desarrollo |

## Pendientes

| Archivo | Rama |
|---|---|
| `17-qa-integral.md` | `feature/17-qa-integral` |

## Pendiente de planificar

Backend completo: Supabase, RLS, migraciones, pasarela con webhook idempotente,
OSE/PSE, clave de firma HMAC del lado del servidor (el mecanismo ya existe,
`lib/firma.ts`, pero con clave mock — ver D-025 en `docs/DECISIONES.md`),
notificaciones WhatsApp y correo. Requiere prompts propios que aún no están
escritos.

## Convención

Al terminar una tarea, registrar en `docs/BITACORA.md`. Las decisiones con
alternativa descartada van a `docs/DECISIONES.md`. Los fallos con diagnóstico no
obvio, a `docs/FALLOS.md`.
