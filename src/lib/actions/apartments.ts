"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { apartments, auditLogs } from "@/lib/db/schema";
import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import { createApartmentSchema } from "@/lib/validations/apartment";
import { getBuildingBySyndicId } from "@/lib/db/queries/buildings";
import { getApartmentById } from "@/lib/db/queries/apartments";
import { getOwnerByApartmentId } from "@/lib/db/queries/owners";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Create apartment
// ---------------------------------------------------------------------------
export async function createApartment(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  // 1. Validate
  const t = await getTranslations("validation");
  const schema = createApartmentSchema(t);
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

  // 3. Get building
  const building = await getBuildingBySyndicId(user.id);
  if (!building) return { success: false, error: "Immeuble introuvable" };

  // 4. Insert
  const [newApartment] = await db
    .insert(apartments)
    .values({
      buildingId: building.id,
      unitNumber: parsed.data.unitNumber,
      floor: parsed.data.floor,
      surfaceArea: String(parsed.data.surfaceArea),
      roomCount: parsed.data.roomCount,
      type: parsed.data.type,
      status: "vacant",
    })
    .returning({ id: apartments.id });

  // 5. Audit log
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "CREATE_APARTMENT",
    entityType: "apartments",
    entityId: newApartment.id,
  });

  return { success: true, data: { id: newApartment.id } };
}

// ---------------------------------------------------------------------------
// Update apartment
// ---------------------------------------------------------------------------
export async function updateApartment(
  id: string,
  values: unknown
): Promise<ActionResult> {
  // 1. Validate
  const t = await getTranslations("validation");
  const schema = createApartmentSchema(t);
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

  // 3. Verify apartment belongs to syndic's building
  const building = await getBuildingBySyndicId(user.id);
  if (!building) return { success: false, error: "Immeuble introuvable" };

  const apartment = await getApartmentById(id);
  if (!apartment || apartment.buildingId !== building.id) {
    return { success: false, error: "Appartement introuvable" };
  }

  // 4. Update (status is NOT editable — managed by owner actions)
  await db
    .update(apartments)
    .set({
      unitNumber: parsed.data.unitNumber,
      floor: parsed.data.floor,
      surfaceArea: String(parsed.data.surfaceArea),
      roomCount: parsed.data.roomCount,
      type: parsed.data.type,
      updatedAt: new Date(),
    })
    .where(eq(apartments.id, id));

  // 5. Audit log
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "UPDATE_APARTMENT",
    entityType: "apartments",
    entityId: id,
  });

  return { success: true, data: null };
}

// ---------------------------------------------------------------------------
// Delete apartment (soft-delete)
// ---------------------------------------------------------------------------
export async function deleteApartment(
  id: string
): Promise<ActionResult> {
  // 1. Authenticate
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Non authentifié" };

  const role = user.app_metadata?.user_role as string | undefined;
  if (role !== "syndic") return { success: false, error: "Accès refusé" };

  // 2. Verify apartment belongs to syndic's building
  const building = await getBuildingBySyndicId(user.id);
  if (!building) return { success: false, error: "Immeuble introuvable" };

  const apartment = await getApartmentById(id);
  if (!apartment || apartment.buildingId !== building.id) {
    return { success: false, error: "Appartement introuvable" };
  }

  // 3. Guard: active owner check
  const activeOwner = await getOwnerByApartmentId(id);
  if (activeOwner) {
    return {
      success: false,
      error:
        "Impossible de supprimer : un copropriétaire actif est assigné à cet appartement.",
    };
  }

  // 4. Soft-delete (deletedAt column added in Step 7b migration)
  await db
    .update(apartments)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(apartments.id, id));

  // 5. Audit log
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "DELETE_APARTMENT",
    entityType: "apartments",
    entityId: id,
  });

  return { success: true, data: null };
}
