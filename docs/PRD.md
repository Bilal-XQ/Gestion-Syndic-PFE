# Product Requirements Document
# HOA Condominium Management Web Application

Version: 2.1
Last updated: March 2, 2026
Status: Approved for development

---

## Document Purpose

This document is the single source of truth for the HOA (Homeowners Association) condominium management web application. It defines the product vision, user roles, functional requirements, non-functional requirements, data models, page descriptions, authentication architecture, and the complete technology stack with exact package versions pinned as of March 2, 2026.

Every AI assistant, language model, developer, or agent working on this project must read this document in full before producing any code, architecture decision, schema migration, or design output. No assumption that contradicts this document is valid. When this document conflicts with any external source, this document takes precedence.

---

## Project Summary

This is a full-stack web application that modernizes and replaces a legacy Microsoft Access desktop-based condominium management tool. The system centralizes administrative and financial operations for a property syndic (property manager) and provides co-owners (residents) with a dedicated self-service portal.

The application supports two distinct user roles, each with its own protected route group and feature set. Authentication uses a single login page with a single form. The server embeds the user's role into the JWT at authentication time via a Supabase Custom Access Token Hook. Middleware reads the role directly from the JWT claim with no additional database query and redirects the user to the appropriate dashboard. There is no role selector on the login page.

The application is built as a monorepo using Next.js as both the frontend and backend runtime. All data is persisted in a Supabase PostgreSQL database with Row Level Security enforced at the database level. Type-safe database access is handled by Drizzle ORM. All financial mutations execute inside database transactions.

---

## User Roles

### Role: syndic

The syndic is the property manager. This role has full administrative access to all building data. The syndic registers and manages co-owners, creates and tracks charges, organizes general assembly meetings, sends invitations, monitors payments, generates payment notices, and views financial reports. The syndic cannot access the co-owner portal routes.

### Role: proprietaire

The proprietaire is a co-owner who resides in or owns a unit in the building. This role has access exclusively to their own data. The proprietaire views their profile, consults assigned charges, makes payments, views their payment history, responds to meeting invitations, and reads notifications. The proprietaire cannot access the syndic dashboard routes.

---

## Authentication Architecture

### Login Flow

The login page presents a single centered form with an email field and a password field. There is no role selector, tab, toggle, or separate login URL for each role. The sequence after form submission is:

1. The client sends credentials to a Next.js Server Action.
2. Supabase Auth validates the credentials and issues a signed JWT.
3. The JWT contains a custom claim `user_role` injected by the Supabase Custom Access Token Hook at token issuance time. The hook reads the `role` column from `public.users` and embeds it in `app_metadata`.
4. The Server Action reads `user_role` from the JWT session object without querying the database.
5. Based on the resolved role, the server redirects:
   - `syndic` → `/dashboard`
   - `proprietaire` → `/portal`
6. Invalid credentials return a generic error message without revealing which field was incorrect.

### JWT Custom Claim Implementation

The role is embedded in the JWT using a Supabase Custom Access Token Hook registered in the Supabase dashboard under Authentication → Hooks. The hook is a PostgreSQL function that reads the `role` column from `public.users` where `id = auth.uid()` and injects the value as `user_role` into the JWT's `app_metadata`. This is the official Supabase RBAC method.

This eliminates one database round-trip per request compared to querying the users table in middleware. RLS policies use `auth.jwt() ->> 'user_role'` and `auth.uid()` directly for data isolation.

Since roles are assigned at registration and are never changed during a session, the JWT staleness limitation does not affect this application.

### Middleware Route Protection

Next.js middleware enforces route protection before any page renders:

- All routes under `/dashboard/*` require a valid JWT with `user_role = syndic`. Any other authenticated user or unauthenticated request is redirected to `/login`.
- All routes under `/portal/*` require a valid JWT with `user_role = proprietaire`. Any other user is redirected to `/login`.
- The middleware uses the Supabase SSR client to read and refresh the session from cookies. It makes no database queries.

### Login Rate Limiting

Login attempts are rate-limited using `@upstash/ratelimit` with Upstash Redis running at the Vercel edge in middleware. The limit is 5 login attempts per IP address per minute using the sliding window algorithm. Requests that exceed the limit receive a 429 response. The rate limiter executes before the request reaches any Next.js server function, adding zero backend load for blocked requests.

### Password Recovery

The login page includes a "Forgot password" link. Clicking it shows a form where the user enters their email address. Supabase Auth sends a password reset email. The reset link routes to a dedicated password update page at `/reset-password`.

---

## Functional Requirements

### Owner Management (Syndic only)

- Register a new co-owner with the following fields: first name, last name, email address, phone number, assigned apartment unit (dropdown), and ownership start date.
- Upon successful registration: create a Supabase Auth account for the co-owner with a system-generated temporary password, save the owner record in the database, send a welcome email via Resend containing the co-owner's login email and temporary password, and write a `CREATE_OWNER` entry to `audit_logs`.
- Display a searchable and filterable list of all active (non-deleted) co-owners showing full name, email, phone, and assigned apartment unit.
- Edit existing co-owner personal information. Log the change to `audit_logs` as `UPDATE_OWNER`.
- Soft-delete a co-owner by setting their `deleted_at` timestamp. This revokes portal access without removing historical financial records. Write a `DELETE_OWNER` entry to `audit_logs`. Hard deletion is not permitted.
- Assign or reassign a co-owner to a different apartment unit.

### Charge Management (Syndic only)

