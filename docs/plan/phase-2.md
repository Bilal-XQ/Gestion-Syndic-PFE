# Phase 2 — Syndic Dashboard Implementation Plan

**Created:** March 3, 2026
**Status:** Ready for implementation
**Prerequisite:** Phase 1 complete — 17 routes passing, all 10 tables with RLS enabled

---

## Supabase MCP Pre-Check Results

| Check | Result |
|---|---|
| All 10 tables exist | ✅ `users`, `buildings`, `apartments`, `owners`, `charges`, `payments`, `meetings`, `meeting_invitations`, `notifications`, `audit_logs` |
| RLS enabled on all tables | ✅ All 10 tables have `rowsecurity = true` |
| Custom Access Token Hook registered | ✅ `custom_access_token_hook` function exists — reads `role` from `public.users`, injects into `app_metadata.user_role` |
| RLS policies | ✅ 26 policies across all tables — per-role SELECT/INSERT/UPDATE/ALL as specified in `.github/skills/supabase-rls/SKILL.md` |
| Seed data in `buildings` | ❌ 0 rows — building must be seeded when syndic account is provisioned |
| Seed data in `users` | ❌ 0 rows — need a syndic user to test |
| `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` | ❌ Not configured — required for `supabase.auth.admin.createUser()` in owner registration |

---

## Context7 Documentation Findings

| Library | Key API Notes |
|---|---|
| **TanStack Query v5** | `QueryClientProvider` wraps app; `useQuery({ queryKey, queryFn })` — no `onSuccess`/`onError` on `useQuery` (removed in v5); `useMutation` has `onSuccess`/`onError`/`onSettled`; `queryClient.invalidateQueries({ queryKey: ['owners'] })` |
| **React Hook Form v7** | `useForm<T>({ resolver: zodResolver(schema), defaultValues })` — `form.register('field')`, `form.handleSubmit(onSubmit)`, `form.formState.errors`, `form.reset()` |
| **@hookform/resolvers 5.2.2** | `import { zodResolver } from '@hookform/resolvers/zod'` — wraps Zod v4 schema for RHF integration |
| **Resend** | `new Resend(process.env.RESEND_API_KEY)` → `resend.emails.send({ from, to, subject, react: <Template /> })` — `react` prop accepts JSX directly |
| **shadcn/ui canary** | Sheet: `<Sheet>` + `<SheetContent>` + `<SheetHeader>` / `<SheetTitle>`; AlertDialog: `<AlertDialog>` + `<AlertDialogContent>` + `<AlertDialogAction/Cancel>`; Select: `<Select>` + `<SelectTrigger>` + `<SelectContent>` + `<SelectItem>` |

---

## Step 1: Install Missing Dependencies & Configure Environment

**Files to create or modify:**
- `package.json` (verify deps)
- `.env.local` (add `SUPABASE_SERVICE_ROLE_KEY`)
- `.env.example` (add placeholder)

**Implementation notes:**
- Run `pnpm dlx shadcn@canary add select` to install the Select component (Sheet, AlertDialog, Table, Input, Label, Card already installed in Phase 1).
- Verify `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `resend`, `@react-email/components` are already in `package.json` — they are (confirmed from Phase 1 install). No new `pnpm add` needed for those.
- Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`. This key is found in Supabase Dashboard → Settings → API → `service_role` key. It is required for `supabase.auth.admin.createUser()` when registering new owners.
- Add the placeholder to `.env.example` too.

**Supabase MCP action:** None (manual dashboard lookup for service role key).

**Verification:**
- `pnpm tsc --noEmit` passes
- `src/components/ui/select.tsx` exists after shadcn install

---

## Step 2: Create Supabase Admin Client Utility

**Files to create:**
- `src/utils/supabase/admin.ts`

**Implementation notes:**
- Export an `async function createAdminClient()` that creates a Supabase client using `SUPABASE_SERVICE_ROLE_KEY` instead of the anon key. This client bypasses RLS and is required for `auth.admin.createUser()` during owner registration.
- This file is server-only — it accesses a secret env var. Never import from Client Components.
- Pattern per `supabase.instructions.md`: the admin client should be in `src/utils/supabase/` alongside the other client utilities.
- Uses `createClient` from `@supabase/supabase-js` (not `@supabase/ssr`) since it doesn't need cookie-based auth.

