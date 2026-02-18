# AGENTS-TESTING-REFERENCE.md

Full implementation templates extracted from [AGENTS-TESTING.md](./AGENTS-TESTING.md). Read this file when you need the complete mock code, CI workflow, or auth setup — the main file has the rules and decision guidance.

---

## Mocking Code Blocks

### Mocking Drizzle (Database)

Mock the entire `@/db` module to avoid needing a real database in unit tests:

```typescript
// tests/actions/projects.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

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

### Mocking better-auth Sessions

```typescript
vi.mock("@/lib/server-session", () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from "@/lib/server-session";

// Authenticated user
it("creates project when authenticated", async () => {
  vi.mocked(getServerSession).mockResolvedValue({
    user: { id: "1", name: "Admin", email: "admin@example.com" },
    session: { id: "session-1", userId: "1" },
  });
  // ... test the Server Action
});

// Unauthenticated user
it("redirects to login when unauthenticated", async () => {
  vi.mocked(getServerSession).mockResolvedValue(null);
  // ... test the Server Action, expect redirect to /login
});
```

### Mocking Next.js Functions

```typescript
// redirect() throws in the real runtime — simulate that
vi.mock("next/navigation", () => ({
  redirect: vi.fn().mockImplementation((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
```

**Testing redirect behavior:**

```typescript
it("redirects to /dashboard/projects after creating", async () => {
  const { redirect } = await import("next/navigation");

  await expect(createProject(formData)).rejects.toThrow("REDIRECT:/dashboard/projects");
  expect(redirect).toHaveBeenCalledWith("/dashboard/projects");
});
```

### Mocking FormData

Server Actions receive `FormData` objects. Create them manually in tests:

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

// Usage
const formData = createFormData({
  title: "My Project",
  description: "A description",
  status: "active",
  skillIds: ["1", "3", "5"],
});
```

---

## Example Test Files

### Vitest — Zod Schema Test

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
});
```

### Playwright — E2E Test

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

## Playwright Auth Setup

### Auth Setup File

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

### Playwright Config for Auth

Add to `playwright.config.ts`:

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

---

## Page Object Pattern (Full Example)

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

---

## Accessibility Testing with Playwright

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

- Run accessibility tests on all public-facing pages — at minimum public page and login
- Use `wcag22aa` tag — WCAG 2.2 Level AA is the standard compliance target
- axe-core catches ~57% of WCAG issues — not a replacement for manual testing
- Fix violations, don't suppress them

---

## CI GitHub Actions Workflow

Create `.github/workflows/test.yml`:

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

- **Unit tests don't need env vars** — all external dependencies are mocked
- **E2E tests need a real database** — use a separate test database or Turso test branch
- **Playwright report uploaded as artifact** — download after failed runs to inspect traces
- **`--frozen-lockfile`** ensures exact dependency versions from `pnpm-lock.yaml`
- **Never use production database credentials in CI** — create a separate Turso database for testing

### Environment Variables for CI

| Secret | Purpose |
| --- | --- |
| `TURSO_DATABASE_URL` | Test database URL (separate from production) |
| `TURSO_AUTH_TOKEN` | Auth token for test database |
| `BETTER_AUTH_SECRET` | Any secret string (can differ from production) |
