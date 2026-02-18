# AGENTS-SECURITY-REFERENCE.md

Full implementation code extracted from [AGENTS-SECURITY.md](./AGENTS-SECURITY.md). Read this file when actively implementing a security feature — the main file has the rules and decision guidance.

---

## CSP Full Implementation

The current `proxy.ts` handles auth redirects only. CSP must be added to the same file:

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

When you need the nonce for third-party `<Script>` components:

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
| `script-src` | `'self' 'nonce-...' 'strict-dynamic'` | Scripts only with matching nonce; `strict-dynamic` allows nonce-loaded scripts to load children |
| `style-src` | `'self' 'nonce-...'` (prod) / `'unsafe-inline'` (dev) | Styles require nonce in production; dev needs `unsafe-inline` for HMR |
| `img-src` | `'self' blob: data: https:` | Same origin, blob URLs (Next.js Image), data URIs, any HTTPS |
| `font-src` | `'self'` | Only self-hosted fonts (via `next/font`) |
| `object-src` | `'none'` | Block `<object>`, `<embed>`, `<applet>` |
| `base-uri` | `'self'` | Prevents `<base>` tag hijacking |
| `form-action` | `'self'` | Forms only submit to same origin |
| `frame-ancestors` | `'none'` | Prevents iframe embedding (clickjacking) |
| `upgrade-insecure-requests` | — | Automatically upgrades HTTP → HTTPS |

---

## Security Headers Implementation

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
| `X-DNS-Prefetch-Control` | `on` | Enables DNS prefetching for external links — performance |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Forces HTTPS for 2 years. Submit to [HSTS preload list](https://hstspreload.org/) after verifying |
| `X-Frame-Options` | `SAMEORIGIN` | Prevents iframe embedding. Superseded by CSP `frame-ancestors` but kept for older browsers |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing — stops executing uploaded files as scripts |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Full URL for same-origin, only origin for cross-origin, nothing for HTTPS→HTTP downgrade |
| `Permissions-Policy` | `camera=(), microphone=(), ...` | Disables unused browser APIs — reduces attack surface |

---

## getServerSession Implementation

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

---

## Rate Limiting Details

### Why Vercel WAF (Not In-Memory)

| Problem with in-memory | Impact |
| --- | --- |
| Instance isolation | Different serverless instances don't share counters — clients bypass limits |
| Cold starts | Cache resets to zero on new instance |
| No global view | No cross-region coordination |

Vercel WAF operates at the edge with global state. In-memory (`LRUCache`, `Map`) is fine for *data caching*, not for *rate limiting* on serverless.

### Vercel WAF Setup (Dashboard)

1. Dashboard > Project > Firewall > Configure > + New Rule
2. Set **If** conditions (e.g., Request Path equals `/api/auth/*`)
3. Set **Then** action to Rate Limit
4. Configure Time Window and Request Limit
5. Select counting key: IP or JA4 Digest
6. Set exceeded action: Deny (429) or Challenge
7. Save > Review > Publish

### `@vercel/firewall` SDK

For rate limiting by application-level context (authenticated user ID, not just IP):

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

With authenticated user key:

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
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }
  // Continue
}
```

> **Prerequisite:** The `@vercel/firewall` SDK requires a matching custom rule in the Vercel dashboard with the same Rate Limit ID.

### better-auth Rate Limiting Config

```typescript
// lib/auth.ts
export const auth = betterAuth({
  // ... existing config ...
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
    storage: "memory", // Use "database" (Turso) for production reliability
  },
});
```

| Option | Default | Description |
| --- | --- | --- |
| `enabled` | `false` | Enable rate limiting for auth endpoints |
| `window` | `60` | Time window in seconds |
| `max` | `10` | Max requests per window |
| `storage` | `"memory"` | `"memory"` has serverless issues; use `"database"` or `"secondary-storage"` for production |

### WAF Plan Limits

| Resource | Hobby | Pro | Enterprise |
| --- | --- | --- | --- |
| Rate limit rules | 1/project | 40/project | 1000/project |
| Counting keys | IP, JA4 | IP, JA4 | IP, JA4, User Agent, custom headers |
| Time window range | 10s–10min | 10s–10min | 10s–1hr |

---

## Cookie Flags (Set by better-auth)

| Flag | Value | Purpose |
| --- | --- | --- |
| `httpOnly` | `true` | Not accessible via JavaScript — prevents XSS session theft |
| `secure` | `true` (production) | Only sent over HTTPS |
| `sameSite` | `lax` | Sent on top-level navigations, blocked on cross-site form submissions |
| `path` | `/` | Available on all routes |

---

## Console Removal Config

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },
};
```

Strips `console.log`, `console.debug`, `console.info`, `console.trace` from production builds; keeps `console.error` and `console.warn`.

---

## Dependency Audit Commands

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

| Command | When | What |
| --- | --- | --- |
| `pnpm audit` | Before deployment, weekly | Checks for known CVEs |
| `pnpm audit --fix` | When vulnerabilities found | Adds overrides for non-vulnerable versions |
| `pnpm dlx npm-check-updates` | Monthly | Lists newer versions available |
| `pnpm up --latest` | After reviewing | Updates all to latest (may break) |
| `pnpm up` | Weekly | Updates within semver ranges (safe) |

---

## Vercel Environment Variable Commands

```bash
pnpm dlx vercel env add TURSO_AUTH_TOKEN      # Add sensitive var (select scope + type)
pnpm dlx vercel env ls                         # List all env vars
pnpm dlx vercel env pull .env.local            # Pull for local development
```

### Vercel Auto-Provided Variables

| Variable | Value | Usage |
| --- | --- | --- |
| `VERCEL_URL` | Deployment URL (no protocol) | Construct `BETTER_AUTH_URL` dynamically |
| `VERCEL_ENV` | `production` / `preview` / `development` | Conditional logic per environment |
| `VERCEL_GIT_COMMIT_SHA` | Git commit hash | Cache busting, debugging |