**Verification:**
- `pnpm tsc --noEmit` passes
- The module exports `createAdminClient` and reads `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 3: Scaffold TanStack Query Provider

**Files to create:**
- `src/components/providers/query-provider.tsx`

**Files to modify:**
- `src/app/(syndic)/layout.tsx` — wrap children with `QueryClientProvider`

**Implementation notes:**
- Per Context7 TanStack Query v5 docs: create a `"use client"` provider component that instantiates `QueryClient` with `useState` (to prevent sharing across requests in SSR — standard Next.js pattern).
- Wrap the syndic layout children with `<QueryProvider>`. The provider must be a Client Component but the layout itself stays as a Server Component — just imports and renders the provider.
- Do NOT add to the root layout — only syndic routes need it for Phase 2. The owner portal will get it in Phase 5.
- Per `ai-lessons.md`: never use `onSuccess`/`onError` on `useQuery` — these were removed in v5.
- Default `staleTime` can be set to `60 * 1000` (1 minute) for the dashboard.

**Verification:**
- `pnpm tsc --noEmit` passes
- `pnpm build` passes — the provider doesn't break SSR

---

## Step 4: Create Drizzle Query Helpers

**Files to create:**
- `src/lib/db/queries/owners.ts`
- `src/lib/db/queries/apartments.ts`
- `src/lib/db/queries/buildings.ts`

**Implementation notes:**

**`owners.ts`** — per `drizzle.instructions.md`:
- `getActiveOwners(syndicId?)` → joins `owners` + `users` + `apartments`, filters `isNull(owners.deletedAt)` AND `isNull(users.deletedAt)`. Returns full name, email, phone, apartment unit number.
- `getOwnerById(id)` → single owner with user and apartment info, soft-delete check.
- `getOwnerByApartmentId(apartmentId)` → check if an active owner is assigned (used for apartment delete guard).

**`apartments.ts`** — per `drizzle.instructions.md`:
- `getApartments(buildingId)` → all apartments for a building. No `deletedAt` column on apartments table (confirmed from schema — apartments has no soft-delete), so just filter by `buildingId`.
- `getApartmentById(id)` → single apartment with building info.
- `getVacantApartments(buildingId)` → apartments where `status = 'vacant'` (used for owner form dropdown).

**`buildings.ts`**:
- `getBuildingBySyndicId(syndicId)` → single building for the authenticated syndic. Returns the first (and only at MVP) building row.

**Critical rules:**
- Every query helper that touches a soft-delete table MUST include `where(isNull(table.deletedAt))`.
- Import `db` from `src/lib/db/index.ts` — never inline.
- Import schema tables from `src/lib/db/schema.ts`.

**Verification:**
- `pnpm tsc --noEmit` passes
- Each helper function signature is correct and returns properly typed results

---

## Step 5: Create Zod Validation Schemas

**Files to create:**
- `src/lib/validations/owner.ts`
- `src/lib/validations/apartment.ts`
- `src/lib/validations/settings.ts`

**Implementation notes:**

Per `validations.instructions.md` — one schema per domain, shared client + server, Zod v4 API:

**`owner.ts`:**
```
ownerSchema: firstName (string, min 1), lastName (string, min 1), email (string, email), phone (string, optional), apartmentId (string, uuid), ownershipDate (string, date format)
```
- Export `type OwnerFormValues = z.infer<typeof ownerSchema>`

**`apartment.ts`:**
```
apartmentSchema: unitNumber (string, min 1), floor (number/coerce, integer), surfaceArea (number/coerce, positive), roomCount (number/coerce, integer, min 1), status (z.enum(['occupied', 'vacant']))
```
- Status enum MUST match the CHECK constraint in `schema.ts`: `('occupied', 'vacant')`
- Export `type ApartmentFormValues = z.infer<typeof apartmentSchema>`

**`settings.ts`:**
```
settingsSchema: name (string, min 1), address (string, min 1), contactPhone (string, optional), contactEmail (string, email, optional)
```
- Note: `contactPhone` and `contactEmail` are used for display on PDFs. They are NOT columns in the `buildings` table — we'll need to check if these need to be added. The PRD says "syndic contact phone and syndic contact email" but the current `buildings` table only has `name` and `address`. These may come from the `users` table (the syndic's phone and email). If so, the settings form reads syndic user info + building info together.
- **Decision:** The settings form should update `buildings.name` and `buildings.address`. The syndic contact info (phone, email) is read from the `users` table (the syndic's own profile). The settings form can show these as read-only or editable (if editable, update `users.phone` and `users.email` in the same action). For simplicity, the schema only validates `name` and `address` as the building-specific fields, plus optional phone/email fields that update the syndic user record.
- Export `type SettingsFormValues = z.infer<typeof settingsSchema>`

**Verification:**
- `pnpm tsc --noEmit` passes
- All enum values match database CHECK constraints

---

## Step 6: Create Server Actions — Settings

**Files to create:**
- `src/lib/actions/settings.ts`

**Implementation notes:**

Per `server-actions.instructions.md` — standard action sequence:

**`updateBuilding(values: SettingsFormValues)`:**
1. Validate with `settingsSchema.safeParse()` — use `.issues[0].message` (Zod v4)
2. Authenticate: `createClient()` → `getSession()` → verify `user_role === 'syndic'`
3. Get the syndic's building via `getBuildingBySyndicId(session.user.id)`
4. Update `buildings` row: `db.update(buildings).set({ name, address, updatedAt: new Date() }).where(eq(buildings.id, building.id))`
5. If phone/email fields provided, also update `users` row for the syndic
6. Insert audit log (outside transaction — no transaction needed here since no payment writes):
   ```
   { userId: session.user.id, action: 'UPDATE_BUILDING', entityType: 'buildings', entityId: building.id }
   ```
7. Return `{ success: true, data: null }`

**Verification:**
- `pnpm tsc --noEmit` passes
- Action uses exact audit identifier `UPDATE_BUILDING`

---

## Step 7: Create Server Actions — Apartments

**Files to create:**
- `src/lib/actions/apartments.ts`

**Implementation notes:**

Per `server-actions.instructions.md`:

**`createApartment(values: ApartmentFormValues)`:**
1. Validate with `apartmentSchema.safeParse()`
2. Authenticate: verify `user_role === 'syndic'`
3. Get the syndic's building ID via `getBuildingBySyndicId()`
4. Insert into `apartments`: `{ buildingId, unitNumber, floor, surfaceArea, roomCount, status: 'vacant' }`
5. Audit log: `{ action: 'CREATE_APARTMENT', entityType: 'apartments', entityId: newApt.id }`
6. Return `{ success: true, data: newApt }`

**`updateApartment(id: string, values: Partial<ApartmentFormValues>)`:**
1. Validate, authenticate
2. Verify apartment belongs to syndic's building (via query helper)
3. Update apartment row (only `unitNumber`, `floor`, `surfaceArea`, `roomCount` — NOT `status`, which is managed by owner actions)
4. Audit log: `{ action: 'UPDATE_APARTMENT', entityType: 'apartments', entityId: id }`
5. Return `{ success: true, data: updatedApt }`

**`deleteApartment(id: string)`:**
1. Authenticate: verify `user_role === 'syndic'`
2. Check: `getOwnerByApartmentId(id)` — if an active owner exists, return `{ success: false, error: "Impossible de supprimer : un copropriétaire actif est assigné." }`
3. The `apartments` table does NOT have `deletedAt` (per schema). The PRD says "Soft-delete an apartment only if no active owner is assigned." However, the schema has no `deletedAt` on apartments. **Resolution:** We need to add a `deleted_at` column to `apartments` via a Drizzle migration, OR we hard-delete apartments (only permitted because they have no financial records directly). **Per PRD:** "No hard deletes... apartments: soft-delete via `deleted_at`" — but the Phase 1 schema omitted `deletedAt` from apartments. **This is a schema fix needed.** See Step 7b.
4. Audit log: `{ action: 'DELETE_APARTMENT', entityType: 'apartments', entityId: id }`
5. Return `{ success: true, data: null }`

**Verification:**
- `pnpm tsc --noEmit` passes
- Creates use `status: 'vacant'` by default
- Delete guard checks for active owners before proceeding
- All audit identifiers exact: `CREATE_APARTMENT`, `UPDATE_APARTMENT`, `DELETE_APARTMENT`

---

## Step 7b: Schema Fix — Add `deleted_at` to Apartments

**Files to modify:**
- `src/lib/db/schema.ts` — add `deletedAt: timestamp('deleted_at')` to `apartments` + add `deletedAtIdx`

**Migration (use drizzle-migration skill):**
1. Edit `schema.ts` — add nullable `deletedAt` column and index
2. Run `pnpm drizzle-kit generate`
3. Review generated SQL — should be `ALTER TABLE apartments ADD COLUMN deleted_at TIMESTAMP;` + index
4. Run `pnpm drizzle-kit migrate`
5. Verify in Drizzle Studio

**Implementation notes:**
- Per `drizzle.instructions.md`: soft-delete columns are always nullable timestamps with no default.
- Update `getApartments()` query helper to add `isNull(apartments.deletedAt)` filter.
- No RLS policy change needed — the existing `syndic_all_apartments` policy uses `building_id IN (...)` which still works.

**Verification:**
- Migration SQL reviewed — no unintended drops
- `pnpm tsc --noEmit` passes after schema change
- Query helper updated to filter `deleted_at IS NULL`

---

## Step 8: Create Server Actions — Owners

**Files to create:**
- `src/lib/actions/owners.ts`

**Implementation notes:**

Per `server-actions.instructions.md` — this is the most complex action file in Phase 2:

**`createOwner(values: OwnerFormValues)`:**
1. Validate with `ownerSchema.safeParse()`
2. Authenticate: verify `user_role === 'syndic'`
3. Generate a temporary password (e.g., `crypto.randomUUID().slice(0, 12)`)
4. Create Supabase Auth account using the **admin client** (`createAdminClient()` from Step 2):
   ```
   supabaseAdmin.auth.admin.createUser({
     email: values.email,
     password: tempPassword,
     email_confirm: true,
   })
   ```
5. Insert into `users` table: `{ id: authUser.id, email, firstName, lastName, phone, role: 'proprietaire' }`
6. Insert into `owners` table: `{ userId: authUser.id, apartmentId: values.apartmentId, ownershipDate: values.ownershipDate }`
7. **Apartment status transition:** Update `apartments.status = 'occupied'` WHERE `id = values.apartmentId`. Per `server-actions.instructions.md`: this happens inside `owners.ts`, never standalone.
8. Send welcome email via Resend (Step 9's template): `resend.emails.send({ from, to: values.email, subject, react: <WelcomeEmail ... /> })`
9. Audit log (outside any transaction):
   ```
   { action: 'CREATE_OWNER', entityType: 'owners', entityId: newOwner.id }
   ```
10. Return `{ success: true, data: newOwner }`

**Error handling:** If auth account creation fails, don't insert the user/owner rows. If user/owner insert fails after auth creation, attempt to delete the auth user (`admin.deleteUser`) for cleanup. Wrap carefully.

**`updateOwner(id: string, values: Partial<OwnerFormValues>)`:**
1. Validate, authenticate
2. Get existing owner record
3. Update `users` row (firstName, lastName, phone)
4. If `apartmentId` changed (reassignment):
   - Set old apartment `status = 'vacant'`
   - Set new apartment `status = 'occupied'`
   - Update `owners.apartmentId`
5. Audit log: `{ action: 'UPDATE_OWNER', entityType: 'owners', entityId: id }`
6. Return `{ success: true, data: updatedOwner }`

**`deleteOwner(id: string)`:**
1. Authenticate: verify `user_role === 'syndic'`
2. Get owner record with apartment info
3. Soft-delete: `db.update(owners).set({ deletedAt: new Date() }).where(eq(owners.id, id))`
4. Also soft-delete the user record: `db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, owner.userId))`
5. **Apartment status transition:** Set `apartments.status = 'vacant'` for the owner's apartment
6. Audit log: `{ action: 'DELETE_OWNER', entityType: 'owners', entityId: id }`
7. Return `{ success: true, data: null }`

**Critical rules:**
- Apartment status transitions happen ONLY in `owners.ts` actions — never standalone
- Email uses Resend — never direct SMTP
- Admin client for auth user creation — anon client cannot create users
- Audit log inserts use `db` (not `tx`) — outside any transaction

**Verification:**
- `pnpm tsc --noEmit` passes
- All three audit identifiers exact: `CREATE_OWNER`, `UPDATE_OWNER`, `DELETE_OWNER`
- Apartment status transitions covered for: create (→ occupied), reassign (old → vacant, new → occupied), delete (→ vacant)

---

## Step 9: Create Welcome Email Template

**Files to create:**
- `src/lib/email/templates/welcome.tsx`

**Implementation notes:**
- Per Context7 Resend docs: define a React component that accepts props (`firstName`, `lastName`, `email`, `tempPassword`, `loginUrl`).
- Use `@react-email/components` primitives: `Html`, `Body`, `Container`, `Heading`, `Text`, `Button`, `Hr`, `Section`.
- The template must include:
  - Welcome greeting with the owner's name
  - Their login email
  - Their temporary password
  - A button/link to the login page
  - Instruction to change password on first login
- Keep styling minimal — inline CSS only (email client compatibility).
- Per `server-actions.instructions.md`: Resend emails are called from Server Actions only.

**Verification:**
- `pnpm tsc --noEmit` passes
- Component exports properly typed props interface

---

## Step 10: Build Shared StatusBadge Component

**Files to create:**
- `src/components/features/shared/StatusBadge.tsx`

**Implementation notes:**
- Per `.github/skills/shadcn-component/SKILL.md` → Status badge component section:
  - Type union for all status values: `'paid' | 'partial' | 'unpaid' | 'occupied' | 'vacant' | 'scheduled' | 'completed' | 'cancelled' | 'accepted' | 'declined' | 'invited'`
  - `statusConfig` maps each status to `{ label, color, bg }` using THEME.md semantic tokens
  - Renders a `<span>` with `rounded-full px-[10px] py-[2px] text-xs font-medium`
  - Uses inline `style={{ color, backgroundColor: bg }}` for the status colors
- French labels: `Occupé`, `Vacant`, `Payé`, `Partiel`, `Impayé`, etc.
- This component is NOT a Client Component — it's a pure presentational component with no interactivity.

**Verification:**
- `pnpm tsc --noEmit` passes
- Component accepts `status` prop with correct type union

---

## Step 11: Build Apartment Management UI

**Files to create:**
- `src/components/features/apartments/apartments-table.tsx` — Client Component with `useQuery`, search filter, Table
- `src/components/features/apartments/apartment-panel.tsx` — Client Component with Sheet, React Hook Form, zodResolver
- `src/components/features/apartments/delete-apartment-dialog.tsx` — Client Component with AlertDialog

**Files to modify:**
- `src/app/(syndic)/dashboard/apartments/page.tsx` — Server Component that renders `<ApartmentsTable />`

**Implementation notes:**

Per `.github/skills/shadcn-component/SKILL.md`:

**`apartments-table.tsx`** (Client Component):
- `useQuery({ queryKey: ['apartments'], queryFn })` — fetches from a Server Action or dedicated fetch helper
- Renders shadcn `Table` with columns: unit number, floor, surface area, room count, status badge (using `StatusBadge`)
- Row actions: Edit button (opens `ApartmentPanel` in edit mode), Delete button (opens `DeleteApartmentDialog`)
- "Ajouter un appartement" button in top-right opens `ApartmentPanel` in create mode
- Per THEME.md: header text `text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]`, row hover `hover:bg-[--bg-card-hover]`, no zebra striping

**`apartment-panel.tsx`** (Client Component):
- Sheet panel per skill file pattern: `useForm<ApartmentFormValues>({ resolver: zodResolver(apartmentSchema), defaultValues })`
- Fields: unit number (Input), floor (Input type number), surface area (Input type number), room count (Input type number)
- Note: `status` is NOT editable in the form — it's managed automatically by owner actions
- On submit: call `createApartment` or `updateApartment` server action
- On success: `toast.success()`, `queryClient.invalidateQueries({ queryKey: ['apartments'] })`, close sheet, `form.reset()`
- On error: `toast.error(result.error)`

**`delete-apartment-dialog.tsx`** (Client Component):
- AlertDialog per skill file pattern
- On confirm: call `deleteApartment` server action
- If result has error (active owner guard), `toast.error(result.error)`
- On success: `queryClient.invalidateQueries({ queryKey: ['apartments'] })`, close dialog

**`apartments/page.tsx`** (Server Component — NO `"use client"`):
- Import and render `<ApartmentsTable />`
- Page heading "Appartements"

**Verification:**
- `pnpm tsc --noEmit` passes
- No `"use client"` on page.tsx
- Table uses THEME.md tokens only — no hard-coded hex
- Delete dialog guards against apartments with active owners
- All forms use shared Zod schema from `src/lib/validations/apartment.ts`

---

## Step 12: Build Owner Management UI

**Files to create:**
- `src/components/features/owners/owners-table.tsx` — Client Component with `useQuery`, search/filter, Table
- `src/components/features/owners/owner-panel.tsx` — Client Component with Sheet, React Hook Form, Select for apartment dropdown
- `src/components/features/owners/delete-owner-dialog.tsx` — Client Component with AlertDialog

**Files to modify:**
- `src/app/(syndic)/dashboard/owners/page.tsx` — Server Component that renders `<OwnersTable />`

**Implementation notes:**

**`owners-table.tsx`** (Client Component):
- `useQuery({ queryKey: ['owners'], queryFn })` — fetches active owners via query helper
- Searchable: local filter on name or email using `useState` + text input
- Renders shadcn `Table` with columns: full name (firstName + lastName), email, phone, apartment unit number
- Row actions: Edit (opens `OwnerPanel` edit mode), Delete (opens `DeleteOwnerDialog`)
- "Ajouter un copropriétaire" button opens `OwnerPanel` in create mode
- Per THEME.md table guidelines: header uppercase, no zebra, hover only

**`owner-panel.tsx`** (Client Component):
- Sheet panel per skill file
- `useForm<OwnerFormValues>({ resolver: zodResolver(ownerSchema), defaultValues })`
- Fields: first name (Input), last name (Input), email (Input, disabled in edit mode — email can't change), phone (Input), apartment (Select dropdown with vacant apartments from `useQuery({ queryKey: ['apartments', 'vacant'] })`), ownership date (Input type date)
- **Important:** In edit mode, the apartment Select should show ALL apartments (not just vacant) since the owner already has one assigned. In create mode, show only vacant apartments.
- On submit: call `createOwner` or `updateOwner`
- Success flow: toast, invalidate `['owners']` AND `['apartments']` (because apartment status changes), close sheet, reset form

**`delete-owner-dialog.tsx`** (Client Component):
- AlertDialog pattern
- French text: "Êtes-vous sûr ?", "Cette action archivera le copropriétaire. Ses données financières seront conservées."
- On confirm: call `deleteOwner`, invalidate `['owners']` AND `['apartments']`

**`owners/page.tsx`** (Server Component):
- Import and render `<OwnersTable />`
- Page heading "Copropriétaires"

**Verification:**
- `pnpm tsc --noEmit` passes
- No `"use client"` on page.tsx
- Apartment dropdown in create mode: only vacant apartments
- Email field disabled in edit mode
- Both `['owners']` and `['apartments']` query keys invalidated on mutations (cascading status change)
- TanStack Query — no `onSuccess`/`onError` on `useQuery` calls

---

## Step 13: Build Building Settings Page

**Files to create:**
- `src/components/features/settings/settings-form.tsx` — Client Component with React Hook Form

**Files to modify:**
- `src/app/(syndic)/dashboard/settings/page.tsx` — Server Component that fetches current building data and passes to form

**Implementation notes:**

**`settings-form.tsx`** (Client Component):
- `useForm<SettingsFormValues>({ resolver: zodResolver(settingsSchema), defaultValues: { name, address, contactPhone, contactEmail } })`
- Fields: building name (Input), address (Input or Textarea), syndic phone (Input), syndic email (Input)
- Single "Enregistrer" button — no Sheet needed (inline form on the page)
- On submit: call `updateBuilding` server action
- On success: `toast.success("Paramètres mis à jour")`
- On error: `toast.error(result.error)`
- No TanStack Query needed here — the form is pre-populated from props passed by the server. After save, the page can revalidate or the form just keeps the new values.

**`settings/page.tsx`** (Server Component):
- Fetch current building data server-side using `getBuildingBySyndicId()`
- Fetch syndic user data for contact info
- If no building exists yet, show a message or create a default one
- Pass data as `defaultValues` prop to `<SettingsForm />`
- Page heading "Paramètres de l'immeuble"

**Verification:**
- `pnpm tsc --noEmit` passes
- No `"use client"` on page.tsx
- Form uses shared Zod schema from `src/lib/validations/settings.ts`
- UPDATE_BUILDING audit log fires on save

---

## Step 14: Wire Dashboard Overview with Real Metrics

**Files to create:**
- `src/lib/db/queries/dashboard.ts` — query helpers for overview metrics
- `src/components/features/dashboard/metric-cards.tsx` — Server Component or Client Component for metric display

**Files to modify:**
- `src/app/(syndic)/dashboard/page.tsx` — fetch real data and display

**Implementation notes:**

**`dashboard.ts`** query helpers:
- `getDashboardMetrics(syndicId)` → returns:
  - Total active owners: `COUNT(owners) WHERE deleted_at IS NULL`
  - Total apartments: `COUNT(apartments) WHERE building_id IN syndic's buildings` (and `deleted_at IS NULL` after Step 7b)
  - Total active charges: `COUNT(charges) WHERE deleted_at IS NULL AND syndic_id = syndicId` (this becomes a real number in Phase 3; for Phase 2 it will be 0)
  - Total payments received: `COUNT(payments)` where charge belongs to syndic (also 0 in Phase 2)
