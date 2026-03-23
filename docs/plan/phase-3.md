# Phase 3 — Charges and Payments Implementation Plan

**Created:** March 3, 2026
**Status:** Ready for implementation
**Prerequisite:** Phase 2 complete — 19 routes building, 23 Vitest tests passing, `charges` and `payments` tables already in schema

---

## Supabase MCP Pre-Check Results

| Check | Result |
|---|---|
| `charges` table columns | ✅ 12 columns: `id`, `syndic_id`, `apartment_id`, `title`, `description`, `category`, `total_amount`, `due_date`, `last_reminder_sent_at`, `deleted_at`, `created_at`, `updated_at` |
| `payments` table columns | ✅ 10 columns: `id`, `charge_id`, `owner_id`, `amount`, `payment_date`, `method`, `reference`, `notes`, `created_at`, `updated_at` |
| No derived columns on charges | ✅ Confirmed: no `amount_paid`, `remaining_amount`, or `status` column exists |
| `charges` row count | ✅ 0 rows — clean state |
| `payments` row count | ✅ 0 rows — clean state |
| Syndic seed user | ❌ 0 rows in `users` — `pnpm db:seed` must be run before manual testing |
| Building seed | ❌ 0 rows in `buildings` — provisioned by seed script |
| Apartments | ❌ 0 rows — at least one apartment needed to assign charges |
| Owners | ❌ 0 rows — at least one owner needed for payment creation |

> **Action required before testing:** Run `pnpm db:seed` then manually create at least one apartment and one owner via the Phase 2 UI (or extend the seed script).

---

## Context7 Documentation Findings

| Library | Key API Patterns for Phase 3 |
|---|---|
| **@react-pdf/renderer 4.3.2** | `import { renderToBuffer } from '@react-pdf/renderer'` — returns `Promise<Buffer>`. Document structure: `<Document>` → `<Page size="A4">` → `<View>` / `<Text>`. Styles via `StyleSheet.create({})`. Runs **server-side** in Node.js — no `"use client"` directive needed. |
| **Nodemailer (Gmail SMTP)** | `sendEmail({ to, subject, react: <Template /> })` via `src/lib/email/send-email.ts` shared helper. |
| **Drizzle ORM 0.45** | Aggregation: `sql<number>\`...\`` inside `.select({})`. Left join: `.leftJoin(payments, eq(payments.chargeId, charges.id))`. Group by: `.groupBy(charges.id)`. COALESCE/SUM via raw `sql` template. `sum()` helper returns `string \| null` (use `mapWith(String)` or raw sql). |
| **TanStack Query v5** | `useQuery({ queryKey: ['charges', { filters }], queryFn, enabled: !!dep })` — `queryKey` array drives automatic refetches on filter changes. `placeholderData: (prev) => prev` keeps old data during refetch. `invalidateQueries({ queryKey: ['charges'] })` after mutations. No `onSuccess`/`onError` on `useQuery`. |

---

## File Inventory

### New files to create (16)

| Path | Type |
|---|---|
| `src/lib/db/queries/charges.ts` | Drizzle query helper |
| `src/lib/db/queries/payments.ts` | Drizzle query helper |
| `src/lib/validations/charge.ts` | Zod schema |
| `src/lib/validations/payment.ts` | Zod schema |
| `src/lib/actions/charges.ts` | Server Actions |
| `src/lib/actions/payments.ts` | Server Actions |
| `src/lib/email/templates/payment-reminder.tsx` | React Email template |
| `src/lib/pdf/payment-notice.tsx` | Shared PDF render function |
| `src/app/api/charges/route.ts` | API route for TanStack Query |
| `src/app/api/payments/route.ts` | API route for TanStack Query |
| `src/components/features/charges/charges-table.tsx` | Client component |
| `src/components/features/charges/charge-panel.tsx` | Client component (Sheet) |
| `src/components/features/charges/delete-charge-dialog.tsx` | Client component (AlertDialog) |
| `src/components/features/payments/payments-table.tsx` | Client component |
| `src/lib/actions/__tests__/charges.test.ts` | Vitest unit tests |
| `src/lib/actions/__tests__/payments.test.ts` | Vitest unit tests |

### Existing files to modify (3)

