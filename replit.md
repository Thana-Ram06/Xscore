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

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