- These are simple aggregate queries, no derived financial values

**`metric-cards.tsx`:**
- Per THEME.md metric card spec: `rounded-[20px] border border-[--border-subtle] bg-[--bg-card] p-5`
- Four cards: Copropriétaires, Appartements, Charges, Paiements
- Each shows a count value in `font-semibold text-xl text-[--text-primary]` + label in `text-sm text-[--text-secondary]`
- Icons from lucide-react: Users, Building2, Receipt, CreditCard

**`dashboard/page.tsx`** (Server Component):
- Fetch metrics server-side (no need for TanStack Query — this page is a Server Component)
- Render `<MetricCards metrics={data} />`
- Below: a placeholder for the overdue charges table (will be wired in Phase 3 when charges exist)

**Verification:**
- `pnpm tsc --noEmit` passes
- All metrics come from query helpers — no raw SQL in the page
- Metric values are real counts (will be 0 initially until data is seeded)

---

## Step 15: Seed Syndic Account & Building

**Files to create:**
- `src/lib/db/seed.ts` — idempotent seed script

**Implementation notes:**
- Create a seed script that:
  1. Creates a syndic user in Supabase Auth via admin API (or uses an existing one)
  2. Inserts a row in `public.users` with `role: 'syndic'`
  3. Inserts a row in `public.buildings` with the syndic's ID, a default name and address
