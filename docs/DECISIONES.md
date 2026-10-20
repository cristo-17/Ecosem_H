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

## D-010 · PDF del boleto con pdf-lib + qrcode, Helvetica en vez de IBM Plex Sans
**Fecha:** septiembre 2026 · **Estado:** vigente · **Supersede:** generador de
PDF sin dependencias de `lib/pdf.ts` (texto plano, sin QR ni imágenes)
El boleto rediseñado (docs/prompts/03-pdf-boleto.md) necesita logotipo
incrustado, un QR real y escaneable, y un layout de secciones — ya no es "un
PDF de una página con texto plano" que justificaba evitar una librería. Se
usan `pdf-lib` y `qrcode`, exactamente las que ya nombraba el stack de
CLAUDE.md, en vez de hand-rollear un encoder de QR (reimplementar Reed-Solomon
no se justifica). Ambas se cargan solo al generar el PDF (import dinámico
dentro de la función), no en el bundle principal.
IBM Plex Sans no está entre las 14 fuentes estándar de pdf-lib; incrustarla
pediría `@pdf-lib/fontkit` más el archivo de la fuente. Se usa Helvetica
(alternativa sans legible, autorizada por el prompt) hasta que se justifique
esa dependencia adicional.

## D-011 · RUC de EMPCOSEM S.A. como marcador pendiente en el boleto
**Fecha:** septiembre 2026 · **Estado:** superada por D-012
Ningún documento del proyecto tenía el RUC real de la empresa. CLAUDE.md
prohíbe inventar datos societarios, así que el PDF del boleto mostraba
"RUC: [dato pendiente de confirmar]" en vez de un número inventado.

## D-012 · RUC real de EMPCOSEM S.A. confirmado
**Fecha:** septiembre 2026 · **Estado:** vigente · **Supersede:** D-011
RUC 20573328168, confirmado directamente por el cliente. El PDF del boleto
(`lib/pdf/boleto.ts`) ya lo muestra en la cabecera en vez del marcador
pendiente.

## D-013 · Carrusel de /nosotros: nunca escalar por encima de la resolución nativa
**Fecha:** septiembre 2026 · **Estado:** vigente · **Supersede:** el criterio
de recorte de F-003 (docs/FALLOS.md)
`fill` + `object-cover` recorta y estira cualquier foto hasta llenar el
contenedor, sin importar su resolución real — con material de baja
resolución (como el actual, 337-808px de ancho) eso produce el upscaling
borroso de F-003. Nuevo criterio: cada foto se ve completa, nunca por
encima de su tamaño real, reducida solo si es más grande que el
contenedor. Prioriza nitidez sobre tamaño uniforme — una foto chica y
nítida es preferible a una grande y borrosa.
Implementación (`components/nosotros/FleetCarousel.tsx`): `next/image` sin
`fill`, con `width`/`height` = dimensión real del archivo, y
`w-auto h-auto max-w-full max-h-full object-contain` en vez de
`object-cover`. `width`/`height` fijan el techo nativo; el navegador solo
puede reducir para caber en el contenedor, nunca agrandar. Esto exige saber
la resolución real de cada archivo **en el servidor**, ya que
`next/image` necesita `width`/`height` en el primer render (no se pueden
completar después en cliente sin causar un salto de layout).

Tres formas de obtener esa resolución en servidor, evaluadas:
- **Import estático de la imagen** (`import foto from ".../flota-01.jpg"`):
  Next la resuelve en build y expone width/height. Se descarta: estos
  archivos pueden no existir todavía (ver
  `public/images/nosotros/README.md`) y un import estático que apunta a un
  archivo ausente rompe el build entero, en vez de caer al placeholder que
  ya maneja `archivoExiste()`.
- **`image-size` (paquete dedicado)**: correcto y probado, cubre casos que
  un parser propio no cubre bien de entrada (JPEG progresivo, EXIF de
  orientación). Es zero-dependency, pero decodifica ~10 formatos de imagen
  cuando acá solo hace falta PNG y JPEG.
- **Leer las cabeceras del archivo a mano** (`node:fs` + parseo del chunk
  IHDR de PNG / marcador SOF de JPEG): la opción elegida. Cubre exactamente
  los dos formatos que usa este proyecto, sin agregar una dependencia, y
  detecta el formato por firma de bytes — no por extensión, relevante
  porque ya hubo un archivo `.jpg` que en realidad era un PNG (F-001). Se
  implementó en `lib/imagenNatural.ts` y se verificó contra los 4 archivos
  reales del repo antes de integrarla. Limitación aceptada y anotada en el
  código: no lee el tag EXIF de orientación — si algún archivo real viene
  rotado por metadata en vez de por los píxeles, esto habría que
  revisarlo entonces (o migrar a `image-size`, que sí lo maneja).

## D-014 · Encabezado de /nosotros: se queda con `fill` + `object-cover`
**Fecha:** septiembre 2026 · **Estado:** vigente
El criterio de D-013 (nunca escalar, mostrar completa) es para las fotos
de la galería — ahí el usuario mira el vehículo específico. El fondo del
encabezado (`header-bg.jpg`) es una banda decorativa de ancho completo
detrás de un overlay navy y el H1: se espera que cubra el ancho entero de
la sección sin importar la proporción del archivo, igual que cualquier
imagen de fondo tipo hero. Recortar los bordes ahí es el comportamiento
correcto, no el problema que resuelve F-003. Se mantiene sin cambios.

## D-015 · Sesión vía cookie de servidor, no una constante mock
**Fecha:** 15/09/2026 · **Estado:** vigente
`/ingresar`, `/registro` y "Cerrar sesión" reemplazan a la constante fija
`HAY_SESION_MOCK`. La sesión ahora vive en una cookie `httpOnly` puesta desde
Server Actions (`lib/auth/acciones.ts` → `lib/auth/sesion.ts`), nunca en
`localStorage` (regla de CLAUDE.md). La cookie solo guarda una marca
("activa"), nunca DNI/nombre/correo/celular (Ley 29733) — esos siguen
viniendo de `USUARIO_MOCK` hasta que exista Supabase Auth. Las funciones
`iniciarSesion`/`registrar`/`cerrarSesion` no validan credenciales de verdad
todavía (no hay con qué), pero su firma (recibe credenciales/datos, devuelve
`{ error? }`) es la que va a quedar cuando entre Supabase Auth.

Efecto colateral aceptado: `app/layout.tsx` ahora llama a `cookies()` para
saber si hay sesión, así que toda la app pasa de estática a renderizada por
request (antes de este cambio, `npm run build` ya marcaba `/mi-perfil` como
dinámica por sus `searchParams`, pero rutas como `/` o `/nosotros` salían
estáticas). Con el sitio entero corriendo sobre datos mock, el costo es
aceptable hoy; si se vuelve un problema real, la solución es Partial
Prerendering con un `<Suspense>` alrededor de la parte de TopBar que lee la
cookie (ver "Auth and streaming" en la documentación de Next.js), no revertir
esta decisión.

Los Server Actions de login/registro no llaman a `redirect()` internamente:
se invocan desde un `onSubmit` (no desde `<form action>`), y la
documentación de Next.js recomienda `useRouter().push(...)` para navegar
después de un Server Action disparado por un manejador de evento en vez de
un `<form>`. Devuelven `{ error? }` y el componente cliente hace el
`router.push` tras esperar la promesa — mismo patrón que ya usa el resto del
sitio (`DatosView.tsx`, `ConfirmacionView.tsx`) en vez de mezclar dos formas
de navegar.

