# AGENTS-PATTERNS.md

Design pattern guidelines and Next.js file-system conventions for the portfolio project. This document covers four design patterns adopted to improve code organization, security, error resilience, and maintainability, plus a comprehensive reference of all Next.js 16 file-system conventions and how they apply to this project.

**Related coverage (do not duplicate):**

- `AGENTS-SECURITY.md` > Server Actions Security — the 4-step authenticate/validate/execute/revalidate pattern
- `AGENTS-SECURITY.md` > Input Validation with Zod — schema definitions and validation rules
- `AGENTS-SECURITY.md` > Content Security Policy — `proxy.ts` nonce generation and CSP directives
- `AGENTS-TESTING.md` > Testing Philosophy — TDD strategy for Zod schemas and server action logic
- `AGENTS-PERFORMANCE.md` > Server vs Client Components — decision tree for component boundaries
- `AGENTS-PERFORMANCE.md` > Loading Files & Streaming — `loading.tsx` skeleton UIs, granular `<Suspense>` boundaries
- `AGENTS-ACCESSIBILITY.md` > Semantic Layout Structure — layout landmarks, heading hierarchy
- `AGENTS.md` > SEO & Metadata — `metadata` export template, OG images, sitemap, robots
- `vercel-composition-patterns` skill — compound components, render props, context providers
- `vercel-react-best-practices` skill — Server Action auth/authorization, bundle optimization
- `next-best-practices` skill > `file-conventions.md` — detailed file convention reference
- `next-best-practices` skill > `error-handling.md` — `forbidden()`, `unauthorized()`, error patterns
- `next-best-practices` skill > `metadata.md` — metadata file conventions, OG image generation

---

## Overview

These four patterns address specific gaps identified in the project. Each pattern solves a concrete problem — they are not adopted for academic completeness.

| Pattern | What It Solves | Where It Applies |
| --- | --- | --- |
| Container-Presentational | Page files mix data fetching with 200+ lines of UI rendering | Admin dashboard pages, future public page |
| Server Action Hardening (Strategy-like) | Actions have no auth, no validation, no error handling | All files in `lib/actions/` |
| Data Access Facade | DB queries are duplicated inline across page files | All pages that query the database |
| Error Boundaries | Zero error recovery — a failed DB query crashes the entire page | All route segments |

---

## 1. Container-Presentational Pattern

### The Problem

Admin dashboard pages are Server Components that fetch data **and** render the full UI in a single file. For example, `app/(admin)/dashboard/projects/page.tsx` is 200+ lines containing a Drizzle query, formatting functions (`formatDate`, `getStatusVariant`, `getStatusLabel`), empty state UI, a full data table, and action buttons — all in one component.

This creates:
- Large page files that are hard to navigate
- Formatting logic duplicated between pages (e.g., `formatDate` is defined separately in both `projects/page.tsx` and `experiences/page.tsx`)
- UI components that can't be reused or tested in isolation

### The Pattern

Split each page into two layers:

- **Container** (Server Component — the `page.tsx` file): Handles data fetching, authentication, and passes data as props.
- **Presentational** (Client or Server Component): Receives data via props and handles only rendering and UI interactions.

### Structure

```
app/(admin)/dashboard/projects/
├── page.tsx                    # Container — fetches data, passes props
components/admin/
├── projects-table.tsx          # Presentational — renders the table UI
├── experiences-table.tsx       # Presentational — renders experiences table
├── skills-table.tsx            # Presentational — renders skills table
├── social-links-table.tsx      # Presentational — renders social links table
├── entity-empty-state.tsx      # Shared presentational — reusable empty state
```

### Implementation

**Container** — keeps the page file focused on data orchestration:

```typescript
// app/(admin)/dashboard/projects/page.tsx
import { getProjectsWithSkills } from "@/lib/queries/projects";
import { ProjectsTable } from "@/components/admin/projects-table";
import { getServerSession } from "@/lib/server-session";
import { redirect } from "next/navigation";

export default async function ProjectsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const projects = await getProjectsWithSkills();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proyectos</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus proyectos del portfolio
          </p>
        </div>
        {/* "New" button */}
      </div>
      <ProjectsTable projects={projects} />
    </div>
  );
}
```

**Presentational** — receives data via props, owns only rendering logic:

```typescript
// components/admin/projects-table.tsx
"use client";

import type { ProjectInfo } from "@/lib/types";
import { deleteProject } from "@/lib/actions/projects";
// ... UI imports

interface ProjectsTableProps {
  projects: ProjectInfo[];
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
  if (projects.length === 0) {
    return <EntityEmptyState /* ... */ />;
  }

  return (
    <Card>
      {/* Table rendering, formatting, action buttons */}
    </Card>
  );
}
```

### Rules

- **Page files (`page.tsx`) should not exceed ~50 lines** — if they do, UI is leaking into the container
- **Presentational components receive all data via props** — they never call `db` directly
- **Formatting utilities shared across pages go in `lib/utils.ts`** — not redefined in each page (e.g., `formatDate`, `getStatusVariant`)
- **Empty states can be a shared component** — the pattern is identical across entities (icon, title, description, CTA button)
- **Presentational components are `"use client"` only when they need interactivity** (delete buttons, sort toggles, etc.) — if they're purely displaying data, keep them as Server Components

