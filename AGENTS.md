# AGENTS.md

## Project Overview

Personal portfolio website with a dual architecture:

- **Public Page**: Static portfolio showcasing projects, work experiences, skills, and social links
- **Admin Dashboard**: Custom CMS for managing all portfolio content (projects, experiences, skills, social links, site settings)

The admin dashboard modifies the data that visitors see on the public-facing portfolio page.

## Knowledge Resolution Order

When looking up documentation, APIs, or best practices, follow this priority order. Always start from the top and only move to the next source if the current one doesn't have the answer.

| Priority | Source | What it contains |
| --- | --- | --- |
| 1 | `AGENTS.md` (this file) | Project-specific conventions, templates, and decisions |
| 2 | Sub `AGENTS-*.md` files | Deep-dive guidelines (security, performance, accessibility, animations, testing) |
| 3 | Agent Skills (`.agents/skills/`) | Framework and tool knowledge (Next.js, Drizzle, better-auth, shadcn, etc.) |
| 4 | Indexed Docs (Cursor) | Official documentation indexed locally in Cursor |
| 5 | MCP Servers | Live browsing and external tool integrations |
| 6 | Web Search | Last resort — only when none of the above have the answer |

**Important**: Always prefer Cursor's indexed docs over web searches. Only go to the web if the indexed docs don't cover the topic or are outdated/insufficient.

## Tech Stack

| Category       | Technology                                                                 |
| -------------- | -------------------------------------------------------------------------- |
| Framework      | Next.js 16 (canary) with App Router and React Compiler                     |
| UI Library     | React 19                                                                   |
| Language       | TypeScript (strict mode)                                                   |
| Styling        | Tailwind CSS 4.1 with tw-animate-css                                       |
| Package Manager| pnpm v10.x                                                                 |
| Database       | Turso Cloud (SQLite-compatible, libSQL)                                    |
| ORM            | Drizzle ORM with Turso dialect                                             |
| Auth           | better-auth (email/password, sign-up disabled - admin only)                |
| UI Components  | shadcn/ui (built on Radix UI primitives), Lucide icons (primary), react-icons (for specific brand icons like React logo), cmdk, sonner toasts |
| Animations     | Motion (Framer Motion) for interactive animations, @number-flow/react for animated numbers, tw-animate-css for Tailwind animations |

## Dev Environment Setup

### Prerequisites

- Node.js 18+
- pnpm v10.x (`npm install -g pnpm@10`)
- Turso CLI (optional, for local DB management)

### Environment Variables

Create a `.env.local` file with the following:

```env
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
```

### Installation

```bash
pnpm i
```
Never use npm or npx. Always use pnpm and pnpm dlx

## Commands

| Command                  | Description                                           |
| ------------------------ | ----------------------------------------------------- |
| `pnpm dev`               | Start development server (Turbopack enabled)          |
| `pnpm build`             | Build for production                                  |
| `pnpm start`             | Start production server                               |
| `pnpm lint`              | Run ESLint                                            |
| `pnpm migrate:generate`  | Generate Drizzle migrations from schema changes       |
| `pnpm migrate:push`      | Push migrations to Turso database                     |
| `pnpm db:setup`          | Run both generate and push (full migration workflow)  |

### Agent Skills Installation Policy

- Every new skill installed via `skills.sh` CLI must also be added to the `skills:install` script in `package.json`.
- Keep `skills:install` as the single source of truth for reproducible skill setup across environments.

## Project Structure

