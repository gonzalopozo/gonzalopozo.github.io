# AGENTS-TESTING.md

Testing guidelines for the portfolio project. This document covers the testing strategy, tool configuration, conventions, and mocking patterns for a Next.js 16 application tested with Vitest (unit/component) and Playwright (E2E).

**Related skills** (already installed, do not duplicate their content):

- `vitest` — Vitest core API (`test`, `describe`, `expect`), CLI, hooks, mocking (`vi.mock`, `vi.spyOn`, `vi.fn`), snapshots, coverage, concurrency, environments, type testing
- `playwright-skill` — Playwright browser automation, locators, assertions, screenshots, responsive testing, login flows, form interactions, CI patterns

**Related coverage in other AGENTS files (do not duplicate):**

- `AGENTS-SECURITY.md` > Server Actions Security — the 4-step authenticate/validate/execute/revalidate pattern that tests must verify
- `AGENTS-SECURITY.md` > Input Validation with Zod — schema patterns that are prime TDD candidates
- `AGENTS-ACCESSIBILITY.md` > Automated Testing — axe-core integration with Playwright for accessibility checks

---

## Testing Philosophy

This project follows a **pragmatic, layered testing approach** — not strict TDD everywhere, but TDD where it provides the most value.

### The "TDD Where It Hurts" Principle

Use TDD (write the test first) for code where bugs have real impact and the feedback loop is fast. Use Test-After for code that is framework-coupled or UI-heavy.

| Code Layer | Strategy | Tool | Why |
| --- | --- | --- | --- |
| Zod validation schemas | **TDD** (test first) | Vitest | Pure functions, clear input/output, fast feedback. Define edge cases before writing the schema. |
| Utility functions (`lib/utils.ts`) | **TDD** (test first) | Vitest | Pure logic, millisecond test runs, ideal red-green-refactor cycle. |
| Server Action logic (validate + execute) | **TDD for validation, Test-After for DB** | Vitest | Validation is pure (TDD). Database operations require mocking (Test-After is more practical). |
| Junction table sync logic | **Test-After** | Vitest | Complex diffing logic (add/remove skills). Write the code first, then add tests for edge cases. |
| Client Components with custom logic | **Test-After** (optional) | Vitest + React Testing Library | Only for components with non-trivial logic. Skip for simple wrappers around shadcn. |
| Pages, layouts, route flows | **Test-After** | Playwright | Framework-coupled, needs a real browser. Write the page, then write E2E tests. |
| Auth flows (login, protected routes) | **Test-After** | Playwright | Requires real cookies, redirects, and server behavior. |
| Public page rendering | **Test-After** | Playwright | Verifies that all sections render with real data. |

### The TDD Cycle (Red-Green-Refactor)

When using TDD for Zod schemas and utilities:

