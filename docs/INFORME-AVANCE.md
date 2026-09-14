# Informe de avance

**Proyecto:** Plataforma digital Ecosem H
**Corte:** 13 de septiembre de 2026
**Fase según propuesta técnica:** pre-Fase 1

## Qué se construyó

Se levantó el frontend completo de la experiencia pública con datos simulados:
portada con buscador de pasajes, resultados de búsqueda, página institucional,
cotizador y rastreo de encomiendas, historial de viajes y el Libro de
Reclamaciones virtual.

El sistema de diseño está cerrado y documentado: paleta, tipografía, radios,
sombras y once componentes base con todos sus estados, verificables en la ruta
`/styleguide`. Esto significa que las pantallas que faltan se construyen
ensamblando piezas ya validadas, no diseñando desde cero.

## Qué falta

**Flujo de compra.** Selección de asientos, datos del pasajero, pago y
confirmación con boleto. Es el núcleo comercial y depende de que exista backend.

**Backend completo.** Base de datos, inventario transaccional de asientos,
pasarela de pagos, facturación electrónica y aplicación de embarque.

**Definiciones del cliente.** Tarifario de equipaje y encomiendas, factores del
motor de precios, listado completo de rutas y planos de asientos por tipo de bus,
y fotografía real de la flota.

## Punto que requiere decisión de gerencia

La empresa tiene una aplicación móvil publicada en Google Play por un proveedor
externo. Antes de activar el inventario real de asientos debe definirse si se
integra vía API o si se reemplaza. Mantener dos inventarios independientes
reproduce exactamente el problema de sobreventa que este proyecto existe para
eliminar.

## Observación de cumplimiento

La portada afirma "15+ años de experiencia". Los datos societarios confirmados
indican constitución en noviembre de 2015 e inicio de operaciones en abril de
2016, es decir alrededor de diez años a la fecha. La cifra debe corregirse antes
de publicar: las afirmaciones al consumidor son materia de fiscalización de
Indecopi.

Se mantienen vigentes los dos hallazgos críticos de la propuesta técnica: el
Libro de Reclamaciones del sitio actual sin destino funcional, y el módulo de
facturación servido sin certificado TLS.

## Próximo hito sugerido

Cerrar los ajustes de interfaz pendientes y, en paralelo, iniciar Fase 0
(cumplimiento legal) e iniciar el trámite de homologación con el proveedor de
facturación electrónica, que tiene plazos fuera de nuestro control.
