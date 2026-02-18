# AGENTS-SETUP.md

First-time setup, environment configuration, and development prerequisites.

---

## Prerequisites

- Node.js 18+
- pnpm v10.x (`npm install -g pnpm@10`)
- Turso CLI (optional, for local DB management)

## Environment Variables

Create a `.env.local` file:

```env
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
```

## Installation

```bash
pnpm i
```

## Making Schema Changes

1. Edit schema files in `db/schema/`
2. Run `pnpm db:setup` to generate migrations and push to Turso

## Agent Skills Installation Policy

- Every new skill installed via `skills.sh` CLI must also be added to the `skills:install` script in `package.json`.
- Keep `skills:install` as the single source of truth for reproducible skill setup across environments.
