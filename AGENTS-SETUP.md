# AGENTS-SETUP.md

## CSP and administrator configuration

Configure server-only `ADMIN_USER_IDS` with comma-separated stable better-auth user
IDs before using the CMS. Missing or malformed configuration grants no administrator
access. Obtain IDs through trusted manual account provisioning, never through email
matching or automatic enrollment. Set this independently in Development, Preview,
and Production; never use a `NEXT_PUBLIC_` variable.

`CSP_PUBLIC_MODE` and `CSP_ADMIN_MODE` default to `report-only`. Set either to
`enforce` only after its protected Preview validation gates pass. `CSP_ADMIN_POLICY`
defaults to `static`; the `nonce` candidate is permitted only in Vercel Preview and
is not verified or enabled in Production.

`BETTER_AUTH_TRUSTED_ORIGINS` can contain comma-separated explicit Preview HTTPS
origins or HTTP local development origins such as `http://localhost:3000`. Configure
the corresponding better-auth base URL normally. Wildcard Vercel origins are not
accepted. Keep Preview deployments access-protected and use separate test data.

This setting contains website origins, not user IDs, tokens, or secrets. For local
development, use `BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:3000` (adjust the port
to match the server). Include the scheme and omit paths, queries, and fragments.
Malformed entries stop authentication initialization with an error naming the
variable and entry number. Restart the development server after editing its env file.

See [security configuration and rollout](./AGENTS-SECURITY-REFERENCE.md) for policy
ownership, resource allowances, pending validation, and rollback procedures.

First-time setup, environment configuration, and development prerequisites.

> **Before making schema changes or running Drizzle migrations, execute the following skill** — read the SKILL.md and follow its instructions:
>
> 1. `.claude/skills/drizzle-orm/SKILL.md`

> **Before configuring Tailwind theme or CSS variables, execute the following skill** — read the SKILL.md and follow its instructions:
>
> 1. `.claude/skills/tailwind-design-system/SKILL.md`

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
LASTFM_USERNAME=your-lastfm-username
LASTFM_API_KEY=your-lastfm-api-key
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
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
