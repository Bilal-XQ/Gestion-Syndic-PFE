# Syndic — Theme & Color Palette

**Version:** 1.0  
**Last updated:** March 3, 2026  
**Applies to:** Dashboard, Owner Portal, Landing Page  

> This document is the single source of truth for all visual design decisions in the Syndic web app. Every developer, AI agent, or designer working on the UI must follow these tokens exactly. No ad-hoc color values are permitted outside of this system.

---

## Design Philosophy

The Syndic visual identity is built on one principle: **refined restraint**. The palette draws from the reference dashboard — a pure near-black base with layered grey cards, hairline borders, and white typography. There are no accent colors for decoration. Color is used only to carry meaning (status, action, data). Both dark and light modes share the same neutral grey architecture — only the contrast direction flips.

**Aesthetic keywords:** Editorial dark, premium SaaS, monochromatic depth, typographic hierarchy, surgical whitespace.

---

## Typography

Typography is the loudest design element. Two pairings are defined: one for the landing page (display + body), one for the dashboard (functional + data).

### Landing Page

| Role | Family | Weight | Usage |
|---|---|---|---|
| Display / Hero | `Instrument Serif` | 400, 400i | H1 headlines, section titles |
| UI / Labels | `Syne` | 600, 700, 800 | Section badges, stat numbers, nav brand |
| Body / Prose | `DM Sans` | 300, 400, 500 | Body copy, CTAs, captions |

**Rationale:** `Instrument Serif` brings editorial warmth and luxury to large display text. `Syne` is geometrically bold for UI accents. `DM Sans` is optically balanced and highly legible at small sizes.

### Dashboard

| Role | Family | Weight | Usage |
|---|---|---|---|
| Primary UI | `Geist Sans` | 400, 500, 600 | All nav, labels, body text |
| Numeric Data | `Geist Mono` | 400, 500 | Amounts, dates, reference numbers |

**Rationale:** `Geist` matches the reference dashboard's clean sans-serif system. Mono for financial figures prevents character-width jitter in tables.

### Type Scale

| Token | Size | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|
| `--text-xs` | 11px | 1.5 | +0.02em | Table metadata, timestamps |
| `--text-sm` | 12px | 1.5 | +0.01em | Labels, badges, captions |
| `--text-base` | 14px | 1.6 | -0.01em | Body, nav links, form fields |
| `--text-md` | 16px | 1.5 | -0.02em | Card values, sub-headings |
| `--text-lg` | 18px | 1.4 | -0.02em | Section sub-headings |
| `--text-xl` | 22px | 1.3 | -0.03em | Dashboard metric numbers |
| `--text-2xl` | 28px | 1.2 | -0.03em | Page headings |
| `--text-display` | clamp(44px, 5.5vw, 76px) | 1.05 | -0.03em | Landing H1 |

---

## Color System

### Core Palette — Dark Mode (Default)

Extracted and extrapolated from the reference dashboard.

#### Backgrounds

| Token | Hex | Usage |
|---|---|---|
| `--bg-base` | `#0A0A0A` | Root page background — absolute near-black |
| `--bg-subtle` | `#111111` | Sidebar, page sections with slight lift |
| `--bg-card` | `#161616` | All cards, panels, metric boxes |
| `--bg-card-hover` | `#1C1C1C` | Card hover state |
| `--bg-elevated` | `#1F1F1F` | Modals, dropdowns, tooltips, popovers |
| `--bg-overlay` | `rgba(10,10,10,0.85)` | Frosted navbar on scroll, sheet backdrops |
| `--bg-input` | `#141414` | Form inputs, textareas, select fields |

#### Borders

| Token | Hex | Usage |
|---|---|---|
| `--border-subtle` | `#1E1E1E` | Card inner separators, table row dividers |
| `--border-default` | `#2A2A2A` | Card outer borders, input borders |
| `--border-strong` | `#3A3A3A` | Hover state borders, focused inputs |
| `--border-focus` | `#555555` | Keyboard-focused elements |

#### Text

| Token | Hex | Usage |
|---|---|---|
| `--text-primary` | `#FFFFFF` | Headlines, metric values, active nav |
| `--text-secondary` | `#A0A0A0` | Body copy, inactive nav labels, subtitles |
| `--text-muted` | `#636363` | Captions, timestamps, helper text |
| `--text-placeholder` | `#404040` | Input placeholder text |
| `--text-disabled` | `#333333` | Disabled elements |

