# Phase 6 — Polish and Deployment

**Status:** Planned  
**Prerequisite:** Phase 5 complete (26 routes, 80 tests passing)  
**Scope source:** `docs/PRD.md` → "Phase 6 — Polish and Deployment"

---

## Pre-Planning Audit Results (via Supabase MCP + file inspection)

### Loading.tsx Audit

| Route | loading.tsx | Content |
|---|---|---|
| `/` (root) | **MISSING** | — |
| `(auth)/login` | **MISSING** | — |
| `(auth)/reset-password` | **MISSING** | — |
| `(syndic)/dashboard` | Exists | Proper skeleton (4 metric cards + table) |
| `(syndic)/dashboard/owners` | Exists | Proper skeleton (heading + button + table) |
| `(syndic)/dashboard/apartments` | Exists | Proper skeleton (heading + button + table) |
| `(syndic)/dashboard/charges` | Exists | Proper skeleton (heading + button + table) |
| `(syndic)/dashboard/meetings` | Exists | Proper skeleton (heading + button + table) |
| `(syndic)/dashboard/meetings/[id]` | Exists | Proper skeleton (heading + detail card + table) |
| `(syndic)/dashboard/payments` | Exists | Proper skeleton (heading + 3 summary cards + table) |
| `(syndic)/dashboard/settings` | Exists | Proper skeleton (heading + form card) |
| `(owner)/portal` | Exists | Proper skeleton (heading + 2-column grid) |
| `(owner)/payments` | Exists | Proper skeleton (heading + tabs + table) |
| `(owner)/notifications` | Exists | Proper skeleton (heading + 5 notification cards) |

**Conclusion:** 11 existing loading.tsx files all have proper skeleton content. 3 loading.tsx and 2 error.tsx files are missing.

### Error.tsx Audit

| Route | error.tsx | Present? |
|---|---|---|
| `/` (root) | `src/app/error.tsx` | Yes (themed, with "Réessayer" button) |
| `global-error.tsx` | `src/app/global-error.tsx` | Yes (Sentry captureException) |
| `(auth)/login` | **MISSING** | — |
| `(auth)/reset-password` | **MISSING** | — |
| All syndic routes | Present | All 8 exist |
| All owner routes | Present | All 3 exist |

### Skeleton Component

`src/components/ui/skeleton.tsx` is already installed (shadcn canary). No need to install again.

### RLS Policy Audit (26 policies across 10 tables)

| Table | Policies | Notes |
|---|---|---|
| `users` | `syndic_read_users` (SELECT), `syndic_insert_users` (INSERT), `syndic_update_users` (UPDATE), `proprietaire_read_own_user` (SELECT), `proprietaire_update_own_user` (UPDATE) | Complete |
| `buildings` | `syndic_all_own_building` (ALL) | **GAP: No proprietaire SELECT policy** |
| `apartments` | `syndic_all_apartments` (ALL), `proprietaire_read_own_apartment` (SELECT) | Complete |
| `owners` | `syndic_all_owners` (ALL), `proprietaire_read_own_owner` (SELECT) | Complete |
| `charges` | `syndic_all_charges` (ALL), `proprietaire_read_own_charges` (SELECT) | Complete |
| `payments` | `syndic_read_all_payments` (SELECT), `syndic_insert_payments` (INSERT), `proprietaire_read_own_payments` (SELECT), `proprietaire_insert_own_payment` (INSERT) | Complete |
| `meetings` | `syndic_all_meetings` (ALL), `proprietaire_read_invited_meetings` (SELECT) | Complete |
| `meeting_invitations` | `syndic_all_invitations` (ALL), `proprietaire_read_own_invitations` (SELECT), `proprietaire_update_own_invitation` (UPDATE) | Complete |
| `notifications` | `syndic_insert_notifications` (INSERT), `proprietaire_read_own_notifications` (SELECT), `proprietaire_update_own_notifications` (UPDATE) | Complete |
| `audit_logs` | `syndic_read_audit_logs` (SELECT), `authenticated_insert_audit_logs` (INSERT) | Complete (no UPDATE/DELETE by design) |

