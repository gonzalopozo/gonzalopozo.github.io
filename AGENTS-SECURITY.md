# AGENTS-SECURITY.md

Security guidelines for the portfolio project — all security layers for a Next.js 16 app deployed on Vercel with better-auth, Drizzle ORM, and Turso.

> Full implementation code (proxy.ts, next.config.ts headers, SDK examples, audit commands): [AGENTS-SECURITY-REFERENCE.md](./AGENTS-SECURITY-REFERENCE.md)

**Related skills (do not duplicate their content):**

- `better-auth-best-practices` — `trustedOrigins`, `useSecureCookies`, cookie cache, `BETTER_AUTH_SECRET`, rate limiting config
- `drizzle-orm` — Parameterized queries, `sql` template literal, prepared statements
- `vercel-react-best-practices` — Server Action auth/authorization, Zod validation
- `next-best-practices` — `unauthorized()`/`forbidden()` error handling, secrets on server

---

## Content Security Policy (CSP)

CSP protects against XSS, clickjacking, and code injection by declaring trusted content sources. Implemented via nonces in `proxy.ts`.

**How it works**: `proxy.ts` generates a unique nonce per request → adds it to the `Content-Security-Policy` header → Next.js applies the nonce to scripts/styles → only matching scripts execute.

### CSP Skeleton (in proxy.ts)

```typescript
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
// Set on both request and response headers. Full implementation in reference file.
```

### Rules

- **Dev mode requires `'unsafe-eval'`** for React error stack traces and `'unsafe-inline'` for Tailwind HMR — NOT in production
- **CSP makes pages dynamically rendered** — nonces change per request, so CSP pages cannot be statically generated
- **If adding third-party scripts**, add their domains to `script-src` and `connect-src`
- **Read the nonce** in Server Components via `(await headers()).get("x-nonce")` for `<Script>` tags

