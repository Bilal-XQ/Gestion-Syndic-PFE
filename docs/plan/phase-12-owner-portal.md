# Phase 12 — Owner Portal Enhancements (Plan)

## Pre-Planning Verification
- Supabase MCP connectivity is working for this project (SQL execution succeeded).
- Live column verification completed via Supabase MCP for:
  - `meeting_invitations`
  - `meetings`
  - `owners`
  - `notifications`
- Live RLS policy verification completed via Supabase MCP (`pg_policies`) for the same tables.
- Confirmed policies include:
  - `meeting_invitations`: `proprietaire_read_own_invitations`, `proprietaire_update_own_invitation`, `syndic_all_invitations`
  - `meetings`: `proprietaire_read_invited_meetings`, `syndic_all_meetings`
  - `notifications`: `proprietaire_read_own_notifications`, `proprietaire_update_own_notifications`, `syndic_insert_notifications`
  - `owners`: `proprietaire_read_own_owner`, `syndic_all_owners`
- Context7 references checked for planning patterns:
  - next-intl (`getTranslations` usage in server actions/handlers)
  - Drizzle join patterns (`leftJoin`, filtering, ordering)

---

## Feature 1 — Reunions page (`/portal/meetings`)
### Files to CREATE
- `src/app/(owner)/meetings/page.tsx`
- `src/app/(owner)/meetings/loading.tsx`
- `src/app/(owner)/meetings/error.tsx`
- `src/app/api/portal/meetings/route.ts`
- `src/components/features/portal/meetings-view.tsx`

### Files to MODIFY
- `src/components/layout/owner-sidebar.tsx`
  - Add owner navigation item for meetings (`/portal/meetings`) with `CalendarDays` icon.
  - Keep role-safe owner navigation behavior unchanged.
- `messages/fr/portal.json`
- `messages/en/portal.json`
- `messages/ar/portal.json`
  - Add meetings page and card/status/action labels under portal namespace.
- `src/lib/db/queries/meetings.ts`
  - Add owner-portal-oriented helper that starts from `meeting_invitations` and joins `meetings`, returning invitation + meeting fields required by API.

### New i18n keys
- `messages/fr/portal.json`
  - `nav.meetings`
  - `ownerMeetings.pageTitle`
  - `ownerMeetings.tabs.upcoming`
  - `ownerMeetings.tabs.past`
  - `ownerMeetings.emptyUpcoming`
  - `ownerMeetings.emptyPast`
  - `ownerMeetings.labels.date`
  - `ownerMeetings.labels.time`
  - `ownerMeetings.labels.location`
  - `ownerMeetings.actions.accept`
  - `ownerMeetings.actions.decline`
  - `ownerMeetings.status.invited`
  - `ownerMeetings.status.accepted`
  - `ownerMeetings.status.declined`
  - `ownerMeetings.status.cancelled`
  - `ownerMeetings.status.completed`
- `messages/en/portal.json`
  - Same key names as above
- `messages/ar/portal.json`
  - Same key names as above

### New query helpers
- `src/lib/db/queries/meetings.ts`
  - `getMeetingInvitationsForOwner(ownerId: string)`
  - Query shape:
    - `meeting_invitations` LEFT JOIN `meetings`
    - filter by `meeting_invitations.owner_id`
    - include meeting fields + invitation status + respondedAt
    - order by `meetings.meetingDate DESC`

### Dependencies
- Depends on i18n keys being merged before rendering the sidebar label and page labels.
- Reuses existing `respondToInvitation` server action in `src/lib/actions/notifications.ts`.
- Can be implemented independently from Features 2–5.

### Complexity
- Medium

### RLS check
- Route handler must resolve owner from JWT server-side (`auth.getUser` -> `owners.user_id = auth.uid()` and `owners.deleted_at IS NULL`).
- Never accept `ownerId` from client input.
- Validate effective read ownership in route logic regardless of DB-side RLS status.

---

## Feature 2 — Overview cards on Mon Espace homepage
### Files to CREATE
- `src/components/features/portal/overview-cards.tsx`

### Files to MODIFY
- `src/app/(owner)/portal/page.tsx`
  - Render `OverviewCards` above `ProfileView`.
- `messages/fr/portal.json`
- `messages/en/portal.json`
- `messages/ar/portal.json`
  - Add card labels and empty-state text.

### New i18n keys
- `messages/fr/portal.json`
  - `overview.outstandingBalance`
  - `overview.nextMeeting`
  - `overview.unreadNotifications`
  - `overview.noUpcomingMeeting`
