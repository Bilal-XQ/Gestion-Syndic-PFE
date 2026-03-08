# Phase 7 — Global UI Polish

## Overview
This phase standardizes the UI across syndic and owner surfaces without changing business logic or data flow. The work should start by adding shared formatting utilities and reusable picker primitives, then migrate all affected forms and displays to those shared building blocks. Existing shadcn/ui primitives already available in the repo are sufficient for most of the work: `alert-dialog`, `badge`, `button`, `card`, `command`, `dialog`, `dropdown-menu`, `input`, `label`, `popover`, `select`, `separator`, `sheet`, `skeleton`, `table`, `tabs`, and `tooltip`.

## Dependencies to install
- `react-day-picker@9.14.0`

## New shared utilities to create
- `src/lib/formatters.ts`
  - `export function formatMAD(amount: number | string | null | undefined): string`
  - `export function formatDate(value: Date | string | null | undefined): string`
  - `export function formatDateLong(value: Date | string | null | undefined): string`
  - `export function formatDateTime(value: Date | string | null | undefined): string`
  - `export function formatTime(value: Date | string | null | undefined): string`
  - `export function toDateInputValue(value: Date | string | null | undefined): string`
  - `export function toTimeInputValue(value: string | null | undefined): string`

## New shared components to create
- `src/components/ui/calendar.tsx`
  - shadcn-compatible `Calendar` wrapper built on `react-day-picker` v9
- `src/components/ui/date-picker.tsx`
  - reusable popover-based single-date picker for forms and filters
- `src/components/ui/time-picker.tsx`
  - reusable popover-based time picker for `HH:mm` values, consistent with shadcn styling

## Steps

### Step 1 — Add formatting utilities
**Files to modify:** none
**Files to create:** `src/lib/formatters.ts`
**What to do:** Create one shared formatter module for currency, date, datetime, and time rendering. `formatMAD()` must always output French locale formatting with the `MAD` suffix. `formatDate*()` helpers must centralize the `date-fns` + `fr` locale usage so page and component code stops formatting ad hoc. Include input-value helpers for pre-filling date/time controls from existing DB values.
**Depends on:** none

### Step 2 — Add calendar and picker primitives
**Files to modify:** none
**Files to create:** `src/components/ui/calendar.tsx`, `src/components/ui/date-picker.tsx`, `src/components/ui/time-picker.tsx`
**What to do:** Create the shared picker layer before touching any form. `calendar.tsx` should wrap `react-day-picker` with the project’s shadcn styling. `date-picker.tsx` should use `Popover` + `Calendar` and expose a controlled API that works with React Hook Form and filter state. `time-picker.tsx` should use a matching popover pattern for `HH:mm` values so `type="time"` can be removed entirely. Keep these components generic enough for both dashboard filters and dialog forms.
**Depends on:** Step 1

### Step 3 — Replace all raw date and time inputs
**Files to modify:** `src/components/features/owners/owner-panel.tsx`, `src/components/features/charges/charge-panel.tsx`, `src/components/features/payments/payments-table.tsx`, `src/components/features/meetings/meeting-panel.tsx`, `src/components/features/payments/owner-payment-form.tsx`
**Files to create:** none
**What to do:** Replace every `<input type="date">` and `<input type="time">` with the shared picker components created in Step 2. The exact occurrences are: ownership date in `owner-panel.tsx`, due date in `charge-panel.tsx`, date range filters in `payments-table.tsx`, meeting date plus start/end time in `meeting-panel.tsx`, and payment date in `owner-payment-form.tsx`. Remove any local `toISOString().split("T")[0]` logic and use the shared `toDateInputValue()` or picker-level conversion instead.
**Depends on:** Step 2

### Step 4 — Normalize modal and dialog form labels to sentence case
**Files to modify:** `src/components/features/apartments/apartment-panel.tsx`, `src/components/features/owners/owner-panel.tsx`, `src/components/features/charges/charge-panel.tsx`, `src/components/features/meetings/meeting-panel.tsx`, `src/components/features/payments/owner-payment-form.tsx`
**Files to create:** none
**What to do:** Remove the uppercase label styling from form labels inside modal/dialog components by replacing the shared `labelClass` definitions that currently include `uppercase` and tracking overrides. Keep table headers unchanged. Preserve hierarchy and spacing, but make labels read in sentence case such as `Date de paiement`, `Montant total (MAD)`, and `Heure de début`.
**Depends on:** none

