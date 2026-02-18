# AGENTS-ACCESSIBILITY.md

Accessibility guidelines for the portfolio project. This document covers project-specific patterns using Next.js 16, shadcn/ui, Tailwind CSS 4.1, and Sonner — topics not fully addressed by the installed skills.

**Related skills** (already installed, do not duplicate their content):

- `accessibility` — WCAG 2.1 guidelines, POUR principles, color contrast ratios, ARIA usage, skip links, focus management, keyboard accessibility, motion preferences, testing checklist, screen reader commands
- `wcag-audit-patterns` — WCAG 2.2 audit checklists for every criterion, automated testing with axe-core + Playwright, remediation patterns, CLI audit tools
- `shadcn-ui` — Radix UI primitives provide built-in ARIA compliance for Dialog, Select, DropdownMenu, Tabs, and other interactive components

---

## Next.js Components over HTML

In this project, **always use Next.js components instead of their HTML equivalents**. Next.js components provide built-in optimizations (prefetching, image optimization, font self-hosting, script loading strategies) that improve both performance and accessibility.

| HTML Element | Next.js Component | Import | Why |
| --- | --- | --- | --- |
| `<a>` | `<Link>` | `import Link from "next/link"` | Client-side navigation, prefetching, accessible by default |
| `<form>` | `<Form>` | `import Form from "next/form"` | Prefetches loading UI, progressive enhancement, client-side navigation on submit |
| `<img>` | `<Image>` | `import Image from "next/image"` | Automatic lazy loading, responsive srcset, prevents CLS with required dimensions |
| Manual `<link>` font tags | `next/font` | `import { Geist } from "next/font/google"` | Self-hosted fonts, zero layout shift, no external requests |
| `<script>` | `<Script>` | `import Script from "next/script"` | Loading strategies (`beforeInteractive`, `afterInteractive`, `lazyOnload`), avoids blocking |

### Rules

- **Never use `<a>` for internal links** — always use `<Link>` from `next/link`. It renders an `<a>` under the hood with prefetching and client-side navigation.
- **Never use `<form>` for navigation forms** — use `<Form>` from `next/form` for forms that update URL search params (e.g., search). For Server Action mutations, a regular `<form>` with the `action` prop pointing to a Server Action is fine.
- **Never use `<img>`** — always use `<Image>` from `next/image`. It requires `alt`, `width`, and `height` (or `fill`), which prevents layout shift and enforces alt text.
- **Never load fonts via `<link>` tags or external CSS** — use `next/font` which self-hosts fonts at build time, eliminating FOUT and layout shift.
- **Never use inline `<script>` tags** — use `<Script>` from `next/script` with the appropriate `strategy` prop.

### Example: Internal Link

```typescript
// WRONG
<a href="/dashboard/projects">Projects</a>

// CORRECT
import Link from "next/link";
<Link href="/dashboard/projects">Projects</Link>
```

### Example: Search Form with Next.js Form

```typescript
import Form from "next/form";

export function SearchForm() {
  return (
    <Form action="/search">
      <label htmlFor="search-input" className="sr-only">Search</label>
      <input
        id="search-input"
        name="query"
        type="search"
        placeholder="Search projects..."
        className="w-full px-3 py-2 border rounded-md"
      />
      <button type="submit">Search</button>
    </Form>
  );
}
```

---

## Semantic Layout Structure

The public portfolio page must use semantic HTML landmarks so assistive technologies can navigate the page by region. Place landmarks in the `(public)/layout.tsx` file.

### Layout Template

```typescript
// app/(public)/layout.tsx
import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SkipLink />
      <header>
        <nav aria-label="Main navigation">
          {/* Navigation links using <Link> */}
        </nav>
      </header>

      <main id="main-content" tabIndex={-1}>
        {children}
      </main>

      <footer>
        <nav aria-label="Social links">
          {/* Social links */}
        </nav>
        <p>&copy; {new Date().getFullYear()} Gonzalo Pozo. All rights reserved.</p>
      </footer>
    </>
  );
}
```

### Landmark Rules