- `messages/en/portal.json`
  - Same key names as above
- `messages/ar/portal.json`
  - Same key names as above

### New query helpers
- None required initially.
- Reuse APIs in parallel from client component:
  - `/api/portal/charges`
  - `/api/portal/meetings` (from Feature 1)
  - `/api/notifications`

### Dependencies
- Depends on Feature 1 endpoint (`/api/portal/meetings`) for the next-meeting card.
- Independent for outstanding and unread metrics.

### Complexity
- Medium

### RLS check
- No direct DB access in this component; ownership boundaries come from existing secured APIs.
- Ensure no owner identifiers are passed from client to APIs.

---

## Feature 3 — Fix category/method labels (Water -> Eau)
### Files to CREATE
- None

### Files to MODIFY
- `src/components/features/payments/owner-payments-view.tsx`
  - Ensure `categoryLabels` and `methodLabels` are memoized with `useMemo` and locale translator dependency (`tc`).
  - Keep current label map keys aligned with charge/payment enum values.

### New i18n keys
- None

### New query helpers
- None

### Dependencies
- Independent
- Supports Feature 4 by keeping labels stable in payments view.

### Complexity
- Low

### RLS check
- No new API/DB access.

---

## Feature 4 — Financial summary above payment tabs
### Files to CREATE
- None

### Files to MODIFY
- `src/components/features/payments/owner-payments-view.tsx`
  - Add two summary cards above tabs using already fetched `charges`.
  - Compute derived totals at render time:
    - total charged = sum(`totalAmount`)
    - remaining = sum(`remainingAmount`)
  - Render only when not loading and `charges.length > 0`.
- `messages/fr/portal.json`
- `messages/en/portal.json`
- `messages/ar/portal.json`
  - Add owner payments summary labels.

### New i18n keys
- `messages/fr/portal.json`
  - `ownerPayments.summaryTotalCharged`
  - `ownerPayments.summaryRemaining`
- `messages/en/portal.json`
  - Same key names as above
- `messages/ar/portal.json`
  - Same key names as above

### New query helpers
- None

### Dependencies
- Independent
- Shares the same data source as existing owner charges table.

### Complexity
- Low

### RLS check
- No new API/DB access.

---

## Feature 5 — Tantiemes in owner profile
### Files to CREATE
- None

### Files to MODIFY
- `src/components/features/portal/profile-view.tsx`
  - Extend `ProfileData.apartment` with optional `tantiemes` and `buildingTotalTantiemes`.
  - Render a conditional row in apartment details: `tantiemes / buildingTotalTantiemes` in mono style.
- `src/app/api/portal/profile/route.ts`
  - Ensure API returns `apartment.tantiemes` and `apartment.buildingTotalTantiemes`.
  - Use existing server-side owner resolution flow.
- `messages/fr/portal.json`
- `messages/en/portal.json`
- `messages/ar/portal.json`
  - Add profile label for tantiemes row.

### New i18n keys
- `messages/fr/portal.json`
  - `profile.tantièmesLabel`
- `messages/en/portal.json`
  - `profile.tantièmesLabel`
- `messages/ar/portal.json`
  - `profile.tantièmesLabel`

### New query helpers
- None required if existing `getApartmentById` + `getBuildingById` are reused.

### Dependencies
- Independent

### Complexity
- Low

### RLS check
- API must continue resolving owner identity from JWT and never from client-provided IDs.

---

## Recommended execution order
1. Feature 1 (Meetings route/API/component/sidebar/i18n)
2. Feature 2 (Overview cards, depends on meetings API)
3. Feature 5 (Profile tantiemes)
4. Feature 3 (Memoized labels)
5. Feature 4 (Payments summary cards)
6. Final pass: i18n completeness + `pnpm tsc --noEmit`

## Cross-feature dependencies
- Feature 2 depends on Feature 1 for the next-meeting card source.
- Feature 1 and Feature 2 both depend on adding new portal i18n keys before component usage.
- Features 3 and 4 are in the same file (`owner-payments-view.tsx`) and should be merged in a single edit to reduce churn.

## Risks
- Branch-specific Supabase MCP endpoints may still require explicit project reference context, but this does not block Phase 12 implementation work.
- Date/time grouping for upcoming vs past meetings can drift around timezone boundaries; use a consistent local-date comparison strategy.
- Meeting rows may be missing if invitation references an archived/deleted meeting; API should guard null join fields defensively.