- The script should be idempotent — check if the syndic email already exists before creating.
- Per PRD: "The building record is created automatically when the syndic account is provisioned."
- Run with `pnpm db:seed` (script already defined in package.json)
- Use hardcoded test credentials (email: `syndic@test.com`, password: `Test1234!`) for development

**Supabase MCP action:** After running the seed, verify with:
```sql
SELECT * FROM users WHERE role = 'syndic';
SELECT * FROM buildings;
```

**Verification:**
- `pnpm db:seed` runs without error
- 1 row in `users` with `role = 'syndic'`
- 1 row in `buildings` with the syndic's ID
- Syndic can log in at `/login` with test credentials and see the dashboard

---

## Step 16: Write Vitest Unit Tests

**Files to create:**
- `src/lib/actions/__tests__/apartments.test.ts`
- `src/lib/actions/__tests__/owners.test.ts`

**Implementation notes:**
- Per PRD Phase 2: "Write Vitest unit tests for owner and apartment Server Actions including apartment status transition logic."
- Tests should mock `db`, `createClient`, and `createAdminClient`

**`apartments.test.ts`:**
- `createApartment` — inserts with correct values, default `status: 'vacant'`, writes `CREATE_APARTMENT` audit log
- `updateApartment` — updates only allowed fields, writes `UPDATE_APARTMENT` audit log
- `deleteApartment` — rejects if active owner assigned, succeeds if no active owner, writes `DELETE_APARTMENT` audit log
- Unauthorized calls (non-syndic) return `{ success: false }`