### Step 5 — Fix empty default state for numeric modal inputs
**Files to modify:** `src/components/features/charges/charge-panel.tsx`, `src/components/features/apartments/apartment-panel.tsx`
**Files to create:** none
**What to do:** Update both panels so numeric fields render empty by default instead of showing `0`. For `charge-panel.tsx`, clear the initial `totalAmount` UI value while still preserving positive-number validation on submit. For `apartment-panel.tsx`, do the same for `floor`, `surfaceArea`, and `roomCount` where appropriate, while keeping edit-mode values populated from the selected record. Ensure placeholders communicate the expected input instead of a zero seed value.
**Depends on:** none

### Step 6 — Add a disabled placeholder state to the charge category select
**Files to modify:** `src/components/features/charges/charge-panel.tsx`
**Files to create:** none
**What to do:** Remove the preselected `maintenance` default from the charge modal and make the user explicitly choose a category. Add a disabled placeholder option in the select trigger/content so the initial state reads as an instruction rather than a valid category. Keep the existing Zod enum validation behavior intact, but align the component state so it starts empty and fails validation until a real category is chosen.
**Depends on:** Step 5

### Step 7 — Wrap all bare syndic tables in Card containers
**Files to modify:** `src/components/features/owners/owners-table.tsx`, `src/components/features/apartments/apartments-table.tsx`, `src/components/features/charges/charges-table.tsx`, `src/components/features/meetings/meetings-table.tsx`, `src/components/features/payments/payments-table.tsx`
**Files to create:** none
**What to do:** Replace each raw bordered table wrapper `div` with a shadcn `<Card className="overflow-hidden">` wrapper so the table is visually elevated off the page background. Keep the table markup unchanged inside the card. The affected tables are the main syndic lists for owners, apartments, charges, meetings, and payments.
**Depends on:** none

### Step 8 — Apply shared monetary formatting everywhere amounts are rendered
**Files to modify:** `src/components/features/dashboard/metric-cards-grid.tsx`, `src/components/features/dashboard/payment-chart.tsx`, `src/components/features/dashboard/recent-payments.tsx`, `src/components/features/dashboard/overdue-charges-table.tsx`, `src/components/features/charges/charges-table.tsx`, `src/components/features/payments/payments-table.tsx`, `src/components/features/payments/owner-payment-form.tsx`, `src/components/features/payments/owner-payments-view.tsx`
**Files to create:** none
**What to do:** Replace all direct `toFixed(2)`, inline `toLocaleString("fr-MA")`, and manual `+ " MAD"` formatting with `formatMAD()`. This includes dashboard totals, chart tooltip values, recent payments, overdue balances, charge totals, payment summaries, syndic payment rows, owner charge/payment tables, and the owner payment dialog helper text. Keep numeric signs such as the leading `+` in recent payments by concatenating around `formatMAD()` rather than reimplementing the formatter inline.
**Depends on:** Step 1

### Step 9 — Apply shared French date/time formatting everywhere raw date strings are rendered
**Files to modify:** `src/components/features/dashboard/recent-payments.tsx`, `src/components/features/dashboard/overdue-charges-table.tsx`, `src/components/features/charges/charges-table.tsx`, `src/components/features/payments/payments-table.tsx`, `src/components/features/meetings/meetings-table.tsx`, `src/components/features/meetings/meeting-detail.tsx`, `src/components/features/portal/profile-view.tsx`, `src/components/features/payments/owner-payments-view.tsx`
**Files to create:** none
**What to do:** Replace raw `dueDate`, `paymentDate`, `meetingDate`, `ownershipDate`, and `respondedAt` rendering with the shared formatters. Use `formatDate()` for compact table cells, `formatDateLong()` for the meeting detail header, `formatDateTime()` for invitation response timestamps, and `formatTime()` for meeting start/end time values. Remove the current one-off formatting logic in `meeting-detail.tsx` and the direct string output in charge/payment/profile tables.
**Depends on:** Step 1

### Step 10 — Fix the dashboard welcome name resolution
**Files to modify:** `src/app/(syndic)/dashboard/page.tsx`
**Files to create:** none
**What to do:** Stop falling back to the raw email in the welcome message. Resolve the first name from the authenticated user session first via `user.user_metadata.first_name`; if that value is missing, add a lightweight server-side fallback query for the current user’s `firstName` from `public.users`, and if both are missing render a neutral greeting that does not expose the email. Keep the rest of the dashboard data fetching unchanged.
**Depends on:** none

### Step 11 — Fix notifications header copy and invitation action hierarchy
**Files to modify:** `src/components/features/notifications/notifications-list.tsx`
**Files to create:** none
**What to do:** Replace `Aucune notification non lue` with a dynamic, grammatically correct unread-count message for `0`, `1`, and plural values. Keep the header lightweight, but make the count explicit. In the meeting invitation actions, ensure `Accepter` uses `variant="default"` and `Décliner` uses `variant="outline"` so the primary action is visually dominant.
**Depends on:** none

