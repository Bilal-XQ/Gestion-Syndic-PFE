"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { db } from "@/lib/db";
import { users, buildings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type UserRole = "syndic" | "proprietaire";

type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Set user role in app_metadata (for existing users)
// ---------------------------------------------------------------------------
export async function setUserRole(
  email: string,
  role: UserRole
): Promise<ActionResult> {
  const supabaseAdmin = createAdminClient();

  // 1. Get user by email
  const { data, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    return { success: false, error: listError.message };
  }

  const user = data?.users.find((u) => u.email === email);
  if (!user) {
    return { success: false, error: `User not found: ${email}` };
  }

  // 2. Update app_metadata with user_role
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    {
      app_metadata: { user_role: role },
    }
  );

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // 3. Also update public.users table if creating a new user
  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id));

    if (!existing.length) {
      await db.insert(users).values({
        id: user.id,
        email: email,
        firstName: user.user_metadata?.first_name ?? "User",
        lastName: user.user_metadata?.last_name ?? "",
        phone: null,
        role: role,
      });
    } else {
      await db
        .update(users)
        .set({ role: role })
        .where(eq(users.id, user.id));
    }
  } catch (dbError) {
    console.warn("Warning: Could not sync to public.users table", dbError);
    // Don't fail the whole operation if DB sync fails
  }

  return {
    success: true,
    data: null,
  };
}

// ---------------------------------------------------------------------------
// Create new user with role (auth + DB)
// ---------------------------------------------------------------------------
export async function createUserWithRole(
  email: string,
  password: string,
  role: UserRole,
  firstName: string = "User",
  lastName: string = ""
): Promise<ActionResult<{ id: string; email: string }>> {
  const supabaseAdmin = createAdminClient();

  // 1. Create auth user
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { user_role: role },
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

  if (authError) {
    return {
      success: false,
      error: authError.message,
    };
  }

  if (!authData.user) {
    return {
      success: false,
      error: "Unknown error creating user",
    };
  }

  // 2. Insert into public.users
  try {
    await db.insert(users).values({
      id: authData.user.id,
      email,
      firstName,
      lastName,
      phone: null,
      role,
    });
  } catch (dbError) {
    console.warn("Warning: Could not sync to public.users", dbError);
    // Still return success — auth user was created
  }

  // 3. Auto-create building for syndic
  if (role === "syndic") {
    try {
      await db.insert(buildings).values({
        syndicId: authData.user.id,
        name: "Mon Immeuble",
        address: "À configurer",
      });
    } catch (dbError) {
      console.warn("Warning: Could not create default building", dbError);
    }
  }

  return {
    success: true,
    data: {
      id: authData.user.id,
      email,
    },
  };
}
