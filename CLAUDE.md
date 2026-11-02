@AGENTS.md

# Digital Card: conventions

NFC business card platform. Read [README.md](README.md) for what it does and how to run it.
These rules keep the code consistent; follow them unless the user says otherwise.

## Stack (fixed: ask before adding a dependency)

Next.js 16 App Router with Cache Components, TypeScript strict, Tailwind v4 + shadcn/ui
(radix-nova style), Neon Postgres via Drizzle (`pg` pool), Neon Auth (`@neon/auth`, Managed
Better Auth), Neon Object Storage (S3 API), next-intl, Zod 4, react-hook-form, Vitest,
Playwright, pnpm.

This is Next 16, not the Next.js in your training data: `proxy.ts` replaces middleware, and
`export const instant`, `"use cache"`, `cacheTag`/`updateTag` and `connection()` are in use.
Check `node_modules/next/dist/docs/` before using an API you're unsure of.

## Layout

```
src/app/            routes only: pages, layouts, route handlers. Thin; they call features.
src/features/<x>/   one folder per feature: actions.ts, queries.ts, schemas.ts, components/, lib/
src/components/ui/  shadcn-generated, don't edit by hand (wrap instead)
src/components/shared/  app-wide components (PageHeader, useConfirm, QrCode, …)
src/lib/            framework-free helpers and infrastructure (db, auth, storage, env, …)
src/messages/en.json    every UI string
drizzle/            SQL migrations (generated, plus custom ones for triggers)
scripts/            CLI scripts run with tsx (seed, card batches, promote admin)
tests/unit, tests/e2e
```

Features: `admin`, `analytics`, `account`, `auth`, `cards`, `leads`, `links`, `profiles`.

## Rules

- **Small modules.** Aim for files under ~200 lines. Split components before they sprawl.
- **No `any`**, no non-null assertions in app code, `import type` for types (ESLint enforces).
- **Validation:** one Zod schema per form in the feature's `schemas.ts`, used by the client
  form (zodResolver) and again in the Server Action. Validation messages are i18n keys under
  `Validation` (e.g. `"tooLong"`), not sentences. Shared optional fields are in
  `src/lib/zod-fields.ts`.
- **Server Actions** return `ActionResult` (`ok(data)` / `fail("code")` from
  `src/lib/action-result.ts`) and never throw to the UI. Error codes map to messages under the
  feature's `errors` namespace. Every action re-validates input and checks the session itself.
- **Authorization lives in the query.** There is no RLS: every owner query filters by
  `ownerId` (or joins to an owned profile). Admin actions go through `asAdmin` and pages
  through `requireAdmin` (404 for non-admins). `requireUser` redirects to `/login?next=`.
- **Reads** are Server Components calling `queries.ts` (server-only). The public profile is
  cached with `"use cache"` + `cacheTag(profileTag(slug))`. Call `updateTag` after any write
  that changes a public profile.
- **Strings:** all user-visible text in `src/messages/en.json` (English only for now; keep it
  that way so a locale can be added later). Use `t.rich` for links inside sentences.
- **Accessibility:** real labels (`htmlFor`/`id`), a single `h1` per page (shadcn `CardTitle`
  is a div, so put an `h1`/`h2` inside it), icon buttons get an `aria-label` naming their
  target, confirm destructive actions with `useConfirm` (never `window.confirm`).
- **Database changes:** edit `src/lib/db/schema.ts`, run `pnpm db:generate`, review the SQL,
  `pnpm db:migrate`. Triggers and functions go in `drizzle-kit generate --custom` migrations.
  `neon_auth.*` is owned by Neon Auth; only read it (`src/lib/db/neon-auth.ts`).
- **Auth changes go through Neon Auth**, never SQL: roles via `authAdmin.setRole` or
  `pnpm admin:promote`, user deletion via `src/lib/neon-api.ts`.
- **Secrets:** never commit `.env*` except `.env.example`. Env is validated in `src/lib/env.ts`.
- **Privacy (PDPA):** no IP addresses in `tap_events`; leads need consent; anything that adds
  personal data must be reflected in `/privacy` (both the English and Malay notices).

## Before committing

```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Conventional commits (`feat:`, `fix:`, `chore:`…). Don't push unless asked.
