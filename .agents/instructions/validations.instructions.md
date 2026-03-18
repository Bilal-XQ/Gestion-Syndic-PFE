---
applyTo: "src/lib/validations/**"
---

# Zod Validation Schemas — Conventions

## One schema per domain, shared between client and server

Every form has exactly one Zod schema in `src/lib/validations/<domain>.ts`. The same exported instance is used by:

- React Hook Form via `zodResolver` from `@hookform/resolvers/zod`
- The corresponding Server Action via `schema.safeParse(input)`

Never create a duplicate or "server-only" variant of a schema. Diverged schemas cause validation errors that appear on one surface but not the other.

## Zod v4 API (installed version: 4.3.6)

Use Zod v4 imports and API. Key differences from v3 that Copilot often gets wrong:

```typescript
import { z } from 'zod'

// v4 — correct
const schema = z.object({ ... })
type FormValues = z.infer<typeof schema>

// Error handling in v4
const result = schema.safeParse(input)
if (!result.success) {
  result.error.issues  // use .issues not .errors in v4
}
```

## Standard schema pattern

```typescript
// src/lib/validations/owner.ts
import { z } from "zod";

export const ownerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  apartmentId: z.string().uuid("Invalid apartment"),
  ownershipDate: z.string().date("Invalid date"),
});

export type OwnerFormValues = z.infer<typeof ownerSchema>;
```

## Enum values must match the database check constraints exactly

Always align enum values with the database schema in `src/lib/db/schema.ts`:

```typescript
// Charge categories — must match CHECK constraint in schema.ts
category: z.enum(['electricity', 'water', 'maintenance', 'repair', 'other']),

// Payment methods — must match CHECK constraint
method: z.enum(['bank_transfer', 'check', 'cash']),
```

## Partial payment validation

The payment schema must allow amounts greater than 0 and not exceeding the remaining balance. The remaining balance is not stored — pass it as a context argument or validate the ceiling in the Server Action after fetching the current state, not in the schema itself.

## Never validate derived values in schemas

Do not add `amountPaid`, `remainingAmount`, or `status` fields to any schema. These are computed at query time, never submitted as form data.
