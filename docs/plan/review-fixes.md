# Review Fixes Plan

Date: 2026-03-19
Scope: Plan only (no code changes)

## Preconditions Verified Before Planning
- Supabase live DB check (RLS):
  - `meetings` policies include invited-owner SELECT policy.
  - `meeting_invitations` policies include owner-scoped SELECT/UPDATE policy.
- Supabase live DB check (schema):
  - `buildings` columns confirmed: `id`, `syndic_id`, `name`, `address`, `deleted_at`, `created_at`, `updated_at`, `total_tantiemes`.
- Context7 docs (Drizzle):
  - Confirmed valid patterns for subqueries/`inArray`/`EXISTS` to implement ownership-scope checks safely in Drizzle 0.45.x style.

---

## Issue 1 — Reunions: owner scope + meeting detail authorization (SECURITY)

### 1. Files to CREATE
- None.

### 2. Files to MODIFY (exact list)
- `src/lib/actions/meetings.ts`
- `src/app/api/meetings/[id]/route.ts`
- `src/lib/db/queries/meetings.ts` (optional but recommended if adding reusable authorization helper)

### 3. Exact change description
- In `createMeeting` (`src/lib/actions/meetings.ts`), replace current owner existence check with syndic-scoped ownership validation by joining owners -> apartments and constraining building ownership.
- Exact validation query to enforce:
  - Base filter: invited owner IDs are active (`owners.deleted_at IS NULL`).
  - Scope filter: owner apartment belongs to a building managed by current syndic (`apartments.building_id = buildings.id` AND `buildings.syndic_id = currentUserId` AND `buildings.deleted_at IS NULL`).
  - Acceptance rule: returned row count must equal `ownerIds.length`; otherwise reject with validation error.
- Recommended Drizzle shape:
  - `from(owners)`
  - `innerJoin(apartments, eq(owners.apartmentId, apartments.id))`
  - `innerJoin(buildings, eq(apartments.buildingId, buildings.id))`
  - `where(and(inArray(owners.id, ownerIds), isNull(owners.deletedAt), isNull(apartments.deletedAt), isNull(buildings.deletedAt), eq(buildings.syndicId, user.id)))`
- In meeting detail API (`src/app/api/meetings/[id]/route.ts`), add proprietaire authorization guard:
  - If role is `proprietaire`, require existence of invitation row linking the current owner to requested `meeting_id`.
  - Ownership resolution: map authenticated user to active owner (`owners.user_id = authUser.id` and `owners.deleted_at IS NULL`), then validate invitation exists (`meeting_invitations.owner_id = owner.id` and `meeting_invitations.meeting_id = params.id`).
  - If no invitation, return 403.

### 4. New query helpers needed
- Recommended: add helper in `src/lib/db/queries/meetings.ts`:
  - `isOwnerInvitedToMeeting(userId: string, meetingId: string): Promise<boolean>`
  - Purpose: centralize proprietaire authorization logic for reuse and tests.
- Alternative: inline query in route handler (fewer files, lower reuse).

### 5. Complexity
- Medium.

### 6. Security impact
- High.
- Prevents cross-syndic invitation injection (IDOR-like cross-tenant data access at write time).
- Prevents proprietaire meeting-detail ID enumeration/access without invitation (read-time authorization bypass).

---

## Issue 2 — Charges: PDF building source + missing apartmentUnit in list

### 1. Files to CREATE
- None.

### 2. Files to MODIFY (exact list)
- `src/lib/actions/charges.ts`
- `src/lib/db/queries/charges.ts`
- `src/components/features/charges/charges-table.tsx` (type alignment only if needed after query update)
- `src/lib/export/excel.ts` (only if exported charge type relies on backend payload shape assumptions)

### 3. Exact change description
- Problem A (PDF wrong building):
  - In `downloadPaymentNotice` in `src/lib/actions/charges.ts`, replace syndic-only branch using `getBuildingBySyndicId(user.id)` with building resolved from charge apartment:
    - Always resolve `apartment` first.
    - Resolve building via `getBuildingById(apartment.buildingId)`.
    - For syndic role, additionally assert `building.syndicId === user.id`.
    - For proprietaire role, existing owner-apartment authorization remains and building comes from the same apartment chain.
  - Exact replacement target: section currently labeled `// 5. Resolve building based on role` (around previously flagged line 343).
- Problem B (`apartmentUnit` missing from charges query payload):
  - In `getChargesWithPaymentStatus` (`src/lib/db/queries/charges.ts`), join apartments (and buildings for future display context).
  - Add select fields:
    - `apartmentUnit: apartments.unitNumber`
    - `buildingName: buildings.name`
  - Required joins:
    - `.innerJoin(apartments, eq(charges.apartmentId, apartments.id))`
    - `.innerJoin(buildings, eq(apartments.buildingId, buildings.id))`
  - Required filters:
    - keep existing `charges.syndicId = syndicId` and `charges.deletedAt IS NULL`
    - add `apartments.deletedAt IS NULL` and `buildings.deletedAt IS NULL`
  - Group by update must include newly selected non-aggregated columns (`apartments.unitNumber`, `buildings.name`) to remain SQL-valid.

