# AI Lessons — Known Failure Patterns

This file records mistakes caught during development. Read it at the start of every session before touching any code. Add entries whenever a mistake is caught — one entry per incident, most recent first.

---

## How to add an entry

```
## [YYYY-MM-DD] Short description of the mistake
**Trigger:** What prompt or task caused it
**Mistake:** What the AI generated that was wrong
**Correct pattern:** What the right code or approach looks like
**Rule updated:** Which instruction file (if any) was updated to prevent recurrence
```

---

## Seeded: Known failure patterns for this stack

### [2026-03-03] Zod v4 — using `.errors` instead of `.issues`

**Trigger:** Any use of `schema.safeParse(input).error`
**Mistake:** Copilot generates `result.error.errors` (Zod v3 API).
**Correct pattern:**
```typescript
const result = schema.safeParse(input)
if (!result.success) {
  const message = result.error.issues[0].message // .issues in v4, not .errors
}
```
**Rule updated:** `validations.instructions.md`

---

### [2026-03-03] TanStack Query v5 — removed `onSuccess` / `onError` from `useQuery`

**Trigger:** Any `useQuery` call with callback options.
**Mistake:** Copilot adds `onSuccess: (data) => { ... }` or `onError: (err) => { ... }` to `useQuery` options. These were removed in v5.
**Correct pattern:**
```typescript
// v5 — use useEffect to react to query state changes, or handle in mutations
const { data, isError, error } = useQuery({ queryKey: ['key'], queryFn: fetchFn })
// For side effects on success, use useMutation's onSuccess callback instead
```

---

### [2026-03-03] Next.js 16 — `cookies()` is now async

**Trigger:** Any Server Component or Server Action accessing cookies.
**Mistake:** Copilot generates `const cookieStore = cookies()` (synchronous — Next.js 14 API).
**Correct pattern:**
```typescript
import { cookies } from 'next/headers'
const cookieStore = await cookies() // async in Next.js 15+
```

---

### [2026-03-03] Supabase SSR — using deprecated `createServerComponentClient`

**Trigger:** Any Server Component needing a Supabase client.
**Mistake:** Copilot imports `createServerComponentClient` from `@supabase/auth-helpers-nextjs` — that package is deprecated.
**Correct pattern:**
```typescript
// Always import from the project utility — never from auth-helpers-nextjs
import { createServerClient } from '@/utils/supabase/server'
const supabase = await createServerClient()
```

---

### [2026-03-03] Drizzle — adding derived columns to schema

**Trigger:** "Add amount_paid to the charges table" or similar.
**Mistake:** Copilot adds `amountPaid: numeric('amount_paid')` to `charges` in `schema.ts`.
**Correct pattern:** These values do not exist as columns. They are always computed via SQL aggregation at query time in `src/lib/db/queries/charges.ts`. See `drizzle.instructions.md` for the correct query pattern.

---

### [2026-03-03] Server Actions — using `revalidatePath` for client-cached data

**Trigger:** Any mutating Server Action for data displayed in a TanStack Query-managed component.
**Mistake:** Copilot adds `revalidatePath('/dashboard/owners')` at the end of the action.
**Correct pattern:** Client components invalidate their own cache:
```typescript
// In the client component after calling the Server Action
await createOwner(formData)
queryClient.invalidateQueries({ queryKey: ['owners'] })
```
`revalidatePath` is only appropriate for purely server-rendered pages.

---

### [2026-03-03] Supabase client — instantiated inline in a component

**Trigger:** Any component needing to query the database.
**Mistake:** Copilot writes `const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, ...)` inline.
**Correct pattern:**
```typescript
import { createBrowserClient } from '@/utils/supabase/client'
// In Server Components:
import { createServerClient } from '@/utils/supabase/server'
```

---

### [2026-03-03] `"use client"` added unnecessarily to page files

**Trigger:** Any page that contains a form or interactive element.
**Mistake:** Copilot adds `"use client"` to the page file itself.
**Correct pattern:** The page is a Server Component. Extract the interactive form or table into a dedicated Client Component in `src/components/features/<domain>/`. Only the extracted component carries `"use client"`.

---

### [2026-03-03] Schema missing deleted_at on apartments table

**Trigger:** Planning apartment soft-delete in Phase 2
**Mistake:** Phase 1 schema omitted `deleted_at` from `apartments`, 
requiring a migration mid-phase.
**Correct pattern:** At plan time, cross-check every table against the 
PRD "Soft Deletes for Protected Entities" section. Any table that can be 
deleted by the syndic needs `deletedAt: timestamp('deleted_at')` in schema.ts.
**Rule updated:** None — process fix. Catch at plan review time, not implementation.
---
### [2026-03-03] Auth users not synced to public.users table

**Trigger:** Manually creating users in Supabase Dashboard or via admin.createUser()
**Mistake:** No automatic sync between auth.users and public.users — dashboard 
queries fail because buildings.syndic_id references a non-existent public.users row.
**Correct pattern:** A PostgreSQL trigger `handle_new_auth_user()` on AFTER INSERT 
on auth.users must exist. Created via Supabase MCP. Always verify this trigger 
exists at the start of any session that creates auth users.
**Rule updated:** None — add to Phase 1 checklist for future projects.


### [2026-03-03] Realtime hook requires thin client wrapper in Server Component layout

**Trigger:** Integrating useNotificationsRealtime into (owner)/layout.tsx
**Mistake:** Directly calling the hook in a Server Component layout, or adding 
"use client" to the entire layout file.
**Correct pattern:** Create a zero-UI client wrapper component (RealtimeProvider) 
that calls the hook. Import it into the Server Component layout and render it 
with userId as a prop. The layout stays a Server Component.
**Rule updated:** None — document as architecture pattern.

### [2026-03-03] IDOR vector in Server Actions that accept entity IDs from client

**Trigger:** createPayment accepting ownerId from client input for proprietaire callers
**Mistake:** Trusting client-submitted ownerId — a malicious owner could submit 
another owner's ID and record payments against their charges.
**Correct pattern:** For any proprietaire Server Action that involves an owner 
record, always resolve ownerId server-side from the JWT:
  const ownerRecord = await getOwnerByUserId(session.user.id)
  ownerId = ownerRecord.id  // never parsed.data.ownerId
Then cross-check: verify the target entity (charge, apartment, etc.) belongs 
to that owner before proceeding.
**Rule updated:** server-actions.instructions.md — add IDOR rule.

### [2026-03-03] RLS gap on buildings table — no proprietaire SELECT policy

**Trigger:** Phase 6 RLS audit — portal profile page reads building data
**Mistake:** buildings table was created with only a syndic ALL policy. 
No proprietaire SELECT policy was added, leaving a defense-in-depth gap 
even though the Drizzle db connection bypasses RLS.
**Correct pattern:** Every table that any role reads must have an explicit 
SELECT policy for that role, even if the application layer already enforces 
access. Use the ownership chain:
  owners.user_id → owners.apartment_id → apartments.building_id → buildings.id
**Rule updated:** None — add to Phase 1 RLS checklist for future projects.


*Add new entries above this line.*
