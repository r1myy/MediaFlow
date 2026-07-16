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
- Auth, rate limiting, RBAC, and 2FA — see §7 (Authentication).

## 6. Local development

```bash
cp .env.example .env        # fill in secrets as needed
docker compose -f docker-compose.dev.yml up -d   # Postgres + Redis only
pnpm install
pnpm db:migrate               # applies prisma/migrations/
pnpm db:seed                  # seeds the four subscription plans
pnpm dev                      # Next.js app
pnpm worker:media             # BullMQ worker, separate terminal
```

`docker-compose.yml` (no `.dev` suffix) builds and runs the full stack
(app + worker + Postgres + Redis) via `Dockerfile` / `Dockerfile.worker`,
for a production-like environment or CI smoke-testing.

## 7. Data model (Phase 2)

The full schema lives in `prisma/schema.prisma`, organized into five
sections: auth/RBAC/2FA/devices, plans/subscriptions/billing, the media
engine (folders/collections/media/variants/tags/jobs/sharing),
notifications/settings/feature-flags/logs, and support/newsletter/CMS plus
referrals/affiliates — 36 tables total, matching the spec's table list
(`Media`/`MediaVariant` stand in for the spec's `Downloads`/`Files`, see §1).

Notable decisions:

- **Money as integer cents**, matching Stripe's own unit — avoids
  floating-point drift in prices, invoices, and payouts.
- **Byte sizes as `BigInt`** — media files routinely exceed 2^31 bytes;
  `Int` would silently truncate. (Note for Phase 5/6: `BigInt` isn't
  `JSON.stringify`-able by default — API routes returning these fields need
  to serialize explicitly, e.g. `.toString()` or a custom serializer.)
- **Partial unique indexes for folder names.** A plain
  `@@unique([userId, parentId, name])` does *not* stop two root-level
  folders (`parentId IS NULL`) from sharing a name — Postgres treats `NULL`
  as distinct from `NULL` in unique constraints. This was caught by the
  integration test in `prisma/__tests__/schema.integration.test.ts` and
  fixed with two hand-written partial unique indexes in the
  `folder_partial_unique_names` migration (one for `parentId IS NULL`, one
  for `parentId IS NOT NULL`); `schema.prisma` only carries a plain
  `@@index` for query performance, since Prisma can't express a partial
  unique index directly.
- **One `Subscription` per `User`** (`userId` is `@unique`). Plan/status
  history is reconstructed from `Payment`/`Invoice`/Stripe webhook events
  rather than a separate subscription-history table.
- **Schema correctness is tested against a real Postgres**, not just
  `prisma validate` — see `prisma/__tests__/schema.integration.test.ts`
  (cascade deletes, relation queries, and the constraint above). CI's
  `unit-tests` job runs a Postgres service container for this.

## 8. Authentication (Phase 3)

**Google/Apple OAuth go through Auth.js (`src/auth.ts`) with the Prisma
adapter and `session: { strategy: "database" }`. Email+password does
NOT go through Auth.js's Credentials provider** — that provider only
supports JWT sessions, which would leave the `Session`/`Device` tables
(and therefore device management, a spec requirement) unused for the
majority of users who sign up with email+password.

Instead:

- `src/modules/auth/service.ts` verifies the password directly (bcrypt)
  against `User.passwordHash`.
- `src/lib/auth/session.ts` then creates a `Session` row and sets a cookie
  with the exact name/options configured in `src/lib/auth/cookies.ts` —
  the same values passed to Auth.js's `cookies.sessionToken` config.
- Because the cookie name and the `Session.sessionToken` column agree,
  Auth.js's `auth()` recognizes both kinds of session transparently. One
  code path (`auth()`) works everywhere in the app regardless of how the
  user signed in.

This is the single most important structural decision in this phase — see
the doc comment at the top of `src/auth.ts` and `src/lib/auth/session.ts`.

Other decisions:

- **Middleware only checks cookie *presence*, not validity.** Validating a
  database session requires Prisma, which doesn't run in the Edge
  middleware runtime. `middleware.ts` does a cheap redirect for UX;
  `(dashboard)/layout.tsx` and `(admin)/layout.tsx` call `auth()` (Node
  runtime, Prisma-backed) for the real check, and `(admin)/layout.tsx`
  additionally enforces RBAC (`ADMIN`/`SUPER_ADMIN` only).
- **Service layer vs. Server Actions.** `src/modules/auth/service.ts`
  holds pure, DB-only logic with no dependency on `cookies()`/`headers()`;
  `src/modules/auth/actions/*.ts` are thin `"use server"` wrappers that
  parse input, rate-limit, call the service, and handle
  cookies/redirects. This split is also what makes the service layer
  unit-testable — Next's `cookies()`/`headers()` throw outside a real
  request context, so they can't be called from Vitest.
- **2FA** uses TOTP (`otplib` v13's plugin-based API — `@otplib/totp` +
  `NobleCryptoPlugin` + `ScureBase32Plugin`; `otplib`'s old `authenticator`
  singleton API is gone in v13) with the secret encrypted at rest
  (AES-256-GCM, `src/lib/crypto.ts`) and 10 single-use bcrypt-hashed backup
  codes. Login-time 2FA uses a short-lived Redis-backed challenge
  (`src/lib/auth/two-factor-challenge.ts`) so the client doesn't need to
  resubmit the password alongside the code.
- **Rate limiting** (`src/lib/rate-limit.ts`) is a Redis fixed-window
  counter applied to registration, login (by IP and by email separately),
  the 2FA challenge, and password-reset requests.
- **Emails go through the queue**, not sent synchronously from Server
  Actions: actions call `enqueueEmail()` (`src/lib/email/enqueue.ts`),
  which adds a job to the `emails` BullMQ queue from Phase 1;
  `src/workers/email.worker.ts` renders the react-email template and
  calls Resend. This is real infrastructure, not a stub — verified
  end-to-end against a running worker process.
- **shadcn/ui's `Form` component wasn't used.** Auth forms use React 19's
  `useActionState` bound directly to Server Actions (native
  progressive-enhancement, one state object per form) rather than React
  Hook Form — RHF's client-side validation state and `useActionState`'s
  server-driven state don't compose naturally for these single/few-field
  forms. RHF remains the right tool for the richer, more dynamic forms in
  later phases (media metadata, admin CMS).

All of the above was exercised end-to-end against a real Postgres, Redis,
dev server, and email worker (not just typechecked) — see
`e2e/auth.spec.ts` for the automated version of that verification.

## 9. Subscription (Phase 4)

Split deliberately from Phase 8 (Payments): this phase covers the
subscription *domain* — quota enforcement and the Stripe subscription
lifecycle. Coupons, tax, and richer invoice UI are Phase 8's job, building
on the `Invoice` rows already written here.

- **The Stripe webhook is the single source of truth for `Subscription`
  state.** `src/modules/subscription/actions/*.ts` only ever call Stripe
  (checkout, billing portal, cancel, resume) — none of them write to the
  `Subscription` table directly. `src/modules/subscription/webhook-handlers.ts`
  does all the writing, driven by `customer.subscription.created/updated/
  deleted` events. This avoids the dual-write inconsistency bugs you get
  from optimistically updating the DB *and* trusting a webhook to agree
  with it later.
- **Entitlements are derived, not stored.** `src/modules/subscription/
  entitlements.ts` computes trial-expiry, quota usage, and remaining
  allowance on every read (`getEntitlements`, `canUpload`,
  `canStartProcessingJob`) instead of relying on a cron job to flip a
  `TRIALING` subscription to an "expired" state in time. Simpler, and
  can't drift out of sync. Phase 5's upload/processing pipeline calls
  `canUpload`/`canStartProcessingJob` before enqueueing work.
- **Stripe's SDK types were read directly, not recalled from memory** —
  `current_period_start`/`current_period_end` moved off the top-level
  `Subscription` object onto each `SubscriptionItem` in the installed SDK
  version (`stripe@22.3.1`), a real breaking change from older Stripe API
  versions most docs/tutorials still describe. Checked via
  `node_modules/stripe/cjs/resources/Subscriptions.d.ts` before writing
  `webhook-handlers.ts`, rather than guessing and risking data landing in
  the wrong place.
- **Same graceful-degradation pattern as Resend (Phase 3):** the `Stripe`
  client also throws synchronously on a falsy API key, which would crash
  any route importing it in an unconfigured environment. Fixed with a
  placeholder key (`src/lib/stripe/client.ts`) plus
  `isStripeConfigured()`/`assertStripeConfigured()` guards in
  `stripe-sync.ts` — every Stripe-calling action returns a typed
  `SubscriptionError("STRIPE_NOT_CONFIGURED", ...)` instead of a raw
  exception, verified live (this sandbox has no Stripe credentials).
- **Quality gating** (`isQualityAllowed`): `BEST` isn't a rung on the
  resolution ladder, it's "whatever's highest available," so it satisfies
  any request; `AUDIO_ONLY` is a separate axis (an extraction, not a
  resolution) and is always allowed regardless of plan.
- **Verification limits, stated plainly:** there's no Stripe test-mode
  account in this sandbox, so the checkout/webhook flow's *wire format*
  (real HTTP round-trips to Stripe) is unverified — what's verified is (a)
  the graceful "not configured" path, for real, since this environment
  genuinely has no key, both via Vitest and live in a browser, and (b) the
  webhook business logic (`handleStripeEvent`) and price-sync idempotency
  (`ensureStripePrices`) against constructed fixtures matching the
  installed SDK's actual types. Confirming the real Stripe round-trip
  needs a test-mode account and `stripe trigger`/`stripe listen`.
- Running the full E2E suite surfaced a real bug: the registration rate
  limit (5/hour/IP, added in Phase 3) is tighter than a single full test
  run needs — six specs across `auth.spec.ts` and `billing.spec.ts` each
  register a user, so a clean CI run would trip it even with a freshly
  provisioned Redis. Raised to 20/hour/IP, still tight enough to bound
  scripted abuse.

## 10. Roadmap

This repository is being built in phases, each production-ready before the
next starts:

1. **Architecture** (this document) — done
2. **Database** — full Prisma schema — done
3. **Authentication** — Auth.js, 2FA, RBAC — done
4. **Subscription** — plans, trial, Stripe lifecycle — done
5. **Media Engine** — upload/import, transcoding, AI tagging
6. **Dashboard** — user library, folders, collections, search
7. **Admin** — stats, CMS, monitoring
8. **Payments** — checkout, billing portal, invoices, coupons
9. **Testing** — unit/integration/E2E coverage
10. **Deployment** — CI/CD, Vercel + Supabase production setup
