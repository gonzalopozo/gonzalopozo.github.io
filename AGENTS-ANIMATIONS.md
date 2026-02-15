# AGENTS-ANIMATIONS.md

Animation guidelines for the portfolio project. This document covers when and how to use the three animation layers available in this project: Tailwind CSS utilities, Motion (Framer Motion), and NumberFlow.

**Animation libraries in this project:**

- `tw-animate-css` — Tailwind-compatible animation utilities used by shadcn/ui components (fadeIn, slideIn, etc.)
- `motion` (v12+) — Production-grade React animation library for layout animations, gestures, exit animations, and complex orchestration
- `@number-flow/react` — Animated number component for counters, statistics, and progress indicators

**Related coverage (do not duplicate):**

- `AGENTS-ACCESSIBILITY.md` > Motion Preferences — `prefers-reduced-motion` CSS, `forced-colors` support
- `AGENTS-PERFORMANCE.md` > Dynamic Imports — use `next/dynamic` for heavy components (applies to Motion if only used on specific pages)
- `frontend-design` skill — general motion design philosophy ("high-impact moments", "staggered reveals")

---

## When to Use Each Layer

Choose the lightest tool that achieves the desired effect. Heavier libraries add bundle size.

| Situation | Use | Why |
| --- | --- | --- |
| Loading spinners, skeleton pulses, simple hover effects | **Tailwind CSS** (`animate-*`, `transition-*`) | Zero JS, no bundle cost, GPU-accelerated |
| Fade/slide transitions on shadcn components (Dialog, Sheet, DropdownMenu) | **tw-animate-css** (already built into shadcn) | Pre-configured, consistent with design system |
| Icon state changes (like → check, heart toggle) | **Motion** (`AnimatePresence`, `motion.div`) | Needs enter/exit animations that CSS can't do cleanly |
| Layout animations (list reorder, item add/remove) | **Motion** (`layout` prop, `AnimatePresence`) | CSS cannot animate layout changes with FLIP |
| Animated number counters, dashboard statistics | **NumberFlow** (`<NumberFlow>`) | Purpose-built for number transitions, accessible, dependency-free |
| Page transitions between routes | **Motion** (`AnimatePresence`) or CSS View Transitions | Depends on complexity — prefer CSS View Transitions for simple fades |
| Scroll-triggered animations | **Motion** (`useInView`, `useScroll`) or Tailwind `motion-safe:` | Motion for complex orchestration, Tailwind for simple appear-on-scroll |

### Rules

- **Default to Tailwind CSS** for transitions and simple animations — no JS overhead
- **Use Motion only in Client Components** — it requires `"use client"` since it uses hooks and event handlers
- **Use NumberFlow only for numeric values** — don't try to use it for text or non-numeric content
- **Never install GSAP, anime.js, or other animation libraries** — Motion covers all interactive animation needs in this project

---

## Tailwind CSS Animations

Tailwind CSS 4.1 provides built-in animation utilities. The project also uses `tw-animate-css` for additional animations used by shadcn/ui.

### Built-in Utilities

| Utility | What It Does | Common Use |
| --- | --- | --- |
| `animate-spin` | Continuous 360deg rotation | Loading spinners |
| `animate-ping` | Scale up + fade out (radar pulse) | Notification badges |
| `animate-pulse` | Gentle opacity fade in/out | Skeleton loaders |
| `animate-bounce` | Bounce up and down | Scroll-down indicators |
| `animate-none` | Remove all animations | Disable animation conditionally |

### Transition Utilities

For hover effects, focus states, and state changes, use Tailwind's transition utilities instead of custom CSS:

```typescript
// Smooth hover lift effect
<div className="transition-transform duration-200 ease-out hover:-translate-y-0.5">
  {/* Card content */}
</div>

// Color transition on hover
<button className="transition-colors duration-150 ease-in-out hover:bg-primary/90">
  Click me
</button>

// Scale on press
<button className="transition-transform duration-100 active:scale-95">
  Press me
</button>
```