```
├── app/
│   ├── (admin)/           # Admin dashboard route group
│   │   ├── dashboard/     # Dashboard pages (projects, experiences, skills, social-links, settings)
│   │   └── login/         # Admin authentication
│   ├── (public)/          # Public portfolio route group
│   │   ├── layout.tsx
│   │   └── page.tsx       # Main portfolio page
│   ├── api/               # API routes (auth endpoints via better-auth)
│   ├── globals.css        # Global styles (Tailwind imports)
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Root page (redirects)
├── components/
│   ├── admin/             # Admin-specific components
│   ├── auth/              # Authentication components
│   └── ui/                # Reusable UI components (shadcn/ui style)
├── db/
│   ├── drizzle.config.ts  # Drizzle Kit configuration
│   ├── index.ts           # Database client export
│   ├── migrations/        # Generated SQL migrations
│   └── schema/
│       ├── better-auth.ts # Auth tables (users, sessions, accounts, verifications)
│       ├── portfolio.ts   # Portfolio tables (projects, experiences, skills, project_skills, experience_skills, site_settings, employment_history, social_links)
│       └── index.ts       # Schema barrel export
├── lib/
│   ├── actions/           # Server Actions (projects, experiences, skills, social-links, settings)
│   ├── auth.ts            # better-auth server configuration
│   ├── auth-client.ts     # better-auth client configuration
│   ├── server-session.ts  # Session helpers
│   ├── types.d.ts         # TypeScript type definitions
│   └── utils.ts           # Utility functions (cn for class merging)
├── public/                # Static assets
├── server/                # Server utilities
└── tests/                 # Test files
```

## Database Schema

### Portfolio Tables

- **projects**: Portfolio projects
  - `id`: Primary key (auto-increment)
  - `title`: Project title (required)
  - `description`: Project description (required)
  - `url`: Live project URL (optional)
  - `repoUrl`: Repository URL (optional)
  - `status`: Project status (active, archived, in-progress)
  - `order`: Display order
  - `createdAt`: Timestamp
  - `updatedAt`: Timestamp

- **experiences**: Work experiences
  - `id`: Primary key (auto-increment)
  - `role`: Job title/role (required)
  - `company`: Company name (required)
  - `companyUrl`: Company website URL (optional)
  - `companyLogo`: Company logo URL (optional)
  - `description`: Job description (required)
  - `startDate`: Employment start date (optional)
  - `endDate`: Employment end date (optional, null = current job)
  - `order`: Display order
  - `location`: Job location (optional)
  - `createdAt`: Timestamp
  - `updatedAt`: Timestamp

- **skills**: Technical skills
  - `id`: Primary key (auto-increment)
  - `name`: Skill name (required)
  - `type`: Skill category (fullstack, frontend, backend, database, devops, practices, tools, other)
  - `icon`: Icon identifier (optional)
  - `url`: Skill reference URL (optional)
  - `createdAt`: Timestamp
  - `updatedAt`: Timestamp

- **project_skills**: Junction table linking projects to skills (many-to-many)
  - `projectId`: Foreign key to projects
  - `skillId`: Foreign key to skills
  - `createdAt`: Timestamp
  - `updatedAt`: Timestamp

- **experience_skills**: Junction table linking experiences to skills (many-to-many)
  - `experienceId`: Foreign key to experiences
  - `skillId`: Foreign key to skills
  - `createdAt`: Timestamp
  - `updatedAt`: Timestamp

- **site_settings**: Global site settings
  - `id`: Primary key (auto-increment)
  - `isEmployed`: Employment status (boolean)
  - `resumeUrl`: Resume/CV download URL (required)
  - `statusMessage`: Custom status message (optional)
  - `updatedAt`: Timestamp

- **employment_history**: Historical record of employment status changes
  - `id`: Primary key (auto-increment)
  - `isEmployed`: Employment status at that time (boolean)
  - `changedAt`: Timestamp of status change

- **social_links**: Social media and contact links
  - `id`: Primary key (auto-increment)
  - `name`: Link name/platform (required)
  - `url`: Link URL (required)
  - `icon`: Icon identifier (optional)
  - `order`: Display order
  - `createdAt`: Timestamp
  - `updatedAt`: Timestamp

### Auth Tables (managed by better-auth)

- **users**: User accounts for admin authentication
- **sessions**: Active user sessions
- **accounts**: OAuth/credential accounts linked to users
- **verifications**: Email verification tokens

### Making Schema Changes

1. Edit schema files in `db/schema/`
2. Run `pnpm db:setup` to generate migrations and push to Turso database

