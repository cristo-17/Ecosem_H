# Cómo contribuir

## Flujo de ramas

```
main        Código estable
develop     Integración
feature/*   Una rama por tarea de docs/prompts/
spike/*     Código desechable que responde una pregunta
```

Una rama por tarea de `docs/prompts/`. PR contra `develop`. Ningún cambio llega a
producción sin pasar por preview:

```
desarrollo  →  preview por rama  →  producción
```

## Antes de cada commit

```bash
npx tsc --noEmit && npx eslint . && npm run build
```

## Más detalle

- [`docs/GIT.md`](docs/GIT.md): flujo de ramas, conflictos y cómo se resolvieron.
- [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md): ambientes y despliegue.
- [`CLAUDE.md`](CLAUDE.md): reglas que no se negocian del proyecto.
