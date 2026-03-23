---
applyTo: "src/lib/actions/**"
---

# Server Actions — Conventions and Patterns

## File structure

One file per domain: `auth.ts`, `owners.ts`, `apartments.ts`, `charges.ts`, `payments.ts`, `meetings.ts`, `notifications.ts`, `settings.ts`. All begin with `"use server"`.

## Standard return shape

Every action returns a discriminated union. Never throw — catch and return the error shape:

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

## Required sequence for every mutating action

1. **Validate input** using the shared Zod schema from `src/lib/validations/<domain>.ts`:
   ```typescript
   const parsed = domainSchema.safeParse(input);
   if (!parsed.success) {
     return { success: false, error: parsed.error.issues[0].message }; // Zod v4: .issues not .errors
   }
   ```
2. **Authenticate** using the server Supabase client from `src/utils/supabase/server.ts`. Read `user_role` from `session.user.app_metadata.user_role` — no extra DB query:
   ```typescript
   const supabase = await createServerClient();
   const {
     data: { session },
   } = await supabase.auth.getSession();
   if (!session) return { success: false, error: "Unauthenticated" };
   ```
3. **Execute the mutation** (wrap in `db.transaction` for any write to `payments`).
4. **Insert the audit log** using `db` (not `tx`) so the record persists even if a transaction rolls back:
   ```typescript
   await db.insert(auditLogs).values({
     userId: session.user.id,
     action: "CREATE_PAYMENT",
     entityType: "payments",
     entityId: newPayment.id,
   });
   ```
5. **Return** `{ success: true, data: result }`.

## Audit log action identifiers

Use exactly these strings — no variations:

`CREATE_OWNER` · `UPDATE_OWNER` · `DELETE_OWNER`
`CREATE_APARTMENT` · `UPDATE_APARTMENT` · `DELETE_APARTMENT`
`CREATE_CHARGE` · `DELETE_CHARGE` · `CREATE_PAYMENT`
`SEND_REMINDER` · `CREATE_MEETING` · `RESPOND_INVITATION` · `UPDATE_BUILDING`

## Apartment status transitions

The owner management actions (`owners.ts`) are responsible for updating `apartments.status`. This never happens in a standalone operation or a separate action:

- Assigning an owner → `apartments.status = 'occupied'`
- Soft-deleting or reassigning an owner → `apartments.status = 'vacant'`

Both transitions execute inside the same operation as the owner mutation.

## Sending notifications and emails

Supabase Realtime delivers `INSERT` events on `notifications` to the client. Server Actions insert the notification row; the client reacts via the `useNotificationsRealtime` hook. Never push to the client directly from a Server Action.

Emails are sent from Server Actions only (via the shared `sendEmail` helper). Never send email from a Client Component or a route handler used as a proxy.

## Cache invalidation

Do not call `revalidatePath` as the primary cache invalidation strategy for components that use TanStack Query. Client components call `queryClient.invalidateQueries` on the relevant query key after a successful action. `revalidatePath` is acceptable only for purely server-rendered pages with no client cache.
