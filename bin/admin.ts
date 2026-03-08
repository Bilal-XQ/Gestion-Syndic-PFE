#!/usr/bin/env tsx
/**
 * Admin CLI — Quick user management
 * Usage:
 *   pnpm tsx bin/admin.ts create-syndic admin@example.com password123
 *   pnpm tsx bin/admin.ts create-proprietaire owner@example.com password123
 *   pnpm tsx bin/admin.ts set-role user@example.com syndic
 *   pnpm tsx bin/admin.ts set-role user@example.com proprietaire
 */

// Load environment variables using Next.js loader
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createAdminClient } from "../src/utils/supabase/admin";
import { db } from "../src/lib/db";
import { users, buildings } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

type UserRole = "syndic" | "proprietaire";

const args = process.argv.slice(2);
const command = args[0];
const email = args[1];
const arg3 = args[2];

// ---------------------------------------------------------------------------
// Set user role
// ---------------------------------------------------------------------------
async function setUserRole(email: string, role: UserRole) {
  console.log(`\n📝 Setting role "${role}" for ${email}...`);

  const supabaseAdmin = createAdminClient();

  // Find user by email
  const { data, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error("❌ Error listing users:", listError.message);
    process.exit(1);
  }

  const user = data?.users.find((u) => u.email === email);
  if (!user) {
    console.error(`❌ User not found: ${email}`);
    process.exit(1);
  }

  // Update app_metadata
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    {
      app_metadata: { user_role: role },
    }
  );

  if (updateError) {
    console.error("❌ Error updating user:", updateError.message);
    process.exit(1);
  }

  // Sync to public.users
  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id));

    if (existing.length > 0) {
      await db
        .update(users)
        .set({ role: role })
        .where(eq(users.id, user.id));
    }
  } catch (err) {
    console.warn("⚠️  Warning: Could not sync to public.users");
  }

  console.log(`✅ Updated ${email} → ${role}`);
  console.log(`\n🔐 Login at http://localhost:3000/login`);
  console.log(`   Email: ${email}`);
}

// ---------------------------------------------------------------------------
// Create user with role
// ---------------------------------------------------------------------------
async function createUser(
  email: string,
  password: string,
  role: UserRole
) {
  console.log(`\n🆕 Creating ${role} user: ${email}...`);

  if (!password) {
    console.error("❌ Password is required");
    process.exit(1);
  }

  const supabaseAdmin = createAdminClient();

  // Check if user already exists
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
  if (existing?.users.find((u) => u.email === email)) {
    console.error(`❌ User already exists: ${email}`);
    process.exit(1);
  }

  // Create auth user
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { user_role: role },
      user_metadata: { role },
    });

  if (authError) {
    console.error("❌ Error creating user:", authError.message);
    process.exit(1);
  }

  if (!authData.user) {
    console.error("❌ Unknown error creating user");
    process.exit(1);
  }

  // Insert into public.users
  try {
    await db.insert(users).values({
      id: authData.user.id,
      email,
      firstName: "User",
      lastName: "",
      phone: null,
      role,
    });
  } catch (err) {
    console.warn("⚠️  Warning: Could not sync to public.users");
  }

  // Auto-create building for syndic
  if (role === "syndic") {
    try {
      await db.insert(buildings).values({
        syndicId: authData.user.id,
        name: "Mon Immeuble",
        address: "À configurer",
      });
      console.log("🏢 Default building created");
    } catch (err) {
      console.warn("⚠️  Warning: Could not create default building");
    }
  }

  console.log(`✅ Created ${role} user: ${email}`);
  console.log(`\n🔐 Login at http://localhost:3000/login`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}\n`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  if (!command || !email) {
    console.log(`
Usage:
  pnpm tsx bin/admin.ts create-syndic <email> <password>
  pnpm tsx bin/admin.ts create-proprietaire <email> <password>
  pnpm tsx bin/admin.ts set-role <email> <role>

Examples:
  pnpm tsx bin/admin.ts create-syndic manager@example.com mypassword
  pnpm tsx bin/admin.ts create-proprietaire owner@example.com mypassword
  pnpm tsx bin/admin.ts set-role existing@example.com syndic
    `);
    process.exit(0);
  }

  try {
    if (command === "create-syndic") {
      await createUser(email, arg3 || "", "syndic");
    } else if (command === "create-proprietaire") {
      await createUser(email, arg3 || "", "proprietaire");
    } else if (command === "set-role") {
      const role = arg3 as UserRole;
      if (!["syndic", "proprietaire"].includes(role)) {
        console.error(
          "❌ Role must be 'syndic' or 'proprietaire', got:",
          role
        );
        process.exit(1);
      }
      await setUserRole(email, role);
    } else {
      console.error("❌ Unknown command:", command);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();