## Code Conventions

### TypeScript

- Strict mode enabled
- Use path alias `@/*` for imports from project root
- Prefer type inference where possible, explicit types for function signatures

### React & Next.js

- Use React Server Components by default
- Mark client components with `"use client"` directive
- Use Server Actions in `lib/actions/` for data mutations
- Use Next.js App Router conventions (route groups, layouts, loading states)

### Styling

- Use Tailwind CSS utility classes
- Use `cn()` utility from `lib/utils.ts` for conditional class merging
- Follow shadcn/ui component patterns in `components/ui/`

### Naming Conventions

- **Files**: kebab-case (`social-links.ts`, `skills-multi-select.tsx`)
- **Components**: PascalCase (`SkillsMultiSelect`)
- **Functions/Variables**: camelCase (`createProject`, `isEmployed`)
- **Database columns**: snake_case (handled by Drizzle casing config)

### JSDoc

Since TypeScript already provides type safety, use JSDoc to add **semantic context** — the "why", not the "what". Do not restate information that types already express.

#### When to Document

Document when there is:

- Non-obvious logic or business rules
- Side effects (revalidation, redirects, external calls)
- Security assumptions or constraints
- Possible errors or edge cases
- Deprecations or temporary workarounds

Skip JSDoc for:

- Self-explanatory functions where the name + types say it all
- Simple component props already typed with an interface
- One-liner utilities with clear names (e.g., `formatDate`)

#### Approved Tags

| Tag | Use for | Example context |
| --- | --- | --- |
| `@param` | Only when the name/type isn't self-explanatory, or to clarify constraints | `@param id - Must be > 0, validated upstream by Zod` |
| `@returns` | Only when the return value has non-obvious meaning | `@returns null when the user has no active session` |
| `@throws` | Server actions / functions that throw or redirect | `@throws Redirects to /login if unauthenticated` |
| `@example` | Complex utilities where usage isn't obvious | `@example cn("base", condition && "extra")` |
| `@deprecated` | Superseded code that still exists | `@deprecated Use getServerSession() instead` |
| `@see` | Link to related code, docs, or decisions | `@see AGENTS-SECURITY.md for auth pattern` |
| `@todo` | Known improvements pending | `@todo Add Zod validation (issue #42)` |

Avoid `@type`, `@typedef`, `@callback` — TypeScript handles these.

#### Where to Prioritize

| Location | Priority | Reason |
| --- | --- | --- |
| `lib/actions/*` (Server Actions) | **High** | Side effects, auth checks, revalidation, redirects |
| `lib/auth.ts`, `lib/server-session.ts` | **High** | Security assumptions, session flow |
| `db/schema/*` | **Medium** | Relationships, constraints, enum meanings |
| `components/ui/*` (reusable) | **Medium** | Prop behavior, variants, accessibility notes |
| `lib/utils.ts` | **Low** | Only if logic is non-trivial |
| Page/layout components | **Low** | Only for unusual data fetching or auth patterns |

#### Examples for This Project

**Server Action** (`lib/actions/`):

```typescript
/**
 * Updates a project and its associated skills.
 * Revalidates both the dashboard and public page caches.
 *
 * @throws Redirects to /login if the session is invalid.
 * @throws Error if the project ID does not exist.
 */
export async function updateProject(formData: FormData) {
  // ...
}
```

**Schema** (`db/schema/`):

```typescript
/**
 * Tracks employment status changes over time.
 * Each row is an immutable snapshot — never update, only insert.
 */
export const employmentHistory = sqliteTable("employment_history", {
  // ...
});
```

**Auth helper** (`lib/`):

```typescript
/**
 * Retrieves the current admin session from cookies.
 *
 * @returns The session object, or `null` if unauthenticated.
 * @see AGENTS-SECURITY.md — "Auth Protection Pattern" for the two-layer approach.
 */
export async function getServerSession() {
  // ...
}
```

**UI component** (`components/ui/`):

