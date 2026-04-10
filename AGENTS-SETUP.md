# AGENTS-SETUP.md

First-time setup, environment configuration, and development prerequisites.

> **Before making schema changes or running Drizzle migrations, execute the following skill** — read the SKILL.md and follow its instructions:
>
> 1. `.cursor/skills/drizzle-orm/SKILL.md`

> **Before configuring Tailwind theme or CSS variables, execute the following skill** — read the SKILL.md and follow its instructions:
>
> 1. `.cursor/skills/tailwind-design-system/SKILL.md`

---

## Prerequisites

- Node.js 24+
- pnpm 10.33.0 via the repo's `packageManager` field
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
pnpm run hooks:install
```

`ignore-scripts=true` is enabled in `.npmrc`, so lifecycle scripts do not run during install. Husky hooks must be installed manually with `pnpm run hooks:install`.

## Making Schema Changes

1. Edit schema files in `db/schema/`
2. Run `pnpm db:setup` to generate migrations and push to Turso

## Agent Skills Installation Policy

- Every new skill installed via `skills.sh` CLI must also be added to the `skills:install` script in `package.json`.
- Keep `skills:install` as the single source of truth for reproducible skill setup across environments.
