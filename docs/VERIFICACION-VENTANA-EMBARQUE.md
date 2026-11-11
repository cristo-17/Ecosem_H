# Verificación de la ventana de embarque

Integración preparada con el contrato de `feature/ventana-embarque`. El backend
todavía no está desplegado: **no se ha verificado contra EcosemH**. Las pruebas
locales usan componentes y adaptadores HTTP reales con respuestas simuladas.
No acreditan la migración, los permisos de base ni las funciones desplegadas.

## Antes de habilitar la operación

1. Desplegar en preview la migración `20261111000100_ventana_embarque.sql`,
   después la Edge Function `ventas` y finalmente este frontend. El frontend
   bloquea paquetes antiguos que carezcan de ventana o identificador.
2. Entrar como supervisor activo a `/panel/embarque`. Sin regla debe mostrarse
   «Ventana de embarque sin configurar» y los tres campos vacíos. No ingresar
   valores provisionales. Un supervisor carga minutos y fuente operativos
   reales. Cero es válido solo cuando sea la decisión respaldada por esa fuente.
3. Guardar, recargar y comparar minutos, fuente, versión, autor y fecha con la
   respuesta. Repetir con counter, embarque y pasajero: el panel debe negar el
   acceso y las rutas GET/PUT de configuración deben rechazar esos roles.
4. En cada dispositivo, actualizar la PWA en línea y descargar otro paquete.
   Comprobar que muestra fecha y hora de apertura/cierre en Perú, distintas de
   la caducidad técnica. La nueva caché no borra IndexedDB ni sus pendientes.
   Un dispositivo que nunca actualizó su bundle puede mantener la aceptación
   local antigua: no reabrir la operación con esa versión.

## Comprobación automatizada después del despliegue

En PowerShell, configurar las variables sin compartirlas en logs. El token
debe ser de un supervisor activo y el viaje debe estar autorizado para QA en
preview. No se incluye ningún token en el repositorio.

```powershell
$env:ECOSEM_SUPABASE_URL = 'https://<proyecto-preview>.supabase.co'
$env:ECOSEM_EMBARQUE_TOKEN = '<token de acceso del supervisor de preview>'
$env:ECOSEM_EMBARQUE_VIAJE_ID = '<UUID del viaje autorizado>'
node scripts/verificar-embarque-despliegue.mjs
Remove-Item Env:ECOSEM_EMBARQUE_TOKEN
```

El script usa solo las rutas GET: configuración, paquete y todas las páginas
de rechazos. Consultar el paquete emite/persiste uno, como documenta el backend.
No guarda reglas ni escaneos. Comprueba cálculo de límites, versión, fechas,
claves públicas y forma/paginación de incidencias. No imprime datos personales,
QR ni credenciales. Esta comprobación no se ha ejecutado contra EcosemH.

## Casos operativos en preview

- Sin regla o con un paquete descargado antes de configurarla: no aceptar QR,
  informar la falta de ventana y exigir otra descarga. Un paquete histórico
  sin campos nuevos debe bloquear, conservando sus escaneos anteriores.
- Con un QR ECDSA de prueba del viaje autorizado, probar sin red: un milisegundo
  antes de abrir, apertura exacta, cierre exacto, un milisegundo después y otro
  día. Se admiten los dos límites exactos. Verificar también otro viaje, firma
  alterada, compra anulada y duplicados.
- Retroceder el reloj a antes de `issuedAt`: advertencia visible y bloqueo.
  Probar caducidad técnica aun con ventana operativa más amplia. Restaurar el
  reloj; una hora plausible manipulada no puede detectarse offline.
- Escanear dentro de ventana con paquete A. Descargar B y sincronizar después
  del cierre y de `validUntil` de A: el envío conserva el `packageId` A y la
  hora original; el servidor decide según A, sin sustituirlos por B.
- Cortar una respuesta de sincronización o simular 503 y respuesta parcial.
  Solo marcar confirmados los `scanId` devueltos. Reintentar los demás con los
  mismos identificadores, paquete y hora; comprobar `alreadyRecorded` y que no
  se duplique ningún embarque.
- Conservar un escaneo histórico sin `packageId`: enviarlo con `null`, verificar
  `paquete_requerido` persistido y su incidencia visible, sin borrado silencioso.
- Reprogramar el viaje después de emitir A y probar `paquete_desactualizado`.
  Probar `incidencia_reloj`, falta de configuración, apertura/cierre y los otros
  motivos del contrato. Un rechazo no debe figurar como VÁLIDO ni sumarse como
  embarque local confirmado; debe permanecer visible aunque haya más de treinta
  escaneos posteriores.
- Abrir el detalle del viaje como supervisor y «Ver incidencias de embarque».
  Revisar motivo, compra/asiento, operador, hora original/recepción, paquete,
  versión y límites. Probar más de cien rechazos, paginación, fallos y reintento.
  Los registros históricos con `scannedAt: null` muestran «Sin registro».
  No existe una acción para convertir rechazos en aceptaciones.
- Cerrar sesión y entrar con otra cuenta en el mismo dispositivo: no ver ni
  sincronizar datos de la primera; sus pendientes reaparecen al volver a ella.

## Comprobaciones locales reproducibles

```powershell
node --test tests/embarque.test.mjs tests/validacion.test.mjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js . --ignore-pattern '.qa-tmp/**'
npm.cmd run build
```

El harness de navegador y sus resultados se guardan en `.qa-tmp/ventana-*`.
La comprobación de hash del contrato copiado se registra en la bitácora.