#### Interactive

| Token | Hex | Usage |
|---|---|---|
| `--btn-primary-bg` | `#FFFFFF` | Primary CTA background |
| `--btn-primary-text` | `#0A0A0A` | Primary CTA text |
| `--btn-primary-hover` | `rgba(255,255,255,0.92)` | Primary hover state |
| `--btn-secondary-bg` | `transparent` | Ghost button background |
| `--btn-secondary-border` | `#2A2A2A` | Ghost button border |
| `--btn-secondary-hover-bg` | `rgba(255,255,255,0.04)` | Ghost button hover fill |
| `--btn-secondary-hover-border` | `#3A3A3A` | Ghost button hover border |

#### Accent Color — Amber Gold

| Token | Dark Hex | Light Hex | Usage |
|---|---|---|---|
| `--accent` | `#D4A853` | `#8B6520` | Icon hover, step numbers, active states |
| `--accent-muted` | `#A07A32` | `#6B4E18` | Subdued accent text |
| `--accent-bg` | `rgba(212,168,83,0.08)` | `rgba(139,101,32,0.08)` | Badge backgrounds, icon bg on hover |
| `--accent-border` | `rgba(212,168,83,0.18)` | `rgba(139,101,32,0.20)` | Badge borders, card borders |
| `--accent-glow` | `rgba(212,168,83,0.12)` | `rgba(139,101,32,0.12)` | Radial glow backgrounds |

#### Status & Semantic

| Token | Hex | Usage |
|---|---|---|
| `--status-success` | `#22C55E` | "Done" badge, positive trend |
| `--status-success-bg` | `rgba(34,197,94,0.10)` | "Done" badge background |
| `--status-success-border` | `rgba(34,197,94,0.20)` | "Done" badge border |
| `--status-warning` | `#F59E0B` | Overdue warnings, attention state |
| `--status-warning-bg` | `rgba(245,158,11,0.10)` | Warning badge background |
| `--status-error` | `#EF4444` | Destructive actions, negative trends |
| `--status-error-bg` | `rgba(239,68,68,0.10)` | Error badge background |
| `--status-neutral` | `#888888` | "In Process" badge text |
| `--status-neutral-bg` | `rgba(136,136,136,0.12)` | "In Process" badge background |

#### Data Visualization (Charts)

| Token | Hex | Usage |
|---|---|---|
| `--chart-line` | `rgba(255,255,255,0.50)` | Primary chart line stroke |
| `--chart-fill-top` | `rgba(255,255,255,0.15)` | Area chart fill top |
| `--chart-fill-bottom` | `transparent` | Area chart fill bottom |
| `--chart-grid` | `rgba(255,255,255,0.05)` | Chart grid lines |
| `--chart-tooltip-bg` | `#1F1F1F` | Chart tooltip background |
| `--chart-tooltip-border` | `#2A2A2A` | Chart tooltip border |
| `--chart-series-1` | `#FFFFFF` | Primary data series |
| `--chart-series-2` | `#636363` | Secondary data series |

#### Decorative / Glow

| Token | Value | Usage |
|---|---|---|
| `--glow-soft` | `rgba(255,255,255,0.06)` | Subtle section glow, card hover shimmer |
| `--glow-faint` | `rgba(255,255,255,0.03)` | Background orb radial gradients |
| `--grid-line` | `rgba(255,255,255,0.03)` | Hero section grid pattern |
| `--noise-opacity` | `0.025` | SVG noise overlay opacity |

---

### Core Palette — Light Mode

The light mode inverts the contrast direction while maintaining the same grey architecture. No warm or cool tinting — pure neutral grey.

#### Backgrounds

| Token | Hex | Usage |
|---|---|---|
| `--bg-base` | `#F7F7F5` | Root page background — warm off-white |
| `--bg-subtle` | `#EFEFED` | Sidebar, alternating sections |
| `--bg-card` | `#FFFFFF` | Cards, panels, metric boxes |
| `--bg-card-hover` | `#FAFAF9` | Card hover state |
| `--bg-elevated` | `#FFFFFF` | Modals, dropdowns |
| `--bg-overlay` | `rgba(247,247,245,0.90)` | Frosted navbar |
| `--bg-input` | `#FAFAF9` | Form inputs |

#### Borders