- Every page must have exactly **one `<main>`** element
- Use `<header>` for the site banner (logo, primary navigation)
- Use `<footer>` for the site footer (social links, copyright)
- Use `<nav>` for navigation groups — add `aria-label` when there are multiple `<nav>` elements on the same page (e.g., `"Main navigation"`, `"Social links"`)
- Use `<section>` with `aria-labelledby` pointing to a heading for major content sections (projects, experiences, skills)
- The admin dashboard uses shadcn `Sidebar` which handles its own landmarks via Radix

### Section Example (Public Page)

```typescript
<section aria-labelledby="projects-heading">
  <h2 id="projects-heading">Projects</h2>
  {/* Project cards */}
</section>

<section aria-labelledby="experience-heading">
  <h2 id="experience-heading">Experience</h2>
  {/* Experience cards */}
</section>
```

---

## Skip Link

A skip link lets keyboard users bypass the navigation and jump directly to the main content. Required for WCAG 2.4.1 (Bypass Blocks).

### Implementation

Create a reusable component using Tailwind's `sr-only` utility:

```typescript
// components/skip-link.tsx
import Link from "next/link";

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      Skip to main content
    </a>
  );
}
```

### Usage

Place `<SkipLink />` as the **first child** inside `<body>` in the root layout (or as the first child in the public layout). The `<main>` element must have `id="main-content"` and `tabIndex={-1}` so it can receive focus programmatically.

```typescript
// app/(public)/layout.tsx or app/layout.tsx
<body>
  <SkipLink />
  <header>...</header>
  <main id="main-content" tabIndex={-1}>
    {children}
  </main>
  <footer>...</footer>
</body>
```

---

## shadcn Component Accessibility Notes

shadcn/ui components are built on Radix UI, which provides excellent baseline accessibility. However, there are patterns where you must add extra attributes manually.

### Button — Icon Buttons Need `aria-label`

When a button contains only an icon (no visible text), you must provide an `aria-label`. The icon itself should have `aria-hidden="true"` to avoid duplicate announcements.

```typescript
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

// WRONG — no accessible name
<Button variant="ghost" size="icon">
  <Trash2 className="h-4 w-4" />
</Button>

// CORRECT
<Button variant="ghost" size="icon" aria-label="Delete project">
  <Trash2 className="h-4 w-4" aria-hidden="true" />
</Button>
```

### Dialog — Focus Trap and Restoration

shadcn `Dialog` (built on Radix `Dialog`) automatically:
- Traps focus inside the dialog when open
- Returns focus to the trigger element when closed
- Closes on `Escape` key

**You do not need to implement focus trapping manually.** Just use the component as documented:

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger asChild>
    <Button>Edit Project</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Project</DialogTitle>
      <DialogDescription>
        Make changes to your project details.
      </DialogDescription>
    </DialogHeader>
    {/* Form content */}
  </DialogContent>
</Dialog>
```

**Important**: Always include `DialogTitle` and `DialogDescription` — Radix uses these for `aria-labelledby` and `aria-describedby` on the dialog. If you want to visually hide the description, use the `sr-only` class.

### Table — Add `scope` and `caption`

The shadcn `Table` component renders semantic `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, and `<td>` elements. For screen readers to properly associate headers with data cells, add `scope` attributes and a `<caption>`:

```typescript
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

<Table>
  <TableCaption>Portfolio projects managed from the dashboard</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Title</TableHead>
      <TableHead scope="col">Status</TableHead>
      <TableHead scope="col">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {projects.map((project) => (
      <TableRow key={project.id}>
        <TableCell>{project.title}</TableCell>
        <TableCell>{project.status}</TableCell>
        <TableCell>
          <Button variant="ghost" size="icon" aria-label={`Edit ${project.title}`}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Select, DropdownMenu, Tabs

These shadcn components (Radix-based) handle keyboard navigation, focus management, and ARIA attributes automatically. No manual ARIA is needed. Just make sure:

- `Select` has a visible label (via `<Label>` component or `aria-label`)
- `DropdownMenu` trigger has a descriptive accessible name
- `Tabs` content is associated via Radix's built-in `aria-controls` / `aria-labelledby`

---

## Accessible Forms in This Project

Forms in the admin dashboard use shadcn form components with validation. Follow these patterns for accessibility.

### Form Field Pattern

Every form field must have:
1. A visible `<Label>` associated with the input
2. Error messages linked via `aria-describedby`
3. `aria-invalid="true"` when the field has an error
4. `aria-required="true"` for required fields

shadcn's `Form` + `FormField` + `FormLabel` + `FormMessage` components handle most of this automatically when using React Hook Form:

```typescript
<FormField
  control={form.control}
  name="title"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Project Title</FormLabel>
      <FormControl>
        <Input placeholder="My Project" {...field} aria-required="true" />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