## D-016 · Rol de personal simulado, verificación solo de interfaz
**Fecha:** 15/09/2026 · **Estado:** vigente
`docs/prompts/08-panel-counter.md` se ejecutó sobre `feature/panel-counter`,
una rama creada desde `main` — sin el trabajo de `feature/07-autenticacion`
(ya en `origin`, todavía sin mergear), que reemplaza `HAY_SESION_MOCK` por
una cookie de servidor. El prompt de este panel anticipa justamente ese
escenario ("con la autenticación aún en mock, agregar un rol simulado en
`lib/mock/sesion.ts`"), así que el rol se implementó igual que
`HAY_SESION_MOCK`: una constante de mano (`ROL_MOCK`,
`"pasajero" | "counter" | "supervisor"`) que `app/panel/layout.tsx` lee para
decidir si redirige. Es una verificación de interfaz nomás — server-side en
el sentido de que corre en un Server Component antes de renderizar nada,
pero sin nada real detrás. La verificación real (RLS sobre el rol del
usuario autenticado) es explícitamente parte del pendiente de backend.
**Importante para cuando se mergeen ambas ramas:** hay que decidir si el rol
pasa a vivir junto a la cookie de sesión de `lib/auth/` (de
`feature/autenticacion`) en vez de quedarse en `lib/mock/sesion.ts` como
constante aparte — hoy son dos mecanismos de mock que no se conocen entre
sí.

**Resuelto (15/09/2026, sesión de `docs/prompts/10-pwa-embarque.md`):** las
tres ramas ya están mergeadas a `main`. El merge automático dejó
`app/panel/layout.tsx` importando `HAY_SESION_MOCK`, que ya no existe
(la reemplazó la cookie de `lib/auth/sesion.ts`) — el build no compilaba.
Se corrigió combinando los dos mecanismos en vez de elegir uno: la sesión
(¿hay alguien logueado?) sigue siendo la cookie real
(`await haySesionActiva()`), y el rol (¿qué puede hacer ese alguien?) sigue
siendo `ROL_MOCK` — no se fusionaron en una sola constante porque son dos
preguntas distintas y la segunda no tiene todavía una respuesta real que
depender de una sesión pueda reemplazar. `app/embarque/layout.tsx` usa la
misma combinación.

## D-017 · /panel reutiliza el layout raíz público, sin shell propio
**Estado:** vigente
El panel es "para personal, no para pasajeros" y el prompt pide que sea una
experiencia separada, pero este proyecto no usa todavía múltiples root
layouts (route groups con su propio `<html>/<body>`) — todo cuelga de
`app/layout.tsx`. Migrar las ~20 rutas públicas existentes a un grupo
`(public)` para que `/panel` tenga su propio root layout es una
reestructuración de carpetas de alto riesgo para lo que pide esta tarea.
`app/panel/layout.tsx` en cambio agrega su propia cabecera interna (título +
nav a Inicio/Venta/Caja) dentro del layout público existente: el TopBar y el
Footer del sitio de pasajeros siguen apareciendo arriba/abajo del panel. Es
un compromiso visual, no funcional — la separación real (quién puede
entrar) la hace el `redirect` de D-016, no el layout. Si more adelante se
justifica un shell propio, la ruta es la reestructuración con route groups
descrita arriba, ver también las notas de "Multiple root layouts" en la
documentación de Next.js.

## D-018 · Venta en counter: wizard de una sola página, sin `PurchaseProvider`
**Estado:** vigente
El checkout público (`app/pasajes/comprar/*`) es un wizard de 4 páginas con
estado compartido en `PurchaseProvider` (Context + temporizador de reserva
de 10 minutos, pensado para que el pasajero pueda navegar atrás/adelante por
URL). `/panel/venta` no necesita nada de eso: es una sola pantalla que un
agente de counter opera de punta a punta sin recargar ni compartir enlaces
intermedios. Se implementó como un solo componente cliente
(`VentaView.tsx`) con un `paso` en estado local (`buscar → resultados →
asientos → datos → confirmado`), reusando `SeatMap`, `TripCard`,
`PassengerForm` y `lib/pdf/boleto.ts` — los mismos componentes y el mismo
generador de PDF que la venta web, sin el Provider ni el temporizador de
reserva (la reserva de 10 minutos es una regla para el pasajero autoservicio
que puede abandonar el carrito; en counter, el asiento se cierra en la misma
conversación).

## D-019 · Medio de pago de counter: `Select` propio, no `PaymentMethodPicker`
**Estado:** vigente
`components/pasajes/PaymentMethodPicker.tsx` está tipado contra `MetodoPago`
del checkout web (`"yape" | "plin" | "tarjeta"`, sin efectivo) y además
abre subformularios específicos de pago online (QR de Yape/Plin, campos de
tarjeta) que no aplican a una venta presencial: en counter el pago ya se
resolvió fuera del sistema (efectivo en mano, POS de tarjeta aparte, o el
pasajero muestra su Yape/Plin ya pagado) — la pantalla solo registra qué
medio se usó, para el arqueo. Ampliar `MetodoPago` para agregar
`"efectivo"` habría obligado a manejar ese caso en el checkout web, donde
nunca es alcanzable. Se optó por un tipo `MedioPago` propio en
`lib/mock/caja.ts` (superset con efectivo) y reutilizar `Select` — que sí
está en la lista de componentes a reusar del prompt — en vez de construir un
segundo picker de tarjetas visuales.

## D-020 · Manifiesto: documento completo, nunca enmascarado
**Fecha:** 15/09/2026 · **Estado:** reemplazada en parte por D-052 (la tabla en pantalla)
Pedido explícito de `docs/prompts/09-manifiesto-sutran.md`: a diferencia del
boleto (donde el DNI se enmascara — `maskDocumento`, Ley 29733, ver el
comentario en `lib/mock/sesion.ts`), el manifiesto SUTRAN es un documento de
fiscalización que exige el número de documento completo para poder
identificar a cada pasajero ante la autoridad. Esto **no** contradice la Ley
29733: el tratamiento tiene una finalidad declarada y necesaria (control de
tránsito interprovincial), que es justamente la excepción que la ley
contempla para no enmascarar. Lo que sí aplica y quedó implementado: el
manifiesto no se sirve por ninguna ruta pública (vive bajo `/panel`, detrás
del mismo `redirect` de personal que D-016/D-017), no se envía a terceros, y
el documento completo solo aparece en el PDF y en la tabla de
`/panel/viajes/[id]` — nunca en una URL ni en un log. `lib/mock/manifiesto.ts`
lo aísla en su propio dataset (no reutiliza `lib/mock/compras.ts`, que sí
enmascara) precisamente para que no haya un solo objeto pasajero que a veces
se muestre completo y a veces enmascarado según quién lo pida.

## D-021 · Helpers de PDF compartidos entre boleto y manifiesto
**Estado:** vigente
Pedido explícito del prompt ("reusando helpers comunes"). Se extrajeron de
`lib/pdf/boleto.ts` a un nuevo `lib/pdf/comun.ts`: colores, `NOTA_FUENTE`, y
las funciones de dibujo (`dibujarTexto`, `dibujarTextoCentrado`,
`dibujarTextoDerecha`, `dibujarLineaDivisoria`, `dibujarEncabezadoSeccion`,
`cargarImagen`). La única diferencia real con el código original es que
`Contexto` ahora lleva `margen`/`anchoContenido` en vez de asumir las
constantes de página del boleto: el boleto es A4 vertical y el manifiesto
A4 horizontal (D-022), así que un helper que asumiera un tamaño de página
fijo no le habría servido a los dos. `boleto.ts` quedó con el mismo layout
y los mismos valores — es una extracción mecánica, no un rediseño; no se
tocó nada de lo que ya estaba verificado en el prompt 03.

## D-022 · Manifiesto en A4 horizontal, no vertical como el boleto
**Estado:** vigente
El boleto es un comprobante de una persona/pocos asientos, vertical, tipo
ticket. El manifiesto es una tabla de 5 columnas (asiento, apellidos y
nombres, tipo y N.° de documento, origen, destino) para hasta 56 pasajeros
(la capacidad más grande del mock, un bus económico de dos pisos): en
vertical, el ancho útil de una A4 (~495pt) obliga a truncar la columna de
nombres o a una tipografía demasiado pequeña para imprimir. En horizontal
(~762pt de ancho útil) las 5 columnas entran con una tipografía legible a
9pt. Mismo papel A4, solo con ancho y alto intercambiados.

## D-023 · Estado de embarque: span propio, no el `Badge` de pasajes/encomiendas
**Estado:** vigente
`components/ui/Badge.tsx` tiene 5 estados fijos que el skill define para
pasajes/encomiendas (su propio comentario dice "el skill... pide 5
placas" — no es un enum abierto). "Pendiente"/"Embarcado" son las dos
palabras exactas que pide este prompt para el estado de embarque por
pasajero, y aunque `Badge` ya tiene un status `"pendiente"`, no tiene
`"embarcado"` — el candidato más cercano, `"confirmado"`, ya significa "pago
confirmado" en el dominio de pasajes/encomiendas, y reusarlo acá para
"subió al bus" habría hecho que la misma palabra significara dos cosas
distintas en dos pantallas del panel. Se optó por un span propio
(`PlacaEmbarque` en `DetalleViajeView.tsx`) con los mismos tokens de color
(`success-fill`/`warning-fill`) en vez de forzar un tercer significado sobre
`Badge`. Es de solo lectura a propósito: quién marca a un pasajero como
embarcado es trabajo de `docs/prompts/10-pwa-embarque.md`, no de esta
pantalla.

## D-024 · IndexedDB en /embarque: excepción justificada, no un atajo
**Fecha:** 15/09/2026 · **Estado:** vigente
CLAUDE.md prohíbe `localStorage` para el estado de la reserva; el prompt de
esta tarea es explícito en que el almacenamiento offline de embarque es la
**excepción** a esa regla, no una violación — la regla 4 exige justamente
que "la app valide localmente y sincronice después". `lib/embarque/db.ts`
usa IndexedDB, no `localStorage`, por dos razones que se suman: (1) es la
excepción que el propio prompt pide dejar documentada acá, y (2) aunque no
lo fuera, el volumen y la forma de los datos (un manifiesto de hasta 56
pasajeros con nombre/documento/asiento, más un registro de escaneos que
crece durante el viaje) ya son estructurados y superan lo razonable para
`localStorage` (strings, límite ~5MB, sin índices). Dos almacenes:
`manifiestos` (uno por viaje, clave `viajeId`) y `escaneos` (clave
compuesta `[viajeId, codigoBoleto]`, que de paso hace que un mismo pasajero
no pueda embarcar dos veces al mismo viaje sin necesidad de un chequeo
aparte).

## D-025 · El QR del boleto ahora lleva una firma HMAC real
**Estado:** vigente
`generarContenidoQr` (aislada desde el prompt 03, ver comentario en
`lib/pdf/boleto.ts`) devolvía un string plano sin firmar
(`ECOSEMH:BOLETO:{codigo}`) — suficiente para un QR "de mentira" hasta que
alguien tuviera que validarlo de verdad. CLAUDE.md regla 4 dice que el QR
"contiene un identificador firmado (HMAC)": con la PWA de embarque
escribiéndose en esta misma tarea, ya hay un consumidor real de esa firma,
así que dejarla sin implementar habría hecho que la verificación "local y
sin conexión" no tuviera nada que verificar. Contenido nuevo:
`"{codigo}|{firma}"`, firma = HMAC-SHA256 (Web Crypto nativo, sin agregar
una librería) truncada a 16 hex, aislada en `lib/firma.ts` — el mismo
módulo que usa `lib/embarque/validar.ts` para verificar, así que la clave
real de producción (pendiente crítico, ver ese archivo) se cambia en un
solo lugar. Probado extremo a extremo: se generó un boleto real desde
`/panel/venta`, y por separado se confirmó (script Node con el mismo
algoritmo) que la firma es determinística y rechaza tanto un código
alterado como una firma alterada.

## D-026 · /embarque oculta el TopBar/Footer público con un componente cliente
**Estado:** vigente
Mismo problema que D-017 (panel sin root layout propio) pero con un caso
más fuerte para resolverlo: `/embarque` es una PWA instalable pensada para
abrirse sola en la pantalla de inicio de un Android en el andén — el
TopBar de "Comprar Pasajes / Nosotros / Ayuda" y el footer institucional no
tienen sentido en una app kiosco de una sola pantalla, a diferencia de
`/panel`, que sigue siendo una herramienta de escritorio para counter (ahí
sí se deja el chrome público, D-017 no cambia). Migrar a route groups para
que `/embarque` tenga su propio root layout sigue siendo la solución
"correcta" pero de alto riesgo para esta tarea (mover ~20 rutas públicas de
carpeta). Se optó por algo más chico: `components/layout/ShellPublico.tsx`,
un componente cliente en `app/layout.tsx` que decide con `usePathname()` si
renderiza el TopBar/Footer o no. Es la tercera tarea seguida que tropieza
con esta misma limitación (D-017 fue la primera) — si aparece una cuarta,
probablemente ya valga la pena la migración a route groups en vez de un
cuarto parche.

## D-027 · Entrada manual de embarque: valida contra el manifiesto, no la firma
**Estado:** vigente
El QR trae `"{codigo}|{firma}"`, pero el respaldo manual que pide el
prompt ("como respaldo si la cámara falla") solo tiene sentido si el
personal puede escribir algo que de verdad tiene a la vista — y lo único
visible sin escanear es el código de reserva grande que el boleto ya
imprime como respaldo ("Muestra este código al personal de embarque" /
texto grande bajo el QR, ver `lib/pdf/boleto.ts`), no la firma hexadecimal.
`lib/embarque/validar.ts` acepta `firma` como parámetro opcional:
si viene (lectura por cámara), se verifica contra `lib/firma.ts`; si no
viene (entrada manual), se salta ese paso y se valida solo contra el
manifiesto ya descargado (existe en este viaje / no está ya embarcado). Es
una confianza menor a propósito para el camino de respaldo — el mismo
compromiso que hace cualquier sistema real cuando el operador tiene que
verificar a ojo en vez de por máquina.

## D-028 · Service worker de /embarque escrito a mano, sin `next-pwa`
**Estado:** vigente
El proyecto no tiene un framework de PWA instalado y agregar uno
(`next-pwa`, `@ducanh2912/next-pwa`) solo para precachear un puñado de
rutas no se justifica ("el proyecto debe correr barato" — CLAUDE.md).
`public/embarque-sw.js` es un service worker chico a mano: red primero con
caída a caché para la navegación, caché primero completándose sobre la
marcha para el resto de assets del mismo origen. No hay una lista de
precache generada en build (esa integración es justamente lo que da
`next-pwa`), así que la primera visita a `/embarque` sin red todavía falla
— el service worker ayuda desde la segunda visita en adelante, una vez que
ya cacheó algo. Se registra con `scope: "/embarque/"`
(`app/embarque/RegistrarServiceWorker.tsx`), así que no puede interceptar
ninguna otra ruta del sitio, `/panel` incluido — el riesgo de un service
worker mal comportado queda contenido a esta sección.
**Pendiente crítico, igual que la firma (D-025):** la validación de
embarque en sí (`lib/embarque/validar.ts`) no depende de este archivo — es
IndexedDB + JS puro. El service worker solo resuelve que la app *abra* sin
red, no que la validación *funcione* sin red (eso ya funcionaba antes de
que existiera este archivo).

## D-029 · Rol más estricto que "es personal": layout anidado, no un flag nuevo
**Fecha:** 15/09/2026 · **Estado:** vigente
`docs/prompts/11-motor-precios.md` es la primera pantalla del panel que
exige *supervisor* específicamente, no "cualquier personal" (`esPersonal`,
D-016). En vez de convertir la comprobación en un parámetro
(`requiereSupervisor?: boolean`) sobre el layout de `/panel`, se agregó
`esSupervisor()` en `lib/mock/sesion.ts` y un `app/panel/precios/layout.tsx`
propio que redirige a `/panel` (no a `/`: un counter sigue siendo personal,
solo que no puede entrar a esta sección). Layouts anidados componen mejor
que un flag: si aparece una tercera pantalla con un rol distinto, se agrega
otro layout chico en su propia carpeta en vez de una lista de excepciones
creciendo dentro de `app/panel/layout.tsx`.

## D-030 · Motor de precios: valores semilla explícitamente placeholder
**Estado:** vigente
`docs/INFORME-AVANCE.md` lista "factores del motor de precios" como una
definición pendiente del cliente — igual que ya pasó con el tarifario de
encomiendas (`RANGOS_TARIFA_ENCOMIENDA`, con el mismo comentario de
placeholder). La tarifa base de cada ruta en `lib/mock/precios.ts` no es un
número inventado: es el precio económico más bajo que ya existe para esa
ruta en `lib/mock/viajes.ts` (VIAJES) — reusar un dato que ya está en el
repo en vez de escribir uno nuevo. Los factores de ocupación sí son los de
la propuesta técnica (tabla literal del prompt); anticipación y temporada
son placeholder razonable (más anticipación, más barato; temporada alta,
más caro) marcado como tal en el propio código y en la UI ("Placeholder:
pendiente de definición comercial"), no presentado como definitivo.
Temporada se modeló como una lista de categorías con nombre (Fiestas
Patrias, Navidad y Año Nuevo, feriados largos, eventos locales de Pasco/
Junín — los mismos que nombra el prompt) en vez de un rango numérico como
ocupación/anticipación: no hay lógica de calendario en esta tarea
("Pendiente explícito: cálculo server-side"), así que quien simula elige la
temporada aplicable de una lista, no la calcula el sistema a partir de una
fecha.

## D-031 · Escalonamiento de alertas de documentos: se corrigió un error de redacción en el prompt, no la regla
**Fecha:** 15/09/2026 · **Estado:** vigente
`docs/prompts/12-alertas-flota.md` pedía escalar la urgencia a medida que un
documento se acerca a su vencimiento (30 → 15 → 7 días, más "vencido"), pero
su propio bullet de verificación decía lo contrario ("a 20 días muestra la
alerta de nivel 15, no la de 30" — a 20 días todavía no se cruzó el umbral de
15). Antes de implementar, se preguntó explícitamente cuál de las dos partes
tenía el error. Confirmado: el error estaba en el bullet de verificación, no
en la regla. Se implementó la lectura cronológicamente consistente
(`diasRestantes <= 30` → `info`, `<= 15` → `warning`, `<= 7` → `error`,
`<= 0` → `vencido`, `lib/mock/flota.ts` → `nivelAlertaDocumento`) y se
corrigió el propio bullet del prompt para que quede como referencia correcta
a futuro: "a 20 días muestra la alerta de nivel 30; a 12 días muestra la de
15; a 5 días muestra la de 7". Verificado en navegador contra tres unidades
mock con el SOAT puesto exactamente en esos tres plazos.

## D-032 · Alertas de flota: "vencido" reutiliza navy, datos reutilizan las placas/conductores ya existentes
**Fecha:** 15/09/2026 · **Estado:** vigente
El skill define solo 3 estados semánticos (info/warning/error); el prompt
pide un cuarto para documentos ya vencidos. Igual que "completado" en
`components/ui/Badge.tsx` (D-004), se reutiliza navy sólido en vez de
inventar un quinto color — `components/ui/UrgenciaPill.tsx` es un componente
propio (no `Badge`, que ya tiene su propio vocabulario cerrado de 5 estados
de pasajes/encomiendas) con exactamente ese criterio.
Restricción del prompt: "no inventar placas, modelos ni fechas reales". En
vez de crear un segundo set de placas/conductores ficticios, `lib/mock/flota.ts`
reutiliza los mismos `PLACAS_BUS`/`CONDUCTORES` ya hardcodeados en
`lib/mock/manifiesto.ts` (duplicados como literales con un comentario que
señala la fuente, sin tocar ese archivo ya entregado) — una sola flota
ficticia consistente en todo el panel, no dos que no coinciden entre sí.

## D-033 · Tarifario de encomiendas: arranca vacío, no con un placeholder numérico
**Fecha:** 15/09/2026 · **Estado:** vigente
`docs/prompts/13-tarifario-encomiendas.md` es más estricto que el motor de
precios (D-030) sobre esto: "mientras comercial no defina los montos, los
campos quedan vacíos... no rellenar con cifras inventadas". La versión
anterior de este mismo dominio (`RANGOS_TARIFA_ENCOMIENDA` en
`lib/mock/encomiendas.ts`) sí traía montos placeholder (S/ 15 a S/ 120 por
rango) — ese archivo se reemplazó por `lib/mock/tarifario.ts`, cuyo
`TARIFARIO_ENCOMIENDA_INICIAL` arranca con `rangos: []` en las 3 rutas. El
supervisor construye el tarifario desde cero en `/panel/tarifario`
(agregar/editar/quitar rango), en vez de editar valores ya puestos como en
`TablaFactores` de `lib/mock/precios.ts`. Los límites de kg del exceso de
equipaje (20/30/50) sí quedan fijos porque el propio prompt los da
explícitamente — no son un rango inventado, a diferencia de los rangos de
encomiendas, que el prompt deja sin definir.

## D-034 · Tarifario compartido entre panel y cotizador vía módulo en memoria, no dos datasets separados
**Fecha:** 15/09/2026 · **Estado:** vigente
A diferencia del motor de precios (D-030, `/panel/precios` explícitamente
desconectado del checkout), este prompt sí pide que `/encomiendas/enviar`
"lea el tarifario configurado" en `/panel/tarifario`. Sin backend, la única
forma de que dos árboles de componentes cliente distintos vean el mismo
dato editable es un módulo singleton compartido: `lib/mock/tarifarioStore.ts`
expone el estado vía `useSyncExternalStore` en vez de que cada pantalla
reciba su propia copia de `TARIFARIO_ENCOMIENDA_INICIAL`. Sobrevive a la
navegación entre rutas de Next.js (misma instancia de módulo mientras dure
la pestaña) pero se reinicia a vacío en una recarga completa — igual
limitación de "todo en memoria" que el resto del proyecto sin base de
datos, documentada en docs/ESTADO.md.

## D-035 · Equipaje declarado en la compra de pasaje: informativo, no sumado al total
**Fecha:** 15/09/2026 · **Estado:** vigente
El prompt condiciona este punto ("si el flujo de compra lo permite") y no
lo exige. Se agregó un campo opcional "Equipaje declarado (kg)" a
`PassengerForm` (`DatosPasajero.equipajeKg`) que muestra en vivo qué
escalón de exceso aplicaría (`calcularEscalonEquipaje`,
`lib/mock/tarifario.ts`), pero no se suma a `Boleto.total` en
`PurchaseProvider`: el monto de cada escalón todavía no está definido por
comercial (D-033), así que sumar 0 al total sería indistinguible de "no
hay recargo" — lo correcto es mostrar el escalón y dejar el cobro real
para counter, no inventar una cifra en el boleto.

## D-036 · Términos y Privacidad: solo estructura, ningún texto legal generado
**Fecha:** 15/09/2026 · **Estado:** vigente
`docs/prompts/14-ayuda-faq.md` es explícito: "no redactar términos y
condiciones ni política de privacidad inventados... un texto legal generado
sin revisión es un riesgo, no un entregable." `/terminos` y `/privacidad`
(`app/terminos/page.tsx`, `app/privacidad/page.tsx`) solo tienen encabezado
+ una descripción neutral de qué cubrirá cada sección (qué, no cómo) + un
marcador "Pendiente de redacción legal" (`components/legal/SeccionPendiente.tsx`)
repetido en cada una, más un banner al inicio de la página. Los encabezados
de `/privacidad` cubren los 5 que el prompt cita explícitamente de la Ley
29733 (finalidad, datos recabados, plazo de conservación, encargados del
tratamiento, derechos ARCO); los de `/terminos` son la estructura estándar
de un documento de este tipo, no una lista citada por el prompt. Anotado en
docs/ESTADO.md como dependencia externa (revisión legal antes de publicar).

## D-037 · FAQ de /ayuda: sin política inventada, todo remite a counter
**Fecha:** 15/09/2026 · **Estado:** vigente
Restricción explícita del prompt: "no inventar políticas de cambios,
cancelaciones ni reembolsos que nadie definió: si no está definida, decir
que se consulte en counter." Igual criterio se extendió a "qué se puede
enviar" y "qué no se puede llevar" en equipaje, temas que tampoco tienen
una política publicada en ningún documento del proyecto. Las respuestas que
sí describen reglas reales (franquicia de 20 kg, escalones de exceso sin
sus montos, peso volumétrico ÷ 5000, confirmación de pago solo por webhook,
reserva de 10 minutos) citan exactamente esas reglas, sin ninguna cifra o
plazo adicional inventado. Acordeón propio
(`components/ui/Accordion.tsx`, `<button aria-expanded>` +
`aria-controls`) en vez de `<details>` sin estilar, pedido explícito del
prompt para no romper el lenguaje visual del skill.

## D-038 · Condiciones Generales del Contrato de Viaje: texto real incorporado en /terminos, sin tocar el resto del andamiaje pendiente
**Fecha:** 15/09/2026 · **Estado:** vigente · **Supersede parcialmente:** D-036
`docs/prompts/15-condiciones-contratacion.md` trae el primer texto legal
real de la empresa: las 11 condiciones (con sub-puntos en la 3) que la
empresa ya publica sobre el contrato de viaje. D-036 sigue vigente para
`/privacidad` (que este prompt explícitamente no toca) y para las 7 de las
9 secciones de `/terminos` que este documento no cubre. Se decidió NO
redistribuir los 11 puntos entre las 9 secciones ya andamiadas en la tarea
14 (Objeto y aceptación, Descripción del servicio, etc.): ese documento es
una sola pieza operativa cohesionada con su propia numeración oficial, y
partirla entre encabezados inventados habría sido una forma de reescribir
su estructura — exactamente lo que el prompt prohíbe ("literal, no
reescribir ni 'mejorar'"). En cambio, `app/terminos/condicionesContratoViaje.ts`
declara los 11 puntos tal cual (rarezas incluidas: "S/. 5.00 soles") y
`app/terminos/page.tsx` los renderiza como una sección propia, íntegra, con
su propio `<h2>`, antes del resto del andamiaje pendiente.
De las 9 secciones previas, 2 se reescribieron (no su marcador, su
descripción) para dejar explícito qué parte ya quedó cubierta arriba y qué
parte sigue pendiente, en vez de mantener una descripción que ya no era
precisa: "Cambios, cancelaciones y reembolsos" → "Cancelaciones y
reembolsos" (la postergación ya está cubierta; cancelación/reembolso no) y
"Equipaje y encomiendas" → "Condiciones de transporte de encomiendas" (el
equipaje de pasajero ya está cubierto; las encomiendas no). Las otras 7
secciones quedan intactas: este documento no dice nada sobre objeto y
aceptación, descripción del servicio, registro de cuenta, precios y medios
de pago, responsabilidad general, modificaciones del documento, ni ley
aplicable — son asuntos de un contrato de términos y condiciones más
amplio, no de las reglas operativas del día de viaje.

## D-039 · Postergación "por 15 días hábiles": se lee como ventana de la nueva fecha, no como plazo para pedirla
**Fecha:** 15/09/2026 · **Estado:** vigente
El punto 3 del contrato de viaje dice: "El pasajero tiene derecho a
realizar la postergación de su boleto por 15 días hábiles, presencialmente.
Por única vez." La redacción admite dos lecturas: (a) la nueva fecha del
viaje debe quedar dentro de los 15 días hábiles siguientes a la fecha
original, o (b) el pasajero tiene 15 días hábiles de plazo para *solicitar*
la postergación (medidos desde algún punto no especificado — ¿la compra?
¿el viaje original?). Se adoptó la lectura (a): gramaticalmente "realizar
la postergación... por 15 días hábiles" describe la extensión de la
postergación misma (cuánto se puede correr la fecha), no un plazo de
solicitud — y es además la lectura que no depende de inventar un punto de
partida que el texto no menciona. `/ayuda` refleja esta lectura
("con la nueva fecha dentro de los 15 días hábiles siguientes al viaje
original"), pedido explícito del prompt de anotar la interpretación ante
una redacción ambigua.

## D-040 · El rol simulado se muda de constante de mano a cookie de servidor
**Fecha:** 15/09/2026 · **Estado:** vigente · **Supersede:** el mecanismo de `ROL_MOCK` descrito en D-016
D-016 dejó anotado explícitamente que había que decidir esto "cuando se
mergeen ambas ramas" — `docs/prompts/16-navbar-por-rol.md` es el que
finalmente lo obliga: pide un selector de rol visible en desarrollo para
alternar entre sin sesión, pasajero, counter y supervisor sin editar
código. Eso es imposible con `ROL_MOCK` como constante importada en
tiempo de compilación (cambiarla exige editar `lib/mock/sesion.ts` y
recargar). La solución reutiliza exactamente el mecanismo que ya existe
para la sesión (`lib/auth/sesion.ts`, cookie httpOnly): una segunda
cookie, `ecosem_rol_demo`, con `obtenerRolDemo()` / `establecerRolDemo()`
/ `eliminarRolDemo()` junto a `haySesionActiva()` — no una tabla nueva ni
un mecanismo paralelo. `lib/mock/sesion.ts` se queda solo con lo que sigue
siendo cliente-seguro (`RolUsuario`, `esPersonal`, `esSupervisor`,
`USUARIO_MOCK`): no puede importar `next/headers` sin romper los
componentes cliente que ya importan `USUARIO_MOCK` (`PreciosView`,
`AlertasView`, `PerfilView`, `MisEncomiendasTab`). Sigue sin ser una
barrera de seguridad real — nada de esto cambia con D-016, solo cómo se
guarda el valor.

## D-041 · Navegación agrupada por rol: menú "Panel" en escritorio, sección aparte en el móvil, selector de rol dev-only
**Fecha:** 15/09/2026 · **Estado:** vigente
**Agrupamiento visual.** Con hasta 10 enlaces internos para supervisor
(Venta, Caja, Viajes del día, Embarque, Precios, Tarifario, Flota,
Conductores, Alertas, más "Inicio del panel"), meterlos sueltos en la
barra los mezclaría con el sitio público — el prompt pide agruparlos, no
mezclarlos. Se optó por un menú desplegable "Panel" en escritorio
(`components/layout/PanelMenu.tsx`) en vez de listarlos todos: la
alternativa (una fila de 10 enlaces) no cabe sin scroll horizontal en un
viewport razonable. El disclosure sigue el mismo patrón de
`components/ui/Accordion.tsx` (`<button aria-expanded aria-controls>`) en
vez de `role="menu"` con roving tabindex: es navegación, no una lista de
acciones, y un disclosure simple es un patrón accesible más robusto que
una implementación parcial del patrón "menu button" de ARIA. En móvil, el
menú de pantalla completa ya existente refleja el mismo agrupamiento con
un encabezado "Panel interno" + separador, mismo lenguaje visual que
"ENLACES" en el footer.

Agregar esta sección reveló un bug preexistente que no importaba hasta
ahora: el `<nav>` del menú móvil no tenía `overflow-y-auto` (solo
`flex-1`, sin `min-height: 0`, el error clásico de flexbox que hace que
`overflow` no tenga efecto). Con 6 enlaces públicos cabía siempre en
pantalla; con 10 enlaces internos más el bloque de "Cerrar Sesión", el
contenido excedía el alto del viewport en pantallas comunes (640px) y
quedaba recortado sin poder hacerse scroll — invisible e inalcanzable,
tanto al tacto como por teclado. Corregido agregando `min-h-0
overflow-y-auto` al `<nav>`.

**Selector de rol dev-only.** Vive fuera de `ShellPublico`
(`components/layout/SelectorRolDemo.tsx`, montado directo en
`app/layout.tsx`) porque `/embarque` oculta el TopBar público (D-026) pero
la tarea 17 de QA también necesita cambiar de rol ahí. Ocultarlo detrás de
`process.env.NODE_ENV === "development"` en un Server Component evita que
se renderice en producción — verificado con `npm run build` + `npm run
start` reales (el primer intento de verificación dio un falso negativo:
`next start` fallaba con `EADDRINUSE` porque un `next dev` de una tarea
anterior seguía corriendo en el puerto 3000, y el curl de verificación
estaba golpeando ese servidor de desarrollo, no el de producción — quedó
resuelto matando todos los procesos de Node antes de levantar el server de
verdad). Confirmado: ninguna página del build de producción real
(`/`, `/panel`, `/embarque`, `/nosotros`, `/ayuda`) contiene el selector en
su HTML. Limitación aceptada y anotada: como `app/layout.tsx` importa
`SelectorRolDemo` de forma estática y es el layout raíz de todas las
rutas, Turbopack igual genera un chunk de cliente para el componente y lo
lista en el `client-reference-manifest` de cada página — el archivo existe
en `.next/` y es descargable si alguien ya conoce su nombre con hash, pero
ninguna página real lo referencia ni lo carga, así que un usuario
navegando el sitio en producción nunca lo ve ni lo descarga. Eliminar
también el archivo del disco exigiría separar `/embarque` a su propio root
layout (route groups, la misma reestructuración de alto riesgo que D-017 y
D-026 ya evaluaron y descartaron) o tooling de build a medida — ninguno
justificado para una ayuda de QA sin datos sensibles.

## D-042 · Reserva viva al retroceder o cerrar la pestaña
**Fecha:** 17/10/2026 · **Estado:** vigente
Integración del flujo de compra con svc-ventas. Lo implementa
`components/pasajes/PurchaseProvider.tsx`.
- **Retroceder dentro del flujo** (pago → datos → asientos): la reserva se
  conserva. En asientos aparecen los mismos asientos elegidos y el contador
  sigue; si se cambia la elección, primero se libera la reserva anterior
  (`DELETE /v1/reservas/:id`) y luego se reserva la nueva, para no retener
  asientos dos veces ni sumarlos al tope de 8 por sesión.
- **Salir del flujo** (atrás hasta resultados, otra sección del sitio): se
  libera la reserva, salvo que ya se haya iniciado el pago (el usuario puede
  estar pagando en Yape). Retener asientos que nadie va a pagar los bloquea
  para otros compradores.
- **Cerrar la pestaña o recargar:** no se envía nada. Un aviso al cerrar no
  llega de forma confiable en móviles, y recargar no es abandonar. La reserva
  vence a su hora (`expiresAt`) y el proceso programado del backend la
  libera. Tras una recarga, cada paso consulta el estado real y ofrece
  empezar de nuevo (liberando lo retenido) o lleva a la confirmación si ya se
  compró.
- **Sin diálogos de "¿seguro que quieres salir?"**: no se pidieron y en un
  teléfono interrumpen más de lo que protegen.

## D-043 · El reloj de la reserva lo decide el backend
**Fecha:** 17/10/2026 · **Estado:** vigente
El contador se calcula desde `expiresAt` de la reserva, nunca contando diez
minutos en el navegador. Un reloj del teléfono desfasado igual distorsiona
`expiresAt − ahora`, y la cabecera `Date` del servidor no se puede leer
desde el navegador: el backend solo expone `retry-after` y
`x-correlation-id` por CORS (D-047 del backend). Por eso:
- El contador es solo lo que se muestra. Que la reserva **venció** o se
  **compró** lo decide el estado que devuelve
  `GET /v1/reservas/:id/pasajeros`, consultado cada 30 s, al volver a la
  pestaña y, al llegar a cero, cada 5 s hasta que el backend confirme
  (`useVigenciaReserva`).
- `lib/api/cliente.ts` ya corrige el desfase si el backend agrega `date` a
  `CORS_EXPOSED_HEADERS`. Pedido abierto al backend.

## D-044 · Token de la sesión de compra en sessionStorage
**Fecha:** 17/10/2026 · **Estado:** vigente
La pasarela puede devolver al usuario con una recarga completa, y sin el
token `x-session-token` la página de retorno no puede consultar el estado de
su compra. El token va en `sessionStorage`: es un identificador anónimo
firmado por el servidor (D-013 del backend), sin datos personales, que muere
al cerrar la pestaña. **No es estado de la reserva**: asientos, precio,
vencimiento y estado se piden siempre al backend; la reserva tal como llegó
y lo escrito en el formulario viven solo en memoria. No contradice la regla
de CLAUDE.md sobre `localStorage`.

## D-045 · El pasaje se emite como boleto de viaje, sin factura
**Fecha:** 17/10/2026 · **Estado:** vigente
Sigue a D-019 del backend (RS 156-2003/SUNAT, art. 2 y 3): el pago ya no
ofrece "Boleta / Factura". Quien necesite sustentar un gasto marca la
casilla y da RUC y razón social, que van en el mismo boleto de viaje
(`billTo`). El backend rechaza el campo `receipt` antiguo.

## D-046 · El PDF del boleto lleva el documento completo del pasajero
**Fecha:** 17/10/2026 · **Estado:** vigente
El PDF de una compra real es la representación del Boleto de Viaje
(RS 156-2003/SUNAT), no una copia de cortesía, y el artículo 3 exige el
documento completo del pasajero: se imprime sin enmascarar, con su tipo
(`DNI`, `C.E.`, `Pasaporte`). Lo que protege los datos es el diseño, una
página por pasajero con solo su propio documento (`generarBoletosCompraPdf`).
El enmascarado se queda en las listas: la confirmación en pantalla, que
junta a varios pasajeros, y el panel. Revierte el enmascarado que había
puesto la entrada de BITACORA del 17/10 (cont. 3).

## D-047 · Ingreso con correo y contraseña; registro mínimo
**Fecha:** 17/10/2026 · **Estado:** vigente
Supabase Auth con correo y contraseña. El DNI ya no sirve para entrar:
Supabase Auth no lo admite, y traducir DNI a correo exigiría una tabla nueva
en el backend que además revelaría qué DNI tiene cuenta. El registro pide
nombre (solo para saludar), correo y contraseña. DNI y celular no: no los usa
ninguna parte de la cuenta y quedarían en metadatos que el usuario edita; se
piden en cada compra, por pasajero, donde sí se usan (Ley 29733).
Si el proyecto exige confirmar el correo, el registro muestra "Revisa tu
correo" y el enlace vuelve por `app/auth/confirmar`. La recuperación de
contraseña usa el mismo camino (`/recuperar-clave/nueva`).

## D-048 · Una compra sin cuenta aparece en el perfil solo si se vincula desde su pestaña
**Fecha:** 17/10/2026 · **Estado:** vigente
**No se asocia por correo ni por documento.** Un correo de contacto o un DNI
escritos en una compra no prueban que quien inicia sesión sea esa persona: el
DNI no es secreto, y el correo de contacto no se verificó. Asociar por ellos
dejaría ver compras ajenas, con datos personales de los pasajeros, a quien se
registre con el correo o el DNI de otro.
**Sí se asocia por la sesión de compra** (`POST /v1/sesiones/vincular`, D-015
del backend): quien tiene el token de esa sesión es quien compró. Pasa:
- al iniciar sesión o registrarse en la misma pestaña donde se compró;
- al confirmarse una compra hecha con la sesión ya iniciada.
Una compra sin cuenta hecha en otra pestaña o en otro dispositivo no aparece
en el perfil; sus boletos siguen en la confirmación y en el PDF. Al cerrar
sesión se borra la sesión de compra de la pestaña, para que en un dispositivo
compartido el siguiente no consulte la compra anterior.

## D-049 · La barra de cuentas de prueba no existe en producción
**Fecha:** 17/10/2026 · **Estado:** vigente · **Supersede:** D-040
Con roles reales la barra no puede dar un rol: cada botón inicia sesión con
una cuenta de prueba de ese rol (`lib/auth/desarrollo.ts`, credenciales en
`.env.local` sin `NEXT_PUBLIC_`). La cookie `ecosem_rol_demo` y todo lo que la
leía se eliminaron.
El `if (NODE_ENV === "development")` de `app/layout.tsx` **no bastaba**: el
build de producción incluía el componente (en un chunk del navegador) y su
Server Action (con los nombres `DEV_CUENTA_*`). En la fase de compilación de
producción, `next.config.ts` resuelve su import a
`SelectorRolDemo.produccion.tsx`, vacío. Verificado con `npm run build` limpio
y grep sobre `.next/`: 0 rastros del componente, la acción, las variables o la
cookie. (Escribir el destino del alias como ruta relativa rompe `next/font`
en un build sin caché; tiene que ir como `@/…`.)

## D-050 · Mis encomiendas no lista guías hasta que el backend las asocie a una cuenta
**Fecha:** 19/10/2026 · **Estado:** vigente
La pestaña mostraba guías inventadas (`lib/mock/encomiendas`) a cualquier
cuenta real. Se quitó. No se conectó a datos reales porque no existen: la
tabla `encomiendas.encomiendas` tiene `remitente_usuario_id` y RLS lo
respeta, pero ninguna operación lo llena (las encomiendas las registra el
counter) y svc-encomiendas no expone una consulta de "mis encomiendas".
No se buscan por documento ni por correo del remitente, por la misma razón
que D-048. La pestaña remite al rastreo por número de guía.
Para cerrarlo hace falta, en el backend: una forma de asociar la encomienda
a la cuenta que no sea el DNI ni el correo, y `GET` de las propias.
**Pendiente de backend** (confirmado el 19/10/2026: se deja así, con el
rastreo por guía, sin resolverlo en el frontend).

## D-051 · Panel de counter: solo efectivo, sin boleto impreso, tipos de caja copiados a mano
**Fecha:** 19/10/2026 · **Estado:** vigente
`/panel/venta` y `/panel/caja` usan `/v1/caja/*` de svc-ventas con el token
del operador (`lib/api/caja.ts`).
- **Solo efectivo.** La venta en counter del backend (`POST /v1/caja/ventas`)
  cobra en efectivo y confirma asiento, cobro y compra en una transacción.
  No hay venta de pasaje con Yape, Plin o tarjeta en counter: el selector de
  medio de pago del mock desapareció.
- **Sin reserva previa.** Nada se envía hasta "Cobrar y vender"; el total que
  se muestra antes es el precio de ese momento y el que vale es el que
  devuelve la venta. Si la tarifa subió y el efectivo no alcanza, el backend
  rechaza la venta entera (`INSUFFICIENT_CASH`) con el total nuevo.
- **Respuesta perdida = venta incierta.** Una falla de red o de tiempo tras
  enviar no se reintenta: la pantalla pide revisar Caja o el plano antes de
  cobrar otra vez.
- **Sin PDF del boleto.** `CashSaleResponse` no trae el `reservationId` y
  `GET /v1/reservas/:id/boletos` solo responde al titular o al usuario
  comprador, así que el panel no puede obtener los boletos con QR firmado.
  Antes se imprimía un PDF con QR de mentira; ya no. Pendiente del backend.
- **Arqueo sin selectores.** El backend devuelve solo el turno abierto de
  quien llama; agencia, turno y usuario ya no se eligen en pantalla.
- **Tipos copiados a mano.** El D-046 del backend deja fuera del contrato
  generado las formas de los paneles de personal (su prueba exige que
  `CashSaleRequest` no esté). Se copiaron en `lib/api/caja.ts` con aviso; si
  el backend decide publicarlas, se reemplazan por el contrato generado.

## D-052 · Documento del pasajero: enmascarado en pantalla, completo solo en los documentos que lo exigen
**Fecha:** 19/10/2026 · **Estado:** vigente · **Reemplaza en parte:** D-020
Toda lista o detalle en pantalla del panel muestra el documento enmascarado
(`maskDocumento`): la tabla de pasajeros de `/panel/viajes/[id]` dejó de
mostrarlo completo, y el detalle de una encomienda enmascara el de remitente y
destinatario. Completo solo en:
- el boleto de viaje en PDF (RS 156-2003/SUNAT, art. 3; D-046);
- el PDF del manifiesto, como excepción de fiscalización (D-020 y el contrato
  `ManifestContent` del backend). Se consultó el 19/10/2026 y se mantiene.
Para entregar una encomienda no hace falta ver el documento del destinatario:
se escribe el que muestra quien recoge y el backend lo compara.

## D-053 · Encomiendas: cinco estados, búsqueda por guía para el personal
**Fecha:** 19/10/2026 · **Estado:** vigente
- **Cinco estados**, con las claves del backend (D-031 del backend):
  registrada → alistando → en camino → en la agencia de destino → entregada;
  `cancelada` corta la línea donde estaba. `EncomiendaTimeline` usa esas
  claves y los eventos tal como llegan. **CLAUDE.md todavía dice cuatro
  estados con "despachada"**: está desactualizado.
- **Búsqueda por guía (backend).** Todas las operaciones de personal pedían el
  UUID interno, que solo llega al registrar; en destino solo se tiene la guía.
  Se agregó `GET /v1/encomiendas/guia/:guia` en `backend-ecosemh` (mismo
  detalle y mismas reglas de RLS que `/:id`), con su prueba en
  `encomiendas_test.ts`: D-050 del backend, rama
  `feature/encomiendas-por-guia`. Falta desplegarlo.
- **Rastreo público** contra `/v1/encomiendas/rastreo/:guia`. Antes, el mock
  mostraba nombres de remitente y destinatario a cualquiera con la guía.
- **Registro** con cotización del backend (sin cotización vigente no se
  cobra), cobro por la caja de ventas (efectivo con vuelto, o Yape/Plin/
  tarjeta conciliados), y `PAYMENT_UNCONFIRMED` → "Reintentar cobro", que no
  cobra dos veces.
- **Origen:** el counter registra en su agencia (`app_terminal_id` del
  token); el supervisor elige, aunque su token traiga una agencia.
- Tipos de personal copiados a mano en `lib/api/encomiendas.ts`, como en
  D-051.
- Fuera de alcance: cancelación y devoluciones (el backend las tiene), y el
  cotizador público `/encomiendas/enviar`, que sigue leyendo el tarifario en
  memoria del mock.

## D-054 · Embarque: el QR se valida en el dispositivo con la clave pública del paquete
**Fecha:** 19/10/2026 · **Estado:** vigente · **Reemplaza:** D-025 y la firma HMAC del mock
La app de embarque deja el mock (HMAC con la clave dentro del bundle, QR
`codigo|firma`, manifiesto local con nombres) y usa el QR real del backend
(B-07): `EH1.<kid>.<viaje>.<compra>.<asiento>.<firma>`, ECDSA P-256.
- **Sin red.** Con señal se baja el paquete del viaje (`GET
  /v1/embarque/viajes/:id/paquete`): claves públicas, anulados, embarcados,
  menores y menores en brazos por asiento, sin nombres. Al escanear,
  `lib/embarque/decidir.ts` verifica la firma con WebCrypto y decide: formato,
  paquete vencido (24 h), otro viaje, viaje cancelado, clave desconocida, firma,
  anulado, ya embarcado (aquí o según el paquete). Ninguna llamada de red.
- **Idempotente.** Cada escaneo guarda un `scanId` propio al escanear, que no
  cambia. La sincronización (`POST /v1/embarque/sincronizacion`, lotes de 500)
  reenvía siempre el mismo `scanId`: el servidor responde `alreadyRecorded` y no
  embarca dos veces. El servidor vuelve a verificar todo y su respuesta queda
  guardada junto al escaneo; es la que vale.
- **Solo se envía lo que el dispositivo embarcó.** El servidor trata cada
  escaneo como intento de embarque: enviar un rechazo local (paquete vencido,
  por ejemplo) podría dejar "embarcado" a quien no se dejó subir. Un QR que no es
  de un boleto no se guarda ni sale del dispositivo.
- **Dos dispositivos.** Con señal, el paquete se renueva cada 30 s y al volver
  la conexión: lo que embarcó otro se ve como "Lo embarcó otro dispositivo". Sin
  señal en ambos, los dos aceptan; al sincronizar, el segundo recibe
  `duplicado` y la app lo muestra como conflicto ("Otro dispositivo ya lo había
  embarcado"). Es lo más que se puede sin red.
- **Sin entrada manual sin firma.** El respaldo de la cámara es un lector externo
  o pegar el contenido del QR, que se verifica igual. Un código tecleado sin
  firma no se podía verificar ni sincronizar.
- **Rol.** El backend admite `counter` y `supervisor` en estas rutas; la app
  exige personal (`esPersonal`). Si el backend agrega un rol de embarque, hay
  que sumarlo a `lib/auth/roles.ts` y al layout de `/embarque`.
- `lib/firma.ts` y la ruta mock del boleto en `lib/pdf/boleto.ts` se borraron: la
  clave HMAC ya no está en el bundle de producción. Base local en versión 2 (se
  borra lo de la versión mock) y caché del service worker en v2.

## D-055 · Manifiesto desde el backend; marcas de menores sin nombres en pantalla
**Fecha:** 19/10/2026 · **Estado:** vigente (una parte por confirmar)
`/panel/viajes` y `/panel/viajes/[id]` leen `/v1/operacion/viajes` y el
manifiesto versionado (`/manifiestos`, generar = versión nueva con quién y
qué cambió). En pantalla: documento enmascarado (D-052), y menores y menores
en brazos marcados por asiento, sin nombres. El PDF sale del contenido de la
versión: documento completo, serie y número del boleto, observaciones de menor
y menor en brazos, versión y huella.
**Por confirmar:** el PDF incluye una sección "Menores en brazos" con nombre y
documento de cada uno, porque el contenido del backend los trae para el
manifiesto de fiscalización. Si "sin nombres" aplica también al PDF, se quita
esa sección.
