# AGENTS-SECURITY.md

Security guidelines for the portfolio project. This document covers all security layers specific to this Next.js 16 application deployed on Vercel with better-auth, Drizzle ORM, and Turso.

**Related coverage (do not duplicate):**

- `better-auth-best-practices` skill — `trustedOrigins`, `useSecureCookies`, cookie cache strategies, `BETTER_AUTH_SECRET` requirements, rate limiting config options
- `drizzle-orm` skill — parameterized queries via `sql` template literal, prepared statements, SQL injection prevention
- `vercel-react-best-practices` skill — Server Action auth/authorization patterns, Zod validation in actions
- `next-best-practices` skill — `unauthorized()`/`forbidden()` error handling, secrets on server

---

## Content Security Policy (CSP)

CSP protects against XSS, clickjacking, and code injection by declaring which content sources the browser should trust. In Next.js 16, CSP with nonces is implemented via `proxy.ts`.

### How It Works

1. `proxy.ts` generates a unique nonce per request
2. The nonce is added to the `Content-Security-Policy` header
3. Next.js automatically applies the nonce to framework scripts, page bundles, inline styles, and `<Script>` components
4. Only scripts/styles with the matching nonce execute — everything else is blocked

### Implementation

The current `proxy.ts` handles auth redirects only. CSP must be added to the same file, running on a broader matcher:

```typescript
// proxy.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
  // --- Auth redirects (existing logic) ---
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  if (sessionCookie && pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (!sessionCookie && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // --- CSP nonce generation ---
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self'${isDev ? " 'unsafe-inline'" : ` 'nonce-${nonce}'`};
    img-src 'self' blob: data: https:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `;

  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicyHeaderValue);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set("Content-Security-Policy", contentSecurityPolicyHeaderValue);
  return response;
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
```

### Reading the Nonce in Server Components

When you need to pass the nonce to third-party `<Script>` components or custom inline scripts:

```typescript
import { headers } from "next/headers";
import Script from "next/script";

