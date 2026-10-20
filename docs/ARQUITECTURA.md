# Arquitectura

## Criterio de selección

Herramientas gratuitas o de bajo costo, con capa de escalamiento pagada
disponible, y sin dependencias que obliguen a rehacer el sistema al crecer.
Costo fijo estimado al arrancar: USD 0–30/mes más comisiones por transacción.

## Componentes

| Capa | Tecnología | Costo |
|---|---|---|
| Frontend web | Next.js + TypeScript + Tailwind CSS | Gratis |
| Hosting y CDN | Cloudflare Pages | Gratis |
| Base de datos | Supabase (PostgreSQL gestionado) | Gratis al inicio, ~USD 25/mes al escalar |
| Autenticación | Supabase Auth | Incluido |
| Archivos | Supabase Storage | Incluido |
| API | API Routes de Next.js | Incluido en hosting |
| Pagos | Culqi o Izipay (Yape / Plin / tarjetas) | Comisión por transacción |
| Facturación | Proveedor OSE/PSE en la nube | Plan inicial bajo costo |
| WhatsApp | WhatsApp Business Platform (Meta) | Cuota gratuita, luego por conversación |
| Correo | Resend | Capa gratuita |
| PDF y QR | pdf-lib / @react-pdf/renderer + qrcode | Gratis |
| App de embarque | PWA con lector QR por cámara | Gratis, sin costo de tienda |
| CI/CD | GitHub + GitHub Actions | Gratis |
| Errores | Sentry | Capa gratuita |
| Uptime | UptimeRobot | Gratis |
| Analítica | Umami autoalojado | Gratis |

## Decisión: reconstruir, no reformar

No se evoluciona la instalación WordPress actual. El alcance requerido
(inventario transaccional, pasarela, facturación electrónica, panel operativo,
app de embarque) excede lo razonable sobre un CMS de contenido. Se conserva
dominio, identidad de marca, textos institucionales y material fotográfico.

## Puntos críticos de implementación

**Control de sobreventa.** Reserva dentro de transacción con `SELECT ... FOR UPDATE`
sobre el registro de asiento del viaje. Reserva temporal con marca de expiración
(10 min) y proceso programado que libera las vencidas. Con PostgreSQL desde el
inicio no hace falta Redis en la primera versión.

**Boleto y embarque.** QR con identificador firmado (HMAC o JWT de corta vigencia)
verificable sin conexión. La PWA de embarque valida localmente y sincroniza al
recuperar señal.

**Pagos.** Confirmación exclusivamente por webhook del proveedor. Idempotencia
por identificador de transacción para tolerar reintentos.

**Despliegue.** Tres ambientes: desarrollo, preview por rama, producción.
Migraciones versionadas en el repositorio.
