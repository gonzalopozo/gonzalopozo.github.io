# AGENTS-TESTING.md

Testing strategy, conventions, and project-specific patterns for a Next.js 16 application tested with Vitest (unit) and Playwright (E2E).

> Full mock code blocks, CI workflow YAML, and auth setup: [AGENTS-TESTING-REFERENCE.md](./AGENTS-TESTING-REFERENCE.md)

**Related skills** (already installed — do not duplicate their content):

- `vitest` — Core API (`test`, `describe`, `expect`), CLI, hooks, mocking (`vi.mock`, `vi.spyOn`, `vi.fn`), snapshots, coverage, concurrency, environments, type testing
- `playwright-skill` — Browser automation, locators, assertions, screenshots, responsive testing, login flows, form interactions, CI patterns

**Related coverage in other AGENTS files (do not duplicate):**

- `AGENTS-SECURITY.md` — 4-step authenticate/validate/execute/revalidate pattern that tests must verify
- `AGENTS-ACCESSIBILITY.md` — Manual a11y testing checklist

---

## Testing Philosophy

### TDD Where It Hurts

Use TDD (test first) where bugs have real impact and the feedback loop is fast. Use Test-After for framework-coupled or UI-heavy code.

| Code Layer | Strategy | Tool |
| --- | --- | --- |
| Zod validation schemas | **TDD** (test first) | Vitest |
| Utility functions (`lib/utils.ts`) | **TDD** (test first) | Vitest |
| Server Action logic | **TDD for validation, Test-After for DB** | Vitest |
| Junction table sync logic | **Test-After** | Vitest |
| Client Components with custom logic | **Test-After** (optional) | Vitest + RTL |
| Pages, layouts, route flows | **Test-After** | Playwright |
| Auth flows (login, protected routes) | **Test-After** | Playwright |
| Public page rendering | **Test-After** | Playwright |

**TDD cycle**: Red (failing test) → Green (minimum code to pass) → Refactor (clean up, tests stay green) → Repeat.

### When NOT to Write Tests

- **shadcn/ui primitives** — already tested by Radix UI upstream
- **better-auth configuration** — declarative config, not testable logic
- **Tailwind CSS classes** — visual output, not unit-testable
- **Next.js framework behavior** (routing, layouts, streaming) — tested by the Next.js team
- **Simple data fetching pages** with no business logic — covered by E2E naturally
- **React Server Components with unit tests** — async RSCs not supported by any unit testing tool; use Playwright

---

## Tool Setup

### Vitest

**Config file**: `vitest.config.mts` — already in the repo.

Project-specific settings:
- `environment: 'jsdom'` — simulates DOM for component tests (override per-file with `// @vitest-environment node`)
- `plugins: [tsconfigPaths()]` — resolves `@/*` path alias
- `include: ['tests/**/*.test.{ts,tsx}']` — only `tests/` directory
- `exclude: ['e2e/**']` — keeps Playwright tests separate
- `globals: false` — explicit imports required
- `css: false` — skips Tailwind processing in tests

### Playwright

**Config file**: `playwright.config.ts` — already in the repo.

Project-specific settings:
- `testDir: './e2e'` — all E2E tests in `e2e/`
- `baseURL: 'http://localhost:3000'` — enables `page.goto('/')`
- `webServer: { command: 'pnpm dev' }` — auto-starts dev server
- `trace: 'on-first-retry'` — captures traces for debugging CI failures
- `forbidOnly: !!process.env.CI` — fails CI if `.only` is left in

---

## Test File Location & Naming

```
tests/                         # Vitest unit & component tests
├── schemas/                   # Zod schema validation tests
│   ├── project.test.ts
│   ├── experience.test.ts
│   ├── skill.test.ts
│   ├── social-link.test.ts
│   └── settings.test.ts
├── actions/                   # Server Action logic tests
│   └── projects.test.ts       # (one per entity)
├── utils/
│   └── utils.test.ts
└── components/                # Client component tests (optional)

e2e/                           # Playwright E2E tests
├── auth.spec.ts               # Login, logout, protected route redirects
├── projects.spec.ts           # CRUD flows
├── public-page.spec.ts        # Public portfolio rendering
└── accessibility.spec.ts      # axe-core automated checks
```

### Naming Rules

| Convention | Vitest | Playwright |
| --- | --- | --- |
| Extension | `.test.ts` / `.test.tsx` | `.spec.ts` |
| Directory | `tests/` | `e2e/` |
| File names | Mirror source (`projects.test.ts` → `lib/actions/projects.ts`) | Named by flow (`auth.spec.ts`) |
| Test names | Behavior: `"rejects empty title"` | User action: `"should create a new project"` |

---

## Mocking Strategy

