# AGENTS-PERFORMANCE.md

Performance guidelines for the portfolio project. This document covers topics not fully addressed by the installed skills, and provides project-specific guidance that ties everything together.

**Related skills** (already installed, do not duplicate their content):

- `next-cache-components` — Cache Components, PPR, `use cache`, `cacheLife`, `cacheTag`, `updateTag`
- `next-best-practices/image.md` — `next/image`, responsive sizes, priority, blur placeholders
- `next-best-practices/data-patterns.md` — Server Components for reads, Server Actions for mutations, avoiding waterfalls
- `next-best-practices/bundling.md` — Server-incompatible packages, bundle analysis, Turbopack migration
- `next-best-practices/rsc-boundaries.md` — Invalid RSC patterns, serialization rules
- `next-best-practices/suspense-boundaries.md` — Suspense requirements for `useSearchParams`, `usePathname`
- `vercel-react-best-practices` — 57 rules across 8 categories (waterfalls, bundle, server, client, re-render, rendering, JS, advanced)
- `vercel-composition-patterns` — Component architecture, compound components, state management

---

## React Compiler

The React Compiler is enabled in this project (`reactCompiler: true` in `next.config.ts`). It automatically optimizes React components at build time.

### What It Does

The React Compiler analyzes your component code and automatically inserts memoization where beneficial. It replaces the need for manual optimization hooks.

### What You No Longer Need

| Before (manual) | After (React Compiler handles it) |
| --- | --- |
| `useMemo(() => expensiveCalc(data), [data])` | `const result = expensiveCalc(data)` |
| `useCallback((id) => handleClick(id), [handleClick])` | `const handler = (id) => handleClick(id)` |
| `React.memo(MyComponent)` | `function MyComponent(props) { ... }` |

### Coding Guidelines With React Compiler

- **Do NOT use `useMemo`, `useCallback`, or `React.memo`** — the compiler handles memoization automatically. Adding them manually is redundant and adds noise.
- **Write plain, readable code** — the compiler optimizes it for you. Prioritize clarity over manual performance tricks.
- **Keep components pure** — the compiler relies on React's rules of purity. Components should return the same output for the same props and not mutate external state during render.
- **Avoid side effects during render** — only use side effects inside `useEffect`, event handlers, or Server Actions.
- **Do NOT use `React.forwardRef`** — React 19 supports `ref` as a regular prop. Just accept `ref` in your component props directly.

```typescript
// Before React 19 + Compiler
const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  return <input ref={ref} {...props} />;
});

// After React 19 + Compiler
function Input({ ref, ...props }: InputProps & { ref?: React.Ref<HTMLInputElement> }) {
  return <input ref={ref} {...props} />;
}
```

### When the Compiler Cannot Help

The compiler does not optimize:

- Code that violates React's rules (mutations during render, conditional hooks)
- Non-React code (utility functions, API calls)
- Third-party libraries that are not React-compatible

If the compiler detects code it cannot safely optimize, it silently skips that code and leaves it as-is. No errors are thrown.

### Debugging

If you suspect a compiler issue:

1. Check the browser DevTools for the `Memo ✨` badge on optimized components (React DevTools)
2. Temporarily disable the compiler in `next.config.ts` to compare behavior
3. Report issues at [React Compiler Working Group](https://github.com/reactwg/react-compiler)

---

## Dynamic Imports & Code Splitting

Use dynamic imports proactively to reduce the initial JavaScript bundle. This is especially important for the admin dashboard, which contains heavy form editors and data tables that public visitors never need.

### When to Use Dynamic Imports

- **Heavy components** that are not visible on initial page load (modals, dialogs, editors, charts)
- **Admin-only components** that are behind authentication
- **Client-only libraries** that use browser APIs (`window`, `document`)
- **Below-the-fold content** that users must scroll to see

### Patterns

```typescript
import dynamic from "next/dynamic";

// Heavy component with loading state
const HeavyEditor = dynamic(() => import("@/components/admin/editor"), {
  loading: () => <Spinner />,
});

// Client-only component (uses browser APIs)
const ChartComponent = dynamic(() => import("@/components/chart"), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-muted rounded-md" />,
});

// Named export
const SkillsMultiSelect = dynamic(
  () =>
    import("@/components/skills-multi-select").then(
      (mod) => mod.SkillsMultiSelect
    ),
  { loading: () => <Spinner /> }
);
```

### What NOT to Dynamically Import

- **Layout components** (header, sidebar, navigation) — always needed immediately
- **Small, lightweight components** — the overhead of code splitting outweighs the savings
- **Server Components** — they are automatically code-split by Next.js, no action needed

### Project-Specific Guidance

| Component | Dynamic Import? | Reason |
| --- | --- | --- |
| Admin sidebar/header | No | Always visible in dashboard |
| Login form | No | Lightweight, needed immediately |
| Skills multi-select (combobox) | Yes | Heavy (cmdk dependency), only in forms |
| Data tables (projects, experiences) | No | Primary content of dashboard pages |
| Dialogs/Modals (delete confirmation) | Yes | Only rendered on user action |
| Public portfolio page | No | Single page, all content is primary |

---

## Loading Files & Streaming

Next.js `loading.tsx` files automatically wrap their sibling `page.tsx` in a `<Suspense>` boundary. This improves Time to First Byte (TTFB) by streaming the layout immediately while the page content loads.

### File Structure Pattern

```
app/(admin)/dashboard/projects/
├── loading.tsx    # Shown instantly while page.tsx loads
└── page.tsx       # Async page that fetches data
```

### Skeleton UI Pattern

Create loading files that match the shape of the actual page content to minimize layout shift:

```typescript
// app/(admin)/dashboard/projects/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-4">
      {/* Matches the header area */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
      </div>

      {/* Matches the table rows */}
      <div className="rounded-md border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b p-4 last:border-b-0"
          >
            <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/6 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Granular Streaming with Suspense

For pages with multiple independent data sources, use `<Suspense>` boundaries to stream sections independently:

```typescript
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Static content - renders immediately */}
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Each section streams independently */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      <Suspense fallback={<RecentProjectsSkeleton />}>
        <RecentProjects />
      </Suspense>

      <Suspense fallback={<RecentExperiencesSkeleton />}>
        <RecentExperiences />
      </Suspense>
    </div>
  );
}
```

### Where to Add Loading Files

| Route | Loading File Needed? | Reason |
| --- | --- | --- |
| `app/(admin)/dashboard/page.tsx` | Yes | Fetches overview data |
| `app/(admin)/dashboard/projects/page.tsx` | Yes | Fetches projects list |
| `app/(admin)/dashboard/experiences/page.tsx` | Yes | Fetches experiences list |
| `app/(admin)/dashboard/skills/page.tsx` | Yes | Fetches skills list |
| `app/(admin)/dashboard/social-links/page.tsx` | Yes | Fetches social links list |
| `app/(admin)/dashboard/settings/page.tsx` | Yes | Fetches site settings |
| `app/(public)/page.tsx` | Yes | Fetches all portfolio data |
| `app/(admin)/login/page.tsx` | No | No data fetching, lightweight form |

---

## Bundle Optimization

### `optimizePackageImports`

Add frequently used icon and utility libraries to `optimizePackageImports` in `next.config.ts`. This ensures only the specific exports you use are included in the bundle, even if the library uses barrel files:

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
};

export default nextConfig;
```

### Import Best Practices

```typescript
// GOOD: Import specific icons
import { Heart, Star, Share } from "lucide-react";

// BAD: Import everything (tree shaking may miss some)
import * as Icons from "lucide-react";

// GOOD: Import specific utility
import { format } from "date-fns";

// BAD: Import entire library
import dateFns from "date-fns";
```

### Bundle Analysis

Analyze your bundle to find oversized dependencies:

```bash
# Next.js 16.1+ built-in analyzer
pnpm next experimental-analyze

# Save output for comparison
pnpm next experimental-analyze --output
# Output saved to .next/diagnostics/analyze
```

Review the output to identify:

- Large client-side dependencies that could be moved to Server Components
- Duplicate packages included multiple times
- Unused code that survived tree shaking

---

## Server Components vs Client Components Decision Tree

This project uses Server Components by default. Use this decision tree for every new component:

```
Is the component interactive (onClick, onChange, state, effects)?
├── NO → Server Component (default, no directive needed)
│   Benefits:
│   - Zero client JS
│   - Direct DB/API access
│   - Secrets stay on server
│
└── YES → Does the ENTIRE component need interactivity?
    ├── NO → Split into Server + Client parts
    │   - Keep data fetching in Server Component
    │   - Pass data as props to a small Client Component
    │   - Only the Client Component gets "use client"
    │
    └── YES → Client Component ("use client")
        - Keep it as small as possible
        - Import it into a Server Component parent
        - Never fetch data inside it (pass from parent)
```

### Project-Specific Component Boundaries

| Component | Type | Reason |
| --- | --- | --- |
| Dashboard layout (`layout.tsx`) | Server | Static structure, no interactivity |
| Sidebar navigation | Client | Active state, mobile toggle |
| Projects list page | Server | Data fetching, table rendering |
| Delete confirmation dialog | Client | Modal state, click handlers |
| Login form | Client | Form state, submission handling |
| Public portfolio page | Server | Static rendering, SEO-optimized |
| Skills multi-select | Client | Combobox interactivity (cmdk) |

---

## Core Web Vitals

Core Web Vitals are the three metrics Google uses to measure real-world user experience. They directly affect search rankings and represent the three pillars of page quality: loading, interactivity, and visual stability.

### LCP (Largest Contentful Paint) — Loading

Measures how long it takes for the largest visible element (hero image, heading, or main content block) to render.

| Rating | Threshold |
| --- | --- |
| Good | ≤ 2.5 seconds |
| Needs Improvement | 2.5s – 4.0s |
| Poor | > 4.0 seconds |

**What optimizes LCP in this project:**

- Use `priority` prop on above-the-fold images (`next/image`) — skips lazy loading, preloads the image
- Use `next/font` for font loading — eliminates render-blocking external font requests
- Minimize server response time — keep Turso queries fast, use `"use cache"` with `cacheLife` for data that doesn't change every request
- Avoid large client-side JavaScript on the public page — keep it as a Server Component
- Use `loading.tsx` files — the static shell renders immediately while data streams in

### INP (Interaction to Next Paint) — Interactivity

Measures the latency of all user interactions (clicks, taps, key presses) throughout the page lifecycle. The worst interaction (at the 98th percentile) becomes the INP score.

| Rating | Threshold |
| --- | --- |
| Good | ≤ 200 milliseconds |
| Needs Improvement | 200ms – 500ms |
| Poor | > 500 milliseconds |

**What optimizes INP in this project:**

- React Compiler auto-memoizes components — fewer unnecessary re-renders on interaction
- Server Components by default — minimal client-side JavaScript means fewer things competing for the main thread
- Dynamic imports for heavy components — keeps the initial JS bundle small
- Avoid heavy synchronous work in event handlers — defer to `startTransition` or Server Actions for mutations

### CLS (Cumulative Layout Shift) — Visual Stability

Measures unexpected layout shifts during the page lifecycle. Shifts caused by user interaction (clicking a button that expands content) are excluded.

| Rating | Threshold |
| --- | --- |
| Good | ≤ 0.1 |
| Needs Improvement | 0.1 – 0.25 |
| Poor | > 0.25 |

**What optimizes CLS in this project:**