- Create a new charge with: title, description, category (electricity, water, maintenance, repair, or other), total amount, due date, and target apartment unit. Log creation to `audit_logs` as `CREATE_CHARGE`.
- The charge table stores only `total_amount`. The fields `amount_paid`, `remaining_amount`, and `status` are never stored as columns. They are derived at query time by aggregating the `payments` table:
  - `amount_paid = SUM(payments.amount) WHERE charge_id = charges.id`
  - `remaining_amount = total_amount - amount_paid`
  - `status = 'paid' if remaining = 0 | 'partial' if amount_paid > 0 | 'unpaid' otherwise`
- Display all active charges with their derived payment status (paid, partial, unpaid), total amount, amount paid, remaining balance, and due date.
- Send a payment reminder email to a specific owner for a specific charge via Resend. Log to `audit_logs` as `SEND_REMINDER`.
- Generate and download a formal payment notice PDF for an overdue charge using `@react-pdf/renderer`. The notice includes: owner name, apartment details, charge title, description, total amount, amount paid, remaining balance, due date, and payment instructions.
- Soft-delete a charge. Log to `audit_logs` as `DELETE_CHARGE`.

### Payment Management (Syndic only)

- View a global payment history across all owners, filterable by date range, owner, and charge category.
- Each payment record shows: owner name, charge title, amount paid, payment date, method, and reference number.
- Display financial summary statistics computed from the payments table: total charges issued (sum of all `total_amount`), total collected (sum of all payment amounts), and total outstanding (difference).

### Meeting Management (Syndic only)

- Create a new general assembly meeting with: title, description, date, start time, end time, and location. Log to `audit_logs` as `CREATE_MEETING`.
- After creation, select which active co-owners to invite from a multi-select list. Each invited owner receives a meeting invitation email via Resend and an in-app notification of type `meeting_invitation`.
- View the meeting detail page showing: title, description, date, time, location, status, and the complete list of invited owners with their response status (invited, accepted, declined).
- View all meetings in a sortable list.

### Dashboard Overview (Syndic only)

- Display four summary metric cards: total active owners, total apartments, total active charges, and total payments received.
- Display a table of unpaid or overdue charges showing owner name, charge title, remaining balance (computed), and due date.

### Apartment Management (Syndic only)

- Display a list of all apartments in the building showing: unit number, floor, surface area, room count, and occupancy status.
- Create a new apartment with: unit number, floor, surface area, room count, and initial occupancy status. Log to `audit_logs` as `CREATE_APARTMENT`.
- Edit apartment details (unit number, floor, surface area, room count). Log to `audit_logs` as `UPDATE_APARTMENT`.
- Apartment occupancy status transitions automatically: when an owner is assigned to an apartment the status becomes `occupied`. When the assigned owner is soft-deleted or reassigned the status reverts to `vacant`. This transition executes inside the owner management Server Actions, not as a separate operation.
- Soft-delete an apartment only if no active owner is currently assigned to it. Log to `audit_logs` as `DELETE_APARTMENT`. Hard deletion is not permitted.

### Building Settings (Syndic only)

- Display and edit the building configuration used across the application and in all generated PDF documents: building name, full address, and syndic contact information.
- Reads from and writes to the `buildings` table row associated with the authenticated syndic.
- The building record is created automatically when the syndic account is provisioned. There is always exactly one building record per syndic at MVP scope.
- Log updates to `audit_logs` as `UPDATE_BUILDING`.

### Owner Portal — Profile (Proprietaire only)

- Display personal information: full name, email, phone, ownership date.
- Display apartment details: unit number, floor, surface area, room count, and occupancy status.
- Allow updating phone number via inline edit. All other fields are read-only from the co-owner's perspective.
- Allow changing the account password via a dedicated form that calls Supabase Auth password update.

### Owner Portal — Payments (Proprietaire only)

- Display all charges assigned to the co-owner's apartment. For each charge show: title, category, total amount, amount paid (computed), remaining balance (computed), due date, and status badge.
- Display a full payment history for the co-owner: charge name, amount paid, payment date, method, and reference.
- Allow making a payment against an unpaid or partial charge. The payment form collects: amount (partial payments are supported), payment method (bank transfer, check, or cash), and reference number.
- Payment creation executes inside a Drizzle database transaction. If any step fails, the entire operation rolls back and no partial state is committed.
- On successful payment, create an in-app notification of type `payment_confirmation` and log to `audit_logs` as `CREATE_PAYMENT`.
- Allow the co-owner to download a formal payment notice PDF for any of their charges using `@react-pdf/renderer`. The notice is identical in structure to the syndic-generated notice and includes: owner name, apartment details, charge title, description, total amount, amount paid, remaining balance, due date, and building contact information sourced from the `buildings` table.

### Owner Portal — Notifications (Proprietaire only)

- Display all notifications for the co-owner in reverse chronological order.
- Notification types: `meeting_invitation`, `payment_reminder`, `payment_confirmation`, `payment_notice`.
- Meeting invitation notifications include "Accept" and "Decline" action buttons. Responding updates `meeting_invitations.status`, sets `responded_at`, and logs to `audit_logs` as `RESPOND_INVITATION`.
- Unread notifications are visually distinguished from read ones.
- Opening a notification marks it as read by setting `is_read = true`.

---

## Non-Functional Requirements

### Security