export default async function Page() {
  const nonce = (await headers()).get("x-nonce");

  return (
    <Script
      src="https://www.googletagmanager.com/gtag/js"
      strategy="afterInteractive"
      nonce={nonce}
    />
  );
}
```

### CSP Directives Explained

| Directive | Value | Purpose |
| --- | --- | --- |
| `default-src` | `'self'` | Fallback for all resource types — only allow same origin |
| `script-src` | `'self' 'nonce-...' 'strict-dynamic'` | Scripts only with matching nonce; `strict-dynamic` allows nonce-loaded scripts to load their children |
| `style-src` | `'self' 'nonce-...'` (prod) / `'unsafe-inline'` (dev) | Styles require nonce in production; dev needs `unsafe-inline` for HMR |
| `img-src` | `'self' blob: data: https:` | Allow images from same origin, blob URLs (Next.js Image), data URIs, and any HTTPS source |
| `font-src` | `'self'` | Only self-hosted fonts (via `next/font`) |
| `object-src` | `'none'` | Block `<object>`, `<embed>`, `<applet>` — prevents Flash/plugin attacks |
| `base-uri` | `'self'` | Prevents `<base>` tag hijacking |
| `form-action` | `'self'` | Forms can only submit to same origin |
| `frame-ancestors` | `'none'` | Prevents your site from being embedded in iframes (clickjacking) |
| `upgrade-insecure-requests` | — | Automatically upgrades HTTP requests to HTTPS |

### Rules

- **Dev mode requires `'unsafe-eval'`** — React uses `eval()` for enhanced error stack traces in development. This is NOT required in production
- **Dev mode requires `'unsafe-inline'` for styles** — Tailwind/HMR injects inline styles during development
- **CSP makes pages dynamically rendered** — nonces change per request, so pages using CSP cannot be statically generated. For the public portfolio page, evaluate the tradeoff between static performance and CSP protection
- **If adding third-party scripts** (analytics, etc.), add their domains to `script-src` and `connect-src`

---

## Security Headers

Configure security headers in `next.config.ts` to harden every response. These headers are applied by the server regardless of CSP.

### Implementation

Add the `headers()` function to `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,
  experimental: {
    turbopackFileSystemCacheForDev: true,
    turbopackFileSystemCacheForBuild: true,
    optimizePackageImports: [
      "lucide-react",
      "react-icons",
      "@radix-ui/react-icons",
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### Header Explanations

| Header | Value | Purpose |
| --- | --- | --- |
| `X-DNS-Prefetch-Control` | `on` | Enables DNS prefetching for external links — improves performance |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Forces HTTPS for 2 years on all subdomains. Submit to [HSTS preload list](https://hstspreload.org/) after verifying |
| `X-Frame-Options` | `SAMEORIGIN` | Prevents embedding in iframes from other origins (clickjacking). Superseded by CSP `frame-ancestors` but kept for older browsers |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing — stops browsers from executing uploaded files as scripts |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Sends full URL as referrer for same-origin, only origin for cross-origin, nothing for downgrade (HTTPS→HTTP) |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), browsing-topics=()` | Disables browser APIs this portfolio does not use — reduces attack surface |

### Rules

- **Do NOT add `X-XSS-Protection: 1; mode=block`** — this header is deprecated and can introduce vulnerabilities in older browsers. CSP replaces it entirely
- **Do NOT set `Cache-Control` here for `_next/static`** — Next.js handles immutable asset caching automatically with SHA hashes
- **HSTS preload** — only submit to the preload list after confirming HTTPS works on all subdomains. This is irreversible for the preload duration

---

## Auth Protection Pattern

This project uses better-auth with a two-layer auth approach as recommended by the [better-auth Next.js integration docs](https://www.better-auth.com/docs/integrations/next#auth-protection).

### Layer 1: Optimistic Redirects via `proxy.ts`

The proxy performs **cookie-existence checks only** — fast, no DB call, no session validation. This is for UX, not security:

```typescript
// proxy.ts — existing implementation
const sessionCookie = getSessionCookie(request);

// Logged-in users visiting /login → redirect to /dashboard
if (sessionCookie && pathname.startsWith("/login")) {
  return NextResponse.redirect(new URL("/dashboard", request.url));
}

// Logged-out users visiting /dashboard → redirect to /login
if (!sessionCookie && pathname.startsWith("/dashboard")) {
  return NextResponse.redirect(new URL("/login", request.url));
}
```

**This is NOT secure.** Anyone can create a cookie manually. The proxy is purely for user experience (avoiding flash of wrong page).

### Layer 2: Real Auth Checks in Each Page/Route

Every protected page and Server Action **must** validate the session against the database using `getServerSession()`:

```typescript
// app/(admin)/dashboard/page.tsx
import { getServerSession } from "@/lib/server-session";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return <h1>Welcome {session.user.name}</h1>;
}
```

The `getServerSession` function is defined in `lib/server-session.ts` and uses React `cache()` to deduplicate calls within the same request:

```typescript
// lib/server-session.ts
import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export const getServerSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
});
```

### Rules

- **NEVER rely on `proxy.ts` for security** — it only checks cookie existence, not validity
- **ALWAYS call `getServerSession()` in every protected page** — this validates the session against the database
- **ALWAYS call `getServerSession()` at the start of every Server Action** that modifies data — throw or redirect if no session
- **Use `"server-only"` import** in `server-session.ts` to prevent accidental client-side import
- **`cache()` wrapping** ensures multiple `getServerSession()` calls in the same request only hit the DB once
- **Session cookie caching** (5 min) in `lib/auth.ts` reduces DB load — the tradeoff is that a revoked session stays valid for up to 5 minutes

---

## Server Actions Security

Every Server Action in `lib/actions/` that creates, updates, or deletes data must follow this security pattern:

### Required Steps (in order)

```typescript
"use server";

import { db } from "@/db";
import { projects } from "@/db/schema/portfolio";
import { getServerSession } from "@/lib/server-session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  url: z.string().url().optional().or(z.literal("")),
  repoUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["active", "archived", "in-progress"]),
});

