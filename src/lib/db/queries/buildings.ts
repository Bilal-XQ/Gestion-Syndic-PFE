import { eq, isNull, and, getTableColumns, sql, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { apartments, buildings } from "@/lib/db/schema";

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

/**
 * Get all buildings for a syndic with apartment stats.
 */
export async function getAllBuildingsBySyndicId(syndicId: string) {
  const rows = await db
    .select({
      ...getTableColumns(buildings),
      apartmentCount: sql<number>`
        COUNT(DISTINCT ${apartments.id})
        FILTER (WHERE ${apartments.deletedAt} IS NULL)
      `,
      occupiedCount: sql<number>`
        COUNT(DISTINCT ${apartments.id})
        FILTER (
          WHERE ${apartments.deletedAt} IS NULL
            AND ${apartments.status} = 'occupied'
        )
      `,
    })
    .from(buildings)
    .leftJoin(apartments, eq(apartments.buildingId, buildings.id))
    .where(and(eq(buildings.syndicId, syndicId), isNull(buildings.deletedAt)))
    .groupBy(buildings.id)
    .orderBy(asc(buildings.name));

  return rows;
}

export async function getBuildingsBySyndicId(syndicId: string) {
  return db
    .select({
      id: buildings.id,
      name: buildings.name,
      address: buildings.address,
      totalTantiemes: buildings.totalTantiemes,
    })
    .from(buildings)
    .where(and(eq(buildings.syndicId, syndicId), isNull(buildings.deletedAt)))
    .orderBy(asc(buildings.name));
}

export type BuildingWithStats = Awaited<
  ReturnType<typeof getAllBuildingsBySyndicId>
>[number];
