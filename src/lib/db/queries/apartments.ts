import { eq, and, isNull, sql, getTableColumns, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { apartments, buildings, owners, users, charges } from "@/lib/db/schema";
import type { ApartmentEnriched } from "@/types";

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

/**
 * Enriched apartments for a syndic's building.
 * Includes current owner info (if any) and derived active charges total.
 */
export async function getApartmentsEnriched(
  syndicId: string
): Promise<ApartmentEnriched[]> {
  try {
    const rows = await db
      .select({
        ...getTableColumns(apartments),
        ownerFirstName: users.firstName,
        ownerLastName: users.lastName,
        ownerEmail: users.email,
        ownerPhone: users.phone,
        ownerId: owners.id,
        totalActiveCharges: sql<string>`
          COALESCE((
            SELECT SUM(c.total_amount)::text
            FROM charges c
            WHERE c.apartment_id = ${apartments.id}
              AND c.deleted_at IS NULL
          ), '0')
        `,
      })
      .from(apartments)
      .innerJoin(buildings, eq(apartments.buildingId, buildings.id))
      .leftJoin(
        owners,
        and(eq(owners.apartmentId, apartments.id), isNull(owners.deletedAt))
      )
      .leftJoin(
        users,
        and(eq(users.id, owners.userId), isNull(users.deletedAt))
      )
      .where(
        and(eq(buildings.syndicId, syndicId), isNull(apartments.deletedAt))
      )
      .orderBy(asc(apartments.unitNumber));

    return rows.map((row) => ({
      id: row.id,
      unitNumber: row.unitNumber,
      floor: row.floor,
      surfaceArea: row.surfaceArea,
      roomCount: row.roomCount,
      type: row.type as ApartmentEnriched["type"],
      status: row.status as "occupied" | "vacant",
      createdAt: row.createdAt,
      ownerName:
        row.ownerFirstName && row.ownerLastName
          ? `${row.ownerFirstName} ${row.ownerLastName}`
          : null,
      ownerEmail: row.ownerEmail ?? null,
      ownerPhone: row.ownerPhone ?? null,
      ownerId: row.ownerId ?? null,
      totalActiveCharges: row.totalActiveCharges,
    }));
  } catch (error) {
    console.error(
      "[getApartmentsEnriched] Enriched query failed, falling back:",
      error
    );

    const basic = await db
      .select({
        id: apartments.id,
        unitNumber: apartments.unitNumber,
        floor: apartments.floor,
        surfaceArea: apartments.surfaceArea,
        roomCount: apartments.roomCount,
        status: apartments.status,
        createdAt: apartments.createdAt,
      })
      .from(apartments)
      .innerJoin(buildings, eq(apartments.buildingId, buildings.id))
      .where(
        and(eq(buildings.syndicId, syndicId), isNull(apartments.deletedAt))
      )
      .orderBy(asc(apartments.unitNumber));

    return basic.map((row) => ({
      id: row.id,
      unitNumber: row.unitNumber,
      floor: row.floor,
      surfaceArea: row.surfaceArea,
      roomCount: row.roomCount,
      type: "t2",
      status: row.status as "occupied" | "vacant",
      createdAt: row.createdAt,
      ownerName: null,
      ownerEmail: null,
      ownerPhone: null,
      ownerId: null,
      totalActiveCharges: "0",
    }));
  }
}

/**
 * Single enriched apartment scoped to syndic.
 */
export async function getApartmentEnrichedById(
  syndicId: string,
  apartmentId: string
): Promise<ApartmentEnriched | null> {
  const [row] = await db
    .select({
      ...getTableColumns(apartments),
      ownerFirstName: users.firstName,
      ownerLastName: users.lastName,
      ownerEmail: users.email,
      ownerPhone: users.phone,
      ownerId: owners.id,
      totalActiveCharges: sql<string>`
        COALESCE((
          SELECT SUM(c.total_amount)::text
          FROM charges c
          WHERE c.apartment_id = ${apartments.id}
            AND c.deleted_at IS NULL
        ), '0')
      `,
    })
    .from(apartments)
    .innerJoin(buildings, eq(apartments.buildingId, buildings.id))
    .leftJoin(
      owners,
      and(eq(owners.apartmentId, apartments.id), isNull(owners.deletedAt))
    )
    .leftJoin(
      users,
      and(eq(users.id, owners.userId), isNull(users.deletedAt))
    )
    .where(
      and(
        eq(buildings.syndicId, syndicId),
        eq(apartments.id, apartmentId),
        isNull(apartments.deletedAt)
      )
    );

  if (!row) return null;

  return {
    id: row.id,
    unitNumber: row.unitNumber,
    floor: row.floor,
    surfaceArea: row.surfaceArea,
    roomCount: row.roomCount,
    type: row.type as ApartmentEnriched["type"],
    status: row.status as "occupied" | "vacant",
    createdAt: row.createdAt,
    ownerName:
      row.ownerFirstName && row.ownerLastName
        ? `${row.ownerFirstName} ${row.ownerLastName}`
        : null,
    ownerEmail: row.ownerEmail ?? null,
    ownerPhone: row.ownerPhone ?? null,
    ownerId: row.ownerId ?? null,
    totalActiveCharges: row.totalActiveCharges,
  };
}
