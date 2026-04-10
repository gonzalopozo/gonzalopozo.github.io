# AGENTS-DESIGN.md

Visual design system for the portfolio's public page — theme tokens, bento grid vocabulary, card anatomy, pill navbar, and interactive patterns.

> **Before applying or extending this design system, execute the following skills** — read each SKILL.md and follow its instructions:
>
> 1. `.cursor/skills/shadcn/SKILL.md` (component styling, token usage)
> 2. `.cursor/skills/tailwind-design-system/SKILL.md` (Tailwind v4 `@theme`, OKLCH)
> 3. `.cursor/skills/frontend-design/SKILL.md` (visual quality, polish)
> 4. `.cursor/skills/web-design-guidelines/SKILL.md` (compliance review)

**Related coverage in other AGENTS files (do not duplicate):**

- `AGENTS-ANIMATIONS.md` — timing, easing, Motion/NumberFlow rules
- `AGENTS-ACCESSIBILITY.md` — contrast ratios, touch targets, reduced motion, landmarks
- `AGENTS-PERFORMANCE.md` — code splitting, loading states, bundle optimization

---

## 1. Design Philosophy

Spatial density and card scale ARE the visual language. Visual hierarchy comes from card size contrast, not from typographic weight or color loudness. The portfolio should feel **technical but warm** — a developer who cares about craft.

### Principles

1. **Cards first** — every piece of content lives inside a card. The grid IS the layout.
2. **Generous radii** — large corner radii on cards, pill-shaped nav. Soften the technical content.
3. **Surface contrast, not shadow** — cards float via background-to-card color difference, not drop shadows.
4. **Luminous accent on dark** — dark mode is the hero. Primary cyan glows, amber accent energizes.
5. **Restraint** — one primary, one accent, cool neutrals. No color noise.
6. **Every decision works in both themes** — light and dark are designed in parallel, not as afterthoughts.

---

## 2. Theme Tokens

All color values are in OKLCH for perceptual uniformity (as recommended by the `tailwind-design-system` skill). The tokens map directly to shadcn/ui's variable system and the existing `@theme inline` block in `globals.css`.

> **Implementation note**: when applying these tokens, replace the hex values in `:root` and `.dark` selectors in `globals.css`. The `@theme inline` block that maps `--color-*: var(--*)` stays unchanged.

### 2.1 Color Palette — Light Mode

Design intent: Lavender-tinted off-white background, pure white cards, deep sapphire primary, vivid warm gold accent. Distinctly indigo-leaning — not teal.

```css
:root {
	--background: oklch(0.975 0.008 270);
	--foreground: oklch(0.155 0.025 270);

	--card: oklch(1 0 0);
	--card-foreground: oklch(0.155 0.025 270);

	--popover: oklch(1 0 0);
	--popover-foreground: oklch(0.155 0.025 270);

	--primary: oklch(0.4 0.17 250);
	--primary-foreground: oklch(0.985 0.005 250);

	--secondary: oklch(0.945 0.012 270);
	--secondary-foreground: oklch(0.195 0.025 270);

	--muted: oklch(0.92 0.008 270);
	--muted-foreground: oklch(0.43 0.02 265);

	--accent: oklch(0.7 0.18 55);
	--accent-foreground: oklch(0.2 0.05 55);

	--destructive: oklch(0.55 0.22 25);
	--destructive-foreground: oklch(0.985 0.005 25);

	--border: oklch(0.885 0.012 270);
	--input: oklch(0.885 0.012 270);
	--ring: oklch(0.48 0.17 250);
}
```

### 2.2 Color Palette — Dark Mode

Design intent: Deep indigo-black surface with real blue tint, elevated cards with indigo sheen, electric blue primary, vivid gold accent. Moody and immersive.

```css
.dark {
	--background: oklch(0.12 0.025 275);
	--foreground: oklch(0.95 0.008 265);

	--card: oklch(0.175 0.022 270);
	--card-foreground: oklch(0.95 0.008 265);

	--popover: oklch(0.175 0.022 270);
	--popover-foreground: oklch(0.95 0.008 265);

	--primary: oklch(0.75 0.17 235);
	--primary-foreground: oklch(0.12 0.035 235);

	--secondary: oklch(0.225 0.018 275);
	--secondary-foreground: oklch(0.91 0.008 265);

	--muted: oklch(0.225 0.018 275);
	--muted-foreground: oklch(0.58 0.016 265);

	--accent: oklch(0.8 0.17 50);
	--accent-foreground: oklch(0.12 0.045 50);

	--destructive: oklch(0.64 0.2 25);
	--destructive-foreground: oklch(0.12 0.025 25);

	--border: oklch(0.265 0.018 275);
	--input: oklch(0.265 0.018 275);
	--ring: oklch(0.75 0.17 235);
}
```