1. **Red** — Write a failing test that describes the desired behavior. Run it. It fails (because the code doesn't exist yet). This is expected.
2. **Green** — Write the **minimum code** to make the test pass. Don't optimize, don't refactor, just make it green.
3. **Refactor** — Clean up the code (remove duplication, improve naming) while keeping all tests green. Run tests after every change.
4. **Repeat** — Write the next failing test for the next behavior. Continue the cycle.

**Example: TDD for a Zod schema**

```
Iteration 1 (Red):    Write test "rejects empty title"      → test fails (schema doesn't exist)
Iteration 1 (Green):  Create schema with title: z.string()   → test passes
Iteration 1 (Refactor): Add .min(1) for clarity              → test still passes

Iteration 2 (Red):    Write test "rejects title over 200 chars" → test fails
Iteration 2 (Green):  Add .max(200)                          → test passes
Iteration 2 (Refactor): Add error message to .max()          → test still passes

... continue for each field and edge case
```

### When NOT to Write Tests

Do not test:

- **shadcn/ui primitives** (Dialog, Select, Button) — already tested by Radix UI upstream
- **better-auth configuration** — declarative config, not testable logic
- **Tailwind CSS classes** — visual output, not testable with unit tests
- **Next.js framework behavior** (routing, layouts, streaming) — tested by the Next.js team
- **Simple data fetching pages** with no business logic — covered by E2E tests naturally
- **React Server Components with unit tests** — async RSCs are not supported by any unit testing tool in 2026. Use Playwright for these.

---

## Tool Setup

### Vitest Configuration

The project uses Vitest with React Testing Library for unit and component testing.

**Config file:** `vitest.config.mts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['e2e/**'],
    globals: false,
    css: false,
  },
})
```

**Key settings:**

| Setting | Value | Purpose |
| --- | --- | --- |
| `environment` | `'jsdom'` | Simulates a browser DOM for component tests. Use `'node'` for pure logic tests if needed (per-file override via `// @vitest-environment node` comment). |
| `plugins: [tsconfigPaths()]` | — | Resolves the `@/*` path alias from `tsconfig.json`, so imports like `@/lib/utils` work in tests. |
| `plugins: [react()]` | — | Enables JSX/TSX transformation for component tests. |
| `include` | `['tests/**/*.test.{ts,tsx}']` | Only runs test files inside the `tests/` directory. |
| `exclude` | `['e2e/**']` | Prevents Vitest from picking up Playwright test files. |
| `globals` | `false` | Requires explicit imports (`import { test, expect } from 'vitest'`). More explicit, no magic globals. |
| `css` | `false` | Skips CSS processing in tests — Tailwind classes don't need to be resolved for logic tests. |

**Running Vitest:**

```bash
pnpm test              # Run all tests in watch mode (re-runs on file changes)
pnpm test -- --run     # Run all tests once (no watch mode, for CI)
pnpm test -- --ui      # Open the Vitest UI in the browser for interactive debugging
```

### Playwright Configuration

The project uses Playwright for E2E testing in real browsers.

**Config file:** `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Key settings:**

| Setting | Value | Purpose |
| --- | --- | --- |
| `testDir` | `'./e2e'` | All Playwright tests live in the `e2e/` directory. |
| `fullyParallel` | `true` | Run tests in parallel for faster execution. |
| `forbidOnly` | `!!process.env.CI` | Fail CI builds if `.only` is accidentally left in a test. |
| `retries` | `2` (CI) / `0` (local) | Retry flaky tests in CI, but not locally (forces you to fix flakiness). |
| `workers` | `1` (CI) / `undefined` (local) | Single worker in CI to avoid resource contention; auto-detect locally. |
| `baseURL` | `'http://localhost:3000'` | Allows using `page.goto('/')` instead of full URLs. |
| `trace` | `'on-first-retry'` | Captures a trace (DOM snapshots, network, console) on the first retry — essential for debugging CI failures. |
| `webServer` | `pnpm dev` | Automatically starts the dev server before running tests. In CI, starts fresh; locally, reuses if already running. |

**Running Playwright:**

```bash
pnpm exec playwright test                  # Run all E2E tests headless
pnpm exec playwright test --headed         # Run with visible browser windows
pnpm exec playwright test --ui             # Open interactive UI mode (watch, step-through, trace)
pnpm exec playwright test --project=chromium  # Run only in Chromium
pnpm exec playwright test e2e/auth.spec.ts    # Run a specific test file
pnpm exec playwright show-report           # Open the HTML report after a test run
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:report": "playwright show-report"
  }
}
```

---

## Test File Location & Naming Conventions

### Directory Structure

```
├── tests/                       # Vitest unit & component tests
│   ├── schemas/                 # Zod schema validation tests
│   │   ├── project.test.ts
│   │   ├── experience.test.ts
│   │   ├── skill.test.ts
│   │   ├── social-link.test.ts
│   │   └── settings.test.ts
│   ├── actions/                 # Server Action logic tests
│   │   ├── projects.test.ts
│   │   ├── experiences.test.ts
│   │   ├── skills.test.ts
│   │   ├── social-links.test.ts
│   │   └── settings.test.ts
│   ├── utils/                   # Utility function tests
│   │   └── utils.test.ts
│   └── components/              # Client component tests (optional)
│       └── skills-multi-select.test.tsx
│
├── e2e/                         # Playwright E2E tests
│   ├── auth.spec.ts             # Login, logout, protected route redirects
│   ├── projects.spec.ts         # CRUD flows for projects
│   ├── experiences.spec.ts      # CRUD flows for experiences
│   ├── skills.spec.ts           # CRUD flows for skills
│   ├── social-links.spec.ts     # CRUD flows for social links
│   ├── settings.spec.ts         # Site settings management
│   ├── public-page.spec.ts      # Public portfolio page rendering
│   └── accessibility.spec.ts    # axe-core automated accessibility checks
```

### Naming Rules

| Convention | Vitest | Playwright |
| --- | --- | --- |
| File extension | `.test.ts` / `.test.tsx` | `.spec.ts` |
| Directory | `tests/` | `e2e/` |
| File names | Mirror the source file (e.g., `projects.test.ts` tests `lib/actions/projects.ts`) | Named by user flow (e.g., `auth.spec.ts`, `projects.spec.ts`) |
| Test names | Describe the behavior: `"rejects empty title"`, `"returns null for invalid ID"` | Describe the user action: `"should create a new project"`, `"should redirect to login when unauthenticated"` |
| Grouping | Use `describe()` blocks to group related tests | Use `test.describe()` for grouping |

### Example: Vitest Test File

```typescript
// tests/schemas/project.test.ts
import { describe, it, expect } from "vitest";
import { ProjectSchema } from "@/lib/schemas/project";