| Token | Hex | Usage |
|---|---|---|
| `--border-subtle` | `#EBEBEB` | Card inner separators, dividers |
| `--border-default` | `#E0E0E0` | Card outer borders, inputs |
| `--border-strong` | `#CCCCCC` | Hover borders, focused elements |
| `--border-focus` | `#AAAAAA` | Keyboard focus ring |

#### Text

| Token | Hex | Usage |
|---|---|---|
| `--text-primary` | `#0A0A0A` | Headlines, values, active nav |
| `--text-secondary` | `#5A5A5A` | Body copy, subtitles |
| `--text-muted` | `#9A9A9A` | Captions, helper text |
| `--text-placeholder` | `#BEBEBE` | Input placeholder |
| `--text-disabled` | `#D0D0D0` | Disabled state |

#### Interactive

| Token | Hex | Usage |
|---|---|---|
| `--btn-primary-bg` | `#0A0A0A` | Primary CTA |
| `--btn-primary-text` | `#FFFFFF` | Primary CTA text |
| `--btn-primary-hover` | `#1A1A1A` | Primary hover |
| `--btn-secondary-bg` | `transparent` | Ghost button |
| `--btn-secondary-border` | `#D4D4D4` | Ghost button border |
| `--btn-secondary-hover-bg` | `rgba(0,0,0,0.04)` | Ghost hover fill |
| `--btn-secondary-hover-border` | `#AAAAAA` | Ghost hover border |

#### Status & Semantic (Light)

| Token | Hex | Usage |
|---|---|---|
| `--status-success` | `#16A34A` | Done — deeper green for light bg contrast |
| `--status-success-bg` | `rgba(22,163,74,0.08)` | Done badge bg |
| `--status-warning` | `#D97706` | Warning |
| `--status-error` | `#DC2626` | Error / destructive |
| `--status-neutral` | `#6B6B6B` | In Process |
| `--status-neutral-bg` | `rgba(107,107,107,0.10)` | In Process bg |

#### Data Visualization (Light)

| Token | Value | Usage |
|---|---|---|
| `--chart-line` | `rgba(0,0,0,0.40)` | Chart line |
| `--chart-fill-top` | `rgba(0,0,0,0.08)` | Area chart fill top |
| `--chart-grid` | `rgba(0,0,0,0.05)` | Grid lines |
| `--grid-line` | `rgba(0,0,0,0.04)` | Hero grid pattern |
| `--noise-opacity` | `0.015` | Noise overlay |

---

## Gradients

### Landing Page — Hero Gradients

| Token | Value | Usage |
|---|---|---|
| `--grad-hero-top` (dark) | `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,255,255,0.08), transparent 60%)` | Top-center hero glow |
| `--grad-hero-top` (light) | `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0,0,0,0.05), transparent 60%)` | Same glow, inverted |
| `--grad-hero-side` (dark) | `radial-gradient(ellipse 60% 40% at 80% 80%, rgba(255,255,255,0.03), transparent 50%)` | Bottom-right ambient |
| `--grad-shimmer-text` (dark) | `linear-gradient(90deg, #FFF, #888, #FFF, #888, #FFF)` | Animated shimmer on display text |
| `--grad-shimmer-text` (light) | `linear-gradient(90deg, #0A0A0A, #5A5A5A, #0A0A0A, #5A5A5A, #0A0A0A)` | Same, inverted |

### Dashboard — Card Gradients

| Token | Value | Usage |
|---|---|---|
| `--grad-card-shine` (dark) | `linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 60%)` | Subtle card top-left shine |
| `--grad-metric-positive` | `linear-gradient(135deg, #22C55E, #16A34A)` | Positive metric value highlight |
| `--grad-metric-negative` | `linear-gradient(135deg, #EF4444, #DC2626)` | Negative metric highlight |

---

## Spacing & Radius

### Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-xs` | `6px` | Badges, chips, small tags |
| `--radius-sm` | `8px` | Buttons (compact), input corners |
| `--radius-md` | `10px` | Standard buttons, dropdowns |
| `--radius-lg` | `12px` | Cards (small), panels |
| `--radius-xl` | `16px` | Feature cards, modals |
| `--radius-2xl` | `20px` | Dashboard metric cards, chart panels |
| `--radius-full` | `9999px` | Pills, avatars, toggle switches |

### Spacing Scale

