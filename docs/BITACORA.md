# Bitácora

Entrada por sesión de trabajo. Lo más reciente arriba.
Formato: fecha · qué se hizo · qué quedó abierto.

---

## 19/10/2026 (cont. 2)

**Contexto:** manifiesto y embarque contra svc-ventas. Sin commits. Sin
cuenta de embarque todavía.

**Hecho**
- Embarque (D-054): validación local del QR real (ECDSA P-256) con el paquete
  del viaje, IndexedDB v2 (paquetes y escaneos con `scanId`), sincronización
  idempotente que solo envía lo embarcado, renovación del paquete cada 30 s con
  señal, conflictos entre dispositivos a la vista, avisos de menor y menor en
  brazos sin nombres, lector externo en vez de código sin firma.
- Manifiesto (D-055): viajes del día, versiones, generar, PDF desde el
  contenido del backend con documento completo, boleto, marcas y huella.
- Borrados: `lib/firma.ts` (clave HMAC), la ruta mock del boleto,
  `lib/mock/manifiesto.ts`, `lib/embarque/validar.ts` y `tipos.ts`.
- Corregido F-006 (hidratación del indicador de conexión) y el `<video>` de la
  cámara, que no se montaba antes de conectar el stream.
- Verificado:
  - Prueba cruzada en Postgres desechable propio (puerto 55491, `data_directory`
    comprobado): la lógica del frontend contra el handler real de svc-ventas,
    8 pasos. Sin red valida, rechaza alterado, otro viaje, clave ajena con el
    mismo `kid` y paquete vencido; reenviar el mismo `scanId` deja una fila;
    el segundo dispositivo recibe `duplicado` y, con el paquete renovado, ve "ya
    embarcado"; el servidor rechaza lo alterado aunque llegue. El paquete trae
    menor (15) y menor en brazos (2) sin nombres ni documentos.
  - PDF del manifiesto generado con el código del frontend y leído: documento
    completo, `ZV99-15`, "Menor (15), acomp.: madre", sección de menores en
    brazos, versión, huella y total 3.
  - Navegador, sesión de supervisor de prueba, contra `EcosemH` solo leyendo:
    viajes del día y paquete real (clave `k202610`). Con la red a los servicios
    cortada desde la página y una clave de prueba agregada al paquete local:
    VÁLIDO, YA EMBARCADO, firma no válida, otro viaje y aviso de menor; "2
    pendientes" sin subir. Al terminar se borró la base local antes de devolver
    la red: nada llegó a `EcosemH`. Panel de viajes y detalle sin manifiesto,
    sin errores de consola. No se generó ninguna versión de manifiesto.
  - `tsc`, `eslint` y `build` pasan; la clave HMAC no está en el build de
    producción (solo en restos de `.next/dev` y cachés).

**Abierto**
- Probar con la cuenta de embarque y un boleto real: escanear con cámara en
  Android, sincronizar y ver el embarque en el manifiesto.
- Si el backend agrega un rol de embarque: `lib/auth/roles.ts` y el layout.
- Confirmar si el PDF lleva nombres de los menores en brazos (D-055).
- El service worker cachea sobre la marcha: una navegación sin señal a un viaje
  que no se abrió antes con señal puede no cargar.

---

## 19/10/2026 (cont.)

**Contexto:** `docs/` al repositorio, documentos enmascarados en el panel y
módulo de encomiendas. Sin commits.

**Hecho**
- `.gitignore`: fuera `docs/`; `README.md` anclado a la raíz (`/README.md`),
  porque también ignoraba `docs/prompts/README.md`. Antes de versionarlo se
  revisó `docs/` en busca de secretos y datos personales: nada (el RUC es
  dato público de la empresa; el DNI de ejemplo ya está en `lib/mock`).
- Documento enmascarado en `/panel/viajes/[id]`; el PDF del manifiesto sigue
  completo, confirmado (D-052). Venta y caja no muestran documentos.
- Encomiendas (D-053): `/panel/encomiendas` (registrar con cotización real y
  cobro; buscar por guía, avanzar estado y entregar con el documento de quien
  recoge), rastreo público real, `EncomiendaTimeline` de cinco estados.
  Borrado `lib/mock/encomiendas.ts`.
- Backend (`backend-ecosemh`, sin commit): `GET /v1/encomiendas/guia/:guia`
  y su paso de prueba.
- Verificado:
  - Backend, en Postgres desechable local: suite de encomiendas, 18 pasos (el
    nuevo: destino la encuentra por guía, también dictada; otra agencia 404;
    pasajero 403; sin token 401; control errado `TRACKING_CODE_INVALID`), y
    `contratos_frontend_test`. `deno fmt`, `lint` y `check` limpios.
  - Contra `EcosemH`, solo lectura: el rastreo responde y el CORS admite
    localhost; la cotización Lima → Huancayo da `PARCEL_RATE_NOT_DEFINED` (no
    hay tarifa de encomiendas cargada).
  - Navegador (sesión de supervisor de prueba, sin escribir nada): rastreo
    "no encontrada", cotización con el mensaje de tarifa, destinos según
    rutas activas, tabla del manifiesto enmascarada. Se encontró y corrigió
    el origen bloqueado para un supervisor con agencia en el token.
  - `tsc`, `eslint` y `build` pasan.

**Abierto**
- Desplegar el endpoint por guía; hasta entonces "Buscar por guía" responde
  "no encontramos" en `EcosemH`.
- Sin tarifa de encomiendas en `EcosemH` no se puede registrar ninguna: probar
  registrar → alistar → en camino → en destino → entregar cuando haya
  tarifa y cuentas de counter.
- Mis encomiendas: pendiente de backend (D-050).
- CLAUDE.md dice cuatro estados de encomienda; el backend y la interfaz usan
  cinco.

---

## 19/10/2026

**Contexto:** Mi Perfil y panel de counter (venta en efectivo, turno,
arqueo) contra svc-ventas. Sin commits.

**Hecho**
- Mis viajes ya consultaba `GET /v1/reservas` desde cont. 6; sin cambios.
- Mis encomiendas: fuera el mock, que mostraba guías inventadas a cuentas
  reales. Remite al rastreo por guía; no hay datos reales que mostrar (D-050).
- `/panel/venta`: viajes y plano reales, `PasajeroReservaForm` (la misma forma
  del contrato que el flujo público), autorización de datos, RUC opcional,
  efectivo recibido. Una sola llamada, `POST /v1/caja/ventas`. Sin turno
  abierto no deja empezar. Venta con respuesta perdida → pantalla de "venta
  incierta", sin reintento (D-051).
- `/panel/caja`: abrir turno (el supervisor elige agencia), arqueo real por
  medio de pago, cierre con conteo y resultado sobrante/faltante. Sin
  selectores de agencia/turno/usuario.
- Borrados: `components/pasajes/PassengerForm.tsx` y `lib/mock/caja.ts`, sin
  uso. F-004 en FALLOS.
- Verificado, en un Postgres 18 desechable local (clúster en el scratchpad,
  puerto 55432, con las 29 migraciones del backend):
  - Suites del backend `turnos`, `caja_concurrencia`, `counter_otra_agencia`
    y `rls`: 4 pasan, 34 pasos.
  - Escenario propio (fuera del repo): Lima vende 3 veces (10 + 20 + 10) y el
    arqueo que ve su counter da 40,00 con 3 movimientos; efectivo
    insuficiente y asiento repetido no entran; cierre contando 40 →
    diferencia 0; después, `sin_turno_abierto`. Como counter de Huancayo: 0
    filas del turno, movimientos, arqueo, compras y pasajeros de las ventas
    de Lima de viajes de Lima. El counter no puede insertar en
    `movimientos_caja` (42501).
  - El cuerpo de venta y cierre que arma el panel pasa los validadores de
    `ventas/app.ts` (leídos, no ejecutados).
  - `tsc`, `eslint` (0 errores) y `build` pasan.

**Abierto**
- **Sin probar en la interfaz con una cuenta de counter real:** `EcosemH` no
  tiene personal de counter. Hace falta crear dos counters de agencias
  distintas para repetir vender-cuadrar-aislar desde el navegador.
- RLS deja que el counter de la agencia de **salida** del viaje vea la venta
  hecha por otra agencia (compra, pago y pasajeros con documento): es el
  D-017 del backend, a propósito para el embarque. La caja (turno,
  movimientos, arqueo) sí queda aislada por operador. Decidir si se mantiene.
- Backend: boletos con QR de una venta de counter, y "mis encomiendas"
  (D-050, D-051).

---

## 17/10/2026 (cont. 6)

**Contexto:** autenticación real con Supabase Auth (D-015 del backend: el rol
viaja firmado en el token, `app_rol`, y la base lo vuelve a comprobar). Sin
commits.

**Hecho**
- Dependencias: `@supabase/ssr@0.12.7` y `@supabase/supabase-js@2.117.2`
  (fijadas; la 2.118.0 tenía dos días). Justificación: sesión en cookies para
  el render en servidor, rotación del refresh token sin carreras y
  verificación del token contra las claves públicas (`getClaims`).
- `proxy.ts`: renueva la sesión antes de cada página y manda al ingreso, con
  `?siguiente=`, cualquier ruta de `/panel`, `/embarque` y `/mi-perfil` sin
  sesión.
- `lib/auth/sesion.ts`: `obtenerSesion()` verifica el token (`getClaims`) y
  saca el rol de `app_rol`, nunca de `user_metadata`. `exigirAcceso()` en
  cada layout: sin sesión, al ingreso; sin el rol, `AccesoDenegado` en lugar
  de la sección.
- Ingreso, registro (D-047), confirmación por correo (`app/auth/confirmar`),
  recuperación de contraseña real, cerrar sesión (también borra la sesión de
  compra de la pestaña).
- Mis viajes con las compras reales de la cuenta (`GET /v1/reservas` y
  boletos con el token) y PDF real. Vinculación de compras sin cuenta: D-048.
- Comprar sigue sin cuenta: el flujo de compra no depende de Auth.
- Barra de desarrollo = cambio de cuentas de prueba; fuera del build de
  producción (D-049). Antes de este cambio el build sí la incluía.
- Verificado:
  - `tsc`, `eslint` (0 errores) y `build` limpio (sin `.next`) pasan.
  - grep en el build de producción: 0 rastros del selector, su acción,
    `DEV_CUENTA_*`, `ecosem_rol_demo` y los lectores de la cookie vieja.
  - curl contra el servidor de desarrollo: `/panel/venta`, `/panel/precios`,
    `/embarque` y `/mi-perfil` sin sesión → 307 al ingreso con `siguiente`;
    con las cookies demo viejas (`ecosem_rol_demo=supervisor`) → igual; con
    una cookie de sesión de Supabase **falsificada** (token con
    `app_rol: supervisor` firmado con otra clave) → igual. `/`, resultados y
    asientos siguen en 200.
  - El mismo token falsificado directo al backend (`/v1/operacion/viajes`,
    `/v1/tarifas`) → 401 `UNAUTHENTICATED`.

**Abierto**
- Prueba con una sesión de pasajero real: no puedo iniciar sesión en el
  Supabase Auth alojado; la hace el responsable en el navegador.
- En Supabase Auth de `EcosemH`, agregar `http://localhost:3000/auth/confirmar`
  a las Redirect URLs para los enlaces de confirmación y recuperación.
- No hay personal en `EcosemH`: el camino counter/supervisor con cuentas
  reales queda sin probar hasta crear el primer supervisor.
- Mis encomiendas, alertas y precios del panel siguen con mock
  (`USUARIO_MOCK`). `lib/mock/compras.ts` quedó sin uso en la web.

---

## 17/10/2026 (cont. 5)

**Hecho**
- Revertido el enmascarado en el PDF del boleto (D-046): cada página imprime
  el documento completo de su pasajero, con su tipo. `PasajeroBoletoPdf`
  cambia `documentoEnmascarado` por `documento` (lo que se imprime) y
  `tipoDocumento` opcional; el panel de venta y los mock de Mis viajes
  siguen pasando el documento enmascarado, como antes.
- La confirmación en pantalla sigue enmascarando: es una lista de varios
  pasajeros.
- Verificado: PDF generado con `generarBoletosCompraPdf` del proyecto (Node
  24 con un hook de alias en el scratchpad): página 1 `DNI 74812213`, página
  2 `Pasaporte AB123456`, ninguna con el documento de la otra. `tsc`,
  `eslint` (0 errores) y `build` pasan.

---

## 17/10/2026 (cont. 4)

