# Digital Card

NFC digital business cards. Each physical card (NXP NTAG215) carries one permanent URL,
`https://<your-domain>/c/<CODE>`. The server maps code → card → profile, so owners can change
their profile and lost cards can be switched off without rewriting the chip.

- **Visitors** tap a card or scan its QR code and see the owner's profile. No app, no login.
  They can save the contact (vCard) and, if the owner allows it, share their own contact back.
- **Owners** activate cards, edit profiles with a live preview, manage links, see tap stats,
  and collect leads.
- **Admins** create card batches (CSV for NFC writing and printing), manage cards and users.

**Stack:** Next.js 16 (App Router, Cache Components), TypeScript, Tailwind v4, shadcn/ui,
Neon (Postgres, Neon Auth, Object Storage), Drizzle ORM, next-intl, Zod, react-hook-form,
Vitest, Playwright. Hosted on Vercel.

## Local development

Prerequisites: Node 24+, pnpm (`npm i -g pnpm`), the Neon CLI (`npm i -g neon`) signed in
with `neon login`.

```bash
pnpm install
neon env pull            # writes the Neon vars into .env.local (database, auth, storage)
```

Then add the app's own values to `.env.local` (see `.env.example`):

| Variable                           | What it is                                                                                                 |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`             | Base URL, no trailing slash. `http://localhost:3000` locally.                                              |
| `NEON_AUTH_COOKIE_SECRET`          | 32+ random characters: `openssl rand -base64 32`.                                                          |
| `CONTACT_EMAIL`                    | Shown on `/privacy` for PDPA requests. Optional locally, required in production.                           |
| `NEON_PROJECT_ID`/`NEON_BRANCH_ID` | IDs of the Neon project and branch (`neon branches list`).                                                 |
| `NEON_API_KEY`                     | Project-scoped Neon API key, used only for "Delete my account". See [Account deletion](#account-deletion). |

```bash
pnpm db:migrate          # apply drizzle/ migrations
pnpm db:seed             # optional: a batch of 5 unclaimed cards to try activation with
pnpm dev                 # http://localhost:3000
```

Sign in once at `/login`, then make yourself an admin:

```bash
pnpm admin:promote you@example.com
```

### Scripts

| Command                                                  | Does                                                     |
| -------------------------------------------------------- | -------------------------------------------------------- |
| `pnpm dev` / `build` / `start`                           | Next.js                                                  |
| `pnpm lint` / `typecheck` / `format` / `format:check`    | ESLint, `next typegen && tsc`, Prettier                  |
| `pnpm test`                                              | Vitest unit tests (`tests/unit`)                         |
| `pnpm test:e2e`                                          | Playwright smoke tests against a running app (see below) |
| `pnpm db:generate`                                       | New migration from changes to `src/lib/db/schema.ts`     |
| `pnpm db:migrate`                                        | Apply migrations (uses `DATABASE_URL_UNPOOLED`)          |
| `pnpm db:studio` / `db:seed`                             | Drizzle Studio / dev seed data                           |
| `pnpm cards:generate --batch "Batch Nov 2026" --qty 100` | Create a batch and write `out/batch-nov-2026.csv`        |
| `pnpm admin:promote <email>`                             | Give an existing user admin access (needs the Neon CLI)  |

### Tests

```bash
pnpm test                                        # unit tests, no database needed
pnpm test:e2e                                    # starts or reuses `pnpm dev` on :3000
E2E_PROFILE_SLUG=your-slug pnpm test:e2e         # also checks a published profile and its vCard
E2E_BASE_URL=https://preview.example.com pnpm test:e2e
```

CI (GitHub Actions) runs format, lint, typecheck, unit tests and build on every push and pull
request. It uses placeholder env values and never connects to Neon, so e2e tests don't run there.

## Cards

1. **Create a batch** in `/admin/batches` (or `pnpm cards:generate`). The CSV has `code`, `url`
   (for the chip) and `qr_url` (`…?src=qr`, for printing).
2. **Write the chip** with any NFC writer app: one NDEF **URI record** containing `url`, nothing
   else. A single URI record is what lets iPhones read the card without opening an app.
   Lock the tag after writing if you don't plan to reuse it.
3. **First tap** opens `/activate/<CODE>`: the owner signs in, creates a profile and the card
   is theirs. Later taps go straight to the profile.

> Choose your production domain **before** writing chips. The URL on a card can't change.

## Deploying to production

### 1. Neon

The `production` branch of the Neon project is the production database. Apply migrations
before each deploy that includes new ones:

```bash
pnpm db:migrate
```

Production checklist for Neon Auth:

```bash
neon neon-auth domain add https://your-domain.com             # trusted redirect domain
neon neon-auth config email-provider update …                 # your own SMTP (see --help)
neon neon-auth oauth-provider update …                        # your own Google OAuth client
neon neon-auth config email-password update --enabled false   # the app signs in with email codes and Google only
```

- **Email:** Neon's shared sender is rate-limited and meant for development. Configure your own
  SMTP (e.g. Resend, Postmark) before launch, then `neon neon-auth config email-provider test`.
- **Google:** the shared development credentials are for development only. Create an OAuth
  client in Google Cloud, using the redirect URI shown for Google in the Neon console
  (_Auth → OAuth providers_), and set it with `oauth-provider update`.
- **Email and password sign-up** must stay off. The app never uses it, and leaving it on lets
  anyone register an address they don't own with a password.

### 2. Vercel

1. Push the repository to GitHub and import it in Vercel (framework preset: Next.js).
2. Add the environment variables for **Production** (and **Preview** if you use it): everything
   in your `.env.local`, with `NEXT_PUBLIC_SITE_URL=https://your-domain.com` and the production
   branch's Neon values (`neon env pull --branch production`).
3. Deploy. `GET /api/health` reports database, storage and auth status.
4. **Domain:** in Vercel go to _Settings → Domains_, add `your-domain.com` and set the DNS
   records it shows. Then add the same domain to Neon Auth's trusted domains (above).

### Account deletion

Neon Auth doesn't let users delete themselves, so `Settings → Delete account` calls the Neon API
(the same call as `neon neon-auth user delete`). Create a key that can only access this project:

```bash
neon api-keys create --name dbc-account-deletion --project-id <project-id>
```

Put it in `NEON_API_KEY` (`.env.local` and Vercel). Without it the app works, but account
deletion shows "isn't set up yet". Deleting an account removes the auth user (which cascades to
profiles, links, taps and leads), switches the user's cards off, and deletes their images.

## Privacy (PDPA)

- `/privacy` carries the notice in English and Malay (PDPA s.7(3) requires both). Have it reviewed
  before launch and set `CONTACT_EMAIL`.
- Taps never store IP addresses. Leads need explicit consent and are visible only to the
  profile owner, who can delete them individually.
- Owners can delete their account and all its data from Settings.

## Project layout

See [CLAUDE.md](CLAUDE.md) for folder conventions and coding rules.
