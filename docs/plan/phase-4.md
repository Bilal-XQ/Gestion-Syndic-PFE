# Phase 4 — Meetings, Invitations & Real-time Notifications

**Created:** July 20, 2025
**Status:** Ready for implementation
**Prerequisite:** Phase 3 complete — 21 routes building, 45 Vitest tests passing, `meetings`, `meeting_invitations`, and `notifications` tables already in schema

---

## Supabase MCP Pre-Check Results

| Check | Result |
|---|---|
| `meetings` table columns | ✅ 12 columns: `id`, `syndic_id`, `title`, `description`, `meeting_date`, `start_time`, `end_time`, `location`, `status`, `deleted_at`, `created_at`, `updated_at` |
| `meeting_invitations` table columns | ✅ 7 columns: `id`, `meeting_id`, `owner_id`, `status` (default `'invited'`), `responded_at`, `created_at`, `updated_at` |
| `notifications` table columns | ✅ 9 columns: `id`, `user_id`, `type`, `title`, `message`, `metadata` (jsonb), `is_read`, `created_at`, `updated_at` |
| `meetings` status CHECK | ✅ `('scheduled', 'completed', 'cancelled')` |
| `meeting_invitations` status CHECK | ✅ `('invited', 'accepted', 'declined')` |
| `notifications` type CHECK | ✅ `('meeting_invitation', 'payment_reminder', 'payment_confirmation', 'payment_notice')` |
| RLS on `meetings` | ✅ Enabled — 2 policies: `syndic_all_meetings` (ALL where syndic_id = auth.uid()), `proprietaire_read_invited_meetings` (SELECT where id in their invitations) |
| RLS on `meeting_invitations` | ✅ Enabled — 3 policies: `syndic_all_invitations` (ALL), `proprietaire_read_own_invitations` (SELECT by owner_id), `proprietaire_update_own_invitation` (UPDATE by owner_id) |
| RLS on `notifications` | ✅ Enabled — 3 policies: `proprietaire_read_own_notifications` (SELECT where user_id = auth.uid()), `proprietaire_update_own_notifications` (UPDATE), `syndic_insert_notifications` (INSERT for syndic role) |
| Realtime replication on `notifications` | ✅ Already in `supabase_realtime` publication — no setup needed |
| Row counts | 0 rows in all three tables — clean state |

> **No schema migration needed.** All three tables exist with correct columns, indexes, CHECK constraints, foreign keys, RLS policies, and Realtime replication. No `drizzle-kit generate` or `drizzle-kit migrate` required.

---

## Context7 Documentation Findings

| Library | Key API Patterns for Phase 4 |
|---|---|
| **@supabase/supabase-js (Realtime)** | `supabase.channel('channel-name').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'user_id=eq.<uuid>' }, (payload) => { ... }).subscribe()`. Unsubscribe: `await supabase.removeChannel(channel)`. Use the browser client from `src/utils/supabase/client.ts`. |
| **TanStack Query v5** | `useQueryClient()` returns the client instance. `queryClient.invalidateQueries({ queryKey: ['notifications'] })` for cache invalidation after Realtime events. Custom hooks wrap `useQuery` for reusable data fetching. Test with `renderHook` + `QueryClientProvider` wrapper. |
| **React Hook Form v7** | `Controller` component for controlled inputs (Select, multi-select). `useForm<T>({ resolver: zodResolver(schema) })`. `handleSubmit(onSubmit)` for form submission. |
| **shadcn/ui (canary)** | Multi-select owners: use `Command` + `Popover` pattern for searchable multi-select. Components: `Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`. Install: `pnpm dlx shadcn@canary add command popover checkbox`. Wrap with `Popover` for dropdown trigger behavior. |

---

## File Inventory

### New files to create (14)

