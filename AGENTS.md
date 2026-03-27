# AGENTS.md

Personal portfolio with a public page and an admin dashboard (CMS) — built with Next.js 16, React 19, TypeScript, Tailwind CSS 4.2, Drizzle ORM, Turso, and better-auth.

## Package Manager

**Always use pnpm.** Never use npm, npx, or yarn. Use `pnpm dlx` instead of `npx`.

## Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Start dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm db:setup` | Generate + push Drizzle migrations |
| `pnpm start` | Start production server |
| `pnpm test` | Vitest (watch mode) |

## Tech Stack

| Category | Technology |
| --- | --- |
| Framework | Next.js 16, App Router, React Compiler |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4.2, tw-animate-css |
| Database | Turso (libSQL) via Drizzle ORM |
| Auth | better-auth (email/password, sign-up disabled) |
| UI | shadcn/ui, Lucide icons, react-icons, cmdk, sonner |
| Animations | Motion, @number-flow/react, tw-animate-css |

## Project Structure

```
app/
├── (admin)/          # Dashboard + login (protected)
├── (public)/         # Portfolio page (public)
├── api/              # Auth routes (better-auth)
└── layout.tsx        # Root layout
components/
├── admin/            # Dashboard components
├── auth/             # Auth components
├── public/           # Public portfolio components
└── ui/               # shadcn/ui components
db/schema/            # Drizzle schema (source of truth for DB structure)
lib/
├── actions/          # Server Actions
├── queries/          # Data access facade (read queries)
├── schemas/          # Zod validation schemas
├── auth.ts           # better-auth config
├── auth-client.ts    # better-auth client
├── server-session.ts # Session helper
├── types.d.ts        # Ambient / shared types
└── utils.ts          # Shared utilities (cn, formatDate, etc.)
```

## Naming Conventions

- **Files**: kebab-case (`social-links.ts`)
- **Components**: PascalCase (`SkillsMultiSelect`)
- **Functions/Variables**: camelCase (`createProject`)
- **Database columns**: snake_case (Drizzle casing config)

## Knowledge Resolution Order

1. This file + `AGENTS-*.md` sub-files
2. Agent Skills (`.cursor/skills/`)
3. Cursor's indexed docs
4. Web search (last resort)

## Common Tasks

> **Before adding a new entity, execute the following skill** — read the SKILL.md and follow its instructions:
>
> 1. `.cursor/skills/drizzle-orm/SKILL.md`

**Add a new entity**: schema in `db/schema/` → `pnpm db:setup` → actions in `lib/actions/` → Zod schema in `lib/schemas/` → query in `lib/queries/` → dashboard page → public page.

> **Before adding a UI component, execute the following skills** — read each SKILL.md and follow its instructions:
>
> 1. `.cursor/skills/shadcn/SKILL.md`
> 2. `.cursor/skills/frontend-design/SKILL.md`
> 3. `.cursor/skills/tailwind-design-system/SKILL.md`

**Add a UI component**: add in `components/ui/` using Radix primitives + Tailwind + `cn()`.

## Upcoming Features

- Education section (courses, diplomas, certifications)
- Image uploads for projects/experiences

## Deep-Dive Guides

| Guide | When to read |
| --- | --- |
| [Setup](./AGENTS-SETUP.md) | First-time setup, env vars, prerequisites |
| [Conventions](./AGENTS-CONVENTIONS.md) | JSDoc style, when and how to document |
| [Patterns](./AGENTS-PATTERNS.md) | Architecture — Container-Presentational, Server Action hardening, Data Access Facade, Error Boundaries |
| [Patterns Reference](./AGENTS-PATTERNS-REFERENCE.md) | Full Next.js file-system conventions, detailed pattern implementations |
| [Security](./AGENTS-SECURITY.md) | Auth, CSP, headers, input validation, CSRF, rate limiting |
| [Security Reference](./AGENTS-SECURITY-REFERENCE.md) | Full proxy.ts/CSP implementation, header configs, SDK examples, audit commands |
| [SEO](./AGENTS-SEO.md) | Metadata templates, OG images, sitemap, robots |
| [Performance](./AGENTS-PERFORMANCE.md) | React Compiler, code splitting, loading states, bundle optimization, Core Web Vitals |
| [Accessibility](./AGENTS-ACCESSIBILITY.md) | Landmarks, skip link, forms, images, contrast, motion preferences |
| [Animations](./AGENTS-ANIMATIONS.md) | Tailwind animations, Motion, NumberFlow |
| [Testing](./AGENTS-TESTING.md) | Vitest, Playwright, mocking, CI |
| [Testing Reference](./AGENTS-TESTING-REFERENCE.md) | Full mock code blocks, CI workflow YAML, auth setup, axe-core patterns |