### Shared Formatting Utilities

Extract duplicated formatting functions to `lib/utils.ts`:

```typescript
// lib/utils.ts (additions)

export function formatDate(date: Date | null, options?: Intl.DateTimeFormatOptions) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  });
}

export function formatDateRange(startDate: Date | null, endDate: Date | null) {
  const start = formatDate(startDate, { day: undefined });
  const end = endDate ? formatDate(endDate, { day: undefined }) : "Presente";
  if (!start) return "—";
  return `${start} - ${end}`;
}
```

---

## 2. Server Action Hardening (Strategy-like Pattern)

### The Problem

Every server action in `lib/actions/` currently:
- **Skips authentication** — no `getServerSession()` check, so unauthenticated requests can mutate data
- **Skips validation** — `formData.get()` values are cast directly with `as string`, trusting client input
- **Has no error handling** — if a database operation fails, the error propagates unhandled
- **Leaves debug code** — `console.log` statements in production code (e.g., `projects.ts` lines 36–43)

### The Pattern

Every server action follows a **4-step strategy**: authenticate, validate, execute, revalidate. Each entity defines its own Zod schema (the "strategy" for validation), but all actions follow the same structural template.

This is inspired by the Strategy pattern — the validation logic varies per entity, but the action structure is identical.

### The 4-Step Template

```typescript
"use server";

import { getServerSession } from "@/lib/server-session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { entitySchema } from "@/lib/schemas/entity";

export async function createEntity(formData: FormData) {
  // 1. AUTHENTICATE
  const session = await getServerSession();
  if (!session) redirect("/login");

  // 2. VALIDATE
  const parsed = entitySchema.safeParse({
    name: formData.get("name"),
    // ... other fields
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  // 3. EXECUTE
  try {
    await db.insert(table).values(parsed.data);
  } catch (error) {
    return { error: "Failed to create entity." };
  }

  // 4. REVALIDATE / REDIRECT
  redirect("/dashboard/entities");
}
```

### Zod Schemas per Entity

Each entity defines its validation schema in `lib/schemas/`. This is where the Strategy-like variation happens — each entity has its own validation rules.

```
lib/schemas/
├── projects.ts       # projectSchema — title, description, status, urls, skillIds
├── experiences.ts    # experienceSchema — role, company, dates, location, skillIds
├── skills.ts         # skillSchema — name, type, icon, url
├── social-links.ts   # socialLinkSchema — name, url, icon
├── settings.ts       # settingsSchema — isEmployed, resumeUrl, statusMessage
```

Example schema:

```typescript
// lib/schemas/projects.ts
import { z } from "zod";

export const projectSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(2000),
  url: z.string().url("Invalid URL").optional().or(z.literal("")),
  repoUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  status: z.enum(["active", "archived", "in-progress"]),
  skillIds: z.array(z.number().int().positive()).default([]),
});
```

### Action Return Type

Actions that can fail should return a consistent shape:

```typescript
type ActionResult =
  | { error: string }
  | { error: Record<string, string[]> }
  | void; // success — redirect happens, nothing returned
```

### Current State vs Target

| Action File | Auth | Validation | Error Handling | Status |
| --- | --- | --- | --- | --- |
| `lib/actions/projects.ts` | Missing | Missing | Missing | Needs all 3 |
| `lib/actions/experiences.ts` | Missing | Missing | Missing | Needs all 3 |
| `lib/actions/skills.ts` | Missing | Missing | Missing | Needs all 3 |
| `lib/actions/social-links.ts` | Missing | Missing | Missing | Needs all 3 |
| `lib/actions/settings.ts` | Missing | Missing | Missing | Needs all 3 |

### Rules

- **Every server action must start with `getServerSession()`** — no exceptions. If the session is `null`, redirect to `/login`
- **Every action must validate input with Zod** — never trust `formData.get()` directly
- **Use `safeParse`, not `parse`** — `parse` throws, `safeParse` returns a result object you can handle gracefully
- **Wrap database operations in try-catch** — return a user-friendly error message, never expose raw database errors
- **Remove all `console.log` statements** — use proper error logging or remove entirely
- **Transform empty strings to `undefined`** — form inputs submit `""` for empty optional fields; Zod's `.or(z.literal(""))` or a `.transform()` handles this

### Migration Order

When hardening existing actions, follow this order per entity:

1. Create the Zod schema in `lib/schemas/`
2. Write Vitest tests for the schema (TDD — see `AGENTS-TESTING.md`)
3. Add `getServerSession()` to each action
4. Add `safeParse` validation
5. Wrap DB operations in try-catch
6. Remove `console.log` statements
7. Test the full flow in the browser

---

## 3. Data Access Facade

### The Problem

Dashboard pages query the database directly with inline Drizzle queries:

```typescript
// app/(admin)/dashboard/projects/page.tsx
const projectsData = await db.query.projects.findMany({
  with: {
    projectSkills: {
      columns: {},
      with: {
        skill: {
          columns: { id: true, name: true },
        },
      },
    },
  },
});
```

This creates:
- **Duplicated queries** — the public page will need the same data with the same relations, leading to copy-paste
- **Scattered data logic** — if you add caching, change relations, or add filtering, you hunt through page files
- **Harder testing** — you can't mock a single query function; you must mock the entire `db` object