describe("ProjectSchema", () => {
  it("accepts valid project data", () => {
    const result = ProjectSchema.safeParse({
      title: "My Portfolio",
      description: "A cool project",
      status: "active",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = ProjectSchema.safeParse({
      title: "",
      description: "A cool project",
      status: "active",
    });
    expect(result.success).toBe(false);
  });
});
```

### Example: Playwright Test File

```typescript
// e2e/public-page.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Public Portfolio Page", () => {
  test("renders all main sections", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /projects/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /experience/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /skills/i })).toBeVisible();
  });

  test("project links are clickable", async ({ page }) => {
    await page.goto("/");

    const projectLinks = page.getByRole("link").filter({ hasText: /view project/i });
    const count = await projectLinks.count();
    expect(count).toBeGreaterThan(0);
  });
});
```

---

## Mocking Strategy

Mocking replaces real dependencies with controlled substitutes so you can test logic in isolation. In this project, the main things to mock are: the database (Drizzle), authentication (better-auth sessions), and Next.js framework functions.

### Mocking Drizzle (Database)

Server Actions call `db.insert()`, `db.select()`, `db.update()`, `db.delete()`. In unit tests, mock the entire `@/db` module to avoid needing a real database.

```typescript
// tests/actions/projects.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ insertedId: 1 }]),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockResolvedValue([{ maxOrder: 0 }]),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ insertedId: 1 }]),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
    query: {
      projectSkills: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
  },
}));
```

**Key principle:** Mock the database at the module level (`vi.mock("@/db")`). This replaces the real Turso connection with fake objects that return controlled data. You never need a real database for unit tests.

### Mocking better-auth Sessions

Server Actions must call `getServerSession()` as their first step. In tests, mock it to simulate authenticated and unauthenticated states.

```typescript
// Mock the session module
vi.mock("@/lib/server-session", () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from "@/lib/server-session";

// In a specific test — authenticated user
it("creates project when authenticated", async () => {
  vi.mocked(getServerSession).mockResolvedValue({
    user: { id: "1", name: "Admin", email: "admin@example.com" },
    session: { id: "session-1", userId: "1" },
  });

  // ... test the Server Action
});

// In a specific test — unauthenticated user
it("redirects to login when unauthenticated", async () => {
  vi.mocked(getServerSession).mockResolvedValue(null);

  // ... test the Server Action, expect redirect to /login
});
```

### Mocking Next.js Functions

Server Actions use `redirect()`, `revalidatePath()`, and `revalidateTag()` from Next.js. These must be mocked because they throw special errors (like `NEXT_REDIRECT`) that don't work outside the Next.js runtime.

```typescript
// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn().mockImplementation((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

// Mock Next.js cache revalidation
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
```

**Why `redirect` throws:** In the real Next.js runtime, `redirect()` throws a special `NEXT_REDIRECT` error to halt execution. In tests, you simulate this by throwing a regular error and catching it:

```typescript
it("redirects to /dashboard/projects after creating", async () => {
  const { redirect } = await import("next/navigation");

  await expect(createProject(formData)).rejects.toThrow("REDIRECT:/dashboard/projects");
  expect(redirect).toHaveBeenCalledWith("/dashboard/projects");
});
```

### Mocking `FormData`

Server Actions receive `FormData` objects. In tests, create them manually:

```typescript
function createFormData(data: Record<string, string | string[]>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        formData.append(key, v);
      }
    } else {
      formData.set(key, value);
    }
  }
  return formData;
}

