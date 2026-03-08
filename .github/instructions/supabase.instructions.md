---
applyTo: "src/utils/supabase/**,middleware.ts,supabase/**"
---

# Supabase — Client Pattern, Auth, and RLS

## Single client pattern (never instantiate inline)

| Import from                        | Use in                                            |
| ---------------------------------- | ------------------------------------------------- |
| `src/utils/supabase/server.ts`     | Server Components, Server Actions, Route Handlers |
| `src/utils/supabase/client.ts`     | Client Components, Realtime hooks                 |
| `src/utils/supabase/middleware.ts` | `middleware.ts` only                              |

Creating a Supabase client anywhere else is forbidden. If a file needs the client and the correct utility does not exist yet, create the utility first.

## Role resolution from JWT — no DB query

The user's role is in the JWT, not in a database query:

```typescript
// Correct — reads from JWT claim, zero DB cost
const {
  data: { session },
} = await supabase.auth.getSession();
const role = session?.user?.app_metadata?.user_role; // 'syndic' | 'proprietaire'

// Forbidden — never query users table for role in middleware or auth checks
const { data: user } = await supabase.from("users").select("role").single();
```

## Middleware route protection

```typescript
// middleware.ts — role-based redirect, no DB query
const role = session?.user?.app_metadata?.user_role;

if (pathname.startsWith("/dashboard") && role !== "syndic") {
  return NextResponse.redirect(new URL("/login", request.url));
}
if (pathname.startsWith("/portal") && role !== "proprietaire") {
  return NextResponse.redirect(new URL("/login", request.url));
}
```

## Login rate limiting

Rate limiting executes in `middleware.ts` before any Next.js function. Uses `@upstash/ratelimit` with sliding window, 5 attempts per IP per minute. A blocked request returns HTTP 429 immediately — it never reaches the Server Action.

## RLS policy pattern

Every table with user-scoped data must have RLS enabled. Policies use JWT claims directly:

```sql
-- Proprietaire reads only their own notifications
CREATE POLICY "proprietaire_read_own_notifications"
ON notifications FOR SELECT
USING (
  auth.jwt() ->> 'user_role' = 'proprietaire'
  AND auth.uid() = user_id
);

-- Syndic reads all records in their building
CREATE POLICY "syndic_read_charges"
ON charges FOR SELECT
USING (auth.jwt() ->> 'user_role' = 'syndic');
```

Never rely on application-level filtering as a substitute for RLS. Both must be present.

## Custom Access Token Hook

The JWT `user_role` claim is injected by a PostgreSQL function registered under Supabase Authentication → Hooks (Custom Access Token Hook). The function reads `role` from `public.users` where `id = auth.uid()` and writes it to `app_metadata`. This runs once at token issuance — not on every request.

Do not attempt to replicate this in application code. Do not add a `user_role` field to the sign-in call. The hook handles it.

## Realtime — browser client only

Supabase Realtime subscriptions use the **browser client** (`src/utils/supabase/client.ts`) exclusively. Server Components never subscribe to Realtime channels. The subscription lifecycle is managed in `src/hooks/use-notifications-realtime.ts` and called once from `(owner)/layout.tsx`.