| Path | Change |
|---|---|
| `src/app/(syndic)/dashboard/charges/page.tsx` | Replace placeholder with real Server Component |
| `src/app/(syndic)/dashboard/payments/page.tsx` | Replace placeholder with real Server Component |
| `src/app/(syndic)/dashboard/page.tsx` | Replace Phase 3 placeholder with overdue charges table |

### No schema migration needed

The `charges` and `payments` tables are already defined in `src/lib/db/schema.ts` with all columns, indexes, CHECK constraints, and foreign keys. Supabase MCP confirms both tables exist with the correct columns. **No `drizzle-kit generate` or `drizzle-kit migrate` required.**

---

## Step 1: Zod Validation Schemas

**Files to create:**
- `src/lib/validations/charge.ts`
- `src/lib/validations/payment.ts`

**Implementation notes:**
- Reference: `.github/instructions/validations.instructions.md`
- **charge.ts** — fields: `title` (string, min 1), `description` (string, optional), `category` (enum: `electricity`, `water`, `maintenance`, `repair`, `other`), `totalAmount` (coerce number, positive), `dueDate` (string, min 1 — date as ISO string), `apartmentId` (string, uuid)
- **payment.ts** — fields: `chargeId` (string, uuid), `ownerId` (string, uuid), `amount` (coerce number, positive — the "not exceeding remaining balance" ceiling is validated in the Server Action, NOT in the schema), `paymentDate` (string, min 1), `method` (enum: `bank_transfer`, `check`, `cash`), `reference` (string, min 1), `notes` (string, optional)
- Both schemas export `type XFormValues = z.infer<typeof xSchema>`
- Category and method enum values must match the DB CHECK constraints exactly
- Use `z.coerce.number()` for numeric fields coming from form inputs (Zod v4 pattern)

**Supabase MCP action:** None

**Verification:**
- TypeScript compiles with no errors
- Enum values match the CHECK constraints in `schema.ts`

---

## Step 2: Drizzle Query Helpers (Charges)

**Files to create:**
- `src/lib/db/queries/charges.ts`

**Implementation notes:**
- Reference: `.github/instructions/drizzle.instructions.md` (lines 55–80 for derived financial values)
- **`getChargesWithPaymentStatus(syndicId: string)`** — the core query. Must:
  - `SELECT charges.*, COALESCE(SUM(payments.amount), 0) AS amount_paid, charges.total_amount - COALESCE(SUM(payments.amount), 0) AS remaining_amount, CASE ... END AS status`
  - `LEFT JOIN payments ON payments.charge_id = charges.id`
  - `WHERE charges.syndic_id = $syndicId AND charges.deleted_at IS NULL`
  - `GROUP BY charges.id`
  - Use Drizzle's `sql` template for the computed columns: `sql<string>\`COALESCE(SUM(${payments.amount}), 0)\``
  - Important: Drizzle `numeric` type maps to string in JS — cast or keep as string for financial precision
- **`getChargeById(id: string)`** — single charge with derived values (same LEFT JOIN + GROUP BY pattern, filtered by `charges.id`)
- **`getChargesForApartment(apartmentId: string)`** — charges for a specific apartment with derived values. Used later in Phase 5 owner portal — design it now
- **`getOverdueCharges(syndicId: string)`** — charges where `due_date < NOW()` and `remaining_amount > 0`. For the dashboard overview page
- All queries filter `deleted_at IS NULL`
- Never store `amount_paid`, `remaining_amount`, or `status` — compute in every query

**Supabase MCP action:** None

**Verification:**
- TypeScript compiles
- Manually test with Drizzle Studio after creating a charge via Step 5

---

## Step 3: Drizzle Query Helpers (Payments)

**Files to create:**
- `src/lib/db/queries/payments.ts`

**Implementation notes:**
- Reference: `.github/instructions/drizzle.instructions.md`
- **`getPaymentsGlobal(syndicId: string, filters?: { dateFrom?, dateTo?, ownerId?, category? })`** — global payment history for the syndic. Joins `payments → charges → apartments → owners → users` to get owner name, charge title, category. Filters:
  - `payments.payment_date >= dateFrom` (if provided)
  - `payments.payment_date <= dateTo` (if provided)
  - `payments.owner_id = ownerId` (if provided)
  - `charges.category = category` (if provided)
  - `charges.syndic_id = syndicId` (always — scoped to syndic)
  - `charges.deleted_at IS NULL` (never show payments for deleted charges)