| Path | Type |
|---|---|
| `src/lib/validations/meeting.ts` | Zod schema |
| `src/lib/db/queries/meetings.ts` | Drizzle query helpers |
| `src/lib/db/queries/notifications.ts` | Drizzle query helpers |
| `src/lib/actions/meetings.ts` | Server Actions |
| `src/lib/actions/notifications.ts` | Server Actions |
| `src/lib/email/templates/meeting-invitation.tsx` | React Email template |
| `src/app/api/meetings/route.ts` | API route for TanStack Query |
| `src/app/api/meetings/[id]/route.ts` | API route for single meeting |
| `src/components/features/meetings/meetings-table.tsx` | Client component |
| `src/components/features/meetings/meeting-panel.tsx` | Client component (Sheet) |
| `src/components/features/meetings/meeting-detail.tsx` | Client component |
| `src/components/features/notifications/notifications-list.tsx` | Client component |
| `src/lib/actions/__tests__/meetings.test.ts` | Vitest unit tests |
| `src/lib/actions/__tests__/notifications.test.ts` | Vitest unit tests |

### Existing files to modify (5)

| Path | Change |
|---|---|
| `src/hooks/use-notifications-realtime.ts` | Replace stub with real Supabase Realtime subscription + TanStack Query cache invalidation |
| `src/app/(syndic)/dashboard/meetings/page.tsx` | Replace placeholder with real Server Component rendering `<MeetingsTable />` |
| `src/app/(syndic)/dashboard/meetings/[id]/page.tsx` | Replace placeholder with meeting detail Server Component |
| `src/app/(owner)/notifications/page.tsx` | Replace placeholder with real notifications list |
| `src/app/(owner)/layout.tsx` | Add client wrapper component that calls `useNotificationsRealtime()` |

### No schema migration needed

The `meetings`, `meeting_invitations`, and `notifications` tables are already defined in `src/lib/db/schema.ts` with all columns, indexes, CHECK constraints, foreign keys, and Drizzle relations. Supabase MCP confirms all three tables exist with correct structure and RLS policies. **No `drizzle-kit generate` or `drizzle-kit migrate` required.**

---

## Step 1: Zod Validation Schema

**Files to create:**
- `src/lib/validations/meeting.ts`

**Implementation notes:**
- Reference: `.github/instructions/validations.instructions.md`
- **`meetingSchema`** — fields:
  - `title` (string, min 1)
  - `description` (string, optional)
  - `meetingDate` (string, min 1 — ISO date string)
  - `startTime` (string, min 1 — HH:MM format)
  - `endTime` (string, min 1 — HH:MM format)
  - `location` (string, min 1)
  - `ownerIds` (array of string UUIDs, min 1 — the invited owners)
- Add a Zod `.refine()` to validate `endTime > startTime`
- Enum values match the DB CHECK constraints: status is set server-side (not in the form schema)
- Export `type MeetingFormValues = z.infer<typeof meetingSchema>`
- **`respondInvitationSchema`** — fields:
  - `invitationId` (string, uuid)
  - `response` (enum: `'accepted'`, `'declined'`)
- Export `type RespondInvitationValues = z.infer<typeof respondInvitationSchema>`

**Supabase MCP action:** None

**Verification:**
- TypeScript compiles with no errors
- Time validation: `endTime > startTime` refine works correctly

---

## Step 2: Drizzle Query Helpers (Meetings)

**Files to create:**
- `src/lib/db/queries/meetings.ts`

**Implementation notes:**
- Reference: `.github/instructions/drizzle.instructions.md`
- All queries filter `deleted_at IS NULL`

**Queries:**

1. **`getMeetings(syndicId: string)`** — list all meetings for the syndic
   - `SELECT meetings.*, COUNT(mi.id) AS total_invitations, COUNT(CASE WHEN mi.status = 'accepted' THEN 1 END) AS accepted_count, COUNT(CASE WHEN mi.status = 'declined' THEN 1 END) AS declined_count`
   - `LEFT JOIN meeting_invitations mi ON mi.meeting_id = meetings.id`
   - `WHERE meetings.syndic_id = $syndicId AND meetings.deleted_at IS NULL`
   - `GROUP BY meetings.id`
   - `ORDER BY meetings.meeting_date DESC`
   - Use Drizzle `sql` template for aggregate columns

2. **`getMeetingById(id: string)`** — single meeting with full details
   - Same aggregate pattern as above, filtered by `meetings.id`
   - Also return the invitation list: separate query on `meeting_invitations` joined with `owners` and `users` to get owner name, email, and invitation status
   - Returns `{ meeting, invitations: Array<{ id, ownerId, ownerName, ownerEmail, status, respondedAt }> }`

