# Modelo de datos

Preliminar. Nada de esto está implementado — el frontend usa `lib/mock/`.

## Convenciones

- Nombres de tabla en plural y minúscula.
- Toda tabla lleva `created_at` y `updated_at`.
- Row Level Security activo en toda tabla con datos de usuario. Sin excepción.
- Migraciones versionadas. Ningún cambio de esquema aplicado a mano.

## Tablas previstas

### Catálogo

| Tabla | Contenido |
|---|---|
| `terminales` | Terminales por ciudad, dirección, coordenadas |
| `rutas` | Par origen–destino, duración estimada, tarifa base |
| `buses` | Unidad, placa, modelo, tipo de servicio, plano de asientos, kilometraje acumulado y umbral de kilometraje para mantenimiento |
| `viajes` | Ruta + bus + fecha/hora de salida + estado |
| `asientos_viaje` | Un registro por asiento por viaje. Es la tabla que se bloquea |

### Venta

| Tabla | Contenido |
|---|---|
| `reservas` | Reserva temporal con expiración, precio congelado |
| `compras` | Compra confirmada por webhook |
| `pasajeros` | Datos personales del pasajero (Ley 29733, RLS estricto) |
| `pagos` | Transacción de pasarela, idempotente por id externo |
| `comprobantes` | Boleta o factura emitida vía OSE/PSE |

### Encomiendas

| Tabla | Contenido |
|---|---|
| `encomiendas` | Guía, remitente, destinatario, ruta, peso real y volumétrico |
| `encomiendas_eventos` | Historial de estados con terminal y timestamp |

Estados: `registrada` → `alistando` → `en_camino` → `despachada`.

### Operación

| Tabla | Contenido |
|---|---|
| `usuarios_operativos` | Personal por rol y agencia |
| `manifiestos` | Manifiesto SUTRAN generado desde las ventas del viaje |
| `embarques` | Registro de validación de QR, con soporte de sincronización diferida |
| `conductores` | Nombre, licencia y su vencimiento, horas de conducción acumuladas |
| `unidades_documentos` | SOAT, revisión técnica y tarjeta de circulación por bus, cada una con número y fecha de vencimiento |
| `alertas` | Alertas de flota emitidas y atendidas (documento por vencer, kilometraje, horas de conducción) — ver estructura abajo |

#### `alertas` (docs/prompts/12-alertas-flota.md)

Es la tabla que sostiene el histórico: se diseñó desde el inicio para que
"marcar como atendida" sea un `UPDATE`, no un borrado, y para que un futuro
módulo de mantenimiento preventivo se apoye en este mismo historial sin
rehacerlo.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `tipo` | enum | `documento` \| `kilometraje` \| `horas_conduccion` |
| `urgencia` | enum | `info` \| `warning` \| `error` \| `vencido` — solo tokens semánticos del skill, sin escala de color propia |
| `bus_id` | uuid, nullable | FK a `buses`. Exactamente uno de `bus_id`/`conductor_id` va lleno, nunca ambos ni ninguno |
| `conductor_id` | uuid, nullable | FK a `conductores` |
| `descripcion` | text | Texto ya armado para mostrar en la bandeja |
| `fecha_emision` | timestamptz | Cuándo se cruzó el umbral (30/15/7 días antes del vencimiento, o el momento en que se detectó el exceso de kilometraje/horas) |
| `estado` | enum | `activa` \| `atendida` |
| `fecha_atencion` | timestamptz, nullable | Solo si `estado = atendida` |
| `responsable_atencion` | text, nullable | Quién la atendió |
| `nota_atencion` | text, nullable | Qué se hizo para resolverla |

Escalonamiento de `documento` (docs/DECISIONES.md, D-031): a 30/15/7 días del
vencimiento (`info`/`warning`/`error`) y un cuarto estado `vencido` una vez
pasada la fecha. `kilometraje` y `horas_conduccion` no escalan: se emiten en
`warning` en cuanto se cruza el umbral configurado en `buses`/parámetro
correspondiente.

### Precios

| Tabla | Contenido |
|---|---|
| `tarifas_ruta` | Tarifa base, tope mínimo y máximo por ruta |
| `factores_precio` | Ocupación, anticipación, temporada — configurables desde panel |
| `tarifas_encomienda` | Rangos de peso (hasta-kg, precio) por par origen–destino. Vacía hasta que comercial defina montos (docs/prompts/13-tarifario-encomiendas.md, D-033) |
| `escalones_equipaje` | Exceso de equipaje de pasajero: rango fijo (21–30 / 31–50 kg) + monto de recargo, pendiente hasta definición comercial |
| `recargo_valor_declarado` | Un solo porcentaje global, opcional, aplicado sobre el valor declarado del envío |
| `auditoria_tarifas` | Todo cambio de tarifa con usuario, fecha y valor anterior |

## Reglas que el esquema debe garantizar

- Un asiento no puede quedar ocupado fuera de una transacción con bloqueo de fila.
- El precio de una reserva se guarda con ella y no se recalcula.
- Una escritura de webhook repetida no duplica la compra.