- **`getPaymentsForCharge(chargeId: string)`** — all payments for a specific charge. Used in charge detail view
- **`getPaymentsForOwner(ownerId: string)`** — all payments for a specific owner. Designed for Phase 5 reuse
- **`getFinancialSummary(syndicId: string)`** — returns `{ totalChargesIssued, totalCollected, totalOutstanding }`. Computed from:
  - `totalChargesIssued = SUM(charges.total_amount)` where `charges.syndic_id = syndicId AND charges.deleted_at IS NULL`
  - `totalCollected = SUM(payments.amount)` through joins
  - `totalOutstanding = totalChargesIssued - totalCollected`

**Supabase MCP action:** None

**Verification:**
- TypeScript compiles
- Queries are tested via Vitest in Step 12

---

## Step 4: API Routes for TanStack Query

**Files to create:**
- `src/app/api/charges/route.ts`
- `src/app/api/payments/route.ts`

**Implementation notes:**
- Follow the exact pattern from `src/app/api/apartments/route.ts` (Phase 2):
  - Authenticate via `createClient()` + `getSession()`
  - Return `401` if no session
  - Get building, load data via query helpers, return JSON
- **`/api/charges` GET** — calls `getChargesWithPaymentStatus(syndicId)`, returns the list with derived fields
- **`/api/payments` GET** — accepts optional query params `dateFrom`, `dateTo`, `ownerId`, `category`. Calls `getPaymentsGlobal(syndicId, filters)`. Also include `getFinancialSummary(syndicId)` in the response as a `summary` field
- Both routes scope data to the authenticated syndic — no cross-syndic leakage

**Supabase MCP action:** None

**Verification:**
- `GET /api/charges` returns `200` with empty array (no charges yet)
- `GET /api/payments` returns `200` with empty array and `summary: { totalChargesIssued: 0, totalCollected: 0, totalOutstanding: 0 }`

---

## Step 5: Server Actions (Charges)

**Files to create:**
- `src/lib/actions/charges.ts`

**Implementation notes:**
- Reference: `.github/instructions/server-actions.instructions.md`
- `"use server"` directive at top
- Return shape: `{ success: true; data: T } | { success: false; error: string }` — never throw
- Standard action sequence: validate → authenticate → authorize (role = syndic) → get building → mutate → audit log

**Actions:**

1. **`createCharge(values: unknown)`**
   - Validate with `chargeSchema.safeParse(values)`
   - Verify `apartmentId` belongs to the syndic's building
   - Insert into `charges` with `syndicId = session.user.id`
   - `totalAmount` stored as string (Drizzle numeric → string)
   - Audit log: `{ action: 'CREATE_CHARGE', entityType: 'charges', entityId: newCharge.id }`
   - Return `{ success: true, data: { id } }`

2. **`deleteCharge(id: string)`**
   - Soft-delete: `UPDATE charges SET deleted_at = NOW(), updated_at = NOW() WHERE id = $id`
   - Verify charge belongs to syndic before deleting
   - Audit log: `{ action: 'DELETE_CHARGE', entityType: 'charges', entityId: id }`

3. **`sendPaymentReminder(chargeId: string)`**
   - Load charge with derived values (must have `remaining_amount > 0`)
   - Load the owner via `charges.apartment_id → owners.apartment_id` (active owner)
   - Load the owner's user record for email
   - Load building for contact info
  - Send email via shared helper: `sendEmail({ to, subject, react: <PaymentReminderEmail ... /> })`
   - Update `charges.last_reminder_sent_at = NOW()`
   - Audit log: `{ action: 'SEND_REMINDER', entityType: 'charges', entityId: chargeId }`

4. **`downloadPaymentNotice(chargeId: string)`**
   - Load charge, owner, apartment, building
   - Call shared `renderPaymentNotice({ owner, apartment, charge, building })` from `src/lib/pdf/payment-notice.tsx`
   - Return `{ success: true, data: { buffer: base64EncodedPdf, filename } }`
   - This is the Server Action that triggers the PDF generation — client receives the buffer and triggers a download

**Supabase MCP action:** None

**Verification:**
- Actions compile without errors
- Tested via Vitest in Step 12

---

## Step 6: Server Actions (Payments)

**Files to create:**
- `src/lib/actions/payments.ts`

**Implementation notes:**
- Reference: `.github/instructions/server-actions.instructions.md`
- `"use server"` directive at top