3. **`getMeetingsForOwner(ownerId: string)`** — meetings the owner is invited to
   - `JOIN meeting_invitations ON meeting_invitations.meeting_id = meetings.id`
   - `WHERE meeting_invitations.owner_id = $ownerId AND meetings.deleted_at IS NULL`
   - Returns meetings with the owner's invitation status

4. **`getUpcomingMeetings(syndicId: string, limit?: number)`** — scheduled meetings with future dates
   - `WHERE meetings.status = 'scheduled' AND meetings.meeting_date >= CURRENT_DATE AND meetings.deleted_at IS NULL`
   - `ORDER BY meetings.meeting_date ASC`
   - `LIMIT $limit` (default 5)
   - For the dashboard overview card

**Supabase MCP action:** None

**Verification:**
- TypeScript compiles
- Manually test with Drizzle Studio after creating a meeting via Step 5

---

## Step 3: Drizzle Query Helpers (Notifications)

**Files to create:**
- `src/lib/db/queries/notifications.ts`

**Implementation notes:**
- Reference: `.github/instructions/drizzle.instructions.md`

**Queries:**

1. **`getNotifications(userId: string)`** — all notifications for a user
   - `SELECT * FROM notifications WHERE user_id = $userId ORDER BY created_at DESC`
   - No `deleted_at` column on notifications — they are never deleted (immutable-style)

2. **`getUnreadCount(userId: string)`** — count of unread notifications
   - `SELECT COUNT(*) FROM notifications WHERE user_id = $userId AND is_read = false`
   - Returns a number for the badge

3. **`markAsRead(notificationId: string, userId: string)`** — mark a single notification as read
   - `UPDATE notifications SET is_read = true, updated_at = NOW() WHERE id = $notificationId AND user_id = $userId`
   - The `userId` filter prevents cross-user updates

4. **`markAllAsRead(userId: string)`** — mark all unread notifications as read
   - `UPDATE notifications SET is_read = true, updated_at = NOW() WHERE user_id = $userId AND is_read = false`

**Supabase MCP action:** None

**Verification:**
- TypeScript compiles

---

## Step 4: API Routes

**Files to create:**
- `src/app/api/meetings/route.ts`
- `src/app/api/meetings/[id]/route.ts`

**Implementation notes:**
- Follow the exact pattern from `src/app/api/apartments/route.ts`:
  - Authenticate via `createClient()` + `getSession()`
  - Return `401` if no session
  - Scope data to the authenticated user

**`/api/meetings` GET:**
- If role is `syndic`: call `getMeetings(syndicId)` — returns all meetings for the syndic
- If role is `proprietaire`: look up the owner record via `user_id`, then call `getMeetingsForOwner(ownerId)` — returns only invited meetings
- Return JSON array

**`/api/meetings/[id]` GET:**
- Call `getMeetingById(id)`
- Verify the meeting belongs to the syndic (or the owner is invited)
- Return `{ meeting, invitations }` — invitations array includes owner names, emails, statuses

**No notifications API route needed.** Notifications are fetched via TanStack Query using the Drizzle query helpers directly from Server Components or through a new API route. Decision: **add a lightweight `/api/notifications` route** so the Realtime hook can refetch via TanStack Query:

**Files to also create:**
- `src/app/api/notifications/route.ts`

**`/api/notifications` GET:**
- Authenticate → get `session.user.id`
- Call `getNotifications(userId)` and `getUnreadCount(userId)`
- Return `{ notifications, unreadCount }`

> **Updated file count:** 15 new files (added `/api/notifications/route.ts`)

**Supabase MCP action:** None

**Verification:**
- `GET /api/meetings` returns `200` with empty array
- `GET /api/notifications` returns `200` with `{ notifications: [], unreadCount: 0 }`

---

## Step 5: Server Actions (Meetings)

**Files to create:**
- `src/lib/actions/meetings.ts`

**Implementation notes:**
- Reference: `.github/instructions/server-actions.instructions.md`
- `"use server"` directive at top
- Return shape: `{ success: true; data: T } | { success: false; error: string }` — never throw

**Actions:**

