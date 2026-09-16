# Ecosem H

Plataforma web de venta de pasajes y gestión de encomiendas para **Ecosem H**
(EMPCOSEM S.A.), empresa de transporte interprovincial que opera las rutas
Lima – Cerro de Pasco – Huancayo.

El proyecto cubre tanto la experiencia del pasajero como las herramientas
internas de counter, supervisión y embarque.

> **Estado:** frontend completo con datos simulados. El backend (base de datos,
> pasarela de pagos y facturación electrónica) aún no está integrado.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Estilos | Tailwind CSS v4 con tokens propios en `app/globals.css` |
| Tipografía | IBM Plex Sans vía `next/font/google` |
| PDF y QR | `pdf-lib` + `qrcode` |
| Base de datos y auth | Supabase *(pendiente de integrar)* |
| Hosting | Cloudflare Pages *(pendiente de configurar)* |
| Pagos | Pasarela peruana — Culqi o Izipay, con Yape y Plin *(pendiente)* |
| Facturación | Proveedor OSE/PSE homologado ante SUNAT *(pendiente)* |

**Idiomas:** la interfaz está íntegramente en español peruano. El código, los
comentarios y los nombres de archivo están en inglés.

---

## Puesta en marcha

```bash
npm install
npm run dev          # http://localhost:3000
```

Verificaciones que deben pasar antes de cada commit:

```bash
npx tsc --noEmit
npx eslint .
npm run build
```

---

## Estructura

```
app/
  globals.css              Tokens del sistema de diseño
  layout.tsx               Layout raíz
  styleguide/              Referencia viva de todos los componentes base
  pasajes/                 Búsqueda, resultados y flujo de compra
  encomiendas/             Cotizador y rastreo
  mi-perfil/               Historial de viajes y encomiendas
  panel/                   Herramientas internas (counter y supervisión)
  embarque/                PWA de validación de boletos
components/
  ui/                      Componentes base del sistema de diseño
  layout/                  TopBar, Footer, navegación por rol
  ...                      Componentes compuestos por dominio
lib/
  auth/                    Sesión y roles
  pdf/                     Generación de boleto y manifiesto
  mock/                    Datos simulados mientras no hay backend
```

`/styleguide` renderiza cada componente base con todos sus estados. Es la
referencia a consultar antes de escribir interfaz nueva.

---

## Funcionalidades

### Pasajero

- Búsqueda de viajes por ruta, fecha y número de pasajeros
- Resultados con filtros y estados de carga, vacío y error
- Flujo de compra: selección de asiento, datos, pago y confirmación
- Boleto en PDF con código QR firmado y datos personales enmascarados
- Cotizador de encomiendas con cálculo de peso volumétrico
- Rastreo de encomiendas con línea de tiempo de cuatro estados
- Perfil con historial de viajes y envíos
- Libro de Reclamaciones virtual (obligatorio por Ley 29571)
- Página institucional, ayuda y condiciones de contratación

### Counter

- Venta presencial con el mismo inventario y el mismo boleto que la web
- Arqueo de caja por agencia, turno y usuario
- Listado de viajes del día
- Generación automática del manifiesto SUTRAN en PDF

### Supervisión

- Motor de precios por reglas explícitas, con topes y auditoría de cambios
- Tarifario de encomiendas y exceso de equipaje
- Gestión de flota y conductores con alertas escalonadas de vencimientos

### Embarque

- PWA instalable con lector de QR por cámara
- **Validación completamente offline**, con sincronización diferida al recuperar
  señal

---

## Reglas de negocio

Estas reglas son la razón de ser del proyecto. Se aplican en el servidor, y la
interfaz nunca debe contradecirlas.

- **Sin sobreventa.** Un asiento se reserva únicamente dentro de una transacción
  con bloqueo de fila. Las reservas temporales expiran a los 10 minutos.
- **Precio congelado.** El monto se fija al iniciar la reserva. Un carrito en
  curso jamás cambia de precio.
- **Pago confirmado por webhook.** Nunca por una redirección del navegador. Toda
  escritura del webhook es idempotente.
- **QR validable sin conexión.** Los terminales de altura no tienen cobertura
  garantizada.
- **Datos personales protegidos.** DNI, nombres, correos y celulares están
  cubiertos por la Ley 29733: no se registran en logs ni se exponen en URLs.
- **Sin cifras inventadas.** Tarifas, datos societarios y textos legales
  provienen de fuentes verificadas o se marcan como pendientes.

---

## Accesibilidad

El usuario objetivo compra desde un Android de gama media con conexión
inestable. El desarrollo es mobile-first y se verifica en 360×640, 768×1024 y
1440×900.

- Contraste WCAG AA en todo par de texto y fondo
- Área táctil mínima de 44 × 44 px
- Foco visible y navegación completa por teclado
- Focus trap en modales y menús a pantalla completa
- Semántica correcta: `aria-current`, `aria-expanded`, `role="status"`

---

## Flujo de ramas

```
main        Código estable
develop     Integración
feature/*   Una rama por tarea
```

Ningún cambio llega a `main` sin haber pasado por `develop`.

---

## Autores

- Cristopher Cochachi Flores — [@cristo-17](https://github.com/cristo-17)
- José Quilcat — [@uknwmynam3](https://github.com/uknwmynam3)
- Jhon Kenyer Contreras Mayta - [@kenyerOwO](https://github.com/kenyerOwO)