**Actions:**

1. **`createPayment(values: unknown)`**
   - Validate with `paymentSchema.safeParse(values)`
   - Authenticate + authorize (role = syndic for Phase 3; Phase 5 will also allow proprietaire)
   - Load charge with derived values — compute `remaining_amount`
   - **Ceiling validation in Server Action (NOT in Zod schema):** if `parsed.data.amount > remainingAmount`, return error `"Le montant dépasse le solde restant"`
   - **MUST use `db.transaction()`:**
     ```
     const [newPayment] = await db.transaction(async (tx) => {
       const [payment] = await tx.insert(payments).values({...}).returning({ id: payments.id });
       return [payment];
     });
     ```
   - **Audit log OUTSIDE the transaction** (with `db`, not `tx`):
     ```
     await db.insert(auditLogs).values({
       userId: session.user.id,
       action: 'CREATE_PAYMENT',
       entityType: 'payments',
       entityId: newPayment.id,
     });
     ```
   - This ensures the audit record survives even if the transaction rolls back
   - Return `{ success: true, data: { id: newPayment.id } }`

2. **No update or delete actions** — payments rows are immutable per PRD. Never implement `updatePayment` or `deletePayment`.

**Supabase MCP action:** None

**Verification:**
- Action compiles
- Transaction rollback tested in Step 12

---

## Step 7: Payment Reminder Email Template

**Files to create:**
- `src/lib/email/templates/payment-reminder.tsx`

**Implementation notes:**
- Reference: existing `src/lib/email/templates/welcome.tsx` for style patterns
- Uses `@react-email/components`: `Html`, `Body`, `Container`, `Heading`, `Text`, `Hr`, `Section`
- Props interface:
  ```
  interface PaymentReminderEmailProps {
    ownerName: string;        // "Jean Dupont"
    chargeTitle: string;      // "Électricité Q1 2026"
    totalAmount: string;      // "1500.00"
    amountPaid: string;       // "500.00"
    remainingAmount: string;  // "1000.00"
    dueDate: string;          // "2026-03-15"
    buildingName: string;     // "Résidence les Oliviers"
    buildingAddress: string;  // "12 Rue de la Paix, Casablanca"
  }
  ```
- Content in French (consistent with existing welcome email)
- Includes: greeting, charge details, payment amounts (total, paid, remaining), due date warning, building contact info, call to action
- Email call in the Server Action: `sendEmail({ to: ownerEmail, subject: 'Rappel de paiement — [chargeTitle]', react: <PaymentReminderEmail {...props} /> })`

**Supabase MCP action:** None

**Verification:**
- Template compiles
- Render preview via `@react-email/components` dev server (optional)

---

## Step 8: Shared PDF Payment Notice

**Files to create:**
- `src/lib/pdf/payment-notice.tsx`

**Implementation notes:**
- Reference: Context7 docs for `@react-pdf/renderer` — `renderToBuffer`, `Document`, `Page`, `View`, `Text`, `StyleSheet`
- **This file is a shared utility** — used by both:
  - `src/lib/actions/charges.ts` → `downloadPaymentNotice()` (Phase 3, syndic)
  - `src/lib/actions/payments.ts` or a portal action (Phase 5, proprietaire)
- **No `"use client"` directive** — this runs server-side only
- Export two things:
  1. `PaymentNoticeDocument` — React component for the PDF structure
  2. `renderPaymentNotice(props)` — async function that calls `renderToBuffer(<PaymentNoticeDocument {...props} />)` and returns the Buffer

**Props interface:**
```
interface PaymentNoticeProps {
  owner: { firstName: string; lastName: string; email: string; phone?: string };
  apartment: { unitNumber: string; floor: number; buildingName: string };
  charge: { title: string; description?: string; category: string; totalAmount: string; amountPaid: string; remainingAmount: string; dueDate: string };
  building: { name: string; address: string };
  generatedAt: string; // ISO date string
}
```

**PDF layout (A4):**
- Header: building name, building address, "AVIS DE PAIEMENT" title
- Owner section: full name, apartment unit/floor, email, phone
- Charge details table: title, category, description, due date
- Financial table: total amount, amount paid, remaining balance (bold)
- Footer: generation date, building contact info
- Use `StyleSheet.create({})` for all styles — `fontFamily: 'Helvetica'` (built-in, no font registration needed)
- Financial amounts formatted with 2 decimal places and "MAD" currency suffix

