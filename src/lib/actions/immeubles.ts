"use server";

import { and, eq, isNull } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { auditLogs, buildings } from "@/lib/db/schema";
import { createImmeubleSchema, type ImmeubleFormValues } from "@/lib/validations/immeuble";
import { createClient } from "@/utils/supabase/server";

type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

async function getAuthenticatedSyndic() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const role = user.app_metadata?.user_role as string | undefined;
  if (role !== "syndic") return null;

  return user;
}

export async function createBuilding(
  values: ImmeubleFormValues
): Promise<ActionResult<{ id: string }>> {
  const tv = await getTranslations("validation");
  const schema = createImmeubleSchema(tv);
  const parsed = schema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const user = await getAuthenticatedSyndic();
  if (!user) return { success: false, error: "Non authentifié" };

  const [created] = await db
    .insert(buildings)
    .values({
      syndicId: user.id,
      name: parsed.data.name,
      address: parsed.data.address,
      totalTantiemes: parsed.data.totalTantiemes,
    })
    .returning({ id: buildings.id });

  await db.insert(auditLogs).values({
    userId: user.id,
    action: "CREATE_BUILDING",
    entityType: "buildings",
    entityId: created.id,
  });

  return { success: true, data: { id: created.id } };
}

export async function updateBuilding(
  id: string,
  values: ImmeubleFormValues
): Promise<ActionResult<{ id: string }>> {
  const tv = await getTranslations("validation");
  const schema = createImmeubleSchema(tv);
  const parsed = schema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const user = await getAuthenticatedSyndic();
  if (!user) return { success: false, error: "Non authentifié" };

  const [building] = await db
    .select({ id: buildings.id, syndicId: buildings.syndicId })
    .from(buildings)
    .where(and(eq(buildings.id, id), isNull(buildings.deletedAt)));

  if (!building || building.syndicId !== user.id) {
    return { success: false, error: "Accès refusé" };
  }

  await db
    .update(buildings)
    .set({
      name: parsed.data.name,
      address: parsed.data.address,
      totalTantiemes: parsed.data.totalTantiemes,
      updatedAt: new Date(),
    })
    .where(eq(buildings.id, id));

  await db.insert(auditLogs).values({
    userId: user.id,
    action: "UPDATE_BUILDING",
    entityType: "buildings",
    entityId: id,
  });

  return { success: true, data: { id } };
}
