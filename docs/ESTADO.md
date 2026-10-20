# Estado del proyecto

Última actualización: 15/09/2026 (noche, cont. 4)

## Resumen

Frontend con datos mock. Sin backend, sin pasarela, sin facturación.
Fase actual según el plan de la propuesta técnica: **pre-Fase 1** (maquetado).

## Listo

| Área | Detalle |
|---|---|
| Tokens de diseño | Colores v2, radios (sm/md/pill), sombras navy, espaciado, IBM Plex Sans |
| Componentes base | Button, Input, Select, DatePicker, Badge, Card, Modal, Toast, Skeleton, Stepper, EmptyState, PillTabs, EncomiendaTimeline |
| Layout | TopBar con menú móvil full-screen y navegación agrupada por rol (sitio público vs. herramientas internas, separadas visualmente): menú desplegable "Panel" en escritorio (`components/layout/PanelMenu.tsx`), sección "Panel interno" en el menú móvil. Selector de rol solo-desarrollo (`components/layout/SelectorRolDemo.tsx`, D-040/D-041) para alternar sin sesión/pasajero/counter/supervisor sin editar código. Footer institucional con imagen oficial del Libro de Reclamaciones |
| Home | Hero con imagen, buscador, trust row, tabs Pasajes/Encomiendas, rutas populares, promo encomiendas |
| Resultados | Filtros, estados de carga / vacío / error, TripCard con variante seleccionada |
| Nosotros | Misión, visión, historia, carrusel de flota, qué hacemos, bloque industrial, CTA |
| Encomiendas | Cotizador (`/encomiendas/enviar`) que lee el tarifario configurado en `/panel/tarifario` — desglose de peso real/volumétrico, rango aplicado y recargo por valor declarado, o aviso de "consulta la tarifa en counter" si la ruta no tiene tarifa definida — y rastreo por guía con línea de tiempo de 4 estados |
| Mi Perfil | `/mi-perfil` con pestañas Mis viajes / Mis encomiendas (antes "Mis compras" suelto en el navbar) |
| Autenticación | `/ingresar`, `/registro`, `/recuperar-clave` (solo flujo visual). Sesión real vía cookie de servidor (`lib/auth/`), ya no `HAY_SESION_MOCK`; `/mi-perfil` redirige a `/ingresar` sin sesión |
| Boleto en PDF | Rediseñado: logo, código destacado, QR con identificador firmado (HMAC — ver `lib/firma.ts`, D-025) y escaneable, datos enmascarados (`lib/pdf/boleto.ts`) |
| Libro de Reclamaciones | Formulario funcional en `/libro-de-reclamaciones`, enlazado solo desde el footer |
| Panel de counter | `/panel` (índice), `/panel/venta` (venta presencial: busca viaje, elige asiento con `SeatMap`, cobra y genera el mismo boleto en PDF que la web) y `/panel/caja` (arqueo por agencia/turno/usuario, desglose por medio de pago, cerrar turno). Acceso restringido a rol `counter`/`supervisor`, guardado en cookie de servidor (`lib/auth/sesion.ts` → `obtenerRolDemo()`, D-040) |
| Manifiesto SUTRAN | `/panel/viajes` (listado del día, filtros fecha/ruta/agencia) y `/panel/viajes/[id]` (detalle: unidad, conductor(es), pasajeros con documento completo y estado de embarque, botón "Generar manifiesto"). PDF paginado en `lib/pdf/manifiesto.ts`, A4 horizontal, mismos helpers que el boleto (`lib/pdf/comun.ts`) |
| PWA de embarque | `/embarque` (elige viaje y descarga el manifiesto a IndexedDB) y `/embarque/[viajeId]` (escaneo por cámara vía `BarcodeDetector` nativo + entrada manual de respaldo, validación 100% local/offline, contador embarcados/total, sincronización simulada al reconectar). Instalable: `public/manifest.webmanifest` + `public/embarque-sw.js` (service worker a mano, sin `next-pwa`). Sin el TopBar/Footer público (`ShellPublico`, D-026) |
| Motor de precios | `/panel/precios`, solo supervisor (D-029): tarifas por ruta (tope máximo obligatorio para guardar), factores de ocupación/anticipación/temporada editables, simulador con desglose factor por factor y aviso cuando el precio se ajusta a un tope, historial de cambios (usuario, fecha, valor anterior/nuevo). Reglas explícitas, nada hardcodeado en el componente (D-003, D-030) |
| Alertas de flota | `/panel/flota` (listado con indicador de alertas), `/panel/flota/[placa]` (documentos con vencimiento, umbral de kilometraje editable, histórico), `/panel/conductores` (licencia, vencimiento, horas de conducción, límite editable) y `/panel/alertas` (bandeja por urgencia, "Marcar como atendida" con responsable y nota). Solo supervisor (mismo patrón que D-029). Escalonamiento 30/15/7 días + vencido, solo tokens semánticos del skill (D-031, D-032) |
| Tarifario y equipaje | `/panel/tarifario`, solo supervisor: rangos de peso por ruta para encomiendas (vacíos hasta que comercial los defina, sin montos inventados — D-033), escalones de exceso de equipaje (21–30 y 31–50 kg, límites fijos del prompt, recargo pendiente) y recargo por valor declarado (%, pendiente). El cotizador de `/encomiendas/enviar` y el paso de datos del pasajero (`/pasajes/comprar/datos`) leen esta misma configuración en memoria (`lib/mock/tarifarioStore.ts`) |
| Ayuda y legal | `/ayuda`: FAQ agrupadas (pasajes, encomiendas, equipaje, pagos, cuenta) en acordeón accesible (`components/ui/Accordion.tsx`, `aria-expanded`/`aria-controls`), enlace al Libro de Reclamaciones. `/terminos`: las 11 Condiciones Generales del Contrato de Viaje ya son texto real de la empresa, incorporado literal (D-038); el resto de la página y toda `/privacidad` siguen siendo solo estructura con marcador "pendiente de redacción legal" (D-036). Enlazadas desde el footer y desde la casilla de aceptación de `/registro` |
| Navegación por rol | Las 10 rutas de `/panel/*` y `/embarque` ahora son alcanzables navegando, no solo por URL directa: grupo "Panel" agrupado y separado del sitio público (ver fila Layout), auditadas todas sus guardias de acceso (ninguna faltaba). Rol simulado movido de constante de código a cookie de servidor (D-040), con selector visible solo en desarrollo — confirmado ausente en `npm run build`/`npm run start` reales (D-041) |