| Token | Value | Usage |
|---|---|---|
| `--space-1` | `4px` | Micro gaps between inline elements |
| `--space-2` | `8px` | Icon-to-label gap, badge padding |
| `--space-3` | `12px` | Input padding (vertical), row padding |
| `--space-4` | `16px` | Card padding (compact), nav item gap |
| `--space-5` | `20px` | Card padding (standard) |
| `--space-6` | `24px` | Section inner padding |
| `--space-8` | `32px` | Card padding (generous), heading margin |
| `--space-10` | `40px` | Section gap between components |
| `--space-12` | `48px` | Large section rhythm |
| `--space-16` | `64px` | Section vertical padding |
| `--space-20` | `80px` | Section vertical padding (large) |
| `--space-24` | `96px` | Section spacing (landing page) |
| `--space-30` | `120px` | Hero vertical padding |

---

## Shadows

| Token | Value | Usage |
|---|---|---|
| `--shadow-xs` | `0 1px 3px rgba(0,0,0,0.3)` | Micro lift (dark) |
| `--shadow-sm` | `0 4px 16px rgba(0,0,0,0.4)` | Dropdown, small popover |
| `--shadow-md` | `0 8px 32px rgba(0,0,0,0.5)` | Card hover, modal backdrop |
| `--shadow-lg` | `0 24px 64px rgba(0,0,0,0.6)` | Dashboard card floating effect |
| `--shadow-hero-card` (dark) | `0 40px 120px rgba(0,0,0,0.8), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)` | Hero dashboard preview card |
| `--shadow-hero-card` (light) | `0 40px 120px rgba(0,0,0,0.12), 0 8px 32px rgba(0,0,0,0.06)` | Same in light mode |

---

## Animation & Motion

### Principles

- **Purposeful:** Motion communicates state change, not decoration.
- **Fast exits, slow entrances:** Elements leave at 150–200ms, enter at 400–700ms.
- **Spring-based scale:** Use `cubic-bezier(0.34, 1.56, 0.64, 1)` for any scale or y-lift to give a premium elastic feel.
- **Never animate color directly:** Use opacity and transform only for performance.

### Durations

| Token | Value | Usage |
|---|---|---|
| `--duration-fast` | `150ms` | Hover color transitions, border changes |
| `--duration-base` | `250ms` | Button states, icon transitions |
| `--duration-slow` | `400ms` | Theme switch, card reveal |
| `--duration-enter` | `600–700ms` | Scroll-triggered section reveals |
| `--duration-float` | `6000ms` | Hero dashboard float animation |

### Easing

