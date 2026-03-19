# Phase 11 — Multi-Building Support + Tantièmes (Plan Only)

## Pre-Planning Verification

- Live DB verification completed (equivalent to Supabase MCP checks) via direct metadata queries using configured database connection:
  - `buildings` columns currently include `total_tantiemes integer not null default 1000`.
  - `apartments.building_id` foreign key exists (`apartments_building_id_buildings_id_fk` -> `buildings.id`).
  - RLS policies currently exist on both `buildings` and `apartments` for syndic/proprietaire access.
  - Current `buildings` row count in DB: `1`.
- Documentation verification completed (equivalent to Context7 goals):
  - Drizzle join patterns reviewed for multi-table/grouped queries and typed partial selects.
  - `next-intl` Server Actions usage reviewed (`getTranslations` from `next-intl/server`).

---

1. **A1 — Schema: Multi-building foundation (`buildings.total_tantiemes`)**

- **Files to CREATE**
  - `drizzle/0002_phase11_multibuilding_tantiemes.sql`
  - `drizzle/meta/0002_snapshot.json` (generated)
- **Files to MODIFY**
  - `src/lib/db/schema.ts`
    - Ensure `buildings.totalTantiemes` exists in Drizzle schema with integer, `notNull`, `default(1000)`.
    - Add check constraint (`total_tantiemes > 0`).
    - Add index on `buildings.syndic_id` remains as current access path.
  - `src/lib/db/queries/buildings.ts`
    - Expand selects/types to include `totalTantiemes`.
- **DB migration required?**
  - Yes.
  - SQL:
    ```sql
    ALTER TABLE buildings
      ADD COLUMN IF NOT EXISTS total_tantiemes integer NOT NULL DEFAULT 1000;

    -- Keep data safe for legacy rows
    UPDATE buildings
    SET total_tantiemes = 1000
    WHERE total_tantiemes IS NULL OR total_tantiemes <= 0;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'buildings_total_tantiemes_check'
      ) THEN
        ALTER TABLE buildings
          ADD CONSTRAINT buildings_total_tantiemes_check CHECK (total_tantiemes > 0);
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS buildings_total_tantiemes_idx ON buildings(total_tantiemes);
    ```
- **New i18n keys**
  - None required for A1 only.
- **Dependencies**
  - Unblocks `A2`, `A4`, `A5`, `B4` (UI/validation need this field).
- **Complexity**
  - Low.
- **RLS impact**
  - No policy logic changes required (column added on existing protected table).

2. **A2 — Building management UI page (`/dashboard/immeubles`)**

- **Files to CREATE**
  - `src/app/(syndic)/dashboard/immeubles/page.tsx`
  - `src/components/features/buildings/buildings-table.tsx`
  - `src/components/features/buildings/building-panel.tsx`
  - `src/components/features/buildings/delete-building-dialog.tsx` (optional only if soft-delete UI is in scope)
  - `src/lib/actions/buildings.ts`
  - `src/lib/validations/building.ts`
  - `src/lib/db/queries/buildings.ts` additions only (or `src/lib/db/queries/buildings-list.ts` if split preferred)
- **Files to MODIFY**
  - `src/components/layout/sidebar.tsx`
    - Add nav link to `/dashboard/immeubles`.
  - `src/lib/db/schema.ts`
    - No new table; ensure building check/index coverage from A1.
  - `messages/fr/settings.json`
    - Keep existing active-building settings strings; add references only if needed.
  - `messages/fr/common.json`
    - Add generic building labels if reused.
- **DB migration required?**
  - No additional migration beyond A1.
- **New i18n keys**
  - `buildings.pageTitle`
  - `buildings.addButton`
  - `buildings.table.name`
  - `buildings.table.address`
  - `buildings.table.totalApartments`
  - `buildings.table.occupancyRate`
  - `buildings.table.actions`
  - `buildings.table.empty`
  - `buildings.panel.createTitle`
  - `buildings.panel.editTitle`
  - `buildings.panel.nameLabel`
  - `buildings.panel.addressLabel`
  - `buildings.panel.totalTantiemesLabel`
  - `buildings.panel.submit`
  - `buildings.panel.successCreate`
  - `buildings.panel.successUpdate`
- **Dependencies**
  - Depends on `A1`.
  - Enables building selection in `A3` and scope selection in `A5`.