**`owners.test.ts`:**
- `createOwner` — creates auth user, inserts users + owners rows, sets apartment to `occupied`, sends welcome email, writes `CREATE_OWNER` audit log
- `updateOwner` — updates user fields, apartment reassignment transitions old → `vacant` and new → `occupied`, writes `UPDATE_OWNER` audit log
- `deleteOwner` — soft-deletes owner + user, sets apartment to `vacant`, writes `DELETE_OWNER` audit log
- **Apartment status transition tests:**
  - Creating owner on vacant apartment → apartment becomes `occupied`
  - Reassigning owner from apt A to apt B → A becomes `vacant`, B becomes `occupied`
  - Soft-deleting owner → apartment becomes `vacant`

**Verification:**
- `pnpm test:run` passes all tests
- Test coverage includes all apartment status transition scenarios
- No tests create real Supabase auth users (all mocked)

---

## Step 17: Full Build Verification

**Files to modify:** None — verification only

**Verification checklist:**
1. `pnpm tsc --noEmit` — zero TypeScript errors
2. `pnpm build` — production build passes, all routes render
3. `pnpm test:run` — all unit tests pass
4. Manual smoke test:
   - Log in as syndic → redirected to `/dashboard`
   - `/dashboard` shows 4 metric cards with real counts
   - `/dashboard/apartments` — create, edit, delete apartments
   - `/dashboard/owners` — create owner (check welcome email in Resend dashboard), edit, soft-delete
   - `/dashboard/settings` — update building name/address, verify toast
   - Apartment status badge changes when owner is created/deleted
   - Audit log entries written (verify via Supabase dashboard: `SELECT * FROM audit_logs`)