1. **`createMeeting(values: unknown)`**
   - Validate with `meetingSchema.safeParse(values)`
   - Authenticate + authorize (role = syndic)
   - Get building → verify all `ownerIds` belong to the syndic's building (query owners by building_id)
   - Insert meeting into `meetings` with `syndicId = session.user.id`, `status = 'scheduled'`
   - Insert invitation rows into `meeting_invitations` (one per ownerId, `status = 'invited'`)
   - **For each invited owner:** insert a notification into `notifications`:
     - `userId` = the owner's `user_id` (from `owners.user_id`)
     - `type` = `'meeting_invitation'`
     - `title` = `'Invitation à une réunion'`
     - `message` = `'Vous êtes invité(e) à la réunion "{meetingTitle}" le {meetingDate}'`
     - `metadata` = `{ meetingId, invitationId }`
   - **For each invited owner:** send email via shared helper:
     - `sendEmail({ to: ownerEmail, subject: 'Invitation — {meetingTitle}', react: <MeetingInvitationEmail ... /> })`
   - **Audit log** (outside any transaction): `{ action: 'CREATE_MEETING', entityType: 'meetings', entityId: newMeeting.id }`
   - Return `{ success: true, data: { id: newMeeting.id } }`
   - **Important:** The meeting insert + invitation inserts + notification inserts should all be inside a single `db.transaction()`. Email sending and audit log remain outside the transaction.

2. **`cancelMeeting(id: string)`**
   - Authenticate + authorize (role = syndic)
   - Verify meeting belongs to syndic and is not already cancelled
   - `UPDATE meetings SET status = 'cancelled', updated_at = NOW() WHERE id = $id`
   - Audit log: `{ action: 'CANCEL_MEETING', entityType: 'meetings', entityId: id }`
   - Return `{ success: true, data: { id } }`

3. **`deleteMeeting(id: string)`**
   - Soft-delete: `UPDATE meetings SET deleted_at = NOW(), updated_at = NOW() WHERE id = $id`
   - Verify meeting belongs to syndic before deleting
   - Audit log: `{ action: 'DELETE_MEETING', entityType: 'meetings', entityId: id }`

**Supabase MCP action:** None

**Verification:**
- Actions compile without errors
- Tested via Vitest in Step 12

---

## Step 6: Server Actions (Notifications & Invitation Response)

**Files to create:**
- `src/lib/actions/notifications.ts`

**Implementation notes:**
- Reference: `.github/instructions/server-actions.instructions.md`
- `"use server"` directive at top

**Actions:**

1. **`respondToInvitation(values: unknown)`**
   - Validate with `respondInvitationSchema.safeParse(values)`
   - Authenticate + authorize (role = proprietaire)
   - Look up the owner record where `user_id = session.user.id`
   - Load the invitation → verify `invitation.ownerId === owner.id` and `invitation.status === 'invited'` (can only respond once)
   - Update invitation: `SET status = response, responded_at = NOW(), updated_at = NOW()`
   - **Only `'invited'` → `'accepted'` or `'invited'` → `'declined'` transitions are valid.** Re-responses are rejected with an error.
   - **No notification or email is sent** for accept/decline — only an audit log
   - Audit log: `{ action: 'RESPOND_INVITATION', entityType: 'meeting_invitations', entityId: invitation.id, metadata: { response } }`
   - Return `{ success: true, data: { id: invitation.id } }`

2. **`markNotificationRead(id: string)`**
   - Authenticate (any role, but typically proprietaire)
   - Call `markAsRead(id, session.user.id)` — the userId filter in the query helper prevents cross-user tampering
   - Return `{ success: true, data: { id } }`

3. **`markAllNotificationsRead()`**
   - Authenticate
   - Call `markAllAsRead(session.user.id)`
   - Return `{ success: true, data: null }`

**Supabase MCP action:** None

**Verification:**
- Actions compile without errors
- Tested via Vitest in Step 12

---

## Step 7: Meeting Invitation Email Template

**Files to create:**
- `src/lib/email/templates/meeting-invitation.tsx`

**Implementation notes:**
- Reference: existing `src/lib/email/templates/welcome.tsx` and `payment-reminder.tsx` for style patterns
- Uses `@react-email/components`: `Html`, `Body`, `Container`, `Heading`, `Text`, `Hr`, `Section`, `Button`

