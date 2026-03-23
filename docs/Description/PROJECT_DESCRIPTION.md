# Syndic HOA Management Web Application - Developer Project Description

## 1) Executive Summary

Syndic is a full-stack condominium (HOA) management web application built to replace a legacy Microsoft Access desktop workflow with a modern, secure, role-based SaaS-style platform.

The product serves two strict personas:
- `syndic` (property manager) under `/dashboard/*`
- `proprietaire` (co-owner) under `/portal/*`

The application uses a single authentication entry point (`/login`) and resolves role-based routing from JWT claims issued by Supabase Auth. The system centralizes owner records, apartment operations, charges, payments, meetings, notifications, and reporting artifacts (PDF notices), while preserving auditability and financial consistency.

## 2) Product Goals

- Replace manual and fragmented condo administration with one source of truth.
- Enforce strict data segregation between manager and owner experiences.
- Preserve financial integrity through transactional payment operations.
- Maintain complete history through soft-delete and immutable audit logs.
- Provide self-service owner access for profile, payments, invitations, and notifications.

## 3) Current Technical Stack

Core runtime and framework:
- Next.js `16.2.0` (App Router)
- React `19.2.3`
- TypeScript `5.9.3`

UI and frontend tooling:
- Tailwind CSS `4.2.1`
- shadcn/ui (Tailwind v4 compatible)
- Radix UI primitives
- next-intl (multilingual support)
- TanStack Query v5 (client caching)
- Zustand `5.0.11` (UI state)

Backend and data:
- Supabase Auth + Postgres + Realtime
- Drizzle ORM `0.45.1`
- Drizzle Kit for migrations

Integrations:
- Nodemailer (SMTP Gmail) + React Email (transactional email)
- @react-pdf/renderer `4.3.2` (formal notices)
- Upstash Redis + @upstash/ratelimit (login throttling)
- Sentry Next.js SDK (error tracking)

Package manager and scripts:
- pnpm workspace root execution

## 4) High-Level Architecture

### Application style

- Monorepo-style single Next.js application with integrated frontend and backend.
- Server-first architecture (React Server Components by default).
- Client components used only for interactions that require browser state/events.

### Data flow model

- UI pages render from server data and/or client-side query caches.
- Mutations are performed through Server Actions and selected route handlers.
- Payment writes are wrapped in Drizzle transactions to prevent partial state.
- Derived financial totals are computed at query time from payments, never persisted.

### Auth and authorization model

- Supabase Auth issues JWT containing `user_role` claim in `app_metadata`.
- Middleware validates session and role before route access.
- `/dashboard/*` strictly for `syndic`.
- `/portal/*` strictly for `proprietaire`.
- No role selector in login UI.

## 5) Security Model and Non-Negotiable Invariants

The codebase follows strict rules that affect design and implementation:

1. No stored derived finance fields.
- `amount_paid`, `remaining_amount`, and computed charge status are query-derived.

2. No hard deletes for business entities.
- Owners, apartments, charges, meetings, etc. use `deleted_at` soft-delete strategy.

3. Financial writes are transactional.
- Any mutation touching payments must run inside `db.transaction`.

4. Middleware does not query the database for role.
- Role is read from JWT claim only.

5. Supabase clients are centralized utilities.
- Client creation is restricted to `src/utils/supabase/*` helpers.

6. Audit logs are immutable.
- Insert-only records, written in mutation flow and never modified.

7. Shared domain validation.
- One Zod schema per domain in `src/lib/validations`, reused client + server.

8. Soft-delete filtering is mandatory in list helpers.
- Query helpers under `src/lib/db/queries` are expected to filter `deleted_at IS NULL`.

## 6) Functional Scope by Role

### Syndic scope (`/dashboard/*`)

- Owner management: create/edit/list/soft-delete owners.
- Apartment management: create/edit/list/soft-delete with occupancy transitions.
- Charge management: create/list/remind/soft-delete charges.
- Payment oversight: global payment history and summary metrics.
- Meeting management: create meetings, invite owners, track responses.
- Building/settings administration.
- Dashboard overview cards and unpaid/overdue visibility.

### Proprietaire scope (`/portal/*`)