> Full `proxy.ts` CSP implementation and CSP directives reference: [AGENTS-SECURITY-REFERENCE.md](./AGENTS-SECURITY-REFERENCE.md#csp-full-implementation)

---

## Security Headers

Six headers configured in `next.config.ts` via the `headers()` function:

| Header | Purpose |
| --- | --- |
| `X-DNS-Prefetch-Control: on` | DNS prefetching for external links |
| `Strict-Transport-Security` | Forces HTTPS for 2 years, all subdomains, preload-eligible |
| `X-Frame-Options: SAMEORIGIN` | Prevents iframe embedding (clickjacking) |
| `X-Content-Type-Options: nosniff` | Prevents MIME-type sniffing |
| `Referrer-Policy: strict-origin-when-cross-origin` | Limits referrer info on cross-origin |
| `Permissions-Policy` | Disables camera, microphone, geolocation, browsing-topics |

### Rules

- **Do NOT add `X-XSS-Protection`** — deprecated, can introduce vulnerabilities. CSP replaces it
- **Do NOT set `Cache-Control` for `_next/static`** — Next.js handles immutable caching automatically
- **HSTS preload** — only submit to preload list after confirming HTTPS on all subdomains (irreversible)

> Full `next.config.ts` headers implementation: [AGENTS-SECURITY-REFERENCE.md](./AGENTS-SECURITY-REFERENCE.md#security-headers-implementation)

---

## Auth Protection Pattern

Two-layer approach as recommended by [better-auth Next.js docs](https://www.better-auth.com/docs/integrations/next#auth-protection):

**Layer 1 — Optimistic redirects via `proxy.ts`** (UX only, NOT secure):
- Checks cookie existence only — no DB call, no session validation
- Logged-in users on `/login` → redirect to `/dashboard`
- Logged-out users on `/dashboard` → redirect to `/login`
- Anyone can forge a cookie — this layer is purely for avoiding page flash

**Layer 2 — Real auth in every page/action** (the actual security):

```typescript
// Every protected page and Server Action must do this:
const session = await getServerSession();
if (!session) redirect("/login");
```

`getServerSession()` in `lib/server-session.ts` validates the session against the database, wrapped in `cache()` to deduplicate within a request.

### Rules

- **NEVER rely on `proxy.ts` for security** — it only checks cookie existence
- **ALWAYS call `getServerSession()` in every protected page and every Server Action**
- **`cache()` wrapping** ensures multiple calls in the same request only hit the DB once
- **Session cookie cache (5 min)** in `lib/auth.ts` reduces DB load — tradeoff: revoked session valid up to 5 min
- **Add `"server-only"` import** to `server-session.ts`

---

## Server Actions Security

Every action follows the **4-step pattern**: authenticate → validate → execute → revalidate. See [AGENTS-PATTERNS.md § Server Action Hardening](./AGENTS-PATTERNS.md#2-server-action-hardening-strategy-like) for the template.

### Rules

- **Step 1 (Auth) is mandatory** — `getServerSession()` first, redirect if `null`
- **Step 2 uses Zod `.safeParse()`** — never trust `formData.get()` directly
- **Step 3 uses Drizzle ORM** — never concatenate strings into SQL
- **Never expose internal errors** — return user-friendly messages, log internals server-side
- **`formData.get()` returns `FormDataEntryValue | null`** — handle `null` before Zod
- **Remove all `console.log` statements** from production code

### Revalidate vs Redirect (Step 4)

| Scenario | Use | Why |
| --- | --- | --- |
| **Create** (user on `/new` or dialog) | `redirect("/dashboard/entities")` | Navigate back to list |
| **Update** (user stays on same page) | `revalidatePath("/dashboard/entities")` | Refresh in-place |
| **Delete** (user stays on same page) | `revalidatePath("/dashboard/entities")` | Seamless UI refresh |

`redirect()` already triggers a fresh render — a preceding `revalidatePath()` to the same path is redundant.

---

## Input Validation with Zod

Schemas in `lib/schemas/` — see [AGENTS-PATTERNS.md § Zod Schemas](./AGENTS-PATTERNS.md#2-server-action-hardening-strategy-like).

- **Validate on the server** — client-side validation is UX only; the Server Action is the security boundary
- **Use `.safeParse()`** — graceful error handling without try-catch
- **Set max lengths** — prevent DoS via long inputs; match DB column constraints
- **Use `.or(z.literal(""))` for optional URL fields** — empty form strings aren't valid URLs
- **Transform empty strings to `undefined`** via `.transform()`

---

## SQL Injection Prevention

Drizzle ORM produces parameterized queries by default. Safe patterns:

```typescript
db.select().from(projects).where(eq(projects.id, id));       // Query builder — safe
db.insert(projects).values({ title, description });           // Insert — safe
sql<number>`COALESCE(MAX(${projects.order}), 0)`              // sql template — safe (parameterized)
```

**Never do**:
- `db.execute(\`SELECT * FROM projects WHERE id = ${id}\`)` — SQL injection
- `sql.raw(\`... WHERE title = '${title}'\`)` — SQL injection
- Dynamic table/column names from user input

### Rules

- **Always use the Drizzle query builder** or `sql` template literal
- **Never use `sql.raw()` with user input**
- **Validate IDs as numbers before queries** — even though Drizzle parameterizes

---

## Secure Environment Variables

| Pattern | Exposure | Examples |
| --- | --- | --- |
| `NEXT_PUBLIC_*` | Bundled in client JS (visible to everyone) | `NEXT_PUBLIC_API_URL` |
| No prefix | Server-only (never sent to browser) | `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BETTER_AUTH_SECRET` |

### Rules

- **NEVER prefix secrets with `NEXT_PUBLIC_`**
- **NEVER commit `.env.local` to git** — verify `.gitignore` includes it
- **Generate `BETTER_AUTH_SECRET`** with `openssl rand -base64 32` (at least 32 chars)
- **On Vercel, use Sensitive Environment Variables** — encrypted, non-readable after creation
- **Use different values per environment** (Production, Preview, Development)

---

## CSRF Protection

- **better-auth verifies `Origin` header** on all mutation requests — rejects if origin doesn't match `trustedOrigins`
- **Next.js Server Actions are protected by default** — framework validates `Origin` header; no additional CSRF tokens needed
- **Do NOT set `disableCSRFCheck: true`** or `disableOriginCheck: true` in better-auth
- **Session cookies use `SameSite: 'lax'`** by default — allows top-level navigations, blocks cross-site form submissions
- **Custom API routes** (beyond `/api/auth/*`) need manual CSRF token verification

---

## Secure Cookies & Sessions

better-auth manages session cookies with flags: `httpOnly: true`, `secure: true` (production), `sameSite: 'lax'`, `path: '/'`.

- **Never access session cookies in client JavaScript** — `httpOnly` by design
- **Cookie cache (5 min)** — revoked session valid up to 5 minutes; acceptable for single-admin dashboard
- **Don't implement custom session timeout** — better-auth handles expiration/renewal
- **Custom cookies** must always set: `httpOnly`, `secure`, `sameSite`, reasonable `maxAge`

---

## Rate Limiting

**Use Vercel WAF as the primary rate limiting layer** — operates at the edge with global state, before your code runs. In-memory counters (LRU, Map, better-auth `"memory"` storage) are unreliable on serverless — instances don't share memory, cold starts reset counters.

### Recommended WAF Rules

| Rule | Path | Limit | Window | Action |
| --- | --- | --- | --- | --- |
| Auth protection | `/api/auth/*` | 20 req | 60s | Deny (429) |
| General API | `/api/*` | 100 req | 60s | Deny (429) |

### Rules

- **Enable better-auth rate limiting** as defense in depth — use `"database"` storage for production, `"memory"` acceptable as basic deterrent for low-traffic single-admin
- **Stricter limits on auth endpoints** (10-20 req/min) — most targeted
- **Return `429 Too Many Requests`** with `Retry-After` header when possible
- **Use `@vercel/firewall` SDK** for application-level context (user ID, etc.) — requires matching dashboard rule

> Full `@vercel/firewall` SDK examples and WAF plan limits: [AGENTS-SECURITY-REFERENCE.md](./AGENTS-SECURITY-REFERENCE.md#rate-limiting-details)

---

## Source Maps & Production Hardening

- **Never enable `productionBrowserSourceMaps: true`** — exposes source code
- **Add `removeConsole` to `next.config.ts`** — strips `console.log`/`debug`/`info`/`trace`, keeps `error`/`warn`
- **Never log sensitive data** — tokens, passwords, DB URLs must never appear in logs

---

## Dependency Security

- **Run `pnpm audit` before every deployment** — no high/critical vulnerabilities
- **`pnpm up` weekly** (within semver ranges), `pnpm dlx npm-check-updates` monthly (check majors)
- **Lock file is your friend** — always commit `pnpm-lock.yaml`
- **Ignore unfixable CVEs explicitly** in `auditConfig.ignoreCves` rather than ignoring the entire audit

> Full audit commands and workflow: [AGENTS-SECURITY-REFERENCE.md](./AGENTS-SECURITY-REFERENCE.md#dependency-audit-commands)

---

## Vercel Security Features

| Automatic (no config) | Needs Configuration |
| --- | --- |
| HTTPS + SSL/TLS certificates | Mark secrets as Sensitive in dashboard |
| DDoS mitigation | Attack Challenge Mode (CAPTCHA for bots) |
| Edge network / global CDN | Deployment Protection (restrict previews) |
| Encrypted env vars at rest | WAF rate limit rules |

### Rules

- **Always mark secrets as Sensitive** — `TURSO_AUTH_TOKEN`, `BETTER_AUTH_SECRET`, `TURSO_DATABASE_URL`
- **Do not expose admin routes in preview deployments**

---

## Defense in Depth Summary

| Layer | Protection | This Project |
| --- | --- | --- |
| Network | DDoS, HTTPS | Vercel (automatic) |
| Edge | Rate limiting | Vercel WAF rules |
| Transport | HSTS, TLS | Security headers in `next.config.ts` |
| Application | CSP, headers | `proxy.ts` + `next.config.ts` |
| Authentication | Session validation | better-auth + `getServerSession()` |
| Input | Validation | Zod schemas + Drizzle ORM |
| Data | Parameterized queries | Drizzle ORM (automatic) |
| Dependencies | Vulnerability audit | `pnpm audit` |

---

## Setup Checklist (TODO)

- [ ] Add nonce-based CSP to `proxy.ts`
- [ ] Add security headers to `next.config.ts`
- [ ] Add `removeConsole` compiler option to `next.config.ts`
- [ ] Create Zod schemas for all entities
- [ ] Add `getServerSession()` to all Server Actions
- [ ] Mark secrets as Sensitive in Vercel dashboard
- [ ] Add WAF rate limit rules (`/api/auth/*` 20 req/min, `/api/*` 100 req/min)
- [ ] Enable `rateLimit` in `lib/auth.ts`
- [ ] Add audit scripts to `package.json`