**Props interface:**
```typescript
interface MeetingInvitationEmailProps {
  ownerName: string;       // "Jean Dupont"
  meetingTitle: string;    // "Assemblée Générale Q2 2026"
  meetingDate: string;     // "2026-06-15"
  startTime: string;       // "14:00"
  endTime: string;         // "16:00"
  location: string;        // "Salle de réunion, Résidence les Oliviers"
  description?: string;    // Optional meeting description
  buildingName: string;    // "Résidence les Oliviers"
  portalUrl: string;       // URL to the owner portal notifications page
}
```

**Content (French):**
- Greeting: "Bonjour {ownerName},"
- Body: "Vous êtes invité(e) à la réunion **{meetingTitle}**."
- Details section: date, time (start–end), location, description (if provided)
- CTA button: "Consulter mes invitations" → links to portal notifications page
- Footer: building name, contact info

**Supabase MCP action:** None

**Verification:**
- Template compiles
- Render preview via `@react-email/components` dev server (optional)

---

## Step 8: Supabase Realtime Hook (Replace Stub)

**Files to modify:**
- `src/hooks/use-notifications-realtime.ts`

**Implementation notes:**
- Reference: Context7 Supabase JS Realtime docs
- Reference: Context7 TanStack Query v5 docs
- This is a `"use client"` hook — uses browser APIs (`useEffect`, `useState`)
- Import `createClient` from `src/utils/supabase/client.ts` (the browser client factory)
- Import `useQueryClient` from `@tanstack/react-query`

**Implementation:**
```
"use client"

export function useNotificationsRealtime(userId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Invalidate TanStack Query cache → triggers refetch
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
```

**Key decisions:**
- The hook does NOT manage its own state — it only invalidates the TanStack Query cache
- When `notifications` query is invalidated, the `useQuery` in `NotificationsList` (Step 11) automatically refetches
- The `userId` is passed as a prop from the layout (obtained server-side from the session, passed down via a client wrapper component)
- The hook listens for `INSERT` events only (new notifications). Updates (mark-as-read) are handled optimistically
- The old stub return type `{ notifications, unreadCount }` is replaced — this hook returns `void`

**Supabase MCP action:** None (Realtime replication already confirmed enabled)

**Verification:**
- TypeScript compiles
- Can be tested manually: create a meeting → notification insert triggers Realtime → TanStack Query cache invalidates → notifications list updates

---

## Step 9: Install shadcn UI Components (if needed)

**Implementation notes:**
- Reference: `.github/skills/shadcn-component/SKILL.md`
- Check which shadcn components are already installed. From Phases 2–3: `sheet`, `alert-dialog`, `table`, `input`, `label`, `button`, `card`, `select`, `sonner`, `dropdown-menu`, `separator`, `skeleton`, `avatar`, `tooltip`, `breadcrumb`, `collapsible`, `sidebar`
- Phase 4 needs:
  - **`command`** — for searchable multi-select owner picker in the meeting creation form
  - **`popover`** — to wrap the Command component as a dropdown
  - **`checkbox`** — for selecting/deselecting owners in the multi-select
  - **`badge`** — for invitation status badges (invited/accepted/declined) and meeting status badges (scheduled/completed/cancelled)
- Check if any of these already exist before installing

**Commands:**
```bash
pnpm dlx shadcn@canary add command popover checkbox badge
```

**Verification:**
- `src/components/ui/command.tsx`, `popover.tsx`, `checkbox.tsx`, `badge.tsx` exist after install

---

## Step 10: Meetings List Page UI (Syndic)

**Files to create:**
- `src/components/features/meetings/meetings-table.tsx`
- `src/components/features/meetings/meeting-panel.tsx`

**Files to modify:**
- `src/app/(syndic)/dashboard/meetings/page.tsx`

**Implementation notes:**
- Reference: `.github/skills/shadcn-component/SKILL.md` for Sheet, Table patterns
- Reference: `.github/instructions/frontend-components.instructions.md` for design tokens

### `meetings-table.tsx` (Client Component)
- `"use client"` — uses TanStack Query, event handlers
- Fetch meetings via `useQuery({ queryKey: ['meetings'], queryFn: () => fetch('/api/meetings').then(r => r.json()) })`
- Columns: title, date, time (start–end), location, status badge, invitations summary (e.g., "3/5 accepted"), actions
- Status badges: `scheduled` (blue/default), `completed` (green/success), `cancelled` (red/destructive) — use `<Badge variant="...">` from shadcn
- Row actions menu (dropdown): "Voir détails" (navigate to `/dashboard/meetings/[id]`), "Annuler" (cancel meeting — only if `scheduled`), "Supprimer" (soft-delete)
- "Cancel" calls `cancelMeeting(meetingId)` → toast success/error → `invalidateQueries({ queryKey: ['meetings'] })`
- Header row: "Nouvelle réunion" button → opens `meeting-panel.tsx`

