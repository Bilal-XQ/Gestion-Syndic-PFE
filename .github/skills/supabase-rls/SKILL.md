# Skill: Supabase RLS Policies

**When to use:** Any time you add a new table, add a new role-specific operation, or audit existing data access.

Reference this skill by adding to your prompt: `Use the supabase-rls skill in .github/skills/supabase-rls/SKILL.md`

---

## Core principles

1. RLS is the last line of defence. Application-level filtering is not a substitute — both must be present.
2. Policies use `auth.jwt() ->> 'user_role'` and `auth.uid()` exclusively. No subqueries to `public.users` for role resolution.
3. Every table that holds user-scoped data must have RLS enabled and at least one policy per operation (SELECT, INSERT, UPDATE, DELETE) that the application performs.
4. Audit log rows are immutable — no UPDATE or DELETE policy should ever be created for `audit_logs`.

---

## Required policies per table

### `users`

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Syndic reads all users
CREATE POLICY "syndic_read_users" ON users FOR SELECT
USING (auth.jwt() ->> 'user_role' = 'syndic');

-- Proprietaire reads only their own row
CREATE POLICY "proprietaire_read_own_user" ON users FOR SELECT
USING (
  auth.jwt() ->> 'user_role' = 'proprietaire'
  AND auth.uid() = id
);

-- Proprietaire updates only their own row (phone, password handled by Supabase Auth)
CREATE POLICY "proprietaire_update_own_user" ON users FOR UPDATE
USING (auth.jwt() ->> 'user_role' = 'proprietaire' AND auth.uid() = id)
WITH CHECK (auth.jwt() ->> 'user_role' = 'proprietaire' AND auth.uid() = id);
```

### `buildings`

```sql
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "syndic_all_own_building" ON buildings FOR ALL
USING (
  auth.jwt() ->> 'user_role' = 'syndic'
  AND auth.uid() = syndic_id
)
WITH CHECK (
  auth.jwt() ->> 'user_role' = 'syndic'
  AND auth.uid() = syndic_id
);
```

### `apartments`

```sql
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;

-- Syndic full access to their building's apartments
CREATE POLICY "syndic_all_apartments" ON apartments FOR ALL
USING (
  auth.jwt() ->> 'user_role' = 'syndic'
  AND building_id IN (
    SELECT id FROM buildings WHERE syndic_id = auth.uid()
  )
)
WITH CHECK (
  auth.jwt() ->> 'user_role' = 'syndic'
  AND building_id IN (
    SELECT id FROM buildings WHERE syndic_id = auth.uid()
  )
);

-- Proprietaire reads only their assigned apartment
CREATE POLICY "proprietaire_read_own_apartment" ON apartments FOR SELECT
USING (
  auth.jwt() ->> 'user_role' = 'proprietaire'
  AND id IN (
    SELECT apartment_id FROM owners
    WHERE user_id = auth.uid() AND deleted_at IS NULL
  )
);
```

### `owners`

```sql
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "syndic_all_owners" ON owners FOR ALL
USING (auth.jwt() ->> 'user_role' = 'syndic')
WITH CHECK (auth.jwt() ->> 'user_role' = 'syndic');

CREATE POLICY "proprietaire_read_own_owner" ON owners FOR SELECT
USING (
  auth.jwt() ->> 'user_role' = 'proprietaire'
  AND user_id = auth.uid()
);
```

### `charges`

```sql
ALTER TABLE charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "syndic_all_charges" ON charges FOR ALL
USING (
  auth.jwt() ->> 'user_role' = 'syndic'
  AND syndic_id = auth.uid()
)
WITH CHECK (
  auth.jwt() ->> 'user_role' = 'syndic'
  AND syndic_id = auth.uid()
);

CREATE POLICY "proprietaire_read_own_charges" ON charges FOR SELECT
USING (
  auth.jwt() ->> 'user_role' = 'proprietaire'
  AND apartment_id IN (
    SELECT apartment_id FROM owners
    WHERE user_id = auth.uid() AND deleted_at IS NULL
  )
);
```

### `payments`

```sql
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "syndic_read_all_payments" ON payments FOR SELECT
USING (auth.jwt() ->> 'user_role' = 'syndic');

CREATE POLICY "proprietaire_insert_own_payment" ON payments FOR INSERT
WITH CHECK (
  auth.jwt() ->> 'user_role' = 'proprietaire'
  AND owner_id IN (
    SELECT id FROM owners
    WHERE user_id = auth.uid() AND deleted_at IS NULL
  )
);

