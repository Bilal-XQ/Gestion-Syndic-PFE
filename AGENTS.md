# AGENTS.md — Syndic HOA Management App

This file defines the rules and architecture of the repository.  
GitHub Copilot and other AI coding agents MUST read this file before generating or modifying code.

Full product specification: `docs/PRD.md`
Design system: `docs/THEME.md`
Known failure patterns: `docs/ai-lessons.md`
Scoped coding rules: `.github/instructions/`
Reusable task playbooks: `.github/skills/`

---

## What this project is

A full-stack Next.js 16 web application for condominium management. Two strictly separated user roles:

- **`syndic`** — property manager. Protected routes under `/dashboard/*`.
- **`proprietaire`** — co-owner. Protected routes under `/portal/*`.

Single login form. The server resolves the role from the JWT and redirects. No role selector.

## Technology

Next.js 16.1.6 · React 19.2.3 · TypeScript 5.9.0 · Tailwind CSS 4.2.1 · shadcn/ui (Tailwind v4 canary)
Drizzle ORM 0.45.1 · @supabase/supabase-js 2.98.0 · @supabase/ssr (latest)
Zod 4.3.6 · React Hook Form 7.x · @hookform/resolvers 5.2.2
TanStack Query v5 · Zustand 5.9.0 · @react-pdf/renderer 4.3.2
Nodemailer (Gmail SMTP) + @react-email/components · @upstash/ratelimit · Sentry Next.js SDK
date-fns 4.1.0 · sonner 2.0.7 · lucide-react 0.575.0

Package manager: **pnpm**. Versions are locked by `docs/PRD.md`. Do not suggest upgrades.

## Non-negotiable rules

1. Derived financial values (`amount_paid`, `remaining_amount`, charge `status`) are never stored as columns. Always computed at query time from `payments`.
2. No hard deletes. Soft-delete only via `deleted_at` timestamp.
3. All writes to `payments` execute inside a Drizzle transaction.
4. Role is read from `session.user.app_metadata.user_role` (JWT only). No DB query in middleware.
5. Supabase clients are imported only from `src/utils/supabase/{server,client,middleware}.ts`.
6. Audit logs (`audit_logs`) are immutable. Insert in the same Server Action, outside any transaction.
7. One Zod schema per domain in `src/lib/validations/`. Shared between React Hook Form and the Server Action.
8. All list queries include `WHERE deleted_at IS NULL`. Use helpers in `src/lib/db/queries/`.
9. `"use client"` on page files is forbidden. Pages are Server Components. Extract interactive parts into Client Components under `src/components/features/`.
10. Server Action return shape: `{ success: true; data: T } | { success: false; error: string }`. Never throw.

## Key file locations

```
src/lib/actions/         Server Actions (one file per domain)
src/lib/db/schema.ts     Drizzle schema (single file — all tables)
src/lib/db/queries/      Query helpers (always filter deleted_at)
src/lib/validations/     Zod schemas (one per domain)
src/utils/supabase/      Supabase client utilities (only valid instantiation points)
src/hooks/               Custom hooks (useNotificationsRealtime)
src/components/features/ Feature-specific components
docs/ai-lessons.md       Known AI failure patterns — read before starting any task
```

## Available skills (invoke for complex tasks)

| Skill | When to use |
|---|---|
| `.github/skills/drizzle-migration/SKILL.md` | Adding or changing any table, column, index, or constraint |
| `.github/skills/supabase-rls/SKILL.md` | Writing or auditing RLS policies on any table |
| `.github/skills/shadcn/SKILL.md` | Creating or modifying shadcn/ui components |

To use a skill: include the path in your Copilot prompt, e.g. _"Use the drizzle-migration skill in `.github/skills/drizzle-migration/SKILL.md`"_.