**Supabase MCP action:** None

**Verification:**
- `renderPaymentNotice({...testProps})` returns a non-empty Buffer
- Tested via Vitest in Step 12

---

## Step 9: Install shadcn UI Components (if needed)

**Implementation notes:**
- Reference: `.github/skills/shadcn-component/SKILL.md`
- Check which shadcn components are already installed. From Phase 2: `sheet`, `alert-dialog`, `table`, `input`, `label`, `button`, `card`, `select`, `sonner`
- Phase 3 may need:
  - **`badge`** — for category badges and status badges (or continue using the custom `StatusBadge` from `src/components/features/shared/StatusBadge.tsx`)
  - **`dropdown-menu`** — for row action menus (edit/delete/remind/download)
  - **`popover`** + **`calendar`** — for date range filter on payments page (or use native `<input type="date">` for MVP simplicity)
- Decision: Install `dropdown-menu` at minimum for charge row actions. Date inputs can use native HTML inputs for MVP

**Command:**
```bash
pnpm dlx shadcn@canary add dropdown-menu
```

**Verification:**
- `src/components/ui/dropdown-menu.tsx` exists after install

---

## Step 10: Charges Page UI

**Files to create:**
- `src/components/features/charges/charges-table.tsx`
- `src/components/features/charges/charge-panel.tsx`
- `src/components/features/charges/delete-charge-dialog.tsx`

**Files to modify:**
- `src/app/(syndic)/dashboard/charges/page.tsx`

**Implementation notes:**
- Reference: `.github/skills/shadcn-component/SKILL.md` for Sheet, AlertDialog, Table patterns
- Reference: `.github/instructions/frontend-components.instructions.md` for design tokens

### `charges-table.tsx` (Client Component)
- `"use client"` — uses TanStack Query, event handlers
- Fetch charges via `useQuery({ queryKey: ['charges'], queryFn: () => fetch('/api/charges').then(r => r.json()) })`
- Columns: title, category badge, total amount (`font-mono`), amount paid (`font-mono`), remaining balance (`font-mono`), due date, status badge (`<StatusBadge>`), actions
- Row actions menu (dropdown): "Modifier" (edit), "Supprimer" (delete), "Envoyer rappel" (send reminder — only if `remaining_amount > 0`), "Télécharger avis" (download PDF notice)
- Status badges use the shared `StatusBadge` component from `src/components/features/shared/StatusBadge.tsx` (paid/partial/unpaid already defined there)
- "Send Reminder" calls `sendPaymentReminder(chargeId)` → toast success/error
- "Download PDF" calls `downloadPaymentNotice(chargeId)` → receives base64 buffer → triggers browser download
- Header row: add "Nouvelle charge" button → opens `charge-panel.tsx`

### `charge-panel.tsx` (Client Component)
- `"use client"` — Sheet pattern from `.github/skills/shadcn-component/SKILL.md`
- React Hook Form + zodResolver with `chargeSchema`
- Fields: title (Input), description (Input, optional), category (Select with 5 options), totalAmount (Input type number), dueDate (Input type date), apartmentId (Select — fetched from `/api/apartments`)
- On submit: call `createCharge(values)` → toast → `invalidateQueries({ queryKey: ['charges'] })` → close sheet + reset form
- Labels in French

### `delete-charge-dialog.tsx` (Client Component)
- `"use client"` — AlertDialog pattern from `.github/skills/shadcn-component/SKILL.md`
- On confirm: call `deleteCharge(chargeId)` → toast → `invalidateQueries({ queryKey: ['charges'] })`

### `page.tsx` (Server Component)
- Replace placeholder content
- Render `<ChargesTable />` — data fetching happens client-side via TanStack Query
- Page remains a Server Component (no `"use client"`)

**Supabase MCP action:** None

**Verification:**
- Page renders without errors
- `pnpm build` passes
- Can create a charge, see it in the table with "unpaid" status badge
- Can soft-delete a charge
- "Send Reminder" button triggers email (verify Gmail SMTP delivery/logs)
- "Download PDF" triggers file download in browser

---

## Step 11: Payments History Page UI

**Files to create:**
- `src/components/features/payments/payments-table.tsx`

**Files to modify:**
- `src/app/(syndic)/dashboard/payments/page.tsx`

