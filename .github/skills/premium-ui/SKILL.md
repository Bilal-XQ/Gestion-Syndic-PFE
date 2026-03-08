# Skill: Professional Frontend Design & Premium UI/UX

**When to use:** Building or overhauling any component, page, or layout where the visual quality must match the "editorial dark / premium SaaS" aesthetic defined in `docs/THEME.md`. Use this skill any time a prompt mentions design quality, visual polish, UI/UX, or when the output is a full page, section, or composite component.

Reference this skill by adding to your prompt:
`Use the premium-ui skill in .github/skills/premium-ui/SKILL.md`

> **Canonical authority:** `docs/THEME.md` is the single source of truth. This skill summarises the working rules; THEME.md always wins on conflicts.

---

## Step 0 — Before writing a single line

Read the full token table for the surface you are targeting:

| Surface | Font stack | Tokens section in THEME.md |
|---|---|---|
| Dashboard / Owner portal | `Geist Sans` (UI), `Geist Mono` (data) | Core Palette, Component-Specific Guidelines |
| Landing page | `Instrument Serif` (headlines), `Syne` (badges/stats), `DM Sans` (body) | Landing Page gradients, Hero Gradients |

Ask yourself three questions before writing markup:
1. What is the **visual role** of this component? (metric card, nav item, form field, etc.)
2. What **semantic state** can this component be in? (default, hover, focused, disabled, loaded, error)
3. Does it contain **financial data**? → `font-mono` for all amounts, dates, and reference numbers.

---

## Step 1 — Colour rules (never break these)

### Always use CSS custom properties — never hard-code hex

```tsx
// ✅ Correct
<div className="bg-[--bg-card] border border-[--border-default] text-[--text-primary]">

// ❌ Wrong — hex is forbidden in component files
<div style={{ background: '#161616', color: '#fff' }}>
```

### Token quick reference

```
Backgrounds        --bg-base · --bg-subtle · --bg-card · --bg-elevated · --bg-input
Borders            --border-subtle · --border-default · --border-strong · --border-focus
Text               --text-primary · --text-secondary · --text-muted · --text-placeholder
Buttons            --btn-primary-bg / --btn-primary-text · --btn-secondary-bg / --btn-secondary-border
Status (success)   text-[#22C55E]  bg-[rgba(34,197,94,0.10)]   border-[rgba(34,197,94,0.20)]
Status (warning)   text-[#F59E0B]  bg-[rgba(245,158,11,0.10)]
Status (error)     text-[#EF4444]  bg-[rgba(239,68,68,0.10)]
Status (neutral)   text-[#888888]  bg-[rgba(136,136,136,0.12)]
```

### Forbidden colour patterns

- Solid `#FFFFFF` as a background in dark mode — `--bg-card` (`#161616`) is the lightest card surface
- Any blue, purple, teal, or brand-colour accent on UI chrome
- `bg-white`, `bg-black`, `text-white`, `text-black` Tailwind classes — use token equivalents
- Inline `style={{ color: '...' }}` with hex for anything other than dynamic status colours

---

## Step 2 — Typography

### Family assignment

```tsx
// All dashboard UI text — implied by :root font-family (Geist Sans)
className="font-sans"

// Financial amounts, reference numbers, timestamps in tables
className="font-mono tabular-nums"

// Landing page headline
className="font-serif"          // Instrument Serif

// Landing page badge / stat number
className="font-display"        // Syne

// Landing page body copy
className="font-body"           // DM Sans
```

### Type scale classes

| Use case | Class |
|---|---|
| Table metadata / timestamps | `text-xs` (11px) |
| Labels, badges, captions | `text-sm` (12px) |
| Body, nav links, form fields | `text-base` (14px) |
| Card values, sub-headings | `text-md` (16px) |
| Section sub-headings | `text-lg` (18px) |
| Dashboard metric numbers | `text-xl` (22px) |
| Page headings | `text-2xl` (28px) |
| Landing H1 | `text-display` (clamp 44–76px) |

### Table header pattern (always identical)

