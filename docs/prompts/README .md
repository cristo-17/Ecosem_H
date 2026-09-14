# Prompts

Tareas para el agente de código. Un archivo por tarea.

Todo prompt asume que el agente primero:
1. Lee `.claude/skills/ecosem-design-system/SKILL.md`.
2. Revisa `/app/styleguide` para reusar patrones existentes.
3. Lee `CLAUDE.md`.

Y que antes de dar la tarea por terminada corre:
`npx tsc --noEmit && npx eslint . && npm run build`.

## Pendientes

| Archivo | Tarea |
|---|---|
| `01-linea-tiempo-encomienda.md` | Estados de rastreo con punto actual destacado |
| `02-perfil-usuario.md` | Mi perfil con historial de viajes y encomiendas |
| `03-pdf-boleto.md` | Rediseño del PDF del boleto |
| `04-libro-reclamaciones-footer.md` | Quitar del navbar, imagen oficial en footer |
| `05-nitidez-imagenes-nosotros.md` | Corregir calidad de imágenes del carrusel |
| `06-correccion-anios-experiencia.md` | Corregir el claim de años de experiencia |

## Convención

Al terminar una tarea, registrar en `docs/BITACORA.md`. Si hubo un fallo con
diagnóstico no obvio, registrarlo en `docs/FALLOS.md`.