**Implementation notes:**
- Reference: `.github/skills/shadcn-component/SKILL.md` for Table pattern
- Reference: `.github/instructions/frontend-components.instructions.md` for design tokens

### `payments-table.tsx` (Client Component)
- `"use client"` — uses TanStack Query with filter state, event handlers
- Filter controls at top:
  - Date range: two `<Input type="date">` fields (from, to)
  - Owner filter: `<Select>` populated from `/api/owners` (existing API route from Phase 2)
  - Category filter: `<Select>` with charge categories
  - All filters stored in `useState` and included in `queryKey`: `['payments', { dateFrom, dateTo, ownerId, category }]`
  - `queryFn` appends filters as URL params to `/api/payments?dateFrom=...&dateTo=...`
- Financial summary row at top: three metric cards showing "Total charges", "Total encaissé", "Solde restant" — sourced from the `summary` field in the API response
- Financial values use `font-mono` class
- Table columns: owner name, charge title, amount (`font-mono`), date, method badge, reference
- No edit/delete actions — payments are immutable

### `page.tsx` (Server Component)
- Replace placeholder content
- Render `<PaymentsTable />` — all data fetching happens client-side
- Page remains a Server Component

**Supabase MCP action:** None

**Verification:**
- Page renders without errors
- `pnpm build` passes
- Filters change the `queryKey` and trigger refetch
- Financial summary totals are correct (matches sum of displayed payments)

---

## Step 12: Dashboard Overview — Overdue Charges Table

**Files to modify:**
- `src/app/(syndic)/dashboard/page.tsx`
- `src/lib/db/queries/dashboard.ts` (extend with overdue charges)

**Implementation notes:**
- Replace the Phase 3 placeholder `<div>` on the dashboard page
- Add `getOverdueCharges(syndicId)` call in the page's server-side data fetching
- Render a simple server-rendered table below MetricCards showing:
  - Owner name (join through `charges.apartment_id → owners.apartment_id → users`)
  - Charge title
  - Remaining balance (`font-mono`, computed)
  - Due date (highlighted if past due)
- This is a Server Component table — no TanStack Query needed (data fetched at request time)
- Update `getDashboardMetrics` to include `totalCharges` and `totalPayments` counts for the metric cards

**Supabase MCP action:** None

**Verification:**
- Dashboard shows overdue charges after creating a charge with a past due date
- Metric cards show correct counts

---

## Step 13: Vitest Unit Tests

**Files to create:**
- `src/lib/actions/__tests__/charges.test.ts`
- `src/lib/actions/__tests__/payments.test.ts`

**Implementation notes:**
- Reference: `.github/instructions/tests.instructions.md`
- Follow the exact mocking pattern from existing Phase 2 tests in `src/lib/actions/__tests__/`
- Mock `@/lib/db` with `vi.mock()` — mock `db.select()`, `db.insert()`, `db.update()`, `db.transaction()`
- Mock `@/utils/supabase/server` — return a fake session with `user_role: 'syndic'`
- Mock `@/lib/email/send-email` for email tests

### `charges.test.ts` — test cases:
1. **createCharge — valid input** → returns `{ success: true, data: { id } }`, inserts audit log with `CREATE_CHARGE`
2. **createCharge — invalid input** → returns `{ success: false, error: '...' }` (Zod validation)
3. **createCharge — unauthenticated** → returns `{ success: false, error: 'Non authentifié' }`
4. **deleteCharge — soft-delete** → sets `deleted_at`, inserts audit log with `DELETE_CHARGE`
5. **sendPaymentReminder** → calls `sendEmail()`, updates `last_reminder_sent_at`, inserts audit log with `SEND_REMINDER`

### `payments.test.ts` — test cases:
1. **createPayment — valid input** → wraps insert in `db.transaction()`, returns `{ success: true, data: { id } }`, inserts audit log with `CREATE_PAYMENT` using `db` (not `tx`)
2. **createPayment — amount exceeds remaining** → returns `{ success: false, error: 'Le montant dépasse le solde restant' }`
3. **createPayment — transaction rollback** → if `tx.insert()` throws, `db.transaction()` rolls back — no partial state committed, audit log NOT written
4. **Partial payment aggregation** → mock a charge with `total_amount = 1000`, existing payments summing to 300, new payment of 200 → verify computed `amount_paid = 500`, `remaining_amount = 500`, `status = 'partial'`
5. **Full payment** → mock payments summing to `total_amount` → verify `status = 'paid'`
6. **No update/delete actions exist** → verify `updatePayment` and `deletePayment` are not exported