```tsx
<TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
  Column Label
</TableHead>
```

---

## Step 3 — Layout and spacing

### Card anatomy

Every card follows this exact structure:

```tsx
<div className="rounded-[--radius-2xl] border border-[--border-subtle] bg-[--bg-card] p-5 transition-shadow duration-[250ms] hover:shadow-[--shadow-md]">
  {/* content */}
</div>
```

- Rest: no shadow
- Hover: `--shadow-md`
- Never add colour fill to a card hover — shadow only

### Section rhythm (landing page)

```tsx
// Major section wrapper
<section className="py-[--space-24]">          // 96px vertical
  <div className="mx-auto max-w-7xl px-6">     // Standard page width
    {/* content */}
  </div>
</section>
```

### Dashboard page structure

```tsx
// Page root (Server Component)
<div className="flex flex-col gap-[--space-6]">
  <PageHeader title="..." subtitle="..." />    // See pattern below
  <MetricsRow />
  <MainContentArea />
</div>
```

---

## Step 4 — Component patterns

### Metric card

```tsx
<div className="rounded-[--radius-2xl] border border-[--border-subtle] bg-[--bg-card] p-5 transition-shadow duration-[250ms] hover:shadow-[--shadow-md]">
  <p className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
    Revenue
  </p>
  <p className="mt-2 font-mono text-xl font-semibold tabular-nums text-[--text-primary]">
    12 450.00 MAD
  </p>
  <div className="mt-1 flex items-center gap-1 text-xs text-[#22C55E]">
    <TrendingUp className="h-3 w-3" />
    <span>+8.2% vs last month</span>
  </div>
</div>
```

### Status badge (always use the shared component)

```tsx
// Import — never write inline badge styles
import { StatusBadge } from "@/components/features/shared/StatusBadge";

<StatusBadge status="paid" />
```

If adding a new status variant, extend the `statusConfig` map in `src/components/features/shared/StatusBadge.tsx` — never fork the component.

### Data table rows

```tsx
<TableRow className="border-[--border-subtle] transition-colors duration-[150ms] hover:bg-[--bg-card-hover]">
  <TableCell className="text-sm text-[--text-secondary]">Name</TableCell>
  <TableCell className="font-mono tabular-nums text-sm text-[--text-primary]">
    1 200.00 MAD
  </TableCell>
</TableRow>
```

Rules:
- No zebra striping — row hover only
- Financial columns: `font-mono tabular-nums`
- Action columns: right-aligned with `text-right`

### Form inputs

```tsx
<Input
  className="
    border-[--border-default] bg-[--bg-input]
    placeholder:text-[--text-placeholder] text-[--text-primary]
    focus-visible:border-[--border-focus]
    focus-visible:ring-2 focus-visible:ring-[rgba(255,255,255,0.06)]
    rounded-[--radius-md]
  "
/>
```

### Primary button

```tsx
<Button className="bg-[--btn-primary-bg] text-[--btn-primary-text] rounded-[--radius-md] px-5 py-3 font-medium transition-all duration-[250ms] active:scale-[0.98] hover:bg-[--btn-primary-hover]">
  Save
</Button>
```

### Ghost / secondary button

```tsx
<Button
  variant="outline"
  className="border-[--border-default] bg-transparent text-[--text-secondary] hover:bg-[--btn-secondary-hover-bg] hover:border-[--btn-secondary-hover-border] rounded-[--radius-md] transition-all duration-[250ms]"
>
  Cancel
</Button>
```

### Empty state

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <Icon className="mb-4 h-10 w-10 text-[--text-muted]" />
  <p className="text-base font-medium text-[--text-primary]">No items yet</p>
  <p className="mt-1 text-sm text-[--text-muted]">Add your first item to get started.</p>
</div>
```

### Page header pattern

```tsx
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-semibold text-[--text-primary]">Page Title</h1>
    <p className="mt-0.5 text-sm text-[--text-muted]">Subtitle or description</p>
  </div>
  <Button>Primary Action</Button>
