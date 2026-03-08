/**
 * Seed script — creates a development syndic account + building.
 * Idempotent: safe to run multiple times.
 *
 * Usage: pnpm db:seed
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { loadEnvConfig } = require("@next/env") as { loadEnvConfig: (dir: string) => void };
loadEnvConfig(process.cwd());

import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { users, buildings } from "./schema";

// ─── Config ───────────────────────────────────────────────────────────
const SYNDIC_EMAIL = "syndic@test.com";
const SYNDIC_PASSWORD = "Test1234!";
const SYNDIC_FIRST_NAME = "Admin";
const SYNDIC_LAST_NAME = "Syndic";
const BUILDING_NAME = "Résidence les Oliviers";
const BUILDING_ADDRESS = "12 Rue de la Paix, Casablanca";

// ─── Clients ──────────────────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const connectionString = process.env.DATABASE_URL!;
if (!connectionString) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const sql = postgres(connectionString);
const db = drizzle(sql);

// ─── Seed ─────────────────────────────────────────────────────────────
async function seed() {
  console.log("🌱 Starting seed…");

  // 1. Check if syndic user already exists in public.users
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, SYNDIC_EMAIL));

  let syndicId: string;

  if (existingUser) {
    console.log(`✓ Syndic user already exists (${existingUser.id})`);
    syndicId = existingUser.id;
  } else {
    // Create auth user via Supabase Admin API
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: SYNDIC_EMAIL,
        password: SYNDIC_PASSWORD,
        email_confirm: true,
        app_metadata: { user_role: "syndic" },
        user_metadata: {
          first_name: SYNDIC_FIRST_NAME,
          last_name: SYNDIC_LAST_NAME,
        },
      });

    if (authError) {
      // If user exists in auth but not in public.users, list and find
      if (authError.message.includes("already been registered")) {
        const { data: listData } = await supabase.auth.admin.listUsers();
        const found = listData?.users.find((u) => u.email === SYNDIC_EMAIL);
        if (!found) {
          console.error("Auth user exists but cannot be found");
          process.exit(1);
        }
        syndicId = found.id;
        console.log(`✓ Auth user already exists (${syndicId})`);
      } else {
        console.error("Auth error:", authError.message);
        process.exit(1);
      }
    } else {
      syndicId = authData.user.id;
      console.log(`✓ Created auth user (${syndicId})`);
    }

    // Insert into public.users
    await db.insert(users).values({
      id: syndicId,
      email: SYNDIC_EMAIL,
      firstName: SYNDIC_FIRST_NAME,
      lastName: SYNDIC_LAST_NAME,
      role: "syndic",
    });
    console.log("✓ Inserted public.users row");
  }

  // 2. Check if building already exists for this syndic
  const [existingBuilding] = await db
    .select()
    .from(buildings)
    .where(eq(buildings.syndicId, syndicId));

  if (existingBuilding) {
    console.log(`✓ Building already exists (${existingBuilding.id})`);
  } else {
    const [newBuilding] = await db
      .insert(buildings)
      .values({
        syndicId,
        name: BUILDING_NAME,
        address: BUILDING_ADDRESS,
      })
      .returning({ id: buildings.id });

    console.log(`✓ Created building (${newBuilding.id})`);
  }

  console.log("🌱 Seed complete!");
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await sql.end();
  });