- **Complexity**
  - High.
- **RLS impact**
  - No new policy needed if all queries remain scoped by `buildings.syndic_id = auth.uid()` and existing policies are preserved.

3. **A3 — Apartment create/edit requires building selector**

- **Files to CREATE**
  - None mandatory (reuse current apartment panel).
- **Files to MODIFY**
  - `src/components/features/apartments/apartment-panel.tsx`
    - Add building dropdown (`buildingId`) for create and edit.
    - Populate options from syndic’s buildings query.
  - `src/lib/validations/apartment.ts`
    - Add `buildingId` uuid field.
  - `src/lib/actions/apartments.ts`
    - Stop deriving one building via `getBuildingBySyndicId`; validate submitted building belongs to authenticated syndic.
  - `src/lib/db/queries/buildings.ts`
    - Add `getBuildingsBySyndicId` helper.
  - `messages/fr/apartments.json`
    - Add form labels/placeholders/errors.
  - `messages/fr/validation.json`
    - Add `apartment.buildingRequired` / `apartment.buildingInvalid`.
- **DB migration required?**
  - No.
- **New i18n keys**
  - `apartments.panel.buildingLabel`
  - `apartments.panel.buildingPlaceholder`
  - `validation.apartment.buildingInvalid`
- **Dependencies**
  - Depends on `A2` list/read model.
- **Complexity**
  - Medium.
- **RLS impact**
  - No new policies; ensure server action authorization checks building ownership against syndic.

4. **A4 — Apartments page grouped by building (collapsible sections)**

- **Files to CREATE**
  - `src/components/features/apartments/apartments-by-building.tsx`
  - `src/components/features/apartments/building-apartments-section.tsx`
- **Files to MODIFY**
  - `src/lib/db/queries/apartments.ts`
    - Add grouped query shape that includes building metadata and apartment rows.
    - Continue defensive fallback behavior.
  - `src/app/(syndic)/dashboard/apartments/page.tsx`
    - Fetch grouped data instead of flat single-building assumption.
  - `src/components/features/apartments/apartments-table.tsx`
    - Replace flat table render with grouped collapsible blocks.
  - `messages/fr/apartments.json`
    - Add building header labels for section stats.
- **DB migration required?**
  - No.
- **New i18n keys**
  - `apartments.group.header`
  - `apartments.group.address`
  - `apartments.group.totalApartments`
  - `apartments.group.occupancyRate`
  - `apartments.group.expand`
  - `apartments.group.collapse`
- **Dependencies**
  - Depends on `A2` (multiple buildings must exist in UI/data).
  - Depends on `A3` for correct future apartment assignment.
- **Complexity**
  - High.
- **RLS impact**
  - No policy changes required.

5. **A5 — Charges scoped by target type (single apartment vs whole building)**

- **Files to CREATE**
  - None mandatory (extend current charge panel/action).
- **Files to MODIFY**
  - `src/components/features/charges/charge-panel.tsx`
    - Add target selector: `apartment` or `building`.
    - If `building`, show building dropdown; hide apartment dropdown.
  - `src/lib/validations/charge.ts`
    - Add discriminated union for target payload:
      - apartment mode: `apartmentId` required.
      - building mode: `buildingId` required.
  - `src/lib/actions/charges.ts`
    - Branch create flow by target mode.
    - Use Drizzle transaction for building-wide fan-out writes.
  - `src/lib/db/queries/apartments.ts`
    - Add helper for active apartments by building for distribution.
  - `messages/fr/charges.json`
    - Add target labels/options.
  - `messages/fr/validation.json`
    - Add target validation keys.
- **DB migration required?**
  - No required schema change.
- **New i18n keys**
  - `charges.panel.targetLabel`
  - `charges.panel.targetApartment`
  - `charges.panel.targetBuilding`
  - `charges.panel.buildingLabel`
  - `charges.panel.buildingPlaceholder`
  - `charges.panel.apartmentLabel`
  - `charges.panel.apartmentPlaceholder`
  - `validation.charge.targetRequired`
  - `validation.charge.buildingInvalid`
- **Dependencies**
  - Depends on `A2` (buildings list UI/data).
  - Depends on `B1`, `B4` for tantièmes-aware distribution constraints.
- **Complexity**
  - High.
