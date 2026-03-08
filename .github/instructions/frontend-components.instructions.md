---
applyTo: "src/components/**/*.tsx,src/app/**/*.tsx"
---

# Frontend Components — Design System and Component Patterns

Full token reference: `docs/THEME.md`. The rules below are a working summary; THEME.md takes precedence on any conflict.

## Design principle

The Syndic aesthetic is **refined restraint** — pure near-black base, layered grey cards, hairline borders, white typography. Color carries meaning only (status, action, data). No decorative color.

Before writing a component, commit to its visual role in this system. Every component must feel intentional. Generic AI aesthetics (purple gradients, Inter/Roboto, excessive shadows with color) are explicitly forbidden.

## Color tokens — always use CSS variables, never hard-coded hex

```css
/* Backgrounds */
--bg-base: #0a0a0a /* page root */ --bg-card: #161616 /* cards, panels */
  --bg-elevated: #1f1f1f /* modals, dropdowns */ --bg-input: #141414
  /* form fields */ /* Borders */ --border-default: #2a2a2a
  /* card borders, inputs */ --border-strong: #3a3a3a /* hover state */
  /* Text */ --text-primary: #ffffff /* headlines, values */
  --text-secondary: #a0a0a0 /* body, nav labels */ --text-muted: #636363
  /* captions, timestamps */ /* Buttons */ --btn-primary-bg: #ffffff
  --btn-primary-text: #0a0a0a;
```

Status tokens (use semantic groupings together — never mix):

```
paid / success:  text #22C55E  bg rgba(34,197,94,0.10)
partial / warning: text #F59E0B  bg rgba(245,158,11,0.10)
unpaid / error:  text #EF4444  bg rgba(239,68,68,0.10)
neutral:         text #888888  bg rgba(136,136,136,0.12)
```

## Typography

Dashboard surfaces: `font-family: 'Geist Sans'` for all UI text. `font-family: 'Geist Mono'` for financial amounts, dates, and reference numbers in tables.
Landing page: `Instrument Serif` for headlines, `Syne` for UI badges/stats, `DM Sans` for body copy.

Never use Inter, Roboto, Arial, or system-ui.

## Forbidden patterns

- Hard-coded hex values in component files — always use CSS tokens
- Solid white (`#FFFFFF`) as a background in dark mode — use `--bg-card` at most
- Blue, purple, or any brand-color accent for UI chrome
- Zebra row striping in tables
- Border-radius values outside the defined scale (6 / 8 / 10 / 12 / 16 / 20 / 9999px)
- `"use client"` without a genuine requirement for browser APIs or reactive state

## Component patterns

### Cards and metric boxes

```tsx
<div className="rounded-[20px] border border-[--border-subtle] bg-[--bg-card] p-5
                transition-shadow duration-[250ms] hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
```

### Status badges (always pills)

```tsx
<span
  className="inline-flex items-center rounded-full px-[10px] py-[2px]
                 text-xs font-medium"
  style={{
    color: "var(--status-success)",
    background: "var(--status-success-bg)",
  }}
>
  Paid
</span>
```

### Tables

- Header: uppercase, `text-xs` weight 400, `color: var(--text-muted)`, `letter-spacing: 0.08em`
- Row hover: `background: var(--bg-card-hover)` — no zebra striping
- Row border: `1px solid var(--border-subtle)`

### Form inputs

```tsx
<input
  className="w-full rounded-[10px] border border-[--border-default] bg-[--bg-input]
                  px-[14px] py-[10px] text-sm text-[--text-primary]
                  placeholder:text-[--text-placeholder]
                  focus:border-[--border-focus] focus:outline-none
                  focus:ring-2 focus:ring-white/[0.06]"
/>
```

### Slide-over panels (shadcn Sheet)

Use `<Sheet>` for all add/edit forms. On success: close the sheet and call `queryClient.invalidateQueries`. On destructive actions (soft-delete): show `<AlertDialog>` for confirmation first.

### Motion

Use transitions on `transform` and `opacity` only — never on `background-color` or `color` directly (use opacity intermediaries for those). Button press: `active:scale-[0.98]` with `transition-transform duration-[150ms]`. Spring easing for scale lifts: `cubic-bezier(0.34, 1.56, 0.64, 1)`.

## Sidebar state

Syndic sidebar collapse state lives in Zustand (`src/lib/stores/sidebar.ts`), persisted to `localStorage` key `syndic-sidebar-collapsed`. Mobile nav uses a shadcn `Sheet` with local React state — not Zustand.

## Realtime notification bell

The unread count badge derives from TanStack Query cache (`['notifications']`). Never manage the count in separate local state. The `useNotificationsRealtime` hook in `src/hooks/use-notifications-realtime.ts` handles invalidation — call it once in `(owner)/layout.tsx`.
