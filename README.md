# Ecosem H

Plataforma de pasajes y encomiendas para Ecosem H (EMPCOSEM S.A.), transporte
interprovincial Lima – Cerro de Pasco – Huancayo.

**Interfaz en español peruano. Código, comentarios y docs en inglés
(excepto `/docs`, que va en español).**

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS v4 · Supabase · Cloudflare Pages ·
Culqi/Izipay · OSE/PSE para facturación. Detalle en `docs/ARQUITECTURA.md`.

## Arranque

```bash
npm install
npm run dev          # http://localhost:3000
```

Checks obligatorios antes de cada commit:

```bash
npx tsc --noEmit && npx eslint . && npm run build
```

## Estructura

```
app/                  Rutas (App Router)
  globals.css         Tokens de diseño
  styleguide/         Referencia viva de componentes
components/ui/        Componentes base
components/           Componentes compuestos
lib/mock/             Datos falsos (no hay backend aún)
docs/                 Documentación del proyecto
docs/prompts/         Prompts de tareas para el agente
.claude/skills/       Skills del agente
CLAUDE.md             Convenciones para el agente
```

## Antes de tocar código

1. Lee `.claude/skills/ecosem-design-system/SKILL.md` — tokens y reglas por componente.
2. Revisa `/styleguide` para reusar patrones ya implementados.
3. Lee `CLAUDE.md` — reglas de negocio que no se negocian.

## Estado

Frontend con datos mock. Sin backend. Ver `docs/ESTADO.md`.
