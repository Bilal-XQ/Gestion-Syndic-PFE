#!/usr/bin/env tsx
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS for both auth and DB
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  // 1. Clear public schema tables in dependency order
  const tables = [
    "audit_logs", "payments", "meeting_invitations", "meetings",
    "notifications", "charges", "owners", "apartments", "buildings", "users",
  ];
  for (const table of tables) {
    const { error } = await sb.from(table).delete().not("id", "is", null);
    if (error) console.log(`⚠ Could not clear ${table}: ${error.message}`);
    else console.log(`✓ Cleared ${table}`);
  }

  // 2. Delete all existing auth users
  const { data, error: listErr } = await sb.auth.admin.listUsers({ perPage: 100 });
  if (listErr) {
    console.error("❌ Could not list auth users:", listErr.message);
    process.exit(1);
  }
  for (const u of data?.users ?? []) {
    const { error } = await sb.auth.admin.deleteUser(u.id);
    console.log(error ? `❌ Failed to delete ${u.email}: ${error.message}` : `✓ Deleted auth user: ${u.email}`);
  }

  // 3. Create syndic auth user
  const { data: sAuth, error: sErr } = await sb.auth.admin.createUser({
    email: "syndic@test.com",
    password: "Syndic2026!",
    email_confirm: true,
    app_metadata: { user_role: "syndic" },
    user_metadata: { role: "syndic" },
  });
  if (sErr || !sAuth.user) {
    console.error("❌ Could not create syndic:", sErr?.message);
    process.exit(1);
  }

  // 4. Insert syndic into public.users via service-role client
  const { error: sDbErr } = await sb.from("users").insert({
    id: sAuth.user.id,
    email: "syndic@test.com",
    first_name: "Syndic",
    last_name: "Test",
    phone: null,
    role: "syndic",
  });
  if (sDbErr) console.warn("⚠ Could not insert syndic into public.users:", sDbErr.message);
  else console.log(`✓ Inserted syndic into public.users`);

  // 5. Create proprietaire auth user
  const { data: pAuth, error: pErr } = await sb.auth.admin.createUser({
    email: "proprietaire@test.com",
    password: "Owner2026!",
    email_confirm: true,
    app_metadata: { user_role: "proprietaire" },
    user_metadata: { role: "proprietaire" },
  });
  if (pErr || !pAuth.user) {
    console.error("❌ Could not create proprietaire:", pErr?.message);
    process.exit(1);
  }

  // 6. Insert proprietaire into public.users via service-role client
  const { error: pDbErr } = await sb.from("users").insert({
    id: pAuth.user.id,
    email: "proprietaire@test.com",
    first_name: "Proprietaire",
    last_name: "Test",
    phone: null,
    role: "proprietaire",
  });
  if (pDbErr) console.warn("⚠ Could not insert proprietaire into public.users:", pDbErr.message);
  else console.log(`✓ Inserted proprietaire into public.users`);

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Login at http://localhost:3000/login

  Syndic (→ /dashboard):
    Email:    syndic@test.com
    Password: Syndic2026!

  Proprietaire (→ /portal):
    Email:    proprietaire@test.com
    Password: Owner2026!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

main().catch((e) => {
  console.error("❌ Fatal:", e.message);
  process.exit(1);
});
