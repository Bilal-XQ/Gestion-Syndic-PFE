import { eq, isNull, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { buildings } from "@/lib/db/schema";

/**
 * Get the building belonging to a syndic user.
 * At MVP, each syndic has exactly one building.
 */
export async function getBuildingBySyndicId(syndicId: string) {
  const [building] = await db
    .select()
    .from(buildings)
    .where(and(eq(buildings.syndicId, syndicId), isNull(buildings.deletedAt)));

  return building ?? null;
}

/**
 * Get a building by its ID.
 * Used by the owner portal to resolve the building for a charge's apartment.
 */
export async function getBuildingById(id: string) {
  const [building] = await db
    .select()
    .from(buildings)
    .where(and(eq(buildings.id, id), isNull(buildings.deletedAt)));

  return building ?? null;
}