---

## Summary

| Step | Description | Files |
|---|---|---|
| 1 | Install deps & env vars | `package.json`, `.env.local`, `.env.example` |
| 2 | Supabase admin client | `src/utils/supabase/admin.ts` |
| 3 | TanStack Query provider | `src/components/providers/query-provider.tsx`, `(syndic)/layout.tsx` |
| 4 | Drizzle query helpers | `src/lib/db/queries/owners.ts`, `apartments.ts`, `buildings.ts` |
| 5 | Zod validation schemas | `src/lib/validations/owner.ts`, `apartment.ts`, `settings.ts` |
| 6 | Settings server action | `src/lib/actions/settings.ts` |
| 7 | Apartment server actions | `src/lib/actions/apartments.ts` |
| 7b | Schema fix: `deleted_at` on apartments | `src/lib/db/schema.ts`, Drizzle migration |
| 8 | Owner server actions | `src/lib/actions/owners.ts` |
| 9 | Welcome email template | `src/lib/email/templates/welcome.tsx` |
| 10 | StatusBadge component | `src/components/features/shared/StatusBadge.tsx` |
| 11 | Apartment management UI | `apartments-table.tsx`, `apartment-panel.tsx`, `delete-apartment-dialog.tsx`, `apartments/page.tsx` |
| 12 | Owner management UI | `owners-table.tsx`, `owner-panel.tsx`, `delete-owner-dialog.tsx`, `owners/page.tsx` |
| 13 | Building settings page | `settings-form.tsx`, `settings/page.tsx` |
| 14 | Dashboard overview metrics | `src/lib/db/queries/dashboard.ts`, `metric-cards.tsx`, `dashboard/page.tsx` |
| 15 | Seed syndic account & building | `src/lib/db/seed.ts` |
| 16 | Vitest unit tests | `apartments.test.ts`, `owners.test.ts` |
| 17 | Full build verification | — |