- All `/dashboard/*` routes require a valid JWT with `user_role = syndic` enforced at middleware level before any server function executes.
- All `/portal/*` routes require a valid JWT with `user_role = proprietaire` enforced at middleware level.
- Supabase RLS policies enforce data isolation at the database level using `auth.jwt() ->> 'user_role'` and `auth.uid()`. No application-level filtering substitutes for RLS.
- Login attempts are rate-limited to 5 per IP per minute at the Vercel edge using `@upstash/ratelimit` with a sliding window algorithm.
- Passwords are never stored or transmitted in plain text. Supabase Auth handles all credential hashing and session management.
- Zod validation is enforced on both the client (via React Hook Form) and the server (via Server Actions) for all form submissions.
- Sensitive mutations are recorded in the `audit_logs` table within the same Server Action that performs the mutation. Audit log rows are immutable and are never updated or deleted.
- All financial and ownership entities are soft-deleted using a `deleted_at` timestamp. Hard deletion is not permitted for any table holding financial or ownership records.

### Performance

- Pages use React Server Components by default. The `"use client"` directive is applied only when a component requires browser APIs, event handlers, or reactive state.
- Database queries use Drizzle ORM. Explicit indexes are defined on all foreign key columns and all columns that appear in WHERE clauses of common queries. See the Database Indexes section for the full list.
- Derived financial values (`amount_paid`, `remaining_amount`, charge `status`) are computed via SQL aggregation at query time. They are never stored as columns.
- TanStack Query manages client-side caching and background revalidation for all client-rendered data.
- Supabase Realtime delivers new notifications to the proprietaire portal without polling. The Realtime subscription invalidates the TanStack Query notifications cache on each INSERT event, triggering a focused refetch of only the notifications query.
- All financial mutations execute inside Drizzle database transactions.

### Responsiveness

- The application is fully responsive across desktop, tablet, and mobile viewports.
- The syndic sidebar collapses to icon-only mode via a Zustand-managed toggle on desktop. On mobile it is replaced by a slide-over drawer using the shadcn Sheet component triggered by a hamburger icon.
- All tables, forms, modals, and slide-over panels are responsive.

### Error Handling and Observability

- Every route group includes a `loading.tsx` for suspense-based skeleton screens and an `error.tsx` as a React error boundary. A root-level `error.tsx` and `not-found.tsx` exist at the app root. These are implemented in Phase 1, not deferred.
- Production errors are captured by Sentry, initialized via the Next.js Sentry SDK in the instrumentation file with source map upload on deploy.

### Email Deliverability

- The Resend sending domain is authenticated with SPF, DKIM, and DMARC records before any production email is sent. This is configured in the Resend dashboard and DNS provider during Phase 6 deployment preparation.

### Scalability

- The architecture is stateless. Supabase manages PostgreSQL connection pooling. Vercel manages serverless function scaling. No additional infrastructure configuration is required for MVP-scale traffic.

---

## Data Models

All tables include `created_at` (timestamp, NOT NULL, DEFAULT now()) and `updated_at` (timestamp, NOT NULL, DEFAULT now()). All primary keys are UUID. All foreign key columns have explicit index definitions. Entities that support deletion use a `deleted_at` nullable timestamp for soft deletion.

### users

Extends Supabase Auth. Stores application-level profile and role data. One row per authenticated user.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK, references auth.users | Matches the Supabase Auth user ID |
| email | text | NOT NULL, UNIQUE | Login email address |
| first_name | text | NOT NULL | First name |
| last_name | text | NOT NULL | Last name |
| phone | text | | Phone number |
| role | text | NOT NULL, CHECK (role IN ('syndic', 'proprietaire')) | Application role, embedded in JWT |
| deleted_at | timestamp | NULLABLE | Soft delete timestamp |
| created_at | timestamp | NOT NULL, DEFAULT now() | |
| updated_at | timestamp | NOT NULL, DEFAULT now() | |

### buildings

Represents a physical building managed by a syndic. MVP scope: one building per syndic.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK | |
| syndic_id | uuid | NOT NULL, FK users.id | The managing syndic |
| name | text | NOT NULL | Building name |
| address | text | NOT NULL | Full physical address |
| deleted_at | timestamp | NULLABLE | |
| created_at | timestamp | NOT NULL | |
| updated_at | timestamp | NOT NULL | |

### apartments

Represents a unit within a building.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK | |
| building_id | uuid | NOT NULL, FK buildings.id | Parent building |
| unit_number | text | NOT NULL | Apartment label such as "101" or "B2" |
| floor | integer | NOT NULL | Floor number |
| surface_area | numeric | NOT NULL | Area in square meters |
| room_count | integer | NOT NULL | Number of rooms |
| status | text | NOT NULL, CHECK (status IN ('occupied', 'vacant')) | Occupancy status |
| created_at | timestamp | NOT NULL | |
| updated_at | timestamp | NOT NULL | |

### owners

Links a user with the `proprietaire` role to an apartment. Represents the ownership record.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK | |
| user_id | uuid | NOT NULL, FK users.id | The co-owner user |
| apartment_id | uuid | NOT NULL, FK apartments.id | Assigned apartment unit |
| ownership_date | date | NOT NULL | Date ownership began |
| deleted_at | timestamp | NULLABLE | Soft delete |
| created_at | timestamp | NOT NULL | |
| updated_at | timestamp | NOT NULL | |

### charges