// Usage in tests
const formData = createFormData({
  title: "My Project",
  description: "A description",
  status: "active",
  skillIds: ["1", "3", "5"],
});
```

### Mocking Summary Table

| Dependency | Mock Target | Mock Method |
| --- | --- | --- |
| Database (Turso/Drizzle) | `@/db` | `vi.mock("@/db", () => ({ db: { ... } }))` |
| Authentication | `@/lib/server-session` | `vi.mock("@/lib/server-session", () => ({ getServerSession: vi.fn() }))` |
| `redirect()` | `next/navigation` | `vi.mock("next/navigation", () => ({ redirect: vi.fn() }))` |
| `revalidatePath()` / `revalidateTag()` | `next/cache` | `vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))` |
| `headers()` / `cookies()` | `next/headers` | `vi.mock("next/headers", () => ({ headers: vi.fn(), cookies: vi.fn() }))` |
| `FormData` | Manual creation | Use the `createFormData` helper above |

### Rules

- **Mock at the module level** (`vi.mock(...)`) — Vitest hoists these calls to the top of the file automatically
- **Use `vi.mocked()` for type-safe mock access** — `vi.mocked(getServerSession).mockResolvedValue(...)` gives you TypeScript autocompletion
- **Reset mocks between tests** — use `beforeEach(() => { vi.clearAllMocks(); })` to prevent state leakage between tests
- **Don't mock what you're testing** — if you're testing the Zod schema, don't mock Zod. If you're testing Server Action logic, mock the database but not the action itself
- **Prefer shallow mocks** — only mock what you need for the specific test. Deep, comprehensive mocks are brittle and hard to maintain

---

## What to Test Per Entity

Each portfolio entity (projects, experiences, skills, social links, settings) follows the same testing pattern:

### Vitest (Unit Tests)

| What to Test | Example |
| --- | --- |
| Schema accepts valid data | All required fields present, correct types |
| Schema rejects missing required fields | Empty title, empty description |
| Schema rejects invalid values | Status `"deleted"` (not in enum), title over 200 chars |
| Schema handles optional fields correctly | Empty URL is allowed, invalid URL is rejected |
| Schema `.or(z.literal(""))` works for optional URLs | Empty string passes, `"not-a-url"` fails |
| Server Action authenticates before executing | Returns redirect when session is null |
| Server Action validates input before DB call | Invalid data never reaches `db.insert()` |
| Server Action calls correct Drizzle operations | `db.insert()` called with validated data |
| Server Action revalidates/redirects correctly | `redirect()` or `revalidatePath()` called with expected path |
| Junction table sync adds new skills | Skills not in the previous set get inserted |
| Junction table sync removes old skills | Skills no longer selected get deleted |
| Junction table sync ignores unchanged skills | Skills that haven't changed are not touched |

### Playwright (E2E Tests)

| What to Test | Example |
| --- | --- |
| Login flow | Enter credentials → redirected to dashboard |
| Auth protection | Visit `/dashboard` without session → redirected to `/login` |
| Create entity | Fill form → submit → entity appears in list |
| Edit entity | Click edit → modify fields → save → changes visible |
| Delete entity | Click delete → confirm → entity removed from list |
| Validation errors show | Submit empty form → error messages visible |
| Public page renders | Visit `/` → all sections (projects, experience, skills, social links) visible |
| Navigation works | Click internal links → correct pages load |
| Accessibility (axe-core) | No WCAG 2.2 AA violations on public page |

---

## Playwright E2E Patterns

### Authentication Setup

For E2E tests that need an authenticated session, log in once and reuse the session across tests. Playwright supports saving authentication state to a file.

```typescript
// e2e/auth.setup.ts
import { test as setup, expect } from "@playwright/test";

