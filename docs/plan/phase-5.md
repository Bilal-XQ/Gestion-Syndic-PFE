# Phase 5 — Owner Portal

> **Goal:** Enable `proprietaire` users to view their profile, manage charges/payments, and download PDF notices through a fully functional portal.
>
> **Prerequisite:** Phase 4 complete (23 routes, 64 tests passing, Realtime notifications, meetings/invitations/accept/decline). Notifications page already built at `src/app/(owner)/notifications/page.tsx`.

---

## Scope Summary

| Deliverable | Type | Files |
|---|---|---|
| Zod schemas (profile + password) | Validation | `src/lib/validations/profile.ts` |
| Query helper (`getBuildingById`) | DB | `src/lib/db/queries/buildings.ts` |
| Server Actions (updatePhone, changePassword) | Backend | `src/lib/actions/portal.ts` |
| IDOR fix in `createPayment` | Backend | `src/lib/actions/payments.ts` |
| Proprietaire path in `downloadPaymentNotice` | Backend | `src/lib/actions/charges.ts` |
| API routes (portal profile, charges, payments) | Backend | `src/app/api/portal/*/route.ts` |
| Install shadcn Tabs component | UI | `src/components/ui/tabs.tsx` |
| Profile page (read-only + phone edit + password) | Frontend | `src/app/(owner)/portal/page.tsx`, `src/components/features/portal/` |
| Payments page (two tabs + payment form) | Frontend | `src/app/(owner)/payments/page.tsx`, `src/components/features/payments/` |
| Vitest unit tests | Tests | `src/lib/actions/__tests__/portal.test.ts` |

### Explicitly OUT of scope
- Notifications page — already complete from Phase 4
- PDF render function (`renderPaymentNotice`) — already role-agnostic, no changes needed
- Schema.ts / Drizzle migration — no new columns or tables

---

## Step-by-step Implementation

### Step 1 — Zod Schemas

**File:** `src/lib/validations/profile.ts`

Create two schemas:

```
updatePhoneSchema
  └─ phone: z.string().min(8).max(20).optional().or(z.literal(""))

changePasswordSchema
  └─ password:        z.string().min(8, "8 caractères minimum")
  └─ confirmPassword: z.string().min(8, "8 caractères minimum")
  └─ .refine(data => data.password === data.confirmPassword, {
       message: "Les mots de passe ne correspondent pas",
       path: ["confirmPassword"]
     })
```

**Constraints:**
- Zod v4 (4.3.6): use `.issues` not `.errors` on server. `.refine()` is valid.
- Export `UpdatePhoneFormValues` and `ChangePasswordFormValues` types.
- One file for both — they are both portal-domain schemas.

---

### Step 2 — Query Helper: `getBuildingById`

**File:** `src/lib/db/queries/buildings.ts` (append to existing)

```
export async function getBuildingById(id: string) {
  const [building] = await db
    .select()
    .from(buildings)
    .where(and(eq(buildings.id, id), isNull(buildings.deletedAt)));
  return building ?? null;
}
```

**Why:** `downloadPaymentNotice` for proprietaire cannot use `getBuildingBySyndicId()` — the owner does not have a `syndicId`. Must resolve building via `getApartmentById(charge.apartmentId).buildingId` → `getBuildingById(buildingId)`.

---

### Step 3 — Server Actions: `portal.ts`

**File:** `src/lib/actions/portal.ts`

Create a new actions file with two exported functions:

#### 3a. `updatePhone(values: unknown): Promise<ActionResult>`

Flow: validate → authenticate (proprietaire) → resolve ownerId → update `users.phone` → audit log.

1. Parse `values` with `updatePhoneSchema.safeParse()`
2. Authenticate via `createClient()` → `getSession()`
3. Assert `role === "proprietaire"` from `session.user.app_metadata.user_role`
4. Resolve owner record: `getOwnerByUserId(session.user.id)` — bail if null
5. Update `users` table: `db.update(users).set({ phone, updatedAt }).where(eq(users.id, session.user.id))`
6. Audit log: `{ action: "UPDATE_OWNER", entityType: "owners", entityId: owner.id }`
7. Return `{ success: true, data: null }`

**Notes:**
- No transaction needed — single table update, no financial data.
- Phone updates the `users` table (where `phone` column lives), NOT `owners`.
- Audit uses `UPDATE_OWNER` to match existing owner-domain audit actions.

#### 3b. `changePassword(values: unknown): Promise<ActionResult>`

Flow: validate → authenticate (proprietaire) → call Supabase Auth API → return.