### `meeting-panel.tsx` (Client Component)
- `"use client"` — Sheet pattern from `.github/skills/shadcn-component/SKILL.md`
- React Hook Form + zodResolver with `meetingSchema`
- Fields:
  - `title` (Input)
  - `description` (Input, optional)
  - `meetingDate` (Input type date)
  - `startTime` (Input type time)
  - `endTime` (Input type time)
  - `location` (Input)
  - `ownerIds` (multi-select using Command + Popover + Checkbox pattern)
    - Fetch owner list from `/api/owners` (existing Phase 2 API)
    - Display owner names with checkboxes in a searchable dropdown
    - Show selected owners as badges below the input
    - Controlled via React Hook Form `Controller`
- On submit: call `createMeeting(values)` → toast → `invalidateQueries({ queryKey: ['meetings'] })` → close sheet + reset form
- Labels in French

### `page.tsx` (Server Component)
- Replace placeholder content
- Render `<MeetingsTable />` — data fetching happens client-side via TanStack Query
- Page remains a Server Component (no `"use client"`)

**Supabase MCP action:** None

**Verification:**
- Page renders without errors
- Can create a meeting with multiple invitees
- Meeting appears in table with correct status badge and invitation counts
- Can cancel a scheduled meeting

---

## Step 11: Meeting Detail Page UI (Syndic)

**Files to create:**
- `src/components/features/meetings/meeting-detail.tsx`

**Files to modify:**
- `src/app/(syndic)/dashboard/meetings/[id]/page.tsx`

**Implementation notes:**
- Reference: `.github/instructions/frontend-components.instructions.md`

### `meeting-detail.tsx` (Client Component)
- `"use client"` — uses TanStack Query
- Fetch meeting data via `useQuery({ queryKey: ['meetings', id], queryFn: () => fetch('/api/meetings/' + id).then(r => r.json()) })`
- Layout:
  - **Header section:** meeting title, date, time, location, status badge, description
  - **Attendee table:** columns: owner name, email, invitation status badge, responded date
    - Status badges: `invited` (yellow/warning), `accepted` (green/success), `declined` (red/destructive)
  - **Summary stats:** total invited, accepted count, declined count, pending count
  - **Actions:** "Annuler la réunion" button (only if status is `scheduled`), "Retour" link to `/dashboard/meetings`

### `page.tsx` (Server Component)
- Replace placeholder
- `await params` to get meeting `id` (Next.js 16 async params)
- Render `<MeetingDetail id={id} />` — data fetching client-side
- Page remains a Server Component

**Supabase MCP action:** None

**Verification:**
- Page renders meeting details and attendee table
- Status badges are correct for each invitation
- Cancel button works and updates the meeting status

---

## Step 12: Owner Notifications Page & Realtime Integration

**Files to create:**
- `src/components/features/notifications/notifications-list.tsx`

**Files to modify:**
- `src/app/(owner)/notifications/page.tsx`
- `src/app/(owner)/layout.tsx`

**Implementation notes:**

### `notifications-list.tsx` (Client Component)
- `"use client"` — uses TanStack Query, event handlers
- Fetch via `useQuery({ queryKey: ['notifications'], queryFn: () => fetch('/api/notifications').then(r => r.json()) })`
- Display a list of notification cards:
  - Icon based on `type` (Bell for meeting_invitation, CreditCard for payment types)
  - Title, message, date (formatted with date-fns `formatDistanceToNow` in French locale)
  - Unread indicator (dot or highlighted background for `is_read = false`)
  - Click handler: mark as read via `markNotificationRead(id)` → optimistic update with `queryClient.setQueryData`
  - For `meeting_invitation` type: show "Accepter" / "Décliner" buttons
    - Buttons call `respondToInvitation({ invitationId, response })` — the `invitationId` is stored in `metadata.invitationId`
    - After response: invalidate `['notifications']` and show toast