A financial charge created by the syndic and assigned to an apartment. Stores only the base total amount. All derived financial values are computed from the payments table at query time.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK | |
| syndic_id | uuid | NOT NULL, FK users.id | The syndic who created the charge |
| apartment_id | uuid | NOT NULL, FK apartments.id | Target apartment |
| title | text | NOT NULL | Short charge title |
| description | text | | Detailed description |
| category | text | NOT NULL, CHECK (category IN ('electricity', 'water', 'maintenance', 'repair', 'other')) | Charge category |
| total_amount | numeric | NOT NULL | The only stored financial value on this table |
| due_date | date | NOT NULL | Payment due date |
| last_reminder_sent_at | timestamp | NULLABLE | Timestamp of last reminder email |
| deleted_at | timestamp | NULLABLE | Soft delete |
| created_at | timestamp | NOT NULL | |
| updated_at | timestamp | NOT NULL | |

The following values are never stored as columns. They are computed at query time:
- `amount_paid = SUM(payments.amount) WHERE payments.charge_id = charges.id`
- `remaining_amount = charges.total_amount - amount_paid`
- `status = CASE WHEN remaining_amount = 0 THEN 'paid' WHEN amount_paid > 0 THEN 'partial' ELSE 'unpaid' END`

### payments

A single payment transaction made by an owner against a charge. This table is the source of truth for all financial aggregations. Rows are never updated or deleted.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK | |
| charge_id | uuid | NOT NULL, FK charges.id | The charge being paid |
| owner_id | uuid | NOT NULL, FK owners.id | The owner making the payment |
| amount | numeric | NOT NULL | Amount paid in this transaction |
| payment_date | date | NOT NULL | Date of payment |
| method | text | NOT NULL, CHECK (method IN ('bank_transfer', 'check', 'cash')) | Payment method |
| reference | text | NOT NULL | Reference number or receipt identifier |
| notes | text | | Optional notes |
| created_at | timestamp | NOT NULL | |
| updated_at | timestamp | NOT NULL | |

### meetings

A general assembly meeting created by the syndic.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK | |
| syndic_id | uuid | NOT NULL, FK users.id | The syndic who created the meeting |
| title | text | NOT NULL | Meeting title |
| description | text | | Agenda or meeting description |
| meeting_date | date | NOT NULL | Date of meeting |
| start_time | time | NOT NULL | Start time |
| end_time | time | NOT NULL | End time |
| location | text | NOT NULL | Physical or virtual location |
| status | text | NOT NULL, DEFAULT 'scheduled', CHECK (status IN ('scheduled', 'completed', 'cancelled')) | Meeting status |
| deleted_at | timestamp | NULLABLE | |
| created_at | timestamp | NOT NULL | |
| updated_at | timestamp | NOT NULL | |

### meeting_invitations

Links owners to meetings and tracks their response status.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK | |
| meeting_id | uuid | NOT NULL, FK meetings.id | The meeting |
| owner_id | uuid | NOT NULL, FK owners.id | The invited owner |
| status | text | NOT NULL, DEFAULT 'invited', CHECK (status IN ('invited', 'accepted', 'declined')) | Response status |
| responded_at | timestamp | NULLABLE | Timestamp when the owner responded |
| created_at | timestamp | NOT NULL | |
| updated_at | timestamp | NOT NULL | |

### notifications

In-app notifications delivered to proprietaire users.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK | |
| user_id | uuid | NOT NULL, FK users.id | Notification recipient |
| type | text | NOT NULL, CHECK (type IN ('meeting_invitation', 'payment_reminder', 'payment_confirmation', 'payment_notice')) | Notification type |
| title | text | NOT NULL | Short notification title |
| message | text | NOT NULL | Full notification body |
| metadata | jsonb | NULLABLE | Extra context such as charge_id or meeting_id |
| is_read | boolean | NOT NULL, DEFAULT false | Whether the notification has been read |
| created_at | timestamp | NOT NULL | |
| updated_at | timestamp | NOT NULL | |

### audit_logs

Immutable append-only record of sensitive mutations. Rows in this table are never updated or deleted under any circumstances.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | uuid | PK | |
| user_id | uuid | NOT NULL, FK users.id | The user who performed the action |
| action | text | NOT NULL | Action identifier |
| entity_type | text | NOT NULL | Name of the affected table |
| entity_id | uuid | NOT NULL | Primary key of the affected row |
| metadata | jsonb | NULLABLE | Optional additional context |
| created_at | timestamp | NOT NULL | Exact timestamp of the action |

Logged actions: `CREATE_OWNER`, `UPDATE_OWNER`, `DELETE_OWNER`, `CREATE_APARTMENT`, `UPDATE_APARTMENT`, `DELETE_APARTMENT`, `CREATE_CHARGE`, `DELETE_CHARGE`, `CREATE_PAYMENT`, `SEND_REMINDER`, `CREATE_MEETING`, `RESPOND_INVITATION`, `UPDATE_BUILDING`.

---

## Database Indexes

The following indexes must be explicitly defined in the Drizzle schema file. These are required to prevent slow queries as data grows.

| Table | Column(s) | Purpose |
|---|---|---|
| users | role | Role-based filtering in middleware and RLS |
| users | deleted_at | Filter active users |
| owners | user_id | Look up owner record by authenticated user |
| owners | apartment_id | Look up owners assigned to a specific apartment |
| owners | deleted_at | Filter active owners |
| charges | apartment_id | Look up charges for a specific apartment |
| charges | syndic_id | Look up charges created by a specific syndic |
| charges | due_date | Overdue charges report and sorting |
| charges | deleted_at | Filter active charges |
| payments | charge_id | Aggregate payments per charge (the most critical query) |
| payments | owner_id | Payment history per owner |
| payments | payment_date | Date range filtering on payment history |
| meetings | syndic_id | Filter meetings by syndic |
| meeting_invitations | meeting_id | Get all invitees for a specific meeting |
| meeting_invitations | owner_id | Get all meeting invitations for a specific owner |
| notifications | user_id | Fetch all notifications for a user |
| notifications | is_read | Filter unread notifications |
| apartments | building_id | List all apartments in a building |
| apartments | status | Filter by occupancy status |
| buildings | syndic_id | Look up building by syndic |
| audit_logs | user_id | Filter audit log by actor |
| audit_logs | entity_id | Filter audit log by affected record |
| audit_logs | action | Filter audit log by action type |