### PDF test (in `payments.test.ts` or separate):
7. **renderPaymentNotice — returns non-empty buffer** → call `renderPaymentNotice()` with valid props → assert result is a Buffer with `length > 0`

**Supabase MCP action:** None

**Verification:**
- `pnpm vitest run` — all new tests pass alongside existing 23 tests
- Target: 30+ total tests after Phase 3

---

## Step 14: Final Build Verification

**Implementation notes:**
- Run `pnpm build` and confirm all routes compile without errors
- Run `pnpm vitest run` and confirm all tests pass
- Manually verify the full workflow:
  1. Seed the database (`pnpm db:seed`)
  2. Create an apartment via `/dashboard/apartments`
  3. Create an owner via `/dashboard/owners`
  4. Create a charge via `/dashboard/charges` → verify "unpaid" status badge
  5. Create a partial payment → verify "partial" status badge and correct amount calculations
  6. Create a payment for the remaining balance → verify "paid" status badge
  7. Send a payment reminder email → verify Gmail SMTP delivery/logs
  8. Download a PDF payment notice → verify the file opens and contains correct data
  9. Check the payments history page → verify filters work and summary totals are correct
  10. Check the dashboard overview → verify overdue charges table

**Supabase MCP action:** After all tests pass, confirm DB state is consistent:
```sql
SELECT count(*) FROM charges;
SELECT count(*) FROM payments;
SELECT count(*) FROM audit_logs WHERE action IN ('CREATE_CHARGE', 'CREATE_PAYMENT', 'SEND_REMINDER', 'DELETE_CHARGE');
```

**Verification:**
- `pnpm build` exits with code 0
- `pnpm vitest run` exits with code 0 and all tests pass
- All 19 existing routes + new routes compile
- Manual smoke test passes all 10 workflow steps above

---

## Implementation Order Summary

| Order | Step | Dependencies |
|---|---|---|
| 1 | Zod schemas (`charge.ts`, `payment.ts`) | None |
| 2 | Query helpers — charges (`queries/charges.ts`) | Schema |
| 3 | Query helpers — payments (`queries/payments.ts`) | Schema |
| 4 | API routes (`/api/charges`, `/api/payments`) | Query helpers |
| 5 | Server Actions — charges (`actions/charges.ts`) | Schemas, query helpers |
| 6 | Server Actions — payments (`actions/payments.ts`) | Schemas, query helpers |
| 7 | Email template (`payment-reminder.tsx`) | None (used by Step 5) |
| 8 | PDF render function (`payment-notice.tsx`) | None (used by Step 5) |
| 9 | Install shadcn components | None |
| 10 | Charges page UI | Steps 4, 5, 7, 8, 9 |
| 11 | Payments history page UI | Steps 4, 6, 9 |
| 12 | Dashboard overdue charges table | Step 2 |
| 13 | Vitest unit tests | Steps 5, 6, 8 |
| 14 | Final build verification | All steps |

> **Parallelizable:** Steps 1–3 can run in parallel. Steps 7–9 can run in parallel. Steps 10–12 can run in parallel after their dependencies complete.

---

## Risk Notes

1. **Seed data required** — The Supabase DB currently has 0 rows in `users`, `buildings`, `apartments`, and `owners`. Run `pnpm db:seed` first, then create test data via the Phase 2 UI before manual testing.
2. **`numeric` type returns strings** — Drizzle maps PostgreSQL `numeric` to `string` in TypeScript. All financial calculations in query helpers use SQL-level arithmetic. Client-side display uses `parseFloat()` or `Number()` for formatting only.
3. **PDF font availability** — `@react-pdf/renderer` includes Helvetica by default. No custom font registration needed for MVP. If French accented characters render poorly, register a Unicode font later.
4. **Gmail SMTP sender** — Payment reminder emails require valid `GMAIL_USER` and `GMAIL_APP_PASSWORD` values in environment configuration.
5. **Payment creation auth scope** — Phase 3 restricts `createPayment` to `role = 'syndic'`. Phase 5 expands this to also allow `role = 'proprietaire'` (with RLS ensuring they can only pay their own charges). Design the action to accept both roles from day one or plan to extend it in Phase 5.
