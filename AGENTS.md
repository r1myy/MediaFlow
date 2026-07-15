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
- Run `pnpm lint && pnpm typecheck && pnpm test` before considering a
  change done; `pnpm build` before anything touching routing, metadata, or
  the Sentry/next.config wiring.