---

## Page Descriptions

### Landing Page (`/`)

A public marketing page presenting the application to potential users. Describes the product purpose and key features for both roles. Includes a prominent call-to-action button linking to the login page. No authentication required.

### Login Page (`/login`)

A single centered card containing an email field, a password field, and a submit button. No role selector exists. The server resolves the role from the JWT claim and redirects after successful authentication. Invalid credentials produce a generic error message. A "Forgot password" link navigates to the password recovery flow. The application logo appears above the card.

### Password Recovery (`/reset-password`)

A form where the user enters their email address to receive a Supabase Auth password reset link. The reset link navigates to a password update form.

### Syndic Dashboard — Overview (`/dashboard`)

Summary cards: total active owners, total apartments, total active charges, total payments received. Below the cards: a table of unpaid or overdue charges with owner name, charge title, remaining balance (computed), and due date. Collapsible sidebar on desktop, drawer on mobile.

### Syndic Dashboard — Owners (`/dashboard/owners`)

Searchable and filterable table of all active co-owners. Columns: full name, email, phone, apartment unit. Row actions: edit, delete. A button in the top-right opens the Add Owner panel.

### Syndic Dashboard — Apartments (`/dashboard/apartments`)

List of all apartments in the building. Columns: unit number, floor, surface area, room count, occupancy status badge. Row actions: edit, delete (only available if unit has no active owner). A button in the top-right opens the Add Apartment panel.

### Syndic Dashboard — Add or Edit Apartment (Slide-Over Panel)

A shadcn Sheet component containing a form with fields: unit number, floor, surface area, room count, and occupancy status. On submit the Server Action saves the apartment row and logs to `audit_logs`. Validation uses the Zod schema from `src/lib/validations/apartment.ts`. On success the panel closes and the apartment list refreshes via TanStack Query invalidation.

### Syndic Dashboard — Building Settings (`/dashboard/settings`)

A single-page settings form for the building configuration. Fields: building name, full address, syndic contact phone, and syndic contact email. On submit the Server Action updates the `buildings` row and logs to `audit_logs` as `UPDATE_BUILDING`. The form is pre-populated with existing values on load. Validation uses the Zod schema from `src/lib/validations/settings.ts`.

### Syndic Dashboard — Add or Edit Owner (Slide-Over Panel)

A shadcn Sheet component containing a form with fields: first name, last name, email, phone, apartment dropdown, and ownership date. On submit the Server Action creates the Supabase Auth account, saves the owner row, sends the welcome email via Resend, and logs to `audit_logs`. Validation uses React Hook Form with the Zod schema from `src/lib/validations/owner.ts`. On success the panel closes and the owner list refreshes via TanStack Query invalidation.

### Syndic Dashboard — Charges (`/dashboard/charges`)

List of all active charges. Each item shows: title, category badge, total amount, amount paid (computed), remaining balance (computed), due date, and status badge. A button opens the charge creation form. For charges with a remaining balance: a "Send Reminder" button and a "Download Notice" button.

### Syndic Dashboard — Meetings (`/dashboard/meetings`)

List of all meetings. Columns: title, date, time, location, number of invited owners, status badge. A button opens the meeting creation form. Clicking a row navigates to the meeting detail page.

### Syndic Dashboard — Meeting Detail (`/dashboard/meetings/[id]`)

Full meeting details: title, description, date, time, location, status. Below: a table of invited owners with response status badges (invited, accepted, declined). A button allows adding more invitees from the active owners list.

### Syndic Dashboard — Payments (`/dashboard/payments`)

Global payment history with filter controls for date range, owner, and charge category. Columns: owner name, charge title, amount, date, method, reference. A summary row at the top shows total collected and total outstanding computed from the payments table.

### Owner Portal — Profile (`/portal`)

Two sections: personal information (name, email, phone, ownership date) and apartment details (unit number, floor, surface area, rooms, status). Phone number is editable inline. A separate password change section calls Supabase Auth update.

### Owner Portal — Payments (`/portal/payments`)

Two tabs. First tab: all charges assigned to the co-owner's apartment with status badges and a Pay button for unpaid or partial charges. The Pay button opens a payment form collecting amount, method, and reference. Partial payments are supported. Each charge row includes a "Download Notice" button that generates and downloads a PDF payment notice using `@react-pdf/renderer`, identical in content to the syndic-generated notice. Second tab: full payment history for the co-owner.

### Owner Portal — Notifications (`/portal/notifications`)

All notifications in reverse chronological order. Each entry shows: type icon, title, message, relative timestamp. Meeting invitation notifications include Accept and Decline buttons. Unread notifications are visually distinct. Clicking a notification marks it as read.

---

## Architecture Decisions

### Server Components by Default

All pages and layouts are React Server Components unless a component requires browser APIs, event listeners, or reactive state. The `"use client"` directive is applied only when strictly necessary. This keeps the JavaScript bundle minimal and improves initial render performance.

