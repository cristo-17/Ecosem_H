# Git

## Flujo de ramas

```
main        Código estable
develop     Integración
feature/*   Una rama por tarea de docs/prompts/
spike/*     Código desechable que responde una pregunta
```

Una rama por tarea de `docs/prompts/`. PR contra `develop`. Ningún cambio llega a
producción sin pasar por preview. Resumen para quien contribuye en
[`CONTRIBUTING.md`](../CONTRIBUTING.md).

**Nota sobre el historial.** Los PRs #1 a #10 (2026-09-15) se unieron a `main`,
no a `develop`, y desde `0222506` (2026-10-17) los commits van directo a `main`
sin rama ni PR. `develop` está 34 commits detrás de `main` (último commit en
`develop`: `e5407e4`, 2026-09-14). El flujo escrito arriba es la regla; el
historial no la sigue desde entonces.

## Conflictos y cómo los resolvimos

### 77 archivos sin commitear repartidos por tarea

- **Qué pasó.** Trabajo de varias tareas acumulado en el árbol sin commitear se
  repartió en commits por tarea. En el historial son **cuatro** commits con 77
  archivos en total, hechos el 2026-10-19 entre las 22:23:06 y las 22:24:57:

  | Orden | Commit    | Tarea                                                     | Archivos |
  |-------|-----------|-----------------------------------------------------------|----------|
  | 1     | `6c48fa6` | docs: versionar `docs/` con el repositorio                | 31       |
  | 2     | `eaf4b43` | fix(perfil): Mis encomiendas sin guías inventadas          | 3        |
  | 3     | `fcafa82` | feat(encomiendas): registro, estados y entrega; rastreo   | 22       |
  | 4     | `c5eeab0` | feat(embarque): QR firmado sin conexión y manifiesto real  | 21       |

  Ningún archivo aparece en dos commits: cada archivo compartido entró entero en
  uno solo. El siguiente commit, `ad32a23` (`package-lock.json`, 23:48), es
  posterior y no forma parte del reparto; con él serían cinco commits y 78
  archivos.

- **Por qué ese orden.** Comprobado el 2026-10-21 compilando cada commit en un
  worktree aparte (`npx next typegen && npx tsc --noEmit`): los cuatro pasan sin
  errores. Y probando los órdenes alternativos con `cherry-pick --no-commit`:

  | Orden alternativo                    | Resultado | Motivo                                                                                                     |
  |--------------------------------------|-----------|------------------------------------------------------------------------------------------------------------|
  | encomiendas (`fcafa82`) antes que perfil | 2 errores | `fcafa82` borra `lib/mock/encomiendas.ts`, que `MisEncomiendasTab.tsx` importaba hasta `eaf4b43`.       |
  | embarque (`c5eeab0`) antes que encomiendas | 6 errores | `lib/api/operacion.ts` importa `conCuenta`, que se exporta en `fcafa82`; y `c5eeab0` quita de `lib/pdf/boleto.ts` las funciones del boleto mock que la `VentaView` anterior a `fcafa82` todavía usaba. |
  | perfil antes que docs               | 0 errores | `6c48fa6` solo toca `docs/` y `.gitignore`; podía ir en cualquier lugar.                                   |

  La cadena es perfil → encomiendas → embarque, impuesta por los imports. Docs
  va primero sin que ningún import lo exija.

- **Archivos compartidos.** Archivos de un commit que el código de otra tarea
  necesita para compilar. Criterio que muestra el historial: el archivo va en el
  commit de la tarea que lo cambió, y ese commit va antes que cualquier otro que
  dependa del cambio.

  | Archivo                                 | Commit    | Qué tiene de otra tarea                                                                                  |
  |-----------------------------------------|-----------|----------------------------------------------------------------------------------------------------------|
  | `components/perfil/MisEncomiendasTab.tsx` | `eaf4b43` | Deja de importar `lib/mock/encomiendas.ts`, que borra encomiendas.                                      |
  | `lib/api/cuenta.ts`                     | `fcafa82` | Exporta `conCuenta` con parámetro `servicio`; lo usan caja y encomiendas, y en embarque `operacion.ts`, `useEstadoSincronizacion.ts` y las vistas de viajes. |
  | `lib/api/cliente.ts`                    | `fcafa82` | `Servicio` suma `"encomiendas"`; `operacion.ts` de embarque importa el mismo cliente.                    |
  | `lib/auth/sesion.ts`                    | `fcafa82` | Agrega `terminalId` (lo usa `EncomiendasView`); embarque importa `obtenerSesion` en `viajes/page.tsx`.   |
  | `lib/routes.ts`                         | `fcafa82` | Agrega `panelEncomiendas`; lo importan perfil, encomiendas y embarque.                                  |
  | `app/panel/venta/VentaView.tsx`         | `fcafa82` | Venta en counter: deja `lib/mock/caja.ts` y el boleto mock de `lib/pdf/boleto.ts`.                       |
  | `lib/pdf/boleto.ts`                     | `c5eeab0` | Quita el boleto mock y la firma HMAC (`lib/firma.ts`); exige que venta ya no los use.                   |

- **No reconstruible desde el repositorio.** La lista de arriba es una
  reconstrucción a partir del código; no hay registro de qué siete archivos se
  marcaron como compartidos en su momento ni del criterio con que se decidió cada
  uno, así que puede no coincidir con la decisión original. Tampoco quedó
  registrada la comprobación de que el árbol final tenía el mismo hash que el
  estado previo: ese estado no se guardó en ningún commit ni stash, así que hoy
  no se puede repetir. El árbol de `c5eeab0` es
  `ec1d1f294197724210cecca6f5bfd04f509c2315` (`git rev-parse c5eeab0^{tree}`).

**Cómo repetirlo en el próximo reparto.**

```sh
# hash del estado previo, con archivos nuevos incluidos, sin tocar el índice real
GIT_INDEX_FILE=.git/indice-reparto git add -A
GIT_INDEX_FILE=.git/indice-reparto git write-tree   # anotar
rm .git/indice-reparto

# ...commits por tarea...

git rev-parse 'HEAD^{tree}'            # debe coincidir con el anotado
git worktree add --detach ../reparto <primer-commit>
# por cada commit: git -C ../reparto checkout --detach <commit>
#                  npx next typegen && npx tsc --noEmit
git worktree remove ../reparto
```

El índice temporal arranca vacío, así que `git add -A` lo llena con todo lo no
ignorado; si algo debía quedar fuera del reparto, el hash no coincidirá y
`git diff --stat <hash-anotado> HEAD` dice qué. El worktree no trae
`node_modules`: enlazarlo al del repositorio (junction en Windows) y no
borrarlo con `rm -rf`, que vaciaría el original.