> Full mock code blocks with complete implementations: [AGENTS-TESTING-REFERENCE.md](./AGENTS-TESTING-REFERENCE.md#mocking-code-blocks)

### Summary

| Dependency | Mock Target | Pattern |
| --- | --- | --- |
| Database (Turso/Drizzle) | `@/db` | `vi.mock("@/db", () => ({ db: { insert: vi.fn()... } }))` |
| Authentication | `@/lib/server-session` | `vi.mock(...)` then `vi.mocked(getServerSession).mockResolvedValue(...)` |
| `redirect()` | `next/navigation` | Mock to throw `Error("REDIRECT:/path")` — mirrors Next.js behavior |
| `revalidatePath()` | `next/cache` | `vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))` |
| `headers()` / `cookies()` | `next/headers` | `vi.mock("next/headers", ...)` |
| `FormData` | Manual creation | Helper: `createFormData(record)` — see reference file |

### Rules

- **Mock at the module level** (`vi.mock(...)`) — Vitest hoists these calls automatically
- **Use `vi.mocked()` for type-safe mock access** — gives TypeScript autocompletion
- **Reset mocks between tests** — `beforeEach(() => { vi.clearAllMocks(); })`
- **Don't mock what you're testing** — test the schema? Don't mock Zod. Test the action? Mock the DB, not the action
- **Prefer shallow mocks** — only mock what the specific test needs

---

## What to Test Per Entity

### Vitest (Unit Tests)

| What to Test | Example |
| --- | --- |
| Schema accepts valid data | All required fields present, correct types |
| Schema rejects missing required fields | Empty title, empty description |
| Schema rejects invalid values | Status `"deleted"` (not in enum), title over 200 chars |
| Schema handles optional fields | Empty URL allowed, invalid URL rejected |
| Schema `.or(z.literal(""))` for optional URLs | Empty string passes, `"not-a-url"` fails |
| Action authenticates before executing | Returns redirect when session is null |
| Action validates input before DB call | Invalid data never reaches `db.insert()` |
| Action calls correct Drizzle operations | `db.insert()` called with validated data |
| Action revalidates/redirects correctly | `redirect()` or `revalidatePath()` called |
| Junction table sync adds/removes skills | New skills inserted, removed skills deleted, unchanged ignored |

### Playwright (E2E Tests)

| What to Test | Example |
| --- | --- |
| Login flow | Credentials → redirect to dashboard |
| Auth protection | `/dashboard` without session → redirect to `/login` |
| Create entity | Fill form → submit → entity in list |
| Edit entity | Click edit → modify → save → changes visible |
| Delete entity | Click delete → confirm → removed from list |
| Validation errors | Submit empty form → error messages visible |
| Public page renders | Visit `/` → all sections visible |
| Accessibility (axe-core) | No WCAG 2.2 AA violations |

---

## Playwright E2E Patterns

### Authentication Setup

Log in once and reuse the session across tests via Playwright's storage state. See [AGENTS-TESTING-REFERENCE.md](./AGENTS-TESTING-REFERENCE.md#playwright-auth-setup) for full auth setup code and project config.

Key points:
- `e2e/auth.setup.ts` logs in and saves cookies to `e2e/.auth/user.json`
- Add `e2e/.auth/` to `.gitignore`
- Authenticated projects depend on the setup project

### Locator Priority

1. `getByRole` (best — matches accessibility tree)
2. `getByLabel` (form inputs)
3. `getByText` (visible text)
4. `getByTestId` (last resort — add `data-testid` only when no accessible locator works)
5. CSS selectors (avoid — fragile)

### Page Object Pattern

Use sparingly for pages with many repeated interactions:

```typescript
// e2e/pages/projects-page.ts
export class ProjectsPage {
  constructor(private page: Page) {}
  async goto() { await this.page.goto("/dashboard/projects"); }
  async createProject(data: { title: string }) { /* fill + submit */ }
  async expectProjectVisible(title: string) { /* assert */ }
}
```

---

## Good Practices

### Vitest

- **One assertion per concept** — `"rejects invalid URLs"` tests only URL validation
- **Arrange-Act-Assert** — set up data, call function, check result
- **Test edge cases** — empty strings, `null`, boundary values, special characters
- **Use `it.each` for parameterized tests** — same behavior, different inputs
- **Keep tests independent** — `beforeEach` to reset, never rely on execution order

### Playwright

- **Test user-visible behavior** — `toBeVisible`, `toContainText`, not DOM structure
- **Use auto-waiting** — don't add `page.waitForTimeout()` unless absolutely necessary
- **Test the unhappy path** — error messages, unauthorized redirects, delete confirmations

### General

- **Run `pnpm test` before committing**
- **Run `pnpm test:e2e` before deploying**
- **Don't aim for 100% coverage** — focus on code where bugs have real impact
- **Keep Vitest suite under 10 seconds** — if slower, check for real network calls or missing mocks

---

## Setup Checklist (TODO)

- [ ] Add `e2e/.auth/` to `.gitignore`
- [ ] Install `@axe-core/playwright` for accessibility testing
- [ ] Create GitHub Actions workflow — see [AGENTS-TESTING-REFERENCE.md](./AGENTS-TESTING-REFERENCE.md#ci-github-actions-workflow)
- [ ] Set up test database credentials as GitHub Actions secrets
- [ ] Replace `e2e/example.spec.ts` with real project tests