export async function createProject(formData: FormData) {
  // 1. AUTHENTICATE — verify the user has a valid session
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  // 2. VALIDATE — parse and validate all inputs with Zod
  const rawData = {
    title: formData.get("title"),
    description: formData.get("description"),
    url: formData.get("url") || "",
    repoUrl: formData.get("repoUrl") || "",
    status: formData.get("status"),
  };

  const validatedData = CreateProjectSchema.parse(rawData);

  // 3. EXECUTE — use Drizzle ORM (parameterized queries, no string concatenation)
  await db.insert(projects).values({
    title: validatedData.title,
    description: validatedData.description,
    url: validatedData.url || undefined,
    repoUrl: validatedData.repoUrl || undefined,
    status: validatedData.status,
    order: 0,
  });

  // 4. REVALIDATE or REDIRECT (not both — see rules below)
  redirect("/dashboard/projects");
}
```

### Rules

- **Step 1 (Auth) is mandatory** — never skip authentication in a Server Action. The current actions in `lib/actions/` are missing this step and need to be updated
- **Step 2 (Validation) uses Zod** — never trust `formData.get()` values directly. Cast to the expected type through Zod schemas
- **Step 3 (Execute) uses Drizzle ORM** — never concatenate strings into SQL. Drizzle's query builder and `sql` template literal produce parameterized queries automatically
- **Never expose internal errors to the client** — catch Zod errors and return user-friendly messages. Log internal errors with `console.error` but return generic "Internal server error" to the client
- **`formData.get()` returns `FormDataEntryValue | null`** — always handle `null` before passing to Zod

### Step 4: Revalidate vs Redirect

Choose **one** based on context — do not use both for the same path:

| Scenario | Use | Why |
| --- | --- | --- |
| **Create** (user is on a `/new` sub-route or dialog) | `redirect("/dashboard/projects")` | Navigates back to the list; redirect implicitly fetches fresh data |
| **Update** (user stays on the same page) | `revalidatePath("/dashboard/projects")` | Invalidates the cache and re-renders the current page in-place — no full navigation |
| **Delete** (user stays on the same page) | `revalidatePath("/dashboard/projects")` | Same as update — seamless UI refresh without a disorienting page navigation |

**Why not both?**

- `redirect()` already triggers a fresh server render of the target page, so a preceding `revalidatePath()` to the same path is redundant overhead.
- `redirect()` to the page you're already on causes a full navigation (Next.js throws a `NEXT_REDIRECT` internally), which is heavier and more disorienting than a simple `revalidatePath()` that updates the RSC tree in-place.
- Use `redirect()` only when the user needs to land on a **different** route than where the action was triggered.

---

## Input Validation with Zod

Define Zod schemas for every entity in the project. Place schemas alongside the Server Actions or in a shared `lib/schemas/` directory.

### Schema Patterns for This Project

```typescript
import { z } from "zod";

// Projects
export const ProjectSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(5000),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  repoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  status: z.enum(["active", "archived", "in-progress"]),
});

// Experiences
export const ExperienceSchema = z.object({
  role: z.string().min(1, "Role is required").max(200),
  company: z.string().min(1, "Company is required").max(200),
  companyUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().min(1, "Description is required").max(5000),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().max(200).optional(),
});

// Skills
export const SkillSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  type: z.enum([
    "fullstack", "frontend", "backend", "database",
    "devops", "practices", "tools", "other",
  ]),
  icon: z.string().max(100).optional(),
  url: z.string().url().optional().or(z.literal("")),
});

// Social Links
export const SocialLinkSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  url: z.string().url("Must be a valid URL").min(1),
  icon: z.string().max(100).optional(),
});

// Site Settings
export const SiteSettingsSchema = z.object({
  isEmployed: z.boolean(),
  resumeUrl: z.string().url("Must be a valid URL").min(1),
  statusMessage: z.string().max(500).optional(),
});
```

### Rules

- **Validate on the server** — client-side validation (HTML `required`, React Hook Form) is for UX only. The Server Action is the security boundary
- **Use `.parse()` not `.safeParse()` for Server Actions** — let Zod throw a `ZodError`, catch it, and return a structured error response
- **Set max lengths** — prevent denial-of-service via extremely long inputs. Match the database column constraints
- **Use `.or(z.literal(""))` for optional URL fields** — empty strings from forms are not valid URLs, so allow empty string explicitly

---

## SQL Injection Prevention

This project uses Drizzle ORM with the Turso (libSQL) dialect. Drizzle produces parameterized queries by default, which prevents SQL injection.

### Safe Patterns (use these)

```typescript
// Query builder — always safe
const result = await db.select().from(projects).where(eq(projects.id, id));

// Insert — always safe
await db.insert(projects).values({ title, description, status, order: 0 });

// Update — always safe
await db.update(projects).set({ title }).where(eq(projects.id, id));

