# MediaFlow

MediaFlow is a media workspace SaaS — upload, organize, transcode, tag, and
share your video and audio library, with folders, collections, AI-powered
tagging, and team plans.

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full system design,
tech-stack rationale, and roadmap.

## Getting started

```bash
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d   # Postgres + Redis
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

The app runs at http://localhost:3000. Run `pnpm worker:email` (and, once
Phase 5 lands, `pnpm worker:media`) alongside it in another terminal —
without a worker, queued jobs (verification/reset emails, etc.) sit in
Redis until one picks them up.

## Scripts

| Command              | Description                              |
| --------------------- | ----------------------------------------- |
| `pnpm dev`             | Start the Next.js dev server              |
| `pnpm build` / `start` | Production build / start                  |
| `pnpm lint` / `lint:fix` | ESLint                                  |
| `pnpm typecheck`       | `tsc --noEmit`                            |
| `pnpm format` / `format:check` | Prettier                          |
| `pnpm test` / `test:watch` / `test:coverage` | Vitest unit/integration tests |
| `pnpm test:e2e`        | Playwright end-to-end tests               |
| `pnpm db:migrate` / `db:push` / `db:studio` / `db:seed` | Prisma workflows |
| `pnpm worker:media`    | Run the BullMQ media-processing worker    |
| `pnpm worker:email`    | Run the BullMQ email worker (renders react-email templates, sends via Resend) |

## Stack

Next.js 15 · React 19 · TypeScript · TailwindCSS · shadcn/ui · Prisma ·
PostgreSQL · Redis · BullMQ · Stripe · Resend · PostHog · Sentry ·
Cloudflare R2.
