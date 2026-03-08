import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { apartments } from "@/lib/db/schema";

/**
 * All active apartments for a given building.
 * Filters out soft-deleted rows (deletedAt will be added in Step 7b migration).
 */
export async function getApartments(buildingId: string) {
  return db
    .select()
    .from(apartments)
    .where(
      and(eq(apartments.buildingId, buildingId), isNull(apartments.deletedAt))
    );
}

/**
 * Single apartment by ID.
 */
export async function getApartmentById(id: string) {
  const [apartment] = await db
    .select()
    .from(apartments)
    .where(and(eq(apartments.id, id), isNull(apartments.deletedAt)));

  return apartment ?? null;
}

/**
 * Vacant apartments for a building — used for the owner form dropdown.
 */
export async function getVacantApartments(buildingId: string) {
  return db
    .select()
    .from(apartments)
    .where(
      and(
        eq(apartments.buildingId, buildingId),
        eq(apartments.status, "vacant"),
        isNull(apartments.deletedAt)
      )
    );
}