### 2.3 Color Design Rationale

| Token              | Light                                        | Dark                                         | Design intent                                                   |
| ------------------ | -------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------- |
| `background`       | Lavender off-white (L=0.975, C=0.008, H=270) | Deep indigo-black (L=0.12, C=0.025, H=275)   | Tinted surfaces with personality, not neutral                   |
| `card`             | Pure white (L=1.0)                           | Elevated indigo (L=0.175, C=0.022, H=270)    | Cards float above background via surface contrast               |
| `primary`          | Deep sapphire (L=0.40, C=0.17, H=250)        | Electric blue (L=0.75, C=0.17, H=235)        | Signature color — rich indigo-blue, clearly different from teal |
| `accent`           | Vivid warm gold (L=0.70, C=0.18, H=55)       | Bright gold (L=0.80, C=0.17, H=50)           | Complementary warmth, high saturation for CTAs                  |
| `muted-foreground` | Mid gray (L=0.43)                            | Subdued gray (L=0.58)                        | Secondary text — verify ≥ 4.5:1 contrast during implementation  |
| `border`           | Cool lavender line (L=0.885, C=0.012, H=270) | Indigo-tinted line (L=0.265, C=0.018, H=275) | Visible but non-competing                                       |

The hue axis centers on **H=250** (sapphire-indigo) for primary and **H=50–55** (warm gold) for accent — a complementary pair that creates strong visual tension. All neutral surfaces share **H=265–275** (cool indigo-gray) for cohesion. Chroma is pushed higher than typical (C=0.17) for both primary and accent to give the palette real personality.

### 2.4 Status Tokens

Replace hardcoded status colors (e.g., `text-green-600`, `text-amber-400`, `text-cyan-600` in `grid-item.tsx`) with semantic tokens:

```css
:root {
	--status-active: oklch(0.52 0.175 155);
	--status-in-progress: oklch(0.48 0.17 250);
	--status-archived: oklch(0.62 0.15 70);
}
.dark {
	--status-active: oklch(0.7 0.175 155);
	--status-in-progress: oklch(0.7 0.15 235);
	--status-archived: oklch(0.74 0.15 70);
}
```

Register in `@theme inline`:

```css
--color-status-active: var(--status-active);
--color-status-in-progress: var(--status-in-progress);
--color-status-archived: var(--status-archived);
```

Usage: `text-status-active`, `text-status-in-progress`, `text-status-archived`.

### 2.5 Chart Palette

Five-color palette derived from the primary/accent axis, perceptually balanced for data visualization:

```css
:root {
	--chart-1: oklch(0.4 0.17 250);
	--chart-2: oklch(0.6 0.2 35);
	--chart-3: oklch(0.5 0.18 300);
	--chart-4: oklch(0.5 0.14 185);
	--chart-5: oklch(0.55 0.17 145);
}
.dark {
	--chart-1: oklch(0.75 0.17 235);
	--chart-2: oklch(0.74 0.17 35);
	--chart-3: oklch(0.7 0.16 300);
	--chart-4: oklch(0.68 0.13 185);
	--chart-5: oklch(0.72 0.16 145);
}
```

### 2.6 Sidebar Tokens (Admin Dashboard)

Mirror the card surface for seamless integration. The sidebar is admin-only; these values keep it visually consistent with the main theme.

```css
:root {
	--sidebar: oklch(1 0 0);
	--sidebar-foreground: oklch(0.155 0.025 270);
	--sidebar-primary: oklch(0.4 0.17 250);
	--sidebar-primary-foreground: oklch(0.985 0.005 250);
	--sidebar-accent: oklch(0.945 0.012 270);
	--sidebar-accent-foreground: oklch(0.195 0.025 270);
	--sidebar-border: oklch(0.885 0.012 270);
	--sidebar-ring: oklch(0.48 0.17 250);
}
.dark {
	--sidebar: oklch(0.175 0.022 270);
	--sidebar-foreground: oklch(0.95 0.008 265);
	--sidebar-primary: oklch(0.75 0.17 235);
	--sidebar-primary-foreground: oklch(0.12 0.035 235);
	--sidebar-accent: oklch(0.225 0.018 275);
	--sidebar-accent-foreground: oklch(0.91 0.008 265);
	--sidebar-border: oklch(0.265 0.018 275);
	--sidebar-ring: oklch(0.75 0.17 235);
}
```