1. Parse `values` with `changePasswordSchema.safeParse()`
2. Authenticate via `createClient()` → `getSession()`
3. Assert `role === "proprietaire"`
4. Call `supabase.auth.updateUser({ password: parsed.data.password })`
   - Returns `{ data, error }`. If `error`, return `{ success: false, error: error.message }`
5. Return `{ success: true, data: null }`

**Notes:**
- Uses SERVER-side Supabase client from `@/utils/supabase/server` (confirmed via Context7 MCP: `supabase.auth.updateUser({ password })` works on server client)
- No audit log for password change — Supabase Auth already tracks this in `auth.audit_log_entries`.
- No DB write — purely an Auth API call.

#### Helper: `getAuthenticatedOwner()`

Internal helper (not exported). Same pattern as `getAuthenticatedSyndic()` in `charges.ts`:

```
async function getAuthenticatedOwner() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const role = session.user.app_metadata?.user_role as string | undefined;
  if (role !== "proprietaire") return null;
  return { session, supabase };
}
```

Returns both `session` and `supabase` because `changePassword` needs the client instance.

---

### Step 4 — Fix IDOR in `createPayment`

**File:** `src/lib/actions/payments.ts`

**Current vulnerability:** The action accepts `ownerId` from client input for both syndic and proprietaire callers. A malicious proprietaire could submit another owner's ID.

**Fix:** After step 2 (authenticate), add an owner-resolution block for proprietaire:

```
// 2b. Proprietaire: override ownerId from JWT — prevent IDOR
let ownerId = parsed.data.ownerId;
if (role === "proprietaire") {
  const ownerRecord = await getOwnerByUserId(session.user.id);
  if (!ownerRecord) return { success: false, error: "Propriétaire introuvable" };
  ownerId = ownerRecord.id;

  // Also verify the charge belongs to the owner's apartment
  if (charge.apartmentId !== ownerRecord.apartmentId) {
    return { success: false, error: "Accès refusé" };
  }
}
```

**Changes required:**
1. Import `getOwnerByUserId` from `@/lib/db/queries/owners`
2. Add the IDOR block between steps 2–3 (before the charge load) — actually after step 3 (charge load) since we need `charge.apartmentId` for the cross-check
3. Replace `parsed.data.ownerId` with `ownerId` in the `tx.insert(payments).values(...)` call

**Ordering adjustment:** The IDOR block goes between step 3 (load charge) and step 4 (insert payment). The variable `ownerId` replaces `parsed.data.ownerId` in the insert.

---

### Step 5 — Extend `downloadPaymentNotice` for Proprietaire

**File:** `src/lib/actions/charges.ts`

**Current gate:** `getAuthenticatedSyndic()` rejects non-syndic users.

**New approach:** Replace the auth block with a dual-role authenticator:

```
// 1. Authenticate — allow both syndic and proprietaire
const supabase = await createClient();
const { data: { session } } = await supabase.auth.getSession();
if (!session) return { success: false, error: "Non authentifié" };

const role = session.user.app_metadata?.user_role as string | undefined;
if (role !== "syndic" && role !== "proprietaire") {
  return { success: false, error: "Accès refusé" };
}

// 2. Load charge
const charge = await getChargeById(chargeId);
if (!charge) return { success: false, error: "Charge introuvable" };

// 3. Authorize based on role
if (role === "syndic") {
  if (charge.syndicId !== session.user.id) {
    return { success: false, error: "Charge introuvable" };
  }
}
if (role === "proprietaire") {
  const ownerRecord = await getOwnerByUserId(session.user.id);
  if (!ownerRecord || charge.apartmentId !== ownerRecord.apartmentId) {
    return { success: false, error: "Accès refusé" };
  }
}

// 4. Resolve building
let building;
if (role === "syndic") {
  building = await getBuildingBySyndicId(session.user.id);
} else {
  const apartment = await getApartmentById(charge.apartmentId);
  building = apartment ? await getBuildingById(apartment.buildingId) : null;
}
if (!building) return { success: false, error: "Immeuble introuvable" };
```

**New imports:**
- `import { getBuildingById } from "@/lib/db/queries/buildings"` (from Step 2)
- `import { getOwnerByUserId } from "@/lib/db/queries/owners"` (already imported for `getOwnerByApartmentId`)

**Note:** The rest of the function (`renderPaymentNotice(...)` call and response) stays identical. Only the auth/authorization and building resolution blocks change.

---

### Step 6 — API Routes for Owner Portal

Three new route files. All follow the same pattern: authenticate → verify proprietaire → resolve owner record → call query helper → return JSON.

#### 6a. `src/app/api/portal/profile/route.ts` — GET