### The Pattern

Create a `lib/queries/` folder with one file per entity. Each file exports simple, named functions that encapsulate Drizzle queries. Pages import and call these functions instead of using `db` directly.

This is the Facade pattern: a simplified interface over the Drizzle query subsystem.

### Structure

```
lib/queries/
├── projects.ts        # getProjectsWithSkills, getProjectById
├── experiences.ts     # getExperiencesWithSkills, getExperienceById
├── skills.ts          # getAllSkills
├── social-links.ts    # getAllSocialLinks
├── settings.ts        # getSiteSettings
```

### Implementation

```typescript
// lib/queries/projects.ts
import { db } from "@/db";
import { projects } from "@/db/schema/portfolio";
import { asc, eq } from "drizzle-orm";

export async function getProjectsWithSkills() {
  return db.query.projects.findMany({
    with: {
      projectSkills: {
        columns: {},
        with: {
          skill: {
            columns: { id: true, name: true },
          },
        },
      },
    },
    orderBy: [asc(projects.order)],
  });
}

export async function getProjectById(id: number) {
  return db.query.projects.findFirst({
    where: eq(projects.id, id),
    with: {
      projectSkills: {
        columns: {},
        with: {
          skill: true,
        },
      },
    },
  });
}
```

### Before and After

**Before** (inline query in page):

```typescript
// app/(admin)/dashboard/projects/page.tsx
export default async function ProjectsPage() {
  const projectsData: ProjectInfo[] = await db.query.projects.findMany({
    with: {
      projectSkills: {
        columns: {},
        with: { skill: { columns: { id: true, name: true } } },
      },
    },
  });
  // ... 180 lines of UI
}
```

**After** (facade call in page):

```typescript
// app/(admin)/dashboard/projects/page.tsx
import { getProjectsWithSkills } from "@/lib/queries/projects";

export default async function ProjectsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const projects = await getProjectsWithSkills();

  return <ProjectsTable projects={projects} />;
}
```

### Adding Caching Later

The facade makes it trivial to add caching in one place:

```typescript
// lib/queries/projects.ts
import "server-only";
import { unstable_cacheLife as cacheLife } from "next/cache";

export async function getProjectsWithSkills() {
  "use cache";
  cacheLife("minutes");

  return db.query.projects.findMany({ /* ... */ });
}
```

Every page that calls `getProjectsWithSkills()` automatically benefits — no changes needed at the call sites.

### Rules

- **Pages never import `db` directly** — always go through `lib/queries/`
- **Server actions still use `db` directly** — actions perform writes (insert, update, delete) which don't benefit from a read-only facade
- **One file per entity** — mirrors the structure of `lib/actions/`
- **Functions return Drizzle result types** — no need to manually define return types; TypeScript infers them from the query
- **Add `"server-only"` import** — prevents accidentally importing query functions in client components
- **Keep functions simple** — each function wraps a single Drizzle query. Don't add business logic here; that belongs in actions

---

## 4. Error Boundaries

### The Problem

The project has **zero error recovery**:
- No `error.tsx` files in any route segment
- No `try-catch` in server actions
- No `loading.tsx` for loading states

If a database query fails, the user sees Next.js's default error page with no way to retry or navigate back.

### The Pattern

Next.js Error Boundaries use `error.tsx` files to catch runtime errors within a route segment. Each `error.tsx` wraps its sibling `page.tsx` in a React Error Boundary, providing a fallback UI with a retry mechanism.

### Structure

```
app/
├── error.tsx                           # Root fallback (catches errors from root layout children)
├── (admin)/
│   └── dashboard/
│       ├── error.tsx                   # Catches errors in all dashboard routes
│       ├── projects/
│       │   └── error.tsx               # Optional: project-specific error UI
│       ├── experiences/
│       │   └── error.tsx               # Optional: experience-specific error UI
│       └── ...
├── (public)/
│   └── error.tsx                       # Catches errors on the public portfolio page
```

### Minimum Required Error Boundaries

At a minimum, create these three `error.tsx` files:

| File | Catches |
| --- | --- |
| `app/error.tsx` | Any unhandled error in the app (root-level fallback) |
| `app/(admin)/dashboard/error.tsx` | Database failures, auth errors in all dashboard pages |
| `app/(public)/error.tsx` | Database failures when loading the public portfolio |

### Implementation