const authFile = "e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Password").fill("your-test-password");
  await page.getByRole("button", { name: /sign in/i }).click();

  await page.waitForURL("/dashboard");
  await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();

  await page.context().storageState({ path: authFile });
});
```

Then configure projects in `playwright.config.ts` to use this setup:

```typescript
projects: [
  { name: "setup", testMatch: /.*\.setup\.ts/ },
  {
    name: "chromium",
    use: {
      ...devices["Desktop Chrome"],
      storageState: "e2e/.auth/user.json",
    },
    dependencies: ["setup"],
  },
],
```

**Important:** Add `e2e/.auth/` to `.gitignore` — it contains session cookies.

### Locator Best Practices

Playwright locators determine how tests find elements on the page. Prefer accessible locators that match how users perceive the page.

| Priority | Locator | Example | Why |
| --- | --- | --- | --- |
| 1 (best) | `getByRole` | `page.getByRole("button", { name: "Delete" })` | Matches the accessibility tree — most resilient to markup changes |
| 2 | `getByLabel` | `page.getByLabel("Email")` | For form inputs — matches the visible label |
| 3 | `getByText` | `page.getByText("No projects found")` | For visible text content |
| 4 | `getByTestId` | `page.getByTestId("project-card")` | Last resort — add `data-testid` only when no accessible locator works |
| 5 (avoid) | CSS selectors | `page.locator(".btn-primary")` | Fragile — breaks on CSS refactoring |

**Rules:**

- **Never use CSS selectors for testing** — they break when you change styling or component structure
- **Use `getByRole` as the default** — it validates your accessibility at the same time (if `getByRole` can't find the element, your accessibility is likely broken)
- **Use `data-testid` sparingly** — only for complex components where no accessible query works
- **Use `expect(locator).toBeVisible()` over `toHaveCount(1)`** — visibility checks are more meaningful than existence checks

### Page Object Pattern (Optional)

For complex pages with many interactions, encapsulate page-specific logic in a class:

```typescript
// e2e/pages/projects-page.ts
import { type Page, type Locator, expect } from "@playwright/test";

export class ProjectsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly createButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Projects" });
    this.createButton = page.getByRole("link", { name: /new project/i });
  }

  async goto() {
    await this.page.goto("/dashboard/projects");
    await expect(this.heading).toBeVisible();
  }

  async createProject(data: { title: string; description: string; status: string }) {
    await this.createButton.click();
    await this.page.getByLabel("Title").fill(data.title);
    await this.page.getByLabel("Description").fill(data.description);
    await this.page.getByLabel("Status").selectOption(data.status);
    await this.page.getByRole("button", { name: /create/i }).click();
  }

  async expectProjectVisible(title: string) {
    await expect(this.page.getByText(title)).toBeVisible();
  }
}
```

Use it sparingly — only when a page has enough repeated interactions to justify the abstraction.

---

## Accessibility Testing with Playwright

Integrate `@axe-core/playwright` to automatically check for WCAG violations as part of your E2E tests.

### Setup

```bash
pnpm add -D @axe-core/playwright
```

### Test Pattern

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility", () => {
  test("public page has no WCAG 2.2 AA violations", async ({ page }) => {
    await page.goto("/");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test("login page has no accessibility violations", async ({ page }) => {
    await page.goto("/login");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test("dashboard has no accessibility violations", async ({ page }) => {
    await page.goto("/dashboard");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
```

### Rules

- **Run accessibility tests on all public-facing pages** — at minimum the public page and login page
- **Use `wcag22aa` tag** — covers WCAG 2.2 Level AA, which is the standard compliance target
- **axe-core catches ~57% of WCAG issues automatically** — it is not a replacement for manual testing (see `AGENTS-ACCESSIBILITY.md` > Manual Testing Checklist)
- **Fix violations, don't suppress them** — if axe reports an issue, fix the component rather than excluding the rule

