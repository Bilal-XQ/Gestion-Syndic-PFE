import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { owners, users, apartments } from "@/lib/db/schema";

/**
 * All active owners for a given building — joins users + apartments.
 */
export async function getActiveOwners(buildingId: string) {
  return db
    .select({
      id: owners.id,
      userId: owners.userId,
      apartmentId: owners.apartmentId,
      ownershipDate: owners.ownershipDate,
      createdAt: owners.createdAt,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      unitNumber: apartments.unitNumber,
    })
    .from(owners)
    .innerJoin(users, eq(owners.userId, users.id))
    .innerJoin(apartments, eq(owners.apartmentId, apartments.id))
    .where(
      and(
        eq(apartments.buildingId, buildingId),
        isNull(owners.deletedAt),
        isNull(users.deletedAt)
      )
    );
}

/**
 * Single owner by ID with user and apartment info.
 */
export async function getOwnerById(id: string) {
  const [owner] = await db
    .select({
      id: owners.id,
      userId: owners.userId,
      apartmentId: owners.apartmentId,
      ownershipDate: owners.ownershipDate,
      createdAt: owners.createdAt,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      unitNumber: apartments.unitNumber,
    })
    .from(owners)
    .innerJoin(users, eq(owners.userId, users.id))
    .innerJoin(apartments, eq(owners.apartmentId, apartments.id))
    .where(and(eq(owners.id, id), isNull(owners.deletedAt)));

  return owner ?? null;
}

/**
 * Find the active owner record for a given user ID.
 * Used for proprietaire role to resolve their owner record.
 */
export async function getOwnerByUserId(userId: string) {
  const [owner] = await db
    .select({ id: owners.id, apartmentId: owners.apartmentId })
    .from(owners)
    .where(and(eq(owners.userId, userId), isNull(owners.deletedAt)));

  return owner ?? null;
}

/**
 * Fetch first and last name from public.users by auth/user ID.
 * Used by layout files to display the current user's name in the sidebar.
 */
export async function getUserNameById(
  userId: string
): Promise<{ firstName: string; lastName: string } | null> {
  try {
    const [row] = await db
      .select({ firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);

    return row ?? null;
  } catch {
    // Layouts can safely fall back to JWT metadata for display names.
    return null;
  }
}

/**
 * Check if an active owner is assigned to a given apartment.
 * Used as a guard before apartment deletion.
 */
export async function getOwnerByApartmentId(apartmentId: string) {
  const [owner] = await db
    .select({ id: owners.id })
    .from(owners)
    .where(
      and(eq(owners.apartmentId, apartmentId), isNull(owners.deletedAt))
    );

  return owner ?? null;
}