```typescript
// app/(admin)/dashboard/error.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <div className="rounded-full bg-destructive/10 p-4 mb-4">
            <AlertTriangle className="size-8 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Algo salió mal</h2>
          <p className="text-muted-foreground mb-6">
            Ha ocurrido un error inesperado. Puedes intentar de nuevo o volver al inicio.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => window.location.href = "/dashboard"}>
              Ir al inicio
            </Button>
            <Button onClick={reset}>
              Intentar de nuevo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### How `error.tsx` Works

1. When a Server Component (like a page) throws during rendering, Next.js catches the error
2. It renders the nearest `error.tsx` ancestor instead of the failed page
3. The `error` prop contains the error object (with a `digest` for server-side errors — do not expose raw messages to users)
4. The `reset` function re-renders the route segment, which retries the data fetch
5. `error.tsx` must be a **Client Component** (`"use client"`) — this is a Next.js requirement

### Error Logging

Never display raw error messages to users. Instead, log them server-side for debugging:

```typescript
// In error.tsx — log but don't display
useEffect(() => {
  console.error("Dashboard error:", error);
  // TODO: Send to error tracking service (Sentry, etc.)
}, [error]);
```

### Rules

- **`error.tsx` must have `"use client"`** — this is required by Next.js, as error boundaries are Client Components
- **Never display `error.message` to users** — it may contain internal details (SQL errors, stack traces). Show a generic message instead
- **Always provide a `reset` button** — gives users a way to retry without navigating away
- **Always provide a "go back" escape hatch** — in case `reset` doesn't fix the issue
- **Use `error.digest` for server-side error correlation** — the digest is a hash that can be matched to server logs
- **Root `error.tsx` does not catch root layout errors** — for that, use `global-error.tsx` (only needed if the root layout itself can fail, which is unlikely in this project)
- **Pair with `loading.tsx`** — error boundaries handle failures; loading files handle the pending state while data fetches. Both are needed for a complete UX

### Loading Files

Loading files provide instant feedback while data is being fetched. Create `loading.tsx` files in the same route segments as `error.tsx`:

```typescript
// app/(admin)/dashboard/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <Skeleton className="h-[400px] w-full rounded-lg" />
    </div>
  );
}
```

---

## 5. Next.js File-System Conventions

Next.js uses a file-system based router where specific file names inside the `app/` directory have special meaning. This section documents every convention, whether the project uses it, and project-specific guidance.

Reference: [Next.js File Conventions](https://nextjs.org/docs/app/api-reference/file-conventions)

### Quick Reference Table

| Convention | File | Used in Project | Status |
| --- | --- | --- | --- |
| [Page](#page) | `page.tsx` | Yes — 9 pages across admin and public routes | Active |
| [Layout](#layout) | `layout.tsx` | Yes — root, admin dashboard, public | Active |
| [Loading](#loading) | `loading.tsx` | No | **Needed** — add per Error Boundaries pattern (section 4) |
| [Error](#error) | `error.tsx` | No | **Needed** — add per Error Boundaries pattern (section 4) |
| [Global Error](#global-error) | `global-error.tsx` | No | Optional — only if root layout can fail |
| [Not Found](#not-found) | `not-found.tsx` | No | **Needed** — custom 404 for admin and public |
| [Forbidden](#forbidden) | `forbidden.tsx` | No | Optional — experimental, not recommended for production yet |
| [Unauthorized](#unauthorized) | `unauthorized.tsx` | No | Optional — experimental, not recommended for production yet |
| [Route Handler](#route-handler) | `route.ts` | Yes — `app/api/auth/[...all]/route.ts`, `app/api/auth/clear-invalid-session/route.ts` | Active |
| [Proxy](#proxy) | `proxy.ts` | Yes — root `proxy.ts` for auth redirects and CSP | Active |
| [Template](#template) | `template.tsx` | No | Not needed for this project |
| [Default](#default) | `default.tsx` | No | Not needed — no Parallel Routes |
| [Route Groups](#route-groups) | `(folder)` | Yes — `(admin)`, `(public)` | Active |
| [Dynamic Segments](#dynamic-segments) | `[param]`, `[...param]`, `[[...param]]` | Yes — `[id]` in dashboard, `[...all]` in auth | Active |
| [Parallel Routes](#parallel-routes) | `@folder` | No | Not needed for this project |
| [Intercepting Routes](#intercepting-routes) | `(.)`, `(..)`, `(..)(..)`  | No | Not needed for this project |
| [Route Segment Config](#route-segment-config) | `export const dynamic`, etc. | No | May be useful for public page caching |
| [Instrumentation](#instrumentation) | `instrumentation.ts` | No | Optional — for future observability |
| [Instrumentation Client](#instrumentation-client) | `instrumentation-client.ts` | No | Optional — for future client-side monitoring |
| [MDX Components](#mdx-components) | `mdx-components.tsx` | No | Not needed — no MDX content |
| [Public Folder](#public-folder) | `public/` | Yes | Active |
| [Src Folder](#src-folder) | `src/` | No | Not used — project uses root `app/` |
| [Metadata Files](#metadata-files) | Various | Partially — templates in `AGENTS.md`, not yet created | **Needed** before deployment |

---

### Page

**File**: `page.tsx` — Makes a route segment publicly accessible.

**Used in project**: Yes.

| Page | Path |
| --- | --- |
| Root redirect | `app/page.tsx` |
| Public portfolio | `app/(public)/page.tsx` |
| Login | `app/(admin)/login/page.tsx` |
| Dashboard overview | `app/(admin)/dashboard/page.tsx` |
| Projects list | `app/(admin)/dashboard/projects/page.tsx` |
| New project | `app/(admin)/dashboard/projects/new/page.tsx` |
| Edit project | `app/(admin)/dashboard/projects/[id]/edit/page.tsx` |
| ... (same pattern for experiences, skills, social-links, settings) | |

**Project rules**:
- Pages are async Server Components — they fetch data and render content
- After applying the Container-Presentational pattern (section 1), pages should be thin containers (~50 lines max)
- Every admin page must call `getServerSession()` at the top
- The `page.tsx` default export receives optional `params` and `searchParams` props (both are promises in Next.js 16)

```typescript
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  // ...
}
```

---

### Layout

**File**: `layout.tsx` — Shared UI that wraps a route segment and its children. Persists across navigations without re-rendering.

**Used in project**: Yes.

| Layout | Path | Purpose |
| --- | --- | --- |
| Root | `app/layout.tsx` | HTML shell, fonts, global styles, metadata |
| Admin dashboard | `app/(admin)/dashboard/layout.tsx` | Sidebar, header, auth wrapper |
| Public | `app/(public)/layout.tsx` | Public page shell with semantic landmarks |

**Project rules**:
- Root layout must include `<html>` and `<body>` tags
- Layouts are Server Components by default — keep them as Server Components
- The admin dashboard layout should eventually use real session data instead of the current `mockUser`
- Layouts **cannot** access `searchParams` — only `params` and `children`
- Do **not** add `"use client"` to layouts unless absolutely necessary

```typescript
export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  return <section>{children}</section>;
}
```

---

### Loading

**File**: `loading.tsx` — Instant loading UI shown while a route segment's content is being fetched. Wraps the sibling `page.tsx` in a `<Suspense>` boundary automatically.

**Used in project**: No — **needs to be added**.

See [Error Boundaries pattern (section 4)](#4-error-boundaries) for the implementation template and which route segments need `loading.tsx` files.

**Key behaviors**:
- Shown immediately on navigation — provides instant feedback before data arrives
- Server Component by default — can render Skeleton components without JS
- Shared layouts remain interactive while loading shows
- Navigation is interruptible — user can navigate away before loading completes
- Does **not** affect SEO — streaming is server-rendered

**Where to add in this project**:

| File | Why |
| --- | --- |
| `app/(admin)/dashboard/loading.tsx` | All dashboard pages fetch from DB — show skeleton while loading |
| `app/(public)/loading.tsx` | Public page fetches all portfolio data — show skeleton on slow connections |

---

### Error

**File**: `error.tsx` — Fallback UI when a runtime error occurs in a route segment. Must be a Client Component (`"use client"`).

**Used in project**: No — **needs to be added**.

See [Error Boundaries pattern (section 4)](#4-error-boundaries) for the full implementation, props reference, and placement strategy.

**Props**:
- `error: Error & { digest?: string }` — the error object. In production, server errors show a generic message; use `digest` to correlate with server logs
- `reset: () => void` — re-renders the route segment to attempt recovery

**Key behaviors**:
- Wraps `page.tsx` in a React Error Boundary
- Errors bubble up to the nearest parent `error.tsx` if not caught locally
- Does **not** catch errors in the same-level `layout.tsx` — only in `page.tsx` and children
- Root `app/error.tsx` does **not** catch root layout errors (use `global-error.tsx` for that)

---

### Global Error

**File**: `global-error.tsx` — Catches errors in the root layout itself. Must include its own `<html>` and `<body>` tags because it replaces the entire root layout.

**Used in project**: No.

**Project guidance**: Not needed unless the root layout starts performing async operations that could fail. The root layout in this project only sets up fonts and global styles, which don't throw at runtime.

```typescript
// app/global-error.tsx
"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
```

---

### Not Found

**File**: `not-found.tsx` — UI shown when the `notFound()` function is called within a route segment.

**Also**: `global-not-found.tsx` (experimental) — global 404 for unmatched URLs across the entire app.

**Used in project**: No — **should be added**.

**Where to add**:

| File | Purpose |
| --- | --- |
| `app/not-found.tsx` | Root-level 404 for unmatched URLs. Shows a styled "page not found" with link back to home |
| `app/(admin)/dashboard/not-found.tsx` | Shown when `notFound()` is called in dashboard pages (e.g., editing a project that doesn't exist) |

**Implementation**:

```typescript
// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <h2 className="text-2xl font-bold mb-2">Página no encontrada</h2>
      <p className="text-muted-foreground mb-6">
        La página que buscas no existe.
      </p>
      <Link href="/" className="text-primary hover:underline">
        Volver al inicio
      </Link>
    </div>
  );
}
```

**Using `notFound()` in pages** — call it when a resource doesn't exist:

```typescript
import { notFound } from "next/navigation";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProjectById(Number(id));

  if (!project) notFound();

  return <ProjectForm project={project} />;
}
```

**Key behaviors**:
- `not-found.tsx` is a Server Component — can fetch data
- Returns `200` status for streamed responses, `404` for non-streamed
- Root `app/not-found.tsx` handles any unmatched URL in the app

---

### Forbidden

**File**: `forbidden.tsx` — UI shown when the `forbidden()` function is called. Returns a `403` status code.

**Status**: Experimental — not recommended for production yet.

**Used in project**: No.

**Project guidance**: Not needed now. The project uses `redirect("/login")` for unauthorized access, which is sufficient. When `forbidden()` stabilizes, it could replace the redirect pattern for cases where the user is authenticated but lacks permissions (e.g., non-admin user trying to access dashboard). Requires `experimental.authInterrupts: true` in `next.config.ts` to enable.

---

### Unauthorized

**File**: `unauthorized.tsx` — UI shown when the `unauthorized()` function is called. Returns a `401` status code.

**Status**: Experimental — not recommended for production yet.

**Used in project**: No.

**Project guidance**: Same as `forbidden.tsx`. When stable, `unauthorized()` could replace `redirect("/login")` in pages and server actions to show a login form in-place instead of redirecting. Requires `experimental.authInterrupts: true` in `next.config.ts` to enable.

---

### Route Handler

**File**: `route.ts` — Custom request handlers using the Web Request/Response APIs. Replaces API Routes from the Pages Router.

**Used in project**: Yes.

| Route Handler | Path | Purpose |
| --- | --- | --- |
| Auth catch-all | `app/api/auth/[...all]/route.ts` | better-auth handles all auth endpoints |
| Clear invalid session | `app/api/auth/clear-invalid-session/route.ts` | Clears stale session cookies |

**Project rules**:
- Prefer Server Actions over Route Handlers for data mutations — Route Handlers are only needed for third-party integrations (like better-auth) that require standard HTTP endpoints
- Route Handlers support `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`
- `params` is a promise in Next.js 16 — must be awaited
- A `route.ts` in the same segment as `page.tsx` will conflict — they can't coexist at the same level

```typescript
// app/api/example/route.ts
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  return Response.json({ data: "example" });
}
```

---

### Proxy

**File**: `proxy.ts` — Runs on every matching request before the route is rendered. Used for redirects, rewrites, header modifications, and CSP nonce generation.

**Used in project**: Yes — root `proxy.ts` handles auth redirects and CSP.

**Documented in**: `AGENTS-SECURITY.md` > Content Security Policy, Auth Protection Pattern.

**Key behaviors**:
- Runs at the edge, before rendering
- Can rewrite, redirect, or produce responses
- Cannot access the request body
- Keep logic fast — avoid heavy DB calls

---

### Template

**File**: `template.tsx` — Like a layout, but **remounts on every navigation** (gives children a unique key). DOM is recreated, effects re-run, state resets.

**Used in project**: No.

**When to use (not currently needed)**:
- To reset form state between navigations (e.g., a search input that should clear when changing pages)
- To re-trigger `useEffect` on every navigation
- To show a Suspense fallback on every navigation (layouts only show it on first load)

**Layout vs Template**:

| Behavior | `layout.tsx` | `template.tsx` |
| --- | --- | --- |
| Persists across navigations | Yes | No |
| Preserves state | Yes | No — state resets |
| Re-runs `useEffect` | No | Yes |
| Suspense fallback | First load only | Every navigation |

**Nesting order**: `layout.tsx` → `template.tsx` → `page.tsx`

---

### Default

**File**: `default.tsx` — Fallback for Parallel Route slots when Next.js can't recover the active state after a full-page load (hard navigation).

**Used in project**: No — the project does not use Parallel Routes.

**When needed**: Only required when using `@slot` Parallel Routes. If a slot doesn't have a matching page for the current URL after a hard refresh, `default.tsx` renders instead. Without it, Next.js returns an error for named slots.

---

### Route Groups

**Convention**: `(folder)` — Organize routes without affecting the URL path. Used for shared layouts and logical grouping.

**Used in project**: Yes.

| Route Group | Path | Purpose |
| --- | --- | --- |
| `(admin)` | `app/(admin)/` | Groups login and dashboard routes under a shared admin context |
| `(public)` | `app/(public)/` | Groups the public portfolio page with its own layout |

**Project rules**:
- Route group names are stripped from the URL — `app/(admin)/dashboard/` maps to `/dashboard`
- Each route group can have its own `layout.tsx`, `error.tsx`, `loading.tsx`, `not-found.tsx`
- Never nest route groups unnecessarily — keep the hierarchy flat

---

### Dynamic Segments

**Convention**: `[param]` for single, `[...param]` for catch-all, `[[...param]]` for optional catch-all.

**Used in project**: Yes.

| Segment | Path | Purpose |
| --- | --- | --- |
| `[id]` | `app/(admin)/dashboard/projects/[id]/edit/` | Edit a specific project by ID |
| `[id]` | `app/(admin)/dashboard/experiences/[id]/edit/` | Edit a specific experience by ID |
| `[id]` | `app/(admin)/dashboard/skills/[id]/edit/` | Edit a specific skill by ID |
| `[...all]` | `app/api/auth/[...all]/` | Catch-all for better-auth endpoints |

**Project rules**:
- `params` is a **promise** in Next.js 16 — always `await params` before accessing properties
- Validate `id` params before using them — parse as `Number(id)` and call `notFound()` if the entity doesn't exist

```typescript
const { id } = await params;
const numericId = Number(id);
if (isNaN(numericId)) notFound();
```

---

### Parallel Routes

**Convention**: `@folder` — Render multiple pages in the same layout simultaneously, each navigable independently.

**Used in project**: No.

**When useful (not currently needed)**: Dashboards with independent panels (e.g., `@analytics` and `@team` side by side), modals that preserve background content. This project's dashboard pages are sequential, not parallel.

---

### Intercepting Routes

**Convention**: `(.)folder`, `(..)folder`, `(..)(..)folder`, `(...)folder` — Intercept a route and render it in the current layout while the URL changes.

**Used in project**: No.

**When useful (not currently needed)**: Modal patterns where clicking a link shows a modal overlay but direct URL access shows a full page (e.g., photo gallery modals). Could be useful if the project adds "quick edit" modals for projects/skills.

---

### Route Segment Config

**Convention**: Named exports in `page.tsx`, `layout.tsx`, or `route.ts` that configure rendering behavior.

**Used in project**: No.

**Available options**:

| Export | Type | Default | Purpose |
| --- | --- | --- | --- |
| `dynamic` | `'auto' \| 'force-dynamic' \| 'error' \| 'force-static'` | `'auto'` | Control static vs dynamic rendering |
| `dynamicParams` | `boolean` | `true` | Allow dynamic segments not in `generateStaticParams` |
| `revalidate` | `false \| 0 \| number` | `false` | Default revalidation time (seconds) |
| `fetchCache` | `'auto' \| 'force-cache' \| ...` | `'auto'` | Override fetch cache behavior |
| `runtime` | `'nodejs' \| 'edge'` | `'nodejs'` | Execution runtime |
| `preferredRegion` | `'auto' \| 'global' \| 'home' \| string[]` | `'auto'` | Deployment region preference |
| `maxDuration` | `number` | Platform default | Maximum execution time (seconds) |

**Important**: These options are disabled when `cacheComponents: true` is set in `next.config.ts` (which this project uses). They will eventually be deprecated in favor of the `"use cache"` directive. Prefer the Data Access Facade pattern (section 3) with `"use cache"` and `cacheLife()` instead.

**One relevant use case**: The public portfolio page could use `export const revalidate = 60` as a simple caching mechanism if not using `cacheComponents`.

---

### Instrumentation

**File**: `instrumentation.ts` — Runs once when a new Next.js server instance starts. Used for observability tools (OpenTelemetry, error tracking, etc.).

**Used in project**: No.

**Exports**:
- `register()` — Called once at server startup. Use to initialize monitoring SDKs
- `onRequestError(error, request, context)` — Called when a server error occurs. Use to report errors to external services

**When to add**: When the project is deployed to production and needs error tracking (e.g., Sentry) or performance monitoring (e.g., Vercel Analytics, OpenTelemetry).

```typescript
// instrumentation.ts
import { type Instrumentation } from "next";

