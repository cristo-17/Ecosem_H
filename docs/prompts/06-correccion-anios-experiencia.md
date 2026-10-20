# 06 · Corregir el claim de años de experiencia

## Problema

La portada afirma **"15+ años de experiencia"** en el TrustRow. Los datos
societarios confirmados son:

- Constitución jurídica: **noviembre de 2015** (EMPCOSEM S.A.)
- Inicio de operaciones: **abril de 2016**

A septiembre de 2026 son aproximadamente **diez años**, no quince. La guía de
diseño heredada v1.4 también arrastra "desde 2012" en el texto del footer.

Esto no es un detalle estético: es una afirmación publicitaria al consumidor y
cae bajo fiscalización de Indecopi, igual que los dos hallazgos críticos que ya
identifica la propuesta técnica.

## Tarea

1. **Buscar en todo el proyecto** cualquier mención a años de experiencia,
   antigüedad o año de fundación: TrustRow, footer, `/nosotros`, metadatos,
   textos mock. Listar todas las ocurrencias encontradas antes de editar.
2. **Corregirlas** para que sean consistentes con 2015/2016.
3. **No inventar** una cifra nueva. Si la redacción exacta no está definida,
   usar "10+ años de experiencia" y dejarlo anotado como pendiente de
   confirmación comercial en `docs/ESTADO.md`.

## Alternativa a considerar

Un claim numérico envejece y hay que mantenerlo. Si el área comercial lo
aprueba, puede reemplazarse por algo no numérico y equivalente en fuerza, por
ejemplo "Experiencia en la sierra central". Proponerlo, pero **no aplicarlo sin
confirmación**: el copy institucional no se cambia por criterio técnico.

## Restricciones

- No modificar misión ni visión: son textos provistos y van literales.
- No tocar el resto del copy de la portada.
- Copy en español peruano.

## Verificación

- Buscar el string en todo el repositorio y confirmar que no quedan restos.
- Registrar el cambio en `docs/BITACORA.md`.
- `npx tsc --noEmit && npx eslint . && npm run build` pasan.