---

## CI Integration

### GitHub Actions Workflow

Create `.github/workflows/test.yml` to run both Vitest and Playwright on every push and pull request:

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  CI: true

jobs:
  unit-tests:
    name: Unit Tests (Vitest)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:run

  e2e-tests:
    name: E2E Tests (Playwright)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps
      - run: pnpm test:e2e
        env:
          TURSO_DATABASE_URL: ${{ secrets.TURSO_DATABASE_URL }}
          TURSO_AUTH_TOKEN: ${{ secrets.TURSO_AUTH_TOKEN }}
          BETTER_AUTH_SECRET: ${{ secrets.BETTER_AUTH_SECRET }}
          BETTER_AUTH_URL: http://localhost:3000
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### CI Notes

- **Unit tests don't need environment variables** — all external dependencies are mocked
- **E2E tests need a real database** — they test full flows against a running Next.js server. Use a separate test database or Turso test branch
- **Playwright report is uploaded as an artifact** — download it after a failed run to inspect traces, screenshots, and DOM snapshots
- **`--frozen-lockfile`** ensures CI uses the exact dependency versions from `pnpm-lock.yaml`
- **Playwright browsers must be installed** — `pnpm exec playwright install --with-deps` downloads Chromium, Firefox, and WebKit plus system dependencies

### Environment Variables for E2E

For CI, set these as GitHub Actions secrets:

| Secret | Purpose |
| --- | --- |
| `TURSO_DATABASE_URL` | Test database URL (use a separate DB, not production) |
| `TURSO_AUTH_TOKEN` | Auth token for the test database |
| `BETTER_AUTH_SECRET` | Any secret string (can differ from production) |

**Never use production database credentials in CI.** Create a separate Turso database for testing, or use Turso's database branching feature.

---

## Good Practices

### Vitest

- **One assertion per concept** — a test called `"rejects invalid URLs"` should only test URL validation, not title length
- **Use descriptive test names** — `"returns null when project ID does not exist"` is better than `"handles missing ID"`
- **Arrange-Act-Assert pattern** — structure each test in three phases: set up data (Arrange), call the function (Act), check the result (Assert)
- **Don't test implementation details** — test **what** the function returns, not **how** it computes it. If you refactor internals, tests should still pass
- **Keep tests independent** — each test must work in isolation. Use `beforeEach` to reset mocks, never rely on test execution order
- **Test edge cases explicitly** — empty strings, `null`, `undefined`, boundary values (max length, zero, negative numbers), special characters in text fields
- **Use `it.each` for parameterized tests** — when testing the same behavior with different inputs:

```typescript
it.each([
  ["active", true],
  ["archived", true],
  ["in-progress", true],
  ["deleted", false],
  ["", false],
])('validates status "%s" as %s', (status, expected) => {
  const result = ProjectSchema.safeParse({
    title: "Test",
    description: "Test",
    status,
  });
  expect(result.success).toBe(expected);
});
```

### Playwright

- **Test user-visible behavior, not implementation** — assert on what the user sees (`toBeVisible`, `toContainText`), not DOM structure
- **Use auto-waiting** — Playwright automatically waits for elements to be actionable. Don't add manual `page.waitForTimeout()` unless absolutely necessary
- **Keep tests independent** — each test should set up its own state. Don't rely on a previous test having created data
- **Use `test.describe` for grouping** — group related tests (e.g., all project CRUD tests in one describe block)
- **Take screenshots on failure** — Playwright does this automatically in CI. Review them in the HTML report
- **Test the unhappy path** — verify that error messages appear for invalid inputs, that unauthorized users get redirected, that deleting shows a confirmation
- **Avoid testing third-party services** — if your app calls an external API, mock it at the network level with `page.route()` rather than testing the external service

### General

- **Run `pnpm test` before committing** — catch unit test regressions early
- **Run `pnpm test:e2e` before deploying** — catch integration issues before they reach production
- **Don't aim for 100% coverage** — coverage is a metric, not a goal. Focus on testing code where bugs would have real impact
- **Delete tests that provide no value** — a test that passes with any implementation is not testing anything
- **Keep the test suite fast** — if Vitest tests take more than 10 seconds, something is wrong (probably real network calls or missing mocks)

