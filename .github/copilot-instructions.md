# Syndic — Copilot Instructions

Before any task, read `docs/ai-lessons.md` for known failure patterns in this codebase.
Full architecture reference: `docs/PRD.md`. Design tokens: `docs/THEME.md`.
Scoped instruction files in `.github/instructions/` apply automatically by file path.

## Stack (versions are locked — never suggest upgrades)

Next.js 16.1.6 · React 19.2.3 · TypeScript 5.9.0 · Tailwind CSS 4.2.1 · shadcn/ui (Tailwind v4 canary)
Drizzle ORM 0.45.1 · @supabase/supabase-js 2.98.0 · @supabase/ssr (latest)
Zod 4.3.6 · React Hook Form 7.x · @hookform/resolvers 5.2.2
TanStack Query v5 · Zustand 5.9.0 · @react-pdf/renderer 4.3.2
Resend + @react-email/components · @upstash/ratelimit · Sentry Next.js SDK
date-fns 4.1.0 · sonner 2.0.7 · lucide-react 0.575.0 · recharts 3.7.0

## Absolute Rules

1. **No stored derived values.** `amount_paid`, `remaining_amount`, charge `status` are always computed via SQL aggregation over `payments`. Adding them as columns causes data drift when payments are corrected.
2. **No hard deletes.** Owners, charges, apartments, meetings: soft-delete via `deleted_at = now()` only. Financial history must be preserved.
3. **Financial mutations require Drizzle transactions.** Any write to `payments` must use `db.transaction(async (tx) => { ... })`. Partial financial state is never acceptable.
4. **No DB queries in middleware.** Role is read from `session.user.app_metadata.user_role` (JWT claim only). One extra query per request at the edge is unacceptable at scale.
5. **Never instantiate Supabase clients inline.** Import exclusively from `src/utils/supabase/server.ts`, `client.ts`, or `middleware.ts`.
6. **Audit logs are immutable.** Insert in the same Server Action as the mutation but outside the transaction — so the record survives a rollback.
7. **One Zod schema per domain, shared client and server.** File in `src/lib/validations/`. Same instance for React Hook Form and the Server Action. Diverging schemas causes silent validation drift.
8. **All list queries must filter `deleted_at IS NULL`.** Use helpers in `src/lib/db/queries/` — never bypass them with raw queries.
9. **No role selector on the login page.** Single email + password form only. Role is resolved server-side from the JWT and redirected automatically.
10. **`"use client"` is a last resort.** Default to React Server Components. Add the directive only when the component genuinely requires browser APIs, event listeners, or reactive state.