```typescript
/**
 * Combobox for selecting multiple skills with search filtering.
 * Renders as a popover with a command palette (cmdk).
 *
 * @see https://ui.shadcn.com/docs/components/combobox
 */
```

**Deprecation**:

```typescript
/**
 * @deprecated Replaced by `getServerSession()`. Will be removed in v2.
 */
export function getSessionFromCookie() {
  // ...
}
```

#### Style Rules

- Use `/** ... */` (not `//` or `/* */`) so editors parse the JSDoc
- First line: concise summary (what + why, one sentence)
- Blank line before tags if there is a description body
- Keep descriptions under 80 characters per line when possible
- Write in English, imperative mood ("Retrieves...", not "This function retrieves...")

## Server Actions Pattern

Server actions are located in `lib/actions/` and follow this pattern:

```typescript
"use server";

import { db } from "@/db";
import { tableName } from "@/db/schema";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

export async function createEntity(data: EntityData) {
  // Validation (coming soon: Zod schema validation)
  // Database operation with Drizzle
  // Use redirect, revalidatePath, or revalidateTag
}
```

## Authentication

- better-auth handles auth with Drizzle adapter for Turso/SQLite
- Sign-up is disabled (`disableSignUp: true`) - admin-only access
- Session cookie caching enabled (5 min) to reduce DB hits
- Use `nextCookies()` plugin for Next.js integration
- Auth routes at `/api/auth/*` (handled automatically by better-auth)

## Route Groups

- `(admin)`: Protected routes requiring authentication
  - `/login`: Admin login page
  - `/dashboard`: Main dashboard overview
  - `/dashboard/projects`: Manage portfolio projects
  - `/dashboard/experiences`: Manage work experiences
  - `/dashboard/skills`: Manage technical skills
  - `/dashboard/social-links`: Manage social media links
  - `/dashboard/settings`: Manage site settings (employment status, resume URL, status message)
- `(public)`: Main portfolio page for public visitors
  - `/`: Landing page displaying all portfolio content (projects, experiences, skills, social links)

## Testing

See [AGENTS-TESTING.md](./AGENTS-TESTING.md) for detailed testing guidelines covering:

- **Testing Philosophy** — "TDD where it hurts" approach, when to use TDD vs Test-After, the Red-Green-Refactor cycle, what NOT to test
- **Tool Setup** — Vitest config (`vitest.config.mts`), Playwright config (`playwright.config.ts`), package.json scripts
- **Test File Location & Naming** — `tests/` for Vitest (`.test.ts`), `e2e/` for Playwright (`.spec.ts`), directory structure, naming rules
- **Mocking Strategy** — Drizzle database (`@/db`), better-auth sessions (`getServerSession`), Next.js functions (`redirect`, `revalidatePath`), `FormData`
- **What to Test Per Entity** — Vitest tests (schemas, actions, junction table sync) and Playwright tests (CRUD flows, auth, public page)
- **Playwright E2E Patterns** — authentication setup, locator best practices, Page Object pattern
- **Accessibility Testing** — axe-core integration with Playwright for WCAG 2.2 AA checks
- **CI Integration** — GitHub Actions workflow for both Vitest and Playwright, environment variables, Playwright report artifacts
- **Good Practices** — Vitest conventions (Arrange-Act-Assert, `it.each`, edge cases), Playwright conventions (auto-waiting, user-visible assertions)
- **Testing Checklist** — pre-commit, pre-deployment, and one-time setup TODOs

The following topics are fully covered by installed skills (no duplication needed):

| Topic | Skill |
| --- | --- |
| Vitest core API, CLI, hooks, mocking, snapshots, coverage, environments | `vitest` |
| Playwright browser automation, locators, assertions, screenshots, CI patterns | `playwright-skill` |

### Quick Reference

| Command | Description |
| --- | --- |
| `pnpm test` | Run Vitest unit tests in watch mode |
| `pnpm test -- --run` | Run Vitest once (for CI) |
| `pnpm test:e2e` | Run Playwright E2E tests headless |
| `pnpm test:e2e:ui` | Run Playwright with interactive UI mode |
| `pnpm test:e2e:report` | Open the Playwright HTML report |