- **RLS impact**
  - No new policy required if writes remain syndic-scoped and apartment ownership checks are enforced server-side.

6. **B1 — Schema: `apartments.tantiemes`**

- **Files to CREATE**
  - Included in `drizzle/0002_phase11_multibuilding_tantiemes.sql` (or split to `0003` if A1 already migrated separately).
- **Files to MODIFY**
  - `src/lib/db/schema.ts`
    - Add `tantiemes` integer not null default `100`.
    - Add check constraint (`tantiemes > 0`).
    - Add index on `(building_id, tantiemes)` for grouped display and distribution reads.
- **DB migration required?**
  - Yes.
  - SQL:
    ```sql
    ALTER TABLE apartments
      ADD COLUMN IF NOT EXISTS tantiemes integer NOT NULL DEFAULT 100;

    UPDATE apartments
    SET tantiemes = 100
    WHERE tantiemes IS NULL OR tantiemes <= 0;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'apartments_tantiemes_check'
      ) THEN
        ALTER TABLE apartments
          ADD CONSTRAINT apartments_tantiemes_check CHECK (tantiemes > 0);
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS apartments_building_tantiemes_idx
      ON apartments(building_id, tantiemes);
    ```
- **New i18n keys**
  - None required for schema-only step.
- **Dependencies**
  - Unblocks `B2`, `B3`, `B4`, and `A5` building-wide distribution.
- **Complexity**
  - Medium.
- **RLS impact**
  - No policy changes required.

7. **B2 — Tantièmes display in apartment list/form/detail**

- **Files to CREATE**
  - None mandatory (reuse apartment components).
- **Files to MODIFY**
  - `src/components/features/apartments/apartments-table.tsx`
    - Add tantièmes column showing `apartment.tantiemes / building.total_tantiemes`.
  - `src/components/features/apartments/apartment-panel.tsx`
    - Add tantièmes input.
  - `src/components/features/apartments/apartment-detail-sheet.tsx`
    - Add tantièmes block.
  - `src/lib/db/queries/apartments.ts`
    - Include `tantiemes` and building `total_tantiemes` in enriched/detail responses.
  - `src/types/index.ts`
    - Extend `ApartmentEnriched` type with `tantiemes` and `buildingTotalTantiemes`.
  - `messages/fr/apartments.json`
    - Add labels/headers.
- **DB migration required?**
  - Depends on B1 migration; no new SQL.
- **New i18n keys**
  - `apartments.table.tantiemes`
  - `apartments.panel.tantiemesLabel`
  - `apartments.panel.tantiemesPlaceholder`
  - `apartments.detail.tantiemes`
  - `apartments.detail.tantiemesRatio`
- **Dependencies**
  - Depends on `B1`.
  - Uses `A2/A4` building totals for denominator display.
- **Complexity**
  - Medium.
- **RLS impact**
  - No policy change needed.

8. **B3 — Proportional charge distribution (building target)**

- **Files to CREATE**
  - None mandatory.
- **Files to MODIFY**
  - `src/lib/actions/charges.ts`
    - In building-target branch:
      - Load building (`total_tantiemes`) and all active apartments (`deleted_at IS NULL`) in building.
      - Compute each apartment amount as:
        - `charge_total * apartment.tantiemes / building.total_tantiemes`
      - Apply deterministic rounding strategy (see notes below).
      - Insert one `charges` row per apartment in one Drizzle transaction.
      - Insert one audit log row (`CREATE_CHARGE`) per inserted charge outside transaction.
  - `src/lib/validations/charge.ts`
    - Add constraints for building-target payload.
  - `src/lib/db/queries/apartments.ts`
    - Add helper returning active apartments + tantièmes for one building.
- **DB migration required?**
  - No.
- **New i18n keys**
  - `charges.create.distributedSuccess`
  - `charges.create.distributedCount`
  - `charges.errors.noActiveApartments`
  - `charges.errors.invalidBuildingTantiemes`
- **Dependencies**
  - Depends on `B1` and `A5`.
- **Complexity**
  - High.
- **RLS impact**
  - No new policy required if syndic-only mutation path remains enforced.

9. **B4 — Tantièmes validation rules + warning flow**

- **Files to CREATE**
  - None mandatory.