### 2.7 Typography Tokens

Font stack is already configured in `app/layout.tsx`:

| Token               | Value                  | Use                      |
| ------------------- | ---------------------- | ------------------------ |
| `--font-geist-sans` | Geist (next/font)      | Body text, headings, UI  |
| `--font-geist-mono` | Geist Mono (next/font) | Code, technical metadata |

**Rationale**: Geist is purpose-built for developer tools — clean, legible at small sizes, excellent monospace companion. No font changes needed.

### 2.8 Border Radius

| Element                  | Class                             | Value          | Purpose                              |
| ------------------------ | --------------------------------- | -------------- | ------------------------------------ |
| Grid cards               | `rounded-4xl`                     | 2rem (32px)    | Signature aesthetic — generous, soft |
| Pill navbar              | `rounded-full`                    | 9999px         | Capsule shape                        |
| Nav active indicator     | `rounded-full`                    | 9999px         | Pill highlight inside navbar         |
| shadcn components        | `rounded-lg` (default `--radius`) | 0.5rem (8px)   | Buttons, inputs, dialogs             |
| Nested elements in cards | `rounded-xl`                      | 0.75rem (12px) | Tags, badges, inner containers       |

Keep `--radius: 0.5rem` as the shadcn base. Grid card radius is applied directly via `className`, not through the `--radius` variable.

> If `rounded-4xl` is not available in Tailwind v4 defaults, define it in `@theme`:
>
> ```css
> @theme {
> 	--radius-4xl: 2rem;
> }
> ```

### 2.9 Shadows

Minimal shadow usage — cards float via surface color contrast.

| Element          | Light mode                      | Dark mode                             |
| ---------------- | ------------------------------- | ------------------------------------- |
| Grid cards       | `shadow-none` or `shadow-sm`    | `shadow-none`                         |
| Popover/dropdown | `shadow-md`                     | `shadow-lg` (needs more lift on dark) |
| Navbar           | `shadow-sm` or frosted backdrop | `shadow-none` + border                |

The base `Card` component in `components/ui/card.tsx` has `shadow-sm` by default. Grid cards override this in `GridItem` if needed.

---

## 3. Grid System

The bento grid uses `react-grid-layout` (Responsive). This section defines the shared vocabulary for grid configuration.

### 3.1 Breakpoints & Columns

| Breakpoint | Name    | Min width | Columns | Use                 |
| ---------- | ------- | --------- | ------- | ------------------- |
| `lg`       | Desktop | 996px     | 8       | Full bento layout   |
| `md`       | Tablet  | 768px     | 4       | Simplified 2-column |
| `sm`       | Mobile  | 0px       | 1       | Single column stack |

### 3.2 Row Height & Gap

| Property            | Value         | Notes                                                  |
| ------------------- | ------------- | ------------------------------------------------------ |
| `rowHeight`         | `30px`        | Base unit — card height = `h × 30px`                   |
| Gap (margin)        | `16px` (1rem) | Inter-card spacing via react-grid-layout `margin` prop |
| Container max-width | `1200px`      | `max-w-[1200px] mx-auto`                               |
| Container padding   | `px-[3.5vw]`  | Responsive horizontal breathing room                   |

### 3.3 Named Card Sizes

Shared vocabulary for layout composition. Sizes refer to `{w, h}` values in react-grid-layout at the `lg` breakpoint (8 columns).

| Name         | w × h  | Pixel size (approx)    | Use                                              |
| ------------ | ------ | ---------------------- | ------------------------------------------------ |
| **hero**     | 4 × 16 | ~half width × 480px    | Primary content — about, featured project        |
| **wide**     | 4 × 8  | ~half width × 240px    | Standard wide — project card, about              |
| **standard** | 2 × 8  | ~quarter width × 240px | Default — map, contact, compact project          |
| **tall**     | 2 × 16 | ~quarter width × 480px | Vertical emphasis — detailed project, experience |
| **compact**  | 2 × 4  | ~quarter width × 120px | Minimal — stat, link, social                     |

At `md` (4 columns): hero → 4×12, wide → 4×8, standard → 2×8, tall → 2×12, compact → 2×4.

At `sm` (1 column): all cards become 1×auto (full width, content-driven height).

### 3.4 Content Adaptation Rules