## Pendiente — flujo de compra

- Selección de asientos (mapa de bus dos pisos, temporizador de reserva)
- Formulario de datos del pasajero
- Pago (Yape / Plin / tarjeta, boleta o factura)
- Confirmación con QR y descarga de boleto

## Pendiente — ajustes de interfaz (ver `docs/prompts/`)

Ninguno — las 16 tareas de `docs/prompts/` están completadas y al día
(detalle en `docs/BITACORA.md`); queda pendiente la 17 (QA integral, ver
`docs/prompts/README.md`).

## Pendiente — backend

Todo: Supabase, RLS, migraciones, pasarela, webhook idempotente, OSE/PSE,
generación de QR firmado, PWA de embarque.

Específico de autenticación (`docs/prompts/07-autenticacion.md`): Supabase
Auth real, verificación de correo, hash de contraseña, envío real del correo
de `/recuperar-clave`, y persistencia de los datos de `/registro` (hoy no se
guardan en ningún lado — solo activan la cookie de sesión mock).

Específico del panel de counter (`docs/prompts/08-panel-counter.md`): rol
real por usuario con RLS (hoy es una cookie mock, no una constante de
código desde D-040, pero sigue sin ser una barrera de seguridad real — ver
D-016 y D-040 en `docs/DECISIONES.md`), bloqueo transaccional del asiento
al vender, cierre de turno persistido, y que la venta hecha en
`/panel/venta` alimente el arqueo de `/panel/caja` (hoy son dos datasets
mock sin relación entre sí).

