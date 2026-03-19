# Review Report - Syndic Pages (2026-03-19)

## Scope
Pages reviewed:
- Vue d'ensemble
- Coproprietaires
- Appartements
- Immeubles
- Charges
- Reunions
- Paiements
- Parametres

Related files analyzed:
- Page files under src/app/(syndic)/dashboard/**
- Feature components under src/components/features/**
- Server actions under src/lib/actions/**
- API routes under src/app/api/**
- Query helpers under src/lib/db/queries/**

## Executive Summary
Overall implementation quality is good, but several confirmed logical/security/scope issues remain.

Confirmed issues found:
1. Reunions: owner scope validation in meeting creation is incomplete.
2. Reunions: meeting detail API does not enforce proprietaire-level authorization.
3. Charges: payment notice PDF may resolve the wrong building for syndic in multi-immeuble context.
4. Vue d'ensemble: dashboard metrics mix single-building counts with syndic-wide financial totals.
5. Charges: data contract mismatch for apartment unit field in charges table.
6. Parametres: still single-building while other flows are now multi-immeubles.

## Page-by-Page Report

### 1) Vue d'ensemble
What is correct:
- Data loading is parallelized on the dashboard page.
- Financial summary and recent/overdue sections are wired and scoped to authenticated user.

Potential concerns:
- Scope consistency is harder to reason about when some cards are single-building and others are syndic-wide.

Confirmed issues:
- Dashboard metrics query selects one building first, then computes owner/apartment counters for that one building, while financial counters are syndic-wide.
- This creates inconsistent card semantics in multi-immeuble scenarios.
- Evidence:
  - src/lib/db/queries/dashboard.ts:21
  - src/lib/db/queries/dashboard.ts:52
  - src/lib/db/queries/dashboard.ts:61
  - src/lib/db/queries/dashboard.ts:70
  - src/lib/db/queries/dashboard.ts:80

### 2) Coproprietaires
What is correct:
- Owners page and API use syndic-scoped owner listing across buildings.
- Owner creation/update/delete now include apartment scope and occupancy guards.

Potential concerns:
- None critical identified in current implementation.

Confirmed issues:
- None confirmed on this page flow.

### 3) Appartements
What is correct:
- Apartments and buildings are loaded with syndic scoping.
- CRUD actions enforce building ownership and soft-delete behavior.
- Detail flow and edit transition are correctly wired.

Potential concerns:
- UI token usage still references --accent in one place; this token collides with shadcn accent naming in this repository theme.

Confirmed issues:
- No confirmed functional/blocking issue on apartments page behavior.

### 4) Immeubles
What is correct:
- Multi-building list and stats are syndic-scoped.
- Create/update action paths include role and ownership checks.

Potential concerns:
- None critical identified.

Confirmed issues:
- None confirmed on immeubles page flow.

### 5) Charges
What is correct:
- Charge creation supports apartment-level and building-level targeting.
- Derived values (paid, remaining, status) are computed in SQL query helpers.
- Reminder and delete flows are present and scoped.

Potential concerns:
- UI/query payload contract drift increases risk of silent display regressions.

Confirmed issues:
- Charges table expects apartmentUnit, but charges query payload does not provide apartmentUnit.
- Apartment column/search can be empty or inconsistent.
- Evidence:
  - src/components/features/charges/charges-table.tsx:53
  - src/components/features/charges/charges-table.tsx:139
  - src/components/features/charges/charges-table.tsx:258
  - src/lib/db/queries/charges.ts:25
- Payment notice generation for syndic resolves building via getBuildingBySyndicId, not apartment.buildingId.
- In multi-immeuble cases this can output wrong building metadata on PDF notice.
- Evidence:
  - src/lib/actions/charges.ts:343

### 6) Reunions
What is correct:
- Meetings list/detail pages are connected with query + mutation flows.
- createMeeting uses transaction for meeting, invitations, notifications.

Potential concerns:
- Audit action naming includes CANCEL_MEETING which may not match the documented strict action identifier list.

Confirmed issues:
- createMeeting claims owner scope verification, but query only checks owner IDs exist and are active; it does not enforce ownership perimeter per syndic/building.
- Evidence:
  - src/lib/actions/meetings.ts:69
  - src/lib/actions/meetings.ts:86
  - src/lib/actions/meetings.ts:111
- Meeting detail API only blocks foreign syndic meetings, but does not enforce proprietaire authorization for invited access.
- A proprietaire can potentially query arbitrary meeting IDs.
- Evidence:
  - src/app/api/meetings/[id]/route.ts:28
  - src/app/api/meetings/[id]/route.ts:32

### 7) Paiements
What is correct:
- Payments page filters and summary are wired through API.
- createPayment enforces transaction usage and owner scoping for proprietaire (IDOR mitigation).

Potential concerns:
- Payments API does not explicitly reject non-syndic callers; current behavior relies on syndicId filtering and may return empty data for proprietaire instead of explicit forbidden.

Confirmed issues:
- No confirmed syndic-page blocking issue identified.

### 8) Parametres
What is correct:
- Settings page and form flow are functional for one building update.
- Action validates role and updates building + optional contact fields.

Potential concerns:
- UX and logic do not expose building selection in a now multi-immeuble environment.

Confirmed issues:
- Settings read/update path still depends on getBuildingBySyndicId (single-building semantics), inconsistent with multi-immeubles behavior elsewhere.
- Evidence:
  - src/app/(syndic)/dashboard/settings/page.tsx:27
  - src/lib/actions/settings.ts:44

## Priority Fix Order (Recommended)
1. Reunions authorization and scope checks (security + data exposure risk).
2. Charges data contract mismatch and PDF building resolution.
3. Dashboard scope consistency (single-building vs syndic-wide semantics).
4. Settings multi-immeuble consistency.

## Notes
- This report is read-only and based on current repository state at review time.
- No code was modified as part of the review process.