- **"Tout marquer comme lu"** button at the top: calls `markAllNotificationsRead()` → invalidate cache
- Empty state: "Aucune notification" message

### `page.tsx` (Server Component)
- Replace placeholder
- Render `<NotificationsList />`
- Page remains a Server Component

### `layout.tsx` Integration
- The owner layout is currently a Server Component. The Realtime hook requires a Client Component.
- **Solution:** Create a thin client wrapper component:
  ```
  // Inside layout.tsx or as a separate file
  "use client"
  function RealtimeProvider({ userId }: { userId: string }) {
    useNotificationsRealtime(userId);
    return null; // No UI — just subscribes to Realtime
  }
  ```
- In `layout.tsx`: get the session server-side, extract `session.user.id`, pass it to `<RealtimeProvider userId={...} />`
- This keeps the layout as a Server Component while enabling the Realtime subscription
- The hook is called **once** at the layout level — it runs for all owner pages

### Notification Badge in Owner Sidebar
- Modify `src/components/layout/owner-sidebar.tsx`:
  - The sidebar is already a `"use client"` component
  - Add a `useQuery({ queryKey: ['notifications'], ... })` to get `unreadCount` from the same cache
  - Display a small red badge next to the "Notifications" nav item when `unreadCount > 0`
  - The badge updates automatically when the Realtime hook invalidates the `['notifications']` query

**Supabase MCP action:** None

**Verification:**
- Notifications page renders correctly
- Creating a meeting with an invited owner → notification appears in owner's notifications list (via Realtime, no page refresh needed)
- Accept/Decline buttons work and update the invitation status
- Unread badge appears in the sidebar
- "Mark all as read" clears the badge

---

## Step 13: Vitest Unit Tests

**Files to create:**
- `src/lib/actions/__tests__/meetings.test.ts`
- `src/lib/actions/__tests__/notifications.test.ts`

**Implementation notes:**
- Reference: `.github/instructions/tests.instructions.md`
- Follow the exact mocking pattern from existing Phase 2–3 tests in `src/lib/actions/__tests__/`
- Mock `@/lib/db` with `vi.mock()` — mock `db.select()`, `db.insert()`, `db.update()`, `db.transaction()`
- Mock `@/utils/supabase/server` — return a fake session
- Mock `@/lib/email/send-email` for email tests

### `meetings.test.ts` — test cases:
1. **createMeeting — valid input** → inserts meeting + invitations + notifications inside transaction, sends emails outside, inserts audit log with `CREATE_MEETING`
2. **createMeeting — invalid input** → returns `{ success: false, error }` (Zod validation)
3. **createMeeting — unauthenticated** → returns `{ success: false, error: 'Non authentifié' }`
4. **createMeeting — ownerIds not in building** → returns `{ success: false, error }` (authorization failure)
5. **createMeeting — endTime before startTime** → returns `{ success: false, error }` (Zod refine)
6. **cancelMeeting — valid** → updates status to `'cancelled'`, inserts audit log with `CANCEL_MEETING`
7. **cancelMeeting — already cancelled** → returns `{ success: false, error }` (idempotent rejection)
8. **deleteMeeting — soft-delete** → sets `deleted_at`, inserts audit log with `DELETE_MEETING`

### `notifications.test.ts` — test cases:
1. **respondToInvitation — accept** → updates status to `'accepted'`, sets `responded_at`, inserts audit log with `RESPOND_INVITATION`
2. **respondToInvitation — decline** → updates status to `'declined'`, sets `responded_at`, inserts audit log with `RESPOND_INVITATION`
3. **respondToInvitation — already responded** → returns `{ success: false, error }` (no double-response)
4. **respondToInvitation — wrong owner** → returns `{ success: false, error }` (authorization failure)
5. **markNotificationRead — valid** → updates `is_read = true`
6. **markAllNotificationsRead — valid** → updates all unread notifications

**Supabase MCP action:** None

**Verification:**
- `pnpm vitest run` — all new tests pass alongside existing 45 tests
- Target: 55+ total tests after Phase 4

---

## Step 14: Final Build Verification

