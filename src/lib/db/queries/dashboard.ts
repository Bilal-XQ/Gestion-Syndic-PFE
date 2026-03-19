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
        .innerJoin(buildings, eq(apartments.buildingId, buildings.id))
        .where(
          and(
            isNull(owners.deletedAt),
            isNull(apartments.deletedAt),
            isNull(buildings.deletedAt),
            eq(buildings.syndicId, syndicId)
          )
        ),
      db
        .select({ count: count() })
        .from(apartments)
        .innerJoin(buildings, eq(apartments.buildingId, buildings.id))
        .where(
          and(
            isNull(apartments.deletedAt),
            isNull(buildings.deletedAt),
            eq(buildings.syndicId, syndicId)
          )
        ),
      db
        .select({ count: count() })
        .from(apartments)
        .innerJoin(buildings, eq(apartments.buildingId, buildings.id))
        .where(
          and(
            eq(apartments.status, "occupied"),
            isNull(apartments.deletedAt),
            isNull(buildings.deletedAt),
            eq(buildings.syndicId, syndicId)
          )
        ),
      db
        .select({ count: count() })
        .from(apartments)
        .innerJoin(buildings, eq(apartments.buildingId, buildings.id))
        .where(
          and(
            eq(apartments.status, "vacant"),
            isNull(apartments.deletedAt),
            isNull(buildings.deletedAt),
            eq(buildings.syndicId, syndicId)
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
        .where(and(eq(charges.syndicId, syndicId), isNull(charges.deletedAt))),
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