**Hecho**
- `EcosemH` sí tiene viajes. A las 22:44 la API devuelve, desde el 18/10:
  Lima → Huancayo 7 por día; Huancayo → Lima, Lima → Cerro de Pasco y
  Cerro de Pasco → Lima 2 por día. El barrido anterior (17/10 al 01/12, las
  4 rutas) devolvió `{"trips":[]}` en todas; no se puede saber desde el
  frontend cuándo se cargaron. El servidor de desarrollo usa solo
  `.env.local` (no apunta al backend falso).
- En la interfaz, contra `EcosemH`: Huancayo → Lima del lunes 19/10, 2
  viajes (6:30 AM Económico y 4:00 PM VIP, S/ 10.00, llegada aproximada).
- Verificador de firma del QR (ECDSA P-256 sobre lo anterior al último
  punto, como la app de embarque), en el scratchpad, probado con un par de
  claves propio: acepta el auténtico, rechaza asiento o firma alterados.

**Abierto**
- La verificación del PDF y del QR contra `EcosemH` está pendiente. Hacen
  falta la clave **pública** de `k202610` (está en `ventas.claves_embarque`;
  el endpoint que la reparte pide personal y no hay) y el webhook firmado
  de la pasarela simulada para confirmar una compra (lo dispara el backend
  con su secreto).

---

## 17/10/2026 (cont. 3)

**Hecho**
- **PDF de boletos con el QR real.** `lib/pdf/boleto.ts`: el dibujo de una
  página pasó a `dibujarPagina`, común a los dos usos.
  - `generarBoletosCompraPdf`/`descargarBoletosCompraPdf` (compra real): una
    página por pasajero, con el QR firmado por el backend para ese asiento
    tal cual (`ticket.qr`), importe por boleto tal como llega, serie-número
    o estado del boleto de viaje. (El documento salía enmascarado; revertido
    en cont. 5, D-046.)
  - `generarBoletoPdf` (panel de venta y Mis viajes, mock) se ve igual que
    antes y sigue con su QR mock.
  - Botón "Descargar boletos (PDF)" en la confirmación, con "Generando...".
- **Barra de rol de desarrollo ya no tapa "Continuar".** `SelectorRolDemo`
  mide su alto con `ResizeObserver` y lo publica en `--alto-barra-dev`; el
  `<body>` reserva ese alto (`padding-bottom`) y las barras fijas de
  resultados y asientos se apoyan encima (`bottom-[var(--alto-barra-dev,0px)]`).
  En producción la barra no existe y la variable cae a 0px.
- Verificado:
  - `tsc`, `eslint` (0 errores) y `build` pasan.
  - Barra: escritorio (61 px de barra, sin solape) y móvil 360×640 en un
    iframe (la barra pasa a dos líneas, 113 px): en resultados y en asientos
    el botón termina por encima de la barra y `elementFromPoint` en su
    centro devuelve el botón.
  - PDF, contra el backend falso: 2 páginas para 2 pasajeros; cada QR,
    decodificado con jsQR fuera del navegador, es idéntico al contenido que
    firmó el backend para su asiento; texto con asiento, documento
    enmascarado e importe. El PDF mock de Mis viajes se sigue generando.

**Abierto**
- La barra fija "Continuar" tapa el final del footer al hacer scroll hasta
  abajo en resultados y asientos (ya pasaba antes; no es la barra de rol).
- Con una recarga en la confirmación, el PDF sale sin terminal ni tipo de
  servicio: `GET .../boletos` no los trae.

---

## 17/10/2026 (cont. 2)

**Contexto:** segundo módulo de la integración: compra (asientos → datos →
pago → confirmación) contra svc-ventas. **Solo desarrollo:** la app móvil
previa de Google Play sigue activa con su propio inventario (confirmado por
el responsable este día), así que esto no pasa a producción hasta que
gerencia decida integrarla o retirarla (D-002, riesgo abierto en ESTADO.md).
Sin commits.

**Hecho**
- `lib/api/compra.ts`: sesión de compra, plano, reservar, liberar, estado,
  pasajeros, contacto, pago y boletos. Mensaje propio por cada error del
  backend: tope de 8 por sesión y tope por red (`SEAT_LIMIT_EXCEEDED` con
  `limitScope`), asiento tomado, viaje no disponible, sin tarifa, reserva no
  vigente, faltan pasajeros, menor sin acompañante, pago no disponible.
- `lib/api/cliente.ts`: POST/PUT/DELETE con cuerpo, `keepalive`, detalles
  del error y reloj del servidor (ver D-043).
- Reglas del módulo:
  1. **Confirmación solo por webhook:** `ConfirmacionView` es también la
     página de retorno de la pasarela; consulta `GET .../pasajeros` y
     muestra "¡Compra confirmada!" solo con `status: purchased`.
  2. **Contador desde `expiresAt`**, con el backend decidiendo vencida o
     comprada (`useVigenciaReserva`, D-043).
  3. **Precio congelado:** resumen y botón muestran `totalAmount` y
     `priceBreakdown.unitPrice` tal como llegan; nada se multiplica.
  4. **Vencida en datos:** el formulario se reemplaza por "Tu reserva
     venció" (también si un PUT responde `RESERVATION_NOT_ACTIVE`); "Volver a
     elegir asientos" conserva lo escrito en memoria.
  - Pagar: `ref` contra doble clic + `isLoading`; tras iniciar el pago el
    botón desaparece.
  - Retroceder / cerrar pestaña: D-042.
- Formulario del pasajero con la forma del contrato
  (`PasajeroReservaForm`: nombres y apellidos aparte, fecha de nacimiento,
  acompañante si es menor) y contacto único por compra con opt-in de
  WhatsApp y declaración de autorización (Ley 29733).
- Pago sin "Boleta / Factura" (D-045) y sin campos de tarjeta ni QR de
  Yape falsos: el cobro lo completa la pasarela.
- Plano real (`planoDesdeApi` en `lib/asientos.ts`); los tipos del plano
  salieron de `lib/mock/asientos.ts` a `lib/asientos.ts` (el panel los sigue
  usando).
- QR real de cada boleto (`QrBoleto`), con el contenido firmado del backend.
- Corregidos de paso: dos toques seguidos sobre asientos se pisaban (estado
  viejo en `manejarToggle`); `ReservationTimer` usaba la clase inexistente
  `text-warning-fill-foreground`.
- Verificado: `tsc`, `eslint` (0 errores) y `build` pasan. Contra
  `EcosemH`: sesión, `TRIP_UNAVAILABLE` y `NOT_FOUND` reales; no hay viajes
  para recorrer el flujo. Flujo completo en Chrome contra un backend falso
  local que sigue el contrato (scratchpad, no está en el repo): tope por
  sesión, total congelado (S/ 66.50, no 2 × 35), vencida al enviar datos con
  lo escrito conservado, 3 clics = 1 `POST /pago`, recarga de la página de
  retorno sigue "esperando", confirmada solo tras el "webhook", 2 QR,
  liberación al salir a resultados, recarga a mitad del flujo.

**Abierto**
- **Producción bloqueada** hasta decidir la app de Google Play (D-002).
- Pedir al backend `date` en `CORS_EXPOSED_HEADERS` (D-043).
- Pasarela real sin elegir: `checkout` solo se maneja para `simulada`
  (no tiene pantalla). Con Culqi/Izipay hay que montar su widget o
  redirección y apuntar el retorno a `rutaCompraConfirmacion`.
- La pasarela simulada solo confirma con un webhook firmado con
  `PAYMENT_GATEWAY_SECRET`: en `EcosemH` una compra queda "esperando" hasta
  vencer, salvo que el backend dispare `simulatedWebhook`.
- ~~Sin PDF del boleto en la confirmación.~~ Resuelto en la entrada de
  arriba (cont. 3).
- Menor en brazos (`infantInArms`) no está en el formulario.
- Equipaje declarado y el escalón de exceso ya no aparecen en la compra web
  (no existen en el contrato).
- `/panel/venta` sigue con mock y con su `PassengerForm` antiguo (tipos
  movidos ahí); al integrarlo pasa a `PasajeroReservaForm`.
- `QrPlaceholder` quedó sin uso.
- ~~La barra del selector de rol tapa "Continuar".~~ Resuelto (cont. 3).

---

## 17/10/2026 (cont.)

**Hecho — selectores del buscador desde el catálogo**
- `SearchForm` arma Origen y Destino con `/v1/catalogo`, ya no con
  `OPCIONES_CIUDAD`: solo ciudades con una ruta activa, y Destino solo
  ofrece las ciudades a las que llega una ruta desde el origen elegido
  (`ciudadesConRuta` en `lib/api/ventas.ts`). Una ruta nueva en el backend
  aparece sola. Huancayo ↔ Cerro de Pasco ya no se ofrece.
- Si el catálogo no carga: aviso con el motivo (red, tiempo, ocupado o el
  mensaje del servidor) y "Reintentar"; el formulario entero queda
  deshabilitado con un `<fieldset disabled>` y los selectores dicen "No
  disponible". Nunca ciudades de respaldo. Un 503 del catálogo se reintenta
  igual que la búsqueda y se avisa debajo del botón.
- `/pasajes/resultados` ya no valida ciudades con la lista fija (`esCiudad`):
  acepta las del catálogo y, si no hay ruta, lo dice. Sin origen o destino
  redirige al inicio (antes caía en Lima → Huancayo).
- Corregido de paso en `SearchForm`: un salto de línea partía la clase
  `transition` del botón "¿Agregar fecha de retorno?" (`tran` + `sition`), que
  además no se atenuaba al deshabilitarse.
- Verificado en Chrome: con `EcosemH`, Origen ofrece Cerro de Pasco,
  Huancayo y Lima, y desde Huancayo solo Lima. Con la URL apuntando a un host
  inalcanzable (solo en el servidor de prueba), aviso de conexión, formulario
  y Buscar deshabilitados. `tsc`, `eslint` (0 errores) y `build` pasan.

**Abierto**
- `OPCIONES_CIUDAD` sigue en encomiendas, caja, venta y viajes del día
  (mock, no tocados). "Rutas populares" del inicio sigue con su mock
  (incluye precios "desde").

---

## 17/10/2026

**Contexto:** primer módulo de integración con el backend (`backend-ecosemh`,
proyecto Supabase `EcosemH`, entorno desarrollo). Solo búsqueda y resultados;
el resto sigue con `lib/mock` hasta que le toque. Sin commits.

**Hecho**
- Configuración: `.env.example` (nombres sin valores, se sube) y `.env.local`
  (ignorado por `.gitignore`) con `NEXT_PUBLIC_SUPABASE_URL` y
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Ningún secreto en el código.
- `lib/api/cliente.ts`: `fetch` a `/functions/v1/<servicio>/v1/...` sin
  supabase-js (no hace falta para llamar Edge Functions; cero dependencias
  nuevas). Tiempo límite de 15 s. Clasifica cada falla: `red`, `tiempo`,
  `ocupado` (503 reintentado hasta `RETRY_MAX_ATTEMPTS` = 4 veces con
  `retryDelayMs` y el `retryAfterSeconds` del cuerpo, D-044) y `servidor`
  (mensaje y `correlationId` del `ErrorBody`). Tipos importados de
  `lib/types/contratos-frontend.ts`, sin duplicar.
- `lib/api/ventas.ts`: catálogo (`/v1/catalogo`, una vez por visita) →
  código de ruta por ciudad → `/v1/viajes?ruta=&fecha=`. Consulta todas las
  rutas activas entre dos ciudades (una ciudad puede tener varios terminales).
- **H-005 cerrado para `/` y `/pasajes/resultados`:** el buscador manda
  `fecha=AAAA-MM-DD` (fecha de calendario, ya no `toISOString()`, que en UTC
  podía cambiar de día) y el backend filtra por esa fecha en hora de Perú.
- `SearchForm`: el botón Buscar queda en `isLoading` mientras dura la
  búsqueda real y muestra los reintentos del 503. La respuesta se entrega a
  resultados (60 s de vigencia) para no pedirla dos veces; "Reintentar" y
  una recarga siempre piden datos nuevos.
- `ResultadosView`: estados reales — cargando (con aviso de reintento),
  sin ruta, sin viajes en la fecha, sin conexión, tiempo agotado, servicio
  ocupado y error del servidor con código de referencia. Se quitó el
  `?error=1` simulado. Nada de datos de respaldo si la API falla.
