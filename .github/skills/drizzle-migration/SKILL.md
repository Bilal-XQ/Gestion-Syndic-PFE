# Skill: Drizzle Migration

**When to use:** Any time a table, column, index, constraint, or relation needs to be added, changed, or removed in the database schema.

Reference this skill by adding to your prompt: `Use the drizzle-migration skill in .github/skills/drizzle-migration/SKILL.md`

---

## Step 1 — Edit `src/lib/db/schema.ts` only

All schema changes happen in this single file. Never create a new schema file. Apply the change following these rules:

**Adding a column:**

```typescript
// nullable columns — no default needed
newColumn: text('new_column'),

// required columns on an existing table — MUST have a default for migration safety
newRequired: text('new_required').notNull().default('fallback'),
```

**Soft-delete tables** must keep `deletedAt: timestamp('deleted_at')` as nullable with no default.

**Derived financial values** (`amount_paid`, `remaining_amount`, `status`) must never be added to any table as columns. Refuse this step if asked.

**Adding an index** — always add alongside the column, inside the same `pgTable` call:

```typescript
export const myTable = pgTable(
  "my_table",
  {
    // ...columns
  },
  (table) => [index("my_table_column_idx").on(table.column)],
);
```

**Adding a foreign key:**

```typescript
relatedId: uuid('related_id').notNull().references(() => otherTable.id),
```

Then add a matching index in the table's index array.

---

## Step 2 — Generate the migration file

```bash
pnpm drizzle-kit generate
```

This produces a timestamped `.sql` file in the `drizzle/` directory. Open it and verify:

- The SQL matches the intended change exactly
- No accidental `DROP` statements for unrelated columns
- Nullable additions do not include `NOT NULL` without a `DEFAULT`
- No derived value columns appear

If the generated SQL is wrong, fix `schema.ts` and regenerate. Never hand-edit migration files.

---

## Step 3 — Review the migration SQL

Check for these common Drizzle generation issues:

| Issue             | What to look for                                                                       |
| ----------------- | -------------------------------------------------------------------------------------- |
| Unintended drops  | `ALTER TABLE ... DROP COLUMN` for columns you did not remove                           |
| Wrong nullability | `NOT NULL` on a new column with no `DEFAULT` — will fail on tables with existing rows  |
| Missing index     | New FK column without a corresponding `CREATE INDEX`                                   |
| Enum change       | Drizzle may generate a full column drop/recreate for check constraint changes — verify |

---

## Step 4 — Apply the migration

```bash
# Against your local Supabase instance
pnpm drizzle-kit migrate

# Verify the migration ran
pnpm drizzle-kit studio  # inspect current schema state
```

---

## Step 5 — Update RLS policies if needed

If the migration adds a new table or a column used in access control, update the RLS policies. Follow the supabase-rls skill at `.github/skills/supabase-rls/SKILL.md`.

New tables require:

- `ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;`
- At minimum a SELECT policy using `auth.jwt() ->> 'user_role'` and `auth.uid()`

---

## Step 6 — Update the query helper

If the migration adds or removes a column, update the corresponding query helper in `src/lib/db/queries/<domain>.ts`. Verify the helper still includes:

- `isNull(table.deletedAt)` on all soft-delete tables
- The correct column references in any `sql<>` computed expressions

---

## Step 7 — Update the Zod schema if needed

If the migration changes a column that is part of a form, update `src/lib/validations/<domain>.ts`. The schema must stay in sync with the database check constraints (enums, required fields).

---

## Checklist before committing

- [ ] `schema.ts` reflects the intended state
- [ ] Migration SQL reviewed — no unintended drops, correct nullability
- [ ] Migration applied locally and verified in Drizzle Studio
- [ ] RLS policies updated for any new table
- [ ] Query helper updated for changed columns
- [ ] Zod schema updated if form fields changed
- [ ] Drizzle-kit version: 0.34+ (check `package.json`)
