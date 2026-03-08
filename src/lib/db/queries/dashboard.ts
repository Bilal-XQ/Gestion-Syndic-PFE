import { eq, and, isNull, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { owners, apartments, buildings, charges, payments } from "@/lib/db/schema";

export type DashboardMetrics = {
  totalOwners: number;
  totalApartments: number;
  occupiedApartments: number;
  vacantApartments: number;
  totalCharges: number;
  totalPayments: number;
};

/**
 * Aggregate metrics for the syndic dashboard overview.
 */
export async function getDashboardMetrics(
  syndicId: string
): Promise<DashboardMetrics> {
  // Get building first
  const [building] = await db
    .select({ id: buildings.id })
    .from(buildings)
    .where(and(eq(buildings.syndicId, syndicId), isNull(buildings.deletedAt)));

  if (!building) {
    return {
      totalOwners: 0,
      totalApartments: 0,
      occupiedApartments: 0,
      vacantApartments: 0,
      totalCharges: 0,
      totalPayments: 0,
    };
  }

  // Run all counts in parallel
  const [
    ownersResult,
    apartmentsResult,
    occupiedResult,
    vacantResult,
    chargesResult,
    paymentsResult,
  ] = await Promise.all([
      db
        .select({ count: count() })
        .from(owners)
        .innerJoin(apartments, eq(owners.apartmentId, apartments.id))
        .where(
          and(
            eq(apartments.buildingId, building.id),
            isNull(owners.deletedAt)
          )
        ),
      db
        .select({ count: count() })
        .from(apartments)
        .where(
          and(
            eq(apartments.buildingId, building.id),
            isNull(apartments.deletedAt)
          )
        ),
      db
        .select({ count: count() })
        .from(apartments)
        .where(
          and(
            eq(apartments.buildingId, building.id),
            eq(apartments.status, "occupied"),
            isNull(apartments.deletedAt)
          )
        ),
      db
        .select({ count: count() })
        .from(apartments)
        .where(
          and(
            eq(apartments.buildingId, building.id),
            eq(apartments.status, "vacant"),
            isNull(apartments.deletedAt)
          )
        ),
      db
        .select({ count: count() })
        .from(charges)
        .where(
          and(
            eq(charges.syndicId, syndicId),
            isNull(charges.deletedAt)
          )
        ),
      db
        .select({ count: count() })
        .from(payments)
        .innerJoin(charges, eq(payments.chargeId, charges.id))
        .where(eq(charges.syndicId, syndicId)),
    ]);

  return {
    totalOwners: ownersResult[0].count,
    totalApartments: apartmentsResult[0].count,
    occupiedApartments: occupiedResult[0].count,
    vacantApartments: vacantResult[0].count,
    totalCharges: chargesResult[0].count,
    totalPayments: paymentsResult[0].count,
  };
}