`FormMessage` automatically renders with the correct `id` and the `FormControl` input automatically gets `aria-describedby` pointing to the error message and `aria-invalid` when there is an error.

### Required Field Indication

Always indicate required fields visually and programmatically:

```typescript
<FormLabel>
  Project Title <span aria-label="required" className="text-destructive">*</span>
</FormLabel>
```

---

## Sonner Toasts as ARIA Live Regions

Sonner (`<Toaster>`) is used in this project for toast notifications. Sonner **automatically handles ARIA live regions** — each toast is announced to screen readers via `role="status"` and `aria-live="polite"` under the hood.

### What You Get for Free

- Success/info toasts use `aria-live="polite"` (non-interrupting)
- Error toasts use `role="alert"` (interrupting, announced immediately)
- Toasts are keyboard-dismissible

### Usage in Server Actions

When calling `toast()` from client components after a Server Action:

```typescript
"use client";

import { toast } from "sonner";

function handleDelete() {
  deleteProject(id).then(() => {
    toast.success("Project deleted successfully");
  }).catch(() => {
    toast.error("Failed to delete project. Please try again.");
  });
}
```

### Rules

- **Always provide descriptive toast messages** — screen reader users cannot see the toast icon color, so the message text must convey success/failure on its own
- **Never use toasts as the only error feedback** — for form validation errors, show inline error messages next to the field (via `FormMessage`). Toasts are supplementary
- **Keep toast messages concise** — 1-2 sentences maximum

---

## Accessible Images in This Project

Always use `next/image` which enforces the `alt` prop at the TypeScript level.

### Alt Text Strategy

| Image Type | Alt Text | Example |
| --- | --- | --- |
| Project screenshot | Describe what the project looks like | `alt="Dashboard view of the task management app showing a Kanban board with three columns"` |
| Company logo | Company name | `alt="Vercel logo"` |
| Decorative divider/background | Empty alt + `aria-hidden` | `alt="" aria-hidden="true"` |
| Profile photo | Your name and context | `alt="Gonzalo Pozo, Full Stack Developer"` |
| Icon used as image | What it represents | `alt="GitHub repository"` |

### Example: Project Card Image

```typescript
import Image from "next/image";

<Image
  src={project.imageUrl}
  alt={`Screenshot of ${project.title}: ${project.description}`}
  width={600}
  height={400}
  className="rounded-lg"
/>
```

### Rules

- **Never leave `alt` empty for informative images** — TypeScript will enforce the prop exists, but you must provide meaningful text
- **Use empty `alt=""` for decorative images** — and add `aria-hidden="true"`
- **For complex images** (charts, infographics), use `<figure>` with `<figcaption>` providing the full description, and `aria-describedby` linking the image to the caption

---

## Motion Preferences

This project uses `tw-animate-css` for Tailwind animations. Users who experience vestibular disorders can trigger `prefers-reduced-motion` in their OS settings. Respect this preference.

### CSS to Add in `globals.css`

Add the following to `app/globals.css` to disable animations and transitions for users who prefer reduced motion:

```css
/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Smooth scroll only for users who are okay with motion */
@media (prefers-reduced-motion: no-preference) {
  html {
    scroll-behavior: smooth;
  }
}
```

### High Contrast Mode

Optionally support users who enable high contrast mode:

```css
@media (forced-colors: active) {
  /* Forced colors mode (Windows High Contrast) */
  /* Borders and outlines become visible automatically */
  /* Ensure focus indicators use outline (not box-shadow) */
  :focus-visible {
    outline: 2px solid CanvasText;
    outline-offset: 2px;
  }
}
```

---

## Color Contrast

This project uses CSS custom properties for all colors (defined in `globals.css`). The shadcn default theme provides good contrast ratios, but verify when customizing.

### Thresholds (WCAG AA)