**Critical gap:** The `buildings` table has no proprietaire SELECT policy. The portal profile API route (`/api/portal/profile`) calls `getBuildingById()` which uses the Drizzle `db` instance (direct Postgres connection via `DATABASE_URL`). This bypasses RLS because the Drizzle connection uses the Postgres user, not the anon key. **However**, the RLS policy must still be added as it is the required defense-in-depth layer per PRD and `.github/skills/supabase-rls/SKILL.md`.

### Custom Access Token Hook

`custom_access_token_hook` function **confirmed present** in the database.

### Realtime

`notifications` table **confirmed in** the `supabase_realtime` publication.

### Sentry Configuration

| Config file | tracesSampleRate | environment |
|---|---|---|
| `sentry.server.config.ts` | 1 (needs → 0.1) | Not set (needs adding) |
| `sentry.edge.config.ts` | 1 (needs → 0.1) | Not set (needs adding) |
| `src/instrumentation-client.ts` | 1 (needs → 0.1) | Not set (needs adding) |
| `next.config.ts` | — | org: "bilals-company", project: "syndic" — correct |

---

## Step 1: Create Missing loading.tsx and error.tsx Files (Code)

### Files to create

1. **`src/app/loading.tsx`** — Root loading skeleton  
   - Full-screen centered spinner or logo pulse animation
   - Uses `--bg-base` background, single centered `Skeleton` element
   - Pattern: Logo placeholder (`h-10 w-10 rounded-full`) + text placeholder (`h-4 w-32`)

2. **`src/app/(auth)/login/loading.tsx`** — Login page loading  
   - Centered card skeleton mimicking the login form layout
   - Pattern: Card with `--bg-card` background, `--border-default` border, `--radius-xl`
   - Inside: Logo placeholder, two input-height skeletons (`h-10`), one button-height skeleton (`h-10`)

3. **`src/app/(auth)/login/error.tsx`** — Login page error boundary  
   - Same pattern as existing `src/app/error.tsx` (French text, "Réessayer" button)
   - Uses `Sentry.captureException` via useEffect
   - Centered card layout matching login page visual style

4. **`src/app/(auth)/reset-password/loading.tsx`** — Reset password loading  
   - Centered card skeleton matching the reset password form
   - Pattern: Logo placeholder, one input skeleton, one button skeleton

5. **`src/app/(auth)/reset-password/error.tsx`** — Reset password error boundary  
   - Same pattern as login error.tsx

### Design tokens to use (from THEME.md)

- Background: `bg-[--bg-base]`
- Card: `bg-[--bg-card]` with `border border-[--border-subtle]`
- Skeleton blocks: `animate-pulse bg-[--bg-card]` (for root) or `animate-pulse bg-[--bg-elevated]` (inside cards)
- Round corners: `rounded-[20px]` for cards, `rounded-[10px]` for buttons/inputs, `rounded-[8px]` for headings

### Verification

- `pnpm build` compiles all routes without error
- Every route folder in (auth), (syndic), (owner) has both `loading.tsx` and `error.tsx`
- Visual: Navigate to each route — skeleton appears briefly before content loads

---

## Step 2: Responsiveness Audit and Fixes (Code)

### Approach

Audit every page at three breakpoints:
- **Mobile:** 375px width
- **Tablet:** 768px width  
- **Desktop:** 1280px width

### Files to audit (in order)

#### Syndic routes
1. `src/components/layout/sidebar.tsx` — verify collapse behavior on mobile (Sidebar-07 pattern)
2. `src/components/layout/top-bar.tsx` — verify hamburger trigger on mobile
3. `src/app/(syndic)/dashboard/page.tsx` + `src/components/features/dashboard/` — metric cards grid responsive
4. `src/components/features/owners/` — table horizontal scroll on mobile, Sheet panel full-width on mobile
5. `src/components/features/apartments/` — same table + Sheet audit
6. `src/components/features/charges/` — table, Sheet, PDF download button accessible on mobile
7. `src/components/features/meetings/` — list table + detail page responsive
8. `src/components/features/payments/` — syndic payments table with filters, summary cards