Específico del manifiesto (`docs/prompts/09-manifiesto-sutran.md`): que
`/panel/viajes` refleje viajes reales (hoy son 6 salidas fijas en
`lib/mock/manifiesto.ts`, no conectadas a una venta real de `/panel/venta`
ni a `lib/mock/compras.ts`).

Específico de embarque (`docs/prompts/10-pwa-embarque.md`): clave real de
firma del lado del servidor — nunca en el bundle del cliente (pendiente
crítico explícito, ver `lib/firma.ts` y D-025); endpoint real de
sincronización (`lib/embarque/sync.ts` simula el envío); rol "embarque"
real si en algún momento deja de bastar con `esPersonal` (D-016); lista de
precache del service worker generada en build en vez de solo cachear sobre
la marcha (D-028); que los escaneos de `/embarque` retroalimenten el
estado de embarque que hoy `/panel/viajes/[id]` solo lee de
`lib/mock/manifiesto.ts` — son dos fuentes de datos independientes
mientras no exista backend.

Específico del motor de precios (`docs/prompts/11-motor-precios.md`),
todo explícitamente fuera de alcance del prompt: persistencia real de
tarifas/factores (hoy en memoria, se pierde al recargar), cálculo
server-side aplicado de verdad en el checkout (`/panel/precios` es un
panel de configuración + simulador, no está conectado a
`lib/mock/viajes.ts` ni al checkout todavía), auditoría en base de datos
(el historial de cambios hoy también vive solo en memoria), y los valores
semilla de anticipación/temporada — placeholder hasta que comercial los
defina (D-030).

Específico de alertas de flota (`docs/prompts/12-alertas-flota.md`): las
alertas hoy se recalculan en cada render a partir del estado mock
(`generarAlertasActivas()`), no las emite un job programado que las deje
fijas en el tiempo; "responsable notificado" (texto del prompt) no dispara
ninguna notificación real todavía (WhatsApp/correo son pendientes de
CLAUDE.md); y todo lo editable en sesión (umbral de kilometraje, límite de
horas, atención de alertas) se pierde al recargar, igual que en el motor de
precios.

Específico del tarifario (`docs/prompts/13-tarifario-encomiendas.md`): el
tarifario configurado en `/panel/tarifario` vive en un módulo en memoria
(`lib/mock/tarifarioStore.ts`, un singleton con `useSyncExternalStore`, no
una base de datos) que se pierde al recargar la página — sobrevive a la
navegación entre rutas de Next.js mientras dure la pestaña, nada más. La
declaración de equipaje en `/pasajes/comprar/datos` es solo informativa
(muestra el escalón que aplicaría) y no se suma al total del pasaje ni al
boleto, porque el monto de cada escalón todavía no está definido. Ver el
requisito operativo de balanza digital en Riesgos abiertos.

Específico de ayuda y legal (`docs/prompts/14-ayuda-faq.md`, actualizado
por `docs/prompts/15-condiciones-contratacion.md`): `/privacidad` y la
mayor parte de `/terminos` (7 de sus 9 secciones) siguen siendo solo
estructura (encabezados + marcador de pendiente), nunca texto legal —
publicarlas de verdad requiere que el área legal redacte y apruebe cada
sección primero (ver Riesgos abiertos). Las respuestas de `/ayuda` que
siguen sin política definida (qué pasa si se pierde el bus, cancelaciones,
reembolsos, qué se puede enviar como encomienda, qué documento pide el
destinatario) remiten a counter en vez de inventar una regla; si el área
comercial las define, hay que volver a `app/ayuda/preguntasFrecuentes.tsx`
y actualizar esas respuestas.