### Reduced Motion Support

Tailwind provides `motion-safe:` and `motion-reduce:` variants to respect user preferences:

```typescript
// Only animate for users who are okay with motion
<svg className="motion-safe:animate-spin h-5 w-5" />

// Show static alternative for reduced motion users
<div className="motion-safe:animate-pulse motion-reduce:opacity-70">
  Loading...
</div>
```

### Custom Animations with `@theme`

If you need a custom animation not provided by Tailwind or tw-animate-css, define it in `globals.css` using the `@theme` directive:

```css
@theme {
  --animate-wiggle: wiggle 0.3s ease-in-out;

  @keyframes wiggle {
    0%, 100% { transform: rotate(-3deg); }
    50% { transform: rotate(3deg); }
  }
}
```

Then use it as `animate-wiggle` in your markup. Prefer this over inline `animate-[...]` for animations used more than once.

---

## Motion (Framer Motion)

Motion is the primary library for interactive animations that CSS cannot handle: enter/exit animations, layout animations, gesture animations, and complex orchestration.

### Import Convention

Always import from `motion/react` (not `framer-motion` — the package was renamed):

```typescript
"use client";

import { motion, AnimatePresence } from "motion/react";
```

### Basic Animation

The `motion` component wraps any HTML element and accepts animation props:

```typescript
"use client";

import { motion } from "motion/react";

export function FadeIn({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

### Icon Animations

Use Motion for icon state transitions (copy/check, like/unlike, open/close). These require `AnimatePresence` for exit animations:

```typescript
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyButton({ text }: { text: string }) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleCopy} aria-label="Copy to clipboard">
      <AnimatePresence mode="wait" initial={false}>
        {isCopied ? (
          <motion.div
            key="check"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
}
```

### Layout Animations

Use the `layout` prop to automatically animate an element when its size or position changes in the DOM. Combined with `AnimatePresence`, this handles add/remove animations in lists:

```typescript
"use client";

import { motion, AnimatePresence } from "motion/react";

interface Item {
  id: number;
  title: string;
}

export function AnimatedList({ items, onRemove }: { items: Item[]; onRemove: (id: number) => void }) {
  return (
    <motion.ul layout className="space-y-2">
      <AnimatePresence>
        {items.map((item) => (
          <motion.li
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="p-4 bg-muted rounded-lg"
          >
            {item.title}
            <button onClick={() => onRemove(item.id)}>Remove</button>
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  );
}
```

### Key Motion Concepts

| Concept | What It Does | When to Use |
| --- | --- | --- |
| `initial` | Starting state when component mounts | Entrance animations |
| `animate` | Target state to animate to | Every animation |
| `exit` | State to animate to before unmounting | Requires `AnimatePresence` wrapper |
| `transition` | Duration, easing, delay, spring config | Fine-tune any animation |
| `layout` | Animate layout changes via FLIP | List reorder, size changes, grid rearrangement |
| `layoutId` | Shared element transition between components | Tab underlines, card-to-modal transitions |
| `AnimatePresence` | Keeps children in DOM until exit animation completes | Any component that mounts/unmounts |
| `whileHover` / `whileTap` | Animate on hover or press | Interactive elements, buttons |
| `useInView` | Detect when element enters viewport | Scroll-triggered animations |
| `useScroll` | Track scroll progress | Parallax, progress indicators |

### Motion with Server Components

Motion components **must** be Client Components (`"use client"`). To use Motion in a Server Component tree:

1. Create a small Client Component wrapper for the animated part
2. Import it into the Server Component
3. Pass server-fetched data as props

```typescript
// components/animated-section.tsx
"use client";

import { motion } from "motion/react";

export function AnimatedSection({ children }: { children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </motion.section>
  );
}

// app/(public)/page.tsx (Server Component)
import { AnimatedSection } from "@/components/animated-section";
import { db } from "@/db";

export default async function PublicPage() {
  const projects = await db.query.projects.findMany();

  return (
    <AnimatedSection>
      <h2>Projects</h2>
      {/* Render projects — this content is server-rendered, only the wrapper animates */}
    </AnimatedSection>
  );
}
```

---

## NumberFlow

NumberFlow provides smooth animated transitions between numeric values. It is accessible (`respectMotionPreference: true` by default), dependency-free, and small.

### Basic Usage

```typescript
"use client";

import NumberFlow from "@number-flow/react";

export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-4 bg-card rounded-lg">
      <p className="text-sm text-muted-foreground">{label}</p>
      <NumberFlow
        value={value}
        locales="en-US"
        className="text-3xl font-bold tabular-nums"
      />
    </div>
  );
}
```

### With Formatting

NumberFlow uses `Intl.NumberFormat` options for formatting:

```typescript
// Currency
<NumberFlow
  value={price}
  format={{ style: "currency", currency: "USD" }}
/>

// Percentage
<NumberFlow
  value={percentage}
  format={{ style: "percent", minimumFractionDigits: 1 }}
/>

// Compact notation (1.2K, 3.5M)
<NumberFlow
  value={count}
  format={{ notation: "compact" }}
/>
```

### With Prefix/Suffix

```typescript
<NumberFlow
  value={totalProjects}
  suffix=" projects"
  className="text-2xl font-bold"
/>
```

### Where to Use in This Project

| Location | Value | Format |
| --- | --- | --- |
| Dashboard overview stats | Total projects, experiences, skills count | Integer, compact for large numbers |
| Settings page | Employment status changes count | Integer |
| Public page (if showing stats) | Years of experience, project count | Integer with suffix |

### Rules

- **Always add `"use client"`** — NumberFlow uses browser APIs
- **Use `tabular-nums` class** — ensures all digits are the same width, preventing layout shift during transitions
- **Set `locales`** — defaults to browser locale, but set explicitly for consistent formatting
- **NumberFlow respects `prefers-reduced-motion` by default** — transitions are disabled automatically for users who prefer reduced motion. Do not set `respectMotionPreference: false`

---

## Animation Performance

All animations in this project must maintain 60fps. Follow these rules to avoid jank.

### Animate Only Composite Properties

The browser can GPU-accelerate only these CSS properties without triggering layout recalculation:

| Safe to Animate (GPU) | Avoid Animating (triggers layout) |
| --- | --- |
| `transform` (`translateX`, `translateY`, `scale`, `rotate`) | `width`, `height` |
| `opacity` | `top`, `right`, `bottom`, `left` |
| `filter` (blur, brightness) | `margin`, `padding` |
| `clip-path` | `border-width` |
| `background-color` (ok but not GPU) | `font-size` |

### `will-change` Usage

`will-change` hints the browser to promote an element to its own compositor layer. Use it sparingly:

```typescript
// CORRECT — only for elements that animate frequently
<motion.div style={{ willChange: "transform" }} animate={{ x: position }} />

// CORRECT — NumberFlow prop for frequently changing numbers
<NumberFlow value={liveCount} willChange />

// WRONG — don't apply globally
<div className="will-change-transform"> {/* Don't blanket-apply */}
```

**Rules:**
- Only use `will-change` on elements that are **guaranteed to animate frequently**
- Too many `will-change` elements wastes GPU memory
- Tailwind provides `will-change-transform`, `will-change-scroll`, `will-change-contents`, and `will-change-auto` utilities
- Motion handles `will-change` internally for its animated properties — you generally don't need to add it manually to `motion.*` elements

### Bundle Impact

Keep animation libraries out of pages that don't need them:

```typescript
// If Motion is only used on the public page, dynamically import the animated component
import dynamic from "next/dynamic";

const AnimatedHero = dynamic(() => import("@/components/animated-hero"), {
  ssr: false,
  loading: () => <HeroSkeleton />,
});
```

---

## Animation UX Guidelines

### Timing

| Animation Type | Duration | Easing | Example |
| --- | --- | --- | --- |
| Micro-interaction (button press, icon swap) | 100–200ms | `ease-out` | Copy/check icon swap, button scale on tap |
| Enter/appear (fade in, slide in) | 200–300ms | `ease-out` | Card appearing, modal opening |
| Exit/disappear (fade out, slide out) | 150–250ms | `ease-in` | Toast dismissing, modal closing |
| Layout change (reorder, resize) | 200–400ms | `ease-in-out` | List item reorder, accordion open/close |
| Page transition | 300–500ms | `ease-in-out` | Route change animation |
| Number transition | 300–750ms | spring or `ease-out` | Counter changing value |

### Easing

| Easing | CSS / Motion Value | When to Use |
| --- | --- | --- |
| `ease-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | **Default for most animations.** Elements entering the screen, responses to user action |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Elements moving on screen (not entering or leaving) |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving the screen |
| `linear` | `linear` | Only for continuous animations (spinners, progress bars) |
| spring | `{ type: "spring", stiffness: 300, damping: 20 }` | Playful, organic feel — bouncy interactions, number counters |

**Rule of thumb:** If it enters, use `ease-out`. If it leaves, use `ease-in`. If it moves while staying, use `ease-in-out`. If it never stops, use `linear`.

### Do's and Don'ts

**Do:**
- Animate to provide **feedback** (button pressed, item added, action succeeded)
- Animate to **guide attention** (new element appearing, important state change)
- Keep animations **short** — users see them hundreds of times
- Use `AnimatePresence` for **exit animations** so elements don't just vanish
- Use `motion-safe:` variant in Tailwind or `respectMotionPreference` in NumberFlow to respect user preferences
- Use `viewport={{ once: true }}` for scroll-triggered animations that should only play once

**Don't:**
- Animate for decoration only — every animation should have a purpose
- Use bouncy springs for frequent/repetitive actions (annoying over time)
- Block user interaction during animations — keep durations short enough
- Animate more than 2–3 elements simultaneously (overwhelming)
- Use `animate-spin` on anything other than loading indicators
- Add entrance animations to the admin dashboard data tables (too frequent, slows workflow)

---

## Animation Checklist

### Before Deploying

- [ ] **Performance**: All animations use `transform`/`opacity` — no `width`/`height` jank
- [ ] **60fps**: Tested animations on throttled CPU (Chrome DevTools > Performance > 4x slowdown)
- [ ] **Reduced motion**: `prefers-reduced-motion` disables all non-essential animations (Tailwind `motion-safe:`, Motion `useReducedMotion`, NumberFlow default behavior)
- [ ] **Bundle size**: Motion is only imported in Client Components that need it, not in the root layout
- [ ] **Accessibility**: Animated icon buttons still have `aria-label`, animated content is reachable by keyboard
- [ ] **Timing**: No animation exceeds 500ms except page transitions
- [ ] **Easing**: No `linear` easing used for enter/exit animations (looks robotic)
- [ ] **Purpose**: Every animation serves feedback, guidance, or delight — no gratuitous motion

---

## Documentation Links

- [Motion for React](https://motion.dev/docs/react-quick-start)
- [Motion Layout Animations](https://motion.dev/docs/react-layout-animations)
- [Motion AnimatePresence](https://motion.dev/docs/react-animate-presence)
- [Motion Accessibility Guide](https://motion.dev/docs/react-accessibility)
- [NumberFlow for React](https://number-flow.barvian.me/)
- [Tailwind CSS animation](https://tailwindcss.com/docs/animation)
- [Tailwind CSS transition-property](https://tailwindcss.com/docs/transition-property)
- [tw-animate-css](https://github.com/Wombosvideo/tw-animate-css)