| Element | Minimum Ratio |
| --- | --- |
| Normal text (< 18px or < 14px bold) | 4.5:1 |
| Large text (≥ 18px or ≥ 14px bold) | 3:1 |
| UI components (borders, icons, focus rings) | 3:1 |

### Focus Indicators

The project uses Tailwind's `outline-ring/50` as the default outline. Ensure focus indicators are always visible:

```css
/* Already in globals.css via Tailwind base layer */
* {
  @apply border-border outline-ring/50;
}

/* For custom focus styles, always use :focus-visible */
:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

### Rules

- **Never use `outline: none` without a replacement** — keyboard users need visible focus indicators
- **The `muted-foreground` color** (`#71717a` on white / `#a1a1aa` on dark) is used for secondary text. Verify it meets 4.5:1 against the background when customizing the theme
- **Destructive actions** (delete buttons) use `--destructive` (`#ef4444`). Ensure the red is not the only indicator — always include text like "Delete" alongside the color
- **Use the WebAIM Contrast Checker** or browser DevTools to verify contrast when changing theme colors

---

## Responsive Accessibility

The public portfolio page must be fully accessible on mobile devices. Responsive design is not just about layout — interactive elements must remain usable.

### Mobile Navigation

When implementing a hamburger menu for mobile, ensure:

```typescript
"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav aria-label="Main navigation">
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        className="md:hidden"
      >
        {isOpen ? (
          <X className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Menu className="h-5 w-5" aria-hidden="true" />
        )}
      </Button>

      {/* Desktop navigation */}
      <ul className="hidden md:flex gap-4">
        <li><Link href="/#projects">Projects</Link></li>
        <li><Link href="/#experience">Experience</Link></li>
        <li><Link href="/#skills">Skills</Link></li>
      </ul>

      {/* Mobile navigation */}
      {isOpen && (
        <ul id="mobile-menu" className="md:hidden">
          <li><Link href="/#projects" onClick={() => setIsOpen(false)}>Projects</Link></li>
          <li><Link href="/#experience" onClick={() => setIsOpen(false)}>Experience</Link></li>
          <li><Link href="/#skills" onClick={() => setIsOpen(false)}>Skills</Link></li>
        </ul>
      )}
    </nav>
  );
}
```

### Key Attributes

- `aria-expanded` on the toggle button communicates open/closed state
- `aria-controls` links the button to the menu it controls
- `aria-label` changes based on state ("Open menu" / "Close menu")
- Icons have `aria-hidden="true"` since the button already has an `aria-label`

### Reflow (WCAG 1.4.10)

Content must be usable at 320px viewport width (equivalent to 400% zoom on 1280px desktop):

- No horizontal scrolling for text content
- Touch targets are at least 44x44px (WCAG 2.5.8)
- All content remains accessible — nothing is hidden or cut off

---

## `lang` Attribute

The root layout already sets `lang="en"` on the `<html>` element. This is required for screen readers to use the correct pronunciation.

```typescript
// app/layout.tsx — already in place
<html lang="en">
```

If content in other languages is added in the future, mark those specific elements:

```typescript
<p>Mi nombre es <span lang="es">Gonzalo Pozo</span>.</p>
```

---

## Route Announcements

Next.js includes a **built-in route announcer** that automatically announces page changes to screen readers during client-side navigation via `<Link>`. When a user navigates between pages, Next.js looks for the page name in this order:

1. `document.title` (the `<title>` tag, set via the `metadata` export or `generateMetadata`)
2. The `<h1>` element on the page
3. The URL pathname as a fallback

### What This Means for This Project

- **Every page must have a unique, descriptive title** — this is already handled by the `metadata` export in each page or layout. The SEO metadata template in [AGENTS-SEO.md](./AGENTS-SEO.md) uses a `title.template` of `"%s | Gonzalo Pozo"` which produces titles like "Projects | Gonzalo Pozo"
- **Every page must have an `<h1>`** — this is a fallback if the title is not set. The heading hierarchy section below covers this
- **Use `<Link>` for all internal navigation** — the route announcer only works with Next.js client-side transitions, not plain `<a>` tags

You do not need to build a custom route announcer. Next.js handles this automatically. Just ensure your titles and headings are correct.

---

## Heading Hierarchy