#### Owner routes
9. `src/components/layout/owner-sidebar.tsx` — portal navigation responsive
10. `src/components/layout/portal-top-bar.tsx` — notification bell, mobile layout
11. `src/components/features/portal/profile-view.tsx` — info cards stack on mobile, inline phone edit usable
12. `src/components/features/payments/owner-payments-view.tsx` — tabs, charges table, payment form Sheet
13. `src/components/features/payments/owner-payment-form.tsx` — Sheet form fields on mobile
14. `src/components/features/notifications/` — notification cards, accept/decline buttons touch-friendly

#### Auth routes
15. `src/app/(auth)/login/page.tsx` — centered card, max-width on desktop, full-width padding on mobile
16. `src/app/(auth)/reset-password/page.tsx` — same centered card audit

#### Landing page
17. `src/app/page.tsx` — hero section, features grid, stats bar, CTA

### Common fixes to apply (as needed)

- Tables: Add `overflow-x-auto` wrapper for horizontal scroll on mobile
- Grids: Ensure `grid-cols-1` at mobile, stepping up via `sm:` and `lg:`
- Sheet panels: Verify `side="right"` sheets are full-width on mobile (`w-full sm:w-[400px]`)
- Buttons in table rows: Stack vertically or use icon-only on mobile
- Form fields: Full-width on mobile, no horizontal overflow
- Cards: No fixed widths — use `w-full` with max-width constraints
- Text: No truncation that hides critical financial data

### Verification

- No horizontal scroll on the `<body>` at any breakpoint
- All interactive elements are at least 44x44px touch targets on mobile
- Tables show horizontal scroll indicator when content overflows
- Modals/Sheets are usable on 375px width
- Sidebar collapses to hamburger drawer on mobile

---

## Step 3: Sentry Production Configuration (Code)

### Files to modify

1. **`sentry.server.config.ts`**
2. **`sentry.edge.config.ts`**
3. **`src/instrumentation-client.ts`**

### Changes (identical across all three files)

```typescript
Sentry.init({
  dsn: "...",

  // 100% in dev, 10% in production — controls tracing cost
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Distinguish environments in Sentry dashboard
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,

  enableLogs: true,
  sendDefaultPii: true,
});
```

### Also verify in `next.config.ts`

- `org: "bilals-company"` — already correct
- `project: "syndic"` — already correct
- `authToken: process.env.SENTRY_AUTH_TOKEN` — add if not present (enables source map upload)
- `widenClientFileUpload: true` — already present

### Verification

- `pnpm build` succeeds (Sentry plugin runs without error)
- In Sentry dashboard: events tagged with `environment: "development"` during local testing
- `tracesSampleRate` reads `0.1` when `NODE_ENV=production`

---

## Step 4: RLS Policy Fix — Buildings Proprietaire SELECT (Code via Supabase MCP)

### Gap confirmed

The `buildings` table has only one policy: `syndic_all_own_building` (ALL for syndic). There is no proprietaire SELECT policy. The owner portal profile page reads building data (name, address) to display to the proprietaire.

### Policy to add

```sql
CREATE POLICY "proprietaire_read_own_building" ON buildings FOR SELECT
USING (
  auth.jwt() ->> 'user_role' = 'proprietaire'
  AND id IN (
    SELECT b.id FROM buildings b
    INNER JOIN apartments a ON a.building_id = b.id
    INNER JOIN owners o ON o.apartment_id = a.id
    WHERE o.user_id = auth.uid() AND o.deleted_at IS NULL
  )
);
```

**Logic:** A proprietaire can read only the building that contains the apartment they are assigned to. The chain is: `owners.user_id → owners.apartment_id → apartments.building_id → buildings.id`.

### Execution method

Run via Supabase MCP `execute_sql` tool. No Drizzle migration needed — RLS policies are database-level and not tracked in Drizzle migration files.

### Verification

Run these test queries via Supabase MCP with proprietaire JWT claims:

```sql
-- As proprietaire: should return exactly 1 row (their building)
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claims = '{"sub":"<proprietaire-user-uuid>","user_role":"proprietaire"}';
SELECT * FROM buildings;
-- Expected: 1 row

-- As proprietaire: should NOT see other syndic's buildings
-- Expected: 0 rows for buildings belonging to a different syndic
```

---

## Step 5: Full RLS Audit — Cross-Owner Leakage Verification (Code via Supabase MCP)

### Approach

Run the complete RLS audit checklist from `.github/skills/supabase-rls/SKILL.md` using two test proprietaire accounts (User A and User B who belong to different apartments).

### Test queries to run as proprietaire User A

```sql
-- 1. Notifications: must return only User A's notifications
SELECT count(*) FROM notifications;

-- 2. Payments: must return only payments where owner_id belongs to User A
SELECT count(*) FROM payments;

-- 3. Charges: must return only charges for User A's apartment_id
SELECT count(*) FROM charges;

-- 4. Meeting invitations: must return only invitations for User A's owner record
SELECT count(*) FROM meeting_invitations;

-- 5. Meetings: must return only meetings User A is invited to
SELECT count(*) FROM meetings;

-- 6. Owners: must return only User A's own owner record
SELECT count(*) FROM owners;

-- 7. Users: must return only User A's own user row
SELECT count(*) FROM users;

-- 8. Apartments: must return only User A's assigned apartment
SELECT count(*) FROM apartments;

-- 9. Buildings: should return exactly 1 row (after Step 4 fix)
SELECT count(*) FROM buildings;

-- 10. Audit logs: proprietaire should get zero rows
SELECT count(*) FROM audit_logs;
```

### Cross-building test as syndic

```sql
-- As syndic B (different syndic): should see only their own data
SELECT count(*) FROM buildings;    -- must be 1
SELECT count(*) FROM charges;      -- must be only their charges
SELECT count(*) FROM apartments;   -- must be only their building's apartments
SELECT count(*) FROM meetings;     -- must be only their meetings
```

### Document results

Record pass/fail for each query in a table. If any query returns unexpected rows, add a corrective policy before proceeding.

### Verification

- All 10 proprietaire queries return correctly scoped data
- All syndic cross-building queries return correctly scoped data
- Zero cross-owner data leakage detected
- Results documented in this plan file under a "RLS Audit Results" appendix (to be filled during execution)

---

## Step 6: Final Test Suite and Build Verification (Code)

### Commands to run

```bash
# 1. Type check — must be clean
pnpm tsc --noEmit

# 2. Full test suite — all 80+ tests must pass
pnpm vitest run

# 3. Production build — all routes must compile
pnpm build
```

### Verification

- `tsc`: 0 errors
- `vitest`: 80+ tests, 0 failures
- `build`: All routes compile (currently 26 — may be 26+ if new pages were added in earlier steps)
- Build output shows no warnings related to Sentry, Supabase, or missing environment variables

---

## Step 7: Gmail SMTP Configuration (Manual)

### What to do

Before sending production emails, configure Gmail SMTP credentials for Nodemailer.

### Steps

1. **Enable 2-Step Verification** on the Gmail account used for application emails.
2. In Google Account settings, generate an **App Password** for Mail usage.
3. Set environment variables:
   - `GMAIL_USER` = sender Gmail address
   - `GMAIL_APP_PASSWORD` = generated app password
4. In Vercel, add both variables for Production/Preview as needed.
5. Deploy and send a test email from the app.

### Important notes

- Use a dedicated mailbox for app notifications (recommended).
- Never commit `GMAIL_APP_PASSWORD` to the repository.
- If Gmail blocks delivery, review account security alerts and app-password configuration.

### Verification

- Test email is sent successfully from production.
- Delivery appears in Gmail sent mail and recipient inbox/spam.

---

## Step 8: Vercel Deployment (Manual — Dashboard)

### Prerequisites