```
authenticate → getOwnerByUserId(userId) → getOwnerById(ownerId) → getApartmentById(aptId) → getBuildingById(apartment.buildingId)
```

Returns: `{ owner: { firstName, lastName, email, phone, ownershipDate }, apartment: { unitNumber, floor, surfaceArea, roomCount }, building: { name, address } }`

**Notes:**
- Read-only endpoint. No mutation.
- Joins user + owner + apartment + building data for the profile page.
- Uses existing query helpers — no new query function needed.

#### 6b. `src/app/api/portal/charges/route.ts` — GET

```
authenticate → getOwnerByUserId(userId) → getChargesForApartment(owner.apartmentId)
```

Returns: `charges[]` (same shape as `getChargesForApartment` output — includes computed `amountPaid`, `remainingAmount`, `status`).

#### 6c. `src/app/api/portal/payments/route.ts` — GET

```
authenticate → getOwnerByUserId(userId) → getPaymentsForOwner(owner.id)
```

Returns: `payments[]` (same shape as `getPaymentsForOwner` output — includes joined `chargeTitle`, `chargeCategory`).

**Shared auth pattern for all three routes:**

```typescript
const supabase = await createClient();
const { data: { session } } = await supabase.auth.getSession();
if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

const role = session.user.app_metadata?.user_role;
if (role !== "proprietaire") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

const ownerRecord = await getOwnerByUserId(session.user.id);
if (!ownerRecord) return NextResponse.json({ error: "Owner not found" }, { status: 404 });
```

---

### Step 7 — Install shadcn Tabs Component

**Command:**
```bash
pnpm dlx shadcn@canary add tabs
```

**Creates:** `src/components/ui/tabs.tsx`

**Verified via Context7 MCP:** Import pattern is:
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
```

Usage:
```tsx
<Tabs defaultValue="charges">
  <TabsList>
    <TabsTrigger value="charges">Mes charges</TabsTrigger>
    <TabsTrigger value="history">Historique</TabsTrigger>
  </TabsList>
  <TabsContent value="charges">...</TabsContent>
  <TabsContent value="history">...</TabsContent>
</Tabs>
```

---

### Step 8 — Profile Page UI

**Page (Server Component):** `src/app/(owner)/portal/page.tsx`

Renders heading + imports client component.

```tsx
import { ProfileView } from "@/components/features/portal/profile-view";

export default function PortalPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-[--text-primary]">Mon profil</h1>
      <ProfileView />
    </div>
  );
}
```

**Client Component:** `src/components/features/portal/profile-view.tsx`

`"use client"` — needs `useQuery`, form state, event handlers.

**Sections:**

1. **Read-only info card** — `Card` with: name, email, ownership date, apartment (unit, floor, surface, rooms), building (name, address). Fetched via `GET /api/portal/profile`. No edit capability.

2. **Phone edit section** — Inline edit with:
   - Display current phone (or "Non renseigné")
   - Edit button → shows `Input` + Save/Cancel
   - On save: call `updatePhone` Server Action via `useMutation`
   - Invalidate `['portal', 'profile']` query on success
   - `sonner` toast for success/error

3. **Password change form** — Separate `Card`:
   - React Hook Form with `changePasswordSchema` + `@hookform/resolvers/zod`
   - Two password `Input` fields (password + confirmPassword)
   - Submit button → call `changePassword` Server Action via `useMutation`
   - `sonner` toast for success/error
   - Clear form on success

**TanStack Query usage (confirmed via Context7 MCP):**
```tsx
const { data: profile, isLoading } = useQuery({
  queryKey: ['portal', 'profile'],
  queryFn: () => fetch('/api/portal/profile').then(r => r.json()),
});
```

---

### Step 9 — Payments Page UI

**Page (Server Component):** `src/app/(owner)/payments/page.tsx`

```tsx
import { OwnerPaymentsView } from "@/components/features/payments/owner-payments-view";