- When a card goes from **tall** to **wide** (responsive rearrangement), content reflows from vertical to horizontal. Use `flex-direction` or `grid-template` changes.
- **Never truncate essential content to fit a card size** — resize the card instead.
- Images and maps in cards use `object-cover` + `overflow-hidden` on the card for radius clipping.

### 3.5 Responsive Priority

At `sm` (1 column), not all cards need to show. Priority order:

1. **about** — always visible, first position
2. **project** (featured) — max 2–3 cards
3. **experience** — collapsed or summary
4. **contact** — always visible
5. **map** — hidden or moved to bottom

---

## 4. Card System

The card is the fundamental unit of the design. All content lives inside a `Card` component with variant-specific composition.

### 4.1 Base Card

```tsx
<Card className="size-full min-h-0 min-w-0 overflow-hidden bg-card rounded-4xl">
```

| Property   | Value                        | Notes                                                                     |
| ---------- | ---------------------------- | ------------------------------------------------------------------------- |
| Background | `bg-card`                    | Uses `--card` token                                                       |
| Radius     | `rounded-4xl` (2rem)         | Overrides Card's default `rounded-xl`                                     |
| Border     | Subtle or none               | Light: `border` (default). Dark: consider `border-border/50` for subtlety |
| Shadow     | `shadow-none` to `shadow-sm` | Minimal — cards float via surface contrast                                |
| Overflow   | `overflow-hidden`            | Clips children to rounded corners                                         |
| Min sizing | `min-h-0 min-w-0`            | Required for react-grid-layout                                            |

### 4.2 Content-Type Variants

| Variant      | Padding     | Structure                                                | Notes                                  |
| ------------ | ----------- | -------------------------------------------------------- | -------------------------------------- |
| `about`      | `py-6 px-6` | Free-form children (image, text, CTA)                    | Flexible layout via flex/grid          |
| `project`    | `py-6`      | `CardHeader` → `CardContent` → `CardFooter` (3-row grid) | Status badges use semantic tokens      |
| `experience` | `py-6 px-6` | Role, company, dates, skill tags                         | Compact for standard/wide sizes        |
| `contact`    | `py-6 px-6` | CTA-focused, minimal content                             | Accent color for CTA button            |
| `map`        | `p-0`       | Full-bleed map, zero padding                             | `overflow-hidden` clips to card radius |
| `media`      | `p-0`       | Full-bleed image/screenshot                              | Same as map — future use               |

### 4.3 Internal Spacing

| Zone                             | Value                    | Notes                         |
| -------------------------------- | ------------------------ | ----------------------------- |
| Card outer padding               | `py-6` (24px top/bottom) | Non-map variants              |
| Header/Content/Footer horizontal | `px-6` (24px left/right) | Via shadcn Card subcomponents |
| Content gap                      | `gap-6` (24px)           | Default Card flex gap         |
| Between title and description    | `gap-2` (8px)            | Via CardHeader grid           |

### 4.4 Interactive States

| State            | Treatment                                  | Reference                |
| ---------------- | ------------------------------------------ | ------------------------ |
| Hover            | Subtle border shift to `border-primary/30` | Soft glow, not jarring   |
| Focus (keyboard) | `ring-2 ring-ring ring-offset-2`           | WCAG 2.4.7 focus visible |
| Active/pressed   | `scale-[0.99]` via transition              | Micro-feedback           |
| Disabled         | `opacity-60 pointer-events-none`           | Standard pattern         |

Hover animation timing: `transition-colors duration-200 ease-out`. See `AGENTS-ANIMATIONS.md` for the full timing table.

---

## 5. Navigation — Pill Navbar

The navigation is a floating pill-shaped bar anchored at the top-center of the viewport.

### 5.1 Shape & Structure

```
┌──────────────────────────────────────────────────┐
│  [●All]    Projects    Experience    Contact  [◐] │
└──────────────────────────────────────────────────┘
       ↑ active indicator (sliding pill)        ↑ theme toggle
```

| Property             | Value                                                                  |
| -------------------- | ---------------------------------------------------------------------- |
| Container shape      | `rounded-full` (pill)                                                  |
| Container background | Light: `bg-secondary` — Dark: `bg-card` with `border border-border/50` |
| Container height     | `h-12` to `h-14` (48–56px) — NOT the current `h-32`                    |
| Horizontal padding   | `px-2`                                                                 |
| Item padding         | `px-4 py-2`                                                            |
| Item font            | `text-sm font-medium`                                                  |

### 5.2 Active Indicator

A colored pill that slides behind the active nav item, animated with Motion's `layoutId`:

```tsx
{
	isActive && (
		<motion.span
			layoutId="nav-indicator"
			className="bg-primary absolute inset-0 rounded-full"
			transition={{ type: 'spring', stiffness: 350, damping: 30 }}
		/>
	);
}
```

| Property         | Value                                                                      |
| ---------------- | -------------------------------------------------------------------------- |
| Background       | `bg-primary` (cyan-blue in both themes)                                    |
| Text on active   | `text-primary-foreground`                                                  |
| Text on inactive | `text-muted-foreground`                                                    |
| Animation        | `layoutId` spring transition (see `AGENTS-ANIMATIONS.md` for Motion rules) |

### 5.3 Theme Toggle

Place the theme toggle as the last element in the navbar, visually separated with subtle spacing. Use the existing `ModeToggle` component. Inside the pill navbar, render it as an icon-only button (`size="icon"`) with `rounded-full`.

### 5.4 Placement & Responsiveness

| Breakpoint  | Placement                   | Adaptation                                     |
| ----------- | --------------------------- | ---------------------------------------------- |
| `lg` / `md` | Top-center, fixed or sticky | Full labels + icons                            |
| `sm`        | Bottom-center, fixed        | Icons only — active item expands to show label |

Mobile bottom placement: `fixed bottom-4 left-1/2 -translate-x-1/2 z-50`. Add `pb-20` to the main container on mobile to prevent overlap.

---

## 6. Typography

Type scale designed for card-constrained layouts where space is limited.

### 6.1 Type Scale

| Role              | Classes                                | Use                                               |
| ----------------- | -------------------------------------- | ------------------------------------------------- |
| Page heading      | `text-2xl font-bold tracking-tight`    | User's name (only element outside card hierarchy) |
| Card title        | `text-base font-semibold leading-none` | CardTitle (shadcn default)                        |
| Card title (hero) | `text-lg font-semibold tracking-tight` | Larger cards (hero, wide)                         |
| Card description  | `text-sm text-muted-foreground`        | CardDescription (shadcn default)                  |
| Body text         | `text-sm`                              | In-card body content                              |
| Metadata          | `text-xs text-muted-foreground`        | Dates, counts, secondary info                     |
| Code / technical  | `font-mono text-xs`                    | Tech stack tags, code references                  |

### 6.2 Letter Spacing

| Element                  | Class            | Value    |
| ------------------------ | ---------------- | -------- |
| Page heading             | `tracking-tight` | -0.025em |
| Card titles (hero)       | `tracking-tight` | -0.025em |
| Card titles (standard)   | default          | 0        |
| Body & metadata          | default          | 0        |
| All-caps labels (if any) | `tracking-wide`  | +0.025em |

### 6.3 Truncation & Clamping

For card descriptions that may overflow:

```tsx
<p className="text-muted-foreground line-clamp-2 text-sm">{description}</p>
```

| Card size   | Line clamp              |
| ----------- | ----------------------- |
| compact     | `line-clamp-1`          |
| standard    | `line-clamp-2`          |
| wide        | `line-clamp-3`          |
| tall / hero | No clamp (content fits) |

---

## 7. Iconography & Media

### 7.1 Icon Sizing

| Context              | Size class            | Pixels  | Example                 |
| -------------------- | --------------------- | ------- | ----------------------- |
| Inline with text     | `size-4`              | 16px    | Status icon, metadata   |
| Standalone button    | `size-5`              | 20px    | External link, GitHub   |
| Primary action / nav | `size-5` to `size-6`  | 20–24px | Nav icons, theme toggle |
| Hero / decorative    | `size-8` to `size-10` | 32–40px | Card accent icon        |

### 7.2 Icon Libraries

| Library         | Use                                         | Import                                   |
| --------------- | ------------------------------------------- | ---------------------------------------- |
| **Lucide**      | UI actions (arrows, edit, trash, etc.)      | `lucide-react`                           |
| **react-icons** | Brand logos (GitHub, LinkedIn, tech stacks) | `react-icons/fa`, `react-icons/ri`, etc. |

Decorative icons use `aria-hidden="true"`. Functional icons in icon-only buttons need `aria-label` on the button (see `AGENTS-ACCESSIBILITY.md`).

### 7.3 Profile Image

| Property  | Value                                                    |
| --------- | -------------------------------------------------------- |
| Component | `next/image`                                             |
| Shape     | `rounded-2xl` or `rounded-full`                          |
| Size      | Constrained by card — `max-w-full h-auto object-contain` |
| Alt text  | Descriptive: `"Gonzalo Pozo, Full Stack Developer"`      |