export function register() {
  // Initialize observability tools
}

export const onRequestError: Instrumentation.onRequestError = async (
  err, request, context
) => {
  // Send error to tracking service
};
```

---

### Instrumentation Client

**File**: `instrumentation-client.ts` — Runs on the client before React hydration. Used for client-side monitoring, analytics, polyfills.

**Used in project**: No.

**Exports**:
- Top-level code runs before the app is interactive
- `onRouterTransitionStart(url, navigationType)` — Called when client-side navigation begins

**When to add**: When the project needs client-side analytics (page views, navigation tracking) or error monitoring (global error listeners).

```typescript
// instrumentation-client.ts
export function onRouterTransitionStart(
  url: string,
  navigationType: "push" | "replace" | "traverse"
) {
  // Track navigation event
}
```

---

### MDX Components

**File**: `mdx-components.tsx` — Required when using `@next/mdx` to render MDX content. Defines how MDX elements map to React components.

**Used in project**: No — the project does not use MDX content.

**When to add**: Only if adding a blog or documentation section written in MDX.

---

### Public Folder

**Directory**: `public/` — Static files served at the root URL. Files are served as-is without processing.

**Used in project**: Yes — `public/` exists for static assets (favicons, images, etc.).

**Project rules**:
- Reference files as `/filename.ext` (not `/public/filename.ext`)
- Only put truly static assets here — don't store generated content
- Metadata files (favicon, OG image, etc.) should use the metadata file conventions in `app/` instead of raw files in `public/` when possible

---

### Src Folder

**Directory**: `src/` — Alternative to placing `app/` at the root. Separates application code from config files.

**Used in project**: No — the project uses root-level `app/`.

**Project guidance**: Do not adopt. The project is already structured with `app/` at the root. Migrating to `src/` would break imports and provide no benefit.

---

### Metadata Files

Metadata files are special files placed in `app/` that generate SEO tags, favicons, sitemaps, and social sharing images.

**Full templates provided in**: `AGENTS.md` > SEO & Metadata section.

| File | Purpose | Status |
| --- | --- | --- |
| `favicon.ico` | Browser tab favicon | **Needed** — place in `app/` |
| `icon.png` / `icon.svg` | App icon (multiple sizes) | **Needed** |
| `apple-icon.png` | Apple touch icon | **Needed** |
| `opengraph-image.tsx` or `.png` | Social sharing image (1200×630px) | **Needed** — template in `AGENTS.md` |
| `twitter-image.tsx` or `.png` | Twitter card image (optional, falls back to OG) | Optional |
| `sitemap.ts` / `sitemap.xml` | Sitemap for search engines | **Needed** — template in `AGENTS.md` |
| `robots.ts` / `robots.txt` | Crawling directives | **Needed** — template in `AGENTS.md` |
| `manifest.ts` / `manifest.json` | Web app manifest (PWA) | Optional |

**Project rules**:
- Prefer `.ts`/`.tsx` files over static files — they're type-safe and can generate content dynamically
- `opengraph-image.tsx` uses `next/og` (`ImageResponse`) to generate images at build time
- `sitemap.ts` should disallow `/dashboard/`, `/login/`, and `/api/` routes
- `robots.ts` should block crawlers from admin routes
- See `AGENTS.md` > SEO & Metadata for complete implementation templates

---

### Convention Nesting Order

When multiple conventions exist in the same route segment, Next.js renders them in this order:

```
layout.tsx
├── template.tsx
│   ├── error.tsx (wraps in Error Boundary)
│   │   ├── loading.tsx (wraps in Suspense)
│   │   │   ├── not-found.tsx (shown on notFound() call)
│   │   │   └── page.tsx
│   │   └── (children route segments)
│   └── (error fallback UI)
└── (persists across navigations)
```

This means:
- `error.tsx` catches errors from `page.tsx` and `loading.tsx`, but **not** from `layout.tsx` or `template.tsx`
- `loading.tsx` shows while `page.tsx` is streaming/suspending
- `template.tsx` re-renders on navigation; `layout.tsx` does not

---

### File Conventions This Project Needs (Summary)

Files that should be created before production deployment:

| Priority | File | Why |
| --- | --- | --- |
| **High** | `app/error.tsx` | Root error fallback |
| **High** | `app/(admin)/dashboard/error.tsx` | Dashboard error recovery |
| **High** | `app/(public)/error.tsx` | Public page error recovery |
| **High** | `app/(admin)/dashboard/loading.tsx` | Dashboard loading skeletons |
| **High** | `app/(public)/loading.tsx` | Public page loading skeleton |
| **High** | `app/not-found.tsx` | Custom 404 page |
| **Medium** | `app/sitemap.ts` | Search engine sitemap |
| **Medium** | `app/robots.ts` | Crawling directives |
| **Medium** | `app/(public)/opengraph-image.tsx` | Social sharing image |
| **Medium** | `app/favicon.ico`, `app/icon.png`, `app/apple-icon.png` | Browser/app icons |
| **Low** | `app/(admin)/dashboard/not-found.tsx` | 404 for missing entities in admin |
| **Low** | `instrumentation.ts` | Error tracking for production |
| **Low** | `app/manifest.ts` | PWA manifest |

---

## Pattern Interaction

The four patterns work together. Here is how a typical admin page looks after all patterns are applied:

```
Request → page.tsx (Container)
            ├── getServerSession()            ← Error Boundary catches auth failures
            ├── getProjectsWithSkills()       ← Data Access Facade (lib/queries/)
            │                                    └── Error Boundary catches DB failures
            └── <ProjectsTable />             ← Presentational Component
                    └── deleteProject()        ← Hardened Server Action
                          ├── getServerSession()
                          ├── Zod safeParse
                          ├── try-catch DB operation
                          └── revalidatePath