**Implementation notes:**
- Run `pnpm build` and confirm all routes compile without errors
- Run `pnpm vitest run` and confirm all tests pass
- Manually verify the full workflow:
  1. Ensure test owners exist (created via Phase 2 UI)
  2. Create a meeting via `/dashboard/meetings` → select multiple owners → submit
  3. Verify meeting appears in the meetings table with "scheduled" status and invitation counts
  4. Navigate to meeting detail page → verify attendee table shows all invitees with "invited" status
  5. Log in as an owner → verify notification appears in `/notifications` (via Realtime — no page refresh)
  6. Verify unread badge appears in the owner sidebar
  7. Click "Accepter" on the invitation → verify status updates to "accepted"
  8. Log back in as syndic → verify attendee table shows updated status
  9. Cancel a meeting → verify status changes to "cancelled"
  10. Soft-delete a meeting → verify it disappears from the list

**Supabase MCP action:** After all tests pass, confirm DB state:
```sql
SELECT count(*) FROM meetings;
SELECT count(*) FROM meeting_invitations;
SELECT count(*) FROM notifications;
SELECT count(*) FROM audit_logs WHERE action IN ('CREATE_MEETING', 'RESPOND_INVITATION', 'CANCEL_MEETING', 'DELETE_MEETING');
```

**Verification:**
- `pnpm build` exits with code 0
- `pnpm vitest run` exits with code 0 and all tests pass
- All existing routes + new routes compile
- Manual smoke test passes all 10 workflow steps above

---

## Implementation Order Summary

| Order | Step | Dependencies |
|---|---|---|
| 1 | Zod schema (`meeting.ts`) | None |
| 2 | Query helpers — meetings (`queries/meetings.ts`) | Schema |
| 3 | Query helpers — notifications (`queries/notifications.ts`) | Schema |
| 4 | API routes (`/api/meetings`, `/api/meetings/[id]`, `/api/notifications`) | Query helpers |
| 5 | Server Actions — meetings (`actions/meetings.ts`) | Schemas, query helpers |
| 6 | Server Actions — notifications (`actions/notifications.ts`) | Schemas, query helpers |
| 7 | Email template (`meeting-invitation.tsx`) | None (used by Step 5) |
| 8 | Realtime hook (`use-notifications-realtime.ts`) | None (used by Step 12) |
| 9 | Install shadcn components | None |
| 10 | Meetings list page UI | Steps 4, 5, 7, 9 |
| 11 | Meeting detail page UI | Steps 4, 9 |
| 12 | Owner notifications page + Realtime integration | Steps 4, 6, 8, 9 |
| 13 | Vitest unit tests | Steps 5, 6 |
| 14 | Final build verification | All steps |

> **Parallelizable:** Steps 1–3 can run in parallel. Steps 7–9 can run in parallel. Steps 10–12 can run in parallel after their dependencies complete.

---

## Risk Notes

1. **Realtime requires authenticated browser client.** The Supabase Realtime subscription uses the browser client from `src/utils/supabase/client.ts`. The owner must be logged in for the channel subscription to authenticate against RLS. If the session expires, the channel will stop receiving events — this is acceptable for MVP.
2. **Email sending in createMeeting.** For a meeting with many invitees, sending N emails synchronously could be slow. For MVP, send sequentially. In production, consider a background job queue (Phase 6+).
3. **Notification insert via Drizzle (bypasses RLS).** Server Actions use the Drizzle `db` instance (direct connection string), which bypasses RLS. This is correct — the syndic's Server Action inserts notifications for owners. The RLS policy on `notifications` allows `syndic_insert_notifications`, but this would only apply if using the Supabase client. Since we use Drizzle for all server-side writes, RLS is only enforced on the Realtime subscription (read) side. This is the established pattern from Phases 2–3.
4. **Multi-select performance.** The owner picker in the meeting creation form loads all owners for the building. For buildings with many owners (100+), the Command component should handle this well due to built-in virtualization, but test with realistic data.
5. **Audit identifiers.** Only two new audit actions: `CREATE_MEETING` and `RESPOND_INVITATION`. The `CANCEL_MEETING` and `DELETE_MEETING` actions follow the same pattern as existing `DELETE_CHARGE` etc. These are audit log `action` values — no new CHECK constraints or schema changes needed since `action` has no CHECK.
6. **Owner `user_id` lookup.** When inserting notifications, we need the owner's `user_id` (not `owner.id`). The `owners` table has a `user_id` FK to `users.id`. Query this in the `createMeeting` action when building notification rows.