### Test Directories

| Directory | Tool | Contents |
| --- | --- | --- |
| `tests/` | Vitest | Unit tests: schemas, actions, utils, components |
| `e2e/` | Playwright | E2E tests: auth, CRUD flows, public page, accessibility |

## Security

See [AGENTS-SECURITY.md](./AGENTS-SECURITY.md) for detailed security guidelines covering:

- **Content Security Policy (CSP)** — nonce-based CSP via `proxy.ts`, directive explanations, dev vs prod differences, `x-nonce` header for `<Script>` components
- **Security Headers** — `headers()` config in `next.config.ts` (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy), header explanations, why `X-XSS-Protection` is deprecated
- **Auth Protection Pattern** — two-layer approach: optimistic redirects via `proxy.ts` (cookie-existence check, UX only) + real session validation via `getServerSession()` in every page and Server Action (security layer)
- **Server Actions Security** — mandatory 4-step pattern: authenticate, validate (Zod), execute (Drizzle), revalidate/redirect
- **Input Validation with Zod** — schema patterns for all entities (projects, experiences, skills, social links, settings), validation rules
- **SQL Injection Prevention** — safe patterns (Drizzle query builder, `sql` template), dangerous patterns to avoid (`sql.raw()`, string concatenation)
- **Secure Environment Variables** — classification (`NEXT_PUBLIC_*` vs server-only), Vercel Sensitive Variables, CLI commands, auto-provided Vercel variables
- **CSRF Protection** — better-auth `trustedOrigins` + `Origin` header check, Next.js Server Action built-in CSRF, SameSite cookies
- **Secure Cookies & Sessions** — better-auth cookie flags (`httpOnly`, `secure`, `sameSite`), cookie cache tradeoff (5 min), session management
- **Rate Limiting** — why Vercel WAF over in-memory LRU cache (serverless isolation), Vercel WAF dashboard setup, recommended rules for auth/API routes, `@vercel/firewall` SDK for application-level rate limiting, better-auth built-in rate limiting config, WAF plan limits
- **Source Maps & Production Hardening** — `productionBrowserSourceMaps` (disabled by default), `removeConsole` compiler option, log hygiene
- **Dependency Security** — `pnpm audit`, `pnpm audit --fix`, `npm-check-updates`, update workflow, audit scripts for `package.json`
- **Vercel Security Features** — automatic HTTPS, DDoS mitigation, Sensitive Environment Variables, Attack Challenge Mode, Deployment Protection
- **Fundamental Security Principles** — Defense in Depth (layer table), Least Privilege, Never Trust User Input, Keep Everything Updated
- **Security Checklist** — pre-deployment checks and one-time setup TODOs

The following topics are fully covered by installed skills (no duplication needed):

| Topic | Skill |
| --- | --- |
| better-auth CSRF (`trustedOrigins`), cookie strategies, `BETTER_AUTH_SECRET` requirements | `better-auth-best-practices` |
| Drizzle ORM parameterized queries, `sql` template, prepared statements | `drizzle-orm` |
| Server Action auth/authorization patterns, Zod validation | `vercel-react-best-practices` |
| `unauthorized()`/`forbidden()` error handling, secrets on server | `next-best-practices` |

## Common Tasks

### Add a new portfolio entity type

1. Add schema in `db/schema/portfolio.ts`
2. Run `pnpm db:setup` to migrate
3. Create server actions in `lib/actions/`
4. Create admin dashboard page in `app/(admin)/dashboard/`
5. Display on public page in `app/(public)/`

### Add a new UI component

1. Add component in `components/ui/` following shadcn/ui patterns
2. Use Radix UI primitives for accessibility
3. Style with Tailwind and `cn()` utility

## SEO & Metadata

### Production-Ready Metadata Template