- `next/image` with explicit `width`/`height` or `fill` — reserves space before the image loads, preventing layout shift
- `next/font` — eliminates flash of unstyled text (FOUT) that causes layout shifts when web fonts swap in
- Skeleton UIs in `loading.tsx` — match the shape of actual content so streaming doesn't cause jumps
- Avoid injecting content above existing content — new elements should appear below or replace placeholders

### Supplementary Metrics

These are not Core Web Vitals but help diagnose issues with the three main metrics:

| Metric | Full Name | Helps Diagnose | Good Threshold |
| --- | --- | --- | --- |
| TTFB | Time to First Byte | Slow LCP (server response too slow) | < 800ms |
| FCP | First Contentful Paint | Slow LCP (nothing rendering early) | < 1.8s |
| TBT | Total Blocking Time | Poor INP (main thread blocked, lab-only proxy) | < 200ms |

---

## Monitoring with `useReportWebVitals`

Next.js provides the `useReportWebVitals` hook to send Core Web Vitals data from real users to your analytics endpoint. This is **field data** (real users on real devices) as opposed to lab data (Lighthouse simulations).

### Setup

Create a client component that reports metrics:

```typescript
// components/web-vitals.tsx
"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals((metric) => {
    // metric.name: "LCP" | "INP" | "CLS" | "FCP" | "TTFB"
    // metric.value: the metric value
    // metric.rating: "good" | "needs-improvement" | "poor"

    // Option 1: Log to console during development
    if (process.env.NODE_ENV === "development") {
      console.log(metric.name, metric.value, metric.rating);
    }

    // Option 2: Send to analytics endpoint
    // fetch("/api/analytics", {
    //   method: "POST",
    //   body: JSON.stringify({
    //     name: metric.name,
    //     value: metric.value,
    //     rating: metric.rating,
    //     id: metric.id,
    //     page: window.location.pathname,
    //   }),
    //   keepalive: true,
    // });
  });

  return null;
}
```

Add it to your root layout:

```typescript
// app/layout.tsx
import { WebVitals } from "@/components/web-vitals";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WebVitals />
        {children}
      </body>
    </html>
  );
}
```

### Notes

- `useReportWebVitals` is built on top of the `web-vitals` library — no need to install `web-vitals` separately in a Next.js project
- The hook must be in a Client Component (`"use client"`)
- Place it in the root layout so it captures metrics on every page
- The `rating` field (`"good"`, `"needs-improvement"`, `"poor"`) uses the same thresholds as Google's tools
- For production, connect this to your analytics provider (Vercel Analytics, Google Analytics, or a custom endpoint)

---

## Pre-Production Audit

### Lighthouse

Run Lighthouse before every production deployment to catch performance regressions:

```bash
# Build the production version
pnpm build

# Start the production server
pnpm start

# Then in Chrome:
# 1. Open http://localhost:3000 in Incognito mode (avoids extension interference)
# 2. Open DevTools → Lighthouse tab
# 3. Select: Performance, Accessibility, Best Practices, SEO
# 4. Click "Analyze page load"
```

**Target scores for the public portfolio page:**

| Category | Target |
| --- | --- |
| Performance | ≥ 90 |
| Accessibility | ≥ 90 |
| Best Practices | ≥ 90 |
| SEO | ≥ 90 |