### Server Actions for All Mutations

All create, update, and delete operations are handled by Next.js Server Actions in `src/lib/actions/`. No client-side fetch calls are made to internal API route handlers for mutations. This keeps mutation logic server-side and avoids redundant API surface area.

### Database Transactions for All Financial Operations

Any Server Action that writes to the `payments` table is wrapped in a Drizzle database transaction. If any step within the transaction fails, the entire operation rolls back. No partial financial state is ever committed to the database.

### Real-Time Notifications via Supabase Realtime

In-app notifications for proprietaire users are delivered in real time using Supabase Realtime channel subscriptions. The implementation uses the following approach:

- The Owner Portal layout () initialises a Supabase Realtime channel subscribed to  events on the  table, filtered by . This subscription is established once at layout mount and torn down on unmount.
- When a new notification row is inserted (by a syndic meeting invitation or a payment confirmation Server Action), Supabase Realtime broadcasts the event to the subscribed proprietaire client within seconds without any polling.
- On receiving a Realtime event, the client uses TanStack Query to invalidate the  query key, triggering an automatic background refetch to display the new notification.
- A notification bell icon in the portal top bar displays an unread count badge. The count is derived from the cached TanStack Query result and updates automatically when the query is invalidated by a Realtime event.
- The Supabase client used for the Realtime subscription is the browser client exported from . Server Components never subscribe to Realtime channels.
- RLS on the  table ensures a proprietaire can only receive Realtime events for rows where . No cross-owner notification leakage is possible at the database level.

### Real-Time Notifications via Supabase Realtime

In-app notifications for proprietaire users are delivered in real time using Supabase Realtime channel subscriptions. The implementation follows these rules:

- The Owner Portal layout at `(owner)/layout.tsx` initialises a Supabase Realtime channel subscribed to `INSERT` events on the `notifications` table, filtered server-side by `user_id = auth.uid()`. This subscription is established once at layout mount and torn down on unmount.
- When a new notification row is inserted by a syndic Server Action, Supabase Realtime broadcasts the event to the subscribed proprietaire client in real time without polling.
- On receiving a Realtime event, the client invalidates the `notifications` TanStack Query key, triggering an automatic background refetch to display the new notification immediately.
- A notification bell icon in the portal top bar displays an unread count badge derived from the TanStack Query cache. The badge updates automatically when the query is invalidated.
- The Supabase Realtime subscription uses the browser client exported from `src/utils/supabase/client.ts`. Server Components never subscribe to Realtime channels.
- RLS on the `notifications` table enforces that a proprietaire can only receive Realtime events for rows where `user_id = auth.uid()`. Cross-owner notification leakage is impossible at the database level.
- A custom React hook `useNotificationsRealtime` in `src/hooks/use-notifications-realtime.ts` encapsulates the subscription lifecycle. It is called once in the portal layout, not in individual notification components.

### Derived Financial Fields

The values `amount_paid`, `remaining_amount`, and `status` on charges are never stored as database columns. They are computed at query time via SQL aggregation over the `payments` table. This is a hard correctness requirement: stored aggregates drift out of sync with the source of truth when multiple payments are made, edited, or corrected. Derived values prevent this class of bug entirely.

### Soft Deletes for Protected Entities

Owners, charges, and meetings are soft-deleted by setting a `deleted_at` timestamp. Hard deletion is not permitted for any entity that has financial records associated with it. All list queries must include a `WHERE deleted_at IS NULL` condition. Drizzle query helpers in `src/lib/db/queries/` encapsulate this filter so it is never omitted.

### Shared Zod Schemas

Every form has a corresponding Zod schema in `src/lib/validations/`. The same schema instance is used for both client-side React Hook Form validation and server-side Server Action validation. This prevents schema drift and ensures validation errors are consistent between client and server.

### Single Supabase Client Pattern

Supabase clients are never instantiated inline in components or actions. A server-side client is exported from `src/utils/supabase/server.ts`, a browser client from `src/utils/supabase/client.ts`, and a middleware client from `src/utils/supabase/middleware.ts`. All application code imports exclusively from these three utilities.

### JWT Claims for Role Resolution

The user's role is embedded in the JWT at authentication time via the Supabase Custom Access Token Hook. Middleware reads `user_role` from the session's JWT without any additional database query per request. RLS policies reference `auth.jwt() ->> 'user_role'` and `auth.uid()` for database-level access control. The login form has no knowledge of roles.

### Audit Logging Inside Server Actions

Every sensitive mutation is followed by an insert into `audit_logs` within the same Server Action that performs the primary mutation. The audit log insert is not wrapped in the financial transaction so that audit records are preserved even if a transaction rolls back. Audit log rows are never modified after creation.

### Error Boundaries and Loading States in Phase 1

Every route group includes a `loading.tsx` for suspense-based skeleton screens and an `error.tsx` for error boundary rendering. A root-level `error.tsx` and `not-found.tsx` exist at the app root. These are created in Phase 1, not deferred to a polish phase. Blank white screens in production are not acceptable.

---

## Project File Structure