- GitHub repository is connected to Vercel
- Supabase Cloud project is provisioned (separate from local dev)
- Upstash Redis instance is provisioned
- Gmail SMTP variables are configured (Step 7)
- Sentry project exists with auth token

### Steps

1. **Create Vercel project**  
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import from GitHub
   - Framework preset: **Next.js** (auto-detected)
   - Root directory: `.` (mono-root)
   - Build command: `pnpm build` (auto-detected)
   - Output directory: `.next` (default)
   - Install command: `pnpm install`

2. **Set environment variables in Vercel Dashboard → Settings → Environment Variables**

   All variables must be set for the **Production** environment. Copy values from the production service providers, NOT from `.env.local`.

   | Variable | Source | Required |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL | Yes |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon/public key | Yes |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role key | Yes |
   | `DATABASE_URL` | Supabase Dashboard → Settings → Database → Connection string (Transaction pooler, port 6543) | Yes |
   | `UPSTASH_REDIS_REST_URL` | Upstash Console → Database → REST API URL | Yes |
   | `UPSTASH_REDIS_REST_TOKEN` | Upstash Console → Database → REST API Token | Yes |
   | `GMAIL_USER` | Gmail account used as sender | Yes |
   | `GMAIL_APP_PASSWORD` | Google Account → Security → App passwords | Yes |
   | `SENTRY_DSN` | Sentry Dashboard → Project Settings → Client Keys (DSN) | Yes |
   | `SENTRY_AUTH_TOKEN` | Sentry Dashboard → Settings → Auth Tokens (org-level, `project:releases` + `org:read` scopes) | Yes |
   | `SENTRY_ORG` | `bilals-company` (from `next.config.ts`) | Yes |
   | `SENTRY_PROJECT` | `syndic` (from `next.config.ts`) | Yes |

3. **Deploy**
   - Trigger deploy via Git push to `main` or click "Deploy" in Vercel
   - Monitor build logs — Sentry plugin should upload source maps
   - Verify build completes without errors

### Supabase Cloud configuration checklist

Before the first production deploy, verify in Supabase Dashboard:

- [ ] Custom Access Token Hook is registered (Authentication → Hooks)
- [ ] Realtime is enabled on `notifications` table (Database → Replication)
- [ ] All 27 RLS policies are applied (including the new `proprietaire_read_own_building` from Step 4)
- [ ] `handle_new_auth_user` trigger exists on `auth.users`
- [ ] Production database has been migrated: `pnpm drizzle-kit push` or apply migration SQL files

### Verification

- Vercel deployment succeeds (green checkmark)
- Production URL is accessible
- No 500 errors on initial page load

---

## Step 9: Post-Deploy Smoke Test Checklist (Manual)

Run through each item against the production deployment URL.

### Authentication

- [ ] **Login as syndic** → redirects to `/dashboard`, summary cards load
- [ ] **Login as proprietaire** → redirects to `/portal`, profile data loads
- [ ] **Invalid credentials** → generic error message, no role leak
- [ ] **Rate limiter** → 6th login attempt within 1 minute returns 429 response
- [ ] **Password reset** → email received via Gmail SMTP, password update works

### Syndic Dashboard

- [ ] **Owners page** → list loads, search works, add/edit/delete functional
- [ ] **Apartments page** → list loads, status badges display, occupied guard on delete
- [ ] **Charges page** → derived status badges (paid/partial/unpaid) display correctly
- [ ] **Send Reminder** → email delivered (check Gmail SMTP delivery/logs)
- [ ] **Download Notice** → PDF downloads with correct owner/charge/building data
- [ ] **Meetings page** → create meeting, invite owners, emails sent
- [ ] **Meeting detail** → invitee list with response status badges
- [ ] **Payments page** → global payment history loads with filters
- [ ] **Settings page** → building info pre-populated, updates save

### Owner Portal