Específico de condiciones de contratación (`docs/prompts/15-condiciones-contratacion.md`):
la lectura de "postergación por 15 días hábiles" como ventana de la nueva
fecha (no como plazo para solicitarla) es una interpretación razonada, no
un hecho confirmado por la empresa — ver D-039. **Vacío funcional
detectado, sin resolver en esta tarea:** el punto 5 de las Condiciones
("todo niño mayor o igual de 5 años tiene la obligación de pagar su
pasaje") implica que el conteo de pasajeros de la compra debería distinguir
adultos de niños desde los 5 años — hoy `PurchaseProvider`/`AsientosView`
tratan a todo pasajero igual, un asiento = un pasaje al precio de adulto,
sin ningún campo de edad. Corregirlo implica tocar el flujo de compra
completo (selección de pasajeros, precio, boleto), fuera del alcance de
esta tarea.

Específico de navegación por rol (`docs/prompts/16-navbar-por-rol.md`): el
selector de rol dev-only nunca se renderiza ni se carga en producción
(confirmado con `npm run build` + `npm run start` reales), pero su chunk
de JS sigue quedando como archivo en `.next/` porque `app/layout.tsx` lo
importa de forma estática — ver la limitación aceptada en D-041. Eliminar
también el archivo exigiría separar `/embarque` a su propio root layout
(la misma reestructuración de alto riesgo que ya evaluaron y descartaron
D-017/D-026) o tooling de build a medida; no se justifica para una ayuda
de QA sin datos sensibles.

## Riesgos abiertos

| Riesgo | Acción |
|---|---|
| Claim "10+ años de experiencia" (corregido de "15+") aún no confirmado por el área comercial | Confirmar redacción exacta con comercial. Alternativa no numérica propuesta: "Experiencia en la sierra central" — no aplicar sin aprobación |
| App móvil previa en Google Play con inventario propio | Definir integración o reemplazo antes del inventario real |
| Tarifas de equipaje y encomiendas: ni montos ni rangos están definidos todavía (`/panel/tarifario` arranca vacío a propósito, D-033) | Área comercial debe definir rangos de peso, precios y recargos antes de que el cotizador pueda dar un total real |
| El tarifario depende de que haya balanza digital en cada counter (docs/prompts/13-tarifario-encomiendas.md): sin peso real confiable en el mostrador, cobrar por rango de peso no tiene sentido | Confirmar con operaciones que cada agencia tenga balanza digital antes de habilitar el tarifario en producción |
| Factores del motor de precios (anticipación, temporada) son placeholder — `docs/INFORME-AVANCE.md` ya los lista como definición pendiente del cliente | Área comercial debe aprobar los factores reales antes de conectar `/panel/precios` al checkout |
| Foto de flota en hero | Pendiente material real del cliente |
| Ícono de la PWA de embarque (`public/manifest.webmanifest`) reusa `icon.png`, que no es cuadrado (793×695) | Pedir al diseño un ícono cuadrado (192×192 y 512×512 mínimo) cuando exista |
| Contratos vigentes con agregadores | Revisar exclusividades antes de reducir cupos |
| `/privacidad` completa y 7 de las 9 secciones de `/terminos` (docs/prompts/14-ayuda-faq.md) solo tienen estructura — ningún texto legal fue redactado. Las Condiciones Generales del Contrato de Viaje sí son texto real (docs/prompts/15-condiciones-contratacion.md, D-038) | Requiere revisión y redacción del área legal para el resto antes de publicar el sitio; no habilitar esas secciones como definitivas hasta entonces |
| Las respuestas de `/ayuda` sobre pérdida del bus, cancelaciones, reembolsos, qué se puede enviar como encomienda y qué documento pide el destinatario remiten a counter porque nadie definió esas políticas todavía | Área comercial/operaciones debe definir esas políticas; luego actualizar `app/ayuda/preguntasFrecuentes.tsx` |
| Interpretación de "postergación por 15 días hábiles" (D-039) no confirmada directamente por la empresa — es la lectura más razonable del texto, no un hecho verificado | Confirmar con la empresa antes de que esta interpretación respalde una disputa real con un pasajero |
| El sistema de compra no distingue pasajeros adultos de niños desde 5 años (vacío funcional detectado en docs/prompts/15-condiciones-contratacion.md, punto 5 de las Condiciones) | Definir con el cliente si se requiere una tarifa o conteo diferenciado por edad antes de tocar el flujo de compra |