```
project-root/
├── docs/
│   ├── PRD.md                             (this file)
│   ├── DATABASE_SCHEMA.md
│   ├── ARCHITECTURE.md
│   └── PHASES.md
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── (syndic)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── loading.tsx
│   │   │   │   ├── error.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── owners/
│   │   │   │   ├── loading.tsx
│   │   │   │   ├── error.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── apartments/
│   │   │   │   ├── loading.tsx
│   │   │   │   ├── error.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── loading.tsx
│   │   │   │   ├── error.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── charges/
│   │   │   │   ├── loading.tsx
│   │   │   │   ├── error.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── meetings/
│   │   │   │   ├── loading.tsx
│   │   │   │   ├── error.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── loading.tsx
│   │   │   │       ├── error.tsx
│   │   │   │       └── page.tsx
│   │   │   └── payments/
│   │   │       ├── loading.tsx
│   │   │       ├── error.tsx
│   │   │       └── page.tsx
│   │   ├── (owner)/
│   │   │   ├── layout.tsx
│   │   │   ├── portal/
│   │   │   │   ├── loading.tsx
│   │   │   │   ├── error.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── payments/
│   │   │   │   ├── loading.tsx
│   │   │   │   ├── error.tsx
│   │   │   │   └── page.tsx
│   │   │   └── notifications/
│   │   │       ├── loading.tsx
│   │   │       ├── error.tsx
│   │   │       └── page.tsx
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                            (shadcn generated components)
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── mobile-nav.tsx
│   │   │   └── top-bar.tsx
│   │   └── features/
│   │       ├── owners/
│   │       ├── apartments/
│   │       ├── charges/
│   │       ├── meetings/
│   │       ├── payments/
│   │       ├── notifications/
│   │       └── settings/
│   ├── lib/
│   │   ├── actions/
│   │   │   ├── auth.ts
│   │   │   ├── owners.ts
│   │   │   ├── apartments.ts
│   │   │   ├── charges.ts
│   │   │   ├── payments.ts
│   │   │   ├── meetings.ts
│   │   │   ├── notifications.ts
│   │   │   └── settings.ts
│   │   ├── db/
│   │   │   ├── schema.ts
│   │   │   ├── index.ts
│   │   │   └── queries/
│   │   │       ├── apartments.ts
│   │   │       ├── charges.ts
│   │   │       ├── payments.ts
│   │   │       ├── owners.ts
│   │   │       ├── meetings.ts
│   │   │       └── notifications.ts
│   │   ├── email/
│   │   │   └── templates/
│   │   │       ├── welcome.tsx
│   │   │       ├── payment-reminder.tsx
│   │   │       └── meeting-invitation.tsx
│   │   └── validations/
│   │       ├── owner.ts
│   │       ├── apartment.ts
│   │       ├── charge.ts
│   │       ├── payment.ts
│   │       ├── meeting.ts
│   │       └── settings.ts
│   ├── hooks/
│   │   └── use-notifications-realtime.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       └── supabase/
│           ├── client.ts
│           ├── server.ts
│           └── middleware.ts
├── middleware.ts
├── sentry.client.config.ts
├── sentry.server.config.ts
├── sentry.edge.config.ts
├── drizzle.config.ts
└── next.config.ts
```

---

## Technology Stack with Exact Versions

All packages must be installed at the versions listed below, pinned as of March 2, 2026.

### Runtime Dependencies

| Category | Package | Version |
|---|---|---|
| Core | next | 16.1.6 |
| Core | react | 19.2.3 |
| Core | react-dom | 19.2.3 |
| Core | typescript | 5.9.0 |
| UI and Styling | tailwindcss | 4.2.1 |
| UI and Styling | shadcn/ui | latest canary (Tailwind v4 + React 19 compatible, installed via CLI) |
| UI and Styling | lucide-react | 0.575.0 |
| UI and Styling | recharts | 3.7.0 |
| Database | @supabase/supabase-js | 2.98.0 |
| Database | @supabase/ssr | latest |
| Database | drizzle-orm | 0.45.1 |
| Database | postgres | latest |
| Rate Limiting | @upstash/ratelimit | latest |
| Rate Limiting | @upstash/redis | latest |
| State Management | @tanstack/react-query | 5.x latest |
| State Management | zustand | 5.9.0 |
| Forms | react-hook-form | 7.x latest |
| Forms | zod | 4.3.6 |
| Forms | @hookform/resolvers | 5.2.2 |
| Email | resend | latest stable |
| Email | @react-email/components | latest stable |
| Email | @react-email/render | latest stable |
| PDF | @react-pdf/renderer | 4.3.2 |
| Error Monitoring | @sentry/nextjs | latest stable |
| Utilities | sonner | 2.0.7 |
| Utilities | date-fns | 4.1.0 |
| Utilities | clsx | 2.x |
| Utilities | tailwind-merge | 3.5.0 |

### Development Dependencies

| Package | Version |
|---|---|
| drizzle-kit | 0.34+ |
| vitest | latest |
| @testing-library/react | latest |
| eslint | 10.x |
| prettier | 3.10.0 |
| husky | 8.x |
| lint-staged | 14.x |

### External Services

| Service | Purpose |
|---|---|
| Vercel | Frontend hosting and serverless function runtime |
| Supabase Cloud | PostgreSQL database, authentication, real-time subscriptions via Supabase Realtime channels |
| Upstash Redis | Edge-compatible rate limiting state store |
| Resend | Transactional email delivery |
| Sentry | Production error monitoring and alerting |

---

## Testing Requirements

The following flows must have unit test coverage using Vitest before the application is considered complete for MVP:

