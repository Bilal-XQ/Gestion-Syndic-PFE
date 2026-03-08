---
applyTo: "src/lib/db/**"
---

# Drizzle ORM — Schema, Queries, and Migrations

## Schema conventions (`src/lib/db/schema.ts`)

All table definitions live in a single file. Use these imports only:

```typescript
import {
  pgTable,
  uuid,
  text,
  numeric,
  integer,
  boolean,
  timestamp,
  date,
  time,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
```

Every table includes:

```typescript
createdAt: timestamp('created_at').notNull().defaultNow(),
updatedAt: timestamp('updated_at').notNull().defaultNow(),
```

Every foreign key column has a matching `index()` in the same table definition. Refer to `docs/PRD.md` → "Database Indexes" for the complete required list.

## Soft delete pattern

Tables with soft delete use a nullable timestamp, never a boolean:

```typescript
deletedAt: timestamp('deleted_at'), // nullable — absence means active
```

## Derived financial values — never in the schema

Do not add `amountPaid`, `remainingAmount`, or `status` as columns on `charges`. These are computed at query time only:

```typescript
// Correct pattern in a query helper
const chargesWithDerived = await db
  .select({
    id: charges.id,
    totalAmount: charges.totalAmount,
    amountPaid: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
    remainingAmount: sql<number>`${charges.totalAmount} - COALESCE(SUM(${payments.amount}), 0)`,
    status: sql<string>`
      CASE
        WHEN ${charges.totalAmount} - COALESCE(SUM(${payments.amount}), 0) = 0 THEN 'paid'
        WHEN COALESCE(SUM(${payments.amount}), 0) > 0 THEN 'partial'
        ELSE 'unpaid'
      END
    `,
  })
  .from(charges)
  .leftJoin(payments, eq(payments.chargeId, charges.id))
  .where(isNull(charges.deletedAt))
  .groupBy(charges.id);
```

## Query helpers (`src/lib/db/queries/<domain>.ts`)

Every helper that reads from a soft-delete table must include the filter:

```typescript
import { isNull } from 'drizzle-orm'
.where(isNull(table.deletedAt))
```

Never expose a raw query that bypasses this. Consumers of these helpers must not need to remember to add the filter themselves.

## Transactions for financial mutations

All writes to `payments` and any co-mutations (e.g., notification inserts that must be atomic with a payment) use a Drizzle transaction. Pass `tx` to every query helper called within the transaction:

```typescript
await db.transaction(async (tx) => {
  await tx.insert(payments).values(paymentData);
  // additional atomic steps using tx, not db
});
// Audit log insert uses db (not tx) — survives rollback
await db.insert(auditLogs).values(auditEntry);
```

## Database instance

Always import from `src/lib/db/index.ts`. Never create a new `drizzle(...)` instance inline.

```typescript
import { db } from "@/lib/db";
```

## Check constraints

Category, method, status, and role columns use Drizzle `.check()` to enforce valid values at the database layer. Do not rely on application-level validation alone for enum-like columns.