### Step 12 — Polish settings form section separation and action alignment
**Files to modify:** `src/components/features/settings/settings-form.tsx`
**Files to create:** none
**What to do:** Add a stronger visual divider between the `Immeuble` fieldset and the `Coordonnées du syndic` fieldset using spacing and a `Separator`. Move the submit button into a footer row aligned to the right edge of the card instead of leaving it left-aligned. Keep the existing form fields and mutation flow unchanged.
**Depends on:** none

### Step 13 — Normalize meeting list and meeting detail date/time presentation
**Files to modify:** `src/components/features/meetings/meetings-table.tsx`, `src/components/features/meetings/meeting-detail.tsx`
**Files to create:** none
**What to do:** In `meetings-table.tsx`, switch the raw meeting date output to `formatDate()` and keep the schedule cell on `HH:mm – HH:mm` only. In `meeting-detail.tsx`, replace raw `startTime` and `endTime` values that currently show seconds with `formatTime()`, replace the inline `format(new Date(...))` call with `formatDateLong()`, and make `respondedAt` use `formatDateTime()` so all meeting-related date/time rendering is consistent.
**Depends on:** Step 1

### Step 14 — Improve owner profile readability and touch targets
**Files to modify:** `src/components/features/portal/profile-view.tsx`
**Files to create:** none
**What to do:** Increase spacing between each `dt`/`dd` pair in the personal, apartment, and building sections so the information reads as grouped rows rather than dense stacked text. Enlarge the phone edit controls for mobile by replacing the tiny icon-only ghost buttons with larger touch targets while keeping inline editing. Format `ownershipDate` with the shared date helper instead of showing the raw ISO string.
**Depends on:** Step 1

### Step 15 — Polish owner payments actions and value formatting
**Files to modify:** `src/components/features/payments/owner-payments-view.tsx`
**Files to create:** none
**What to do:** Change the `Payer` action button from `variant="ghost"` to `variant="default"` in the charges tab so it reads as the primary action. Update all charge and payment amount columns to use `formatMAD()`. Update the due-date and payment-date cells to use the shared date formatting helpers instead of raw strings.
**Depends on:** Step 1

### Step 16 — Align syndic payment page summaries and filters with the new formatting system
**Files to modify:** `src/components/features/payments/payments-table.tsx`
**Files to create:** none
**What to do:** Convert the three summary cards to `formatMAD()`, replace the two filter date inputs with the new date picker, and wrap the payments table in a Card from Step 7 if that change was not already applied in the same implementation pass. Convert the payment-date column to `formatDate()`. Keep the filter query behavior and API calls unchanged.
**Depends on:** Step 1, Step 2, Step 7

### Step 17 — Align dashboard financial widgets with the new formatting system
**Files to modify:** `src/components/features/dashboard/metric-cards-grid.tsx`, `src/components/features/dashboard/payment-chart.tsx`, `src/components/features/dashboard/recent-payments.tsx`, `src/components/features/dashboard/overdue-charges-table.tsx`
**Files to create:** none
**What to do:** Replace inline money/date formatting in the dashboard widgets with the shared helpers. Specifically: `metric-cards-grid.tsx` should use `formatMAD()` for total collected; `payment-chart.tsx` should use `formatMAD()` in the tooltip and keep month labels French via shared formatting rules; `recent-payments.tsx` should use `formatMAD()` and `formatDate()`; `overdue-charges-table.tsx` should use `formatMAD()` for remaining balances and `formatDate()` for due dates.
**Depends on:** Step 1

## Verification checklist
- Every former `type="date"` and `type="time"` control has been replaced by shared picker components.
- `react-day-picker@9.14.0` is installed and `src/components/ui/calendar.tsx` exists.
- No amount in the UI is rendered with raw `toFixed(2)` or manual `+ " MAD"` concatenation.
- No page or feature component renders raw ISO date strings for ownership, payment, due, meeting, or invitation response values.
- Syndic tables for owners, apartments, charges, meetings, and payments are all wrapped in `Card` containers.
- Modal/dialog form labels are sentence case; table headers remain uppercase.
- Dashboard greeting never displays the authenticated email address.
- Notifications header text is grammatically correct for `0`, `1`, and plural unread counts.
- Notification invitation buttons show `Accepter` as primary and `Décliner` as secondary.
- Settings sections have a clear divider and the submit button is right-aligned.
- Meeting detail page never shows seconds in time values.
- Owner profile sections have clearer spacing and mobile-friendly phone edit controls.
- Owner payments `Payer` button is primary and all amount columns use `formatMAD()`.
- Charge and apartment modals open with empty numeric fields instead of visible zero values.
- Charge category select starts on a disabled placeholder, not a preselected valid category.