### 7.4 Map Card

Full-bleed treatment — the map fills the entire card:

```tsx
<GridItem variant="map" ...>
  <Map center={...} zoom={13} attributionControl={false}>
    <MapControls />
  </Map>
</GridItem>
```

The `variant="map"` applies `p-0` and `overflow-hidden` clips the map to `rounded-4xl`.

---

## 8. Interactive Patterns

### 8.1 Link & Button Treatment

| Element              | Pattern                                                      | Notes                                    |
| -------------------- | ------------------------------------------------------------ | ---------------------------------------- |
| External link (icon) | `text-muted-foreground hover:text-primary transition-colors` | Replaces hardcoded `hover:text-blue-600` |
| CTA button           | `bg-primary text-primary-foreground hover:bg-primary/90`     | Default shadcn Button                    |
| Accent CTA           | `bg-accent text-accent-foreground hover:bg-accent/90`        | High-emphasis actions                    |
| Ghost button         | `hover:bg-secondary hover:text-secondary-foreground`         | Low-emphasis, in-card actions            |
| Icon button          | `rounded-full` variant, `size="icon"`                        | GitHub, external link icons              |

### 8.2 Card-Level vs Element-Level Click Areas

- **Navigational cards** (e.g., "See more projects"): the entire card is the click target. Use a wrapping `<a>` or button with `absolute inset-0`.
- **Content cards** with multiple actions (repo link, live link, "show more"): individual clickable elements. No card-level click.

### 8.3 External Link Pattern

Replace the current `IconContext.Provider` approach with explicit token-based styling:

```tsx
<a
	href={url}
	target="_blank"
	rel="noopener noreferrer"
	className="text-muted-foreground hover:text-primary transition-colors"
	aria-label="View repository on GitHub"
>
	<FaGithub className="size-5" aria-hidden="true" />
</a>
```

### 8.4 Theme Toggle in Navbar

Use the existing `ModeToggle` component. Style it to match the navbar's pill aesthetic:

- `rounded-full` shape
- Same padding as other nav items
- No outline/border — blends into the navbar

---

## 9. Responsive Behavior

### 9.1 Breakpoint Summary

| Breakpoint     | Grid cols | Nav placement | Cards visible          |
| -------------- | --------- | ------------- | ---------------------- |
| `lg` (≥ 996px) | 8         | Top-center    | All                    |
| `md` (≥ 768px) | 4         | Top-center    | All (rearranged)       |
| `sm` (< 768px) | 1         | Bottom-center | Priority subset (§3.5) |

### 9.2 Content Priority at Narrow Widths

At `sm`, the grid becomes a single column. Content ordering:

1. About card (always first)
2. Featured project(s) (1–2 max)
3. Contact card
4. Additional content (collapsed or hidden)
5. Map card (last or hidden)

### 9.3 Touch Targets

Per WCAG 2.5.8 and `AGENTS-ACCESSIBILITY.md`:

- Minimum touch target: **44 × 44px**
- Nav items: `min-h-11` (44px) ensures compliance
- Icon buttons: `size="icon"` (40 × 40px default) — add `min-w-11 min-h-11` if used as primary actions
- Card "Show more" buttons: standard Button size (≥ 44px height)

### 9.4 Nav Adaptation

- **Desktop / Tablet**: full labels (`All`, `Projects`, `Experience`, `Contact`) + theme toggle
- **Mobile**: icons only, active item shows label. Container shrinks. Fixed to bottom of viewport.
- **Transition**: `md` breakpoint triggers the switch. Use CSS `hidden md:inline` for label visibility.

---

## Verification Checklist

When applying or modifying this design system:

- [ ] All text-on-surface combinations meet WCAG AA contrast (4.5:1 normal, 3:1 large) — use WebAIM Contrast Checker
- [ ] `muted-foreground` on `background` meets 4.5:1 in both themes
- [ ] `primary` as text on `card` meets 4.5:1 in both themes
- [ ] Cards visually separate from background in both themes (surface contrast)
- [ ] No hardcoded colors remain — all use design tokens
- [ ] Status colors use `text-status-*` instead of `text-green-600` etc.
- [ ] External link hover uses `hover:text-primary` instead of `hover:text-blue-600`
- [ ] Grid card radius is consistently `rounded-4xl`
- [ ] Navbar height is `h-12` to `h-14`, not `h-32`
- [ ] Run `AGENTS-ACCESSIBILITY.md` pre-production audit after visual changes