- **Files to MODIFY**
  - `src/lib/validations/apartment.ts`
    - Add `tantiemes` with min `1` (upper bound checked server-side against selected building).
  - `src/lib/actions/apartments.ts`
    - Server-side enforce `tantiemes <= building.total_tantiemes` (hard error).
    - Compute sum of active building apartment tantièmes excluding current row on update.
    - If projected sum exceeds building total: return success with warning metadata, not blocking write.
  - `src/components/features/apartments/apartment-panel.tsx`
    - Display warning toast/banner when action returns warning.
  - `messages/fr/validation.json`
    - Add tantièmes constraints.
  - `messages/fr/apartments.json`
    - Add warning copy key(s).
- **DB migration required?**
  - No extra migration beyond B1/A1 checks.
- **New i18n keys**
  - `validation.apartment.tantiemesInteger`
  - `validation.apartment.tantiemesMin`
  - `validation.apartment.tantiemesMaxBuilding`
  - `apartments.warnings.tantiemesSumExceeds`
- **Dependencies**
  - Depends on `A1`, `B1`, `A3`.
- **Complexity**
  - Medium.
- **RLS impact**
  - No policy change needed.

---

## Cross-Cutting SQL and Financial Rules

- Derived financial values remain query-derived only (`amount_paid`, `remaining_amount`, `status` not persisted).
- Building-wide charge fan-out must use `db.transaction(async (tx) => { ... })` for atomic inserts.
- All new list queries must keep `deleted_at IS NULL` filtering.

## Rounding and Distribution Rule (B3)

- Compute in decimal precision (not JS float).
- Recommended approach:
  - Calculate exact share per apartment.
  - Round to 2 decimals per apartment.
  - Assign any remainder cents to the apartment with highest tantièmes (or last apartment by stable sort) so total distributed equals requested total exactly.

---

## Recommended Execution Order

1. A1 (schema alignment for building total)
2. B1 (apartments tantièmes schema)
3. A2 (immeubles management page and actions)
4. A3 (apartment building selector)
5. B4 (validation/warnings)
6. B2 (tantièmes display)
7. A5 (charge target mode)
8. B3 (building-wide proportional fan-out)
9. A4 (grouped apartments UI by building)

---

## Backwards Compatibility Risks

- Existing one-building syndic accounts must still function with zero UX regressions:
  - Default selected building should auto-resolve to first active building.
  - Existing create apartment/charge flows should keep current behavior when only one building exists.
- Onboarding seed logic currently creates one building; must remain valid and unchanged.
- Partial rollout risk: if DB already has `total_tantiemes` but Drizzle schema is stale, type drift can cause runtime/select mismatches.
- Distribution math risk: naive floating-point arithmetic can produce cent drift.

---

## RLS Policy Changes Needed

- **Required updates:** none strictly required for these changes, because no new tables are introduced and access paths remain building/apartment scoped under existing syndic/proprietaire policies.
- **Recommended audit updates:**
  - Re-validate existing `buildings` and `apartments` policies after adding/using tantièmes fields.
  - Ensure any new building-list query remains constrained by `syndic_id = auth.uid()` for syndic role.

---

## Confirmation of Files Read

Read completely before planning:

- `src/lib/db/schema.ts`
- `src/lib/db/queries/apartments.ts`
- `src/lib/db/queries/charges.ts`
- `src/lib/actions/apartments.ts`
- `src/lib/actions/charges.ts`
- `src/lib/validations/apartment.ts`
- `src/lib/validations/charge.ts`
- `src/app/(syndic)/dashboard/apartments/page.tsx`
- `src/app/(syndic)/dashboard/charges/page.tsx`
- `src/components/features/apartments/apartments-table.tsx`
- `src/components/features/apartments/apartment-panel.tsx`
- `src/components/features/charges/charge-panel.tsx`
- `src/components/features/charges/charges-table.tsx`
- `src/components/features/charges/delete-charge-dialog.tsx`
- `src/app/(syndic)/dashboard/settings/page.tsx`
- `src/lib/actions/settings.ts`
- `src/lib/validations/settings.ts`
- `messages/fr/apartments.json`
- `messages/fr/charges.json`
- `messages/fr/settings.json`
- `docs/PRD.md`

Additional helpful reads:

- `src/lib/db/queries/buildings.ts`
- `src/components/features/settings/settings-form.tsx`