// Delete — always safe
await db.delete(projects).where(eq(projects.id, id));

// sql template literal — safe (parameterized)
const result = await db.select({
  maxOrder: sql<number>`COALESCE(MAX(${projects.order}), 0)`,
}).from(projects);
```

### Dangerous Patterns (never do these)

```typescript
// NEVER concatenate user input into raw SQL
const result = await db.execute(`SELECT * FROM projects WHERE id = ${id}`); // SQL INJECTION

// NEVER use sql.raw() with user input
const result = await db.execute(sql.raw(`SELECT * FROM projects WHERE title = '${title}'`)); // SQL INJECTION

// NEVER build dynamic table/column names from user input
const column = userInput; // Could be "id; DROP TABLE projects"
```

### Rules

- **Always use the Drizzle query builder** — `db.select()`, `db.insert()`, `db.update()`, `db.delete()`
- **Use the `sql` template literal** for raw SQL — it automatically parameterizes interpolated values
- **Never use `sql.raw()` with user input** — `sql.raw()` inserts values verbatim without parameterization
- **Validate IDs as numbers before queries** — even though Drizzle parameterizes, validate that `id` is actually a number before passing it to `eq(projects.id, id)`

---

## Secure Environment Variables

### Classification

| Prefix / Pattern | Exposure | Examples in This Project |
| --- | --- | --- |
| `NEXT_PUBLIC_*` | Exposed to browser (bundled in client JS) | `NEXT_PUBLIC_API_URL` (if needed) |
| No `NEXT_PUBLIC_` prefix | Server-only (never sent to browser) | `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` |

### Rules

- **NEVER prefix secrets with `NEXT_PUBLIC_`** — this bundles them into client JavaScript, visible to anyone
- **NEVER commit `.env.local` to git** — it contains all secrets. Verify `.gitignore` includes `.env.local`, `.env*.local`
- **Generate `BETTER_AUTH_SECRET` with at least 32 characters** — use `openssl rand -base64 32` to generate
- **On Vercel, use Sensitive Environment Variables** — these are encrypted and non-readable after creation. Set via: Dashboard > Project Settings > Environment Variables > toggle "Sensitive"
- **Use different values per environment** — Vercel supports Production, Preview, and Development scopes. Never use production secrets in preview deployments

### Vercel Environment Variable Commands

```bash
# Add a sensitive environment variable via CLI
pnpm dlx vercel env add TURSO_AUTH_TOKEN
# Select: Production, Preview, Development
# Type: Sensitive (encrypted, non-readable once set)

# List all environment variables
pnpm dlx vercel env ls