export default function OwnerPaymentsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-[--text-primary]">Mes paiements</h1>
      <OwnerPaymentsView />
    </div>
  );
}
```

**Client Component:** `src/components/features/payments/owner-payments-view.tsx`

`"use client"` — needs tabs, queries, mutation.

#### Tab 1: Charges (`value="charges"`)

- Fetch via `GET /api/portal/charges`
- Display as a `Table` with columns: Title, Category (badge), Total, Paid, Remaining, Status (StatusBadge), Due Date, Actions
- **Actions column:**
  - "Payer" button → opens Sheet with payment form (only if `status !== 'paid'`)
  - "Télécharger avis" button → calls `downloadPaymentNotice(chargeId)` and triggers browser download

**TanStack Query:**
```tsx
const { data: charges } = useQuery({
  queryKey: ['portal', 'charges'],
  queryFn: () => fetch('/api/portal/charges').then(r => r.json()),
});
```

#### Tab 2: Payment History (`value="history"`)

- Fetch via `GET /api/portal/payments`
- Display as a `Table` with columns: Date, Charge, Category (badge), Amount, Method (badge), Reference, Notes

**TanStack Query:**
```tsx
const { data: paymentsHistory } = useQuery({
  queryKey: ['portal', 'payments'],
  queryFn: () => fetch('/api/portal/payments').then(r => r.json()),
});
```

#### Payment Form (Sheet)

**Component:** `src/components/features/payments/owner-payment-form.tsx`

`"use client"` — React Hook Form + mutation.

- Opens in a `Sheet` when "Payer" is clicked on a charge row
- Pre-fills: `chargeId` (hidden), `ownerId` (hidden — but actually ignored by server, see Step 4)
- User fills: `amount` (max = remaining), `paymentDate`, `method` (select), `reference`, `notes`
- Uses existing `paymentSchema` from `src/lib/validations/payment.ts`
- Submit calls `createPayment` Server Action via `useMutation`
- On success: invalidate `['portal', 'charges']` and `['portal', 'payments']`, close Sheet, toast
- On error: toast with error message

**Partial payment support:** The amount `Input` must display the remaining amount as max. The form must allow any positive amount up to `remainingAmount`.

#### PDF Download Handler

In the charges tab actions column:

```tsx
async function handleDownload(chargeId: string) {
  const result = await downloadPaymentNotice(chargeId);
  if (!result.success) { toast.error(result.error); return; }
  const blob = new Blob(
    [Uint8Array.from(atob(result.data.buffer), c => c.charCodeAt(0))],
    { type: 'application/pdf' }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.data.filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

This pattern already exists in the syndic dashboard — reuse it identically.

---

### Step 10 — Vitest Unit Tests

**File:** `src/lib/actions/__tests__/portal.test.ts`

Follow the exact mock pattern from `payments.test.ts`:
- Mock `@/utils/supabase/server` with `createClient` → `{ auth: { getSession, updateUser } }`
- Mock `@/lib/db` with `insert`, `update`, `transaction`
- Mock query helpers as needed

#### Test cases for `updatePhone`:

1. ✅ Rejects invalid phone (too short)
2. ✅ Rejects unauthenticated user
3. ✅ Rejects syndic role
4. ✅ Rejects proprietaire with no owner record
5. ✅ Updates phone successfully
6. ✅ Clears phone when empty string is passed
7. ✅ Writes audit log with `UPDATE_OWNER` action

#### Test cases for `changePassword`:

1. ✅ Rejects mismatched passwords (Zod refine)
2. ✅ Rejects unauthenticated user
3. ✅ Rejects syndic role
4. ✅ Returns error when Supabase auth.updateUser fails
5. ✅ Changes password successfully

#### Test cases for `createPayment` IDOR fix:

Add to existing `src/lib/actions/__tests__/payments.test.ts`:

6. ✅ Proprietaire: overrides client-submitted ownerId with server-resolved ownerId
7. ✅ Proprietaire: rejects payment for charge not belonging to their apartment

#### Test cases for `downloadPaymentNotice` proprietaire path:

Add to existing `src/lib/actions/__tests__/charges.test.ts` (or create a new test block):

8. ✅ Proprietaire: downloads notice for own apartment's charge
9. ✅ Proprietaire: rejects download for another apartment's charge

**Estimated test count:** ~14 new tests → total ~78 tests

---

## File Change Matrix

| File | Action | Description |
|---|---|---|
| `src/lib/validations/profile.ts` | **Create** | `updatePhoneSchema`, `changePasswordSchema` |
| `src/lib/db/queries/buildings.ts` | **Edit** | Add `getBuildingById(id)` |
| `src/lib/actions/portal.ts` | **Create** | `updatePhone`, `changePassword`, `getAuthenticatedOwner` |
| `src/lib/actions/payments.ts` | **Edit** | IDOR fix: override `ownerId` for proprietaire, add apartment check |
| `src/lib/actions/charges.ts` | **Edit** | Dual-role auth in `downloadPaymentNotice`, proprietaire building resolution |
| `src/app/api/portal/profile/route.ts` | **Create** | GET — owner profile data |
| `src/app/api/portal/charges/route.ts` | **Create** | GET — charges for owner's apartment |
| `src/app/api/portal/payments/route.ts` | **Create** | GET — payment history for owner |
| `src/components/ui/tabs.tsx` | **Create** | Via `pnpm dlx shadcn@canary add tabs` |
| `src/app/(owner)/portal/page.tsx` | **Edit** | Import `ProfileView` |
| `src/components/features/portal/profile-view.tsx` | **Create** | Profile page client component |
| `src/app/(owner)/payments/page.tsx` | **Edit** | Import `OwnerPaymentsView` |
| `src/components/features/payments/owner-payments-view.tsx` | **Create** | Two-tab payments page client component |
| `src/components/features/payments/owner-payment-form.tsx` | **Create** | Payment Sheet form for proprietaire |
| `src/lib/actions/__tests__/portal.test.ts` | **Create** | Tests for updatePhone, changePassword |
| `src/lib/actions/__tests__/payments.test.ts` | **Edit** | Add IDOR fix tests |
| `src/lib/actions/__tests__/charges.test.ts` | **Edit** | Add proprietaire download tests |

---

## Implementation Order & Dependencies

```
Step 1  → Zod schemas (no dependencies)
Step 2  → getBuildingById (no dependencies)
Step 3  → portal.ts actions (depends on Step 1)
Step 4  → IDOR fix (no dependencies)
Step 5  → downloadPaymentNotice extension (depends on Step 2)
Step 6  → API routes (depends on Step 2 for profile route)
Step 7  → shadcn Tabs install (no dependencies)
Step 8  → Profile page UI (depends on Steps 3, 6a, 7)
Step 9  → Payments page UI (depends on Steps 4, 5, 6b, 6c, 7)
Step 10 → Vitest tests (depends on Steps 3, 4, 5)
```

**Parallelizable:** Steps 1, 2, 4, 7 can be done in any order. Steps 3 + 5 need 1 + 2 respectively. Steps 8 + 9 are the final UI work.

---

## Verification Criteria

### Backend
- [ ] `updatePhone` validates, authenticates proprietaire, updates `users.phone`, writes audit log
- [ ] `changePassword` validates, authenticates proprietaire, calls `supabase.auth.updateUser({ password })`
- [ ] `createPayment` with `role=proprietaire` ignores client `ownerId`, resolves from JWT, verifies charge belongs to owner's apartment
- [ ] `downloadPaymentNotice` with `role=proprietaire` returns PDF for own apartment's charge, rejects cross-apartment
- [ ] All three portal API routes return correct data scoped to the authenticated owner

### Frontend
- [ ] Profile page shows read-only info (name, email, apartment, building) + editable phone + password form
- [ ] Payments page Tab 1 shows charges with computed status, "Payer" and "Télécharger" buttons
- [ ] Payments page Tab 2 shows payment history with charge context
- [ ] Payment Sheet form enforces `amount ≤ remainingAmount`, pre-fills charge context
- [ ] PDF download triggers browser save dialog with correct filename
- [ ] All mutations show success/error toasts via `sonner`
- [ ] Dark theme CSS variables used consistently (`--bg-base`, `--text-primary`, `--text-secondary`, `--border-primary`, etc.)

### Tests
- [ ] All new tests pass: `pnpm vitest run`
- [ ] No regressions in existing 64 tests
- [ ] Total test count ≥ 78

### Security
- [ ] No proprietaire endpoint leaks data from other owners/apartments
- [ ] `ownerId` is NEVER trusted from client input when `role=proprietaire`
- [ ] Password change uses server-side Supabase client, never browser client
- [ ] All list queries include `deleted_at IS NULL` filter (via query helpers)

---

## Key Decisions & Rationale

| Decision | Rationale |
|---|---|
| New `portal.ts` action file (not extending `owners.ts`) | `owners.ts` is syndic-domain (CRUD). Portal actions are proprietaire-domain (self-service). Clean separation. |
| `getBuildingById` instead of chaining in the action | DRY helper — portal profile API also needs it. Follows the project pattern of thin actions / fat query helpers. |
| No `getOwnerProfile` composite query | Three existing helpers (`getOwnerById` + `getApartmentById` + `getBuildingById`) compose cleanly. A monolithic join would duplicate logic. |
| Tabs component installed via shadcn CLI | Project uses shadcn canary for Tailwind v4. Manual creation risks mismatched styles. |
| Password change has no custom audit log | Supabase writes to `auth.audit_log_entries` automatically. Duplicating in `audit_logs` adds no value and leaks auth concerns into the app layer. |
| `updatePhoneSchema` separate from `ownerSchema` | `ownerSchema` is the full syndic-facing owner creation schema. Phone self-edit is a minimal proprietaire-facing schema. Sharing would force optional fields in the wrong context. |
