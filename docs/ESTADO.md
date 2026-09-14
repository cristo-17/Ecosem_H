# Estado del proyecto

Última actualización: 13/09/2026

## Resumen

Frontend con datos mock. Sin backend, sin pasarela, sin facturación.
Fase actual según el plan de la propuesta técnica: **pre-Fase 1** (maquetado).

## Listo

| Área | Detalle |
|---|---|
| Tokens de diseño | Colores v2, radios (sm/md/pill), sombras navy, espaciado, IBM Plex Sans |
| Componentes base | Button, Input, Select, DatePicker, Badge, Card, Modal, Toast, Skeleton, Stepper, EmptyState |
| Layout | TopBar con menú móvil full-screen, Footer institucional |
| Home | Hero con imagen, buscador, trust row, tabs Pasajes/Encomiendas, rutas populares, promo encomiendas |
| Resultados | Filtros, estados de carga / vacío / error, TripCard con variante seleccionada |
| Nosotros | Misión, visión, historia, carrusel de flota, qué hacemos, bloque industrial, CTA |
| Encomiendas | Cotizador (peso real vs volumétrico) y rastreo por número de guía |
| Mis Viajes | Listado con estados y descarga de PDF (mock) |
| Libro de Reclamaciones | Formulario funcional en `/libro-de-reclamaciones` |

## Pendiente — flujo de compra

- Selección de asientos (mapa de bus dos pisos, temporizador de reserva)
- Formulario de datos del pasajero
- Pago (Yape / Plin / tarjeta, boleta o factura)
- Confirmación con QR y descarga de boleto

## Pendiente — ajustes de interfaz (ver `docs/prompts/`)

- Línea de tiempo de encomienda con 4 estados y diferenciación visual del punto actual
- Mover Mis Viajes bajo "Mi perfil" (historial de viajes + encomiendas)
- Rediseño del PDF del boleto
- Quitar Libro de Reclamaciones del navbar; dejarlo solo en footer con imagen oficial
- Corregir nitidez de imágenes en `/nosotros`

## Pendiente — backend

Todo: Supabase, RLS, migraciones, pasarela, webhook idempotente, OSE/PSE,
generación de QR firmado, PWA de embarque.

## Riesgos abiertos

| Riesgo | Acción |
|---|---|
| Claim "10+ años de experiencia" (corregido de "15+") aún no confirmado por el área comercial | Confirmar redacción exacta con comercial. Alternativa no numérica propuesta: "Experiencia en la sierra central" — no aplicar sin aprobación |
| App móvil previa en Google Play con inventario propio | Definir integración o reemplazo antes del inventario real |
| Tarifas de equipaje y encomiendas son placeholder | Área comercial debe aprobar el tarifario |
| Foto de flota en hero | Pendiente material real del cliente |
| Contratos vigentes con agregadores | Revisar exclusividades antes de reducir cupos |