Use this complete metadata template in `app/layout.tsx` (or `app/(public)/layout.tsx` for the public portfolio page). This is a Server Component export only -- metadata cannot be used in Client Components.

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://gonzalopozo.dev"),
  title: {
    default: "Gonzalo Pozo - Full Stack Developer",
    template: "%s | Gonzalo Pozo",
  },
  description:
    "Full Stack Developer portfolio showcasing projects, work experiences, and technical skills. Built with Next.js, React, TypeScript, and Tailwind CSS.",
  keywords: [
    "full stack developer",
    "web developer",
    "portfolio",
    "react",
    "nextjs",
    "typescript",
    "tailwind css",
  ],
  authors: [{ name: "Gonzalo Pozo", url: "https://gonzalopozo.dev" }],
  creator: "Gonzalo Pozo",

  // Open Graph (Facebook, LinkedIn, Discord, Slack)
  openGraph: {
    title: "Gonzalo Pozo - Full Stack Developer",
    description:
      "Full Stack Developer portfolio showcasing projects, work experiences, and technical skills.",
    url: "https://gonzalopozo.dev",
    siteName: "Gonzalo Pozo Portfolio",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Gonzalo Pozo - Full Stack Developer Portfolio",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  // Twitter / X Cards
  twitter: {
    card: "summary_large_image",
    title: "Gonzalo Pozo - Full Stack Developer",
    description:
      "Full Stack Developer portfolio showcasing projects, work experiences, and technical skills.",
    creator: "@your_twitter_handle",
    images: ["/og-image.png"],
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Icons
  icons: {
    icon: "/icon.png",
    shortcut: "/shortcut-icon.png",
    apple: "/apple-icon.png",
  },

  // Google Search Console Verification
  verification: {
    google: "your-google-verification-code",
  },

  // Canonical URL
  alternates: {
    canonical: "https://gonzalopozo.dev",
  },
};
```

### OG Image Generation

Create `app/(public)/opengraph-image.tsx` to auto-generate Open Graph images using `next/og`:

```typescript
import { ImageResponse } from "next/og";

export const alt = "Gonzalo Pozo - Full Stack Developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64,
          background: "linear-gradient(to bottom right, #0a0a0a, #1a1a2e)",
          color: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 48,
        }}
      >
        <div style={{ fontWeight: "bold" }}>Gonzalo Pozo</div>
        <div style={{ fontSize: 32, marginTop: 16, opacity: 0.8 }}>
          Full Stack Developer
        </div>
      </div>
    ),
    { ...size }
  );
}
```

### Sitemap

Create `app/sitemap.ts` to generate a sitemap for search engines:

```typescript
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://gonzalopozo.dev",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
```

### Robots

Create `app/robots.ts` to control search engine crawling:

```typescript
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/login/", "/api/"],
    },
    sitemap: "https://gonzalopozo.dev/sitemap.xml",
  };
}
```

### SEO Best Practices

- **Title**: Maximum 60 characters to avoid truncation in search results
- **Description**: Between 150-160 characters for optimal Google display
- **Keywords**: 5-10 relevant keywords is sufficient
- **OG Images**: Use 1200x630px for Open Graph (Facebook, LinkedIn)
- **Twitter Images**: 1200x600px works best for Twitter Cards (falls back to OG image if not provided)
- **Canonical URL**: Always set `alternates.canonical` to prevent duplicate content issues
- **metadataBase**: Set in root layout so all relative URLs in metadata resolve correctly
- **Admin routes**: Always disallow `/dashboard/`, `/login/`, and `/api/` in robots.txt
- **Static metadata**: Use the `metadata` object for static pages (portfolio homepage)
- **Dynamic metadata**: Use `generateMetadata()` only when content varies per page (not needed for single-page portfolio)

### Metadata File Conventions

Place these files in the `app/` directory:

| File | Purpose |
| ---- | ------- |
| `favicon.ico` | Browser tab favicon |
| `icon.png` / `icon.svg` | App icon |
| `apple-icon.png` | Apple touch icon |
| `opengraph-image.png` or `opengraph-image.tsx` | Open Graph image (1200x630px) |
| `twitter-image.png` or `twitter-image.tsx` | Twitter card image (optional, falls back to OG) |
| `sitemap.ts` / `sitemap.xml` | Sitemap for search engines |
| `robots.ts` / `robots.txt` | Robots directives for crawlers |
| `manifest.ts` / `manifest.json` | Web app manifest (PWA) |

## Performance

See [AGENTS-PERFORMANCE.md](./AGENTS-PERFORMANCE.md) for detailed performance guidelines covering:

- **React Compiler** — auto-memoization, no `useMemo`/`useCallback`/`React.memo` needed, no `React.forwardRef` in React 19
- **Dynamic Imports & Code Splitting** — when and how to use `next/dynamic` for heavy components
- **Loading Files & Streaming** — `loading.tsx` skeleton UIs, granular `<Suspense>` boundaries, which routes need loading files
- **Bundle Optimization** — `optimizePackageImports` config, import best practices, bundle analysis with `pnpm next experimental-analyze`
- **Server vs Client Components Decision Tree** — project-specific component boundary guidance
- **Performance Checklist** — pre-deployment verification checklist

The following topics are fully covered by installed skills (no duplication needed):

| Topic | Skill |
| --- | --- |
| Cache Components / PPR | `next-cache-components` |
| Image Optimization | `next-best-practices/image.md` |
| Data Fetching Patterns | `next-best-practices/data-patterns.md` |
| Avoiding Waterfalls | `vercel-react-best-practices` (async-* rules) |
| RSC Boundaries | `next-best-practices/rsc-boundaries.md` |
| Bundle Issues (incompatible packages) | `next-best-practices/bundling.md` |

## Accessibility

See [AGENTS-ACCESSIBILITY.md](./AGENTS-ACCESSIBILITY.md) for detailed accessibility guidelines covering:

- **Next.js Components over HTML** — always use `<Link>`, `<Form>`, `<Image>`, `next/font`, `<Script>` instead of HTML equivalents
- **Semantic Layout Structure** — landmarks (`<header>`, `<main>`, `<footer>`, `<nav>`, `<section>`), `aria-label` for multiple navs
- **Skip Link** — keyboard bypass for navigation, Tailwind `sr-only` implementation
- **shadcn Component Accessibility Notes** — icon button `aria-label`, Dialog focus trap (Radix), Table `scope`/`caption`, Select/DropdownMenu labels
- **Accessible Forms** — `FormLabel`, `FormMessage`, `aria-required`, `aria-invalid`, required field indication
- **Sonner Toasts as ARIA Live Regions** — automatic `role="status"`/`role="alert"`, usage rules
- **Accessible Images** — alt text strategy (informative, decorative, complex), `next/image` enforcement
- **Motion Preferences** — `prefers-reduced-motion` CSS, `forced-colors` support for `tw-animate-css`
- **Color Contrast** — WCAG AA thresholds (4.5:1, 3:1), focus indicators, theme variable verification
- **Responsive Accessibility** — mobile navigation `aria-expanded`, touch targets, reflow at 320px
- **Route Announcements** — Next.js built-in route announcer, why unique page titles and `<h1>` elements matter
- **Heading Hierarchy** — `h1`-`h3` structure for public page and admin dashboard
- **ESLint Accessibility Linting** — `eslint-plugin-jsx-a11y` included by default, `pnpm lint` catches ARIA errors
- **Accessibility Checklist** — pre-deployment manual testing and Lighthouse audit (target ≥ 90)

The following topics are fully covered by installed skills (no duplication needed):

| Topic | Skill |
| --- | --- |
| WCAG 2.1 principles (POUR), contrast ratios, ARIA usage, keyboard patterns, screen reader commands | `accessibility` |
| WCAG 2.2 audit checklists (every criterion), axe-core testing, remediation patterns | `wcag-audit-patterns` |
| Radix UI built-in ARIA compliance for Dialog, Select, Tabs, DropdownMenu | `shadcn-ui` |

## Animations

See [AGENTS-ANIMATIONS.md](./AGENTS-ANIMATIONS.md) for detailed animation guidelines covering:

- **When to Use Each Layer** — decision table for choosing between Tailwind CSS, Motion, and NumberFlow
- **Tailwind CSS Animations** — built-in utilities (`animate-spin`, `animate-pulse`, `animate-bounce`, `animate-ping`), transition utilities, `motion-safe:`/`motion-reduce:` variants, custom animations with `@theme`
- **Motion (Framer Motion)** — import from `motion/react`, basic animations (`initial`/`animate`/`exit`), icon state transitions with `AnimatePresence`, layout animations (`layout` prop), key concepts table (`layoutId`, `whileHover`, `useInView`, `useScroll`), integration with Server Components
- **NumberFlow** — smooth number transitions, `Intl.NumberFormat` options, prefix/suffix support, `tabular-nums` class requirement, where to use in this project
- **Animation Performance** — safe vs unsafe properties to animate, `will-change` usage rules, bundle impact and dynamic imports
- **Animation UX Guidelines** — timing table (100ms–750ms by animation type), easing guide (ease-out for enter, ease-in for exit), do's and don'ts
- **Animation Checklist** — pre-deployment verification for performance, reduced motion, bundle size, accessibility, timing, easing, and purpose

## Design Patterns

See [AGENTS-PATTERNS.md](./AGENTS-PATTERNS.md) for detailed design pattern guidelines covering:

- **Container-Presentational Pattern** — separate data fetching (page files) from UI rendering (extracted components), shared formatting utilities in `lib/utils.ts`
- **Server Action Hardening (Strategy-like)** — 4-step template (authenticate, validate, execute, revalidate), Zod schemas per entity in `lib/schemas/`, consistent error return types
- **Data Access Facade** — centralized query functions in `lib/queries/`, pages never import `db` directly, caching added in one place
- **Error Boundaries** — `error.tsx` files for error recovery, `loading.tsx` for loading states, generic error UI with retry mechanism

The following topics are fully covered by installed skills (no duplication needed):

| Topic | Skill |
| --- | --- |
| Component architecture, compound components, state management | `vercel-composition-patterns` |
| Server Action auth/authorization patterns, Zod validation | `vercel-react-best-practices` |

## Upcoming Features

- Education section (courses, diplomas, certifications)
- Enhanced public page design
- Image uploads for projects/experiences

## Documentation Links

- [Next.js 16 Docs](https://nextjs.org/docs)
- [React 19 Reference](https://react.dev/reference/react)
- [Tailwind CSS 4.1](https://tailwindcss.com/docs)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview)
- [Turso Cloud](https://docs.turso.tech/turso-cloud)
- [better-auth](https://www.better-auth.com/docs/introduction)
- [shadcn/ui](https://ui.shadcn.com/docs)
- [Lucide Icons](https://lucide.dev/guide/)
- [react-icons](https://react-icons.github.io/react-icons/)
- [Sonner](https://sonner.emilkowal.ski/)
- [pnpm](https://pnpm.io/motivation)
- [WCAG 2.2 Guidelines](https://www.w3.org/TR/WCAG22/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Next.js Accessibility](https://nextjs.org/docs/app/guides/accessibility)
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Motion for React](https://motion.dev/docs/react-quick-start)
- [NumberFlow for React](https://number-flow.barvian.me/)
- [Tailwind CSS Animation](https://tailwindcss.com/docs/animation)
- [Next.js Content Security Policy](https://nextjs.org/docs/app/guides/content-security-policy)
- [Next.js Security Headers](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers)
- [better-auth Next.js Auth Protection](https://www.better-auth.com/docs/integrations/next#auth-protection)
- [Vercel Security](https://vercel.com/docs/security)
- [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Zod](https://zod.dev/)
- [pnpm audit](https://pnpm.io/cli/audit)
- [HSTS Preload](https://hstspreload.org/)
- [Skills.sh](https://skills.sh/docs)