# Pull environment variables for local development
pnpm dlx vercel env pull .env.local
```

### What Vercel Provides Automatically

| Variable | Value | Usage |
| --- | --- | --- |
| `VERCEL_URL` | Deployment URL (without protocol) | Construct `BETTER_AUTH_URL` dynamically |
| `VERCEL_ENV` | `production`, `preview`, or `development` | Conditional logic per environment |
| `VERCEL_GIT_COMMIT_SHA` | Git commit hash | Cache busting, debugging |

---

## CSRF Protection

better-auth provides built-in CSRF protection for all auth endpoints. For Server Actions, Next.js has its own CSRF mitigation.

### How better-auth Handles CSRF

better-auth verifies the `Origin` header on all mutation requests (POST, PUT, DELETE). If the origin doesn't match the configured `trustedOrigins`, the request is rejected:

```typescript
// lib/auth.ts — trustedOrigins is configured automatically via BETTER_AUTH_URL
// If you need additional origins (e.g., preview deployments):
export const auth = betterAuth({
  // ... existing config ...
  trustedOrigins: [
    process.env.BETTER_AUTH_URL!,
    // Add preview deployment URLs if needed
  ],
});
```

### How Next.js Handles CSRF for Server Actions

Next.js Server Actions use the `POST` method and include the `Origin` header check by default. The framework rejects Server Action calls from cross-origin requests automatically.

### Rules

- **Do NOT set `disableCSRFCheck: true`** in better-auth — this removes CSRF protection from all auth endpoints
- **Do NOT set `disableOriginCheck: true`** in better-auth — this removes origin verification
- **Server Actions are protected by default** — Next.js validates the `Origin` header. No additional CSRF tokens needed for Server Actions
- **Set `SameSite: 'lax'` on session cookies** — better-auth does this by default. Lax allows top-level navigations (links) but blocks cross-site form submissions
- **If you ever add custom API routes** (beyond better-auth's `/api/auth/*`), implement CSRF token verification manually

---

## Secure Cookies & Sessions

better-auth manages session cookies. The configuration in `lib/auth.ts` sets the cookie behavior:

### Current Configuration

```typescript
// lib/auth.ts
session: {
  cookieCache: {
    enabled: true,
    maxAge: 5 * 60, // 5 minutes — session data cached in cookie to reduce DB hits
  },
},
```

### Cookie Flags Set by better-auth

| Flag | Value | Purpose |
| --- | --- | --- |
| `httpOnly` | `true` | Cookie not accessible via JavaScript — prevents XSS from stealing sessions |
| `secure` | `true` (production) | Cookie only sent over HTTPS |
| `sameSite` | `lax` | Sent on top-level navigations, blocked on cross-site form submissions |
| `path` | `/` | Available on all routes |

### Rules

- **Never access session cookies in client JavaScript** — they are `httpOnly` by design
- **Cookie cache tradeoff** — the 5-minute cache means a revoked session stays valid for up to 5 minutes. This is acceptable for an admin dashboard with a single user
- **Session expiration** — better-auth handles session expiration and renewal automatically. Do not implement custom session timeout logic
- **If you add custom cookies** (not via better-auth), always set: `httpOnly: true`, `secure: true`, `sameSite: "strict"` or `"lax"`, and a reasonable `maxAge`

---

## Rate Limiting

Protect your APIs against abuse and DDoS attacks by limiting the number of requests per IP or user within a time period. This project uses a two-layer approach: Vercel WAF at the edge and better-auth's built-in rate limiting for auth endpoints.

### Why Vercel WAF (Not In-Memory LRU Cache)

An in-memory rate limiter (e.g., `LRUCache`) is **unreliable on Vercel's serverless infrastructure**:

| Problem | Impact |
| --- | --- |
| **Instance isolation** | Each function invocation may run in a separate instance. The LRU cache lives in process memory, so different instances don't share rate-limit counters. A client can bypass limits by hitting different instances. |
| **Cold starts** | When an instance cold-starts, all previous tracking is lost — the cache resets to zero. |
| **Fluid Compute** | Shared instances help with concurrent requests, but there's no guarantee all requests route to the same instance, and instances still get recycled. |
| **No global view** | In-memory caches have no cross-region or cross-instance coordination. |

Vercel WAF operates **at the edge, before your application code runs**, with global state that accurately tracks requests per IP across all edge locations. It's the correct layer for rate limiting in a serverless deployment.

> **Note:** `LRUCache` is excellent for *data caching* across requests (see `server-cache-lru` rule in the performance skill), but it is not suitable for *rate limiting* on serverless platforms.

### Layer 1: Vercel WAF Rate Limiting (Edge)

Vercel WAF rate limiting is available on all plans (Hobby: 1 rule, Pro: up to 40 rules). It protects at the network level with zero code changes.

#### Setup via Vercel Dashboard

1. Go to **Dashboard > Project > Firewall** tab
2. Select **Configure** > **+ New Rule**
3. Set **If** conditions (e.g., Request Path equals `/api/auth/*`)
4. Set **Then** action to **Rate Limit**
5. Configure the **Time Window** (e.g., 60s) and **Request Limit** (e.g., 100 requests)
6. Select counting key(s): **IP** or **JA4 Digest**
7. Set the action when limit is exceeded: **Deny (429)** or **Challenge**
8. **Save Rule** > **Review Changes** > **Publish**

#### Recommended Rules for This Project

| Rule Name | Path Condition | Limit | Window | Action | Purpose |
| --- | --- | --- | --- | --- | --- |
| Auth endpoint protection | `/api/auth/*` | 20 requests | 60s | Deny (429) | Prevent brute-force login attempts |
| General API protection | `/api/*` | 100 requests | 60s | Deny (429) | Protect all API routes from abuse |

#### Application-Level Rate Limiting with `@vercel/firewall` SDK

For cases where edge-level conditions are insufficient (e.g., rate limiting by authenticated user ID, not just IP), use the [`@vercel/firewall`](https://github.com/vercel/vercel/tree/main/packages/firewall/docs) SDK:

```typescript
import { checkRateLimit } from "@vercel/firewall";

export async function POST(request: Request) {
  const { rateLimited } = await checkRateLimit("api-mutation", {
    request,
  });

  if (rateLimited) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded" }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Continue with request handling
}
```

With a custom key (e.g., authenticated user):

```typescript
import { checkRateLimit } from "@vercel/firewall";
import { getServerSession } from "@/lib/server-session";

export async function POST(request: Request) {
  const session = await getServerSession();

  const { rateLimited } = await checkRateLimit("user-mutation", {
    request,
    rateLimitKey: session?.user.id ?? "anonymous",
  });

  if (rateLimited) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded" }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Continue with request handling
}
```

> **Prerequisite:** The `@vercel/firewall` SDK requires a matching custom rule in the Vercel dashboard with `@vercel/firewall` as the **If** condition and the same Rate Limit ID used in `checkRateLimit()`.

### Layer 2: better-auth Built-In Rate Limiting (Auth Endpoints)

better-auth provides built-in rate limiting for all auth endpoints (login, sign-up, password reset, etc.). Configure in `lib/auth.ts`:

```typescript
export const auth = betterAuth({
  // ... existing config ...
  rateLimit: {
    enabled: true,
    window: 60,       // 60 seconds
    max: 10,          // 10 requests per window per IP
    storage: "memory", // "memory" | "database" | "secondary-storage"
  },
});
```

| Option | Default | Description |
| --- | --- | --- |
| `enabled` | `false` | Enable rate limiting for auth endpoints |
| `window` | `60` | Time window in seconds |
| `max` | `10` | Max requests per window |
| `storage` | `"memory"` | Where to store counters. Use `"database"` for persistence across instances, or `"secondary-storage"` (Redis/KV) for production |

> **Important:** `"memory"` storage has the same serverless isolation issues as LRU cache. For production, use `"database"` (Turso) or `"secondary-storage"` (Redis/KV) if available. For a single-admin portfolio with low traffic, `"memory"` is acceptable as a basic deterrent, with Vercel WAF as the real protection layer.

### Rules

- **Use Vercel WAF as the primary rate limiting layer** — it operates at the edge with global state, before your code runs
- **Enable better-auth rate limiting** — adds defense in depth for auth endpoints specifically
- **Do NOT rely on in-memory rate limiting alone** — LRU cache, Map-based counters, or better-auth's `"memory"` storage are all unreliable on serverless (see table above)
- **Set stricter limits on auth endpoints** — login and password reset are the most targeted. Use 10-20 requests per minute per IP
- **Set moderate limits on general API routes** — 100 requests per minute per IP is a reasonable starting point
- **Return proper `429 Too Many Requests` responses** — include a `Retry-After` header when possible
- **Use `@vercel/firewall` SDK** when you need rate limiting based on application-level context (user ID, organization, etc.) — requires a matching dashboard rule
- **Monitor rate limit effectiveness** — check the Vercel Firewall overview page for traffic patterns and adjust limits as needed

### Vercel WAF Rate Limiting Limits

| Resource | Hobby | Pro | Enterprise |
| --- | --- | --- | --- |
| Number of rate limit rules | 1 per project | 40 per project | 1000 per project |
| Counting keys | IP, JA4 Digest | IP, JA4 Digest | IP, JA4 Digest, User Agent, custom headers |
| Counting algorithm | Fixed window | Fixed window | Fixed window, Token bucket |
| Time window range | 10s – 10min | 10s – 10min | 10s – 1hr |
| Included allowed requests | 1,000,000 | 1,000,000 | Custom |

---

## Source Maps & Production Hardening

### Source Maps

Next.js disables browser source maps in production by default (`productionBrowserSourceMaps: false`). Do not change this:

```typescript
// next.config.ts — DO NOT add this
// productionBrowserSourceMaps: true, // NEVER enable in production
```

Source maps reveal your application's internal structure, making it easier for attackers to find vulnerabilities. The default behavior (disabled) is correct.

### Console Logs

Remove console logs from production builds to prevent information leakage:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  // ... existing config ...
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },
};
```

This strips `console.log`, `console.debug`, `console.info`, and `console.trace` from production builds, keeping `console.error` and `console.warn` for error monitoring.

### Rules

- **Never enable `productionBrowserSourceMaps: true`** — this exposes your entire source code
- **Remove `console.log` from Server Actions** — the current actions in `lib/actions/projects.ts` contain `console.log` statements that should be removed before production
- **Never log sensitive data** — session tokens, passwords, auth tokens, database URLs must never appear in logs

---

## Dependency Security

### Audit Commands

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "audit": "pnpm audit",
    "audit:fix": "pnpm audit --fix",
    "check-updates": "pnpm dlx npm-check-updates",
    "update:latest": "pnpm up --latest"
  }
}
```

### Workflow

| Command | When to Run | What It Does |
| --- | --- | --- |
| `pnpm audit` | Before every deployment, weekly | Checks installed packages for known vulnerabilities (CVEs) |
| `pnpm audit --fix` | When vulnerabilities are found | Adds overrides to `package.json` to force non-vulnerable versions |
| `pnpm dlx npm-check-updates` | Monthly | Lists all dependencies with newer versions available (major, minor, patch) |
| `pnpm up --latest` | After reviewing ncu output | Updates all dependencies to latest versions (may include breaking changes) |
| `pnpm up` | Weekly | Updates dependencies within their declared semver ranges (safe) |

### Rules

- **Run `pnpm audit` before every production deployment** — do not deploy with known high/critical vulnerabilities
- **Review major version updates carefully** — use `pnpm dlx npm-check-updates` to see what's available, then update selectively
- **Lock file is your friend** — `pnpm-lock.yaml` ensures reproducible builds. Always commit it
- **Ignore unfixable CVEs explicitly** — if a CVE has no fix and doesn't affect your usage, add it to `auditConfig.ignoreCves` in `pnpm-workspace.yaml` rather than ignoring the entire audit

---

## Vercel Security Features

Vercel provides built-in security that does not require configuration:

### Automatic Protections

| Feature | Coverage | Notes |
| --- | --- | --- |
| **Automatic HTTPS** | All deployments | SSL/TLS certificates generated and renewed automatically |
| **DDoS Mitigation** | All plans | Platform-wide firewall, no config needed |
| **Edge Network** | All deployments | Global CDN, requests proxied through Vercel's edge |
| **Encrypted Environment Variables** | All plans | Sensitive variables encrypted at rest |
| **Deployment Protection** | All plans | Preview deployments can be password-protected |

### What You Should Configure

| Feature | How | Why |
| --- | --- | --- |
| **Sensitive Environment Variables** | Dashboard > Project Settings > Environment Variables > toggle "Sensitive" | Values become non-readable after creation |
| **Attack Challenge Mode** | Dashboard > Project Settings > Security > Attack Challenge Mode | Shows CAPTCHA to suspected bots during attacks |
| **Deployment Protection** | Dashboard > Project Settings > Deployment Protection | Restrict preview deployments to team members |

### Rules

- **Always mark secrets as Sensitive** — `TURSO_AUTH_TOKEN`, `BETTER_AUTH_SECRET`, `TURSO_DATABASE_URL`
- **Do not expose admin routes in preview deployments** — use Vercel's Deployment Protection to restrict access
- **Vercel Firewall (WAF)** is available on Enterprise plans — it provides managed rulesets for SQL injection, XSS, LFI. On free/pro plans, rely on application-level protections documented in this file

---

## Fundamental Security Principles

### 1. Defense in Depth

Apply multiple security layers — no single layer is sufficient:

| Layer | Protection | This Project |
| --- | --- | --- |
| Network | DDoS mitigation, HTTPS | Vercel (automatic) |
| Edge | Rate limiting | Vercel WAF rate limiting rules |
| Transport | HSTS, TLS | Security headers in `next.config.ts` |
| Application | CSP, security headers | `proxy.ts` + `next.config.ts` |
| Authentication | Session validation, auth rate limiting | better-auth + `getServerSession()` + better-auth rate limiting |
| Authorization | Permission checks | Server Action auth checks |
| Input | Validation, sanitization | Zod schemas + Drizzle ORM |
| Data | Parameterized queries | Drizzle ORM (automatic) |
| Dependencies | Vulnerability auditing | `pnpm audit` |

### 2. Least Privilege

Grant only the minimum permissions necessary:

- **Database** — Turso auth tokens should have the minimum required permissions. If Turso supports read-only tokens, use them for the public page queries
- **Environment variables** — only expose variables where they are needed. Never use `NEXT_PUBLIC_` for secrets
- **Admin access** — sign-up is disabled (`disableSignUp: true`). New admin users must be created directly in the database
- **API routes** — the only API route is `/api/auth/*` (managed by better-auth). Do not create unnecessary API endpoints

### 3. Never Trust User Input

Every piece of user-provided data is potentially malicious:

- **FormData** — always validate with Zod before using in database operations
- **URL parameters** — validate and parse IDs as numbers before queries
- **Cookies** — never trust cookie values for authorization (validate sessions server-side)
- **Headers** — do not make security decisions based on headers that can be spoofed (User-Agent, X-Forwarded-For)

### 4. Keep Everything Updated

- **Run `pnpm audit` weekly** — automate this in CI if possible
- **Update Next.js promptly** — security patches are released regularly
- **Update better-auth promptly** — auth libraries are high-value targets
- **Monitor the Drizzle ORM changelog** — database adapter vulnerabilities can be critical
- **Review Vercel security advisories** — Vercel publishes security updates for their platform

---

## Security Checklist

### Before Every Deployment

- [ ] **Auth**: Every protected page calls `getServerSession()` and redirects if no session
- [ ] **Auth**: Every Server Action calls `getServerSession()` as its first step
- [ ] **Validation**: Every Server Action validates inputs with Zod schemas
- [ ] **SQL**: No raw string concatenation in database queries — Drizzle query builder or `sql` template only
- [ ] **Logs**: No `console.log` of sensitive data (tokens, passwords, user data)
- [ ] **Deps**: `pnpm audit` reports no high/critical vulnerabilities
- [ ] **Env**: `.env.local` is in `.gitignore`, secrets are not committed

### One-Time Setup (TODO)

- [ ] **CSP**: Add nonce-based CSP to `proxy.ts` (see implementation above)
- [ ] **Headers**: Add security headers to `next.config.ts` (see implementation above)
- [ ] **Console**: Add `removeConsole` compiler option to `next.config.ts`
- [ ] **Audit scripts**: Add `audit`, `audit:fix`, `check-updates`, `update:latest` scripts to `package.json`
- [ ] **Zod schemas**: Create Zod schemas for all entities (projects, experiences, skills, social links, settings)
- [ ] **Server Action auth**: Add `getServerSession()` check to all existing Server Actions in `lib/actions/`
- [ ] **Vercel**: Mark `TURSO_AUTH_TOKEN`, `BETTER_AUTH_SECRET`, `TURSO_DATABASE_URL` as Sensitive in Vercel dashboard
- [ ] **Rate limiting (WAF)**: Add Vercel WAF rate limit rule for `/api/auth/*` (20 req/min) and `/api/*` (100 req/min)
- [ ] **Rate limiting (auth)**: Enable `rateLimit` in `lib/auth.ts` better-auth configuration

---

## Documentation Links

- [Next.js Content Security Policy Guide](https://nextjs.org/docs/app/guides/content-security-policy)
- [Next.js Security Headers](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers)
- [Next.js productionBrowserSourceMaps](https://nextjs.org/docs/app/api-reference/config/next-config-js/productionBrowserSourceMaps)
- [Next.js Server Actions (Updating Data)](https://nextjs.org/docs/app/getting-started/updating-data)
- [better-auth Next.js Integration](https://www.better-auth.com/docs/integrations/next)
- [better-auth Auth Protection](https://www.better-auth.com/docs/integrations/next#auth-protection)
- [Vercel Security Overview](https://vercel.com/docs/security)
- [Vercel Sensitive Environment Variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables)
- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [Zod Documentation](https://zod.dev/)
- [pnpm audit](https://pnpm.io/cli/audit)
- [pnpm update](https://pnpm.io/cli/update)
- [npm-check-updates](https://www.npmjs.com/package/npm-check-updates)
- [HSTS Preload List](https://hstspreload.org/)
- [Vercel WAF](https://vercel.com/docs/vercel-firewall/vercel-waf)
- [Vercel WAF Rate Limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting)
- [Vercel WAF Rate Limiting SDK](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting-sdk)
- [Securing AI Apps with Rate Limiting (Vercel KB)](https://vercel.com/kb/guide/securing-ai-app-rate-limiting)
- [better-auth Rate Limiting](https://www.better-auth.com/docs/concepts/rate-limit)
