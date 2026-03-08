#!/usr/bin/env tsx
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createClient } from "@supabase/supabase-js";

const anon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  // 1. List users to confirm they exist
  const { data: list } = await admin.auth.admin.listUsers();
  console.log("Auth users in Supabase:");
  for (const u of list?.users ?? []) {
    console.log(` - ${u.email} | confirmed: ${u.email_confirmed_at ? "yes" : "NO"} | app_meta: ${JSON.stringify(u.app_metadata)}`);
  }

  // 2. Attempt sign-in with the anon key (what the app uses)
  console.log("\nAttempting sign-in with anon key...");
  const { data, error } = await anon.auth.signInWithPassword({
    email: "syndic@test.com",
    password: "Syndic2026!",
  });
  if (error) {
    console.error("❌ Sign-in failed:", error.message, "| status:", error.status);
  } else {
    console.log("✅ Sign-in OK!");
    console.log("   user id:", data.user?.id);
    console.log("   app_metadata:", JSON.stringify(data.user?.app_metadata));
  }
}

main();
