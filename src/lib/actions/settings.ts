"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { buildings, users, auditLogs } from "@/lib/db/schema";
import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import { createSettingsSchema } from "@/lib/validations/settings";
import { getBuildingById } from "@/lib/db/queries/buildings";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Update building settings (+ optional syndic contact info)
// ---------------------------------------------------------------------------
export async function updateBuilding(
  values: unknown
): Promise<ActionResult> {
  // 1. Validate
  const t = await getTranslations("validation");
  const schema = createSettingsSchema(t);
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // 2. Authenticate
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Non authentifié" };

  const role = user.app_metadata?.user_role as string | undefined;
  if (role !== "syndic") return { success: false, error: "Accès refusé" };

  // 3. Resolve and authorize target building
  const building = await getBuildingById(parsed.data.buildingId);
  if (!building || building.syndicId !== user.id) {
    return { success: false, error: "Accès refusé" };
  }

  // 4. Update building
  await db
    .update(buildings)
    .set({
      name: parsed.data.name,
      address: parsed.data.address,
      updatedAt: new Date(),
    })
    .where(eq(buildings.id, building.id));

  // 5. Update syndic contact info if provided
  if (parsed.data.contactPhone !== undefined || parsed.data.contactEmail !== undefined) {
    const userUpdate: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.contactPhone !== undefined) {
      userUpdate.phone = parsed.data.contactPhone || null;
    }
    if (parsed.data.contactEmail !== undefined && parsed.data.contactEmail !== "") {
      userUpdate.email = parsed.data.contactEmail;
    }
    await db
      .update(users)
      .set(userUpdate)
      .where(eq(users.id, user.id));
  }

  // 6. Audit log (outside transaction)
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "UPDATE_BUILDING",
    entityType: "buildings",
    entityId: building.id,
  });

  return { success: true, data: null };
}
