"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, auditLogs } from "@/lib/db/schema";
import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import {
  createUpdatePhoneSchema,
  createChangePasswordSchema,
} from "@/lib/validations/profile";
import { getOwnerByUserId } from "@/lib/db/queries/owners";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Helper: authenticate + authorize proprietaire
// ---------------------------------------------------------------------------
async function getAuthenticatedOwner() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const role = user.app_metadata?.user_role as string | undefined;
  if (role !== "proprietaire") return null;

  return { user, supabase };
}

// ---------------------------------------------------------------------------
// Update phone
// ---------------------------------------------------------------------------
export async function updatePhone(
  values: unknown
): Promise<ActionResult> {
  // 1. Validate
  const t = await getTranslations("validation");
  const tc = await getTranslations("common");
  const schema = createUpdatePhoneSchema(t);
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // 2. Authenticate
  const auth = await getAuthenticatedOwner();
  if (!auth) return { success: false, error: tc("errors.unauthenticated") };

  // 3. Resolve owner record
  const owner = await getOwnerByUserId(auth.user.id);
  if (!owner) return { success: false, error: tc("errors.ownerNotFound") };

  // 4. Update users.phone
  await db
    .update(users)
    .set({
      phone: parsed.data.phone || null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, auth.user.id));

  // 5. Audit log
  await db.insert(auditLogs).values({
    userId: auth.user.id,
    action: "UPDATE_OWNER",
    entityType: "owners",
    entityId: owner.id,
  });

  return { success: true, data: null };
}

// ---------------------------------------------------------------------------
// Change password
// ---------------------------------------------------------------------------
export async function changePassword(
  values: unknown
): Promise<ActionResult> {
  // 1. Validate
  const t = await getTranslations("validation");
  const tc = await getTranslations("common");
  const schema = createChangePasswordSchema(t);
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // 2. Authenticate
  const auth = await getAuthenticatedOwner();
  if (!auth) return { success: false, error: tc("errors.unauthenticated") };

  // 3. Call Supabase Auth — server-side client
  const { error } = await auth.supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: null };
}