```

### Migration Flow

When refactoring existing pages to use all four patterns, follow this order:

```
1. Create Zod schemas (lib/schemas/)
2. Harden server actions (auth + validation + try-catch)
3. Create data access facades (lib/queries/)
4. Extract presentational components (components/admin/)
5. Simplify page files to containers
6. Add error.tsx and loading.tsx files
```

This order ensures each step builds on the previous one without breaking existing functionality.

---

## Implementation Checklist

### Per Entity (projects, experiences, skills, social-links, settings)

- [ ] Create Zod schema in `lib/schemas/`
- [ ] Write Vitest tests for the schema
- [ ] Add `getServerSession()` to all server actions
- [ ] Add Zod `safeParse` validation to all server actions
- [ ] Wrap DB operations in try-catch
- [ ] Remove `console.log` statements
- [ ] Create query functions in `lib/queries/`
- [ ] Extract presentational table component to `components/admin/`
- [ ] Extract shared formatting utilities to `lib/utils.ts`
- [ ] Simplify `page.tsx` to container-only

### Global (once)

- [ ] Create `app/error.tsx` (root fallback)
- [ ] Create `app/(admin)/dashboard/error.tsx`
- [ ] Create `app/(public)/error.tsx`
- [ ] Create `app/(admin)/dashboard/loading.tsx`
- [ ] Create `app/(public)/loading.tsx`
- [ ] Create `app/not-found.tsx` (custom 404)
- [ ] Create `app/(admin)/dashboard/not-found.tsx` (admin 404 for missing entities)
- [ ] Create shared `EntityEmptyState` component
- [ ] Move `formatDate` and `formatDateRange` to `lib/utils.ts`

### SEO & Metadata Files (before deployment)

- [ ] Create `app/sitemap.ts`
- [ ] Create `app/robots.ts`
- [ ] Create `app/(public)/opengraph-image.tsx`
- [ ] Add `app/favicon.ico`, `app/icon.png`, `app/apple-icon.png`
- [ ] Add `metadata` export to root layout and public layout

### Future (when needed)

- [ ] Add `instrumentation.ts` for production error tracking
- [ ] Add `instrumentation-client.ts` for client-side analytics
- [ ] Evaluate `forbidden.tsx` / `unauthorized.tsx` when they stabilize