### 4. New query helpers needed
- None required.
- Existing helpers are sufficient once select/join is expanded.

### 5. Complexity
- Low to Medium.

### 6. Security impact
- Medium.
- Fixes tenant-correct document context (prevents wrong-building information disclosure in generated PDF for syndic multi-building context).

---

## Issue 3 — Dashboard: mixed single-building vs syndic-wide metrics

### 1. Files to CREATE
- None.

### 2. Files to MODIFY (exact list)
- `src/lib/db/queries/dashboard.ts`

### 3. Exact change description
- Remove first-building scoping logic in `getDashboardMetrics`.
- Replace all apartment/owner metrics to syndic-wide by joining through buildings filtered on syndic ID.
- Query-level targets:
  - Owners count: owners joined to apartments joined to buildings, with `buildings.syndic_id = syndicId`, and soft-delete filters on owners/apartments/buildings.
  - Total apartments: apartments joined to buildings, syndic-scoped, soft-delete filtered.
  - Occupied apartments: same as above + `apartments.status = 'occupied'`.
  - Vacant apartments: same as above + `apartments.status = 'vacant'`.
  - Charges count: keep syndic-wide (`charges.syndic_id = syndicId` + `charges.deleted_at IS NULL`).
  - Payments count: keep syndic-wide through `payments -> charges` (and consider `charges.deleted_at IS NULL` for consistency).
- Exact architectural decision:
  - `getBuildingBySyndicId` should be removed entirely from dashboard metrics path; dashboard cards must all be syndic-wide.

### 4. New query helpers needed
- None required.
- Keep all logic in existing `getDashboardMetrics` helper to avoid fragmentation.

### 5. Complexity
- Medium.

---

## Issue 4 — Parametres: first-building-only edit flow

### 1. Files to CREATE
- None mandatory.
- Optional: dedicated selector component under `src/components/features/settings/` if UI logic grows.

### 2. Files to MODIFY (exact list)
- `src/app/(syndic)/dashboard/settings/page.tsx`
- `src/components/features/settings/settings-form.tsx`
- `src/lib/actions/settings.ts`
- `src/lib/validations/settings.ts`
- `src/lib/db/queries/buildings.ts` (reuse existing `getBuildingsBySyndicId`; no logic change expected)
- `messages/fr/settings.json`
- `messages/en/settings.json`
- `messages/ar/settings.json`

### 3. Exact change description
- Add building selector in settings page flow with backward compatibility:
  - Server page fetches all syndic buildings via `getBuildingsBySyndicId(user.id)`.
  - Determine selected building by query param (`buildingId`) if present and owned by syndic; otherwise default to first building.
  - Pass selected `buildingId` and building options to settings form.
- Preferred approach: query param selection (`?buildingId=`) at page level.
  - Reason: keeps page as Server Component, supports direct linking/bookmarking, no client-side data race.
- Update `updateBuilding` action contract:
  - Action must accept target `buildingId` in validated payload.
  - Server action verifies target building belongs to current syndic before update.
  - Update audit log `entityId` to the targeted building ID.
- `getBuildingBySyndicId` decision:
  - Keep helper for legacy/other contexts.
  - In settings flow, replace with explicit selected-building resolution using `buildingId` + syndic ownership checks.

### 4. New query helpers needed
- None strictly required (existing `getBuildingsBySyndicId` and `getBuildingById` are sufficient).
- Optional helper for safety/readability:
  - `getBuildingForSyndicById(syndicId, buildingId)` to centralize ownership check.

### 5. Complexity
- Medium.

---

## Recommended execution order
1. Issue 1 (security-critical authorization and tenancy scope).
2. Issue 2 (document correctness + list data integrity).
3. Issue 3 (dashboard semantic consistency).
4. Issue 4 (settings multi-building UX + action contract).

## Key risks and mitigations
- Risk: authorization regressions in meeting APIs.
  - Mitigation: add role-based tests for invited/uninvited proprietaire access and cross-syndic owner IDs on create.
- Risk: SQL group-by errors after adding apartment/building select columns in charges query.
  - Mitigation: ensure every non-aggregated selected column is in `groupBy`.
- Risk: settings form/action payload drift after adding `buildingId`.
  - Mitigation: update single shared Zod schema first, then form + action together.
- Risk: dashboard metrics behavior change impacts expectations.
  - Mitigation: document that all cards are now syndic-wide and add/adjust tests/snapshots accordingly.
