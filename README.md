# Money Manager

A personal finance web app: income, expenses, savings goals, budgets, reports, and (where officially supported) connected financial accounts.

## Stack

Next.js 16 (App Router, Turbopack, React Compiler) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) · Recharts · Lucide · Prisma + PostgreSQL · Auth.js · Zod · decimal.js

## Getting started

```bash
npm install
cp .env.example .env.local   # fill values as each phase requires them
npm run dev                  # http://localhost:3000
```

| Script              | Purpose                          |
| ------------------- | -------------------------------- |
| `npm run dev`       | Dev server (Turbopack)           |
| `npm run build`     | Production build                 |
| `npm run typecheck` | `tsc --noEmit`                   |
| `npm run lint`      | ESLint                           |
| `npm run check`     | Typecheck + lint                 |

## Project structure

```
src/
  app/                      Routes (App Router)
    (auth)/                 Sign-in / register            (Phase 3)
    (app)/                  Authenticated area + sidebar  (Phase 4+)
    api/                    Route handlers (auth, CSV export, provider callbacks)
  components/
    ui/                     shadcn/ui primitives (generated, lightly edited)
    providers/              Client providers (theme, tooltip, toasts)
    layout/ dashboard/ ...  Feature components            (later phases)
  config/                   Site config, navigation
  features/<domain>/        Business logic per domain     (Phase 5+)
    actions.ts              Server Actions (auth check + Zod + service call)
    service.ts              Pure domain logic, user-scoped Prisma queries
    schemas.ts              Zod schemas shared by forms and server
  lib/                      Cross-cutting: env, money, db, auth helpers
  server/integrations/      Financial provider adapters   (Phase 7)
prisma/                     Schema + migrations           (Phase 2)
```

## Money handling

Amounts are never JS floats. They are stored as PostgreSQL `NUMERIC`, computed with `decimal.js` (`src/lib/money.ts`), and passed between server and client as strings.

See [PROGRESS.md](./PROGRESS.md) for the phase-by-phase roadmap.