- [ ] **Profile page** → personal + apartment + building info displays
- [ ] **Phone edit** → inline edit saves, page reflects new phone
- [ ] **Password change** → form submits, can log back in with new password
- [ ] **Charges tab** → charges for owner's apartment display with correct derived values
- [ ] **Pay button** → payment form opens in Sheet, submits, charge status updates
- [ ] **Download Notice** → PDF downloads with correct data
- [ ] **Payment history tab** → all payments display
- [ ] **Notifications page** → notifications load, unread badge shows
- [ ] **Meeting invitation** → Accept/Decline buttons work, response logged

### Real-Time

- [ ] **Realtime notification** → Create a meeting invitation from syndic dashboard. In the proprietaire portal (in a separate browser/tab), verify the notification badge increments and notification appears WITHOUT page refresh.

### Responsiveness

- [ ] **Mobile (375px)** → Sidebar becomes hamburger drawer, tables scroll horizontally, forms are full-width
- [ ] **Tablet (768px)** → Grid columns adjust, cards stack or split into 2 columns
- [ ] **Desktop (1280px)** → Full sidebar visible, standard layout

### Error Handling

- [ ] **Navigate to invalid route** → `not-found.tsx` renders
- [ ] **Force an error** (e.g., disconnect API temporarily) → `error.tsx` renders with "Réessayer" button
- [ ] **Sentry captures the error** → verify in Sentry dashboard, event has `environment: "production"` tag

### Security

- [ ] **Proprietaire cannot access `/dashboard`** → redirected to `/login`
- [ ] **Syndic cannot access `/portal`** → redirected to `/login`
- [ ] **Proprietaire cannot see other owner's data** → charges, payments, notifications are scoped

---

## Summary: Task Classification

### Code tasks (Steps 1–6)

| Step | Description | Estimated files |
|---|---|---|
| 1 | Create 5 missing loading.tsx + error.tsx files | 5 new files |
| 2 | Responsiveness audit and CSS fixes | 5–15 files modified |
| 3 | Sentry production config (tracesSampleRate + environment) | 3 files modified |
| 4 | Add buildings proprietaire SELECT RLS policy | 1 SQL statement via MCP |
| 5 | Full RLS audit queries via MCP | 0 files (SQL queries only) |
| 6 | Final tsc + vitest + build verification | 0 files (commands only) |

### Manual/Dashboard tasks (Steps 7–9)

| Step | Description | Where |
|---|---|---|
| 7 | Gmail SMTP configuration | Google Account + Vercel env vars |
| 8 | Vercel deployment + env vars | Vercel dashboard + Supabase dashboard |
| 9 | Post-deploy smoke test | Production browser |

---

## Appendix A: RLS Audit Results

_Completed during Step 5 execution._

### Policy Inventory (27 policies, 10 tables)

| Table | RLS | Policies | syndic | proprietaire |
|---|---|---|---|---|
| apartments | ✅ | 2 | ALL (own building) | SELECT (own apt) |
| audit_logs | ✅ | 2 | SELECT | INSERT (authenticated) |
| buildings | ✅ | 2 | ALL (own syndic_id) | SELECT (own via apt→owner chain) |
| charges | ✅ | 2 | ALL (own syndic_id) | SELECT (own apt) |
| meeting_invitations | ✅ | 3 | ALL | SELECT + UPDATE (own owner_id) |
| meetings | ✅ | 2 | ALL (own syndic_id) | SELECT (invited only) |
| notifications | ✅ | 3 | INSERT | SELECT + UPDATE (own user_id) |
| owners | ✅ | 2 | ALL | SELECT (own user_id) |
| payments | ✅ | 4 | SELECT + INSERT | SELECT + INSERT (own owner_id) |
| users | ✅ | 5 | SELECT + INSERT + UPDATE | SELECT + UPDATE (own id) |

### Gap Fixed

- **buildings**: Added `proprietaire_read_own_building` policy (SELECT via apartment→owner chain) — was missing before Phase 6.

### Findings

- All 10 public tables have RLS enabled
- No table is missing policies for either role
- All proprietaire policies are scoped to owned data (via `auth.uid()` + ownership chain)
- All syndic policies are scoped to own building/syndic_id
- audit_logs correctly allows authenticated INSERT but restricts SELECT to syndic only