**Total: 17 steps** (including 7b as a sub-step)

---

## Phase 1 Files Modified by Phase 2

| File | Change |
|---|---|
| `src/lib/db/schema.ts` | Add `deletedAt` column + index to `apartments` table |
| `src/app/(syndic)/layout.tsx` | Wrap children with `QueryClientProvider` |
| `src/app/(syndic)/dashboard/page.tsx` | Replace placeholder with real metric cards |
| `src/app/(syndic)/dashboard/owners/page.tsx` | Replace placeholder with `<OwnersTable />` |
| `src/app/(syndic)/dashboard/apartments/page.tsx` | Replace placeholder with `<ApartmentsTable />` |
| `src/app/(syndic)/dashboard/settings/page.tsx` | Replace placeholder with `<SettingsForm />` |
| `.env.local` | Add `SUPABASE_SERVICE_ROLE_KEY` |
| `.env.example` | Add `SUPABASE_SERVICE_ROLE_KEY` placeholder |

---

## Audit Log Identifiers Used in Phase 2

| Action | Entity Type | Server Action File |
|---|---|---|
| `CREATE_OWNER` | `owners` | `src/lib/actions/owners.ts` |
| `UPDATE_OWNER` | `owners` | `src/lib/actions/owners.ts` |
| `DELETE_OWNER` | `owners` | `src/lib/actions/owners.ts` |
| `CREATE_APARTMENT` | `apartments` | `src/lib/actions/apartments.ts` |
| `UPDATE_APARTMENT` | `apartments` | `src/lib/actions/apartments.ts` |
| `DELETE_APARTMENT` | `apartments` | `src/lib/actions/apartments.ts` |
| `UPDATE_BUILDING` | `buildings` | `src/lib/actions/settings.ts` |