CREATE POLICY "proprietaire_read_own_payments" ON payments FOR SELECT
USING (
  auth.jwt() ->> 'user_role' = 'proprietaire'
  AND owner_id IN (
    SELECT id FROM owners
    WHERE user_id = auth.uid() AND deleted_at IS NULL
  )
);

-- No UPDATE or DELETE policy — payments rows are immutable
```

### `meetings`

```sql
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "syndic_all_meetings" ON meetings FOR ALL
USING (
  auth.jwt() ->> 'user_role' = 'syndic'
  AND syndic_id = auth.uid()
)
WITH CHECK (
  auth.jwt() ->> 'user_role' = 'syndic'
  AND syndic_id = auth.uid()
);

CREATE POLICY "proprietaire_read_invited_meetings" ON meetings FOR SELECT
USING (
  auth.jwt() ->> 'user_role' = 'proprietaire'
  AND id IN (
    SELECT meeting_id FROM meeting_invitations
    WHERE owner_id IN (
      SELECT id FROM owners WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  )
);
```

### `meeting_invitations`

```sql
ALTER TABLE meeting_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "syndic_all_invitations" ON meeting_invitations FOR ALL
USING (auth.jwt() ->> 'user_role' = 'syndic')
WITH CHECK (auth.jwt() ->> 'user_role' = 'syndic');

CREATE POLICY "proprietaire_read_own_invitations" ON meeting_invitations FOR SELECT
USING (
  auth.jwt() ->> 'user_role' = 'proprietaire'
  AND owner_id IN (
    SELECT id FROM owners WHERE user_id = auth.uid() AND deleted_at IS NULL
  )
);

CREATE POLICY "proprietaire_update_own_invitation" ON meeting_invitations FOR UPDATE
USING (
  auth.jwt() ->> 'user_role' = 'proprietaire'
  AND owner_id IN (
    SELECT id FROM owners WHERE user_id = auth.uid() AND deleted_at IS NULL
  )
)
WITH CHECK (
  auth.jwt() ->> 'user_role' = 'proprietaire'
  AND owner_id IN (
    SELECT id FROM owners WHERE user_id = auth.uid() AND deleted_at IS NULL
  )
);
```

### `notifications`

```sql
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Syndic inserts notifications for proprietaires
CREATE POLICY "syndic_insert_notifications" ON notifications FOR INSERT
WITH CHECK (auth.jwt() ->> 'user_role' = 'syndic');

-- Server Actions also insert on behalf of proprietaires (payment_confirmation)
CREATE POLICY "service_insert_notifications" ON notifications FOR INSERT
WITH CHECK (true); -- Scope this to service_role key usage only

-- Proprietaire reads only their own
CREATE POLICY "proprietaire_read_own_notifications" ON notifications FOR SELECT
USING (
  auth.jwt() ->> 'user_role' = 'proprietaire'
  AND user_id = auth.uid()
);

-- Proprietaire marks as read
CREATE POLICY "proprietaire_update_own_notifications" ON notifications FOR UPDATE
USING (
  auth.jwt() ->> 'user_role' = 'proprietaire'
  AND user_id = auth.uid()
)
WITH CHECK (
  auth.jwt() ->> 'user_role' = 'proprietaire'
  AND user_id = auth.uid()
);
```

### `audit_logs`

```sql
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Syndic reads all audit logs
CREATE POLICY "syndic_read_audit_logs" ON audit_logs FOR SELECT
USING (auth.jwt() ->> 'user_role' = 'syndic');

-- INSERT only — no UPDATE, no DELETE policy exists for this table
CREATE POLICY "authenticated_insert_audit_logs" ON audit_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
```

---

## RLS audit checklist

Run these test queries with a proprietaire-role JWT to verify no cross-owner data leaks:

```sql
-- Should return only the authenticated user's rows
SELECT * FROM notifications;        -- must be filtered to auth.uid()
SELECT * FROM payments;             -- must be filtered to the user's owner_id
SELECT * FROM charges;              -- must be filtered to the user's apartment_id
SELECT * FROM meeting_invitations;  -- must be filtered to the user's owner_id

-- Should return zero rows for a proprietaire
SELECT * FROM audit_logs;
SELECT * FROM buildings;
```

Confirm with a syndic-role JWT that cross-building access is also blocked where applicable.
