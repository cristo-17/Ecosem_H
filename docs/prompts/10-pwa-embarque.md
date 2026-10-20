# 10 · PWA de embarque con lector QR

**Rama:** `feature/pwa-embarque`

Lee primero `CLAUDE.md` — la regla 4 (validación de embarque) gobierna esta
tarea entera.

## Por qué existe

Hoy la validación es en papel con resaltador, con cuellos de botella en puerta.
El boleto ya lleva QR. Falta quien lo lea.

## Restricción que define el diseño

**El QR debe validarse sin conexión.** Los terminales de altura y las escalas
intermedias no tienen cobertura garantizada. La app valida localmente y
sincroniza después. Cualquier diseño que dependa de una llamada al servidor en
el momento del escaneo está mal.

## Alcance

**`/embarque`** — selección de viaje

- Lista de viajes asignados al usuario, filtrada por fecha.
- Al elegir un viaje, **descargar y guardar el manifiesto localmente** para poder
  operar sin red.

**`/embarque/[viajeId]`** — escaneo

- Lector de QR por cámara.
- Al leer: validar el identificador firmado **localmente**, contra los datos ya
  descargados. Sin llamada al servidor.
- Tres resultados visualmente inconfundibles, distinguibles a un metro de
  distancia y con sol de frente:
  - **Válido** — verde, nombre del pasajero y asiento.
  - **Ya embarcado** — ámbar, con la hora del primer escaneo.
  - **Inválido** — rojo, motivo (no corresponde a este viaje / firma inválida).
- Entrada manual del código de reserva como respaldo si la cámara falla.
- Contador visible: embarcados / total.

**Sincronización**

- Los escaneos se acumulan localmente y se envían cuando hay red.
- Indicador de estado de conexión y de escaneos pendientes de sincronizar.
- Al recuperar señal, sincronizar automáticamente.

## Almacenamiento local

Esta es la **excepción justificada** a la regla de no usar almacenamiento del
navegador: aquí el almacenamiento offline es el requisito, no un atajo. La regla
de `CLAUDE.md` prohíbe `localStorage` **para el estado de la reserva**, que es
otra cosa. Usar IndexedDB (no `localStorage`) por volumen y estructura, y
documentar la excepción en `docs/DECISIONES.md` citando la regla 4.

## Firma del QR

En esta etapa la validación puede verificar un HMAC con una clave mock. Aislar la
verificación en su propia función para que el cambio a la clave real del backend
no toque la interfaz. **La clave nunca va en el bundle del cliente en producción**
— anotarlo como pendiente crítico.

## PWA

- Manifest, service worker y assets cacheados para que la app abra sin red.
- Instalable en Android. Sin costo de tienda de apps.

## Verificación

- Escanear un boleto válido, uno repetido y uno de otro viaje.
- **Probar con la red desconectada**: la validación debe seguir funcionando.
- Reconectar y confirmar que los escaneos pendientes se sincronizan.
- `npx tsc --noEmit && npx eslint . && npm run build` pasan.
- Registrar en `docs/BITACORA.md` y `docs/DECISIONES.md`.