- Login Server Action: valid syndic credentials resolve the `syndic` role and redirect to `/dashboard`. Valid proprietaire credentials resolve the `proprietaire` role and redirect to `/portal`. Invalid credentials return a generic error without role information.
- Payment creation transaction: inserting a payment row inside a transaction correctly updates the derived `amount_paid` value on the next read. A transaction rollback produces no partial state.
- Partial payment aggregation: multiple partial payments aggregate correctly such that `amount_paid` equals the sum of all individual payment amounts and `remaining_amount` equals `total_amount` minus `amount_paid`.
- Zod schema validation: each schema in `src/lib/validations/` correctly rejects invalid inputs and accepts valid ones.
- Soft delete filtering: a soft-deleted owner does not appear in the active owners list query result.
- Meeting invitation response: accepting an invitation sets `status = 'accepted'`, sets `responded_at`, creates a notification, and logs to `audit_logs`.
- Apartment status transition: soft-deleting an active owner sets the linked apartment's `status` to `vacant`. Assigning a new owner to a vacant apartment sets its `status` to `occupied`.
- Supabase Realtime subscription: inserting a notification row for a proprietaire triggers a TanStack Query invalidation of the `notifications` query key in the `useNotificationsRealtime` hook.
- PDF generation: calling the payment notice render function with valid charge and owner data returns a non-empty PDF buffer without throwing.

Playwright end-to-end tests are deferred to post-MVP. Component-level Testing Library tests are optional for MVP.

---

## Build Phases

### Phase 1 — Foundation

- Initialize the Next.js 16 project with all dependencies at the exact versions specified in this document using pnpm.
- Configure Tailwind CSS v4 and install shadcn/ui via CLI.
- Define the complete Drizzle ORM schema in `src/lib/db/schema.ts` with all tables, check constraints, indexes, and foreign keys listed in this document.
- Run the initial migration against the Supabase database using drizzle-kit.
- Implement the Supabase Custom Access Token Hook PostgreSQL function and register it in the Supabase dashboard.
- Configure Next.js middleware with Supabase SSR session refresh, JWT role claim reading, and role-based route protection.
- Integrate Upstash Redis rate limiting on the login route in middleware.
- Add root `error.tsx` and `not-found.tsx`. Add `loading.tsx` and `error.tsx` to every route and route group.
- Initialize Sentry with the Next.js SDK and verify error capture in development.
- Build the landing page.
- Build the login page with automatic role detection and redirect.
- Build the password recovery pages.
- Seed a default `buildings` row for the syndic account immediately after syndic account creation so the settings page and PDF generation always have a valid data source.

### Phase 2 — Syndic Dashboard

- Build the collapsible sidebar with Zustand state and mobile drawer. Sidebar navigation links: Overview, Owners, Apartments, Charges, Meetings, Payments, Settings.
- Build the dashboard overview page with summary cards and overdue charges table using computed financial values.
- Build owner management: list page with search and filter, add panel, edit panel, soft-delete with confirmation dialog.
- Build apartment management: list page, add panel, edit panel, soft-delete with active-owner guard. Implement automatic status transitions on owner assign and soft-delete.
- Build the building settings page: pre-populated form, update Server Action, audit log entry.
- Implement the welcome email flow using Resend and the React Email welcome template.
- Write Vitest unit tests for owner and apartment Server Actions including status transition logic.

### Phase 3 — Charges and Payments

- Build the charges page with creation form, derived status badges, reminder button, and PDF download.
- Build charge detail view showing per-owner payment breakdown using SQL aggregation.
- Implement payment creation wrapped in a Drizzle transaction.
- Implement the payment reminder email using the React Email payment-reminder template.
- Implement PDF payment notice generation with `@react-pdf/renderer`. The notice sources building name and address from the `buildings` table. The same render function is used by both the syndic and the proprietaire portal. It accepts owner, charge, and building data as props and returns a PDF buffer.
- Build the global payments history page with filters and financial summary computed from the payments table.
- Write Vitest unit tests for payment aggregation logic and transaction behavior.

### Phase 4 — Meetings

- Build the meetings list page and meeting creation form.
- Build the owner invitation flow with in-app notification creation and Resend email dispatch.
- Build the meeting detail page with attendee list and response status badges.
- Build the accept and decline Server Actions for meeting invitations.
- Implement the `useNotificationsRealtime` hook in `src/hooks/use-notifications-realtime.ts`. Integrate it into the Owner Portal layout. Verify that creating a meeting invitation notification from the syndic dashboard triggers a live badge update in the proprietaire portal without a page refresh.
- Write Vitest unit tests for the invitation response flow and the Realtime hook invalidation logic.

### Phase 5 — Owner Portal

- Build the owner profile page with inline phone editing and password change form.
- Build the owner payments page with the two-tab layout (charges tab and payment history tab).
- Build the payment form with partial payment support and transaction wrapping.
- Add the Download Notice button to each charge row in the portal charges tab. Reuse the shared PDF render function from Phase 3.
- Build the notifications page with accept and decline actions for meeting invitations.
- Write Vitest unit tests for the notification and payment portal flows.

### Phase 6 — Polish and Deployment

- Conduct a full responsiveness audit across all pages at mobile, tablet, and desktop breakpoints.
- Add skeleton loading screens to all data-fetching pages.
- Verify all Sentry integrations are capturing errors correctly in the staging environment.
- Configure SPF, DKIM, and DMARC records on the Resend sending domain in DNS before sending any production email.
- Conduct a full RLS policy audit by running test queries using proprietaire-role JWTs to verify that no cross-owner data is accessible.
- Run the full Vitest test suite and resolve all failures before deploying.
- Deploy to Vercel production connected to Supabase Cloud.

