# Agent notes for MediaFlow

- Read `ARCHITECTURE.md` before making structural changes — it documents
  the tech-stack decisions (why Prisma 6.x not 7.x, why Next.js API routes
  not NestJS, etc.) and the phase-by-phase build plan.
- **Content model:** MediaFlow only ever imports media a user owns or has
  explicit rights to (direct upload, or an authorized cloud-drive import).
  Do not add features that fetch/download content from third-party
  streaming platforms (YouTube, Vimeo, SoundCloud, etc.) — that model was
  deliberately rejected, see `ARCHITECTURE.md` §1.
- New media import sources go through the adapter pattern in
  `src/modules/media/adapters/` — implement `MediaSourceAdapter` and
  register it, don't special-case a new source elsewhere in the app.
- `ui.shadcn.com` is blocked by this environment's network policy — write
  new shadcn/ui primitives by hand into `src/components/ui/` (see existing
  files for the pattern) rather than running `pnpm dlx shadcn add`.
- Env vars are validated at boot via `src/lib/env.ts`
  (`@t3-oss/env-nextjs`) — add new variables there, not just to
  `.env.example`.
- **Auth:** email+password login does NOT use Auth.js's Credentials
  provider — it's a custom flow in `src/modules/auth/service.ts` +
  `src/lib/auth/session.ts` that creates a `Session` row directly, using
  the exact cookie name/options from `src/lib/auth/cookies.ts`. If you
  change session cookie config, change it in both `src/auth.ts` and
  `src/lib/auth/cookies.ts` — they must stay in sync. See
  `ARCHITECTURE.md` §8.
- Auth business logic belongs in `src/modules/auth/service.ts` (no
  `cookies()`/`headers()`, unit-testable), not in the `"use server"`
  action files under `src/modules/auth/actions/` (thin wrappers — parse
  input, rate-limit, call the service, handle cookies/redirects).
- Run `pnpm lint && pnpm typecheck && pnpm test` before considering a
  change done; `pnpm build` before anything touching routing, metadata, or
  the Sentry/next.config wiring. For anything touching auth flows, also
  run `pnpm test:e2e` (needs Postgres + Redis + `pnpm build` first) — it
  exercises real Server Actions, which Vitest can't.