- Profile view with constrained edits (e.g., phone).
- Payment obligations and history.
- Payment submission for assigned charges.
- Meeting invitation review and response actions.
- Notifications center with read/unread behavior.
- Owner-focused overview and self-service access patterns.

## 7) Implemented Route Structure (App Router)

Root app files:
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/loading.tsx`
- `src/app/error.tsx`
- `src/app/global-error.tsx`
- `src/app/not-found.tsx`

Route groups:
- `src/app/(auth)` - login and password reset
- `src/app/(syndic)` - dashboard area
- `src/app/(owner)` - owner portal area

Syndic route subtree (current structure):
- `src/app/(syndic)/dashboard/page.tsx`
- `src/app/(syndic)/dashboard/owners/*`
- `src/app/(syndic)/dashboard/apartments/*`
- `src/app/(syndic)/dashboard/charges/*`
- `src/app/(syndic)/dashboard/payments/*`
- `src/app/(syndic)/dashboard/meetings/*`
- `src/app/(syndic)/dashboard/immeubles/*`
- `src/app/(syndic)/dashboard/settings/*`

Owner route subtree (current structure):
- `src/app/(owner)/portal/page.tsx`
- `src/app/(owner)/portal/meetings/*`
- `src/app/(owner)/payments/page.tsx`
- `src/app/(owner)/notifications/page.tsx`

API route handlers (selected):
- `src/app/api/owners/*`
- `src/app/api/apartments/*`
- `src/app/api/charges/*`
- `src/app/api/payments/*`
- `src/app/api/meetings/*`
- `src/app/api/notifications/*`
- `src/app/api/portal/*`

## 8) Backend and Domain Layer Organization

Server Actions:
- Located under `src/lib/actions`.
- Separated by domain (auth, owners, apartments, charges, payments, meetings, notifications, settings, portal).
- Expected return contract pattern:
  - `{ success: true, data: ... }`
  - `{ success: false, error: string }`

Database layer:
- Schema: `src/lib/db/schema.ts`
- DB client/index: `src/lib/db/index.ts`
- Query helpers: `src/lib/db/queries/*`

Core schema tables currently defined:
- `users`
- `buildings`
- `apartments`
- `owners`
- `charges`
- `payments`
- `meetings`
- `meeting_invitations`
- `notifications`
- `audit_logs`

## 9) Data Model Behavior (Developer-Critical)

### Ownership and apartment lifecycle

- Owner records link user accounts to apartment units.
- Apartment occupancy status transitions are managed through owner assignment logic.

### Charges and payments

- A charge stores canonical debt metadata (title/category/amount/due date/etc.).
- Paid/remaining/status are derived by aggregating related payments.
- Partial payments are supported by design.

### Meetings and invitations

- Meetings are created by syndic and linked to owner invitations.
- Invitation status evolves (`invited`, `accepted`, `declined`) with response timestamp.

### Notifications

- Notification feed is role-specific and owner-centric for portal users.
- Read states are tracked and updated as user actions occur.

### Audit logs

- Track sensitive mutations for traceability and accountability.
- Treated as immutable records.

## 10) Internationalization and Localization

Locale configuration is centralized in `src/i18n/config.ts`:
- Supported locales: `fr`, `en`, `ar`
- Default locale: `fr`
- RTL locale(s): `ar`

Message bundles exist under:
- `messages/fr/*`
- `messages/en/*`
- `messages/ar/*`

Domain-based message files include categories such as:
- auth, dashboard, portal, owners, apartments, charges, payments, meetings, notifications, settings, common, validation

## 11) Real-Time and State Management

- TanStack Query manages cache + invalidation for client-facing data sets.
- Supabase Realtime is used for push-style notification updates.
- Zustand is used for UI-centric state (e.g., sidebar collapse behavior).
- Server Components are preserved whenever possible for performance and simplicity.

## 12) Email and Document Generation

Transactional email:
- Welcome onboarding messages
- Payment reminders and domain notifications
- Invitation communication flows

PDF generation:
- Formal payment notices rendered with `@react-pdf/renderer`
- Includes owner identity, apartment details, charge values, and building contact details

## 13) Observability and Error Handling

- Sentry integration captures runtime and production errors.
- App-level error boundaries:
  - Root and global error boundaries
  - Route-group loading/error boundaries
- `not-found.tsx` and structured loading UI are included for robust UX.

## 14) Environment Variables

Template source: `.env.example`

Expected variables include:
- Supabase:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Database:
  - `DATABASE_URL` (Drizzle migrations)
- Upstash:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
- Email SMTP:
  - `GMAIL_USER`
  - `GMAIL_APP_PASSWORD`
- App URL:
  - `APP_URL`
- Sentry:
  - `SENTRY_DSN`
  - `SENTRY_AUTH_TOKEN`

## 15) Developer Workflow

Install dependencies:
- `pnpm install`

Run development server:
- `pnpm dev`

Build production artifacts:
- `pnpm build`

Start production mode locally:
- `pnpm start`

Type-check:
- `pnpm tsc --noEmit`

Lint:
- `pnpm lint`

Test:
- `pnpm test`
- `pnpm test:run`

Database tasks:
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:studio`
- `pnpm db:seed`

Admin CLI tasks:
- `pnpm admin:create-syndic`
- `pnpm admin:create-proprietaire`
- `pnpm admin:set-role`
- `pnpm admin:reset-users`

## 16) Repository Structure (Developer Navigation)

Top-level high-signal folders:
- `src/app` - routes, layouts, boundaries
- `src/components` - UI and feature components
- `src/lib/actions` - server mutation/read orchestration
- `src/lib/db` - schema, DB config, query helpers
- `src/lib/validations` - shared Zod schemas
- `src/utils/supabase` - approved client instantiation points
- `messages` - i18n dictionaries by locale and domain
- `drizzle` - SQL migrations and snapshots
- `docs` - requirements, plans, technical/user docs, lessons learned

## 17) Deployment and Runtime Notes

- Built for Next.js server/runtime deployment (commonly Vercel).
- Supabase is the managed backend (Auth + Postgres + Realtime).
- Upstash and SMTP credentials are optional locally but expected for full production behavior.
- Sentry source map and runtime integration should be configured for production observability.

## 18) Practical Guidance for New Developers

1. Read requirements first.
- Start with `docs/PRD.md` as the source of truth.

2. Respect invariants.
- Never persist derived financial fields.
- Never hard-delete business entities.
- Always use transactions for payment writes.

3. Keep role boundaries explicit.
- Dashboard and portal concerns should stay separated.

4. Reuse domain layers.
- Prefer existing query helpers, validations, and action patterns over ad hoc logic.

5. Keep server-first architecture.
- Add client components only for truly interactive needs.

6. Preserve auditability.
- Sensitive mutations should leave immutable audit footprints.

## 19) Current Maturity Snapshot

This project is beyond a starter foundation: it contains a complete role-based architecture, multi-domain business logic, multilingual support, operational tooling, and production-grade concerns (security, observability, rate limiting, transactions, and audit trails). It is structured for maintainability with clear domain separation and strong backend invariants.

## Appendix) Recent Updates — March 23, 2026

Reference commits:
- `56dc708` — feat: enhance notification system with new messages and types for payments and meetings
- `f94d1fa` — feat: add request mocking documentation for playwright-cli
- `e789cbb` — feat: add @next/env dependency and project description documentation

Implementation updates:

1. Notification rendering is now locale-driven and key-based for payment/meeting items (`fr/en/ar`).
2. Meeting invitation notifications now persist metadata (`meetingTitle`, `meetingDate`, `invitationId`) for proper multilingual rendering.
3. Email transport is centralized through SMTP (`nodemailer`) while keeping React Email templates.
4. Canonical URL generation for emails uses `APP_URL` to avoid localhost links in production.
5. Hydration robustness improved by removing non-deterministic render output in sidebar skeleton and adding targeted suppression against extension-injected attributes.
6. Owner creation flow now surfaces partial-success feedback (`owner created` + `welcome email failed`) in the UI.
7. Final consistency pass removed residual Resend references from docs/tests/env templates and standardized on shared SMTP (`sendEmail`) terminology.

---

For canonical requirements and business constraints, always refer back to `docs/PRD.md` and `AGENTS.md`.