**Important**: Lighthouse is a **lab tool** (simulated environment). It measures LCP, CLS, and TBT (a proxy for INP since there's no real user interaction in lab). Pair it with **field data** from `useReportWebVitals` or Google Search Console for the complete picture.

### Other Measurement Tools

| Tool | Type | What It Provides |
| --- | --- | --- |
| [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview) | Lab | Simulated performance audit with actionable recommendations |
| [PageSpeed Insights](https://pagespeed.web.dev/) | Both | Lab (Lighthouse) + Field (CrUX real user data) for any public URL |
| [Google Search Console](https://search.google.com/search-console) | Field | Core Web Vitals report from real Chrome users visiting your site |
| Chrome DevTools Performance tab | Lab | Detailed flame charts for debugging specific interactions |

**Recommended workflow:**

1. **During development**: Lighthouse in DevTools for quick checks
2. **Before deploying**: `pnpm build && pnpm start`, then full Lighthouse audit in Incognito
3. **After deploying**: Check PageSpeed Insights with your live URL
4. **Ongoing**: Monitor Google Search Console Core Web Vitals report for field regressions

---

## Performance Checklist

Use this checklist before deploying or when reviewing performance:

### Server Components & Rendering

- [ ] All data-fetching components are Server Components (no `"use client"`)
- [ ] Client Components are as small as possible (push `"use client"` boundary down)
- [ ] No `useMemo`, `useCallback`, or `React.memo` (React Compiler handles this)
- [ ] No `React.forwardRef` (use `ref` as a regular prop in React 19)
- [ ] Admin routes are not in the public bundle (route groups separate them)

### Caching & Revalidation

- [ ] `cacheComponents: true` enabled in `next.config.ts`
- [ ] Data that changes infrequently uses `"use cache"` with appropriate `cacheLife`
- [ ] Cache tags (`cacheTag`) are set for data that needs on-demand revalidation
- [ ] Server Actions use `updateTag` or `revalidateTag` after mutations
- [ ] Runtime data (`cookies`, `headers`) is read outside `"use cache"` scope

### Loading & Streaming

- [ ] Every dashboard page has a `loading.tsx` file with skeleton UI
- [ ] Public portfolio page has a `loading.tsx` file
- [ ] Independent data sections use separate `<Suspense>` boundaries
- [ ] Skeleton UIs match the shape of the actual content

### Images

- [ ] All images use `next/image` (never `<img>`)
- [ ] Above-the-fold images have `priority` prop
- [ ] Responsive images have `sizes` prop
- [ ] Remote image domains are configured in `next.config.ts`

### Bundle Size

- [ ] Heavy components use `dynamic()` imports
- [ ] `optimizePackageImports` includes `lucide-react` and `react-icons`
- [ ] No barrel imports (`import * as ...`)
- [ ] Bundle analyzed periodically with `pnpm next experimental-analyze`

### Dynamic Imports

- [ ] Modals and dialogs are dynamically imported
- [ ] Client-only libraries use `ssr: false`
- [ ] Dynamic imports have `loading` fallbacks

### Core Web Vitals & Monitoring

- [ ] `<WebVitals />` component added to root layout for field monitoring
- [ ] Lighthouse audit run on production build (all categories ≥ 90)
- [ ] LCP element identified and optimized (hero image has `priority`, fonts use `next/font`)
- [ ] No unexpected layout shifts (CLS ≤ 0.1) — all images have dimensions, fonts don't cause FOUT
- [ ] Minimal client JS on public page — INP stays ≤ 200ms

### Pre-Production

- [ ] `pnpm build` completes without errors
- [ ] `pnpm start` tested locally before deploying
- [ ] Lighthouse audit in Incognito on `http://localhost:3000`
- [ ] PageSpeed Insights checked after deployment with live URL

---

## Documentation Links

- [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [React Compiler](https://react.dev/learn/react-compiler)
- [Lazy Loading / Dynamic Imports](https://nextjs.org/docs/app/guides/lazy-loading)
- [Caching in Next.js](https://nextjs.org/docs/app/guides/caching)
- [Caching and Revalidating](https://nextjs.org/docs/app/getting-started/caching-and-revalidating)
- [Cache Components / PPR](https://nextjs.org/docs/app/getting-started/cache-components)
- [Image Optimization](https://nextjs.org/docs/app/getting-started/images)
- [Production Checklist](https://nextjs.org/docs/app/guides/production-checklist)
- [Package Bundling](https://nextjs.org/docs/app/guides/package-bundling)
- [Core Web Vitals](https://web.dev/articles/vitals)
- [useReportWebVitals](https://nextjs.org/docs/app/api-reference/functions/use-report-web-vitals)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview)
- [PageSpeed Insights](https://pagespeed.web.dev/)
