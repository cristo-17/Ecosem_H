# 17 · QA integral

**Rama:** `develop`

Lee primero `docs/PLAN-DE-PRUEBAS.md`, `CLAUDE.md` y
`.claude/skills/ecosem-design-system/SKILL.md`.

**Ejecutar después de la tarea 16**: sin navegación por rol no se puede recorrer
el sistema como lo haría una persona real.

## Objetivo

Recorrer el sistema completo como usuario, no como programador, y **reportar
todo lo que encuentres antes de arreglar nada**. Esta tarea es de diagnóstico.

## Método

**No arreglar sobre la marcha.** Primero el informe completo, luego decidimos
juntos qué se corrige en esta rama y qué se convierte en tarea aparte. Un
hallazgo de una línea se puede arreglar al paso, anotándolo; un rediseño no.

Crear `docs/QA-HALLAZGOS.md` con cada hallazgo numerado:

```
## H-001 · Título corto
Ruta · Rol · Viewport
Qué pasó / Qué debería pasar
Severidad: bloqueante | alta | media | baja
```

**Bloqueante** = impide completar una tarea. **Alta** = rompe una regla de
CLAUDE.md o del skill. **Media** = inconsistencia visible. **Baja** = cosmético.

## Recorridos

**Como pasajero, de punta a punta:** registro → ingresar → buscar viaje →
seleccionar asiento → datos → pago → confirmación → descargar boleto →
Mi perfil → cotizar encomienda → rastrear → ayuda → libro de reclamaciones.

**Como counter:** ingresar → panel → vender un pasaje presencial → generar su
boleto → arqueo de caja → viajes del día → generar manifiesto.

**Como supervisor:** todo lo de counter → precios (simulador y tope máximo) →
tarifario → flota → conductores → alertas (marcar una como atendida).

**Embarque:** elegir viaje → descargar manifiesto → escanear válido, repetido e
inválido → **desconectar la red y confirmar que sigue validando** → reconectar y
verificar sincronización.

## Revisiones transversales

En cada ruta visitada:

- 360×640, 768×1024 y 1440×900. Asertar `scrollWidth === clientWidth`.
- Consola sin errores ni advertencias nuevas.
- Foco visible en todo elemento enfocable; recorrer con Tab.
- Estado de carga, vacío y error donde corresponda.
- Botones de red con estado `loading`.
- Formato `S/ 00.00`, fechas y horas según el skill.
- Copy en español peruano, sin inglés filtrado.

## Revisiones específicas de reglas

- Ningún DNI completo en URL, ni en consola, ni en el boleto PDF.
- El manifiesto **sí** lleva documento completo (es la excepción documentada).
- Ningún `localStorage` para estado de reserva.
- Toasts de error que no se auto-cierran.
- `role="status"` en el contenedor de skeletons, no en cada uno.
- Modal con focus trap y retorno de foco al cerrar.
- DatePicker: primera y última semana alineadas; probar febrero y un mes que
  empiece sábado.
- Ninguna cifra inventada: tarifas, RUC, años de experiencia, políticas.

## Coherencia entre módulos

Buscar contradicciones entre pantallas que hoy usan datasets mock
independientes (`docs/ESTADO.md` lista varias). Que dos módulos no se hablen es
esperado sin backend; que **muestren datos contradictorios al usuario** es un
hallazgo.

## Entregable

1. `docs/QA-HALLAZGOS.md` completo.
2. Resumen al final: cuántos hallazgos por severidad y cuáles recomiendas
   atacar primero.
3. `docs/PLAN-DE-PRUEBAS.md` actualizado con los casos que faltaban.
4. Registrar en `docs/BITACORA.md`.

**No abrir el PR hasta que revisemos el informe juntos.**
