# Socialella

Solo-founder social media queue — compose once, tune per platform, and ship posts manually while v1 focuses on scaffolding (copy → composer → mark posted). Opinionated for sustainable promo cadence, confidence-aware drafting, and a lightweight safety kit.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- Radix UI primitives + accessible UI patterns
- Phosphor icons via `src/components/Icon.tsx`
- Neon Postgres + Drizzle ORM
- Auth.js (NextAuth v5) with a single credential password
- Vercel Blob + `sharp` for EXIF-safe images
- Vercel Cron + optional Resend digest email

## Local setup

1. **Install**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env.local` and fill values:

   | Variable | Purpose |
   | --- | --- |
   | `DATABASE_URL` | Neon connection string (Vercel Marketplace → Neon) |
   | `AUTH_SECRET` | Random string (`openssl rand -base64 32`) |
   | `APP_PASSWORD_HASH` | `bcrypt` hash of your solo password |
   | `BLOB_READ_WRITE_TOKEN` | From Vercel Blob |
   | `CRON_SECRET` | Shared secret for `/api/cron/dispatch` |
   | `RESEND_API_KEY` | Optional digest emails |
   | `AI_GATEWAY_API_KEY` or `OPENAI_API_KEY` | Optional AI rewrite in Compose |

   Generate a password hash:

   ```bash
   node -e "const b=require('bcryptjs');b.hash(process.argv[1],10).then(console.log)" 'your-strong-password'
   ```

3. **Database**

   Push schema to Neon (or run generated SQL in `drizzle/`):

   ```bash
   npm run db:push
   ```

4. **Develop**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000/login](http://localhost:3000/login).

## Deploy on Vercel

1. Import the GitHub repo.
2. Add Neon + Blob via Vercel integrations so `DATABASE_URL` / `BLOB_READ_WRITE_TOKEN` are injected.
3. Set `AUTH_SECRET`, `APP_PASSWORD_HASH`, `CRON_SECRET`, and optional AI / Resend keys.
4. After deploy, run `npm run db:push` locally pointed at production `DATABASE_URL`, or use Drizzle migrate in CI.
5. Cron: `vercel.json` schedules `/api/cron/dispatch` every 15 minutes. Add the same `CRON_SECRET` value in Vercel → Cron → environment so the handler authorizes requests.

### Preview URLs show “couldn’t load” / 500

If **Production** has `DATABASE_URL`, `AUTH_SECRET`, `APP_PASSWORD_HASH`, and `CRON_SECRET` but **Preview** does not, every Git preview deployment will crash when you open the app (the dashboard calls the database). In Vercel: **Settings → Environment Variables** → open each variable → under **Environments**, enable **Preview** (and **Development** if you use `vercel dev`) with the same values, then **Redeploy**.

## Product notes

- **Scaffold publishing**: scheduling moves posts to **Ready to post**; you copy text and open deep links, then **Mark posted**.
- **Confidence pass**: rule-based hedging detection on base copy (AI optional later).
- **Safety kit**: images are stripped of EXIF/GPS on upload; optional harassment evidence log + ZIP export.
- **Evergreen**: cron can duplicate evergreen **posted** rows into drafts after a cooldown (see Settings).

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:generate` | Emit SQL from Drizzle schema |
| `npm run db:push` | Push schema to the database |
| `npm run db:studio` | Drizzle Studio |

## License

Private / All rights reserved unless you add a license.
