# User Management Guide

Quick reference for creating and managing test users in the Syndic app.

---

## Quick Start

### Create a Syndic (Manager) User

```bash
pnpm admin:create-syndic manager@example.com password123
```

**Output:**
```
✅ Created syndic user: manager@example.com

🔐 Login at http://localhost:3000/login
   Email: manager@example.com
   Password: password123
```

Then go to `http://localhost:3000/login` and enter the credentials. You'll be redirected to `/dashboard`.

---

### Create a Proprietaire (Co-owner) User

```bash
pnpm admin:create-proprietaire owner@example.com password456
```

After login, you'll be redirected to `/portal`.

---

### Update an Existing User's Role

```bash
pnpm admin:set-role bilalelazzam.dev@gmail.com syndic
```

or

```bash
pnpm admin:set-role existing-user@example.com proprietaire
```

---

## Using the Seed Script (Alternative)

The seed script creates a complete test environment with a syndic user, buildings, apartments, charges, and co-owners:

```bash
pnpm db:seed
```

Default credentials from `src/lib/db/seed.ts`:
- **Email:** `manager@syndic.dev`
- **Password:** `TempPass123!`
- **Role:** `syndic`

---

## Login Flow

1. **Start the dev server** (if not already running):
   ```bash
   pnpm dev
   ```

2. **Navigate to** http://localhost:3000/login

3. **Enter credentials** created above

4. **You're redirected based on role:**
   - `syndic` → `/dashboard`
   - `proprietaire` → `/portal`

---

## Testing Different Roles

### Syndic Dashboard Features

- Manage owners and apartments
- Create and track charges
- View all payments
- Schedule and manage meetings
- Access audit logs
- System settings

```bash
# Create syndic for testing
pnpm admin:create-syndic test-manager@example.com pass123
```

Login → `/dashboard`

### Proprietaire Portal Features

- View assigned charges and payments
- Make payments (when implemented)
- Respond to meeting invitations
- View notifications
- Update profile

```bash
# Create proprietaire for testing
pnpm admin:create-proprietaire test-owner@example.com pass456
```

Login → `/portal`

---

## Programmatic Usage (TypeScript)

Import the utility functions in your Server Actions or API routes:

```typescript
import {
  createUserWithRole,
  setUserRole,
} from "@/lib/actions/admin-user";

// Create new user
const result = await createUserWithRole(
  "user@example.com",
  "password123",
  "syndic",
  "Jean",
  "Dupont"
);

if (result.success) {
  console.log("Created user:", result.data.id);
}

// Update existing user's role
const updateResult = await setUserRole("user@example.com", "proprietaire");
```

---

## Database Sync Note

When you create users via the CLI, they're automatically synced to the `public.users` table. If sync fails (DB error), the auth user is still created and will work fine — authentication doesn't depend on the public.users table.

The `custom_access_token_hook` function in Supabase reads the role from both sources and injects it into the JWT as `app_metadata.user_role`.

---

## Troubleshooting

### "User already exists"
```bash
pnpm admin:set-role existing@example.com syndic
```

### "Invalid password"
Password must be at least 6 characters. Recommended: 10+ characters with mixed case and numbers.

### User created but can't log in
Make sure the user has a role set. Check Supabase Dashboard:
1. Go to Authentication → Users
2. Click the user
3. Verify `app_metadata` contains `{ "user_role": "syndic" }` or `"proprietaire"`

### "Role must be 'syndic' or 'proprietaire'"
These are the only valid roles in this app. Typo? Check spelling.

### Cannot delete user from Supabase dashboard (foreign key constraint)

If you see: `Unable to delete row as it is currently referenced by a foreign key constraint from table buildings`

**In Development:**
Delete dependent records first in this order:
1. Delete related **payments** (if any)
2. Delete related **charges** (if any)
3. Delete related **owners** (if any)
4. Delete related **buildings** (if syndic)
5. Then delete the **user**

**Better approach — Use SQL in Supabase Dashboard:**
```sql
-- For a syndic user with buildings
DELETE FROM payments WHERE owner_id IN (
  SELECT o.id FROM owners o 
  JOIN apartments a ON o.apartment_id = a.id
  JOIN buildings b ON a.building_id = b.id
  WHERE b.syndic_id = 'USER_ID_HERE'
);

DELETE FROM charges WHERE syndic_id = 'USER_ID_HERE';
DELETE FROM meeting_invitations WHERE meeting_id IN (
  SELECT id FROM meetings WHERE syndic_id = 'USER_ID_HERE'
);
DELETE FROM meetings WHERE syndic_id = 'USER_ID_HERE';

DELETE FROM owners WHERE apartment_id IN (
  SELECT a.id FROM apartments a
  JOIN buildings b ON a.building_id = b.id
  WHERE b.syndic_id = 'USER_ID_HERE'
);

DELETE FROM apartments WHERE building_id IN (
  SELECT id FROM buildings WHERE syndic_id = 'USER_ID_HERE'
);

DELETE FROM buildings WHERE syndic_id = 'USER_ID_HERE';
DELETE FROM users WHERE id = 'USER_ID_HERE';

-- Then delete from auth.users in Authentication tab
```

**Recommended:** Instead of deleting, soft-delete by setting `deleted_at`:
```sql
UPDATE users SET deleted_at = NOW() WHERE id = 'USER_ID_HERE';
```
