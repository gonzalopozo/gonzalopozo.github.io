# AGENTS-PATTERNS.md

Design pattern guidelines for the portfolio project. This document covers four patterns adopted to improve code organization, security, error resilience, and maintainability across the Next.js 16 application.

**Related coverage (do not duplicate):**

- `AGENTS-SECURITY.md` > Server Actions Security — the 4-step authenticate/validate/execute/revalidate pattern
- `AGENTS-SECURITY.md` > Input Validation with Zod — schema definitions and validation rules
- `AGENTS-TESTING.md` > Testing Philosophy — TDD strategy for Zod schemas and server action logic
- `AGENTS-PERFORMANCE.md` > Server vs Client Components — decision tree for component boundaries
- `vercel-composition-patterns` skill — compound components, render props, context providers
- `vercel-react-best-practices` skill — Server Action auth/authorization, bundle optimization

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
- [ ] Create shared `EntityEmptyState` component
- [ ] Move `formatDate` and `formatDateRange` to `lib/utils.ts`