---

## What NOT to Test

This section exists to prevent over-testing, which wastes time and creates maintenance burden without catching real bugs.

| Category | Examples | Why Skip |
| --- | --- | --- |
| **shadcn/ui primitives** | `<Button>`, `<Dialog>`, `<Select>`, `<Input>` | Tested by Radix UI. You're testing the library, not your code. |
| **better-auth configuration** | `lib/auth.ts` config object | Declarative config — nothing to assert. Auth behavior is tested via E2E login flow. |
| **Tailwind CSS output** | Whether a class like `bg-primary` renders the correct color | Visual testing, not logic testing. Use Lighthouse or visual regression tools if needed. |
| **Next.js routing** | Whether `/dashboard/projects` renders `app/(admin)/dashboard/projects/page.tsx` | Framework behavior. Playwright covers this implicitly. |
| **Simple getter functions** | `db.query.projects.findMany()` in a page component | No business logic — just a database read. Covered by Playwright when the page renders correctly. |
| **Async Server Components (unit tests)** | `export default async function Page()` | Not supported by Vitest/Jest in 2026. Use Playwright for RSC pages. |
| **Environment variable loading** | Whether `.env.local` is read correctly | Framework behavior. Tested implicitly when the app starts. |
| **Static layouts and metadata** | `app/layout.tsx`, `metadata` exports | Declarative, no logic. Playwright verifies the page renders. |

---

## Testing Checklist

### Before Implementing a New Feature

- [ ] **Identify which layer** the feature touches (schema, action, UI, page)
- [ ] **Decide the strategy** — TDD for schemas/utils, Test-After for UI/pages
- [ ] **If TDD:** write the first failing test before any implementation code

### Before Every Commit

- [ ] `pnpm test -- --run` passes (all Vitest tests green)
- [ ] No `.only` left in test files (CI will catch this, but check locally too)
- [ ] New Server Actions have corresponding schema validation tests
- [ ] Mocks are cleaned up (no leftover `vi.fn()` that aren't used)

### Before Every Deployment

- [ ] `pnpm test:e2e` passes (all Playwright tests green)
- [ ] E2E tests cover the critical flows (login, CRUD, public page)
- [ ] Accessibility tests pass (axe-core, no WCAG AA violations)
- [ ] Playwright HTML report reviewed for any flaky tests

### One-Time Setup (TODO)

- [ ] Configure `vitest.config.mts` with project-specific `include`/`exclude` patterns
- [ ] Enable `baseURL` in `playwright.config.ts` (currently commented out)
- [ ] Enable `webServer` in `playwright.config.ts` (currently commented out)
- [ ] Add `e2e/.auth/` to `.gitignore`
- [ ] Install `@axe-core/playwright` for accessibility testing
- [ ] Create GitHub Actions workflow (`.github/workflows/test.yml`)
- [ ] Set up test database credentials as GitHub Actions secrets
- [ ] Add `test:run`, `test:e2e`, and `test:e2e:report` scripts to `package.json`
- [ ] Replace the example Playwright test (`e2e/example.spec.ts`) with real project tests
- [ ] Update the `skills:install` script in `package.json` to include vitest and playwright-skill

---

## Documentation Links

- [Vitest Documentation](https://vitest.dev/guide/)
- [Vitest API Reference](https://vitest.dev/api/)
- [Vitest Mocking Guide](https://vitest.dev/guide/mocking)
- [Vitest Coverage](https://vitest.dev/guide/coverage)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Writing Tests](https://playwright.dev/docs/writing-tests)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Locators](https://playwright.dev/docs/locators)
- [Playwright Authentication](https://playwright.dev/docs/auth)
- [Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer)
- [Playwright CI](https://playwright.dev/docs/ci)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [axe-core Playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)
- [Next.js Testing Guide](https://nextjs.org/docs/app/guides/testing)
- [Next.js with Vitest](https://nextjs.org/docs/app/guides/testing/vitest)
- [Next.js with Playwright](https://nextjs.org/docs/app/guides/testing/playwright)