</div>
```

---

## Step 5 — Animation and motion

### Core principles

- **Purposeful only** — motion communicates state change, never decoration
- **Fast exits, slower entrances:** exits 150–200ms, entrances 400–700ms
- **Never animate colour directly** — use opacity and transform only
- **Spring on scale/lift:** `cubic-bezier(0.34, 1.56, 0.64, 1)` for any scale or translateY

### Standard hover lift (cards, panels)

```tsx
className="transition-shadow duration-[250ms]"
// No translateY lift on cards — shadow change only
```

### Button press feedback

```tsx
className="active:scale-[0.98] transition-transform duration-[150ms]"
```

### Scroll-reveal (landing page sections)

```tsx
// Use IntersectionObserver at threshold 0.12
// Apply class `fade-up` → add class `visible` on intersection
// CSS:
//   .fade-up { opacity: 0; transform: translateY(28px); transition: opacity 600ms cubic-bezier(0,0,0.2,1), transform 600ms cubic-bezier(0,0,0.2,1); }
//   .fade-up.visible { opacity: 1; transform: none; }
// Stagger children: transition-delay: 0.1s increments, max 0.5s
```

---

## Step 6 — Quality checklist before delivery

Go through every item before considering the work done:

### Colour & tokens
- [ ] Zero hard-coded hex values in JSX/TSX (dynamic status styles are the only exception)
- [ ] No `bg-white`, `bg-black`, `text-white`, `text-black` Tailwind classes
- [ ] All border, background, and text colours resolve to `--token` variables

### Typography
- [ ] Financial data uses `font-mono tabular-nums`
- [ ] Dashboard surfaces use `font-sans` (Geist Sans)
- [ ] Landing page uses the correct 3-family system
- [ ] Table headers match "text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]"

### Spacing & structure
- [ ] Cards use `--radius-2xl` and `border-[--border-subtle]`
- [ ] Hover states: shadow only for cards, background only for rows
- [ ] No zebra striping in tables

### Interactivity
- [ ] All buttons have `active:scale-[0.98]`
- [ ] Hover transitions specify explicit duration (`duration-[150ms]` or `duration-[250ms]`)
- [ ] Disabled states: `opacity-40 cursor-not-allowed pointer-events-none`

### Semantics & accessibility
- [ ] Heading hierarchy (h1 → h2 → h3) is preserved per page
- [ ] Icon-only buttons have `aria-label`
- [ ] Status badges rely on colour + text label — never colour alone
- [ ] Focus-visible ring is visible and uses `--border-focus`

### Forbidden patterns scan
- [ ] No blue / purple / teal accent anywhere in the UI chrome
- [ ] No decorative gradients with brand colour on the dashboard
- [ ] No `window.confirm` — use `AlertDialog`
- [ ] No inline `style` prop with static hex (dynamic status values allowed)

---

## Step 7 — Common pitfalls to avoid

| Pitfall | Correct approach |
|---|---|
| Using a colour gradient for a button to make it "pop" | White-on-black or black-on-white primary; gradient forbidden |
| Adding a coloured glow or box-shadow to a card | Shadow only with `--shadow-md`, no colour in shadow |
| Zebra striping a table for "readability" | Row hover `--bg-card-hover` only |
| Using Inter or system-ui because it "looks clean" | `Geist Sans` always — it IS the clean font for this project |
| Hardcoding status colours per component | Extend `StatusBadge.tsx` shared component |
| Making a card lift on translateY on hover | Cards shadow-transition only; translateY lift reserved for landing page feature cards |
| Building a role selector on the login page | Single email+password form; server resolves role from JWT |

---

## Related skills and docs

- [docs/THEME.md](../../docs/THEME.md) — complete token reference (canonical)
- [.github/skills/shadcn-component/SKILL.md](../shadcn-component/SKILL.md) — scaffolding Sheet panels, tables, dialogs
- [.github/instructions/frontend-components.instructions.md](../../.github/instructions/frontend-components.instructions.md) — auto-applied rules for all component files
