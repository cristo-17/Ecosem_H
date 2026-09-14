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
| `buses` | Unidad, placa, tipo de servicio, plano de asientos |
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
| `unidades_documentos` | SOAT, revisión técnica, tarjetas de circulación con vencimientos |
| `alertas` | Alertas emitidas y atendidas (flota, kilometraje, horas de conducción) |

### Precios

| Tabla | Contenido |
|---|---|
| `tarifas_ruta` | Tarifa base, tope mínimo y máximo por ruta |
| `factores_precio` | Ocupación, anticipación, temporada — configurables desde panel |
| `tarifas_peso` | Rangos de peso para equipaje y encomiendas por par origen–destino |
| `auditoria_tarifas` | Todo cambio de tarifa con usuario, fecha y valor anterior |

## Reglas que el esquema debe garantizar

- Un asiento no puede quedar ocupado fuera de una transacción con bloqueo de fila.
- El precio de una reserva se guarda con ella y no se recalcula.
- Una escritura de webhook repetida no duplica la compra.