| Token | Value | Usage |
|---|---|---|
| `--ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard transitions |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Scale lifts on cards, button press |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering the viewport |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Elements exiting |

### Key Animations

| Name | Behaviour | Used on |
|---|---|---|
| `fadeUp` | `opacity 0→1, translateY 28px→0` | All scroll-reveal sections |
| `float` | `translateY 0→-12px→-6px→0` + micro-rotate | Hero dashboard card |
| `floatSlow` | `translateY 0→-8px→0` | Floating notification badges |
| `shimmer` | `background-position -200%→200%` | Display text gradient shimmer |
| `pulse` | `opacity 0.4→0.8, scale 1→1.05` | Background glow orbs, live badges |
| `drawLine` | `stroke-dashoffset 1000→0` | Chart line draw-on entrance |
| `scanline` | `translateY -100%→100vh` | Optional background decorative scan |

### Scroll Reveal Pattern

Every major landing page section uses an `IntersectionObserver` at threshold `0.12`. Elements carry class `fade-up` and receive class `visible` on intersection, triggering the `fadeUp` transition. Stagger children with `transition-delay: 0.1s` increments per child (max `0.5s`).

---

## Component-Specific Guidelines

### Dashboard Metric Cards
- Background: `--bg-card`
- Border: `1px solid --border-subtle`
- Border radius: `--radius-2xl`
- Padding: `--space-5` (20px)
- Value typography: `Geist Sans` 600 at `--text-xl`
- Sub-label: `--text-secondary` at `--text-sm`
- Trend up: `--status-success`
- Trend down: `--status-error`
- No shadow at rest; `--shadow-md` on hover

### Sidebar
- Background: `--bg-subtle`
- Border right: `1px solid --border-subtle`
- Active nav item: `--bg-card` with `--border-default` left accent `2px`
- Active nav text: `--text-primary`
- Inactive nav text: `--text-muted`
- Hover: `background --bg-card` at `150ms`

### Tables
- Header background: `--bg-subtle`
- Header text: `--text-muted` uppercase, `--text-xs`, letter-spacing `+0.08em`
- Row border: `1px solid --border-subtle`
- Row hover: `background --bg-card-hover`
- Selected row: `background rgba(255,255,255,0.04)` (dark) / `rgba(0,0,0,0.03)` (light)
- Zebra striping: disabled — use row hover only

### Badges / Status Pills
- Border radius: `--radius-full`
- Padding: `2px 10px`
- Font: `--text-xs`, weight 500
- Always use semantic bg + border + text tokens together (never mix)
- "Done": success tokens
- "In Process": neutral tokens
- Overdue: warning tokens

### Buttons
- Primary: `--btn-primary-bg` fill, `--radius-md`, `--space-3` vertical / `--space-5` horizontal, weight 500
- Ghost/Secondary: transparent, `--border-default` border, hover fills `--btn-secondary-hover-bg`
- All buttons: `--duration-base` transition on transform + shadow; spring easing on press (active state `scale(0.98)`)
- Disabled: `opacity 0.4`, `cursor not-allowed`, no hover effect

### Inputs / Form Fields
- Background: `--bg-input`
- Border: `1px solid --border-default`
- Focus border: `--border-focus`, `box-shadow: 0 0 0 3px rgba(255,255,255,0.06)` (dark)
- Border radius: `--radius-md`
- Font: `--text-base`, `--text-primary`
- Placeholder: `--text-placeholder`
- Padding: `10px 14px`

### Modals / Sheets (shadcn Sheet)
- Background: `--bg-elevated`
- Border: `1px solid --border-default`
- Backdrop: `--bg-overlay` with `backdrop-filter: blur(16px) saturate(1.5)`
- Border radius: `--radius-xl` on inset side
- Shadow: `--shadow-lg`

### Charts (Recharts)
- All chart tokens defined above under Data Visualization
- Tooltip: `--chart-tooltip-bg`, `--chart-tooltip-border`, `--radius-lg`, `--shadow-sm`
- Area fill always uses a vertical gradient from `--chart-fill-top` to transparent
- No axis tick lines — only horizontal grid lines in `--chart-grid`
- Animation on mount: `drawLine` for line/area, 1500ms duration

---

## Theme Switch Behaviour

- Transition duration: `400ms ease` on `background`, `color`, `border-color`
- Implemented via a `data-theme="dark|light"` attribute on `<html>`
- All tokens resolved via CSS custom properties scoped to `:root[data-theme="dark"]` and `:root[data-theme="light"]`
- The toggle button lives in the navbar on the landing page and in the dashboard top bar
- User preference persists in `localStorage` under key `syndic-theme`
- On first load, respect `prefers-color-scheme` system setting; thereafter use stored preference

---

## Landing Page — Section Colour Usage

| Section | Background | Note |
|---|---|---|
| Navbar (transparent) | `transparent` | Switches to `--bg-overlay` + blur on scroll |
| Hero | `--bg-base` | Top glow gradient + grid overlay |
| Features | `--bg-base` | Standard base, no section contrast |
| Stats bar | `--bg-subtle` | Bordered top and bottom `--border-subtle` |
| Testimonials | `--bg-base` | Card bg `--bg-card` |
| Pricing | `--bg-subtle` | Highlighted plan card uses `--bg-card` with `--border-strong` |
| CTA Banner | `--bg-card` | Full-width, bordered section |
| Footer | `--bg-subtle` | `--text-muted` for links |

---

## Forbidden Patterns

These are explicitly disallowed in the Syndic design system:

- ❌ Any blue, purple, or brand-color accent for UI chrome (these are not part of the system)
- ❌ Storing semantic meaning in hard-coded hex values inside components (always use tokens)
- ❌ Solid white backgrounds in dark mode (use `--bg-card` at most)
- ❌ Inter, Roboto, or Arial as font choices
- ❌ Gradient backgrounds with multiple hues (only monochromatic grey gradients)
- ❌ Box shadows with color (only black with varying opacity)
- ❌ Animating `background-color`, `color`, or `border-color` with values other than `150–250ms ease`
- ❌ Zebra row striping in tables
- ❌ Border radius values not in the defined scale
