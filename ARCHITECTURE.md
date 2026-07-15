# MediaFlow — Architecture

## 1. Product scope and a deliberate deviation from the original brief

MediaFlow is a media workspace SaaS: users upload or import video/audio they
own the rights to, and the platform organizes, transcodes, tags, and shares
it. Subscriptions, storage quotas, an admin panel, and a processing pipeline
all mirror a typical "cloud media" SaaS.

**Deviation:** an earlier version of this brief specified a "download
engine" that would detect URLs from third-party streaming platforms (e.g.
YouTube), fetch available formats, and let subscribers bulk-download that
content. That model is functionally a commercial stream-ripping service —
the same business model behind FLVTO, Yout.com, and 2Conv, all of which were
sued and shut down for copyright infringement and circumventing platform
Terms of Service. MediaFlow does not implement that. Instead, all media
enters the system through sources the user owns or has explicit rights to
(direct upload, or import from a cloud drive the user has authorized) — see
`src/modules/media/adapters/`. The rest of the product spec (subscriptions,
folders, collections, AI tagging, admin panel, etc.) is unaffected and
implemented as specified.

## 2. Tech stack

| Concern        | Choice                                            |
| --------------- | -------------------------------------------------- |
| Framework       | Next.js 15 (App Router) + React 19 + TypeScript    |
| UI              | TailwindCSS v4, shadcn/ui primitives, Framer Motion |
| Forms/validation| React Hook Form + Zod                              |
| Server state    | TanStack Query (client), Next.js Route Handlers + Server Actions (server) |
| Database        | PostgreSQL (Supabase-hosted), Prisma ORM 6.x       |
| Auth            | Auth.js (NextAuth v5) + Prisma adapter             |
| Storage         | Cloudflare R2 (S3-compatible, via AWS SDK v3)      |
| Cache           | Redis (ioredis)                                    |
| Queue/Jobs      | BullMQ, workers as separate Node processes         |
| Payments        | Stripe                                             |
| Email           | Resend + react-email                               |
| Analytics       | PostHog                                            |
| Monitoring      | Sentry                                             |
| Hosting         | Vercel (app), Supabase (Postgres), a small always-on host or Vercel background function for BullMQ workers |

**Backend:** Next.js API routes / Server Actions were chosen over a separate
NestJS service. A single deployable keeps the surface area small for a
project this size; the modular boundaries below (`src/modules/*`) mean a
domain can be extracted into its own service later without a rewrite if
scale requires it.

### Notable version decisions

- **Prisma 6.x, not 7.x.** Prisma 7 (current latest) moved the datasource
  connection string out of `schema.prisma` into `prisma.config.ts` and
  requires an explicit driver adapter. It's very recently released and less
  battle-tested with the wider ecosystem (`@auth/prisma-adapter`, Supabase
  docs, etc.), so 6.x is the safer production choice today.
- **shadcn/ui components are hand-written, not CLI-generated.** This
  environment's network policy blocks `ui.shadcn.com`, so components in
  `src/components/ui/` are written directly from the standard shadcn
  "new-york" source rather than fetched via `pnpm dlx shadcn add`. They are
  functionally identical and follow the same conventions, so the CLI can be
  used normally in any environment that does have access.

## 3. Folder structure

```
src/
  app/                        Next.js App Router
    (marketing)/               Public site: landing, pricing, blog
    (auth)/                    Login, register, password reset, verify (Phase 3)
    (dashboard)/                User dashboard, library, folders (Phase 6)
    (admin)/                    Super admin panel (Phase 7)
    api/                        Route handlers (webhooks, REST API, uploads)
  components/
    ui/                        shadcn/ui primitives (button, card, input, ...)
    marketing/                 Landing page sections
    providers/                 App-wide client providers (theme, query, toasts)
  lib/                         Cross-cutting infrastructure singletons
    db.ts                      Prisma client
    redis.ts                   Cache Redis client
    env.ts                     Typed, validated environment variables
    queue/                     BullMQ queues + shared connection
    storage/                   R2 client
    stripe/                    Stripe client
    email/                     Resend client
  modules/                     Domain logic, framework-agnostic where possible
    media/
      adapters/                Pluggable import-source adapters (see below)
  workers/                     BullMQ worker entrypoints (run as separate processes)
prisma/
  schema.prisma                Full data model (Phase 2)
  seed.ts                      Baseline data (plans, etc.)
e2e/                           Playwright end-to-end tests
```

Route groups (`(marketing)`, `(auth)`, `(dashboard)`, `(admin)`) don't affect
URLs — they let each surface have its own layout (nav/sidebar) without
duplicating chrome.

### The adapter pattern (media import sources)

`src/modules/media/adapters/types.ts` defines `MediaSourceAdapter`, the
contract every import source implements: `supports()`, `probe()` (return
metadata without importing), and `import()` (stream bytes into R2). Adding a
new source — e.g. a Dropbox import, or a webhook-based upload from a
partner tool — means writing one adapter and registering it in
`registry.ts`. No route, queue, or UI code needs to change. This directly
satisfies the "modular, so additional provider integrations can be added
without changing the rest of the application" requirement from the original
spec, scoped to sources the user has rights to.

## 4. Processing pipeline

Uploads/imports are asynchronous, coordinated through BullMQ queues backed
by Redis:

1. Client requests a presigned R2 upload URL (or the adapter streams a
   cloud-import directly).
2. On completion, a `media-processing` job is enqueued: transcode to the
   requested output formats (MP4/WEBM for video, MP3/M4A for audio),
   generate a thumbnail, extract duration/metadata.
3. An `ai-tagging` job runs after processing: filename suggestions, tags,
   language detection, duplicate detection, optional transcript/summary.
4. An `emails` job notifies the user on completion or failure.

Workers are separate Node processes (`src/workers/*.worker.ts`, built and
run via `pnpm worker:media`), independently scalable from the web app and
deployable as a long-running container (Vercel serverless functions cannot
run persistent BullMQ workers).

## 5. Security baseline

- Strict CSP, HSTS, X-Frame-Options, and related headers set in
  `next.config.ts`.
- All environment variables are validated at boot via `@t3-oss/env-nextjs`
  (`src/lib/env.ts`) — the app fails fast on missing/malformed config
  instead of behaving unpredictably in production.
- Secrets never committed (`.env*` is gitignored; `.env.example` documents
  required variables).
- Auth, rate limiting, RBAC, and 2FA land in Phase 3.

## 6. Local development

```bash
cp .env.example .env        # fill in secrets as needed
docker compose -f docker-compose.dev.yml up -d   # Postgres + Redis only
pnpm install
pnpm db:push                 # or db:migrate once real migrations exist
pnpm dev                     # Next.js app
pnpm worker:media            # BullMQ worker, separate terminal
```

`docker-compose.yml` (no `.dev` suffix) builds and runs the full stack
(app + worker + Postgres + Redis) via `Dockerfile` / `Dockerfile.worker`,
for a production-like environment or CI smoke-testing.

## 7. Roadmap

This repository is being built in phases, each production-ready before the
next starts:

1. **Architecture** (this document) — done
2. **Database** — full Prisma schema
3. **Authentication** — Auth.js, 2FA, RBAC
4. **Subscription** — plans, trial, Stripe lifecycle
5. **Media Engine** — upload/import, transcoding, AI tagging
6. **Dashboard** — user library, folders, collections, search
7. **Admin** — stats, CMS, monitoring
8. **Payments** — checkout, billing portal, invoices, coupons
9. **Testing** — unit/integration/E2E coverage
10. **Deployment** — CI/CD, Vercel + Supabase production setup
