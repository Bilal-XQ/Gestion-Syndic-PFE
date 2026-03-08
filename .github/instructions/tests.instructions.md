---
applyTo: "**/*.test.ts,**/*.test.tsx,**/*.spec.ts"
---

# Vitest — Test Conventions

## Framework

Vitest only. Do not use Jest. Do not add `@jest/globals` imports.

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
```

## Required test coverage before MVP

These are non-negotiable. Each maps to a file:

| Behaviour                                                                  | Test file                                      |
| -------------------------------------------------------------------------- | ---------------------------------------------- |
| Login: valid syndic → redirects to `/dashboard`                            | `src/lib/actions/auth.test.ts`                 |
| Login: valid proprietaire → redirects to `/portal`                         | `src/lib/actions/auth.test.ts`                 |
| Login: invalid credentials → generic error, no role leak                   | `src/lib/actions/auth.test.ts`                 |
| Payment transaction: rollback produces no partial state                    | `src/lib/actions/payments.test.ts`             |
| Partial payment aggregation: SUM(payments) = amountPaid                    | `src/lib/db/queries/charges.test.ts`           |
| Zod schemas: invalid inputs rejected, valid accepted                       | `src/lib/validations/*.test.ts`                |
| Soft-delete filter: deleted owner absent from list query                   | `src/lib/db/queries/owners.test.ts`            |
| Meeting invitation response: status, responded_at, notification, audit log | `src/lib/actions/meetings.test.ts`             |
| Apartment status transition: owner assign → occupied; soft-delete → vacant | `src/lib/actions/apartments.test.ts`           |
| Realtime hook: INSERT on notifications → TanStack Query invalidation       | `src/hooks/use-notifications-realtime.test.ts` |
| PDF render: valid props → non-empty buffer, no throw                       | `src/lib/pdf/payment-notice.test.ts`           |

## Mocking Supabase

Mock the Supabase client at the module level. Never hit a real database in unit tests:

```typescript
vi.mock("@/utils/supabase/server", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            user: { id: "user-uuid", app_metadata: { user_role: "syndic" } },
          },
        },
      }),
    },
  })),
}));
```

## Mocking Drizzle transactions

Test rollback behaviour by having one step throw inside the transaction mock:

```typescript
vi.mock("@/lib/db", () => ({
  db: {
    transaction: vi.fn(async (fn) => {
      // Simulate rollback by throwing inside the callback
      throw new Error("DB error");
    }),
    insert: vi.fn(),
  },
}));
```

## Testing derived financial values

Aggregation tests operate on actual query helper functions with a mocked `db`. Assert the computed `amountPaid` and `remainingAmount` values against known payment fixtures — do not test that columns exist on the charges table (they must not exist).

## Structure

```typescript
describe('createPayment', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('inserts the payment and audit log on success', async () => { ... })
  it('rolls back and returns error on DB failure', async () => { ... })
  it('returns error when Zod validation fails', async () => { ... })
})
```
