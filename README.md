# Ecosem H

Ticketing and parcel platform for Ecosem H, an intercity bus operator serving
Lima, Cerro de Pasco and Huancayo (Peru).

The company also ships parcels (*encomiendas*) on the same routes. Both lines of
business are in scope.

**Interface language is Peruvian Spanish. Code, comments and docs are in English.**

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS v4 — design tokens in `app/globals.css` |
| Fonts | Inter via `next/font/google` (`latin` + `latin-ext`) |
| Database / Auth / Storage | Supabase (not yet configured) |
| Hosting | Cloudflare Pages (not yet configured) |
| Payments | Peruvian gateway — Culqi or Izipay, incl. Yape and Plin (not yet configured) |
| Invoicing | SUNAT-compliant OSE/PSE provider (not yet configured) |

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

Checks that must pass before every commit:

```bash
npx tsc --noEmit
npx eslint .
npm run build
```

## Project structure

```
app/                    App Router — every page.tsx is a route
  globals.css           Design tokens (colors, spacing, shadows)
  layout.tsx            Root layout, mounts TopBar + Footer
  not-found.tsx         On-brand Spanish 404
  styleguide/           Living reference of every base component
components/ui/          Base design-system components
components/             Composed components
lib/                    Utilities
  cn.ts                 Conditional class helper (no clsx/tailwind-merge)
  mock/                 Fake data — routes, trips, availability
.claude/skills/         Agent skills
CLAUDE.md               Project conventions for the coding agent
```

## Design system

**Read `.claude/skills/ecosem-design-system/SKILL.md` before touching any JSX or
CSS.** It holds the tokens, per-component rules, and the accessibility decisions
already ratified — including deliberate exceptions that should not be "fixed".

`/styleguide` renders every base component with all its states. Use it to review
changes without navigating the whole app.

## Current status

Frontend, mock data only. No backend wired up.

**Done**

- Design tokens: colors with documented AA contrast, navy-tinted shadow scale,
  spacing scale, typography.
- 11 base components: Button, Input, Select, DatePicker, Badge, Card, Modal,
  Toast, Skeleton, Stepper, EmptyState.
- Layout: TopBar with full-screen mobile menu, institutional Footer.
- Home: hero, search card, trust row, tabs, popular routes, parcel promo.
- Search results: filters, loading / empty / error states.
- TripCard with selected variant.
- `/libro-de-reclamaciones` with a working form.
- Placeholder pages for `/mis-viajes`, `/ayuda`, `/encomiendas/enviar`,
  `/encomiendas/rastrear`.

**Pending — purchase flow**

- Seat selection (two-deck bus map, reservation timer)
- Passenger details form
- Payment (Yape / Plin / card, boleta or factura)
- Purchase confirmation with QR ticket and PDF download
- Mis Viajes: real list replacing the placeholder

**Pending — parcels**

- Quote calculator (volumetric weight, weight brackets)
- Parcel tracking by waybill number with status timeline

**Pending — backend**

Everything in the Supabase, payments and invoicing rows above.

## Business rules that constrain the frontend

These are the reasons the project exists. They are enforced server-side, but the
UI must not contradict them. Full detail in `CLAUDE.md`.

- **No overselling.** A seat is reserved only inside a DB transaction with row
  locking. Temporary holds expire after 10 minutes.
- **Price is frozen** when a reservation starts. A cart in progress never changes
  amount.
- **Payment is confirmed by webhook only**, never by a browser redirect.
- **Boarding QR must validate offline.** Terminals at altitude have no guaranteed
  connectivity.
- **Personal data** (DNI, names, emails, phones) is covered by Peruvian Ley 29733.
  Never log it, never put it in URLs.

## Known open items

- Hero uses a generated SVG placeholder; a real fleet photograph is pending from
  the client.
- Parcel and excess-baggage price brackets are placeholders; the commercial team
  has not defined the amounts.
- A prior mobile app exists on Google Play from an external vendor. Whether it is
  integrated or replaced must be settled before the seat inventory goes live —
  two independent inventories would reproduce the overselling problem.
- Company founding year is inconsistent across sources (2012 / 2013 / 2015 /
  2016). Confirm before publishing it anywhere.