- `TripCard`: `horaLlegada`/`duracionMinutos` aceptan `null` ("Por
  confirmar"), `llegadaAproximada` ("aprox.") y `precio: null` ("Sin
  tarifa", botón deshabilitado). Mismo componente, sin variante nueva.
- Verificado: `npx tsc --noEmit`, `npx eslint .` (0 errores; 3 advertencias
  previas en `.qa-tmp/`) y `npm run build` pasan. En Chrome contra
  `EcosemH`: búsqueda Lima → Huancayo del 20/10 hizo 2 peticiones reales
  (200) y resultados no repitió la consulta; Huancayo → Cerro de Pasco
  muestra "No hay viajes para esta ruta" (no existe en el catálogo). Los
  casos 503 ×5, 503→200, red caída, 400 y tiempo agotado se probaron con un
  `fetch` simulado sobre `cliente.ts`.

**Abierto**
- `EcosemH` no tiene viajes: 0 viajes en las 4 rutas del 17/10 al 01/12.
  `backend-ecosemh/docs/ESTADO.md` dice que la semilla de B-13 no se cargó;
  `DESPLIEGUE.md` dice que sí. Falta cargar `programacion_ficticia.sql` (o la
  programación real) para ver tarjetas con datos de la base.
- Falta la anon key en `.env.local` (hoy el gateway no la exige porque
  `ventas` tiene `verify_jwt = false`; se envía como `apikey` si existe).
- `Continuar` lleva a asientos con el id real del viaje, y asientos todavía
  busca en el mock: mostrará error hasta integrar ese módulo.
- `/panel/venta` sigue con el mock y conserva H-005.
- ~~Catálogo real sin ruta Huancayo ↔ Cerro de Pasco, que el mock y el
  buscador sí ofrecen.~~ Resuelto en la entrada de arriba.
- `CORS_ALLOWED_ORIGINS` acepta `http://localhost:3000`; el dominio de
  producción queda pendiente (Pages sin configurar).

---

## 15/09/2026 (noche, cont. 5)

**Contexto de rama:** `feature/qa-integral`, creada desde `main` tras el merge
de `feature/navbar-por-rol` (entrada de abajo). Ejecuta
`docs/prompts/17-qa-integral.md` — QA integral de diagnóstico, sin arreglar
nada sobre la marcha.

**Hecho — `docs/prompts/17-qa-integral.md`**
- Recorrido real con Playwright (clics, no solo `goto`) en los 4 roles del
  selector dev-only y en 360×640 / 768×1024 / 1440×900, dividido en cuatro
  pasadas en paralelo (pasajero de punta a punta; counter+supervisor;
  embarque offline; auditoría transversal de reglas) más un crawl y una
  revisión visual propios, todo consolidado en un solo informe: pasajero
  (registro → búsqueda → asiento → datos → pago con Yape → confirmación →
  descarga de boleto → mi perfil → encomiendas → ayuda → libro de
  reclamaciones), counter (venta presencial, caja, viajes del día,
  manifiesto de un bus lleno y uno casi vacío) y supervisor (simulador de
  precios, tarifario, flota, conductores, alertas).
- Embarque probado con la red realmente cortada (`context.setOffline(true)`,
  no solo revisión de código): escaneo válido/repetido/inválido funciona
  100% offline y sincroniza solo al reconectar.
- Crawl automatizado de 108 combinaciones ruta×rol×viewport (overflow
  horizontal, consola) más auditoría de accesibilidad con
  `@axe-core/playwright` (WCAG2A/AA) sobre rutas representativas.
- 16 hallazgos documentados en `docs/QA-HALLAZGOS.md` (0 bloqueantes, 6
  altos, 8 medios, 2 bajos). Los más relevantes:
  - Hydration mismatch real en `/embarque` por un check de SSR
    (`typeof navigator === "undefined"`) que ya no es seguro desde que
    Node 21+ trae `navigator` global (H-001).
  - Contraste AA fallando de forma sistemática en `text-navy/60`/`text-navy/40`
    en 34 archivos, confirmado con `axe-core` (H-002).
  - El buscador no filtra por fecha en absoluto — `Viaje` no modela una
    fecha calendario, solo hora del día (H-005), y como consecuencia el
    boleto imprime siempre la misma fecha fija de referencia del mock
    (H-010).
  - El viaje `v1` aparece con 14 asientos libres en búsqueda/venta y
    lleno (56/56) en el manifiesto — contradicción real de datos, no solo
    datasets desconectados, justo sobre la regla no negociable de
    sobreventa (H-006).
  - El foco no vuelve tras cerrar el modal "Marcar como atendida" en
    `/panel/alertas` porque su propio disparador se borra del DOM al
    cerrar (H-004).
  - Dos tablas del panel de supervisor (`/panel/precios`, `/panel/tarifario`)
    cortan una columna/botón de acción a 360×640 sin ninguna señal visual
    de que hay más contenido a la derecha (H-013, H-014).
- `docs/PLAN-DE-PRUEBAS.md` actualizado con los casos que este QA reveló que
  faltaban (contraste con axe, foco en regiones con scroll, checks de SSR con
  `navigator`, coherencia de datos de contacto entre módulos, embarque
  offline de verdad, precio congelado medido paso a paso, fecha del
  buscador, disponibilidad cruzada entre pantallas, retorno de foco cuando
  el modal borra su disparador, tablas `overflow-x-auto` con affordance
  visible).
- Scripts de Playwright usados para este QA quedan en `.qa-tmp/` (fuera de
  git, en `.gitignore`) — no se commitean, son desechables.
- Nota aparte, sin tocar: `.gitignore` ya tenía `docs/` ignorado antes de
  esta sesión (no es cambio de esta tarea) — `docs/QA-HALLAZGOS.md` y el
  resto de `docs/` quedan solo locales y no viajarán en un futuro PR a menos
  que se decida destrackear esa regla.

**Pendiente / decisión conjunta:** el informe está completo pero **no se
arregló nada todavía** (pedido explícito del prompt) y **no se abrió PR** —
falta decidir juntos qué hallazgo se corrige en esta misma rama y qué se
convierte en tarea aparte.

---

## 15/09/2026 (noche, cont. 4)

**Contexto de rama:** `feature/condiciones-contratacion` (entrada de abajo)
ya está mergeada a `main` por PR; esta sesión corrió
`docs/prompts/16-navbar-por-rol.md` sobre `feature/navbar-por-rol`, creada
desde ese `main`. Problema de partida: `/panel/*` y `/embarque` funcionaban
pero nadie podía llegar ahí navegando, solo escribiendo la URL a mano.

**Hecho — `docs/prompts/16-navbar-por-rol.md`**
- El rol simulado se mudó de constante de mano (`ROL_MOCK` en
  `lib/mock/sesion.ts`) a una cookie de servidor
  (`lib/auth/sesion.ts` → `obtenerRolDemo()` / `establecerRolDemo()` /
  `eliminarRolDemo()`, mismo mecanismo que ya usaba la sesión) — D-040,
  resolviendo la nota pendiente que D-016 dejó abierta. Los 8 archivos que
  importaban `ROL_MOCK` (todos los `layout.tsx` de `/panel/*`,
  `app/panel/page.tsx`, `app/embarque/layout.tsx`) pasan a `await
  obtenerRolDemo()`.
- Nueva Server Action `cambiarRolDemo()` en `lib/auth/acciones.ts`: crea o
  borra la cookie de sesión y la de rol demo juntas, según la opción
  elegida (sin sesión / pasajero / counter / supervisor). No-op si
  `NODE_ENV === "production"`.
- `components/layout/SelectorRolDemo.tsx` (nuevo, dev-only): barra fija
  abajo con los 4 estados, botones de 44×44 px mínimo. Montado en
  `app/layout.tsx` fuera de `ShellPublico` para que siga apareciendo en
  `/embarque` (esa ruta oculta el TopBar público, D-026, pero la tarea 17
  de QA necesita cambiar de rol ahí también).
- `components/layout/PanelMenu.tsx` (nuevo): menú desplegable "Panel" para
  el TopBar de escritorio, con los enlaces internos agrupados y separados
  del sitio público por una línea vertical. El menú móvil de pantalla
  completa ya existente ahora refleja el mismo agrupamiento bajo un
  encabezado "Panel interno" (D-041).
- Bug encontrado y corregido durante la verificación: el `<nav>` del menú
  móvil no tenía `overflow-y-auto` (le faltaba además `min-h-0`, el error
  clásico de flexbox) — con 6 enlaces públicos nunca se notaba, pero con
  10 enlaces internos más "Cerrar Sesión" el contenido se recortaba contra
  el borde del viewport en pantallas de 640px de alto, invisible e
  inalcanzable. Corregido en `components/layout/TopBar.tsx`.
- Auditoría de rutas pedida explícitamente por el prompt ("revisar que
  toda ruta interna esté protegida, no solo las que se acordaron en su
  tarea original"): las 10 rutas bajo `/panel/*` y `/embarque` ya estaban
  protegidas correctamente (el layout de `/panel` exige `esPersonal`, los
  5 layouts anidados de Precios/Tarifario/Flota/Conductores/Alertas exigen
  `esSupervisor`, `/panel/venta`/`/panel/caja`/`/panel/viajes` heredan del
  layout padre sin guardia propia porque son para counter+supervisor) — no
  se encontró ninguna ruta interna sin proteger.
- Verificado en el navegador recorriendo los 4 estados con el selector:
  cada uno ve exactamente lo que le toca (pasajero nunca ve Panel ni
  Embarque; counter ve 5 enlaces internos; supervisor ve los 5 más
  Precios/Tarifario/Flota/Conductores/Alertas); intentando entrar por URL
  directa a `/panel`, `/panel/precios`, `/panel/tarifario` y `/embarque`
  con un rol que no le toca, cada uno redirige donde corresponde
  (`/panel` → `/`, secciones de supervisor → `/panel` si sos counter);
  360×640 (menú móvil con scroll, sin overflow horizontal), 768px (límite
  exacto del breakpoint `md`) y 800px+ sin overflow horizontal.
- Verificación de "no debe aparecer en producción" hecha de verdad, no
  asumida: `npm run build && npm run start` reales (el primer intento dio
  un falso negativo por un `next dev` de una tarea anterior que seguía
  vivo en el puerto 3000 — resuelto matando los procesos de Node antes de
  levantar el server real) y `curl` contra `/`, `/panel`, `/embarque`,
  `/nosotros` y `/ayuda` en ese server de producción: ninguna de esas
  páginas contiene el selector. Limitación aceptada y documentada en
  D-041: el chunk de JS del selector igual queda en `.next/` porque
  `app/layout.tsx` lo importa de forma estática, aunque ninguna página
  real lo carga.
  `npx tsc --noEmit`, `npx eslint .` y `npm run build` pasan.

**Abierto**
- Nada nuevo específico de esta tarea — ver D-041 por la limitación
  aceptada del chunk de JS del selector en el build de producción.

---

## 15/09/2026 (noche, cont. 3)

**Contexto de rama:** `feature/ayuda` (entrada de abajo) ya está mergeada a
`main` por PR; esta sesión corrió `docs/prompts/15-condiciones-contratacion.md`
sobre `feature/condiciones-contratacion`, creada desde ese `main`. Este
prompt trajo el primer texto legal real de la empresa (las Condiciones
Generales del Contrato de Viaje), a diferencia de la tarea 14, donde
CLAUDE.md prohibía inventar ese texto.

**Hecho — `docs/prompts/15-condiciones-contratacion.md`**
- `app/terminos/condicionesContratoViaje.ts` (nuevo): las 11 condiciones
  (con los 4 sub-puntos de la 3) copiadas literal, rarezas incluidas
  ("S/. 5.00 soles", "deberá de pagar"). `app/terminos/page.tsx` las
  renderiza como una sección propia ("Condiciones Generales del Contrato de
  Viaje"), antes del resto del andamiaje de la tarea 14. Se decidió NO
  redistribuir los 11 puntos entre las 9 secciones ya andamiadas: son un
  documento operativo cohesionado con numeración oficial propia, partirlo
  habría sido una forma de reescribirlo (D-038). De esas 9, 2 cambiaron su
  descripción (no su marcador) para dejar explícito qué parte ya quedó
  cubierta y cuál sigue pendiente: "Cambios, cancelaciones y reembolsos" →
  "Cancelaciones y reembolsos", "Equipaje y encomiendas" → "Condiciones de
  transporte de encomiendas". Las otras 7 quedan intactas — este documento
  no dice nada sobre objeto, descripción del servicio, registro, precios,
  responsabilidad general, modificaciones ni ley aplicable.
  `/privacidad` no se tocó, como pedía el prompt explícitamente.
- `app/ayuda/preguntasFrecuentes.tsx`: 4 respuestas nuevas (¿Qué pasa si
  pierdo mi boleto? → duplicado por S/ 5.00 vía `formatPrecio`; ¿Puedo
  viajar con mi mascota? → no; ¿Los niños pagan pasaje? → desde los 5 años,
  permiso notarial si el menor va acompañado; ¿Puedo cancelar mi pasaje? →
  sigue sin política, remite a counter — separada de la pregunta de cambio
  de fecha, que antes las mezclaba en una sola) y 3 actualizadas (¿Puedo
  cambiar la fecha de mi pasaje? → política real de postergación; franquicia
  de equipaje → agrega "maletas o maletines"; exceso de equipaje → agrega la
  condición de capacidad del bus; ¿Qué no puedo llevar en el equipaje? →
  joyas/electrónicos/efectivo declarados como especies valoradas, cabina no
  declarada sin cobertura). Las que el nuevo documento no cubre (perder el
  bus, qué se puede enviar como encomienda, qué documento pide el
  destinatario) siguen remitiendo a counter, sin inventar nada.
- Interpretación anotada (D-039): "postergación por 15 días hábiles" se
  leyó como la ventana de la nueva fecha (hasta 15 días hábiles después del
  viaje original), no como un plazo para solicitarla — la lectura
  gramaticalmente más directa y la que no exige inventar un punto de
  partida que el texto no da.
- Chequeo de consistencia pedido por el prompt: el punto 2 ("30 min antes
  con boleta y DNI") ya coincide con el PDF del boleto
  (`lib/pdf/boleto.ts`) y con `ConfirmacionView.tsx`; se buscó en todo el
  repo cualquier mención previa de postergación, duplicado de boleto,
  permiso notarial, especies valoradas o equipaje de cabina y no había
  ninguna — sin contradicciones que resolver.
  `npx tsc --noEmit`, `npx eslint .` y `npm run build` pasan. Verificado en
  navegador: las 11 condiciones y el resto de la página se leen completas
  y sin overflow horizontal a 360×640 (con un iframe de ese ancho real,
  ya que `resize_window` no cambiaba el viewport en este entorno), y las
  respuestas nuevas/actualizadas de `/ayuda` se expanden con el contenido
  correcto.

**Abierto**
- Vacío funcional detectado, sin resolver en esta tarea (pedido explícito
  del prompt): el punto 5 de las Condiciones implica una tarifa/conteo
  diferenciado para niños desde 5 años, que el flujo de compra no maneja
  hoy (`PurchaseProvider` trata todo pasajero igual). Anotado en
  `docs/ESTADO.md`.
- La lectura de "15 días hábiles" (D-039) es una interpretación razonada,
  no confirmada por la empresa — anotado como riesgo en `docs/ESTADO.md`.
- `/privacidad` y 7 de las 9 secciones de `/terminos` siguen bloqueadas
  esperando redacción legal real (D-036, vigente).

---

## 15/09/2026 (noche, cont. 2)

**Contexto de rama:** `feature/tarifario-encomiendas` (entrada de abajo) ya
está mergeada a `main` por PR; esta sesión corrió
`docs/prompts/14-ayuda-faq.md` sobre `feature/ayuda`, creada desde ese
`main`. Con esta tarea se completaron las 14 tareas de `docs/prompts/`.

**Hecho — `docs/prompts/14-ayuda-faq.md`**
- `components/ui/Accordion.tsx` (nuevo, `AccordionItem`): `<button
  aria-expanded aria-controls>` + panel con `hidden` nativo, en vez de
  `<details>` sin estilar (pedido explícito del prompt) — botones nativos,
  así que Tab/Enter/Espacio ya navegan y activan sin manejo propio de
  teclado.
- `/ayuda` reemplaza el placeholder (`PaginaEnConstruccion`, eliminado por
  quedar sin uso): FAQ agrupadas en Pasajes, Encomiendas, Equipaje, Pagos y
  Cuenta (`app/ayuda/preguntasFrecuentes.tsx`). Las respuestas describen
  solo reglas reales del sistema (franquicia de 20 kg, volumétrico ÷ 5000,
  confirmación de pago por webhook, reserva de 10 minutos); donde no hay
  política definida (perder el bus, cambios, cancelaciones, reembolsos, qué
  se puede enviar, qué no se puede llevar) la respuesta remite a counter en
  vez de inventar una regla (D-037). Enlace al Libro de Reclamaciones al
  pie de la página, restricción explícita del prompt.
- `/terminos` y `/privacidad` (nuevas): solo estructura — encabezado +
  descripción neutral + marcador "Pendiente de redacción legal"
  (`components/legal/SeccionPendiente.tsx`) en cada sección, ningún texto
  legal generado (D-036). `/privacidad` cubre los 5 encabezados que la Ley
  29733 exige según el prompt (finalidad, datos recabados, plazo de
  conservación, encargados del tratamiento, derechos ARCO). Enlazadas desde
  el pie de página y desde la casilla de aceptación de `/registro` (los
  enlaces abren en pestaña nueva y no togglean el checkbox al hacer clic
  encima, con `stopPropagation` explícito).
  `npx tsc --noEmit`, `npx eslint .` y `npm run build` pasan.
  Verificado en el navegador: acordeón con Tab/Enter, `aria-expanded`
  alternando visualmente (chevron + panel), y las tres resoluciones del
  prompt (360×640, 768×1024, 1440×900) sin overflow horizontal en `/ayuda`,
  `/terminos` y `/privacidad`.

**Abierto**
- Requisito explícito del prompt, anotado en `docs/ESTADO.md`: `/terminos`
  y `/privacidad` necesitan revisión y redacción real del área legal antes
  de publicarse — hoy son solo estructura.
- Si comercial define políticas de cambio/cancelación/reembolso o listas de
  qué se puede enviar/llevar, hay que volver a
  `app/ayuda/preguntasFrecuentes.tsx` y reemplazar esas respuestas.
- No quedan tareas pendientes en `docs/prompts/` (ver
  `docs/prompts/README.md`, sección "Pendiente de planificar" para lo que
  sigue: backend completo).

---

## 15/09/2026 (noche, cont.)

**Contexto de rama:** `feature/alertas-flota` (entrada de abajo) ya está
mergeada a `main` por PR; esta sesión corrió
`docs/prompts/13-tarifario-encomiendas.md` sobre `feature/tarifario-encomiendas`,
creada desde ese `main`.

**Hecho — `docs/prompts/13-tarifario-encomiendas.md`**
- `lib/mock/tarifario.ts` (nuevo, reemplaza el `RANGOS_TARIFA_ENCOMIENDA`
  placeholder de `lib/mock/encomiendas.ts`, que se redujo a solo el dominio
  de rastreo): tipos y funciones puras — peso volumétrico, peso facturable
  (mayor entre real y volumétrico, con cuál de los dos ganó), búsqueda de
  rango por peso, cálculo de recargo por valor declarado, cálculo de
  escalón de exceso de equipaje. `TARIFARIO_ENCOMIENDA_INICIAL` arranca con
  `rangos: []` en las 3 rutas — el prompt es explícito ("no rellenar con
  cifras inventadas") y es más estricto que el motor de precios (D-030,
  D-033).
- `lib/mock/tarifarioStore.ts` (nuevo): el tarifario configurado en
  `/panel/tarifario` tiene que ser el mismo que lee `/encomiendas/enviar`
  (a diferencia de precios, que el prompt de esa tarea deja
  intencionalmente desconectado del checkout) — sin backend, un módulo
  singleton con `useSyncExternalStore` es lo mínimo que logra eso (D-034).
  Sobrevive a la navegación entre rutas de Next.js, se pierde en una
  recarga completa.
- `/panel/tarifario` (solo supervisor, mismo patrón que Precios/Flota):
  rangos de peso por ruta editables desde cero (agregar/editar/quitar,
  aviso "Pendiente de aprobación comercial" mientras una ruta no tenga
  ningún rango), escalones de exceso de equipaje con límites de kg fijos
  (20/30/50, dados por el prompt) y recargo editable, recargo por valor
  declarado como un solo porcentaje global editable.
- `/encomiendas/enviar` actualizado para leer el tarifario configurado:
  desglose completo (peso real, volumétrico, cuál se factura y por qué,
  rango aplicado, recargo por valor declarado, total) o aviso "Consulta la
  tarifa en counter" si la ruta no tiene rango definido para ese peso.
  Verificado en el navegador: un paquete de 2 kg y 50×50×50 cm factura por
  volumétrico (25 kg); uno de 40 kg y 20×20×20 cm factura por peso real —
  ambos casos probados primero sin tarifario (sin monto inventado) y luego
  con un tarifario armado en vivo desde `/panel/tarifario` (S/ 80 hasta 50
  kg + S/ 20 de recargo por un valor declarado de S/ 1000 al 2% = S/ 100
  total).
- Campo opcional "Equipaje declarado (kg)" en `PassengerForm`
  (`/pasajes/comprar/datos`): muestra en vivo el escalón que aplicaría, sin
  sumarlo al total del pasaje — el monto de cada escalón no está definido
  todavía (D-035).
  `npx tsc --noEmit`, `npx eslint .` y `npm run build` pasan.

**Abierto**
- Requisito operativo explícito del prompt, anotado en `docs/ESTADO.md`:
  el tarifario depende de que haya balanza digital en cada counter.
- El tarifario configurado vive en memoria (`lib/mock/tarifarioStore.ts`),
  no en base de datos: se pierde al recargar la página, igual que el resto
  del proyecto sin backend.
- El % de recargo por valor declarado y los recargos de equipaje son un
  solo valor global (no por ruta ni por conductor) — el prompt dice
  "porcentaje o tabla", se optó por porcentaje único; si comercial pide una
  tabla por rango de valor, hay que revisar este punto.

---

## 15/09/2026 (noche)

**Contexto de rama:** `feature/motor-precios` (entrada de abajo) ya está
mergeada a `main` por PR; esta sesión corrió
`docs/prompts/12-alertas-flota.md` sobre `feature/alertas-flota`, creada
desde ese `main`.

**Antes de implementar:** el prompt pedía escalar la urgencia de alertas de
documento a medida que se acerca el vencimiento (30 → 15 → 7 días, más
"vencido"), pero su propio bullet de verificación decía lo contrario ("a 20
días muestra la alerta de nivel 15, no la de 30"). Se preguntó explícitamente
antes de tocar código; confirmado que el error estaba en el bullet, no en la
regla — corregido en el propio `docs/prompts/12-alertas-flota.md` y
documentado en D-031 (`docs/DECISIONES.md`).

**Hecho — `docs/prompts/12-alertas-flota.md`**
- `lib/mock/flota.ts`: `Unidad`, `Conductor` y `Alerta` (tipo, urgencia,
  entidad unidad-o-conductor, descripción, fecha de emisión, estado
  activa/atendida, fecha de atención, responsable y nota — el histórico es
  el punto de esta versión, según el propio prompt). Escalonamiento
  30/15/7 días + "vencido" en `nivelAlertaDocumento()`, verificado con tres
  unidades mock cuyo SOAT vence a exactamente 20/12/5 días. Kilometraje y
  horas de conducción alertan en `warning` plano al cruzar su umbral (el
  prompt no pide escalonamiento para esos dos tipos). Datos mock reusan las
  mismas placas y conductores de `lib/mock/manifiesto.ts` (D-032), no un
  segundo set inventado.
- `/panel/flota`: listado de unidades con placa, modelo, capacidad, tipo de
  servicio, kilometraje acumulado, y la alerta más urgente de cada una (o
  "Sin alertas activas").
- `/panel/flota/[placa]`: documentos (SOAT, revisión técnica, tarjeta de
  circulación) con su vencimiento y estado; umbral de kilometraje editable
  en modal; histórico de alertas de esa unidad (emitidas y atendidas, con
  responsable/fecha/nota para las atendidas).
- `/panel/conductores`: licencia y su vencimiento, horas de conducción
  acumuladas, límite de horas editable (parámetro configurable pedido por
  el prompt).
- `/panel/alertas`: bandeja de todas las alertas activas ordenadas por
  urgencia, con "Marcar como atendida" (responsable + nota obligatorios) —
  probado en el navegador: al guardar, la alerta desaparece de "activas" y
  aparece en "Atendidas" con fecha, responsable y nota. Sección "Atendidas"
  también muestra el histórico sembrado de ciclos anteriores.
- `components/ui/UrgenciaPill.tsx`: componente propio (no `Badge`, que ya
  tiene su vocabulario cerrado de 5 estados de pasajes/encomiendas) con los
  3 tokens semánticos del skill más "vencido" reusando navy sólido, mismo
  criterio que "completado" en `Badge.tsx` (D-032).
- Acceso a las tres secciones nuevas restringido a `supervisor`
  (`app/panel/flota/layout.tsx`, `app/panel/conductores/layout.tsx`,
  `app/panel/alertas/layout.tsx`, mismo patrón que D-029) — probado con los
  dos roles: `ROL_MOCK = "counter"` no ve los enlaces ni las tarjetas y
  entrar por URL directa redirige a `/panel`; `ROL_MOCK = "supervisor"` sí
  los ve y puede operar las tres pantallas.
- Nuevas rutas en `lib/routes.ts` (`panelFlota`, `panelConductores`,
  `panelAlertas`, `rutaPanelUnidad()`) y tarjetas/enlaces nuevos en
  `app/panel/page.tsx`/`app/panel/layout.tsx`, condicionados a
  `esSupervisor(ROL_MOCK)` igual que "Precios".
  `npx tsc --noEmit`, `npx eslint .` y `npm run build` pasan.

**Abierto**
- Igual que en motor de precios: todo en memoria de sesión (umbral de
  kilometraje, límite de horas, atención de alertas) se pierde al recargar
  — no hay backend todavía.
- La generación de alertas es un cálculo derivado del estado actual
  (`generarAlertasActivas()`), no un job programado que las emita y las
  deje fijas en el tiempo; cuando exista backend, ese job (y su
  periodicidad) queda pendiente de definir.
- Notificación al responsable ("con responsable notificado", texto del
  prompt) no está implementada — no hay canal de notificaciones todavía
  (WhatsApp/correo son pendientes de otras tareas de CLAUDE.md).

---

## 15/09/2026 (tarde)

**Contexto de rama:** `feature/pwa-embarque` (entrada de abajo) ya está
mergeada a `main` por PR; esta sesión corrió
`docs/prompts/11-motor-precios.md` sobre `feature/motor-precios`, creada
desde ese `main`. Esta vez el merge no dejó nada roto — `tsc`/`eslint`/build
pasaban limpio antes de empezar.

**Hecho — `docs/prompts/11-motor-precios.md`**
- `/panel/precios`, con un candado más estricto que el resto del panel: no
  alcanza con ser personal (`esPersonal`, D-016), hace falta el rol
  `supervisor` específicamente. Nuevo `esSupervisor()` en
  `lib/mock/sesion.ts` + `app/panel/precios/layout.tsx` propio que redirige
  a `/panel` (no a `/`) si el rol mock no es supervisor — decisión D-029
  sobre por qué un layout anidado y no un flag en el layout existente.
  Probado con los dos roles: `ROL_MOCK = "counter"` no ve el enlace
  "Precios" en el nav ni la tarjeta en el índice, y entrar por URL directa
  redirige a `/panel`; `ROL_MOCK = "supervisor"` sí los ve.
- `lib/mock/precios.ts`: tarifa base/tope mínimo/tope máximo por ruta (3
  rutas, una por cada par que ya existe en `lib/mock/viajes.ts` — tarifa
  base tomada del precio económico más bajo que ya está en VIAJES, no
  inventada), factores de ocupación (los literales de la propuesta que trae
  el prompt), de anticipación (rangos por días, placeholder) y de temporada
  (categorías con nombre — Fiestas Patrias, Navidad y Año Nuevo, feriados
  largos, eventos locales de Pasco/Junín — en vez de un rango numérico,
  porque no hay lógica de calendario en esta tarea). Anticipación y
  temporada marcadas explícitamente como placeholder pendiente de
  comercial, tanto en comentarios como en la propia UI — ver D-030 y el
  hallazgo ya existente en `docs/INFORME-AVANCE.md`.
  `calcularPrecio()` aplica los tres factores y acota al tope de la ruta,
  devolviendo de qué tope se ajustó (si acaso) para que la UI lo explique.
- Tabla de rutas editable (`TablaRutas.tsx`): modal con tarifa
  base/mínimo/máximo. Regla obligatoria del prompt implementada de verdad,
  no solo de palabra: intentar guardar con el tope máximo vacío bloquea el
  guardado y muestra "El tope máximo es obligatorio" sin cerrar el modal —
  probado en el navegador.
  `TablaFactores.tsx` (un componente, reusado 3 veces — ocupación,
  anticipación, temporada — mismo patrón "rango + factor editable").
  `SimuladorPrecio.tsx`: elige ruta/ocupación/anticipación/temporada y
  muestra el desglose completo, factor por factor, más un aviso cuando el
  subtotal calculado quedó fuera del tope de la ruta y quedó acotado —
  probado con 95% de ocupación + 0 días de anticipación en Lima↔Huancayo:
  subtotal S/ 52.44, ajustado al tope máximo (S/ 52.00) configurado, con el
  aviso correspondiente. También probado el caso fuera de rango (ocupación
  150%): error "No puede superar 100%" y el desglose no se muestra hasta
  corregirlo.
  `HistorialCambios.tsx`: cada guardado de ruta o factor agrega una entrada
  con usuario (`USUARIO_MOCK.nombre`), fecha/hora, campo y valor
  anterior/nuevo — probado editando tarifa base y tope máximo de una ruta:
  aparecieron dos entradas separadas (una por campo), más reciente arriba.
  Banner fijo arriba de la pantalla dejando explícito que los cambios
  aplican a reservas nuevas, no a un carrito en curso (regla del precio
  congelado, CLAUDE.md).
- Nueva tarjeta "Motor de precios" en `/panel` y enlace "Precios" en el nav
  del panel, ambos condicionados a `esSupervisor(ROL_MOCK)` — reusa
  `CreditCardIcon`, ya existente, ningún ícono nuevo.
  `npx tsc --noEmit`, `npx eslint .` y `npm run build` pasan.

**Abierto**
- Pendiente explícito de la tarea (anotado en `docs/ESTADO.md`):
  persistencia real de tarifas/factores/historial (hoy todo en memoria, se
  pierde al recargar), cálculo server-side en el checkout real —
  `/panel/precios` todavía no está conectado a `lib/mock/viajes.ts` ni al
  flujo de compra —, auditoría en base de datos, y valores reales de
  anticipación/temporada de parte de comercial (D-030).

---

## 15/09/2026 (madrugada)

**Contexto de rama:** las tres ramas de las entradas de abajo
(`feature/autenticacion`, `feature/panel-counter`, `feature/manifiesto-sutran`)
ya están mergeadas a `main` por PRs — esta sesión corrió
`docs/prompts/10-pwa-embarque.md` sobre `feature/pwa-embarque`, creada desde
ese `main` ya unificado.

**Arreglos previos, antes de tocar nada de embarque** — el merge automático
dejó el build roto, en dos lugares:
1. `app/panel/page.tsx` tenía un `<div>` sin cerrar y un import de
   `redirect` sin usar (`npx tsc --noEmit` ni siquiera parseaba el archivo)
   — se reescribió como una sola grilla de 3 tarjetas (Viajes/Venta/Caja) en
   vez de la grilla anidada que dejó el merge.
2. `app/panel/layout.tsx` importaba `HAY_SESION_MOCK`, que ya no existe
   (`feature/autenticacion` la reemplazó por la cookie de
   `lib/auth/sesion.ts`) — corregido combinando `await haySesionActiva()`
   (sesión real) con `esPersonal(ROL_MOCK)` (rol, todavía mock). Detalle y
   motivo completo en la actualización de D-016 en `docs/DECISIONES.md`.
Con esos dos arreglos, `npx tsc --noEmit && npx eslint . && npm run build`
volvieron a pasar limpio antes de empezar la tarea de esta sesión.

**Hecho — `docs/prompts/10-pwa-embarque.md`**
- Firma HMAC real del QR del boleto (D-025): `generarContenidoQr` en
  `lib/pdf/boleto.ts` pasó de devolver un string sin firmar a
  `"{codigo}|{firma}"`, firma calculada en `lib/firma.ts` con Web Crypto
  nativo (sin agregar una librería) y una clave mock marcada como pendiente
  crítico en el propio código y en D-025. Regenerar un boleto real desde
  `/panel/venta` después del cambio confirmó que sigue descargándose sin
  errores.
- `lib/embarque/`: `tipos.ts` (formas de datos locales), `db.ts` (IndexedDB
  — dos almacenes, `manifiestos` y `escaneos` con clave compuesta
  `[viajeId, codigoBoleto]`; excepción justificada a "sin localStorage",
  D-024), `validar.ts` (`parsearContenidoQr` + `validarEscaneo`, la función
  que de verdad importa: sin ninguna llamada de red, `firma` opcional para
  que la entrada manual valide solo contra el manifiesto local — D-027),
  `sync.ts` (simula el envío al backend que no existe) y
  `useEstadoSincronizacion.ts` (hook de conexión + pendientes, con un
  evento custom `EVENTO_NUEVO_ESCANEO` para que el contador del header se
  entere de escaneos hechos en otra pantalla).
  `lib/mock/manifiesto.ts`: cada `PasajeroManifiesto` ahora lleva
  `codigoBoleto` (mismo formato "ECH-XXXXXX", generado con la misma semilla
  determinística que el resto del archivo) — sin esto no había con qué
  buscar al pasajero dentro del manifiesto descargado al escanear.
- `/embarque` (`SeleccionViajeView.tsx`): lista los viajes del día
  (reutiliza `buscarViajesDelDia` de `lib/mock/manifiesto.ts`, el mismo
  dataset que `/panel/viajes`) filtrados por fecha, con botón
  Descargar/Abrir según si ya está en IndexedDB. Al descargar, siembra en
  `escaneos` los pasajeros que el mock ya marca "embarcado" (para que
  escanear su código dé "Ya embarcado" desde el primer momento, no "Válido"
  de nuevo) y bloquea la descarga (no la apertura de uno ya descargado) si
  `navigator.onLine` es falso.
- `/embarque/[viajeId]` (`EscaneoView.tsx`, primera ruta `[id]` +
  interacción con hardware del proyecto): cámara con `BarcodeDetector`
  nativo (Chrome/Android — el runtime real de esta PWA instalada; sin
  librería, tipos propios en `lib/embarque/tiposNavegador.ts` para no usar
  `any`), entrada manual de respaldo, contador embarcados/total, y un
  banner de resultado grande a propósito (texto 3xl, ícono de 64px) para
  los tres casos exactos del prompt — Válido/Ya embarcado/Inválido — con
  los tokens de color existentes (success-fill/warning-fill/error-fill),
  no colores nuevos.
- PWA instalable: `public/manifest.webmanifest` (ícono reutiliza
  `icon.png`, en su tamaño real 793×695 — no es cuadrado, falta el asset de
  diseño real, anotado como pendiente) y `public/embarque-sw.js` (service
  worker a mano, sin `next-pwa`, `scope: "/embarque/"` para no tocar
  ninguna otra ruta — D-028). Nuevo `components/layout/ShellPublico.tsx`
  para que `/embarque` no muestre el TopBar/Footer público (D-026) — mismo
  problema que D-017 (panel sin root layout propio) resuelto distinto por
  ser un caso más fuerte (kiosco de pantalla completa, no una app de
  escritorio).
  Dos íconos nuevos en `components/ui/icons.tsx`: `WifiIcon`/`WifiOffIcon`
  (no existía nada de conectividad en el set).
- Verificado en navegador extremo a extremo (no solo revisando el código):
  login, `/embarque` muestra los 6 viajes con su conteo de pasajeros
  correcto, descarga y entra a un viaje de 4 pasajeros (2 ya "embarcados"
  del mock → contador arrancó en 2/4). Cámara: el entorno de automatización
  no tiene `BarcodeDetector`/cámara real, así que cayó a "Este navegador no
  puede leer QR por cámara. Usa el código manual." — exactamente el
  comportamiento de respaldo que pide el prompt, no un error. Con entrada
  manual: código sin escanear → VÁLIDO con nombre/asiento correctos y
  contador a 3/4; mismo código de nuevo → YA EMBARCADO con la hora real del
  primer escaneo; código inexistente → INVÁLIDO "No corresponde a este
  viaje". Sincronización: "1 pendiente" en el header, sincronizar a mano lo
  dejó en 0 y marcó los 3 registros de IndexedDB como `sincronizado: true`
  (confirmado leyendo la base directamente desde la consola). Desconexión
  real de red no se puede simular desde la automatización del navegador —
  se simuló `navigator.onLine`/eventos `online`/`offline` por consola: en
  "sin conexión" un escaneo nuevo se validó igual (4/4, la función de
  validación no llama a red nunca, ver `lib/embarque/validar.ts`) y quedó
  en cola; al simular `online`, sincronizó solo. La rama de firma inválida
  (que exige la firma HMAC, solo alcanzable leyendo un QR real por cámara)
  se verificó aparte con un script Node que replica el mismo algoritmo:
  determinística, rechaza firma alterada y código alterado.
  `npx tsc --noEmit`, `npx eslint .` y `npm run build` pasan.

**Abierto**
- Pendiente explícito de la tarea (anotado en `docs/ESTADO.md`): clave de
  firma real del lado del servidor (D-025), endpoint real de
  sincronización, rol "embarque" real si hace falta, precache de build real
  del service worker (D-028), y que los escaneos de `/embarque`
  retroalimenten `/panel/viajes/[id]` (hoy son datasets independientes).
- Ícono de la PWA (`icon.png`) no es cuadrado — placeholder hasta que
  exista el asset de diseño real, mismo tipo de pendiente que la foto de
  flota del hero en `docs/ESTADO.md`.

---

## 15/09/2026 (noche)

**Contexto de rama:** `docs/prompts/09-manifiesto-sutran.md` corrió sobre
`feature/manifiesto-sutran`, creada desde `main` — sin `feature/08-panel-counter`
(entrada de abajo) ni `feature/07-autenticacion`, ninguna mergeada todavía.
El prompt asume que `/panel` ya existe (el orden sugerido en
`docs/prompts/README.md` decía "09 — manifiesto, se apoya en el panel"); como
esta rama no lo tiene, se rehizo `app/panel/layout.tsx` con el mismo mock de
rol que la rama de panel-counter (`HAY_SESION_MOCK`/`ROL_MOCK`/`esPersonal`
en `lib/mock/sesion.ts`), dejando anotado en el propio archivo y en
`docs/ESTADO.md` que las dos versiones van a chocar al mergear.

**Hecho**
- `docs/prompts/09-manifiesto-sutran.md`: `/panel/viajes` (listado del día,
  filtros por fecha/ruta/agencia) y `/panel/viajes/[id]` (detalle + botón
  "Generar manifiesto"), primera ruta dinámica `[id]` del proyecto.
  Nuevo dataset `lib/mock/manifiesto.ts`: 6 salidas fijas del día
  (`VIAJES_DEL_DIA`, generadas de forma determinística por `viaje.id` con
  `hashSemilla`/`mulberry32`, mismo criterio que `lib/mock/asientos.ts`),
  cada una con placa, conductor(es) — dos si la ruta dura más de 5h — y la
  lista real de pasajeros con **documento completo, sin enmascarar** (D-020:
  es un documento de fiscalización, la Ley 29733 no lo prohíbe cuando hay
  finalidad declarada). Elegidas a propósito: v1 (económico, dos pisos,
  56/56 vendidos — el caso "bus lleno" que pide la verificación) y v4 (VIP,
  4/30 — el caso "pocos pasajeros"), más v2/v6/v8/v12 para cubrir los 5
  estados de `Badge` en el listado (confirmado/en-ruta/cancelado/completado/
  pendiente).
  `lib/pdf/manifiesto.ts`: PDF nuevo con `pdf-lib`, A4 horizontal (D-022,
  a diferencia del boleto que es vertical), tabla de 5 columnas (asiento,
  apellidos y nombres, tipo y N.° de documento, origen, destino) que pagina
  sola cuando no entra en una hoja — repite encabezado y columnas en cada
  página nueva, "Total de pasajeros" + espacio para firma y sello solo en la
  última. Para reusar el mismo dibujo de texto/línea que ya tenía
  `lib/pdf/boleto.ts` (pedido explícito del prompt), se extrajeron esos
  helpers a `lib/pdf/comun.ts` (D-021) — `Contexto` ahora lleva
  `margen`/`anchoContenido` en vez de asumir el tamaño de página del boleto,
  para que le sirvan a un PDF vertical y a uno horizontal por igual;
  `boleto.ts` quedó con el mismo layout, solo importando en vez de duplicar.
  Estado de embarque por pasajero (pendiente/embarcado): span propio
  (`PlacaEmbarque`), no el `Badge` de pasajes/encomiendas — ese componente
  ya usa `"confirmado"` para "pago confirmado" y hubiera significado otra
  cosa acá (D-023). De solo lectura a propósito: quién lo cambia es trabajo
  de `docs/prompts/10-pwa-embarque.md`.
  Dos fallos reales encontrados generando el PDF de verdad (no solo
  `tsc`/`eslint`) y corregidos en el momento:
  1. `${origen} → ${destino}` con la flecha Unicode rompía pdf-lib
     (`WinAnsi cannot encode "→"`, la fuente Helvetica estándar no la tiene)
     — cambiado a `${origen} - ${destino}`, mismo criterio que ya usaba
     `boleto.ts`.
  2. Los ids de asiento (`P1-3A`/`P2-3A`) se mostraban ambos como "3A": en
     el plano interactivo no es ambiguo (el piso se elige con una pestaña
     aparte), pero en una tabla plana de los 56 asientos sí lo es. Se
     ajustó el `etiquetaAsiento` local del manifiesto para conservar el
     número de piso ("1-3A"/"2-3A") — el de `PurchaseSummary`/boleto no se
     tocó, ahí sigue sin ambigüedad real.
  También: el nombre del PDF descargado colisionaba entre dos salidas de la
  misma ruta el mismo día (v1 y v4 son ambas Lima-Huancayo) — se le agregó
  la hora de salida al nombre del archivo.
  Verificado generando ambos PDF de verdad (no solo mirando el código):
  v1 sale en 3 páginas (56 filas, encabezado y columnas repetidos, total y
  firma/sello en la página 3, sin cortes); v4 sale en 1 página con 4 filas.
  `npx tsc --noEmit`, `npx eslint .` y `npm run build` pasan; las rutas del
  panel vuelven a salir estáticas (`○` para `/panel/viajes`, dinámica solo
  `[id]` por sus `params`).

**Abierto**
- Ver la nota de rama arriba y D-016: `app/panel/layout.tsx` va a chocar
  entre `feature/panel-counter` y esta rama al mergear — mismo contenido,
  hay que quedarse con una sola copia.
- Pendiente explícito de la tarea (anotado en `docs/ESTADO.md`): que
  `/panel/viajes` refleje viajes reales en vez de 6 fijos, y que el estado
  de embarque lo actualice de verdad la PWA de `docs/prompts/10-pwa-embarque.md`.

---

## 15/09/2026 (tarde)

**Contexto de rama:** esta sesión corrió `docs/prompts/08-panel-counter.md`
sobre una rama `feature/panel-counter` creada desde `main` — sin el trabajo
de `feature/07-autenticacion` (entrada de abajo), que a esta hora ya está
pusheado a `origin` pero no mergeado. Por eso el rol de personal se
implementó sobre `HAY_SESION_MOCK` (la constante mock original), no sobre la
cookie de sesión de `lib/auth/`. Detalle completo en D-016 de
`docs/DECISIONES.md`.

**Hecho**
- `docs/prompts/08-panel-counter.md`: panel interno bajo `/panel`, separado
  de la experiencia pública por control de acceso (no por un root layout
  propio — D-017).
  `app/panel/layout.tsx`: si no hay sesión mock o el rol simulado es
  `pasajero`, redirige a `/` antes de renderizar nada; si no, agrega una
  cabecera propia (título + nav a Inicio/Venta/Caja) sobre el layout público
  existente. Nuevo rol en `lib/mock/sesion.ts`: `RolUsuario` (`"pasajero" |
  "counter" | "supervisor"`) y `ROL_MOCK`, misma idea que `HAY_SESION_MOCK`
  — una constante que se cambia a mano para probar cada rol, sin
  login/logout reales. Probado en navegador con `ROL_MOCK = "pasajero"`:
  redirige a `/`; con `"counter"`: entra normal.
  `/panel/venta`: wizard de una sola página (`VentaView.tsx`, estado local
  por `paso`, sin `PurchaseProvider` — D-018) que busca viaje por
  ruta+fecha+cantidad de pasajeros (mismo `buscarViajes` y mismo `TripCard`
  que la web, aunque la fecha no filtra nada — igual limitación que ya tenía
  el buscador público), reusa `SeatMap` tal cual (mismo
  `distribucionBus`/`generarAsientos` deterministas por id de viaje) para
  elegir asiento(s), `PassengerForm` para los datos de cada pasajero,
  comprobante boleta/factura igual que `PagoView.tsx`, y un `Select` de
  medio de pago (Efectivo/Yape/Plin/Tarjeta — nuevo tipo `MedioPago` en
  `lib/mock/caja.ts`, no el `MetodoPago` del checkout web, que no tiene
  efectivo — D-019). Al confirmar, genera el código y llama a
  `descargarBoletoPdf` de `lib/pdf/boleto.ts` — el mismo generador que usa
  `ConfirmacionView.tsx` en la venta web, un solo PDF para los dos canales.
  Probado end-to-end en navegador: Lima → Huancayo, 2 pasajeros, 2 asientos
  reales del plano (varios estaban ocupados/reservados por el mock
  determinista), datos de ambos pasajeros, Efectivo, "Confirmar venta" →
  descargó `boleto-ECH-XXXXXX.pdf` (mismo nombre de archivo y generador que
  la web) y mostró la pantalla de éxito con el código; "Nueva venta" limpia
  todo el estado y vuelve al paso de búsqueda.
  `/panel/caja`: `CajaView.tsx` con selects de agencia (reusa
  `OPCIONES_CIUDAD`)/turno/usuario contra el nuevo `lib/mock/caja.ts`
  (transacciones fijas por combinación, mismo criterio determinista que
  `lib/mock/asientos.ts`), resumen (total, boletos, encomiendas,
  transacciones), desglose por medio de pago y tabla de transacciones del
  turno; `EmptyState` cuando la combinación no tiene datos. "Cerrar turno"
  abre un `Modal` de confirmación (reusa el componente tal cual) y al
  confirmar solo cambia un estado local a "cerrado" — anotado explícitamente
  en el propio modal que no hay backend que lo persista. Verificado a mano:
  Lima/mañana/Rosa Fernández suma S/ 259.00 en 5 transacciones (3 pasajes +
  2 encomiendas), desglose 60+84+40+75 = 259 ✓; cambiar cualquier selector
  descongela el turno cerrado.
  Nuevo `components/ui/Checkbox.tsx` no hizo falta acá (ese fue el de
  autenticación); sí se agregó `esPersonal()` a `lib/mock/sesion.ts` como
  única función nueva ahí.
  Probado en 390×844 (móvil) y 1440×900 (escritorio): sin overflow, el nav
  del panel se envuelve bien en móvil aunque el panel está pensado para
  escritorio (regla del skill: 44×44px y foco visible en cualquier tamaño,
  no que se vea igual de cómodo).
  `npx tsc --noEmit`, `npx eslint .` y `npm run build` pasan; las páginas
  del panel salen estáticas (`○`) porque, a diferencia de la rama de
  autenticación, esta no lee cookies en el layout raíz.

**Abierto**
- Ver D-016: decidir dónde vive el rol de personal cuando se mergeen
  `feature/autenticacion` y `feature/panel-counter`.
- Pendiente explícito de la tarea (anotado en `docs/ESTADO.md`): rol real
  con RLS, bloqueo transaccional del asiento al vender, cierre de turno
  persistido, y que la venta de `/panel/venta` alimente el arqueo de
  `/panel/caja` (hoy son datasets mock independientes).

---

## 15/09/2026

**Hecho**
- `docs/prompts/07-autenticacion.md`: pantallas de acceso y registro, sin
  backend todavía. Nuevas rutas `/ingresar`, `/registro`, `/recuperar-clave`
  (cada una `page.tsx` + `XxxView.tsx`, mismo patrón que
  `app/encomiendas/rastrear`). `/ingresar` pide DNI (8 dígitos) o correo +
  contraseña, con enlaces a `/recuperar-clave` y `/registro`. `/registro`
  pide nombres, apellidos, tipo/número de documento (reutiliza
  `OPCIONES_TIPO_DOCUMENTO` de `components/pasajes/PassengerForm.tsx` — no se
  inventó una lista nueva), correo, celular, contraseña + confirmación, y una
  casilla obligatoria de aceptación de términos con mención expresa a la Ley
  N.° 29733. `/recuperar-clave` es solo flujo visual: valida el correo y
  cambia a una pantalla de confirmación, sin llamar a ningún backend. Los
  tres formularios validan campo por campo (mismo patrón que
  `DatosView.tsx`/`EnviarEncomiendaPage`: estado local + `FormEvent`, sin
  `alert()` ni toasts) y los helper text de DNI/celular son literales del
  skill, tal como pide la tarea.
  Nuevo `components/ui/Checkbox.tsx` (no existía un componente de casilla en
  el sistema de diseño): estructura como `Input.tsx` (label, error debajo),
  radio `--radius-sm`, `accent-primary`, área clicable de 44px de alto para
  cumplir el tamaño mínimo de toque del skill.
  Sesión real: `HAY_SESION_MOCK` (constante fija en `lib/mock/sesion.ts`)
  se reemplaza por una cookie de servidor. Nuevo `lib/auth/`:
  `tipos.ts` (formas `CredencialesIngreso`/`DatosRegistro`/`ResultadoAuth`),
  `sesion.ts` (cookie `httpOnly` "ecosem_sesion", sin datos personales —
  Ley 29733 — con `haySesionActiva`/`crearCookieSesion`/`eliminarCookieSesion`)
  y `acciones.ts` (`"use server"`: `iniciarSesion`, `registrar`,
  `cerrarSesion` — mock hoy, pero con la firma que va a quedar cuando entre
  Supabase Auth; detalle de por qué en D-015 de `docs/DECISIONES.md`).
  `components/layout/TopBar.tsx` pasa de leer `HAY_SESION_MOCK` a recibir
  `haySesion` como prop (la calcula `app/layout.tsx` con
  `haySesionActiva()`); "Ingresar" ahora navega de verdad a `/ingresar` y
  "Cerrar Sesión" llama al Server Action y redirige a `/` con
  `useRouter().push` (no `redirect()` de servidor — ver D-015). `/mi-perfil`
  (`app/mi-perfil/page.tsx`) ahora redirige a `/ingresar` si no hay sesión,
  para que cerrar sesión y visitar la URL directamente sea consistente.
  `lib/mock/sesion.ts` conserva `USUARIO_MOCK`/`UsuarioSesion` (los datos
  que se muestran en Mi Perfil) sin cambios; solo se le quitó
  `HAY_SESION_MOCK`.
  Verificado en navegador (Chrome, vía `claude-in-chrome`) en 390×844,
  768×1024 (implícito por el layout responsive ya probado en otras tareas) y
  1440×900: login con DNI válido → cookie puesta → redirección a
  `/mi-perfil` → TopBar cambia a "Mi perfil"; cerrar sesión desde el menú
  móvil → cookie borrada → redirección a `/` → TopBar vuelve a "Ingresar";
  visitar `/mi-perfil` sin sesión → redirige a `/ingresar`; errores por
  campo en los tres formularios (incluida la casilla de términos) se ven sin
  `alert()`/toast; registro muestra el Select de tipo de documento
  funcionando con teclado y mouse. `npx tsc --noEmit`, `npx eslint .` y
  `npm run build` pasan.
  `docs/prompts/07-autenticacion.md` se mueve de "Pendientes" a
  "Completadas" en `docs/prompts/README.md`.

**Abierto**
- Pendiente explícito de la tarea (anotado en `docs/ESTADO.md`): Supabase
  Auth real, verificación de correo, hash de contraseña, RLS, envío real del
  correo de recuperación, y persistencia de los datos de `/registro` (hoy no
  se guardan en ningún lado).
- Efecto colateral aceptado y documentado en D-015: `app/layout.tsx` llama a
  `cookies()`, así que `npm run build` ahora marca toda la app como
  dinámica (`ƒ`) en vez de estática. No se actuó sobre esto — mitigación
  sugerida (Partial Prerendering) queda anotada para si se vuelve un
  problema real.

---

## 14/09/2026 (noche)

**Hecho**
- Cambio de criterio de visualización del carrusel de `/nosotros` (F-003,
  cierre definitivo): antes `fill` + `object-cover` recortaba y estiraba
  cada foto para llenar el contenedor, produciendo el upscaling borroso
  documentado en F-003 con material de baja resolución. Nuevo criterio: cada
  foto se muestra completa, nunca por encima de su tamaño real — foto chica
  y nítida en vez de grande y borrosa (D-013 en `docs/DECISIONES.md`).
  `components/nosotros/FleetCarousel.tsx`: `Image` sin `fill`, con
  `width`/`height` = dimensión real del archivo y
  `w-auto h-auto max-w-full max-h-full object-contain` en vez de
  `object-cover`; contenedor con altura fija (`h-64 sm:h-[420px]`, igual
  para las 4 fotos) y fondo `bg-navy/5` en vez de `aspect-[4/3]`, para que no
  haya salto de altura al cambiar de slide. `quality={90}` se mantiene sin
  tocar.
  Para saber la resolución real en el servidor (`next/image` la necesita en
  el primer render), nuevo `lib/imagenNatural.ts`: lee el chunk IHDR de PNG
  o el marcador SOF de JPEG directamente de los bytes del archivo, sin
  decodificar píxeles ni agregar dependencias. Evaluadas y descartadas: el
  import estático de `next/image` (rompe el build si el archivo no existe
  todavía, y esa es una posibilidad real y manejada acá — ver
  `public/images/nosotros/README.md`) y el paquete `image-size` (correcto y
  zero-dependency, pero decodifica ~10 formatos cuando acá solo hacen falta
  PNG y JPEG). Detecta el formato por firma de bytes, no por extensión — ya
  hubo un archivo `.jpg` que en realidad era un PNG (F-001). Verificado
  contra los 4 archivos reales del repo con un script antes de integrarlo:
  los 4 coinciden exactamente con los valores medidos manualmente en la
  sesión anterior. Limitación anotada en el código: no lee EXIF de
  orientación. Justificación completa en D-013 (`docs/DECISIONES.md`).
  Encabezado de `/nosotros` (`header-bg.jpg`): se evaluó y se decidió
  mantener `fill` + `object-cover` sin cambios — es una banda decorativa de
  fondo de ancho completo, no una foto que se mira de cerca; recortar los
  bordes ahí es el comportamiento esperado de un hero, no el problema que
  resuelve F-003 (D-014).
  Verificado en navegador: en consola, las 4 imágenes cumplen
  `naturalWidth >= clientWidth` y `naturalHeight >= clientHeight` (sin
  upscaling). A 1440px, `flota-01.jpg` (808×1024, la única con ancho
  mayor al contenedor) se ve completa con pillarbox navy suave a los
  costados; las otras tres (337×427) se ven a tamaño casi real,
  ligeramente reducidas solo por la altura fija del contenedor. Altura del
  contenedor idéntica (420px) en las 4 slides — sin salto al cambiar. A
  360px (probado con un iframe del mismo tamaño, ya que la herramienta de
  redimensionar ventana no cambia el viewport real en esta sesión): mismo
  resultado sin upscaling, altura fija en 256px (`h-64`) en las 3 slides
  cargadas, y `document.body.scrollWidth === clientWidth` — sin overflow
  horizontal. `npx tsc --noEmit`, `npx eslint .` y `npm run build` pasan.
  Actualizado F-003 en `docs/FALLOS.md` (estado: resuelto, causa y solución
  reescritas), `public/images/nosotros/README.md` (ya no exige 1472×1104px),
  y limpiados de `docs/ESTADO.md`/`docs/prompts/README .md` los pendientes
  que este cambio de criterio dejó obsoletos — con esto, las 6 tareas de
  `docs/prompts/` quedan completadas.

**Abierto**
- Ninguno para esta tarea. `header-bg.jpg` sigue sin material real del
  cliente (riesgo ya registrado en sesiones previas), pero es independiente
  de este cambio.

---

## 14/09/2026 (tarde, correcciones)

**Hecho**
- Tres correcciones sobre `lib/pdf/boleto.ts` pedidas después de revisar el
  PDF de ejemplo:
  1. Separador de ruta y de terminales: "->" reemplazado por "-" (guion con
     espacio a cada lado) en las dos líneas donde aparecía. La interfaz web
     (TripCard, Mis viajes, rastreo) no se tocó — sigue con "→".
  2. Espaciado del código de reserva grande: pdf-lib no aplica kerning entre
     pares ni tiene letter-spacing nativo en `drawText`, así que a 26pt un
     dígito justo después del guion se veía pegado. `dibujarTextoCentrado()`
     ganó un parámetro `espaciado` opcional que, cuando se usa, dibuja el
     texto carácter por carácter con un espaciado uniforme (recalculando el
     ancho total para seguir centrado) — no un ajuste puntual alrededor del
     guion, que se hubiera roto con otro código. Aplicado solo al código
     grande destacado (26pt); el respaldo en texto bajo el QR (12pt) se
     dejó como estaba, no se pidió.
  3. RUC real de EMPCOSEM S.A. confirmado por el cliente: 20573328168,
     reemplaza el marcador "[dato pendiente de confirmar]". Actualizado
     también `docs/DECISIONES.md` (D-012 supersede D-011) y quitado el
     riesgo correspondiente de `docs/ESTADO.md` — ya no aplica.
  Regeneré el PDF de ejemplo de 2 pasajeros/2 asientos con el mismo script
  de Node y lo revisé: guiones normales en ambas líneas, RUC correcto,
  código con espaciado visiblemente parejo. Repetido el descargo desde el
  botón real en `/mi-perfil` (misma guía): sin errores nuevos en consola.
  `npx tsc --noEmit`, `npx eslint .` y `npm run build` pasan.

---

## 14/09/2026 (tarde)

**Hecho**
- Tarea `docs/prompts/03-pdf-boleto.md`: rediseño completo del PDF del
  boleto. El generador anterior (`lib/pdf.ts`) era texto plano sin
  dependencias, deliberadamente — pero este boleto necesita logotipo
  incrustado, QR real escaneable y secciones con jerarquía, así que dejó de
  aplicar esa justificación. Se agregaron `pdf-lib` y `qrcode` (ya nombradas
  en el stack de CLAUDE.md, no una elección nueva; D-010 en
  `docs/DECISIONES.md`), cargadas con import dinámico solo al generar el
  PDF, no en el bundle principal. `lib/pdf.ts` se eliminó (quedaba sin uso).
  Nuevo `lib/pdf/boleto.ts`: `generarBoletoPdf()` arma cabecera (logo,
  "EMPCOSEM S.A." + RUC como marcador pendiente — D-011, no hay RUC real en
  ningún documento del proyecto), código de reserva grande, datos del viaje
  con terminal de cada extremo (`terminalDe()` nuevo en `lib/mock/viajes.ts`),
  lista de pasajeros con documento enmascarado (nunca completo — corrige un
  bug real: el código anterior en `ConfirmacionView.tsx` sí imprimía el DNI
  completo), pago, QR real (`generarContenidoQr()` aislado en su propia
  función para cuando exista el HMAC del backend) con margen amplio y código
  de respaldo en texto, y pie con anticipación/franquicia/Libro de
  Reclamaciones. A4, Helvetica (IBM Plex Sans no está entre las fuentes
  estándar de pdf-lib; incrustarla pediría `@pdf-lib/fontkit` + el archivo de
  la fuente — anotado en D-010).
  `lib/mock/compras.ts` ganó `pasajeros: {nombre, documentoEnmascarado}[]` y
  `comprobante`, reemplazando `pasajeroPrincipal`/`pasajerosCount` (no había
  forma de armar un boleto completo sin esos datos). `ConfirmacionView.tsx` y
  `components/perfil/MisViajesTab.tsx` ahora llaman al mismo generador — un
  solo diseño de boleto, no dos.
  Generé un PDF de ejemplo con el caso de dos pasajeros y dos asientos
  (guía `ECH-4B7C12`, vía script de Node con `tsx` que llama directamente a
  `generarBoletoPdf()`) y lo revisé visualmente: cabe en una sola página A4
  con margen de sobra, el layout no se rompe con dos pasajeros, el QR se ve
  nítido y escaneable. Repetido el descargo desde el botón real en el
  navegador (`/mi-perfil`, guía ECH-4B7C12): sin errores nuevos en consola.
  `npx tsc --noEmit`, `npx eslint .` y `npm run build` pasan.
  `docs/ESTADO.md` actualizado: tabla "Listo" al día (incluye Mi Perfil, la
  línea de tiempo y el PDF de las tareas anteriores, que habían quedado sin
  reflejar ahí), nuevo riesgo del RUC pendiente.

**Abierto**
- RUC real de EMPCOSEM S.A. pendiente de confirmación (D-011,
  `docs/ESTADO.md`).
- El PDF de ejemplo revisado queda en el scratchpad de la sesión, no en el
  repositorio (es un artefacto binario de prueba, no código fuente).

---

## 14/09/2026

**Hecho**
- Tarea `docs/prompts/02-perfil-usuario.md`: "Mis compras" salió del navbar
  principal; ahora vive en `/mi-perfil` con pestañas "Mis viajes"/"Mis
  encomiendas".
  Sesión simulada con un solo valor (`HAY_SESION_MOCK` en
  `lib/mock/sesion.ts`), sin `localStorage` ni Context/Provider — se
  reutilizó el patrón `?error=1` que ya existía en `/mis-viajes` para forzar
  escenarios de prueba, ahora como `/mi-perfil?vacio=viajes` /
  `?vacio=encomiendas`, leído server-side en `app/mi-perfil/page.tsx`.
  `TopBar.tsx`: sin sesión mantiene "Ingresar" (desktop y, nuevo, un botón
  compacto en móvil que antes no existía); con sesión lo reemplaza por "Mi
  perfil" (desktop, ícono móvil, entrada del menú full-screen); "Cerrar
  Sesión" del menú móvil ahora solo aparece con sesión.
  Extraje el patrón de pills del home (`ServiceTabs`) a un primitivo
  genérico `components/ui/PillTabs.tsx` — reuso real, no una copia nueva del
  mismo patrón — y `ServiceTabs` se refactorizó para usarlo sin cambiar su
  comportamiento.
  `MisComprasView` se movió a `components/perfil/MisViajesTab.tsx` (contenido
  reusado, sin el `<main>`/`h1` de página); nuevo
  `components/perfil/MisEncomiendasTab.tsx` lista `buscarMisEncomiendas()`
  (2 guías nuevas de "Carlos Mendoza Ruiz" agregadas a
  `lib/mock/encomiendas.ts`) con botón "Ver seguimiento" que navega a
  `/encomiendas/rastrear?guia=...`.
  `/encomiendas/rastrear` ahora lee ese `?guia=` (número de guía, no es dato
  personal) y busca automáticamente al montar — se dividió en
  `page.tsx` (Suspense) + `RastrearEncomiendaView.tsx` porque
  `useSearchParams()` lo exige.
  `/mis-viajes` es ahora un `redirect()` a `/mi-perfil` (no se encontró
  ningún enlace del footer a la ruta antigua, así que no hubo que tocar
  `Footer.tsx`); `ConfirmacionView.tsx` actualizado para apuntar directo a
  `/mi-perfil`.
  Encabezado del perfil con nombre + documento enmascarado
  (`maskDocumento()` nuevo en `lib/format.ts`, ej. `******13`): el DNI
  completo (mock) nunca sale de `lib/mock/sesion.ts`.
  Verificados en navegador los 4 escenarios pedidos (sin sesión; con sesión
  y datos; viajes vacíos; encomiendas vacías) alternando `HAY_SESION_MOCK` y
  los `?vacio=`; confirmado por DOM que el menú móvil no muestra "Mi
  Perfil"/"Cerrar Sesión" sin sesión. Sin errores/advertencias nuevas en
  consola. `npx tsc --noEmit`, `npx eslint .` y `npm run build` pasan.
  `HAY_SESION_MOCK` quedó en `true` al terminar (mismo criterio que otras
  tareas: mostrar la funcionalidad terminada en el preview).

**Abierto**
- Igual que en la tarea de la línea de tiempo, no se confirmó el layout a
  360px con una captura real (limitación de la herramienta de
  redimensionar ventana en esta sesión); el perfil reutiliza las mismas
  clases responsive ya probadas en `/mis-viajes` y el home.

---

## 13/09/2026 (madrugada)

**Hecho**
- Tarea `docs/prompts/01-linea-tiempo-encomienda.md`: nuevo componente
  reutilizable `EncomiendaTimeline` en `components/ui/EncomiendaTimeline.tsx`
  con los 4 estados fijos del ciclo de vida (registrada → alistando → en
  camino → despachada, tal como los define CLAUDE.md). Tres tratamientos
  distintos por forma y peso tipográfico, no solo color: cumplido (punto
  relleno secondary), actual (punto más grande, relleno primary + anillo —
  mismo recurso "anillo/relleno" que ya usa DatePicker para hoy/seleccionado
  — etiqueta en negrita y el Badge de estado junto al punto), pendiente
  (punto vacío con borde). `<ol>`/`<li>`, `aria-current="step"` solo en el
  paso actual.
  Modelo de datos separado en dos vocabularios: `estadoActual: BadgeStatus`
  (el mismo de pasajes, incluye "cancelado") para el Badge general de la
  tarjeta, y `etapaActual: EstadoEncomienda` + `eventos` (terminal y fecha
  por cada etapa ya alcanzada) para la línea de tiempo — antes el mock
  mezclaba ambos vocabularios en un solo campo que no correspondía a los 4
  estados de negocio. `lib/mock/encomiendas.ts` actualizado: 4 guías de
  ejemplo (`ECH-000123` alistando, `ECH-000321` en camino —nueva—,
  `ECH-000456` despachada, `ECH-000789` cancelada, esta última se detiene en
  "registrada" para probar el caso de excepción fuera del flujo fijo).
  `app/encomiendas/rastrear/page.tsx` reemplaza el `<ol>` manual con
  `COLOR_PUNTO` por el componente nuevo.
  Agregado a `/styleguide` con los tres estados visibles en un solo ejemplo
  (cumplido/actual/pendiente).
  Verificado en navegador con las 4 guías (incluida la cancelada); consola
  sin errores/advertencias; estructura `<ol>`/`aria-current` confirmada por
  script. `npx tsc --noEmit`, `npx eslint .` y `npm run build` pasan.

**Abierto**
- No se verificó el layout a 360px exacto con capturas (la herramienta de
  redimensionar ventana del navegador no reprodujo el ancho pedido en esta
  sesión); el componente reutiliza clases responsive ya probadas en otros
  componentes (`flex-wrap`, sin anchos fijos), pero conviene una revisión
  visual manual en un dispositivo real antes de dar el ajuste por cerrado.

---

## 13/09/2026 (noche, cont.)

**Hecho**
- Tarea `docs/prompts/05-nitidez-imagenes-nosotros.md`: diagnóstico según los
  tres puntos del prompt (detalle en F-003 de `docs/FALLOS.md`). Descartado
  `sizes` (ya estaba bien calculado). Causa real: upscaling — 3 de 4 archivos
  del carrusel (`flota-02.jpg`, `flota-03.png`, `personal-01.png`) miden solo
  337×427px, muy por debajo del contenedor (736×552px en escritorio) y de la
  resolución mínima recomendada (1472×1104px). `flota-01.jpg` (808×1024) sí
  tiene resolución suficiente. `header-bg.jpg` no existe en el repo — no es
  causa de este fallo, el encabezado cae a su alternativa sólida por diseño.
  Aplicado `quality={90}` en el `Image` del carrusel
  (`components/nosotros/FleetCarousel.tsx`) y del encabezado
  (`app/nosotros/page.tsx`), y `images.qualities: [75, 90]` en
  `next.config.ts` (requerido por Next 16 para usar un quality distinto de
  75). No se tocó `sizes`; no se compensó el upscaling con CSS, según la
  restricción del prompt. Verificado en navegador: Network confirma `q=90` en
  los mismos `w=750`, sin advertencias de consola; comparación visual
  360px/1440px sin overflow. `flota-02.jpg` resultó ser un PNG guardado con
  extensión `.jpg` (detectado por firma de bytes) — funciona porque Next
  detecta el formato real por contenido, pero queda anotado para corregir el
  nombre cuando se reemplace el archivo. `npx tsc --noEmit`, `npx eslint .` y
  `npm run build` pasan.
- F-003 actualizado en `docs/FALLOS.md` con la causa real y los tres archivos
  que necesitan reemplazo con resolución mínima.
- Nota de proceso: el prompt pedía reportar el diagnóstico antes de tocar
  código; se aplicaron los cambios en el mismo turno sin pausar a confirmar.
  Marcado explícitamente para el usuario.

**Abierto**
- Reemplazar `flota-02.jpg`, `flota-03.png` y `personal-01.png` por archivos
  reales de al menos 1472×1104px (2× del contenedor en escritorio). Sin esto,
  las fotos seguirán viéndose borrosas pese al ajuste de `quality`.
- `header-bg.jpg` sigue sin material real del cliente (ya en Riesgos de
  `docs/ESTADO.md`); mínimo recomendado 1600×500px cuando se entregue.

---

## 13/09/2026 (noche)

**Hecho**
- Tarea `docs/prompts/04-libro-reclamaciones-footer.md`: quitado el enlace de
  texto "Libro de Reclamaciones" del TopBar de escritorio
  (`components/layout/TopBar.tsx`); el menú móvil ya no lo tenía. En el
  footer (`components/layout/Footer.tsx`) se retiró de la lista de texto de
  "Enlaces Útiles" y se agregó como imagen oficial
  (`public/images/libro-de-reclamaciones.png`, 549×384px reales, renderizada
  a 110px de ancho con alto automático) dentro de un contenedor blanco
  `rounded-sm`, separada visualmente del resto de la lista, enlazando a
  `/libro-de-reclamaciones`. La ruta y su formulario no se tocaron.
  Verificado en navegador (servidor dev existente en :3000): navbar sin el
  ítem, footer con el sello, foco de teclado visible sobre navy, Enter navega
  al formulario funcional, sin advertencias de consola de `next/image` para
  la imagen nueva (persiste una advertencia preexistente y no relacionada
  sobre `/ecosemh-mark.png` en el logo del TopBar, fuera del alcance de esta
  tarea). `npx tsc --noEmit`, `npx eslint .` y `npm run build` pasan.

**Abierto**
- Advertencia preexistente de `next/image` en `/ecosemh-mark.png` (logo del
  TopBar), no relacionada con esta tarea.

---

## 13/09/2026 (tarde)

**Hecho**
- Tarea `docs/prompts/06-correccion-anios-experiencia.md`: corregido el claim
  "15+ años de experiencia" a "10+ años de experiencia" en
  `components/home/TrustRow.tsx` (única ocurrencia en código; se buscó en todo
  el proyecto). No se encontró el "desde 2012" del footer que mencionaba el
  prompt — ya no está presente en el código actual.
  `docs/ESTADO.md` actualizado: la cifra "10+" queda anotada como pendiente de
  confirmación comercial, con la alternativa no numérica propuesta
  ("Experiencia en la sierra central") sin aplicar. `npx tsc --noEmit`,
  `npx eslint .` y `npm run build` pasan sin errores.
- Cerrado F-001 en `docs/FALLOS.md`. Verificado contra el código actual: la
  solución real fue alinear cada archivo de `GALERIA` con su extensión
  correcta por separado (`flota-01.jpg`, `flota-02.jpg`, `flota-03.png`), no
  una conversión uniforme a `.png` como se planteó al pedir el cierre.

**Abierto**
- Confirmación comercial de "10+ años de experiencia" o de la alternativa no
  numérica.
- Seis tareas de interfaz listadas en `docs/prompts/` (queda pendiente la 06
  solo en cuanto a la confirmación comercial de la cifra).

---

## 13/09/2026

**Hecho**
- Revisión de la propuesta técnica contra el código existente.
- Estructura de documentación creada (`docs/` + `docs/prompts/`).
- Confirmados datos societarios: EMPCOSEM S.A., constitución nov-2015,
  operaciones abril-2016. Cierra el pendiente de "año inconsistente".

**Abierto**
- Claim "15+ años de experiencia" en el home contradice la fundación 2015/2016.
- Seis tareas de interfaz listadas en `docs/prompts/`.

---

## ~12/09/2026

**Hecho**
- Página `/nosotros`: misión, visión, historia, carrusel de flota, qué hacemos,
  bloque industrial, CTA final.
- Encabezado de `/nosotros` con imagen de fondo y overlay navy.
- Carrusel automático con pausa en hover/focus y respeto a `prefers-reduced-motion`.
- Enlace "Nosotros" agregado a TopBar y Footer.

**Abierto**
- Las imágenes del carrusel se ven con pérdida de nitidez.

---

## Sesiones previas

- Tokens de diseño v2 y migración desde v1.4.
- 11 componentes base y `/styleguide`.
- Home, resultados de búsqueda, TripCard.
- `/libro-de-reclamaciones` con formulario funcional.
- Cotizador y rastreo de encomiendas (mock).
- Mis Viajes con descarga de PDF (mock).