Every page must follow a logical heading hierarchy. Screen reader users navigate by headings to understand page structure.

### Public Page

```
h1: "Gonzalo Pozo" (or site title — one per page)
  h2: "Projects"
    h3: Project titles
  h2: "Experience"
    h3: Role @ Company
  h2: "Skills"
  h2: "Contact" / "Social Links"
```

### Admin Dashboard Pages

```
h1: Page title ("Projects", "Experiences", "Skills", etc.)
  h2: Section headings if needed
```

### Rules

- **Exactly one `<h1>` per page** — represents the page topic
- **Never skip heading levels** — don't jump from `<h1>` to `<h3>`
- **Headings must describe the content below them** — not be decorative
- shadcn `DialogTitle` renders as an `<h2>` by default inside dialogs — this is correct and accessible

---

## ESLint Accessibility Linting

Next.js includes `eslint-plugin-jsx-a11y` by default as part of its ESLint configuration. This catches common accessibility issues at development time, including:

- Invalid or misspelled `aria-*` attributes
- Incorrect `aria-*` attribute value types
- ARIA attributes on elements that don't support them
- Missing required ARIA props for roles (e.g., a `role="checkbox"` without `aria-checked`)
- ARIA props that conflict with the element's role

### Usage

Run the linter to catch accessibility issues early:

```bash
pnpm lint
```

This will surface warnings like:

- `img` elements must have an `alt` prop
- `aria-*` props must be valid
- Elements with ARIA roles must have all required attributes

### Rules

- **Run `pnpm lint` before every commit** — it catches a11y issues that automated testing might miss at build time
- **Do not disable jsx-a11y rules** — if a rule flags something, fix the underlying issue rather than suppressing the warning
- **ESLint catches ~30% of a11y issues** — it is a first line of defense, not a replacement for manual testing and Lighthouse audits

---

## Pre-Production Accessibility Audit

### Lighthouse

Run Lighthouse before every production deployment:

```bash
pnpm build
pnpm start

# In Chrome Incognito:
# DevTools → Lighthouse → Select "Accessibility"
# Click "Analyze page load"
```

**Target score: ≥ 90** for the public portfolio page.

### Manual Testing Checklist

- [ ] **Keyboard-only navigation**: Tab through the entire public page. Every interactive element is reachable and activatable with Enter/Space
- [ ] **Skip link**: Tab once on the page — "Skip to main content" link appears and works
- [ ] **Focus visible**: Every focused element has a visible outline/ring
- [ ] **Screen reader**: Test the public page with VoiceOver (Mac: Cmd+F5) — headings, landmarks, links, and images are announced correctly
- [ ] **Zoom**: Content usable at 200% and 400% browser zoom without horizontal scrolling
- [ ] **Reduced motion**: Enable "Reduce motion" in OS settings — no animations play
- [ ] **Color contrast**: No text falls below 4.5:1 contrast ratio (check with DevTools)
- [ ] **Alt text**: Every `<Image>` on the public page has meaningful alt text (or `alt=""` for decorative)
- [ ] **Form labels**: Every input in the admin dashboard has a visible label
- [ ] **Error messages**: Form errors are announced to screen readers and linked to their fields
- [ ] **Dialog accessibility**: Dialogs trap focus, close on Escape, and return focus to the trigger

### Automated Testing (Future)

When tests are set up, integrate axe-core for automated accessibility checks:

```typescript
// tests/accessibility.test.ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("public page has no accessibility violations", async ({ page }) => {
  await page.goto("/");

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();

  expect(results.violations).toEqual([]);
});
```

---

## Documentation Links

- [WCAG 2.2 Guidelines](https://www.w3.org/TR/WCAG22/)
- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Next.js Accessibility](https://nextjs.org/docs/app/guides/accessibility)
- [Next.js Link Component](https://nextjs.org/docs/app/api-reference/components/link)
- [Next.js Form Component](https://nextjs.org/docs/app/api-reference/components/form)
- [Next.js Image Component](https://nextjs.org/docs/app/api-reference/components/image)
- [Next.js Font Module](https://nextjs.org/docs/app/api-reference/components/font)
- [Next.js Script Component](https://nextjs.org/docs/app/api-reference/components/script)
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe-core](https://github.com/dequelabs/axe-core)
