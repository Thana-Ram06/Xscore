# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### XScore (`artifacts/xscore`)
- React + Vite frontend at `/`
- AI-powered X (Twitter) influence scoring SaaS
- Dark mode default with light mode toggle
- Instrument Serif headings, Inter body text
- Pages: Homepage (`/`), Dashboard (`/dashboard/:username`), Search Detail (`/search/:id`)

### API Server (`artifacts/api-server`)
- Express 5 backend at `/api`
- Routes: POST `/api/analyze`, GET `/api/searches`, GET `/api/searches/:id`
- Generates mock Twitter analytics data, calculates influence score

## Database Schema

- `searches` table: stores previous analysis results (username, score, followers, engagementRate, growthRate, tier, etc.)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Vercel Deployment

The project is configured for Vercel deployment alongside the Replit dev environment.

### Files added for Vercel
- `vercel.json` — build command, output dir, SPA rewrite rule
- `api/analyze.ts` — POST `/api/analyze` serverless function
- `api/searches/index.ts` — GET `/api/searches` serverless function
- `api/searches/[id].ts` — GET `/api/searches/:id` serverless function
- `api/healthz.ts` — GET `/api/healthz` health check

### How it works on Vercel
- Vite frontend is built and served as static files from `artifacts/xscore/dist/public`
- `/api/*` routes are handled by Node.js serverless functions (not the Express server)
- SPA routes (`/dashboard/*`, `/search/*`) are rewritten to `index.html`
- `shamefully-hoist=true` in `.npmrc` ensures `pg` is accessible to serverless functions

### Deploying to Vercel
1. Push to GitHub (or use `vercel --prod` CLI)
2. In Vercel project settings, set the env var: `DATABASE_URL=<your-postgres-url>`
   - Recommended providers: Neon, Supabase, or Vercel Postgres
3. Deploy — the build command and output directory are already configured in `vercel.json`

### Environment Variables
| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes (on Vercel) | PostgreSQL connection string |

The serverless functions gracefully degrade if `DATABASE_URL` is not set — the analyze endpoint still returns mock scores, searches history returns an empty array.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
